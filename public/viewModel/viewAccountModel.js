        $.ajax({
            type: 'POST',
            url: '/account/parts',
            contentType: 'application/json',
            cache: false,
            success: function(data) {
                ko.applyBindings(new accountViewModel(data.items), document.getElementById("accountTable"));
            }
        });
        
        var accountViewModel = function(items) {
    
            var self = this;
            self.accountList = ko.observableArray();
            
            var length = items.length;
            for (var index=0; index < length; index++) {
                
                self.accountList.push(items[index]);
            }
        }
