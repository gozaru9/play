var mongoose = require('mongoose');

// ModelのSchema Class定義する
var todoSchema = new mongoose.Schema({
  created: {type: Date, default: Date.now},
  updated: {type: Date, default: Date.now},
  memberId: String,
  contents: String, //内容
  important:Number,
  endDate: {type: Date, default: Date.now}  //終了日 YYYY-MM-DD
});

// モデル化。model('モデル名', '定義したスキーマクラス')
var myModel = mongoose.model('todo', todoSchema);

var TodoModel = function() {}

TodoModel.prototype.getAll = function(res,callback){
    var Todo = mongoose.model('todo');
    Todo.find({},{'updated':0,  '__v':0},function(err, docs) {
        callback(res, docs);
    });
};

TodoModel.prototype.save = function(req, res, callback){
    
    var todo = new myModel(req.body);
    
    console.log(req.body);
    todo.save(function(err){
        if (err) {
            console.log(err);
            throw err;
        } else {
            console.log("save complete");
            callback(res);
        }
    });
};

TodoModel.prototype.removeById = function(res, id, callback) {
    
    var Todo = mongoose.model('todo');
    Todo.findOne({_id:id},function(err,target){
    if(err || target === null){return;}
        target.remove();
        callback(res);
    });
 };

module.exports = TodoModel;