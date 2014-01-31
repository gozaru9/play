// reference the http module so we can create a webserver
var http = require("http");

// create a server
http.createServer(function(req, res) {
    // on every request, we'll output 'Hello world'
    res.end("Hello world from Cloud9!");
}).listen(process.env.PORT, process.env.IP);
// Note: when spawning a server on Cloud9 IDE, 
// listen on the process.env.PORT and process.env.IP environment variables

//* これやってみる *
//http://www.polidog.jp/2013/08/01/nodejs%E5%85%A5%E9%96%80%E3%80%81%E6%9A%91%E3%81%84%E3%81%8B%E3%82%89express3%E3%81%A7%E3%83%A1%E3%83%A2%E3%82%A2%E3%83%97%E3%83%AA%E3%82%92%E4%BD%9C%E3%82%8D%E3%81%86%E3%81%9D%E3%81%AE%EF%BC%91/
//mongo paulo.mongohq.com:10066/GOZARU -u <user> -p<password>
//mongodb://<GOZARU9>:<gozaru9>@paulo.mongohq.com:10066/GOZARU

// Click the 'Run' button at the top to start your server,
// then click the URL that is emitted to the Output tab of the console