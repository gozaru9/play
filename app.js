/**
 * Module dependencies.
 */
var express = require('express');
//var partials = require('express-partials');
var http = require('http');
var path = require('path');
var app = express();
var Session = express.session.Session;

//各画面の定義
var routes = require('./routes');
var dashboard = require('./routes/dashboard');
var account = require('./routes/account');
var tags = require('./routes/tags');
var code = require('./routes/code');
var todo = require('./routes/todo');
var chat = require("./routes/chat");
var login = require("./routes/login");
var incidnt = require("./routes/incidnt");
//DB
var mongoose = require('mongoose');
var configDB = require('./config/database.js');
var db = mongoose.connect(configDB.url);

//セッション管理
var MongoStore = require('connect-mongo')(express);

//oauth認証
/*
var flash = require("connect-flash")
  , passport = require("passport");
*/

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('secretKey', configDB.secret);
app.set('cookieSessionKey', 'sid');

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser(app.get('secretKey')));
var sessionStore = new MongoStore({
        mongoose_connection : db.connections[0],
        clear_interval: 60 * 60 // Interval in seconds to clear expired sessions. 60 * 60 = 1 hour
    });
app.use(express.session({
    //cookieにexpressのsessionIDを保存する際のキーを設定
    key : app.get('cookieSessionKey'),
    secret: configDB.secret,
    store: sessionStore,
    cookie: {
        httpOnly: false,
        // 60 * 60 * 1000 = 3600000 msec = 1 hour
        maxAge: new Date(Date.now() + 60 * 60 * 1000)
    }
}));
/*
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
*/
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

//TOP
app.get('/', chat.index);
app.get('/dashboard', dashboard.index);
app.get('/login', login.index);
//コード
app.get('/code', code.index);
app.post('/code/regist', code.regist);
//メンバー
app.get('/account', account.index);
app.post('/account/getById', account.getById);
app.post('/account/parts', account.parts);
app.post('/account/regist', account.regist);
app.get('/account/regist', account.regist);
app.post('/account/delete', account.delete);
app.post('/account/update', account.update);
//タグ管理
app.get('/tags', tags.index);
app.post('/tags/regist', tags.create);
app.post('/tags/update', tags.update);
app.post('/tags/delete', tags.delete);
app.post('/tags/getTagsById', tags.getTagsById);
//インシデント
app.get('/incidnt', incidnt.index);
app.post('/incidnt/changeStatus', incidnt.changeStatus);

//チャット
app.post('/chat', chat.index);
app.post('/chat/login', chat.login);
app.get('/chat/logout', chat.logout);
app.get('/chat/lobby', chat.lobby);
app.get('/chat/fixedSectence', chat.fixedSectence);
app.post('/chat/create', chat.create);
app.post('/chat/getMyRoom', chat.getMyRoom);
app.post('/chat/getUserByRoomId', chat.getUserByRoomId);
app.post('/chat/memberUpdate', chat.memberUpdate);
app.post('/chat/fixedSectence/save', chat.fixedSectenceSave);
app.post('/chat/fixedSectence/update', chat.fixedSectenceUpdate);
app.post('/chat/fixedSectence/delete', chat.fixedSectenceDelete);
app.post('/chat/getFixedById', chat.getFixedById);
app.post('/chat/updateUnRead', chat.updateUnRead);
//TODO
app.get('/todo', todo.index);
app.post('/todo', todo.index);
app.post('/todo/regist', todo.regist);
app.post('/todo/delete', todo.delete);

var server = http.createServer(app).listen(app.get('port'), function(){
console.log("Express server listening on port " + app.get('port'));
});

