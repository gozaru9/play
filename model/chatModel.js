var util = require('util');
var Core = require('../core/coreModel.js');
var mongoose = require('mongoose');
var crypto = require('crypto');
var collection = 'chats';
var collection2 = 'mymessages';

/**
 * 部屋とメッセージを保持するコレクション
 * */
var chatSchema = new mongoose.Schema({
  created: {type: Date, default: Date.now},
  updated: {type: Date, default: Date.now},
  name: String,
  description: String,
  messages: {type:Array},
  users: {type:Array}
});
/**
 * 自分自身へ送信されたメッセージを保持するコレクション
 * */
var myMessageSchema = new mongoose.Schema({
  created: {type: Date, default: Date.now},
  updated: {type: Date, default: Date.now},
  sender:{type: String},
  recipient:{type: String},//受信者
  messages: {type:String},
  time: {type:String}
});

// middleware
// save処理の前にフックをかけれる。RailsでいうFilterみたいな機能
chatSchema.pre('save', function (next) {
    
    next();
});

// モデル化。model('モデル名', '定義したスキーマクラス')
var myModel = mongoose.model(collection, chatSchema);
var myMsg = mongoose.model(collection2, myMessageSchema);

var chatModel = function chatModel() {
    
    this.nextFunc = '';
    this.parameter = '';
    this.modelName = collection;
    
    Core.call(this, collection);
};

//coreModelを継承する
util.inherits(chatModel, Core);

/**
 * 登録
 * 
 * */
chatModel.prototype.save = function(req){
    
    var chat = new myModel(req.body);
    console.log('-------chat seve----------------');
    console.log(chat);

    //コールバック内で使用するため参照を保持
    var nextFunc  = this.nextFunc;
    var parameter = this.parameter;

    chat.save(function(err){
        if (err) {
            console.log(err);
            throw err;
        } else {

            if (typeof(nextFunc) == 'function') {
                console.log('chat save ok ');
                nextFunc(parameter);
            }
        }
    });
};
/**
 * メッセージを登録する
 * 
 * @author niikawa
 * @param data
 * */
chatModel.prototype.addMessage = function(data) {
    var Chat = this.db.model(collection);
    Chat.findOne({ "_id" : data.roomId}, function(err, room){
		var m = {user:{id:data.userId, name:data.userName}, msg:data.message, time:data.time};
        room.messages.push(m);
        room.save();
    });
};
/**
 * 個別メッセージを登録する
 * 
 * @author niikawa
 * @param data
 * */
chatModel.prototype.addMyMessage = function(data) {
    
    var MyMsg = new myMsg(data);

    MyMsg.save(function(err){
        if (err) {
            console.log(err);
            throw err;
        }
    });
};
/**
 * ユーザー追加/変更
 * 
 * @author niikawa
 * @param data
 * @param callback
 * */
chatModel.prototype.memberUpdate = function(data, callback) {

    console.log('-------chatModel member update----------------');
    console.log(data);
    var Chat = this.db.model(collection);
    Chat.findOne({ "_id" : data.roomId}, function(err, room){
        room.users = data.users;
        room.save();
        callback(err, '');
    });
};
/**
 * 指定期間内の部屋のメッセージを取得する
 * @author niikwa
 * @param req
 * @param callback
 * */
chatModel.prototype.getMessageById = function(req, callback) {
    
    var Chat = this.db.model(collection);
    
    if (req.period === undefined) {
        console.log('get limit 50');
        console.log(req.roomId);
        Chat.find({'_id': req.roomId}, 'messages', callback).limit(1);

    } else {
        
        
    }
    
};
/**
 * 自分の入れる部屋を取得
 * 
 * @author niikawa
 * @param req
 * @param callback
 * */
chatModel.prototype.getMyRoom = function(req, callback) {

    console.log('-------chatModel getMyRoom----------------');
    
    //コールバック内で使用するため参照を保持
//    var nextFunc  = this.nextFunc;
//    var parameter = this.parameter;
    
    var Chat = this.db.model(collection);

    var id = req.session._id;
    console.log(req.session);
    Chat.find({ "users._id" : { $in:[id] } }, callback);
};

chatModel.prototype.getMyRoomParts = function(req) {
    
    //コールバック内で使用するため参照を保持
    var nextFunc  = this.nextFunc;
    var parameter = this.parameter;
    
    var Chat = this.db.model(collection);

    var id = req.session._id;
    Chat.find({ "users._id" : { $in:[id] } }, function(err, room) {

        if (err) {
            console.log(err);
            throw err;
        }

        if (typeof(nextFunc) == 'function') {

            nextFunc(parameter, room);
        } else {
            return room;
        }
    });
};

/**
 * 削除
 * 
 * */
chatModel.prototype.removeById = function(res, id,callback) {
     
};
module.exports = chatModel;