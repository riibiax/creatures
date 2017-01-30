var express = require('express');
var socket = require('socket.io');
var firebase = require('firebase');
var Twit = require('twit');
var config= require('./config');


//FIREBASE
firebase.initializeApp(config.firebase);
var database = firebase.database();

//SERVER EXPRESS
var app = express();
var server = app.listen(3000);
app.use(express.static('public'));

//SOCKET
var io = socket(server);
io.sockets.on('connection', newConnection);

function newConnection(socket) {
	console.log('new conncetion: ' + socket.id);
	socket.on("pushingData", pushingData);
	socket.on("broadcastData", broadcastData);
	socket.on("tweetData", tweetData);

	function pushingData(data) {

		var entry = {
			connectionId: socket.id,
			time: timenow(),
			creatures: data
		}
		var ref = database.ref('creatures');
		ref.push(entry);
		ref.on('value', gotData, errData);
		console.log("Pushing Data to Firebase");
		function gotData(data) {
			var valuesDB= data.val();
			var keys = Object.keys(valuesDB);
			for (var i = 0; i <keys.length; i++) {
				var k = keys[i];
				var timeDB = valuesDB[k].time;
				var creaturesDB = valuesDB[k].creatures;
				console.log(timeDB, creaturesDB);
			}
		}
		function errData(err) {
			console.log("Error pushing data to firebase server");
			console.log(err);
		}

		//console.log(entry);
	}

	function broadcastData(data) {
		//sending back to all clients, but not to the sender
		socket.broadcast.emit('broadcastData', data);
		console.log("Broadcast to clients");
	}

	function tweetData(data) {
		var tweet = { 
			status: data
		};

		T.post('statuses/update', tweet, postTweet);
	}
}

function timenow(){
    var now= new Date(), 
    ampm= 'am', 
    h= now.getHours(), 
    m= now.getMinutes(), 
    s= now.getSeconds();
    if(h>= 12){
        if(h>12) h -= 12;
        ampm= 'pm';
    }
    if(m<10) m= '0'+m;
    if(s<10) s= '0'+s;
    return now.toLocaleDateString()+ ' ' + h + ':' + m + ':' + s + ' ' + ampm;
}

//TWITTER
var T = new Twit(config.twitter);

setInterval(postingArtwork, 1000*60*60);

function postingArtwork(){

}

function postTweet(err, data, response) {
	if (err) {
		console.log(err);
	}
	else {
		console.log("Posting a tweet");
	}
}

function followed(event) {
	console.log("Follow event");
	var name = event.source.name;
	var screenName = event.source.screen_name;
	var tweet = { 
			status: '.@' + screenName + " do you like Swiss Mountains?"
	};
	T.post('statuses/update', tweet, postTweet);
}

var stream = T.stream('user');

stream.on('follow', followed);




console.log("my socket server is running");