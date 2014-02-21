/**
 * core model class
 * 
 * @author niikawa
 * @namespace core
 * @class coreModel
 * @constructor
 */
var coreModel = function coreModel(modelName) {
    
    this.modelName = modelName;
    this.schema = '';
    console.log('execute coreModel');
    console.log(this.modelName);
};

//継承先で使用できる変数
coreModel.prototype = {
    modelName : '',          //アクセスするコレクション名
    db : require('mongoose'),//コネクション
    nextFunc : '',           //次処理
    parameter : '',          //nextFuncのパラメータ
    dataNotFunctException : require("./exception/dataNotFoundException.js"),
    moment : require('moment'),
};

/**
 * DB処理後に実行する処理.
 * functionが格納される.
 * 
 * @author niikawa
 * @method setNextFunc
 * @param {Function} func
 */
coreModel.prototype.setNextFunc = function(func) {
    
    this.nextFunc = func;
};

/**
 * nextFuncのパラメータ
 * 
 * @author niikawa
 * @method setNextParam
 * @param {Object} param nextFuncに渡されるパラメータ
 */
coreModel.prototype.setNextParam = function(param) {
    
    this.parameter = param;
};

/**
 * コレクションの値をすべて取得する.
 * _idの昇順で取得.
 * 
 * @author niikawa
 * @method getAll
 * @param {Object} res
 * @param {Function} callback
 */
coreModel.prototype.getAll = function(res,callback){
    console.log('------------get all ----------');
    var target = this.db.model(this.modelName);
    target.find({}, function(err, docs) {
        callback(res, docs);
    }).sort( { _id : 1} );
};

/**
 * コレクションの値をすべて取得する.
 * _idの昇順で取得.
 * 
 * @author niikawa
 * @method getAllSync
 * @param {Object} res
 * @param {Function} callback
 */
coreModel.prototype.getAllSync = function(callback){
    console.log('------------get all sync----------');
    var target = this.db.model(this.modelName);
    
    target.find({}, callback).sort( { _id : 1} );
};

/**
 * _idに合致した情報を取得する.
 * 
 * @author niikawa
 * @method getById
 * @param {Object} id
 * @param {Function} callback
 */
coreModel.prototype.getById = function(id, callback){
    console.log('-----------get by id ----------');
    console.log(this.modelName+':'+id);
    var target = this.db.model(this.modelName);
    target.findOne({'_id':id}, function(err, docs){
        callback(err, docs);
    });
};

/**
 * POSTされたリクエスト値から対象のコレクションにデータを登録する
 * 
 * @author niikawa
 * @method save
 * @param {Object} req
 * @param {Function} callback
 */
coreModel.prototype.save = function(req, callback){

};

/**
 * _idに合致したコレクションを更新する
 * 
 * @author niikawa
 * @method update
 * @param {Object} req
 * @param {Function} callback
 */
coreModel.prototype.update = function (req, callback) {
    var target = this.db.model(this.modelName);
    target.findOne({_id:req.body._id},function(err, target){
    if(err || target === null){return;}
        //TODO コレクションのモデルを動的にここで判定できるのか？
        target.save(callback);
    });
};
/**
 * _idに合致したコレクションを削除する
 * 
 * @author niikawa
 * @method remove
 * @param {Object} _id
 * @param {Function} callback
 */
coreModel.prototype.remove = function(_id){
    
    var target = this.db.model(this.modelName);
    target.findOne({'_id': _id},function(err,item){
    if(err || item === null){return;}
        console.log('-----remove item------');
        item.remove();
    });
};

//モジュール化
module.exports = coreModel;