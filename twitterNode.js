// twitterNode.js
// ========
var fs = require('fs');
var Twit = require('twit');
var config = require('./config');
var T = new Twit(config.twitter);
var self = module.exports = {
  setup: function () {
    var stream = T.stream('user');
	stream.on('follow', self.followed);
	stream.on('tweet', self.tweetEvent);
	setInterval(self.postingArtwork, 1000*16);
  },

  postingArtwork: function () {
    var filePath = "output.mp4";
	fs.stat(filePath, function(err, stat) {
		if(err == null) {
			console.log("Posting a video");
		    T.postMediaChunked({ file_path: filePath}, function (err, data, response) {
				if(!err){
					var mediaIdStr = data.media_id_string;
  					var params = { status: ' ', media_ids: [mediaIdStr] };
  					T.post('statuses/update', params, self.postTweet);
  					fs.unlinkSync(filePath);
				}
				else{
					console.log("Error");
					console.log(err);
				}
			});
		}
	});
  },

  postTweet: function (err, data, response) {
	if (err) {
		console.log(err);
	}
	else {
		console.log("A tweet posted");
	}
  },

  tweetIt: function (txt) {
    console.log(txt);
	var tweet = { 
			status: txt
	};
	T.post('statuses/update', tweet, self.postTweet);
  },

  followed: function (event) {
    console.log("Follow event");
	var name = event.source.name;
	var screenName = event.source.screen_name;
	var text = '.@' + screenName + " do you like Swiss Mountains?";
	self.tweetIt(text);
  },

  tweetEvent: function (eventMsg) {
    console.log("Tweet event");
	var replyTo = eventMsg.in_reply_to_screen_name;
	var text = eventMsg.text;
	var from = eventMsg.user.screen_name;
	if (replyTo === 'mountains_swiss') {
		var newTweet = '.@' + from + ' thank you for tweeting me!';

		self.tweetIt(newTweet);
	}
  }
};