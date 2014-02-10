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
}
$(function() {
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
                    text     : chat.name+'を作成しました',
                    sticky   : true,
                    type     : 'success'
                });
            },
        　　error: function(XMLHttpRequest, textStatus, errorThrown) {
                $().toastmessage('showToast', {
                    text     : chat.name+'を作成できませんでした',
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