        $.ajax({
            type: 'POST',
            url: '/todo',
            contentType: 'application/json',
            cache: false,
            success: function(data) {
                ko.applyBindings(new todoViewModel(data.items), document.getElementById("todoDiv"));
                $('#todoCount').html(data.items.length);
            }
        });

        var todoViewModel = function(items) {
    
            var self = this;
            
            self.count = ko.observable('');
            self.contents = ko.observable('');
            self.endDate = ko.observable('');
            self.important = ko.observable([{name:'低', values:"1"},{name:'中', values:"2"},{name:'高', values:"3"}]);
            self.selected = ko.observable(self.important[1]);
            self.todoList = ko.observableArray(); // Todo のリスト
            
            var length = items.length;
            
            for (var index=0; index < length; index++) {
                
                self.todoList.push(items[index]);
            }
    
            self.addTodo = function() {

                var todo = {
                    contents: self.contents(),
                    important: Number(self.selected()),
                    endDate: self.endDate()
                };
                
                if (todo.contents == "") return;
    
                //ここは後で削除する予定
                if (todo.endDate == "") {
                    todo.endDate = "2014-01-01";
                }
                
                $.ajax({
                    type: 'POST',
                    url: '/todo/regist',
                    dataType: 'json',
                    data: todo,
                    cache: false,
                    success: function (data) {
                        self.contents('');
                        self.endDate('');
                        self.todoList.push(todo); // リストに Todo を追加
                        $('#todoCount').html(self.todoList().length);
                　　},
                　　error: function(XMLHttpRequest, textStatus, errorThrown) {
                　　    console.log(XMLHttpRequest);
                　　    console.log(textStatus);
                　　},
                });
        
                //ajaxではない場合は以下の方法でPOST
                //ko.utils.postJson($("#todoForm")[0], todo);
            };
            
            self.deleteTodo = function() {
                
                $.ajax({
                    type: 'POST',
                    url: '/todo/delete',
                    dataType: 'json',
                    data: ({_id:this._id}),
                    cache: false,
                    success: function (data) {
                        self.todoList.remove(this);
//                        $('#todoCount').html(self.todoList().length);
                　　},
                　　error: function(XMLHttpRequest, textStatus, errorThrown) {
                　　    console.log(XMLHttpRequest);
                　　    console.log(textStatus);
                　　},
                　　complete:function() {
                        $('#todoCount').html(self.todoList().length);
                　　    console.log(self.todoList().length);
                　　}
                });
            };
        };