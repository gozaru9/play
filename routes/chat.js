var async = require('async');
var moment =require('moment');
var userModel = require('../model/userModel');
var model = new userModel();
var chatModel = require('../model/chatModel');
var chat = new chatModel();
var fixedModel = require('../model/fixedModel');
var fixed = new fixedModel();
var unReadModel = require('../model/unReadModel');
var unRead = new unReadModel();

/**
 * chat modeule
 * @namespace routes
 * @modeule chat.js
 */
/**
 * リクエストを受け取り、chat画面を描画する
 * 
 * @author niikawa
 * @method index
 * @param {Object} req 画面からのリクエスト
 * @param {Object} res 画面へのレスポンス
 */
exports.index = function(req, res){

    console.log('session');
    console.log(req.session);
    console.log('----------------chat index--------------');
    if (req.session.isLogin) {
        
        async.series(
            [function (callback) {
                fixed.getMySectence(req.session._id, callback);
            },function (callback) {
                fixed.getSectence(callback);
            },function (callback) {
                chat.getMyRoom(req, callback);
            },function(callback) {
                model.getAll(req, callback);
            }]
            ,function(err, results) {
                
                console.log('-----------async end function-------------');
                var rooms = results[2];
                var allUsers = results[3];
                unRead.getUnReadByUserId(req.session._id, function(err, target) {
                    var name = '';
                    var users=[];
                    var messages=[];
                    
                    setUnReadNum(rooms, target, req.session.beforeLogoutTime);
                    
                    if(req.body.room) {
                        var roomLength = Array.isArray(rooms) ? rooms.length : 0;
                        for(var i=0; i<roomLength; i++) {
                            if (rooms[i]._id == req.body.room) {
    
                                console.log('-------target room----------');
                                console.log(rooms[i]._id);
                                name = rooms[i].name;
                                users = rooms[i].users;
                                messages = rooms[i].messages;
                                break;
                            }
                        }
                    }
                    
                    var allUsersNum = Array.isArray(allUsers) ? allUsers.length : 0;
                    for (var allUserIndex = 0; allUserIndex < allUsersNum; allUserIndex++) {
                        allUsers[allUserIndex].status = getStatusClass(allUsers[allUserIndex].loginStatus);
                    }
                    
                    var fixed = results[0].concat(results[1]);
                    
                    res.render('chat/index', {title: 'chat', userName:req.session.name, _id:req.session._id,
                        rooms:rooms, targetRoomId:req.body.room, roomName:name, users:users, 
                        messages:messages, allUsers:allUsers, fixed:fixed});
                });
            });

    } else {
        
        res.render('login/index', {title: 'LOGIN', errMsg:''});
    }
};
/**
 * リクエストを受け取り、lobby画面を描画する
 * 
 * @author niikawa
 * @method lobby
 * @param {Object} req 画面からのリクエスト
 * @param {Object} res 画面へのレスポンス
 */
exports.lobby = function(req, res){

    if (req.session.isLogin) {
        //ログイン通知をするかの条件を設定
        if (req.query.notice !== undefined) {
            req.session.loginNotice = false;
        }
        async.series(
            [function (callback) {
                chat.getMyRoom(req, callback);
            },function (callback) {
                model.getAll(req, callback);
            },function(callback) {
                unRead.getUnReadByUserId(req.session._id, callback);
            }]
            ,function(err, results) {
                
                unRead.getUnReadByUserId(req.session._id, function(err, target) {
                    
                    var rooms = results[0];
                    setUnReadNum(rooms, target, req.session.beforeLogoutTime);
                    var allUsers = results[1];
                    var allUsersNum = allUsers.length;
                    for (var allUserIndex = 0; allUserIndex < allUsersNum; allUserIndex++) {
                        allUsers[allUserIndex].status = getStatusClass(allUsers[allUserIndex].loginStatus);
                    }
                    res.render('chat/lobby', 
                        {title: 'LOBBY', userName: req.session.name,
                            _id:req.session._id, rooms:rooms, allUsers: allUsers});
                });
        });
    } else {
        console.log('lobby session isLogin false');
        console.log(req.session);
        res.render('login/index', {title: 'LOGIN', errMsg:''});
    }
};
/**
 * リクエストを受け取り、fixedSectence画面を描画する
 * 
 * @author niikawa
 * @method fixedSectence
 * @param {Object} req 画面からのリクエスト
 * @param {Object} res 画面へのレスポンス
 */
