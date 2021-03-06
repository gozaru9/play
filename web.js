//------------------heroku用-----------------

/**
 * Module dependencies.
 */
var express = require('express');
var partials = require('express-partials');
var http = require('http');
var path = require('path');
var app = express();
var Session = express.session.Session;
var fs = require("fs"); // ファイルの読書き

//各画面の定義
var routes = require('./routes');
var dashboard = require('./routes/dashboard');
var account = require('./routes/account');
var task = require('./routes/task');
var code = require('./routes/code');
var todo = require('./routes/todo');
var chat = require("./routes/chat");
var login = require("./routes/login");

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
app.use(partials());

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

//TOP
app.get('/', routes.index);
app.get('/dashboard', dashboard.index);
app.get('/login', login.index);

//メンバー
app.get('/account', account.index);
app.post('/account/parts', account.parts);
app.post('/account/regist', account.regist);
app.get('/account/regist', account.regist);
app.post('/account/login', account.login);
app.post('/account/delete', account.delete);
app.post('/account/update', account.update);
//タスク
app.get('/task', task.index);
app.get('/task/regist', task.regist);
app.post('/task/update', task.update);
app.post('/task/delete', task.delete);
//TODO
app.get('/todo', todo.index);
app.post('/todo', todo.index);
app.post('/todo/regist', todo.regist);
app.post('/todo/delete', todo.delete);

//コード
app.get('/code', code.index);
app.post('/code/regist', code.regist);

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

var server = http.createServer(app).listen(app.get('port'), function(){
console.log("Express server listening on port " + app.get('port'));
});

var io=require('socket.io').listen(server);
var connect = require('connect');
io.configure(function () {
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
//io.of('/chat').on
var chatRoom = io.sockets.on('connection', function (socket) {
    
    console.log('sessionID ', socket.handshake.sessionID);
    //ユーザーとsocketを紐づけておく
    User.updateSoketId(socket.handshake.session._id, socket.id);
    
    //Expressのセッションを定期的に更新する
    var sessionReloadIntervalID = setInterval(function() {
        socket.handshake.session.reload(function() {
            socket.handshake.session.touch().save();
        });
    }, 60 * 2 * 1000);

    //クライアント側からのイベントを受け取る。
    socket.on('individual send', function (data) {
        
        console.log('individual send!!');
        console.log(data);
        //io.sockets.manager.roomClients[socket.id]
        data.userId=socket.handshake.session._id;
        data.userName=socket.handshake.session.name;
        data.time=moment().format('YYYY-MM-DD hh:mm:ss');
        
        User.getById(data.target, function(err, user) {
            
            console.log('get user');
            console.log(user);
            data.targetId = user._id;
            data.targetName = user.name;
            
            var individualData 
                = {sender:data.userId, recipient: user._id,
                   messages: data.message, time: data.time};
            Chat.addMyMessage(individualData);
            
            io.sockets.socket(user.soketId).emit('individual push', data);
            socket.emit('individual my push', data);
        });
    });
    
    socket.on('msg send', function (data) {
        
        //io.sockets.manager.roomClients[socket.id]
        data.userId=socket.handshake.session._id;
        data.userName=socket.handshake.session.name;
        data.time=moment().format('YYYY-MM-DD hh:mm:ss');
        chatRoom.in(data.roomId).emit('msg push', data, function(data) {
            
            console.log('---------------------------------');
            console.log(data);
        });
        
//        console.log(io.sockets.clients(data.roomId));
        
        Chat.addMessage(data);
        
    });
    socket.on('all send', function (msg) {

        //イベントを実行した方に実行する
        socket.emit('all push', msg);
        //イベントを実行した方以外に実行する
        socket.broadcast.emit('all push', msg);
    });
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
            status: values.status,
            statusValue: msg,
            target: targetUser
        };
        
        //イベントを実行した方に実行する
        socket.emit('status changed', data);
        //イベントを実行した方以外に実行する
        socket.broadcast.emit('status changed', data);
    });
    
    socket.on('join room', function(roomId) {
        
        socket.join(roomId);
    });
    
    socket.on('create chat', function(chat) {
        
        console.log('create chat');
        var memberLen = chat.users.length;

        for (var i=0; i < memberLen; i++) {
            User.getById(chat.users[i]._id, function(err, user) {
                console.log('callback get by id');
                if (err) console.log('create room message err:'+err);
                if (user) {
                    console.log(user);
                    //コメクションが確立しているかつ自分自身以外のユーザーに送信
                    if (user.soketId !== '' && user.soketId !== socket.id)  {
                        io.sockets.socket(user.soketId).emit('create chat msg', chat.name);
                    }
                    if (user.soketId === socket.id) {
                        io.sockets.socket(user.soketId).emit('create chat complete', '');
                    }
                } else {
                    console.log('create room message target user is not found');
                }
            });
        }
    });
    
    socket.on('leave room', function(roomId) {
        
        console.log('leave room');
        console.log(roomId);
        socket.leave(roomId);
    });
    //接続が解除された時に実行する
    socket.on('disconnect', function() {
        clearInterval(sessionReloadIntervalID);
        User.updateStatus(socket.handshake.session._id, 4);
        console.log('disconnected');
    });
});

//catchされなかった例外の処理設定。
process.on('uncaughtException', function (err) {
    console.log('uncaughtException => ' + err);
});