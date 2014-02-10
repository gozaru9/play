$(function() {
    
    $("a[name=moveChat]").click(function() {
        var data = {room :$(this).attr('id')};
        createFormSubmitByParam('/chat', data);
        return false;
    });
    
    socket.emit('login notice');

});