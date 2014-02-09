var util = require('util');
var Core = require('../core/coreModel.js');
var mongoose = require('mongoose');
var moment =require('moment');
/**
 * chat modelで使用するコレクション名.
 * 
 * @property collection
 * @type {String}
 * @default "chat"
 */
var collection = 'chats';
/**
 * 部屋とメッセージを保持するコレクション.
 * 
 * @property collection2
 * @type {String}
 * @default "messages"
 */
var collection2 = 'messages';
/**
 * 部屋とメッセージを保持するコレクション.
 * 
 * @property collection2
 * @type {String}
 * @default "messages"
 */
var collection3 = 'mymessages';
/**
 * 部屋とメッセージを保持するコレクション.
 * 
 * @property chatSchema
 * @type {Object}
 */
var chatSchema = new mongoose.Schema({
  created: {type: Date, default: Date.now},
  updated: {type: Date, default: Date.now},
  name: String,
  description: String,
  users: {type:Array},
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'messages' }]
});
/**
 * 部屋のメッセージを保持するコレクション.
 * 
 * @property messagesSchema
 * @type {Object}
 */
var messagesSchema = new mongoose.Schema({
  created: {type: Date, default: moment().format('YYYY-MM-DD hh:mm:ss')},
  updated: {type: Date, default: moment().format('YYYY-MM-DD hh:mm:ss')},
  creatBy: {type: String},
  updateBy: {type: String},
  user: {_id: Object, name: String},
  to: {ids: Array, names: Array},
  time: {type: String, default: moment().format('YYYY-MM-DD hh:mm:ss')},
  message: {type:String},
});
/**
 * 自分自身へ送信されたメッセージを保持するコレクション.
 * 
 * @property myMessageSchema
 * @type {Object}
 */
var myMessageSchema = new mongoose.Schema({
  created: {type: Date, default: Date.now},
  updated: {type: Date, default: Date.now},
  roomId:{type: String, default: ''},
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
var messgeModel = mongoose.model(collection2, messagesSchema);
var myMsg = mongoose.model(collection3, myMessageSchema);

/**
 * Chat Model Class.
 *
 * @author niikawa
 * @namespace model
 * @class chatModel
 * @constructor
 * @extends Core
 */
var chatModel = function chatModel() {
    
    this.nextFunc = '';
    this.parameter = '';
    this.modelName = collection;
    
    Core.call(this, collection);
};

//coreModelを継承する
util.inherits(chatModel, Core);

/**
 * 部屋を作成する.
 * 
 * @author niikawa
 * @method save
 * @param {Object} req 画面からのリクエスト
 */
chatModel.prototype.save = function(req) {
    
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
 * メッセージを登録する.
 * 
 * @author niikawa
 * @method addMessage
 * @param {Object} data data.roomId data.userId
 */
chatModel.prototype.addMessage = function(data) {
    var Chat = this.db.model(collection);
    Chat.findOne({ "_id" : data.roomId}, function(err, room){
        var message = new messgeModel();
        message.user = {_id:data.userId, name:data.userName};
        message.to = {ids: data.toTarget, names:data.toNameList};
        message.time = data.time;
        message.message = data.message;
        message.save();
        room.messages.push(message);
        room.save();
    });
};
/**
 * 個別メッセージを登録する.
 * 
 * @author niikawa
 * @method addMyMessage
 * @param {Object} data
 */
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
 * 部屋に入れるユーザーの変更を行う.
 * 
 * @author niikawa
 * @method memberUpdate
 * @param {Object} data
 * @param {Function} callback
 */
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
 * 指定期間内の部屋のメッセージを取得する.
 * 
 * @method getMessageById
 * @author niikwa
 * @param {Object} req 画面からのリクエスト
 * @param callback
 */
chatModel.prototype.getMessageById = function(req, callback) {
    
    var Chat = this.db.model(collection);
    if (req.period === undefined) {
        console.log('get limit 50');
        console.log(req.roomId);
        Chat.find({'_id': req.roomId}, 'messages', callback).limit(1);

    } else {
        
        Chat.findOne({'_id': req.roomId}, callback).populate('messages', 'time', {$gte: '2014-02-08 00:00:00'});
    }
};
/**
 * IDに合致する情報を取得する.
 * 
 * @method getById
 * @author niikawa
 * @param {Object} id Chat._id
 * @param {Function} callback
 */
chatModel.prototype.getById = function(id, callback) {
    var Chat = this.db.model(collection);
    console.log('chat model get by id');
    console.log(id);
    
    Chat.findOne({'_id': id}, callback).populate('messages');
};
/**
 * 自分の入れる部屋を取得する.
 * 
 * @method getMyRoom
 * @author niikawa
 * @param {Object} req 画面からのリクエスト
 * @param {Function} callback
 */
chatModel.prototype.getMyRoom = function(req, callback) {

    console.log('-------chatModel getMyRoom----------------');
    
    //コールバック内で使用するため参照を保持
//    var nextFunc  = this.nextFunc;
//    var parameter = this.parameter;
    
    var Chat = this.db.model(collection);

    var id = req.session._id;
    Chat.find({ "users._id" : { $in:[id] } }, callback).populate('messages');
};
/**
 * 自分の入れる部屋を取得する.
 * 
 * @author niikawa
 * @method getMyRoomParts
 * @param {Object} req 画面からのリクエスト
 */
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
    }).populate('messages');
};
/**
 * 部屋を削除する.
 * 
 * @method removeById
 * @author niikawa
 * @param {String} id 削除対象のID
 * @param {Function} callback
 */
chatModel.prototype.removeById = function(id,callback) {
     
};
module.exports = chatModel;