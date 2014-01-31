var util = require('util');
var Core = require('../core/coreModel.js');
var mongoose = require('mongoose');
var crypto = require('crypto');
var collection = 'm_user';
//例外処理用
//var domain = require('domain');
//var d = domain.create();

// ModelのSchema Class定義する
var usersSchema = new mongoose.Schema({
  created: {type: Date, default: Date.now},
  updated: {type: Date, default: Date.now},
  name: String,
  mailAddress: String,
  password: String,
  loginStatus: {type: Number, default: 1},
  lastLoginTime: {type: Date, default: Date.now},
  soketId:String
});

// middleware
// save処理の前にフックをかけれる。RailsでいうFilterみたいな機能
usersSchema.pre('save', function (next) {
    
//    this.password = 
//        crypto.createHash('md5').update(this.password).digest("hex");
    next();
});

// モデル化。model('モデル名', '定義したスキーマクラス')
var myModel = mongoose.model(collection, usersSchema);

var userModel = function userModel() {
    
    this.nextFunc = '';
    this.parameter = '';
    Core.call(this, collection);
    
    
};

//coreModelを継承する
util.inherits(userModel, Core);

/**
 * ログイン
 * 
 * @author niikawa
 * @parameter mailAddress
 * @parameter password
 * @parameter callback
 * */
userModel.prototype.login = function(mailAddress, password, callback){

    var User = this.db.model('m_user');
    var cryptoPass = 
        crypto.createHash('md5').update(password).digest("hex");
    console.log(mailAddress);
    console.log(cryptoPass);
    
    User.find({'mailAddress':mailAddress, 'password':cryptoPass}, callback);
};

/**
 * 登録
 * 
 * @author niikawa
 * @param req
 * */
userModel.prototype.save = function(req){
    
    var user = new myModel(req.body);
    user.password = crypto.createHash('md5').update(user.password).digest("hex");

    /*
    if (user.password != user.passwordConfirm) {
        console.log('password not match');
        return;
    }
    */
    console.log(user);
    user.save(function(err){
        if (err) {
            console.log(err);
            throw err;
        } else {
            console.log('DB CONNECTION OK');
        }
    });
};
/**
 * ユーザーとソケットIDを紐づける
 * 
 * @author niikawa
 * @param userId
 * @aram socketId
 * */
userModel.prototype.updateSoketId = function (userId, socketId) {
    
    console.log('----------------update soketid----------------');
    console.log(userId + ':'+ socketId);

    var User = mongoose.model(collection);
    User.findOne({_id:userId},function(err, target){
        if (err) {
            console.log('update soketId error:'+userId);
        } else {
            console.log(target);
            target.soketId = socketId;
            target.save();
        }
    });
};
/**
 * ステータスを更新する
 * 
 * @author niikawa
 * @param userId
 * @param status 1:Available,2:Busy,3:Away,4:Return home
 * */
userModel.prototype.updateStatus = function(userId, status) {

    var User = mongoose.model(collection);
    User.findOne({_id:userId},function(err, target){
        if (err) {
            console.log('update soketId error:'+userId);
        } else {
            console.log(target);
            target.loginStatus = status;
            target.save();
        }
    });
};
/**
 * 更新
 * 
 * @author niikawa
 * @param req
 * */
userModel.prototype.updateById = function(req) {

     var User = mongoose.model('m_user');
    User.findOne({_id:req.body.id},function(err,target){
    if(err || target === null){return;}
    
        if (req.body.name !== undefined) {
            target.name = req.body.name;
        }
        
        if (req.body.mailAddress !== undefined) {
            target.mailAddress = req.body.mailAddress;
        }
        
        if (req.body.password !== undefined) {
            target.mailAddress = req.body.password;
        }
        
        target.save();
    });
 };
/**
 * 削除
 * 
 * */
userModel.prototype.removeById = function(res, id,callback) {
     
    var User = mongoose.model('m_user');
    User.findOne({_id:id},function(err,target){
    if(err || target === null){return;}
        target.remove();
        User.find({}, function(err, docs) {
            callback(res, docs);
        });
    });
 };
module.exports = userModel;