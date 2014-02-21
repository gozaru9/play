var socket = io.connect(location.hostname);
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
var createMessageElement = function(roomId, data) {
    //TODO リファクタリング
    var names = (data.toNameList) ? data.toNameList.join() : data.to.names.join();
    var namesElement = '';
    if (names !==  '') namesElement = '<p><span class="label label-success text-center">TO</span>'+' &nbsp;'+names+'</p>';
    var tagsElement = '';
    if (data.tag) {
        console.log('タグ情報発見');
        var tag = Array.isArray(data.tag) ? data.tag[0] : data.tag;
        if (tag.name) {
            tagsElement = '<p><span class="tag text-center" style="background-color:'+tag.color+'">'+tag.name+'</span><span class="pull-right glyphicon glyphicon-ok"></span></p>';
        }
    }
    var sender = (data.userName) ? data.userName : data.user.name;
    $('#'+roomId).append(
//        $('<ul class="chat">'+tagsElement3+'<li class="left clearfix"><!--<span class="chat-img pull-left"><img src="img/ff.gif" alt="User Avatar" class="img-circle" /></span>--><div class="chat-body clearfix"><div name="reseveMessage" class="header"><strong class="primary-font">'
        $('<ul class="chat"><li class="clearfix"><!--<span class="chat-img pull-left"><img src="img/ff.gif" alt="User Avatar" class="img-circle" /></span>--><div class="chat-body clearfix"><div name="reseveMessage" class="header"><strong class="primary-font">'
        +sender+'</strong><small class="pull-right text-muted"><i class="fa fa-clock-o fa-fw"></i>'+data.time+'</small>'
        +tagsElement+namesElement+'<p>'+nl2br(escapeHTML(data.message))+'</p></div></li></ul></div>'));
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
            //$('#roomListUl').children().remove();
            //$('#roomListUlSide').children().remove();
            var roomLength = data.rooms.length;
            var rooms = data.rooms;
            var element = '';
            for (var i=0; i < roomLength; i++) {
                
                if (!$('li[name='+rooms[i]._id+']')[0]) {
                    
                    element += '<li name=' + rooms[i]._id + '><a name="roomSelectRadio" href="#">'+ rooms[i].name + '</a></li>';
                }
            }
            document.getElementById("roomListUl").innerHTML += element;
            document.getElementById("roomListUlSide").innerHTML += element;
            var activeRoom = $('#roomContents').find(".active").attr("id");
            $('li[name='+activeRoom+']').addClass('active');
            //サイドパネルが開いていた場合、要素が更新されないため強制的に開閉する
            if ($('#pageslide').is(':visible')) {
                $('#pageslide').css("right", "auto","left", "-250px");
                $('body').css("margin-left", "0px");
                $('#pageslide').hide(500);
            }
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
    $('#hederMenu').children().removeClass('active');
    $('#lobbyView').addClass('active');
    
    /* chat **/
	(function clock() {
        var now = new Date();
        var hour = now.getHours(); // 時
        var min = now.getMinutes(); // 分
        var sec = now.getSeconds(); // 秒
        hour = ('0' + hour).slice(-2);
        min = ('0' + min).slice(-2);
        sec = ('0' + sec).slice(-2);
        var month = now.getMonth()+1;
        var ymd = now.getFullYear() + '/' + month +'/'+now.getDate();
        $('#today').html(ymd + ' ' + hour + ':' + min + ':' + sec);
        setTimeout(clock, 1000);
	})();

	//サーバーが受け取ったメッセージを返して実行する
	socket.on('msg push', function (data) {
	    
	    createMessageElement(data.roomId, data);
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
    
    //部屋の選択
	$('div[name*=roomList]').delegate('a[name=roomSelectRadio]', 'click', function() {

        var id = $(this).parent().attr('name');
        $('li').removeClass("active");
        $('li[name='+id+']').addClass('active');
        $(this).children().remove();
        $('#roomName').html($(this).text());
        $('#memberEditButton').val(id);
        $('#sendButton').val(id);
        $('#sendButton').removeAttr("disabled");
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
        updateUnReadNum(id, 0);
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
                data.messages.forEach(function(message){
                    message.roomId = id;
                    createMessageElement(id, message);
                });
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
	//招待された部屋の通知
	socket.on('create chat msg', function(roomName) {
        getMyRoom(false, roomName);
	});
	//ルーム作成完了
	socket.on('create chat complete', function(msg) {
        getMyRoom(true, msg);
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
        console.log($('#targetTag').val());
        var tag = {};
        if ($('#targetTag').val()) {
            tag._id = $('#targetTag').val();
            tag.name = $('#selectTag').text().trim().substring(1).split('×');
            tag.color = $('#targetTagColor').val();
        }
        var data = {
            message: $('#message').val(),
            roomId: target,
            toTarget:toList,
            toNameList: $('#toUser').text().trim().substring(1).split('×'),
            roomName:$('#roomName').html(),
            tag:tag
        };
		socket.emit('msg send', data);
        $('#message').val('');
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
        data.messages.forEach(function(message){
            createMessageElement(data.roomId, message);
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
        $('li[name='+data.roomId+']').remove();
    });
    socket.on('member edit complete', function (data) {
        if (data.roomId == $('#roomContents').find(".active").attr("id")) {
            
            createMemberList(data.users);
        }
        console.log($('li[name='+data.roomId+']').text());
        if($('li[name='+data.roomId+']').text() !== '') {
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
        console.log('選択したＩＤ：'+$(this).attr('href'));
        if ($('#cryptoId').val() === $(this).attr('href') ) return false;
        var isSelect = false;
        var toTarget = $('input[name=toList]:hidden').get();
        toTarget.forEach(function(target){
            console.log('選択ずみＩＤ：'+target.value);
            if (target.value === $(this).attr('href')) {
                console.log('がってん');
                isSelect = true; return false;
            }
        });
        if (isSelect) return false;
        var element = '<div class="to-user to-user-dismissable">'
                    + '<button type="button" class="close" data-dismiss="to-user" aria-hidden="true">&times;</button>'
                    + '<input type="hidden" name="toList" value='+$(this).attr('href')+'>'                    
                    + $(this).text() + '</div>';
        $('#toUser').append(element);
        return false;
	});
	/* tags**/
    $('#tagDiv').delegate('a', 'click', function() {
        $('#tagDiv').removeClass("open");
        $('#selectTag').children().remove();
        var element = '<div class="alert alert-success">'
                    + '<button type="button" class="close" data-dismiss="to-user" aria-hidden="true">&times;</button>'
                    + '<input type="hidden" id="targetTag" value='+$(this).attr('href')+'>'                    
                    + '<input type="hidden" id="targetTagColor" value='+$('#'+$(this).attr('href')).val()+'>'                    
                    + $(this).text() + '</div>';
        $('#selectTag').append(element);
        return false;
	});
});