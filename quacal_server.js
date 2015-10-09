var express = require('express'),
    bodyParser = require('body-parser'),
    app = express(),
    path = require('path'),
    qualical = require('./controllers/quali'),
    morgan = require('morgan');

app
  .use(morgan('dev'))
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended : true }))
  .use(express.static('./public'))
  .get('/*', function(req, res) {
    res.sendFile(path.join(__dirname + '/public/index.html'));
  })
  .listen(3000, function() {
    console.log('Server Listening on Port 3000');
    qualical.init(180000);
  });
