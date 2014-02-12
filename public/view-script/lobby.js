$(function() {
    
    $("a[name=moveChat]").click(function() {
        var data = {room :$(this).attr('id')};
        createFormSubmitByParam('/chat', data);
        return false;
    });
    
    socket.emit('login notice');

	//サーバーが受け取ったメッセージを返して実行する
	socket.on('msg push lobby', function (data) {
	    console.log('msg push lobby');
        var num = $('span[name='+data.roomId+']').html();
        if (num  !== undefined) {
            var unReadNum = Number(num)+1;
            $('span[name='+data.roomId+']').text(unReadNum);
            updateUnReadNum(data.roomId, unReadNum);
        }
	});

});
