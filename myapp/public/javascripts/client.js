
//パフォーマンスを考慮しappendはしない

var socket = io.connect('https://play-c9-gozaru9.c9.io');
socket.send({ cookie: document.cookie });
socket.on('connect', function() {
	console.log('connected');
});
var roomNotification = function (roomName) {
    $('#msgRoom').text(roomName);
    $('#messageInfo').slideToggle("slow");
    $("#messageInfo").delay(5000).slideToggle("slow");
};
var joinRoom = function (id) {
    
    console.log('call test functino!');
    socket.emit('join room', id);
};
var getMyRoom = function (isMyCreate, roomName) {
        
    $.ajax({
        type: 'POST',
        url: '/chat/getMyRoom',
        dataType: 'json',
        cache: false,
        success: function(data) {
            if (!isMyCreate) {
                roomNotification(roomName);
            }
            $('#roomListUl').children().remove();
            var roomLength = data.rooms.length;
            var rooms = data.rooms;
            var element = '';
            for (var i=0; i < roomLength; i++) {
                element += '<li name=' + rooms[i]._id + '><a name="roomSelectRadio" href="#">'+ rooms[i].name + '</a></li>';
            }
            console.log(element);
            document.getElementById("roomListUl").innerHTML = element;
    　　},
    　　error: function(XMLHttpRequest, textStatus, errorThrown) {
    　　    console.log(XMLHttpRequest);
    　　    console.log(textStatus);
    　　},
    });
};

var selectedRoom = function (mine) {

    $('#roomName').html($(mine).parent().text());
    var id = $(mine).val();
    $('#memberEditButton').val(id);
    var target = $('#roomContents').find(".active").attr("id");
    if (id === target)return;
    $('#'+target).hide(500);
    $('#'+target).removeClass("active");
    var msgAdd = false;
    if ($('#'+id).length === 0) {
        msgAdd = true;
        console.log('room join');
        socket.emit('join room', id);
        var element = $("<div>", {class: "panel-body active", id: id});
        $('#roomContents').append(element).show(500);
    } else {
        $('#'+id).show(500);
        $('#'+id).addClass('active');
    }

    $.ajax({
        type: 'POST',
        url: '/chat/getUserByRoomId',
        dataType: 'json',
        data: ({roomId:id}),
        cache: false,
        success: function(data) {
            $('#roomUserList').children().remove();
            var length = data.users.length;
            for (var i = 0; i < length; i++) {
                $('#roomUserList').append($("<li>").append(
                    $("<i>",{class: "fa fa-check-circle fa-fw"})).append(data.users[i].name));
            }
            if (!msgAdd)return;
            var msgLength = data.messages.length;
            for (var j = 0; j < msgLength; j++) {
                $('#'+id).append($('<ul class="chat"><li class="left clearfix"><!--<span class="chat-img pull-left"><img src="img/ff.gif" alt="User Avatar" class="img-circle" /></span>--><div class="chat-body clearfix"><div class="header"><strong class="primary-font">'+data.messages[j].user.name+'</strong><small class="pull-right text-muted"><i class="fa fa-clock-o fa-fw"></i>'+data.messages[j].time+'</small><p>'+nl2br(escapeHTML(data.messages[j].msg))+'</p></div></li></ul></div>'));
            }
            $('#'+id).animate({ scrollTop: getScrolBottom($('#'+id))}, 'slow');
    　　},
    　　error: function(XMLHttpRequest, textStatus, errorThrown) {
    　　    console.log(XMLHttpRequest);
    　　    console.log(textStatus);
    　　},
    });
};

