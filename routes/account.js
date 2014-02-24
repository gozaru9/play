//ユーザーモデルを読み込む
var userModel = require('../model/userModel');
var model = new userModel();

//ユーザーの一覧を取得し画面描画
exports.index = function(req, res){

        model.getAll(res,
            function(res,docs){
                res.render('account/index', 
                { title: 'ユーザー管理', items : docs, _id: req.session._id, userName:req.session.name});
            }
        );
};

exports.parts = function(req, res){
    
    model.getAll(res,
        function(res,docs){
            res.send({items : docs});
        }
    );
};


// ユーザーの登録
exports.regist = function(req, res){

    try {
        
        if (req.method == 'GET') {
            
            res.render('account/regist',{title: 'ユーザー管理'}); 

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