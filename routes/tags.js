/**
 * tags modeule
 * @namespace routes
 * @modeule tags.js
 */
var moment =require('moment');
var async = require('async');
/**
 * タグ
 * */
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
        tags.getAll(res,
            function(res,docs){
                res.render('chat/tags', 
                { title: 'タグ管理', tags: docs,_id: req.session._id,userName: req.session.name});
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
                
                tags.getAll(res,
                    function(res,docs){
                        res.render('chat/tags', 
                        { title: 'タグ管理', tags: docs,_id: req.session._id,
                            userName: req.session.name, error: []});
                    }
                );
            });
        } else {
            
            tags.getAll(res,
                function(res,docs){
                    res.render('chat/tags', 
                    { title: 'タグ管理', tags: docs,_id: req.session._id,
                        userName: req.session.name, error:[]});
                }
            );
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