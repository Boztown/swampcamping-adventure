var socket = io.connect('http://127.0.0.1:3000');
var lastSelectedBox;

$(document).ready(function() {

	// socket listens for when other users select a box
	socket.on('remote-select', function (data) {
		$('#' + data.boxId).addClass('remote-selected');
	});

	// socket listens for when other users UNselect a box
	socket.on('remote-unselect', function (data) {
		$('#' + data.boxId).removeClass('remote-selected');
	});

	socket.on('remote-paste', function (data) {
		$('#' + data.boxId).attr('style', 'background: url(' + data.content + ')');
	});

	$('.box').on('click', function(e) {
		selectBox($(this));
	});

});

function selectBox(box) {

	// null check in case of first selection
	if (lastSelectedBox) {
		lastSelectedBox.removeClass('selected');
		socket.emit('box-unselected', { boxId: lastSelectedBox.attr('id') });
	}

	box.addClass('selected');

	// broadcast the message that this box was submitted
	socket.emit('box-selected', { boxId: box.attr('id') });

	// set the last box to this box
	lastSelectedBox = box;
};

document.onpaste = function(event) {
  
  var items = event.clipboardData.items;
  console.log(JSON.stringify(items)); // will give you the mime types
  var blob = items[1].getAsFile();
  var reader = new FileReader();

  reader.onload = function(e) {
  	$('.selected').attr('style', 'background: url(' + e.target.result + ')');
	socket.emit('paste', { content: e.target.result, boxId: $('.selected').attr('id') });
  }; // data url!

  reader.readAsDataURL(blob);

}

