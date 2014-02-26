var completeButtonCheck = function() {
    
    if ($('#inputName').val().trim().length === 0 || $('#inputEmail').val().trim().length === 0
        || $('#inputPassword').val().trim().length === 0 || $('#inputPasswordConfirm').val().trim().length === 0) {
        $('#completeButton').attr("disabled", "disabled"); 
        return false;
    } else {
        $('#completeButton').removeAttr("disabled");
        return true;
    }
};
var clear = function() {
    
    $('#inputName').val('');
    $('#inputEmail').val('');
    $('#completeButton').val('');
    $('#role').attr('checked', false);
    $('#accountId').val('');
    $('#inputPassword').val('');
    $('#inputPasswordConfirm').val('');
    $('#inputPassword').removeClass('error');
    $('#inputPasswordConfirm').removeClass('error');
};
var message = function(message, position) {
    $().toastmessage('showToast', {
        text     : message,
        sticky   : true,
        position : position,
        type     : 'error'
    });
};
var loadMessage = function(msg) {
    if ('' !== msg) {
        message(msg, 'top-center');
    }
};
$(function() {
    $('#hederMenu').children().removeClass('active');
    $('#tagsView').addClass('active');

    $('#createAccountDiv').focusout(function() {
        completeButtonCheck();
    });
    $("#accountCreateButton").click(function(){
        clear();
        $('#createFormLabel').text('ユーザーを作成します');
        $('#completeButton').text('作成する');
    });
    $("button[name=accountUpdateButton]").click(function(){
        
        clear();
        if (!$(this).val()) return false;
        $('#createFormLabel').text('ユーザーを更新します');
        $('#completeButton').text('更新する');
        $.ajax({
            type: 'POST',
            url: '/account/getById',
            dataType: 'json',
            data: ({_id:$(this).val()}),
            cache: false,
            success: function(data) {
                if (data.errinfo.status) {
                    message(data.errinfo.message);
                } else {
                    
                    $('#inputName').val(data.target.name);
                    $('#inputEmail').val(data.target.mailAddress);
                    $('#completeButton').val(data.target._id);
                    if(data.target.role === 1) 
                        $('#role').attr("checked", true);
                }
        　　},
        　　error: function(XMLHttpRequest, textStatus, errorThrown) {
        　　    console.log(XMLHttpRequest);
        　　    console.log(textStatus);
        　　},
        });
    });
    $('#completeButton').click(function(){
        if (!completeButtonCheck()) {
            return false;
        }
        if ($('#inputPassword').val().trim() !== $('#inputPasswordConfirm').val().trim()) {
            
            $('#inputPassword').addClass('error');
            $('#inputPasswordConfirm').addClass('error');
            message('入力されたパスワードが一致しません', 'top-center');
            return false;
        }
        var id = $(this).val();
        var checkInfo = {accountId:id, name:$('#inputName').val(), mailAddress:$('#inputEmail').val(), password:$('#inputPassword').val(), passwordConfirm: $('#inputPasswordConfirm').val()};
        $.ajax({
            type: 'POST',
            url: '/account/validation',
            dataType: 'json',
            data: checkInfo,
            cache: false,
            success: function(data) {
                console.log(data);
                if (data.validationInfo.status) {
                    message(data.validationInfo.message, 'top-center');
                    return false;
                }
                if (id) {
                    document.getElementById("accountId").value=id;
                    document.accountForm.action = '/account/update';
                } else {
                    document.accountForm.action = '/account/regist';
                }
                document.accountForm.submit();
        　　},
        　　error: function(XMLHttpRequest, textStatus, errorThrown) {
        　　    console.log(XMLHttpRequest);
        　　    console.log(textStatus);
        　　  return ;
        　　},
        });
        return false;
    });
    $("button[name=accountDeleteButton]").click(function(){
        if ($(this).val()) {
            var data = {_id:$(this).val()};
            createFormSubmitByParam('/account/delete',data);
            return false;
        }
    });
});