exports.fixedSectence = function(req, res){
    if (req.session.isLogin) {
        
        async.parallel(
            [function (callback) {
                
                fixed.getSectence(callback);
                
            },function (callback) {
                fixed.getMySectence(req.session._id, callback);
            }]
            ,function(err, results) {
                
                console.log(err);
                if (err) throw err;
                res.render('chat/fixedSectence', 
                    {title: 'fixedSectence', userName:req.session.name, 
                    _id:req.session._id, mineFixed:results[1], openFixed:results[0]});
            });
        
    } else {
        res.render('login', {title: 'LOGIN', errMsg:''});
    }
};
/**
 * リクエストを受け取り、ログインを行う.
 * 
 * @author niikawa
 * @method login
 * @param {Object} req 画面からのリクエスト
 * @param {Object} res 画面へのレスポンス
 */
exports.login = function(req, res){
    
    model.login(req.body.mailAddress, req.body.password, 
        function(err, results) {
            if (err) {
                res.render('/login', {title: 'LOGIN', errMsg:'ごらぁぁぁ'});
            }
            console.log('-----------login------');
            console.log(results[0]);

            if (results.length === 0) {
                res.redirect('/login');
            }
            
            req.session._id = results[0]._id;
            req.session.name = results[0].name;
            req.session.isLogin = true;
            req.session.loginNotice = true;
            req.session.beforeLogoutTime = results[0].logoutTime;
            model.updateStatus(req.session._id, 1);
            res.redirect('/chat/lobby');
        });
};
/**
 * リクエストを受け取り、ログアウトを行い、ログイン状態をReturn Home にする.
 * 
 * @author logout
 * @method login
 * @param {Object} req 画面からのリクエスト
 * @param {Object} res 画面へのレスポンス
 */
exports.logout = function(req, res){

    model.logout(req.session._id);
    req.session.destroy();
    res.redirect('/login');
};
/**
 * リクエストを受け取り、リクエストから部屋を作成する
 * 
 * @author niikawa
 * @method lobby
 * @param {Object} req 画面からのリクエスト
 * @param {Object} res 画面へのレスポンス
 */
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
 * リクエストを受け取り、ユーザーの入れる部屋を取得する
 * 
 * @author niikawa
 * @method getMyRoom
 * @param {Object} req 画面からのリクエスト
 * @param {Object} res 画面へのレスポンス
 */
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
 * リクエストを受け取り、ユーザーの入れる部屋を取得する(ajax版)
 * 
 * @author niikawa
 * @method getMyRoom
 * @param {Object} req 画面からのリクエスト
 * @param {Object} res 画面へのレスポンス
 */
exports.getUserByRoomId = function(req, res) {
    
    console.log('-----------getUserByRoomId-------------');
    if (req.body.roomId) {

        async.series(
            [function (callback) {
                chat.getById(req.body.roomId, callback);
            },function (callback) {
                model.getAll(req, callback);
            }]
            ,function(err, results) {
                
                console.log(results[0]);
                var room = results[0];
                var allUsers = results[1];
    
                if (!room) {
                    console.log(' room is not found:'+req.body.roomId);
                }
                
                craeteMemberStatus(room.users, allUsers);
                res.send({users:room.users, messages:room.messages
                    , allUsers:allUsers,description:room.description});
            });
    
    }else{
        res.send({users : ''});
    }
};
/**
 * リクエストを受け取り、部屋のメンバー構成を更新する(ajax版)
 * 
 * @author niikawa
 * @method memberUpdate
 * @param {Object} req 画面からのリクエスト
 * @param {Object} res 画面へのレスポンス
 */
exports.memberUpdate = function(req, res) {
    
    if (req.body.roomId) {

        async.series(
            [function(callback) {
                //差分チェックのため更新前のユーザー情報を保持する
                chat.getById(req.body.roomId, callback);
            },function (callback) {
                //メンバーの更新
                chat.memberUpdate(req.body, callback);
            },function (callback) {
                //画面表示用にステータスが必要なため全ユーザーの最新状態を取得
                model.getAll(req.body, callback);
            }]
            ,function(err, results) {
                var users = req.body.users;
                var beforeUsers = results[0];
                var allUsers = results[2];

                var userNum = users.length;
                //差分チェック用に連想配列にする
                var usersList = {};
                for (var index = 0; index < userNum; index++) {
                    usersList[users[index]._id] = users[index];
                }
                //削除されたメンバーを抽出
                var beforeNum = beforeUsers.length;
                var deleteUsers = {};
                for (index = 0; index < beforeNum; index++) {
                    if ( !(beforeUsers[index]._id in usersList) ) {
                        //deleteUsers.push(beforeUsers[index]);
                        deleteUsers[beforeUsers[index]._id] = beforeUsers[index];
                    }
                }
                //追加されたメンバーを抽出
                var beforeUsersList = {};
                for (index = 0; index < beforeNum; index++) {
                    beforeUsersList[beforeUsers[index]._id] = beforeUsers[index];
                }
                var addUsers = {};
                for (index = 0; index < userNum; index++) {
                    if ( !(users[index]._id in beforeUsersList) ) {
                        //addUsers.push(users[index]);
                        addUsers[users[index]._id] = users[index];
                    }
                }
                //socketIdを設定
                var allNum = results[2].length;
                for (index = 0; index < allNum; index++) {
                    if ( (allUsers[index]._id in deleteUsers) ) {
                        deleteUsers[allUsers[index]._id].socketId = allUsers[index].socketId;
                        
                    } else if ( (allUsers[index]._id in addUsers) ) {
                        addUsers[allUsers[index]._id].socketId = allUsers[index].socketId;
                    } 
                }
                
                //ステータスの設定
                craeteMemberStatus(users, results[2]);
                res.send({roomId: req.body.roomId, users: users, deleteUsers: deleteUsers, addUsers: addUsers});
            });
    
    }else{
        res.send({roomId: '', users: '', deleteUsers: '', addUsers: ''});
    }
};

