var express = require('express');
var engine = require('ejs-locals')
var app = express();
var server = require('http').createServer(app)
var io = require('socket.io').listen(server);

app.use('/static', express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');

// use ejs-locals for all ejs templates:
app.engine('ejs', engine);

app.engine('html', require('ejs').renderFile);

app.get('/', function(req, res){
	res.render('about.ejs');
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
		socket.broadcast.emit('remote-paste', { content: data.content, boxId: data.boxId });
	});
});

server.listen(3000);
console.log('Listening on port 3000');