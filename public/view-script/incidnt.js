var check = function(val) {
    switch(Number(val)) {
        case 1:
        case 2:
        case 3:
        case 9:
            return true;
        default:
            return false;
    }
};
$(function() {
    $('input[name=statusRadio]:radio').change(function(){
        
        location.href="/incidnt/?status="+$(this).val();
    });
    $('ul[name=statusList]').delegate('a', 'click', function(){
        
        $(this).parent().parent().parent().parent().parent().attr('name', 'close');
        if ($(this).parent().parent().parent().children('a').attr('href') && check($(this).attr('value'))) {
            
            var updatdata = {
                _id:$(this).parent().parent().parent().children('a').attr('href'),
                defore:$(this).text(),
                status:$(this).attr('value')};
            $.ajax({
                type: 'POST',
                url: '/incidnt/changeStatus',
                dataType: 'json',
                data: updatdata,
                cache: false,
                success: function(data) {
                    $(this).parent().parent().parent().children('a').text($(this).text());
                    $('tr[name=close]').hide(500);
                    var socket = io.connect(location.hostname);
                    socket.emit('incident status change', updatdata);
            　　},
            　　error: function(XMLHttpRequest, textStatus, errorThrown) {
                    $().toastmessage('showToast', {
                        text     : 'ステータスの更新に失敗しました',
                        sticky   : true,
                        type     : 'error'
                    });
                    console.log(XMLHttpRequest);
                    console.log(textStatus);
            　　},
            });
        }
        $('div').removeClass("open");
        return false;
    });
});