/**
 * リクエストを受け取り、部屋のメンバー構成を更新する(socketIo版)
 * 
 * @author niikawa
 * @method memberUpdateBySocket
 * @param {Object} data 
 * @param {Function} callback 
 */
exports.memberUpdateBySocket = function(data, callback) {
    
    if (data.roomId) {

        async.series(
            [function(callback) {
                //差分チェックのため更新前のユーザー情報を保持する
                chat.getById(data.roomId, callback);
            },function (callback) {
                //メンバーの更新
                chat.memberUpdate(data, callback);
            },function (callback) {
                //画面表示用にステータスが必要なため全ユーザーの最新状態を取得
                model.getAll(data, callback);
            }]
            ,function(err, results) {
                var users = data.users;
                var beforeUsers = results[0].users;
                var allUsers = results[2];

                var userNum = users.length;
                //差分チェック用に連想配列にする
                var usersList = {};
                for (var index = 0; index < userNum; index++) {
                    usersList[users[index]._id] = users[index];
                }
                //削除されたメンバーを抽出
                var beforeNum = beforeUsers.length;
                var deleteUsers = {};
                for (index = 0; index < beforeNum; index++) {
                    if ( !(beforeUsers[index]._id in usersList) ) {
                        //deleteUsers.push(beforeUsers[index]);
                        deleteUsers[beforeUsers[index]._id] = beforeUsers[index];
                    }
                }
                //追加されたメンバーを抽出
                var beforeUsersList = {};
                for (index = 0; index < beforeNum; index++) {
                    beforeUsersList[beforeUsers[index]._id] = beforeUsers[index];
                }

                var addUsers = {};
                for (index = 0; index < userNum; index++) {
                    if ( !(users[index]._id in beforeUsersList) ) {
                        addUsers[users[index]._id] = users[index];
                    }
                }
                //socketIdを設定
                var allNum = results[2].length;
                for (index = 0; index < allNum; index++) {
                    
                    if ( (allUsers[index]._id in deleteUsers) ) {
                        deleteUsers[allUsers[index]._id].socketId = allUsers[index].socketId;
                        
                    } else if ( (allUsers[index]._id in addUsers) ) {
                        addUsers[allUsers[index]._id].socketId = allUsers[index].socketId;
                    }
                }

                //ステータスの設定
                craeteMemberStatus(users, results[2]);
                var target = {roomId: data.roomId, roomName: results[0].name,
                    users: users, deleteUsers: deleteUsers, addUsers: addUsers};
                callback(false ,target);
            });
    
    }else{
        callback(true ,null);
    }
};
/**
 * 未読数を更新する(ajax)
 * 
 * @author niikawa
 * @method updateUnRead
 * @param {Object} req 画面からのリクエスト
 * @param {Object} res 画面へのレスポンス
 */
exports.updateUnRead = function(req,res) {
    var data = req.body;
    data.userId = req.session._id;
    unRead.updateUnRead(data, function(err, result) {
        
        res.send({msg:'ok!'});
    });
};
/**
 * リクエストを受け取り、定型文を作成する
 * 
 * @author niikawa
 * @method fixedSectenceSave
 * @param {Object} req 画面からのリクエスト
 * @param {Object} res 画面へのレスポンス
 */
exports.fixedSectenceSave = function(req, res) {
    
    console.log('------fixedSectenceSave--------');
    async.series(
        [function(callback) {
            fixed.save(req, callback);
        }]
        ,function(err, result) {
            if (err) console.log('fixedSectenceSave err');
            res.redirect('chat/fixedSectence');
        }
    );
};
/**
 * リクエストを受け取り、定型文を削除する
 * 
 * @author niikawa
 * @method fixedSectenceUpdate
 * @param {Object} req 画面からのリクエスト
 * @param {Object} res 画面へのレスポンス
 */
