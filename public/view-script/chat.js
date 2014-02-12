var socket = io.connect(location.hostname);
var clearRoomItem = function() {
    $('#createRoomName').val('');
    $('#roomDescription').val('');
    $('#chatCreateButton').attr("disabled", "disabled");
    $("select[name=selectedMember]").children().remove();
};
var ceateButtonCheck = function() {
    if ( $('#createRoomName').val().trim().length !== 0 
        && $('#selectedMember option' ).length !== 0 ) {
        $('#chatCreateButton').removeAttr("disabled");
    } else {
        $('#chatCreateButton').attr("disabled", "disabled");
    }
};
var memberEditCompleteButtonCheck = function (){
    if ( $('#selectedEditMember option' ).length !== 0 ) {
        $('#memberEditCompleteButton').removeAttr("disabled");
    } else {
        $('#memberEditCompleteButton').attr("disabled", "disabled");
    }
};
var createMemberList = function(users) {
    $('#roomUserList').children().remove();
    var length = users.length;
    var toElement = '';
    for (var i = 0; i < length; i++) {
        console.log(users[i].name);
        $('#roomUserList').append($("<li>",{name: users[i]._id}).append(
            $("<i>",{class: users[i].status})).append(users[i].name));
        toElement += '<li><a name="toTarget" href="#">'+users[i].name+'</a></li>';
    }
    document.getElementById("toUl").innerHTML = toElement;
};
$(function() {
    /* chat **/
	//サーバーが受け取ったメッセージを返して実行する
	socket.on('msg push', function (data) {
		if (data.toNameList[0] === '') {
            $('#'+data.roomId).append($('<ul class="chat"><li class="left clearfix"><!--<span class="chat-img pull-left"><img src="img/ff.gif" alt="User Avatar" class="img-circle" /></span>--><div class="chat-body clearfix"><div name="reseveMessage" class="header"><strong class="primary-font">'+data.userName+'</strong><small class="pull-right text-muted"><i class="fa fa-clock-o fa-fw"></i>'+data.time+'</small><p>'+nl2br(escapeHTML(data.message))+'</p></div></li></ul></div>'));
		}else {
            $('#'+data.roomId).append(
                $('<ul class="chat"><li class="left clearfix"><!--<span class="chat-img pull-left"><img src="img/ff.gif" alt="User Avatar" class="img-circle" /></span>--><div class="chat-body clearfix"><div name="reseveMessage" class="header"><strong class="primary-font">'+data.userName+'</strong><small class="pull-right text-muted"><i class="fa fa-clock-o fa-fw"></i>'+data.time+'</small><p><span class="label label-success text-center">TO</span>'+' &nbsp;'+data.toNameList.join()+'</p><p>'+nl2br(escapeHTML(data.message))+'</p></div></li></ul></div>'));
		}
		var target = $('div[name*=roomList]').find(".active").attr("name");
		if (target != data.roomId) {
            var num = $('span[name='+data.roomId+']').html();
            var unReadNum = 1;
            if (num === undefined) {
                $('li[name='+data.roomId+']').children().append($('<span>',{class:"badge pull-right",name: data.roomId}).text(unReadNum));
            } else {
                unReadNum = Number(num)+1;
                $('span[name='+data.roomId+']').text(unReadNum);
            }
            updateUnReadNum(data.roomId, unReadNum);
		}
		var toNum = data.toTarget.length;
		var my = $('#cryptoId').val();
		$('div[name*=roomList]').find(".active").attr("name");
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
    
    /* create room **/
    $('#createChatDiv').focusout(function() {
        ceateButtonCheck();
    });
    $('#selectMember').change(function(event){
        selectMove('selectMember', 'selectedMember', false);
        ceateButtonCheck();
    });
    $('#selectedMember').change(function(event){
        selectDelete('selectedMember');
        ceateButtonCheck();
    });
    $('button[name=createRoomClose]').click(function() {
        clearRoomItem();
    });
    $('#chatCreateButton').click(function(){
        var users = [];
        $("select[name=selectedMember]").children().each(function() {
            users.push({_id:$(this).val(), name:$(this).text()});
        });
        var chat = {
                name: $('#createRoomName').val(),
                description: $('#roomDescription').val(),
                users: users};
        $.ajax({
            type: 'POST',
            url: '/chat/create',
            dataType: 'json',
            data: chat,
            cache: false,
            success: function(data) {
                socket.send({ cookie: document.cookie });
                socket.emit('create chat', chat);
                clearRoomItem();
                $().toastmessage('showToast', {
                    text     : '['+chat.name+']<br>を作成しました',
                    sticky   : true,
                    type     : 'success'
                });
            },
        　　error: function(XMLHttpRequest, textStatus, errorThrown) {
                $().toastmessage('showToast', {
                    text     : '['+chat.name+']<br>を作成できませんでした',
                    sticky   : true,
                    type     : 'error'
                });
        　　},
        });
    });
    /* room member edit **/
    $('#selectEditMember').change(function(event){
        selectMove('selectEditMember', 'selectedEditMember', false);
        memberEditCompleteButtonCheck();
    });
    $('#selectedEditMember').change(function(event){
        selectDelete('selectedEditMember');
        memberEditCompleteButtonCheck();
    });
    $('#memberEditCompleteButton').click(function(){
        var users = [];
        $("select[name=selectedEditMember]").children().each(function() {
            users.push({_id:$(this).val(), name:$(this).text()});
        });
        if (users.length === 0) return false;
        var roomId = $('#memberEditButton').val();
        var editMember = {roomId:roomId, users:users};
        socket.emit('member edit', editMember);
    });
    
    socket.on('member add', function (data) {
        socket.emit('join room', data.roomId);
        getMyRoom(false, data.roomName);
    });
    socket.on('member delete', function (data) {
        socket.emit('leave room', data.roomId);
        if (data.roomId == $('#roomContents').find(".active").attr("id")) {
            $('#sendButton').attr("disabled", "disabled");
            $('#sendButton').val('');
        }
        $().toastmessage('showToast', {
            text     : '['+data.roomName+']<br>のメンバーから外れました',
            sticky   : true,
            type     : 'warning'
        });
        getMyRoom(true);
    });
    socket.on('member edit complete', function (data) {
        if (data.roomId == $('#roomContents').find(".active").attr("id")) {
            
            createMemberList(data.users);
        }
        console.log($('li[name='+data.roomId+']').text());
        if($('li[name='+data.roomId+']').text() != '') {
            $().toastmessage('showToast', {
                text     : '['+data.roomName+']<br>'+'のメンバーが変更されました',
                sticky   : true,
                type     : 'success'
            });
        }
    });
    /* fixed sentence**/
	$('a[name="fixedSectences"]').click(function(){
        var val = $(this).attr('href');
        $('#message').val($(val).val());
        $('#fixedSectencesDiv').removeClass("open");
        $('#message').focus();
        return false;
	});
    /* to**/
    $('#toDiv').delegate('a', 'click', function() {
        
        $('#toDiv').removeClass("open");
        var element = '<div class="to-user to-user-dismissable">'
                    + '<button type="button" class="close" data-dismiss="to-user" aria-hidden="true">&times;</button>'
                    + '<input type="hidden" name="toList" value='+$(this).attr('href')+'>'                    
                    + $(this).text() + '</div>';
        $('#toUser').append(element);
        return false;
	});
});