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

		if (data.contentType ==  'image')
			$('#' + data.boxId).attr('style', 'background: url(' + data.content + ')');

		if (data.contentType ==  'text')
			addTextToBox($('#' + data.boxId), data.content);
	});

	$('.box').on('click', function(e) {
		selectBox($(this));
	});

});


function addTextToBox(box, text) {
	box.html('"' + text + '"');
}

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

  for (var i = 0; i < items.length; ++i) {

    if (items[i].kind == 'file' &&
        items[i].type.indexOf('image/') !== -1) {

        var blob = items[i].getAsFile();
        window.URL = window.URL || window.webkitURL;
        var blobUrl = window.URL.createObjectURL(blob);

        $('.selected').attr('style', 'background: url(' + blobUrl + ')');
        socket.emit('paste', { contentType: 'image', content: blobUrl, boxId: $('.selected').attr('id') });
    }

    if (items[i].kind == 'string' &&
        items[i].type.indexOf('plain') !== -1) {

        items[i].getAsString(function(s) {
        	addTextToBox($('.selected'), s);
        	socket.emit('paste', { contentType: 'text', content: s, boxId: $('.selected').attr('id') });
        });
        
    }
}
/*
  console.log(JSON.stringify(items)); // will give you the mime types
  var blob = items[1].getAsFile();
  var reader = new FileReader();

  reader.onload = function(e) {
  	//$('.selected').attr('style', 'background: url(' + e.target.result + ')');
	socket.emit('paste', { content: e.target.result, boxId: $('.selected').attr('id') });
  }; // data url!

  reader.readAsDataURL(blob);
*/
}

