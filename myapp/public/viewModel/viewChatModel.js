        $.ajax({
            type: 'POST',
            url: '/account/parts',
            contentType: 'application/json',
            cache: false,
            success: function(data) {
                ko.applyBindings(new chatCreateViewModel(data.items), document.getElementById("createChatDiv"));
            }
        });
        
        var chatViewModel = function(rooms) {
            
            var self = this;
            
            self.roomList = ko.observableArray();

            var length = rooms.length;
            
            for (var index=0; index < length; index++) {
                
                rooms[index]['_id'] = '#'+ rooms[index]['_id'];
                self.roomList.push(rooms[index]);
            }

            self.entryRoom = function(data, event) {
                //実際は呼ばれないがイベントを発生させるため記述
                //console.log('entryRoom');
                //alert($(this).val());
            }
        }

        var chatCreateViewModel = function(items) {
    
            var self = this;
            
            self.roomName = ko.observable();
            self.description = ko.observable();
            self.selectMember   = ko.observableArray(items);
            self.selectedMember = ko.observableArray();
            self.multipleSelectedOptionValues = ko.observableArray();
            self.roomList = ko.observableArray();

            //メンバー追加
            self.addMember = function(data, event) {
                
                var target = document.getElementById(event.target.id);
                var item = self.selectMember();
                var index = $.inArray(item[target.selectedIndex], self.selectedMember());
                if(index === -1){
                    self.selectedMember.push(item[target.selectedIndex]);
                }
                $("select#"+event.target.id+" option:selected").attr("selected",false);
                $("select#"+event.target.id).blur();
            }
            //選択メンバーの削除
            self.removeMember = function(data, event) {
                var target = document.getElementById(event.target.id);
                var item = self.selectedMember();
                self.selectedMember.remove(item[target.selectedIndex]);
                $("select#"+event.target.id+" option:selected").attr("selected",false);
                $("select#"+event.target.id).blur();
            }
            //選択済みメンバーの全削除
            self.removeAll = function(){
                self.selectedMember.removeAll();
            }
            //チャット作成
            self.createRoom = function() {
                
                if (self.roomName().length === 0) {
                    return;
                }
                if (self.selectedMember().length === 0) {
                    return;
                }
                
                var chat = {
                    name: self.roomName(),
                    description: self.description(),
                    users: self.selectedMember(),
                };
                
                $.ajax({
                    type: 'POST',
                    url: '/chat/create',
                    dataType: 'json',
                    data: chat,
                    cache: false,
                    success: function(data) {
                        self.roomName('');
                        self.description('');
                    	var socket = io.connect('https://play-c9-gozaru9.c9.io');
                    	socket.send({ cookie: document.cookie });
                        //選択されたメンバーに送信する
                    	socket.emit('create chat', chat);
                        self.selectedMember.removeAll();
                        alert('部屋を作成しました。');
                    },
                　　error: function(XMLHttpRequest, textStatus, errorThrown) {
                　　    console.log(XMLHttpRequest);
                　　    console.log(textStatus);
                　　},
                });
            }
        };
