var util = require('util');
var Core = require('../core/coreModel.js');
var mongoose = require('mongoose');
var crypto = require('crypto');
var collection = 'users';
var moment =require('moment');

// ModelのSchema Class定義する
var usersSchema = new mongoose.Schema({
  created: {type: Date, default: Date.now},
  updated: {type: Date, default: Date.now},
  creatBy: {type: String},
  updateBy: {type: String},
  name: String,
  mailAddress: String,
  role:{type: Number, default: 0},
  password: String,
  loginStatus: {type: Number, default: 1},
  lastLoginTime: {type: Date, default: Date.now},
  unreadjudgmentTime: {type: String},
  socketId:String
});

// middleware
// save処理の前にフックをかけれる。RailsでいうFilterみたいな機能
usersSchema.pre('save', function (next) {
    
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

    var User = this.db.model(collection);
    var cryptoPass = 
        crypto.createHash('md5').update(password).digest("hex");
    console.log(mailAddress);
    console.log(cryptoPass);
    
    User.find({'mailAddress':mailAddress, 'password':cryptoPass}, callback);
};
/**
 * ユーザーを取得する.
 * 
 * @method getTags
 * @author niikawa
 * @param {Number} skip
 * @param {Number} limit
 * @param {Funtion} callback
 */
userModel.prototype.getUser = function(skip, limit, callback) {
    var User = this.db.model(collection);
    User.find().sort({'created': 1}).skip(skip).limit(limit).exec(callback);
};
/**
 * 登録
 * 
 * @author niikawa
 * @param req
 * */
userModel.prototype.save = function(req){
    req.body.role = req.body.role ? 1 : 0;
    var user = new myModel(req.body);
    console.log(req.body);
    user.creatBy = req.session._id;
    user.updateBy = req.session._id;
    user.password = crypto.createHash('md5').update(user.password).digest("hex");

    /*
    if (user.password != user.passwordConfirm) {
        console.log('password not match');
        return;
    }
    */
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
userModel.prototype.updateSocketId = function (userId, socketId) {
    
    console.log('----------------update socketId----------------');
    console.log(userId + ':'+ socketId);

    var User = mongoose.model(collection);
    User.findOne({_id:userId},function(err, target){
        if (err) {
            console.log('update socketId error:'+userId);
        } else {
            console.log(target);
            target.socketId = socketId;
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
            console.log('update status error:'+userId);
        } else {
            console.log(target);
            target.loginStatus = status;
            target.save();
        }
    });
};
userModel.prototype.logout = function(id) {
    
    var User = mongoose.model(collection);
    User.findOne({_id:id},function(err, target){
        if (err) {
            console.log('logout error:'+id);
        } else {
            target.loginStatus = 4;
            target.unreadjudgmentTime = moment().format('YYYY-MM-DD HH:mm:ss');
            target.save();
        }
    });
};
/**
 * 同一のメールアドレスを持つユーザーがいないことを確認
 * 
 * @author niikawa
 * */
userModel.prototype.exsitsMailAddress = function(id, mailAddress, callback) {
    
    var User = mongoose.model(collection);
    User.find({ $and: [{'mailAddress':mailAddress} , {'_id': {$ne: id}}] }).count(callback);
};
/**
 * 更新
 * 
 * @author niikawa
 * @param req
 * */
userModel.prototype.update = function(req, callback) {

    req.body.role = req.body.role ? 1 : 0;
    var User = mongoose.model(collection);
    User.findOne({_id:req.body.accountId},function(err,target){
        if(err || target === null){
            
            callback();
        }
//        target.updateBy = req.session._id;
        target.updated = moment().format('YYYY-MM-DD HH:mm:ss');
        target.name = req.body.name;
        target.mailAddress = req.body.mailAddress;
        target.role = req.body.role;
        target.password = crypto.createHash('md5').update(req.body.password).digest("hex");
        target.save(callback);
    });
};
/**
 * プロフィール更新
 * 
 * @author niikawa
 * @param {Object} req
 * @param {Function} callback
 */
userModel.prototype.profileUpdate = function(req, callback) {
    
    var User = mongoose.model(collection);
    User.findOne({_id:req.session._id},function(err,target){
        if(err || target === null){
            
            callback();
        }
        target.updated = moment().format('YYYY-MM-DD HH:mm:ss');
        target.password = crypto.createHash('md5').update(req.body.password).digest("hex");
        target.save(callback);
    });
};
/**
 * 削除
 * 
 * */
userModel.prototype.removeById = function(res, id,callback) {
     
    var User = mongoose.model(collection);
    User.findOne({_id:id},function(err,target){
    if(err || target === null){return;}
        target.remove(callback);
    });
 };
module.exports = userModel;