$(function() {
    
	(function clock() {
        var now = new Date();
        var hour = now.getHours(); // 時
        var min = now.getMinutes(); // 分
        var sec = now.getSeconds(); // 秒
        hour = ('0' + hour).slice(-2);
        min = ('0' + min).slice(-2);
        sec = ('0' + sec).slice(-2);
        var ymd = now.getFullYear() + '/' + now.getMonth()+1 +'/'+now.getDate();
        $('#today').html(ymd + ' ' + hour + ':' + min + ':' + sec);
        setTimeout(clock, 1000);
	})();
	//個人への送信エリア制御
	$('#individual').delegate('a', 'click', function() {
	    
	    if ($('#individualSend').val() != $(this).attr('name')) {
    	    $('#individualname').text($(this).text());
    	    $('#individualMessage').text('');
    	    $('#individualSend').val($(this).attr('name'));
	    } else {
	        
            $('#individualMessageDiv').fadeToggle("slow");
	    }
	   return false; 
	});
    //個人メッセージエリアを閉じる
    $('#individualClose').click(function() {
        $('#individualMessageDiv').fadeToggle("slow");
    });
    //個人への返信
    $('#individualMessageInfo').delegate('button', 'click', function() {
        var closeVale = $(this).attr('id').split('_');
        var closeTarget = 'individualMessageInfo_'+closeVale[1];
        
        console.log('返信ボタンのイベント');
        console.log(closeTarget);
        $('#'+closeTarget).fadeToggle("slow");

    });
    
    //部屋の選択
	$('#roomList').delegate('a[name=roomSelectRadio]', 'click', function() {

        $('li').removeClass("active");
        $(this).parent('li').addClass('active');
        var id = $(this).parent().attr('name');
        $(this).children().remove();
        $('#roomName').html($(this).text());
        $('#memberEditButton').val(id);
        var target = $('#roomContents').find(".active").attr("id");
        $('#'+target).hide(500);
        $('#'+target).removeClass("active");
        var msgAdd = false;
        if ($('#'+id).length === 0) {
            msgAdd = true;
            console.log('room join');
            socket.emit('join room', id);
            var element = $("<div>", {class: "panel-body active", id: id});
            $('#roomContents').append(element).show(500);
        } else {
            $('#'+id).show(500);
            $('#'+id).addClass('active');
        }
    
        $.ajax({
            type: 'POST',
            url: '/chat/getUserByRoomId',
            dataType: 'json',
            data: ({roomId:id}),
            cache: false,
            success: function(data) {
                console.log(data);
                $('#roomUserList').children().remove();
                var length = data.users.length;
                for (var i = 0; i < length; i++) {
                    console.log(data.users[i].name);
                    $('#roomUserList').append($("<li>",{name: data.users[i]._id}).append(
                        $("<i>",{class: data.users[i].status})).append(data.users[i].name));
                }
                if (!msgAdd)return;
                var msgLength = data.messages.length;
                for (var j = 0; j < msgLength; j++) {
                    $('#'+id).append($('<ul class="chat"><li class="left clearfix"><!--<span class="chat-img pull-left"><img src="img/ff.gif" alt="User Avatar" class="img-circle" /></span>--><div class="chat-body clearfix"><div class="header"><strong class="primary-font">'+data.messages[j].user.name+'</strong><small class="pull-right text-muted"><i class="fa fa-clock-o fa-fw"></i>'+data.messages[j].time+'</small><p>'+nl2br(escapeHTML(data.messages[j].msg))+'</p></div></li></ul></div>'));
                }
                $('#'+id).animate({ scrollTop: getScrolBottom($('#'+id))}, 'slow');
        　　},
        　　error: function(XMLHttpRequest, textStatus, errorThrown) {
        　　    console.log(XMLHttpRequest);
        　　    console.log(textStatus);
        　　},
        });
        return false;
    });
    //個人へのメッセージ送信
    $('#individualSend').click(function() {
        if($('#individualMessage').val().trim().length===0)return;
        var data = {
            message: $('#individualMessage').val(),
            target: $('#individualSend').val()
        };
		socket.emit('individual send', data);
        $('#individualMessage').val('');
    });
	//メッセージ送信
	$('#sendButton').click(function() {
        if($('#message').val().trim().length===0)return;
        var target = $('#roomContents').find(".active").attr("id");
        var data = {
            message: $('#message').val(),
            roomId: target
        };
		socket.emit('msg send', data);
        $('#message').val('');
	});
	//部屋とのコネクションを削除
	$('#leaveButton').click(function() {
        var target = $('#roomHead').find(".active").attr("name");
		//サーバーにメッセージを引数にイベントを実行する
		socket.emit('leave room', target);
	});
	//全体メッセージ
	$('#allSend').click(function() {
        if($('#message').val().trim().length===0)return;
		socket.emit('all send', $('#allMessage').val());
	});
	//個人へのメッセージプッシュ
	socket.on('individual push', function (data) {

        var areaId = 'individualMessageInfo_'+data.userId;
        var messageAreaId = 'individualPush_'+data.target;
        var reId = 'individualReSend_'+data.target;
        var pushMessage = $('#'+messageAreaId).text();
        var element = '';
        console.log(pushMessage);
        //同じ人からのメッセージが来ているのかを判定
        if (pushMessage) {
            pushMessage += '<br>'+data.message;
            $('#'+messageAreaId).text(nl2br(escapeHTML(data.message)));
        } else {
            element =
                '<div id='+areaId+' class="toggleMessage" style="display: none;">'
                +'<div class="panel panel-info"><div class="panel-heading">'
                +'<span>'+data.userName+'</span></div>'
                +'<div class="panel-body"><span id='+messageAreaId+'>'+nl2br(escapeHTML(data.message))+'</span></div>'
                +'<div class="panel-footer">'
                +'<button id='+reId+' class="btn btn-primary">返信する</button>'
                +'</div></div></div>';
            document.getElementById("individualMessageInfo").innerHTML += element;
        }
        $('#'+areaId).slideToggle("slow");
	});
	//サーバーが受け取ったメッセージを返して実行する
	socket.on('msg push', function (data) {
		//ここはオブジェクト生成にする
        $('#'+data.roomId).append($('<ul class="chat"><li class="left clearfix"><!--<span class="chat-img pull-left"><img src="img/ff.gif" alt="User Avatar" class="img-circle" /></span>--><div class="chat-body clearfix"><div name="reseveMessage" class="header"><strong class="primary-font">'+data.userName+'</strong><small class="pull-right text-muted"><i class="fa fa-clock-o fa-fw"></i>'+data.time+'</small><p>'+nl2br(escapeHTML(data.message))+'</p></div></li></ul></div>'));
		var target = $('#roomList').find(".active").attr("name");
		console.log(target); 
		console.log(data.roomId); 
		if (target != data.roomId) {
            var num = $('span[name='+data.roomId+']').html();
            if (num === undefined) {
                $('li[name='+data.roomId+']').children().append($('<span>',{class:"badge pull-right",name: data.roomId}).text(1));
            } else {
                var newNum = Number(num)+1;
                $('span[name='+data.roomId+']').text(newNum);
            }
		}
        $('#'+data.roomId).animate({ scrollTop: getScrolBottom($('#'+data.roomId))}, 'slow');
	});
	
	//サーバーが受け取ったメッセージを返して実行する
	socket.on('all push', function (msg) {
		$('#all').prepend($('<div class="alert alert-info alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button><span>'+nl2br(escapeHTML(msg))+'</span></div>'));
		$('#allMessage').val('');
	});
	
    //ステータスの変更
    $('a[name="statusChange"]').on('click', function(){
        
        //サーバーにログイン状態の変更を通知する
        var msg = {status:$(this).attr('id')};
        socket.emit('status change', msg);
    });
    
    //ステータス変更通知
	socket.on('status changed', function(msg){
        //ユーザーエリアのステータス名称を変更
        $('li[name='+msg.target+']').children().removeClass();
        $('li[name='+msg.target+']').children().addClass(msg.statusValue);
        return false;
	});
	//招待された部屋の通知
	socket.on('create chat msg', function(roomName) {
        getMyRoom(false, roomName);
	});
	//ルーム作成完了
	socket.on('create chat complete', function(msg) {
        getMyRoom(true, msg);
	});
	//メッセージマウスオーバー
	$('div[name=reseveMessage]').mouseover(function(){

	});
	$('div[name=reseveMessage]').mouseout(function(){
        
	});
	
	$('a[name=beforeday]').click(function(){
//	    alert('実装中');
	});
	//ユーザーの追加/変更
	$('#memberEditButton').click(function(){
   
        var id = $(this).val();
        $('#selectEditMember').children().remove();
        $('#selectedEditMember').children().remove();
        $.ajax({
            type: 'POST',
            url: '/chat/getUserByRoomId',
            dataType: 'json',
            data: ({roomId:id}),
            cache: false,
            success: function(data) {
                var length = data.users.length;
                for (var i = 0; i < length; i++) {
                    $('#selectedEditMember').append($('<option>',{value:data.users[i]._id}).append(data.users[i].name));
                }
                var allLength = data.allUsers.length;
                for (var j = 0; j < allLength; j++) {
                    $('#selectEditMember').append($('<option>',{value:data.allUsers[j]._id}).append(data.allUsers[j].name));
                }
        　　},
        　　error: function(XMLHttpRequest, textStatus, errorThrown) {
        　　    console.log(XMLHttpRequest);
        　　    console.log(textStatus);
        　　},
        });
	});
});