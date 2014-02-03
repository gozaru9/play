/**
 * タスク
 * */
//
var model = require('../model/codeModel');

exports.index = function(req, res){
    model.getAll(res,
        function(res,docs){
            res.render('code/index', { title: 'コード管理', items : docs});
        }
    );
};
exports.regist = function(req, res){

    try {
        
        if (req.method == 'GET') {
            
            res.render('code/index',{title: 'コード管理'}); 

        } else {
            
            console.log('save execute');
            model.save(req);
            res.redirect('code/index');
        }
                
    } catch(e){
        
        //共通処理にしたい
        console.log('code save failed');
    }
};

//ユーザーの更新
exports.update = function(req, res) {
    
    
    
};

//ユーザーの削除
exports.delete = function(req, res) {
    
    model.removeById(res,req.body._id,
        function(res, docs){
            res.render('code/index', { title: 'コード管理', items : docs});
        }
    );
};