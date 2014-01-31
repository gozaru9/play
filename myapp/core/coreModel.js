/**
 * モデル基底
 * */
var coreModel = function coreModel(modelName) {
    
    this.modelName = modelName;

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
 * functionが格納される
 * */
coreModel.prototype.setNextFunc = function(func) {
    
    this.nextFunc = func;
};

/**
 * nextFuncのパラメータ
 * */
coreModel.prototype.setNextParam = function(param) {
    
    this.parameter = param;
};

/**
 * コレクションの値をすべて取得する
 * */
coreModel.prototype.getAll = function(res,callback){
    var target = this.db.model(this.modelName);
    target.find({}, function(err, docs) {
        callback(res, docs);
    });
};

/**
 * _idに合致した情報を取得する
 * */
coreModel.prototype.getById = function(id, callback){
    
    var target = this.db.model(this.modelName);
    target.findOne({'_id':id}, function(err, docs){
        callback(err, docs);
    });
};
/**
 * コレクションを更新
 * @
 * */
coreModel.prototype.update = function (id, callback) {
    var target = this.db.model(this.modelName);
    target.findOne({_id:id},function(err, target){
    if(err || target === null){return;}
        //TODO コレクションのモデルを動的にここで判定できるのか？
        target.save();
    });
};
//モジュール化
module.exports = coreModel;