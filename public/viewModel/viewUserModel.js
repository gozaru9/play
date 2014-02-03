        var ViewModel = function(first, last) {
            var self = this;
            self.firstName = ko.observable(first);
            self.lastName = ko.observable(last);
            
            self.fullName = ko.computed(function() {
                // Knockout は依存を自動的にトラッキングします。
                // fullName の評価中に firstName と lastName を呼び出すため、
                // それぞれに依存していることが検知されます。
                return self.firstName() + " " + self.lastName();
            });
        };
        // 次のコードで Knockout を起動します。
        ko.applyBindings(new ViewModel());