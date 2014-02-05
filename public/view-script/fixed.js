$(function() {
    
    $('button[name=myFixedUpdateButton]').click(function() {
        
        
        
    });
    $('button[name=myFixedDeleteButton]').click(function() {
        var data = {_id:$(this).val()};
        if ($(this).val()) createFormSubmitByParam('/chat/fixedSectence/delete',data);
    });
});