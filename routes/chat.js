var async = require('async');
var userModel = require('../model/userModel');
var model = new userModel();
var chatModel = require('../model/chatModel');
var chat = new chatModel();

/**
 * ログイン
 * 
 * @author niikawa
 * */
exports.login = function(req, res){
    
    async.waterfall(
        [function (callback) {
            model.login(req.body.mailAddress, req.body.password, callback);
        }]
        ,function(err, results) {
            if (err) {
                res.render('/login', {title: 'LOGIN', errMsg:'ごらぁぁぁ'});
            }
            console.log('-----------login------');
            console.log(results);

            if (results.length === 0) {
                res.redirect('/login');
            }
            req.session._id = results[0]._id;
            req.session.name = results[0].name;
            req.session.isLogin = true;
            console.log('login session');
            console.log(req.session);
            res.redirect('/chat/lobby');
        });
};
/**
 * ログアウト
 * 
 * @author niikawa
 * */
exports.logout = function(req, res){

    model.updateStatus(req.session._id, 4);
    req.session.destroy();
    res.redirect('/login');
};
/**
 * chat描画
 * 
 * @author niikawa
 * */
exports.index = function(req, res){

    console.log('session');
    console.log(req.session);
    if (req.session.isLogin) {
        
        async.parallel(
            [function (callback) {
                chat.getMyRoom(req, callback);
            },function (callback) {
                model.getAll(req, callback);
            }]
            ,function(err, results) {
                
                console.log('-----------async end function-------------');
                console.log(results[0]);
                var rooms = results[0];
                var name = '';
                var users=[];
                var messages=[];
                if(req.query.room) {
                    var roomLength = rooms.length;
                    for(var i=0; i<roomLength; i++) {
                        if (rooms[i]._id == req.query.room) {

                            console.log('-------target room----------');
                            console.log(rooms[i]);
                            
                            name = rooms[i].name;
                            users = rooms[i].users;
                            messages = rooms[i].messages;
                            break;
                        }
                    }
                }
                var allUsers = results[1];
                var allUsersNum = allUsers.length;
                for (var allUserIndex = 0; allUserIndex < allUsersNum; allUserIndex++) {
                    allUsers[allUserIndex].status = getStatusClass(allUsers[allUserIndex].loginStatus)
                }
                res.render('chat/index', {title: 'chat', userName:req.session.name, 
                    rooms:rooms, targetRoomId:req.query.room, roomName:name, users:users, 
                    messages:messages, allUsers:allUsers});
            });

    } else {
        
        res.render('login/index', {title: 'LOGIN', errMsg:''});
    }
};
/**
 * lobby画面描画
 * 
 * @author niikawa
 * */
exports.lobby = function(req, res){
    
    async.parallel(
        [function (callback) {
            
            chat.getMyRoom(req, callback);
        }]
        ,function(err, results) {
            
            console.log('----------lobby------');
            console.log(results[0]);
            /*
            var allUsers = results[1];
            var allUsersNum = allUsers.length;
            for (var allUserIndex = 0; allUserIndex < allUsersNum; allUserIndex++) {
                allUsers[allUserIndex].status = getStatusClass(allUsers[allUserIndex].loginStatus);
            }
            */
            res.render('chat/lobby', {title: 'LOBBY', userName:req.session.name, rooms:results[0]});
        });
};
/**
 * 部屋作成
 * 
 * @author niikawa
 * */
exports.create = function(req, res){
    chat.setNextParam([res,req]);
    chat.setNextFunc(
        function(parameter){
            parameter[0].send({msg:'ok!'});
        }
    );
    chat.save(req);
};
/**
 * ユーザーの入れる部屋取得
 * 
 * @author niikawa
 * */
exports.getMyRoom = function(req, res) {
    
    chat.setNextParam([res,req]);
    chat.setNextFunc(
        function(parameter, room){
            parameter[0].send({rooms:room});
        }
    );
    chat.getMyRoomParts(req);
};
/**
 * 部屋に設定されたユーザーを取得(ajax版)
 * 
 * @author niikawa
 * */
exports.getUserByRoomId = function(req, res) {
    
    console.log('-----------getUserByRoomId-------------');
    console.log(req.body);
    
    if (req.body.roomId) {

        async.parallel(
            [function (callback) {
//                chat.getMessageById(req.body, callback);
                chat.getById(req.body.roomId, callback);
            },function (callback) {
                model.getAll(req, callback);
            }]
            ,function(err, results) {
                
                console.log(results);
                var room = results[0];
                var allUsers = results[1];
    
                if (!room) {
                    console.log(' room is not found:'+req.body.roomId);
                }
                
                var roomUserNum = room.users.length;
                var allUsersNum = allUsers.length;
                for (var roomMemberIndex = 0; roomMemberIndex < roomUserNum; roomMemberIndex++)  {
                    
                    for (var allUserIndex = 0; allUserIndex < allUsersNum; allUserIndex++) {
                        
                        if (room.users[roomMemberIndex]._id == allUsers[allUserIndex]._id) {
                            
                            room.users[roomMemberIndex].status
                                = getStatusClass(allUsers[allUserIndex].loginStatus);
                            break;
                        }
                    }
                }
                    console.log(room.users);
                
                res.send({users:room.users, messages:room.messages, allUsers:allUsers});
            });
    
    }else{
        res.send({users : ''});
    }
};
function getStatusClass (val ) {
    
    var classVal = '';
    if (val == 1) {
        return 'fa fa-check-circle fa-fw';
    } else if (val == 2) {
        
        return 'fa fa-times fa-fw';
    } else if (val == 3) {

        return 'fa fa-clock-o fa-fw';
    } else if (val == 4) {

        return 'fa fa-sign-out fa-fw';
    } 
    //不明の場合はreturn home
    return 'fa fa-sign-out fa-fw';
}
exports.memberUpdate = function(req, res) {
    
    if (req.body.roomId) {

        async.parallel(
            [function (callback) {
                chat.memberUpdate(req.body, callback);
            }]
            ,function(err, results) {
                
                console.log('');
                res.send({users : ''});
            });
    
    }else{
        res.send({users : ''});
    }
};
/**
 * メッセージ追加
 * 
 * @author niikawa
 * */
exports.addMessage = function(req, res) {
    
};