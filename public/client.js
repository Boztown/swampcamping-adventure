// connect to our socket.io instance
var socket = io.connect('http://127.0.0.1:3000');

// keeps track of the last user-selected box
var lastSelectedBox;


$(document).ready(function() {

	setupSockets();
	setupListeners();
	loadState();
});


/**
 * Setup all the socket.io connections.
 */
function setupSockets() {

	// socket listens for when other users select a box
	socket.on('remote-reset', function (data) {
		reset();
	});

	// socket listens for when other users select a box
	socket.on('remote-select', function (data) {
		$('#' + data.boxId).addClass('remote-selected');
	});

	// socket listens for when other users UNselect a box
	socket.on('remote-unselect', function (data) {
		$('#' + data.boxId).removeClass('remote-selected');
	});

	socket.on('remote-paste', function (data) {

		if (data.contentType ==  'image') {
			addImageFileToBox($('#' + data.boxId), data.filename);
		}

		if (data.contentType ==  'text') {
			addTextToBox($('#' + data.boxId), data.content);		
		}
	});
};


function reset() {
	$('.box').attr('style', '').html('');
	saveState();
};

/**
 * Add the initial event listeners.
 */
function setupListeners() {

	var b = $('body');

	b.on('click', '.box', function(e) {
		selectBox($(this));
	});

	b.on('click', '#reset', function(e) {
		reset();
		socket.emit('reset', { reset: true });
	});

	b.on('dragover', '.box', function(e) {
		e.stopPropagation(); 
		e.preventDefault(); 
		e.originalEvent.dataTransfer.dropEffect = 'copy';  
		dragOverBox($(this));
	});	

	b.on('dragleave', '.box', function(e) {
		dragOutBox($(this));
	});	

	b.on('drop', '.box', function(e) {

        e.stopPropagation(); 
        e.preventDefault(); 

        var self = $(this); 

        var files = e.originalEvent.dataTransfer.files;  
        var reader = new FileReader(); 

        if (files[0].type.indexOf('text/') > -1) { 

            reader.onload = function(event) {  
                addTextToBox(self, event.target.result);
                socket.emit('paste', { contentType: 'text', content: event.target.result, boxId: $('.selected').attr('id') });
            }         

            reader.readAsText(files[0],"UTF-8");   
        }    

        if (files[0].type == 'image/jpeg' || files[0].type == 'image/png') { 

            reader.onload = function(event) {           
                addImageToBox(self, event.target.result);
            }    

            reader.readAsDataURL(files[0]);   
        } 
	});	
};


function dragOverBox(box) {

	box.addClass('selected');
};

function dragOutBox(box) {

	box.removeClass('selected');
}

/**
 * Saves the state of the DOM to the server.
 */
function saveState() {

	$.ajax({
	  type: 'POST',
	  url: '/save',
	  data: { dom: $('#canvas').html() },
	  dataType: 'json',
	  success: function(data){
	    
	  }
	});
};


/**
 * Loads the state of the DOM from the server.
 */
function loadState() {

	$.ajax({
	  type: 'GET',
	  url: '/load',
	  success: function(data){
	    $('#canvas').html(data);
	    $('.box').removeClass('selected remote-selected');
	  }
	});	
};


/**
 * Adds text to a box.
 * @param {Object} box
 * @param {String} text
 */
function addTextToBox(box, text) {
	box.html('"' + text.substring(0, 140) + '..."');
	saveState();
};


/**
 * Adds an image to a box (as a background).
 * @param {Object} box
 * @param {String} image
 */
function addImageToBox(box, image) {

	$.ajax({
	  type: 'POST',
	  url: '/saveimage',
	  data: { base: image },
	  dataType: 'json',
	  success: function(data) {
	  	
	  	addImageFileToBox(box, data.filename);
	  	socket.emit('paste', { contentType: 'image', filename: data.filename, boxId: $('.selected').attr('id') });
	  	$('.box').removeClass('selected');
	  	saveState();
	  }
	});	
};

function addImageFileToBox(box, filename) {

	box.attr('style', 'background-image: url(static/uploads/' + filename + ')');
}


/**
 * Selects a box (adds decoration, emits broadcast).
 * @param {Object} box
 */
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
        //window.URL = window.URL || window.webkitURL;
        //var blobUrl = window.URL.createObjectURL(blob);

        var reader = new FileReader();
		reader.onload = function(e) {
			addImageToBox($('.selected'), e.target.result);

		}; 

		reader.readAsDataURL(blob);      
	    
        //addImageToBox($('.selected'), blobUrl);
        //socket.emit('paste', { contentType: 'image', content: blobUrl, boxId: $('.selected').attr('id') });
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
};



