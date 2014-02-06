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
var createMemberList = function(data) {
    $('#roomUserList').children().remove();
    var length = data.users.length;
    var toElement = '';
    for (var i = 0; i < length; i++) {
        console.log(data.users[i].name);
        $('#roomUserList').append($("<li>",{name: data.users[i]._id}).append(
            $("<i>",{class: data.users[i].status})).append(data.users[i].name));
        toElement += '<li><a name="toTarget" href="#">'+data.users[i].name+'</a></li>';
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
        　　    console.log(XMLHttpRequest);
        　　    console.log(textStatus);
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
        $.ajax({
            type: 'POST',
            url: '/chat/memberUpdate',
            dataType: 'json',
            data: editMember,
            cache: false,
            success: function(data) {
                console.log(data);
                socket.send({ cookie: document.cookie });
                //選択されたメンバーに送信する
                socket.emit('member edit', users);
                createMemberList(data);
                $().toastmessage('showToast', {
                    text     : $('#roomName').text()+'メンバーを変更しました',
                    sticky   : true,
                    type     : 'success'
                });
            },
        　　error: function(XMLHttpRequest, textStatus, errorThrown) {
        　　    console.log(XMLHttpRequest);
        　　    console.log(textStatus);
        　　},
        });
    });
    /* fixed sentence**/
	$('a[name="fixedSectences"]').click(function(){
        var val = $(this).attr('href');
        $('#message').val($(val).val());
        $('#fixedSectencesDiv').removeClass("open");
        $('#message').focus();
        return false;
	});
});