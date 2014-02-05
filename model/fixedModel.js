var util = require('util');
var Core = require('../core/coreModel.js');
var mongoose = require('mongoose');
var moment =require('moment');
/**
 * chat modelで使用するコレクション名.
 * 
 * @property collection
 * @type {String}
 * @default "fixedSectence"
 */
var collection = 'fixedSectence';
/**
 * 部屋とメッセージを保持するコレクション.
 * 
 * @property chatSchema
 * @type {Object}
 */
var fixedSectenceSchema = new mongoose.Schema({
  created: {type: Date, default: moment().format('YYYY-MM-DD hh:mm:ss')},
  updated: {type: Date, default: moment().format('YYYY-MM-DD hh:mm:ss')},
  creatBy: {type: String},
  updateBy: {type: String},
  isOpen: {type: Boolean, default: false},
  title: {type: String},
  contents: {type:String},
});

// モデル化。model('モデル名', '定義したスキーマクラス')
var myModel = mongoose.model(collection, fixedSectenceSchema);

/**
 * fixedSectence Model Class.
 *
 * @author niikawa
 * @namespace model
 * @class fixedModel
 * @constructor
 * @extends Core
 */
var fixedModel = function chatModel() {
    
    this.nextFunc = '';
    this.parameter = '';
    this.modelName = collection;
    
    Core.call(this, collection);
};

//coreModelを継承する
util.inherits(fixedModel, Core);

/**
 * ユーザー固有の表示可能な定型文を取得する.
 * 
 * @method getMySectence
 * @author niikawa
 * @param {String} id ユーザーID
 * @param {Funtion} callback
 */
fixedModel.prototype.getMySectence = function(id, callback) {
    
    console.log('-----------getMySectence-----------');
    var Fixed = this.db.model(collection);
    Fixed.find({'creatBy': id, 'isOpen': false}, callback).sort({'_id': 1});
};
/**
 * 全体公開の表示可能な定型文を取得する.
 * 
 * @method getSectence
 * @author niikawa
 * @param {Funtion} callback
 */
fixedModel.prototype.getSectence = function(callback) {
    console.log('-----------getSectence-----------');
    var Fixed = this.db.model(collection);
    Fixed.find({'isOpen': true}, callback).sort({'_id': 1});
};
/**
 * 定型文を登録する.
 * 
 * @method save
 * @author niikawa
 * @param {Object} req 画面からのリクエスト
 * @param {Function} callback
 */
fixedModel.prototype.save = function(req, callback) {
    
    var Fixed = new myModel(req.body);
    Fixed.creatBy = req.session._id;
    Fixed.updateBy = req.session._id;

    //コールバック内で使用するため参照を保持
    var nextFunc  = this.nextFunc;
    var parameter = this.parameter;
    
    Fixed.save(function(err) {
        if (err) {
            console.log('fixed save error');
            throw err;
        }
        if (typeof(nextFunc) == 'function') {
            nextFunc(parameter);
        }
    });
};

/**
 * 定型文を更新する.
 * 
 * @method update
 * @author niikawa
 * @param {Object} req 画面からのリクエスト
 * @param {Function} callback
 */
fixedModel.prototype.update = function(req) {

};

/**
 * 定型文を削除する.
 * 
 * @method remove
 * @author niikawa
 * @param {Object} req 画面からのリクエスト
 * @param {Function} callback
 */
fixedModel.prototype.remove = function(req) {

};

module.exports = fixedModel;