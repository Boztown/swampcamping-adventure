var express = require('express');
var engine = require('ejs-locals')
var app = express();
var server = require('http').createServer(app)
var io = require('socket.io').listen(server);
var fs = require('fs');

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.engine('ejs', engine);
  app.engine('html', require('ejs').renderFile);
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'neota' }));
  app.use(express.bodyParser());
  app.use(app.router);
  app.use(express.csrf());
  app.use('/static', express.static(__dirname + '/public'));
});


app.get('/', function(req, res){
	res.render('index.ejs');
});

app.post('/save', function(req, res){

	fs.writeFile('dom.html', req.body.dom);
	res.send({ some: JSON.stringify({response:'json' })});
	res.end();
});

app.post('/saveimage', function(req, res){

	var base64Data = req.body.base.replace(/^data:image\/jpeg;base64,/,"").replace(/^data:image\/png;base64,/,"");
	var filename = Math.random().toString(36).substring(7) + '.png'

	fs.writeFile("public/uploads/" + filename, base64Data, 'base64', function(err) {
	  //console.log(err);
	});

	res.json({ filename: filename });
});

app.get('/load', function(req, res){

	var r = res;

	fs.readFile('dom.html', function(err, data) {
		res.send(data);
    });
});

io.sockets.on('connection', function (socket) {
	
	socket.emit('news', { hello: 'world' });

	socket.on('box-selected', function (data) {
		socket.broadcast.emit('remote-select', { boxId: data.boxId });
	});

	socket.on('box-unselected', function (data) {
		socket.broadcast.emit('remote-unselect', { boxId: data.boxId });
	});

	socket.on('paste', function (data) {
		socket.broadcast.emit('remote-paste', { contentType: data.contentType, filename: data.filename, content: data.content, boxId: data.boxId });
	});
});

server.listen(3000);
console.log('Listening on port 3000');