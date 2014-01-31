/**
 * 改行コードをBRタグに変換
 * 
 * @author niikawa
 */
function nl2br(str) { return str.replace(/[\n\r]/g, "<br />");}
/**
 * クロスサイトスクリプティング対策のエスケープ
 * @author niikawa
 * */
var escapeHTML = function(val) {return $('<div />').text(val).html();};
/**
 * 前後トリム（クロスブラウザ対応版）
 * @author niikawa
 * */
String.prototype.trim = function() {
    return this.replace( /^[ 　\t\r\n]+|[ 　\t\r\n]+$/, "" );
};
/**
 * フォーマットに対応した日時を作成する
 * @author niikawa
 * */
function getDate() {
    
}
 