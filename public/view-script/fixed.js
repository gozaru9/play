$(function() {
    
    $('button[name=myFixedUpdateButton]').click(function() {
        
        $('#title').val();
        $('#contents').val();
        
    });
    $('button[name=myFixedDeleteButton]').click(function() {
        var data = {_id:$(this).val()};
        if ($(this).val()) createFormSubmitByParam('/chat/fixedSectence/delete',data);
    });
});