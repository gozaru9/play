        $.ajax({
            type: 'POST',
            url: '/account/parts',
            contentType: 'application/json',
            cache: false,
            success: function(data) {
                ko.applyBindings(new chatCreateViewModel(data.items), document.getElementById("createChatDiv"));
            }
        });

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
                var memberNum = self.selectedMember().length;
                if (memberNum === 0) {
                    return;
                }
                var users = [];
                for (var i=0; i < memberNum; i++) {
                    users[i] = self.selectedMember()[i];
                }
                var chat = {
                    name: self.roomName(),
                    description: self.description(),
                    users: users,
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
                    	var socket = io.connect(location.hostname);
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
