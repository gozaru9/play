$(function() {
    $('input[name=statusRadio]:radio').change(function(){
        
        $('tr').hide(500);
        var name = '';
        switch(Number($(this).val())) {
            case 1: name = 'open'; break;
            case 2: name = 'progress'; break;
            case 3: name = 'close'; break;
            case 9: name = 'remove'; break;
            default: name = ''; break;
        }
        console.log(name);
        if (name === '') {
            $('tr').show(500);
        } else {
            $('tr[name='+name+']').show(500);
        }
        var changedata = {status:$(this).val()};
/*        
        $.ajax({
            type: 'POST',
            url: '/incidnt/changeStatus',
            dataType: 'json',
            data: changedata,
            cache: false,
            success: function(data) {
               $('tr[name=close]').hide(500);
        　　},
        　　error: function(XMLHttpRequest, textStatus, errorThrown) {
                $().toastmessage('showToast', {
                    text     : 'データ取得に失敗しました',
                    sticky   : true,
                    type     : 'error'
                });
                console.log(XMLHttpRequest);
                console.log(textStatus);
        　　},
        });
*/
        
    });
    $('ul[name=statusList]').delegate('a', 'click', function(){
        
        $(this).parent().parent().parent().children('a').text($(this).text());
        $(this).parent().parent().parent().parent().parent().attr('name', 'close');
        if ($(this).parent().parent().parent().children('a').attr('href') && $(this).attr('value') !== 0) {
            
            var updatdata = {
                _id:$(this).parent().parent().parent().children('a').attr('href'),
                status:$(this).attr('value')};
            $.ajax({
                type: 'POST',
                url: '/incidnt/changeStatus',
                dataType: 'json',
                data: updatdata,
                cache: false,
                success: function(data) {
                   $('tr[name=close]').hide(500);
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