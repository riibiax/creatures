/*
* Airtight Utilities 
* v 0.1.1
* @author felixturner / http://airtight.cc/
*/

ATUtil = {
	randomRange : function(min, max) {
		return min + Math.random() * (max - min);
	},
	randomInt : function(min,max){
		return Math.floor(min + Math.random() * (max - min + 1));
	},
	map : function(value, min1, max1, min2, max2) {
		return ATUtil.lerp( ATUtil.norm(value, min1, max1), min2, max2);
	},
	lerp : function(value, min, max) {
		return min + (max -min) * value;
	},
	norm : function(value , min, max) {
		return (value - min) / (max - min);
	},
	shuffle : function(o) {
		for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
		return o;
	},
	randomVector3: function(range) {
		return new THREE.Vector3(ATUtil.randomRange(-range,range),ATUtil.randomRange(-range,range),ATUtil.randomRange(-range,range));
	},
	randomPointOnParticles: function(r) {
	    var angle = Math.random() * Math.PI * 2;
	    var u = Math.random() * 2 - 1;  
	    var v = new THREE.Vector3(
	        Math.cos(angle) * Math.sqrt(1 - Math.pow(u, 2)) * r,
	        Math.sin(angle) * Math.sqrt(1 - Math.pow(u, 2)) * r,
	        u * r
	    );
	    return v;
	},
	float32Concat: function(first, second) {
	    var firstLength = first.length;
	    var result = new Float32Array(firstLength + second.length);
	    result.set(first);
	    result.set(second, firstLength);
	    return result;
	}
};