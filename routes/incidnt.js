/**
 * incidnt modeule
 * @namespace routes
 * @modeule tags.js
 */
var moment =require('moment');
var async = require('async');
/**
 * incidnt
 * */
var monitorModel = require('../model/monitorModel');
var monitor = new monitorModel();
/**
 * リクエストを受け取り、incidnt画面を描画する
 * 
 * @author niikawa
 * @method index
 * @param {Object} req 画面からのリクエスト
 * @param {Object} res 画面へのレスポンス
 */
exports.index = function(req, res){
    if (req.session.isLogin) {
        var activePage = (req.query.pages) ? (req.query.pages) : 1;
        var limit = 3;
        var skip = (activePage-1) * limit;
        var status = (req.query.status) ? Number(req.query.status) : 0;
        var prop = (status !== 0) ? 'status' : null;
        async.series(
            [function(callback) {
                monitor.getMonitor(status, skip, limit, callback);
            },function(callback) {
                console.log(prop);
                monitor.count(prop, status, callback);
            }]
            ,function(err, result) {
                console.log(result[1]);
                setStatusDispName(result[0]);
                result[0].pageNum = Math.ceil(result[1] / limit);
                res.render('chat/incidnt', 
                { title: 'incidnt管理', incidnts: result[0], status: status, 
                    activePage: activePage, _id: req.session._id,userName: req.session.name, role:req.session.role});
            }
        );
        
    } else {
        res.render('login', {title: 'LOGIN', errMsg:''});
    }
};
/**
 * リクエストを受け取り、IDに合致した定型文を取得する（ajax）
 * 
 * @author niikawa
 * @method getTagsById
 * @param {Object} req 画面からのリクエスト
 * @param {Object} res 画面へのレスポンス
 */
exports.getTagsById = function(req, res) {
};
/**
 * リクエストを受け取り、ステータスを更新する
 * 
 * @author niikawa
 * @method changeStatus
 * @param {Object} req 画面からのリクエスト
 * @param {Object} res 画面へのレスポンス
 */
exports.changeStatus = function(req, res) {
    
    if (req.body._id) {
        var data = {_id:req.body._id, status:req.body.status, userId:req.session._id};
        monitor.changeStatus(data, function(err){
            if (!err)res.send({msg:'ok'});
        });
    } else {
        
    }
};
/**
 * リクエストを受け取り、タグを作成する
 * 
 * @author niikawa
 * @method lobby
 * @param {Object} req 画面からのリクエスト
 * @param {Object} res 画面へのレスポンス
 */
function setStatusDispName(data) {
    
    var num = data.length;
    for (var index=0; index < num ; index++) {
        
        switch (data[index].status) {
            
            case 1:
                data[index].statusName = 'open';
                break;
            case 2: 
                data[index].statusName = 'in progress';
                break;
            case 3: 
                data[index].statusName = 'close';
                break;
            case 9: 
                data[index].statusName = 'remove';
                break;
            default: 
                data[index].statusName = 'Unknown';
                break;
        }
    }
}

/**
 * リクエストを受け取り、タグを削除する
 * 
 * @author niikawa
 * @method lobby
 * @param {Object} req 画面からのリクエスト
 * @param {Object} res 画面へのレスポンス
 */
exports.delete = function(req, res) {
};