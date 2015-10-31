var express = require('express');
var app = express();

app.set('view engine', 'jade');

app.use('/public', express.static(__dirname + '/public'));

app.get('/', function(req, res) {
  res.render('index');
});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('App listening at http://%s:%s', 'localhost', port);
});