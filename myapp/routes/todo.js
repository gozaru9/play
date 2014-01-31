/**
 * TODO
 * */
//
var todoModel = require('../model/todoModel');
var model = new todoModel();

exports.index = function(req, res){
    
    model.getAll(res,
            function(res,docs){
                res.send({items : docs});
            }
        );
};

exports.regist = function(req, res){

    try {
        
        model.save(req, res, 
            function(res){
                res.send({msg:'ok!'});
        });
        
    } catch(e){
        
        //共通処理にしたい
        console.log('user save failed');
    }
};

//削除
exports.delete = function(req, res) {

    if (null === req.body._id) {
        
        console.log('id is noting');
        console.log(req.body);
        
    } else {

    }

    model.removeById(res,req.body._id,
        function(res){
            res.send({msg:'ok!'});
        }
    );
};