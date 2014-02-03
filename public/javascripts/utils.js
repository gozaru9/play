function nl2br(str){return str.replace(/[\n\r]/g, "<br />");}
function escapeHTML(val) {return $('<div />').text(val).html();}
String.prototype.trim = function() {return this.replace( /^[ 　\t\r\n]+|[ 　\t\r\n]+$/, "" );};

function selectMove(_this, target, optiondelete) {
    $("select[name=" + _this + "] option:selected").each(function() {
        var exists = false;
        var select = $(this).val();
        $("select[name=" + target + "] option").each(function() {
            if(select === $(this).val()) {
                exists = true;
                return false;
            }
        })
        if (!exists) $("select[name=" + target + "]").append($(this).clone());
        if (optiondelete) $(this).remove();
    });
};
function selectDelete(_this) {
    $("select[name=" + _this + "] option:selected").each(function() {
        $(this).remove();
    });
}
function getScrolBottom(element) {
    
//    return $(element).scrollTop() + $(element).height();
    return 10000;
}