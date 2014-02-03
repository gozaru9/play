/**
 * aouth認証
 * */
 
var crypto = require('crypto');
var userModel = require('userModel');
var secretKey = "gozaru9"; 
var LocalStrategy = require("passport-local").Strategy

module.exports = function(passport) {

    // passport session setup
    // シリアライズの設定をしないと、user.passwordでパスワードがポロリする可能性があるので、必要な項目だけ持たせる
    passport.serializeUser(function(user, done) {
        done(null, {email: user.mailAddress, _id: user._id});
    });
    
    passport.deserializeUser(function(id, done) {
        userModel.findById(id, function(err, user){
            done(err, user);
        });
    });
    
    // LocalStrategyを使う設定
    passport.use(new LocalStrategy( {
        usernameField: "mailAddress", 
        passwordField: "password"
    },
    function(email, password, done) {
        
        // 非同期で処理
        process.nextTick(function() {
            
            User.findOne({email: email}, function(err, user){
                if(err) {
                    
                    return done(err);
                }
                if(!user) {
                    
                    return done(null, false, {message: "ユーザーが見つかりませんでした。"});
                }
                if(user.password !== getHash(password)) {
                    
                    return done(null, false, {message: "パスワードが間違っています。"});
                }
                return done(null, user);
            });
        });
    }));
};

var getHash = function(target){
        var sha = crypto.createHmac("md5", secretKey);
            sha.update(target);
                return sha.digest("hex");
};
