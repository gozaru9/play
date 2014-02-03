var mongoose = require('mongoose');

// ModelのSchema Class定義する
var taskSchema = new mongoose.Schema({
  created: {type: Date, default: Date.now},
  updated: {type: Date, default: Date.now},
  categoryId: {type: Number, default: 0},
  name: String,
  content: String,
  status: {type: Number, default: 0},//0:未着手 1:対応中 2:完了 3:終了
  progress: {type: Number, default: 0},//進捗
  responders: String,//担当者
  startDate: String,//開始日
  endDate: String,//終了日
  parentTaskId: {type: Number, default: 0}, 
  childTaskId: {type: Number, default: 0}
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
var myModel = mongoose.model('task', taskSchema);

/**
 * 検索
 * */
// 全ユーザーの取得
exports.getAll = function(res,callback){
    var Task = mongoose.model('task');
    Task.find({}, function(err, docs) {
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
    
    var task = new myModel(req.body);
    
    console.log(task);
    task.save(function(err){
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

     var User = mongoose.model('task');
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
 exports.removeById = function(res, id,callback) {
     
    var User = mongoose.model('task');
    User.findOne({_id:id},function(err,target){
    if(err || target === null){return;}
        target.remove();
        User.find({}, function(err, docs) {
            callback(res, docs);
        });
    });
 };
