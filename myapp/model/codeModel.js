var mongoose = require('mongoose');

// ModelのSchema Class定義する
var codeSchema = new mongoose.Schema({
  created: {type: Date, default: Date.now},
  updated: {type: Date, default: Date.now},
  name: String,
  description: String,
  codeList: {valueName : String, value : Number, dispName: String}
});

// middleware
// save処理の前にフックをかけれる。RailsでいうFilterみたいな機能
/*
taskSchema.pre('save', function (next) {
    
    this.password = 
        crypto.createHash('md5').update(this.password).digest("hex");
    next();
});
*/
// モデル化。model('モデル名', '定義したスキーマクラス')
var codeModel = mongoose.model('code', codeSchema);

/**
 * 検索
 * */
// 全ユーザーの取得
exports.getAll = function(res,callback){
    var Code = mongoose.model('code');
    Code.find({}, function(err, docs) {
        callback(res, docs);
    });
};
// 条件指定
exports.getByCondition = function(condition){
    
};

/**
 * 登録
 * 
 * モデルクラスに入れる必要あるのか？
 * */
exports.save = function(req){
    
    var code = new codeModel(req.body);
    
    console.log(code);
    code.save(function(err){
        if (err) {
            console.log(err);
            throw err;
        } else {
            console.log('DB CONNECTION OK');
        }
    });
};

/**
 * 更新
 * 
 * */
 exports.updateById = function(req) {

    var Code = mongoose.model('code');
    Code.findOne({_id:req.body.id},function(err,target){
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
 exports.removeById = function(res, id,callback) {
     
    var Code = mongoose.model('code');
    Code.findOne({_id:id},function(err,target){
    if(err || target === null){return;}
        target.remove();
        Code.find({}, function(err, docs) {
            callback(res, docs);
        });
    });
 };
