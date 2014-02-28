/**
 * tags modeule
 * @namespace routes
 * @modeule tags.js
 */
/**
 * タグ
 * */
var async = require('async');
var define = require('../config/define.js');
var utilsClass = require('../util/utils');
var utils = new utilsClass(); 
var tagsModel = require('../model/tagsModel');
var tags = new tagsModel();
/**
 * リクエストを受け取り、tags画面を描画する
 * 
 * @author niikawa
 * @method index
 * @param {Object} req 画面からのリクエスト
 * @param {Object} res 画面へのレスポンス
 */
exports.index = function(req, res){
    if (req.session.isLogin) {
        
        var activePage = (req.query.pages) ? Number(req.query.pages) : 1;
        var skip = (activePage-1) * define.TAG_PAGER_LIMIT_NUM;
        async.series(
            [function(callback) {
                
                tags.getTags(skip, define.TAG_PAGER_LIMIT_NUM, callback);

            },function(callback) {
                
                tags.count(callback);
            }]
            ,function(err, result) {
                //ページング処理
                var maxPage = Math.ceil(result[1] / define.TAG_PAGER_LIMIT_NUM);
                var pager = utils.pager(activePage, maxPage, define.TAG_PAGER_NUM);
                
                res.render('chat/tags', 
                    { title: 'タグ管理', tags: result[0], pager:pager, total:result[1],
                        _id: req.session._id, userName: req.session.name, role:req.session.role});
            }
        );

    } else {
        res.render('login', {title: 'LOGIN', errMsg:''});
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
exports.create = function(req, res){
    
    console.log('-------------------tags create -------------');
    tags.exists('name', req.body.name, function(err, count){
        console.log(count);
        if (count) {
                
            tags.save(req, function(err) {
                res.redirect('/tags');
            });
        } else {
            
            res.redirect('/tags');
        }
    });
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
    
    if (req.body.id) {
        
        async.series(
            [function(callback) {
                tags.getById(req.body.id, callback);
            }]
            ,function(err, result) {
                console.log(result[0]);
                res.send({target: result[0]});
            }
        );
    }
};
/**
 * リクエストを受け取り、タグを更新する
 * 
 * @author niikawa
 * @method lobby
 * @param {Object} req 画面からのリクエスト
 * @param {Object} res 画面へのレスポンス
 */
exports.update = function(req, res) {
    
    tags.update(req.body, function(error) {
        
        console.log(error);
        if (error.status) {
            
            tags.getAll(res,
                function(err, docs){
                    res.render('chat/tags', 
                    { title: 'タグ管理', tags: docs,_id: req.session._id,
                        userName: req.session.name, error: error});
                }
            );
        } else {
            
            res.redirect('/tags');
        }
    });
};
/**
 * リクエストを受け取り、タグを削除する
 * 
 * @author niikawa
 * @method lobby
 * @param {Object} req 画面からのリクエスト
 * @param {Object} res 画面へのレスポンス
 */
exports.delete = function(req, res) {
    console.log('--------tags delete------');
    if (req.body._id) tags.remove(req.body._id);
    res.redirect('/tags');
};