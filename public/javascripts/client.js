//共通的な通知処理を記述する
var socket = io.connect(location.hostname);
socket.send({ cookie: document.cookie });
socket.on('connect', function() {
	console.log('connected');
});
var roomNotification = function (roomName) {
    $().toastmessage('showToast', {
        text     : roomName+'に招待されました',
        sticky   : true,
        type     : 'notice'
    });    
};
var joinRoom = function (id) {
    socket.emit('join room', id);
};
var changeStatus = function(data) {
    //ユーザーエリアのステータス名称を変更
    $('li[name='+data.target+']').children().removeClass();
    $('li[name='+data.target+']').children().addClass(data.statusValue);
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
            document.getElementById("roomListUl").innerHTML = element;
    　　},
    　　error: function(XMLHttpRequest, textStatus, errorThrown) {
            $().toastmessage('showToast', {
                text     : '通信に失敗しました',
                sticky   : true,
                type     : 'error'
            });
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
        
        var target = $(this).attr('id').split('_');
        if (target[0] === 'individualReSend') {
            if($('#individualReMessage').val().trim().length===0)return;
            var data = {
                message: $('#individualReMessage').val(),
                target: $(this).val()
            };
    		socket.emit('individual send', data);
            $('#individualReMessage').val('');
            
        } else if (target[0] === 'individualMessageInfo') {
            
            var closeTarget = 'individualMessageInfo_'+target[1];
            $('#'+closeTarget).fadeToggle("slow");

        } else {
            var closeTarget = 'individualMessageInfo_'+target[1];
            $('#'+closeTarget).fadeToggle("slow");
        }
    });
    
    //部屋の選択
	$('div[name=roomList]').delegate('a[name=roomSelectRadio]', 'click', function() {

        $('li').removeClass("active");
        $(this).parent('li').addClass('active');
        var id = $(this).parent().attr('name');
        $(this).children().remove();
        $('#roomName').html($(this).text());
        $('#memberEditButton').val(id);
        $('#sendButton').val(id);
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
                $('#roomUserList').children().remove();
                var length = data.users.length;
                var toElement = '';
                for (var i = 0; i < length; i++) {
                    $('#roomUserList').append($("<li>",{name: data.users[i]._id}).append(
                        $("<i>",{class: data.users[i].status})).append(data.users[i].name));
                    toElement += '<li><a name="toTarget" href='+data.users[i]._id+'>'+data.users[i].name+'</a></li>';
                }
                document.getElementById("toUl").innerHTML = toElement;

                $('#roomInfomation').html(data.description);
                if (!msgAdd)return;
                var msgLength = data.messages.length;
                for (var j = 0; j < msgLength; j++) {
                    $('#'+id).append($('<ul class="chat"><li class="left clearfix"><!--<span class="chat-img pull-left"><img src="img/ff.gif" alt="User Avatar" class="img-circle" /></span>--><div class="chat-body clearfix"><div class="header"><strong class="primary-font">'+data.messages[j].user.name+'</strong><small class="pull-right text-muted"><i class="fa fa-clock-o fa-fw"></i>'+data.messages[j].time+'</small><p>'+nl2br(escapeHTML(data.messages[j].message))+'</p></div></li></ul></div>'));
                }
                $('#'+id).animate({ scrollTop: getScrolBottom($('#'+id))}, 'slow');
        　　},
        　　error: function(XMLHttpRequest, textStatus, errorThrown) {
                $().toastmessage('showToast', {
                    text     : '情報の取得に失敗しました',
                    sticky   : true,
                    type     : 'error'
                });
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
        var toTarget = $('input[name=toList]:hidden').get();
        var toNum = toTarget.length; 
        var toList = [];
        for (var toIndex=0; toIndex < toNum; toIndex++) {
            toList.push(toTarget[toIndex].value);
        }
        var data = {
            message: $('#message').val(),
            roomId: target,
            toTarget:toList,
            toNameList: $('#toUser').text().trim().substring(1).split('×'),
            roomName:$('#roomName').html(),
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
        var messageAreaId = 'individualPush_'+data.userId;
        var m = '<ul class="chat"><li class="left clearfix"><div class="clearfix"><div name="reseveMessage" class="header"><strong class="primary-font">'+data.userName+'</strong><small class="pull-right text-muted"><i class="fa fa-clock-o fa-fw"></i>'+data.time+'</small><p>'+nl2br(escapeHTML(data.message))+'</p></div></li></ul></div>';
        //同じ人からのメッセージが来ているのかを判定
        if ($('#'+messageAreaId).html()) {
            $('#'+messageAreaId).append(m);
            //すでに画面に表示されていた場合
            if (!$('#'+areaId).is(':visible')) {
                $('#'+areaId).slideToggle("slow");
            }
        } else {
            var element = '';
            var reId = 'individualReSend_'+data.userId;
            var closeId = 'individualClose_'+data.userId;
            var addId = 'individualAdd_'+data.userId;
            element =
                '<div id='+areaId+' class="toggleMessage" style="display: none;">'
                +'<div class="panel panel-info"><div class="panel-heading">'
                +'<button id='+closeId+' type="button" class="close">&times;</button>'
                +'<span>'+data.userName+'</span></div>'
                +'<div class="panel-body"><div id='+messageAreaId+' class="individual-message-box">'+m+'<hr>'
                +'<textarea id="individualReMessage" class="form-control" name="individualReMessage"></textarea></div>'
                +'<div class="panel-footer">'
                +'<button id='+reId+' value='+data.userId+' class="btn btn-primary">Send Massage</button>'
                +'<button id='+addId+' value='+data.userId+' class="btn btn-primary">ドッキング</button>'
                +'</div></div></div>';
            document.getElementById("individualMessageInfo").innerHTML += element;
            $('#'+areaId).slideToggle("slow");
            $('#'+areaId).draggable();
        }
	});
	socket.on('individual my push', function (data) {

        var areaId = 'individualMessageInfo_'+data.targetId;
        var messageAreaId = 'individualPush_'+data.targetId;
        var m = '<ul class="chat"><li class="left clearfix"><div class="clearfix"><div name="reseveMessage" class="header"><strong class="primary-font">'+data.userName+'</strong><small class="pull-right text-muted"><i class="fa fa-clock-o fa-fw"></i>'+data.time+'</small><p>'+nl2br(escapeHTML(data.message))+'</p></div></li></ul></div>';
        //同じ人からのメッセージが来ているのかを判定
        if ($('#'+messageAreaId).html()) {
            $('#'+messageAreaId).append(m);
            //すでに画面に表示されていた場合
            if (!$('#'+areaId).is(':visible')) {
                $('#'+areaId).slideToggle("slow");
            }
        } else {
            var element = '';
            var reId = 'individualReSend_'+data.targetId;
            var closeId = 'individualClose_'+data.targetId;
            var addId = 'individualAdd_'+data.userId;
            element =
                '<div id='+areaId+' class="toggleMessage" style="display: none;">'
                +'<div class="panel panel-info"><div class="panel-heading">'
                +'<button id='+closeId+' type="button" class="close">&times;</button>'
                +'<span>'+data.targetName+'</span></div>'
                +'<div class="panel-body"><div id='+messageAreaId+' class="individual-message-box">'+m+'<hr>'
                +'<textarea id="individualReMessage" class="form-control" name="individualReMessage"></textarea></div>'
                +'<div class="panel-footer">'
                +'<button id='+reId+' value='+data.targetId+' class="btn btn-primary">Send Massage</button>'
                +'<button id='+addId+' value='+data.targetId+' class="btn btn-primary">ドッキング</button>'
                +'</div></div></div>';
            document.getElementById("individualMessageInfo").innerHTML += element;
            $('#'+areaId).slideToggle("slow");
            $('#'+areaId).draggable();
        }
	});
	//サーバーが受け取ったメッセージを返して実行する
	socket.on('msg push', function (data) {
		//ここはオブジェクト生成にする
		console.log(data.toNameList);
		if (data.toNameList[0] === '') {
            $('#'+data.roomId).append($('<ul class="chat"><li class="left clearfix"><!--<span class="chat-img pull-left"><img src="img/ff.gif" alt="User Avatar" class="img-circle" /></span>--><div class="chat-body clearfix"><div name="reseveMessage" class="header"><strong class="primary-font">'+data.userName+'</strong><small class="pull-right text-muted"><i class="fa fa-clock-o fa-fw"></i>'+data.time+'</small><p>'+nl2br(escapeHTML(data.message))+'</p></div></li></ul></div>'));
		}else {
            $('#'+data.roomId).append(
                $('<ul class="chat"><li class="left clearfix"><!--<span class="chat-img pull-left"><img src="img/ff.gif" alt="User Avatar" class="img-circle" /></span>--><div class="chat-body clearfix"><div name="reseveMessage" class="header"><strong class="primary-font">'+data.userName+'</strong><small class="pull-right text-muted"><i class="fa fa-clock-o fa-fw"></i>'+data.time+'</small><p><span class="label label-success text-center">TO</span>'+' &nbsp;'+data.toNameList.join()+'</p><p>'+nl2br(escapeHTML(data.message))+'</p></div></li></ul></div>'));
		}
		var target = $('div[name=roomList]').find(".active").attr("name");
		if (target != data.roomId) {
            var num = $('span[name='+data.roomId+']').html();
            if (num === undefined) {
                $('li[name='+data.roomId+']').children().append($('<span>',{class:"badge pull-right",name: data.roomId}).text(1));
            } else {
                var newNum = Number(num)+1;
                $('span[name='+data.roomId+']').text(newNum);
            }
		}
		var toNum = data.toTarget.length;
		var my = $('#cryptoId').val();
		$('div[name=roomList]').find(".active").attr("name");
		var roomName = $('li[name='+data.roomId+']').text();
		for (var toTargetIndex=0; toTargetIndex < toNum; toTargetIndex++) {
		    if (my == data.toTarget[toTargetIndex]) {
                $().toastmessage('showToast', {
                    text     : '['+data.roomName+']<br>'+'にTOで指定されたメッセージがあります',
                    sticky   : true,
                    type     : 'notice'
                });
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
	socket.on('login push', function(data){
        $().toastmessage('showToast', {
            text     : data.name+'<br>'+'さんがログインしました',
            sticky   : false,
            type     : 'notice'
        });
        changeStatus(data);
    });
    //ステータス変更通知
	socket.on('status changed', function(data){
	    changeStatus(data);
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
	//過去のメッセージを取得
	$('a[name=beforeday]').click(function(){
        var data = {roomId: $('#sendButton').val(), status:$(this).attr('id')};
		socket.emit('get beforeday', data);
		return false;
	});
	socket.on('beforeday push', function(data) {
	    
        var msgLength = data.messages.length;
        $('#'+data.roomId).children().remove();
        for (var msgIndex = 0; msgIndex < msgLength; msgIndex++) {
    		if (data.messages[msgIndex].to.names[0] === '') {

                $('#'+data.roomId).append($('<ul class="chat"><li class="left clearfix"><!--<span class="chat-img pull-left"><img src="img/ff.gif" alt="User Avatar" class="img-circle" /></span>--><div class="chat-body clearfix"><div name="reseveMessage" class="header"><strong class="primary-font">'+data.messages[msgIndex].user.name+'</strong><small class="pull-right text-muted"><i class="fa fa-clock-o fa-fw"></i>'+data.messages[msgIndex].time+'</small><p>'+nl2br(escapeHTML(data.messages[msgIndex].message))+'</p></div></li></ul></div>'));
    		}else {
    		    console.log('to apend');
                $('#'+data.roomId).append(
                    $('<ul class="chat"><li class="left clearfix"><!--<span class="chat-img pull-left"><img src="img/ff.gif" alt="User Avatar" class="img-circle" /></span>--><div class="chat-body clearfix"><div name="reseveMessage" class="header"><strong class="primary-font">'+data.messages[msgIndex].user.name+'</strong><small class="pull-right text-muted"><i class="fa fa-clock-o fa-fw"></i>'+data.messages[msgIndex].time+'</small><p><span class="label label-success text-center">TO</span>'+' &nbsp;'+data.messages[msgIndex].to.names.join()+'</p><p>'+nl2br(escapeHTML(data.messages[msgIndex].message))+'</p></div></li></ul></div>'));
    		}
        }
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
                $().toastmessage('showToast', {
                    text     : '情報の取得に失敗しました',
                    sticky   : true,
                    type     : 'error'
                });
                console.log(XMLHttpRequest);
                console.log(textStatus);
            },
        });
	});
	//ログアウト
	$('#logout').click(function(){
        socket.emit('logout unload');
	});
	//ブラウザクローズ
    $(window).on("beforeunload",function(e) {
        socket.emit('logout unload');
    });
});