var io=require('socket.io').listen(server);
var connect = require('connect');
io.configure(function () {
    io.set("transports", ["xhr-polling"]); 
    io.set("polling duration", 10);
    io.set('authorization', function (handshakeData, callback) {
        if(handshakeData.headers.cookie) {

            var cookie = require('cookie').parse(decodeURIComponent(handshakeData.headers.cookie));
            //cookie中の署名済みの値を元に戻す
            cookie = connect.utils.parseSignedCookies(cookie, app.get('secretKey'));
            console.log('-------cookie----------');
            console.log(cookie);
            //cookieからexpressのセッションIDを取得する
            var sessionID = cookie[app.get('cookieSessionKey')];
            sessionStore.get(sessionID, function(err, session) {
                if (err) {
                    //セッションが取得できなかったら
                    console.dir(err);
                    callback(err.message, false);
                } else if (!session) {
                    
                    console.log('session not found');
                    callback('session not found', false);
                    
                } else {
                    
                    console.log("authorization success");
                    // socket.ioからもセッションを参照できるようにする
                    handshakeData.cookie = cookie;
                    handshakeData.sessionID = sessionID;
                    handshakeData.sessionStore = sessionStore;
                    handshakeData.session = new Session(handshakeData, session);
//                    callback(null, true);
                }
            });

        } else {
            
          return callback('Cookie が見つかりませんでした', false);
        }
        // 認証 OK
        callback(null, true);
    });
});

