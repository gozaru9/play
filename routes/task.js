/**
 * タスク
 * */
//
var model = require('../model/taskModel');

exports.index = function(req, res){
    model.getAll(res,
        function(res,docs){
            res.render('task/index', { title: 'タスク管理', items : docs});
        }
    );
};
exports.regist = function(req, res){

    try {
        
        if (req.method == 'GET') {
            
            res.render('account/regist',{title: 'Express3 + Express Partial + EJS'}); 

        } else {
            
            console.log('save execute');
            model.save(req);
            res.redirect('/account');
        }
                
    } catch(e){
        
        //共通処理にしたい
        console.log('user save failed');
    }
};

//ユーザーの更新
exports.update = function(req, res) {
    
    
    
};

//ユーザーの削除
exports.delete = function(req, res) {
    
    model.removeById(res,req.body._id,
        function(res, docs){
            res.render('account/index', { title: 'Express', items : docs});
        }
    );
};