var async = require('async');
var userModel = require('../model/userModel');
var model = new userModel();
var chatModel = require('../model/chatModel');
var chat = new chatModel();
var fixedModel = require('../model/fixedModel');
var fixed = new fixedModel();

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
                console.log(results);
                var rooms = results[2];
                var name = '';
                var users=[];
                var messages=[];
                if(req.body.room) {
                    var roomLength = Array.isArray(rooms) ? rooms.length : 0;
                    console.log('reqest room id');
                    console.log(req.body.room);
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
                var allUsers = results[3];
                var allUsersNum = Array.isArray(allUsers) ? allUsers.length : 0;
                for (var allUserIndex = 0; allUserIndex < allUsersNum; allUserIndex++) {
                    allUsers[allUserIndex].status = getStatusClass(allUsers[allUserIndex].loginStatus);
                }
                
                var fixed = results[0].concat(results[1]);
                
                res.render('chat/index', {title: 'chat', userName:req.session.name, 
                    rooms:rooms, targetRoomId:req.body.room, roomName:name, users:users, 
                    messages:messages, allUsers:allUsers, fixed:fixed});
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
        async.parallel(
            [function (callback) {
                
                chat.getMyRoom(req, callback);
            },function (callback) {
                model.getAll(req, callback);
            }]
            ,function(err, results) {
                
                console.log('----------lobby------');
                console.log(results[0]);
                var allUsers = results[1];
                var allUsersNum = allUsers.length;
                for (var allUserIndex = 0; allUserIndex < allUsersNum; allUserIndex++) {
                    allUsers[allUserIndex].status = getStatusClass(allUsers[allUserIndex].loginStatus);
                }
                res.render('chat/lobby', {title: 'LOBBY', userName:req.session.name, rooms:results[0], allUsers: allUsers});
            });
    } else {
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
                    mineFixed:results[1], openFixed:results[0]});
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

    model.updateStatus(req.session._id, 4);
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

        async.parallel(
            [function (callback) {
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
                
                craeteMemberStatus(room.users, allUsers);
                res.send({users:room.users, messages:room.messages
                    , allUsers:allUsers,description:room.description});
            });
    
    }else{
        res.send({users : ''});
    }
};
/**
 * リクエストを受け取り、部屋のメンバー構成を更新する
 * 
 * @author niikawa
 * @method memberUpdate
 * @param {Object} req 画面からのリクエスト
 * @param {Object} res 画面へのレスポンス
 */
exports.memberUpdate = function(req, res) {
    
    if (req.body.roomId) {

        async.series(
            [function (callback) {
                chat.memberUpdate(req.body, callback);
            }, function (callback) {
                chat.getById(req.body.roomId, callback);
            },function (callback) {
                model.getAll(req, callback);
            }]
            ,function(err, results) {
                var users = req.body.users;
                craeteMemberStatus(users, results[2]);
                res.send({users : users});
            });
    
    }else{
        res.send({users : ''});
    }
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