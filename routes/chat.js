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
var tagsModel = require('../model/tagsModel');
var tags = new tagsModel();
var monitorModel = require('../model/monitorModel');
var monitor = new monitorModel();

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
        
        var isMyRoom = req.body.room === 'myRoom';
        //parallelだとデータを取得できない。。。。
        async.parallel(
            [function (callback) {
                //固有定型文取得
                fixed.getMySectence(req.session._id, callback);
                
            },function (callback) {
                //公開定型文取得
                fixed.getSectence(callback);
                
            },function (callback) {
                //自分の入れるルーム取得
                chat.getMyRoom(req, callback);
                
            },function(callback) {
                if (req.body.room === 'myRoom') {
                    //Toメッセージ用メッセージ取得
                    chat.getMyMessages(req.session._id, callback);
                } else {
                    callback();
                }
                
            }, function(callback) {
                //タグ取得
                tags.getAllSync(callback);
                
            }, function(callback) {
                //インシデント
                monitor.getAllSync(callback);

            },function(callback) {
                //全ユーザー情報取得
                model.getAllSync(callback);
            }]
            ,function(err, results) {
                
                console.log('-----------async end function-------------');
                var rooms = results[2];
                var allUsers = results[results.length-1];
                unRead.getUnReadByUserId(req.session._id, function(err, target) {
                    var name = '';
                    var users=[];
                    var messages=[];
                    var now = moment().format('YYYY-MM-DD HH:mm:ss');
                    setUnReadNum(req.session._id, rooms, target, now, req.body.room);
                    if(req.body.room) {
                        
                        if (isMyRoom) {
                            
                            console.log(results[3]);
                            
                            name = 'MY ROOM';
                            users = results[3].users;
                            messages = results[3].messages;
                            console.log('myroom messages-------------------------------');
                            console.log(results[3].messages);
                            
                        } else {
                            
                            var roomLength = Array.isArray(rooms) ? rooms.length : 0;
                            for(var i=0; i<roomLength; i++) {
                                if (rooms[i]._id == req.body.room) {
        
                                    name = rooms[i].name;
                                    users = rooms[i].users;
                                    messages = rooms[i].messages;
                                    //選択したルームの未読数を0にする
    
                                    break;
                                }
                            }
                        }
                    }
                    var allUsersNum = Array.isArray(allUsers) ? allUsers.length : 0;
                    for (var allUserIndex = 0; allUserIndex < allUsersNum; allUserIndex++) {
                        allUsers[allUserIndex].status = getStatusClass(allUsers[allUserIndex].loginStatus);
                    }
                    //TODO ここはGroup By Count にしたいがmongooseのスキルが足りない
                    console.log(results[5]);
                    var inc = results[5];
                    var incNum = inc.length;
                    var open = 0;
                    var prog = 0;
                    var close = 0;
                    var remove = 0;
                    for (var incIndex=0; incIndex<incNum; incIndex++) {
                        
                        switch (inc[incIndex].status) {
                            case 1:
                                open++;
                                break;
                            case 2:
                                prog++;
                                break;
                            case 3:
                                close++;
                                break;
                            case 9:
                                remove++;
                                break;
                            default:
                                break;
                        }
                    }
                    var incData = {openCount:open, progCount:prog, closeCount:close, removeCount:remove, allCount:incNum};
                    var fixed = results[0].concat(results[1]);
                    console.log('---------------render start--------------------');
                    res.render('chat/index', {title: 'chat', userName:req.session.name, _id:req.session._id, role:req.session.role,
                        rooms:rooms, targetRoomId:req.body.room, roomName:name, users:users, 
                        messages:messages, allUsers:allUsers, fixed:fixed, tags:results[4], incidnt:incData});
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
            //loginからの遷移ではない場合
            req.session.unreadjudgmentTime = moment().format('YYYY-MM-DD HH:mm:ss');
            console.log(req.session.unreadjudgmentTime);
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
                    setUnReadNum(req.session._id, rooms, target, req.session.unreadjudgmentTime);
                    
                    var allUsers = results[1];
                    var allUsersNum = allUsers.length;
                    for (var allUserIndex = 0; allUserIndex < allUsersNum; allUserIndex++) {
                        allUsers[allUserIndex].status = getStatusClass(allUsers[allUserIndex].loginStatus);
                    }
                    res.render('chat/lobby', 
                        {title: 'LOBBY', userName: req.session.name, role:req.session.role,
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
                    {title: 'fixedSectence', userName:req.session.name, role:req.session.role, 
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
                res.render('/login', {title: 'LOGIN', errMsg:''});
            }
            console.log('-----------login------');
            console.log(results[0]);

            if (results.length === 0) {
                res.redirect('/login');
            }
            
            req.session._id = results[0]._id;
            req.session.name = results[0].name;
            req.session.role = results[0].role;
            req.session.isLogin = true;
            req.session.loginNotice = true;
            req.session.unreadjudgmentTime = results[0].unreadjudgmentTime;
            model.updateStatus(req.session._id, 1);
            
            console.log('-----------login set session------');
            console.log(req.session);
            
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
    
    async.waterfall(
        [function (callback) {
            chat.getMyRoom(req, callback);
        },function(rooms, callback) {
            unRead.getUnReadByUserId(req.session._id, function(err, target) {
                callback(null, rooms, target);
            });
        }, function(rooms, unRead, callback) {
            
            setUnReadNum(req.session._id, rooms, unRead, req.session.unreadjudgmentTime);
            callback(null,rooms);
        }]
        ,function(err, roomList) {
            
            res.send({rooms:roomList});
        });
};
/**
 * リクエストを受け取り、ユーザーの入れる部屋の一覧を取得する
 * この処理では部屋の情報のみ取得する
 * 
 * @author niikawa
 * @method getMyRoomList
 * @param {Object} req 画面からのリクエスト
 * @param {Object} res 画面へのレスポンス
 */
exports.getMyRoomList = function(req, res) {

    chat.getMyRoom(req, function(err, result) {
        res.send({roomList:result});
    });
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
                if (req.body.roomId === 'myRoom') {
                    
                    chat.getMyMessages(req.session._id, callback);
                } else {
                    
                    chat.getById(req.body.roomId, callback);
                }
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
                var users = [];
                if (req.body.roomId === 'myRoom') {
                    users[0] = {'_id': req.session._id, 'name':req.session.name};
                } else {
                    users = room.users;
                }
                craeteMemberStatus(users, allUsers);
                res.send({users:users, messages:room.messages
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
 * @param {String} userId
 * @param {Array} rooms
 * @param {Array} unReads
 * @param {Date} unreadjudgmentTime
 * @param {String} unReadOffRoomId
 */
function setUnReadNum(userId, rooms, unReads, unreadjudgmentTime, unReadOffRoomId) {
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
    var judgmentTime = '';
    if (unreadjudgmentTime === null) {
        judgmentTime = moment();
    } else {
        judgmentTime = moment(unreadjudgmentTime);
    }
    for (index = 0; index < roomNum; index++) {
        
        var messagesNum = rooms[index].messages.length;
        var unReadNum = 0;
        if (messagesNum <= 0) continue;
        for (messagesNum; messagesNum !== 0;messagesNum--) {
            
            var messageTime = moment(rooms[index].messages[messagesNum-1].time);
            if (messageTime.isAfter(judgmentTime)) {
                unReadNum++;
            } else {
                break;
            }
        }
        console.log('room name :'+ rooms[index].name);
        console.log('add unread num :'+ unReadNum);
        console.log('unread num :'+ rooms[index].unReadNum);
        //未読最新数に更新する
        if (unReadOffRoomId == rooms[index]._id) {
            rooms[index].unReadNum = 0;
        } else {
            rooms[index].unReadNum += unReadNum;
        }
        var data = {userId: userId, roomId: rooms[index]._id, unReadNum: rooms[index].unReadNum};
        unRead.updateUnRead(data, null);
    }
    console.log('----------set unread num params end---------------'); 
    
    return;
}