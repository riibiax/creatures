var express = require('express');
var socket = require('socket.io');
var firebase = require('firebase');
var Twit = require('twit');
var exec = require('child_process').exec;
var fs = require('fs');

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
	socket.on("render-frame", renderFrame);

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

	function renderFrame(data) {
		data.file = data.file.split(',')[1]; // Get rid of the data:image/png;base64 at the beginning of the file data
        var buffer = new Buffer(data.file, 'base64');
        fs.writeFileSync(__dirname + '/tmp/frame-' + data.frame + '.png', buffer.toString('binary'), 'binary');
        console.log(data.frame);
        if(data.frame==90){
			createVideo();
        }
	}

	function createVideo() {
		console.log("Creating a video");
		var filePath = 'output.mp4';
		fs.stat(filePath, function(err, stat) {
			if(err == null) {
			    console.log('Output file exists. Deleting it');
			    fs.unlinkSync(filePath);
			}
		});
		var cmd = '/usr/local/bin/ffmpeg -r 30 -i ./tmp/frame-%01d.png -vcodec libx264 -acodec aac -vf "scale=1280:trunc(ow/a/2)*2" -strict experimental -vb 1024k -minrate 1024k -maxrate 1024k -bufsize 1024k -ar 44100 -pix_fmt yuv420p -threads 0 ' + filePath;
		exec(cmd, creatingVideo);

		function creatingVideo() {
			console.log("The video is ready");
			rmDir('./tmp');	
		}
	}
}

function rmDir(dirPath) {
  try { var files = fs.readdirSync(dirPath); }
  catch(e) { return; }
  if (files.length > 0)
    for (var i = 0; i < files.length; i++) {
      var filePath = dirPath + '/' + files[i];
      if (fs.statSync(filePath).isFile())
        fs.unlinkSync(filePath);
      else
        rmDir(filePath);
    }
  //fs.rmdirSync(dirPath);
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
	var filePath = "output.mp4";
	fs.stat(filePath, function(err, stat) {
		if(err == null) {
			console.log("Posting a video");
		    T.postMediaChunked({ file_path: filePath}, function (err, data, response) {
				if(!err){
					var mediaIdStr = data.media_id_string;
  					var params = { status: ' ', media_ids: [mediaIdStr] };
  					T.post('statuses/update', params, postTweet);
  					fs.unlinkSync(filePath);
				}
				else{
					console.log("Error");
					console.log(err);
				}
			});
		}
	});
}

function postTweet(err, data, response) {
	if (err) {
		console.log(err);
	}
	else {
		console.log("A twit posted");
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