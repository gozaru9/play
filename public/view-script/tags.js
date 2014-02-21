$(function() {
    $('#hederMenu').children().removeClass('active');
    $('#tagsView').addClass('active');
    
    $("#color").spectrum({
        showInput: true,
        allowEmpty:true,
        change:function(color) {
            var select = (null !== color) ? color.toHexString() : '';
            $('#selectColor').val(select);
        }
    });
    $('#tagsCreateButton').click(function() {
        
        $('#tagsCreateFormLabel').text('タグを作成します');
        $('#completeButton').text('作成する');
    });
    $('button[name=tagsUpdateButton]').click(function() {
        if ($(this).val()) {
            $('#tagsCreateFormLabel').text('タグを更新します');
            $('#completeButton').text('更新する');
            $.ajax({
                    type: 'POST',
                    url: '/tags/getTagsById',
                    dataType: 'json',
                    data: ({id:$(this).val()}),
                    cache: false,
                    success: function(data) {
                        
                        if (data.target) {
                            $("#color").spectrum({
                                showInput: true,
                                allowEmpty:true,
                                color: data.target.color,
                                change:function(color) {
                                    var select = (null !== color) ? color.toHexString() : '';
                                    $('#selectColor').val(select);
                                }
                            });
                            $('#name').val(data.target.name);
                            $('#selectColor').val(data.target.color);
                            $('#completeButton').val(data.target._id);
                        }
                　　},
                　　error: function(XMLHttpRequest, textStatus, errorThrown) {
                　　    console.log(XMLHttpRequest);
                　　    console.log(textStatus);
                　　},
                });
        }
    });
    $('#completeButton').click(function(){
        if ( $('#name').val().trim().length === 0 ) return;
        var data = {id:$('#completeButton').val(),
                    name :$('#name').val().trim(), 
                    color:$('#selectColor').val()};
        if ( $('#completeButton').val()) {
            createFormSubmitByParam('/tags/update',data);
        } else {
            createFormSubmitByParam('/tags/regist',data);
        }
    });
    $('button[name=tagsDeleteButton]').click(function() {
        var data = {_id:$(this).val()};
        if ($(this).val()) createFormSubmitByParam('/tags/delete',data);
    });
});