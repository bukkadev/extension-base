let EBS_URL = "bukka.layerth.dev";
let SETTINGS_URL = 'https://bukka.b-cdn.net/settings.json';
let testing = false;


if (window.location.hostname === 'localhost') {
    EBS_URL = "localhost:7777";
    SETTINGS_URL = "http://localhost:7777/settings.json";
    testing = true;
}


const ASSETS = {
	image : function(filename){
		return `https://bukka.b-cdn.net/images/${filename}.png`
	}
}

function ReceivedPubSub(data){
	console.log("ReceivedPubSub", data);
	
	ProcessPubSub(data);

	setTimeout(function(){
		ProcessPubSubDelayed(data);
	}, broadcast_delay);
}

function ProcessPubSub(data){
	// Process data here
	if (data['event'] == "update_settings") {
		GetExtSettings()
	}
	
}

function ProcessPubSubDelayed(data){
	// Process data here with delay
}


// Setup dev WebSocket
let devSocket;
if (testing) {
    devSocket = new WebSocket(`ws://${window.location.host}`);
    devSocket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        ReceivedPubSub(JSON.parse(message.data));
    };
}


function GetExtSettings(){
	$.ajax({
		type: 'GET',
		cache: false,
		url: SETTINGS_URL,
		crossDomain: true,
		xhrFields: {
			withCredentials: false
		},
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
		success: function(data){
			ProcessSettingsJSON(data)
		},
		error: function(xhr, status, error){
			console.log("Failed to get extension settings:", error);
		}
	});
}

$(function() {
	// console.log("Loaded!");

	$('.content').click(function(event) {
		if (event.target.id == "main_box") {
			// used to hide modals/windows
		}
	});





	// Listen for incoming broadcast message from our EBS and do ajax request for the data
	twitch.listen('broadcast', function (target, contentType, data) {
		data = JSON.parse(data);
		ReceivedPubSub(data);

	});


	let mouse_timeout = null;
	$('.content').on('mousemove', function() {
	    clearTimeout(mouse_timeout);
	    $('.content').addClass('hovering')
	    mouse_timeout = setTimeout(function() {
	    	if (!testing) {
	    		$('.content').removeClass('hovering')
	    	}
	    }, 3000);
	});


	$('.content').hover(function() {
	    $(this).addClass('hovering')
	},function() {
	    $('.content').removeClass('hovering')
	});





	DoResize()
	setTimeout(function(){
		DoResize()
	}, 100)


	
	


	GetExtSettings()




	if (testing) {

		$('.content').append('<img src="./images/placeholder.png" class="placeholder_screenshot" />')

		channel = "bukka_"
		channel_id = "39754760"
	}

});



function ProcessSettingsJSON(settings){

	// Hide extension
	if (settings['config']['extension_hidden']) {
		$('.content').hide();
	}else{
		$('.content').show();
	}

}




// TWITCH API STUFF
let token = "";
let tuid = "";
let channel = "";
let channel_id = "";
let twitch = window.Twitch.ext;

let broadcast_delay = 0;

twitch.onContext(function(context) {
	channel = context.playerChannel;
	broadcast_delay = context.hlsLatencyBroadcaster
});

twitch.onAuthorized(function(auth) {
	token = auth.token;
	tuid = auth.userId;
	channel_id = auth.channelId

	// Do something here if you don't want to wait for next PubSub
});

function logError(_, error, status) {
	if (testing) {
		console.log("error", error);
	}
	twitch.rig.log('EBS request returned '+status+' ('+error+')');
}



// AUTO-SCALE to fit player
$(window).on('resize', function(){
	DoResize();
});

let ui_rescale = 1;
function DoResize(){

	let scale;
	let content = $('.auto-scale>.content');
	  
	scale = Math.min(
		$(window).width() / content.width(),    
		$(window).height() / content.height()
	);
	ui_rescale = scale;
	content.css({
		transform: "translate(-50%, -50%) " + "scale(" + scale + ")"
	});
}