var chatModel = require('./model/chatModel');
var userModel = require('./model/userModel');
var Chat = new chatModel();
var User = new userModel();
var moment = require('moment');
var chatRoom = io.sockets.on('connection', function (socket) {
    
    console.log('sessionID ', socket.handshake.sessionID);
    //ユーザーとsocketを紐づけておく
    User.updateSocketId(socket.handshake.session._id, socket.id);
    //Expressのセッションを定期的に更新する
    var sessionReloadIntervalID = setInterval(function() {
        socket.handshake.session.reload(function() {
            socket.handshake.session.touch().save();
            
        });
    }, 60 * 2 * 1000);
    //ログイン通知
    socket.on('login notice', function() {
        if (socket.handshake.session.loginNotice) {
            //全ユーザーにログインしたことを通知
            var targetUser = socket.handshake.session._id;
            var data = {
                statusValue: 'fa fa-check-circle fa-fw',
                target: targetUser,
                name: socket.handshake.session.name
            };
            socket.broadcast.emit('login push', data);
        }
    });
    //対象の部屋とのコネクション接続
    socket.on('join room', function(roomId) {
        
        socket.join(roomId);
    });
    //個別メッセージ
    socket.on('individual send', function (data) {
        
        //io.sockets.manager.roomClients[socket.id]
        data.userId=socket.handshake.session._id;
        data.userName=socket.handshake.session.name;
        data.time=moment().format('YYYY-MM-DD HH:mm:ss');
        
        User.getById(data.target, function(err, user) {
            
            data.targetId = user._id;
            data.targetName = user.name;
            
            var individualData 
                = {sender:data.userId, recipient: user._id,
                   messages: data.message, time: data.time};
            Chat.addMyMessage(individualData);
            
            io.sockets.socket(user.socketId).emit('individual push', data);
            socket.emit('individual my push', data);
        });
    });
    //部屋メッセージ
    socket.on('msg send', function (data) {
        
        data.userId=socket.handshake.session._id;
        data.userName=socket.handshake.session.name;
        data.time=moment().format('YYYY-MM-DD HH:mm:ss');
        chatRoom.in(data.roomId).emit('msg push', data);
        socket.broadcast.emit('msg push lobby', data);
        if ((data.tag.length !== 0)) {
            socket.broadcast.emit('incident push', '');
            socket.emit('incident push', '');
        }
        Chat.addMessage(data);
    });
    //全体メッセージ
    socket.on('all send', function (msg) {

        //イベントを実行した方に実行する
        socket.emit('all push', msg);
        //イベントを実行した方以外に実行する
        socket.broadcast.emit('all push', msg);
    });
    //ステータス変更
    socket.on('status change', function (values) {
        
        var msg = '';
        var value = 0;
        if (values.status == 'status1') {
            msg = 'fa fa-check-circle fa-fw';
            value = 1;
        } else if (values.status  == 'status2') {
            msg = 'fa fa-times fa-fw';
            value = 2;
        } else if (values.status  == 'status3') {
            msg = 'fa fa-clock-o fa-fw';
            value = 3;
        } else if (values.status  == 'status4') {
            msg = 'fa fa-sign-out fa-fw';
            value = 4;
        }
        
        User.updateStatus(socket.handshake.session._id, value);

        var targetUser = socket.handshake.session._id;
        var data = {
            statusValue: msg,
            target: targetUser,
            sendLogin:false
        };
        
        //イベントを実行した方に実行する
        socket.emit('status changed', data);
        //イベントを実行した方以外に実行する
        socket.broadcast.emit('status changed', data);
    });
    //過去のメッセージを取得
    socket.on('get beforeday', function(data) {
        
        Chat.getMessageById(data, function(err, roomInfo) {
            var push = {roomId: data.roomId, messages: roomInfo.messages};
            socket.emit('beforeday push', push);
        });
    });
    //部屋作成時の通知
    socket.on('create chat', function(chat) {
        
        console.log('create chat----------------------');
        var memberLen = chat.users.length;
        for (var i=0; i < memberLen; i++) {
            User.getById(chat.users[i]._id, function(err, user) {
                if (err) console.log('create room message err:'+err);
                if (user) {
                    console.log(user);
                    //コメクションが確立しているかつ自分自身以外のユーザーに送信
                    if (user.socketId !== '' && user.socketId !== socket.id)  {
                        io.sockets.socket(user.socketId).emit('create chat msg', chat.name);
                        io.sockets.socket(user.socketId).emit('create chat msg lobby', chat.name);
                    }
                    if (user.socketId === socket.id) {
                        io.sockets.socket(user.socketId).emit('create chat complete', '');
                        io.sockets.socket(user.socketId).emit('create chat complate lobby', '');
                    }
                } else {
                    console.log('create room message target user is not found');
                }
            });
        }
    });
    //メンバー変更時の通知
    socket.on('member edit', function(data) {
        //追加/削除されたメンバーにのみ通知する
        chat.memberUpdateBySocket(data, function(err, target) {
            
            var sendData= {roomId: data.roomId, roomName:target.roomName};
            //削除通知を行う
            for (var delKey in target.deleteUsers) {
                
                io.sockets.socket(target.deleteUsers[delKey].socketId).emit('member delete', sendData);
                io.sockets.socket(target.deleteUsers[delKey].socketId).emit('member delete lobby', sendData);
            }
            //追加通知を行う
            for (var addKey in target.addUsers) {
                
                io.sockets.socket(target.addUsers[addKey].socketId).emit('member add', sendData);
                io.sockets.socket(target.addUsers[addKey].socketId).emit('member add lobby', sendData);
            }
            //
            var roomSendData = {roomId: data.roomId, roomName: target.roomName, users: data.users};
            chatRoom.in(data.roomId).emit('member edit complete', roomSendData);
        });
    });
    //部屋とのコネクションを切る
    socket.on('leave room', function(roomId) {
        
        console.log('leave room');
        socket.leave(roomId);
    });
    socket.on('incident status change', function(data) {
        
        console.log('incident status change');
        console.log(data);
        var deforeStatusId = '';
        switch (data.before) {
            case 'open':
                deforeStatusId = 'incOpen';
                break;
            case 'in progress':
                deforeStatusId = 'incProg';
                break;
            case 'close':
                deforeStatusId = 'incClose';
                break;
            case 'remove':
                deforeStatusId = 'incRemove';
                break;
            default:
                break;
        }
        var afterStatusId = '';
        switch (Number(data.status)) {
            case 1:
                afterStatusId = 'incOpen';
                break;
            case 2:
                afterStatusId = 'incProg';
                break;
            case 3:
                afterStatusId = 'incClose';
                break;
            case 9:
                afterStatusId = 'incRemove';
                break;
            default:
                break;
        }
        
        var change = {before: deforeStatusId, after:afterStatusId};
        socket.broadcast.emit('incident status changed', change);
    });
    //ログアウト/ブラウザクローズ
    socket.on('logout unload', function(){
        User.logout(socket.handshake.session._id);
        var targetUser = socket.handshake.session._id;
        var data = {
            statusValue: 'fa fa-sign-out fa-fw',
            target: targetUser
        };
        socket.broadcast.emit('status changed', data);
    });
    //接続が解除された時に実行する
    socket.on('disconnect', function() {
        clearInterval(sessionReloadIntervalID);
    });
});

//catchされなかった例外の処理設定。
process.on('uncaughtException', function (err) {
    console.log('uncaughtException => ' + err);
});