//ユーザーモデルを読み込む
var userModel = require('../model/userModel');
var myModel = new userModel();

//ユーザーの一覧を取得し画面描画
exports.index = function(req, res){

        myModel.getAll(res,
            function(res,docs){
                res.render('account/index', 
                { title: 'ユーザー管理', items : docs, _id: req.session._id, userName:req.session.name});
            }
        );
};
exports.getById = function(req, res) {
    
    myModel.getById(req.body._id, function(err, item){
        var errinfo = {status:false, message:''};
        if (null === item) {
            errinfo.status = true;
            errinfo.message = '対象のユーザーが存在しません';
        }
        res.send({target: item, errinfo:errinfo});
    });
};
exports.parts = function(req, res){
    
    myModel.getAll(res,
        function(res,docs){
            res.send({items : docs});
        }
    );
};

// ユーザーの登録
exports.regist = function(req, res){

    if (req.method == 'GET') {
        
        res.render('account/regist',{title: 'ユーザー管理'}); 

    } else {
        
        console.log('save execute');
        myModel.save(req);
        res.redirect('/account');
    }
};

//ユーザーの更新
exports.update = function(req, res) {
    
    myModel.update(req, function(err) {
        
        res.redirect('/account');
    });
};

//ユーザーの削除
exports.delete = function(req, res) {
    
    myModel.removeById(res,req.body._id,
        function(res, docs){
            res.render('account/index', { title: 'ユーザー管理', items : docs});
        }
    );
};
function validation(data) {
    var message = '';
    //プロパティチェック
    if (!data.name || !data.mailAddress || !data.password || !data.passwordConfirm) {
        message = 'パラメータが改竄されています';
    }
    if (data.name.trim().length === 0) {
        
    }
    if (data.mailAddress.trim().length === 0) {
        
    }
}