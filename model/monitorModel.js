var util = require('util');
var Core = require('../core/coreModel.js');
var mongoose = require('mongoose');
var moment =require('moment');
/**
 * monitor modelで使用するコレクション名.
 * 
 * @property collection
 * @type {String}
 * @default "fixedSectence"
 */
var collection1 = 'monitors';
var collection2 = 'comments';
/**
 * 監視対象のメッセージを保持するコレクション.
 * 
 * @property monitorSchema
 * @type {Object}
 */
var monitorSchema = new mongoose.Schema({
  created: {type: Date, default: moment().format('YYYY-MM-DD hh:mm:ss')},
  updated: {type: Date, default: moment().format('YYYY-MM-DD hh:mm:ss')},
  creatBy: {type: String},
  updateBy: {type: String},
  statsu: {type: Number, default:1},//1:未着手 2:進行中 3:完了 9:却下
  responders: {type: Array},//対応者
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'messages' }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'comments' }]
});
/**
 * 監視対象のメッセージに対するコメントを保持するコレクション.
 * 
 * @property commentsSchema
 * @type {Object}
 */
var commentSchema = new mongoose.Schema({
  created: {type: Date, default: moment().format('YYYY-MM-DD hh:mm:ss')},
  updated: {type: Date, default: moment().format('YYYY-MM-DD hh:mm:ss')},
  creatBy: {type: String},
  updateBy: {type: String},
  user: {type: Array},
  comments: {type: String}
});

// モデル化。model('モデル名', '定義したスキーマクラス')
var myModel = mongoose.model(collection1, monitorSchema);
var commentModel = mongoose.model(collection2, commentSchema);

/**
 * monitor Model Class.
 *
 * @author niikawa
 * @namespace model
 * @class monitorModel
 * @constructor
 * @extends Core
 */
var monitorModel = function monitorModel() {
    
    this.nextFunc = '';
    this.parameter = '';
    this.modelName = collection1;
    
    Core.call(this, collection1);
};

//coreModelを継承する
util.inherits(monitorModel, Core);

/**
 * 自身がTOになっている監視対象のメッセージを取得する.
 * 
 * @method getMyMonitor
 * @author niikawa
 * @param {String} id ユーザーID
 * @param {Funtion} callback
 */
monitorModel.prototype.getMyMonitor = function(id, callback) {
    
    console.log('-----------getMySectence-----------');
    var Monitor = this.db.model(collection1);
    
};
/**
 * 監視対象を登録する.
 * 
 * @method save
 * @author niikawa
 * @param {Object} id userId
 * @param {Object} messages messageModel
 * @param {Object} responders
 */
monitorModel.prototype.save = function(id, messages, responders) {
    
    var Monitor = new myModel();
    Monitor.creatBy = id;
    Monitor.updateBy = id;
    Monitor.responders = responders;
    Monitor.messages.push(messages);
    Monitor.save();
};
/**
 * 監視対象のメッセージを更新する
 * 
 * @method update
 * @author niikawa
 * @param {Object} req 画面からのリクエスト
 * @param {Function} callback
 */
monitorModel.prototype.update = function(data, callback) {
    console.log('----- fixed model update----');
    var Monitor = this.db.model(collection1);
    Monitor.findOne({ "_id" : data.id}, function(err, target){
        
        target.updateBy = data.updateBy;
        target.updated = moment().format('YYYY-MM-DD hh:mm:ss');
        target.isOpen = data.isOpen;
        target.title = data.title;
        target.contents = data.contents;
        target.save();
        callback(err, '');
    });
};
/**
 * 監視対象から除外する
 * 
 * @method monitorOut
 * @author niikawa
 * @param {Object} req 画面からのリクエスト
 * @param {Function} callback
 */
monitorModel.prototype.monitorOut = function(data, callback) {
 
};
module.exports = monitorModel;