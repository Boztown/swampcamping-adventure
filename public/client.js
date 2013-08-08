// connect to our socket.io instance
var socket = io.connect('http://ryanbosinger:3000');

// keeps track of the last user-selected box
var lastSelectedBox;

// Array to hold our "spinner" icons
var spinners = [];


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


/**
 * Callback for when item is dragged over box.
 * @param {Object} box
 */
function dragOverBox(box) {

	box.addClass('selected');
};


/**
 * Callback for when item is dragged out of box.
 * @param {Object} box
 */
function dragOutBox(box) {

	box.removeClass('selected');
};


/**
 * Reset the canvas.  Save state.
 */
function reset() {
	$('.box').attr('style', '').html('');
	saveState();
};


/**
 * Start the loading spinner icon.
 * @param {Object} box
 */
function startSpinner(box) {

	var opts = {
	  lines: 13, // The number of lines to draw
	  length: 20, // The length of each line
	  width: 10, // The line thickness
	  radius: 30, // The radius of the inner circle
	  corners: 1, // Corner roundness (0..1)
	  rotate: 0, // The rotation offset
	  direction: 1, // 1: clockwise, -1: counterclockwise
	  color: '#000', // #rgb or #rrggbb
	  speed: 1, // Rounds per second
	  trail: 60, // Afterglow percentage
	  shadow: false, // Whether to render a shadow
	  hwaccel: false, // Whether to use hardware acceleration
	  className: 'spinner', // The CSS class to assign to the spinner
	  zIndex: 2e9, // The z-index (defaults to 2000000000)
	  top: 'auto', // Top position relative to parent in px
	  left: 'auto' // Left position relative to parent in px
	};

	spinners[box.id] = new Spinner(opts).spin(box);
};


/**
 * Stop the loading spinner icon.
 * @param {Object} box
 */
function stopSpinner(box) {

	spinners[box.id].stop();
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

	startSpinner(box[0]);

	$.ajax({
	  type: 'POST',
	  url: '/saveimage',
	  data: { base: image },
	  dataType: 'json',
	  success: function(data) {
	  	
	  	stopSpinner(box[0]);
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


/**
 * Handle clipboard.  May only work in Chrome.
 */
document.onpaste = function(event) {
  
  	var items = event.clipboardData.items;

  	for (var i = 0; i < items.length; ++i) {

	    if (items[i].kind == 'file' &&
	        items[i].type.indexOf('image/') !== -1) {

	        var blob = items[i].getAsFile();

	        var reader = new FileReader();
			reader.onload = function(e) {
				addImageToBox($('.selected'), e.target.result);

			}; 

			reader.readAsDataURL(blob);      
	    }

	    if (items[i].kind == 'string' &&
	        items[i].type.indexOf('plain') !== -1) {

	        items[i].getAsString(function(s) {
	        	addTextToBox($('.selected'), s);
	        	socket.emit('paste', { contentType: 'text', content: s, boxId: $('.selected').attr('id') });
	        });
	    }
	}
};



