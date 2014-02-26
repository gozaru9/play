//ユーザーモデルを読み込む
var userModel = require('../model/userModel');
var myModel = new userModel();

//ユーザーの一覧を取得し画面描画
exports.index = function(req, res){

        myModel.getAll(res,
            function(res,docs){
                
                var data = {users: docs, message: ''};
                res.render('account/index', 
                { title: 'ユーザー管理', items: data, _id: req.session._id, userName:req.session.name});
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

exports.validation = function(req, res) {
    console.log('account validation');
    console.log(req.body);
    var validationInfo = validation(req.body);
    if (validationInfo.status) res.send(validationInfo);
    myModel.exsitsMailAddress(req.body.accountId, req.body.mailAddress, function(err, count) {
        
        if (count !== 0) {
            validationInfo.status = true;
            validationInfo.target = [];
            validationInfo.message = 'すでに使用されているメールアドレスです';
        }
        res.send({validationInfo: validationInfo});
    });
};

//ユーザーの更新
exports.update = function(req, res) {
    
    myModel.exsitsMailAddress(req.body.accountId, req.body.mailAddress, function(err, count) {

        if (count !== 0) {

            myModel.getAll(res, function(res, docs){
                var data = {users: docs, message: 'すでに使用されているメールアドレスです'};
                res.render('account/index', 
                { title: 'ユーザー管理', items: data, _id: req.session._id, userName:req.session.name});
            });
        }
        
        myModel.update(req, function(err) {
            
            res.redirect('/account');
        });
    });
};

//ユーザーの削除
exports.delete = function(req, res) {
    
    myModel.removeById(res,req.body._id,
        function(){
            res.redirect('/account');
        }
    );
};
function validation(data) {
    var validationInfo = {status: false, target:[], message: ''};
    //プロパティチェック
    if (!data.name || !data.mailAddress || !data.password || !data.passwordConfirm) {
        validationInfo.message = 'パラメータが改竄されています';
    }
    if (data.name.trim().length === 0) {
        validationInfo.message = 'ユーザー名は必須です';
    }
    if (data.mailAddress.trim().length === 0) {
        
        validationInfo.message = 'メールアドレス名は必須です';
    }
    if (data.password.trim().length === 0) {
        
        validationInfo.message = 'パスワードは必須です';
    }
    if (data.password.trim() !== data.passwordConfirm.trim()) {
        validationInfo.message = '入力されたパスワードが一致しません。';
    }
    if (validationInfo.message !== '') validationInfo.status = true;
    return validationInfo;
}