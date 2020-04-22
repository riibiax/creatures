// utilsNode.js
// ========

var fs = require('fs');

module.exports = {
  rmDir: function (dirPath) {
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
  },

  timenow: function () {
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
};