exports.fixedSectenceUpdate = function(req, res) {
    
    console.log('------fixedSectenceUpdate--------');
    if (req.body.id) {
        
        async.series(
            [function(callback) {
                var data = req.body;
                data.updateBy = req.session._id;
                fixed.update(data, callback);
            }]
            ,function(err, result) {
                if (err) console.log('fixedSectenceUpdate err');
                res.redirect('chat/fixedSectence');
            }
        );
        
    } else {
        res.redirect('chat/fixedSectence');
    }
};
/**
 * リクエストを受け取り、定型文を削除する
 * 
 * @author niikawa
 * @method fixedSectenceDelete
 * @param {Object} req 画面からのリクエスト
 * @param {Object} res 画面へのレスポンス
 */
exports.fixedSectenceDelete = function(req, res) {
    
    console.log('------fixedSectenceDelete--------');
    if (req.body._id) {
        fixed.remove(req.body._id);
    }
    res.redirect('chat/fixedSectence');
};
/**
 * リクエストを受け取り、IDに合致した定型文を取得する（ajax）
 * 
 * @author niikawa
 * @method getFixedById
 * @param {Object} req 画面からのリクエスト
 * @param {Object} res 画面へのレスポンス
 */
exports.getFixedById = function(req, res) {
    
    if (req.body.fixedId) {
        
        async.series(
            [function(callback) {
                fixed.getById(req.body.fixedId, callback);
            }]
            ,function(err, result) {
                console.log(result[0]);
                res.send({target: result[0]});
            }
        );
    }
};
/**
 * パラメータに応じたステータスを表示するclass名を返却する
 * 
 * @author niikawa
 * @method getStatusClass
 * @param {Number} val ステータス値
 */
function getStatusClass (val) {
    
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
/**
 * 部屋のメンバーのステータスを設定する
 * 
 * @author niikawa
 * @method craeteMemberStatus
 * @param {Array} roomMember 部屋に属するメンバー
 * @param {Array} allUsers 全ユーザー
 */
function craeteMemberStatus(roomMember, allUsers) {
    console.log('-------craeteMemberStatus---------');
    console.log(roomMember);
    
    var roomUserNum = roomMember.length;
    var allUsersNum = allUsers.length;
    for (var roomMemberIndex = 0; roomMemberIndex < roomUserNum; roomMemberIndex++)  {
        
        for (var allUserIndex = 0; allUserIndex < allUsersNum; allUserIndex++) {
            
            if (roomMember[roomMemberIndex]._id == allUsers[allUserIndex]._id) {
                
                roomMember[roomMemberIndex].status
                    = getStatusClass(allUsers[allUserIndex].loginStatus);
                break;
            }
        }
    }
    return roomMember;
}
/**
 * 未読数をマージする
 * 
 * @author niikawa
 * @method setUnReadNum
 * @param {Array} rooms
 * @param {Array} unReads
 * @param {Date} beforeLogoutTime
 */
function setUnReadNum(rooms, unReads, beforeLogoutTime) {
    console.log('----------set unread num params---------------'); 

    var length = unReads.length;
    var roomNum = rooms.length;
    var index = 0;
    if (roomNum === 0) return;
    if (length === 0) {
        for (index = 0; index < roomNum; index++) {
            rooms[index].unReadNum = 0;
        }
    } else {
        
        var unreadList = {};
        for (index = 0; index < length; index++) {
            unreadList[unReads[index].roomId] = unReads[index];
        }
        for (index = 0; index < roomNum; index++) {
            if (rooms[index]._id in unreadList) {
                rooms[index].unReadNum = unreadList[rooms[index]._id].number;
            } else {
                rooms[index].unReadNum = 0;
            }
        }
    }
    
    //前回ログアウト後に通知されたメッセージ数を取得し未読数に加算する
    //TODO ここのロジックは変えたい
    var logoutTime = moment(beforeLogoutTime);
    
    for (index = 0; index < roomNum; index++) {
        
        var messagesNum = rooms[index].messages.length;
        var unReadNum = 0;
        if (messagesNum <= 0) continue;
        for (messagesNum; messagesNum !== 0;messagesNum--) {
            
            var messageTime = moment(rooms[index].messages[messagesNum-1].time);
            if (messageTime.isAfter(logoutTime)) {
                unReadNum++;
            } else {
                break;
            }
        }
        rooms[index].unReadNum += unReadNum;
    }
    return;
 }
 