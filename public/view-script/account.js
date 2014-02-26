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
    $('#role').attr('checked', '');
    $('#accountId').val('');
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
                    
                    $().toastmessage('showToast', {
                        text     : data.errinfo.message,
                        sticky   : true,
                        type     : 'error'
                    });
                } else {
                    
                    $('#inputName').val(data.target.name);
                    $('#inputEmail').val(data.target.mailAddress);
                    $('#completeButton').val(data.target._id);
                    if(data.target.role) $('#role').attr('checked', 'checked');
                }
        　　},
        　　error: function(XMLHttpRequest, textStatus, errorThrown) {
        　　    console.log(XMLHttpRequest);
        　　    console.log(textStatus);
        　　},
        });
    });
    $('#completeButton').click(function(){
        if (!completeButtonCheck()) return false;
        if ($('#inputPassword').val().trim() !== $('#inputPasswordConfirm').val().trim()) {
            $('#inputPassword').addClass('error');
            $('#inputPasswordConfirm').addClass('error');
            return false;
        }
        if ($(this).val()) {
            document.getElementById("accountId").value=$(this).val();
            document.accountForm.action = '/account/update';
        } else {
            document.accountForm.action = '/account/regist';
        }
        document.accountForm.submit();
    });
    $("#accountDeleteButton").click(function(){
        if ($(this).val()) {
            var data = {_id:$(this).val()};
            createFormSubmitByParam('/account/delete',data);
            return false;
        }
    });
});