var codeListModel = function(items) {
    var self = this;
    self.items = ko.observableArray(items);
    
    self.addItems = function() {
        self.items.push({
            codeValue: "",
            valueName: "",
            dispName: ""
        });
    };
    
    self.removeItem = function(gift) {
        self.items.remove(gift);
    };
    
    self.save = function(form) {
        alert("次のようにサーバに送信できます: " + ko.utils.stringifyJson(self.gifts));
        // ここで通常のフォーム送信同様に送信する場合、次のように書いてください:
        // ko.utils.postJson($("form")[0], self.gifts);
    };
};
 
var viewModel = new codeListModel();
ko.applyBindings(viewModel);
 
// jQuery Validation を起動
//$("form").validate({ submitHandler: viewModel.save });