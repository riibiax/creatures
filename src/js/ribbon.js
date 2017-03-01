const ribbonLength = 750; //number of spine points
const ribbonNoiseScale = 5000; //Turbulance
const ribbonNoiseSeparation = 1.5; //0, 0.5 'Cohesion'
const ribbonSpeed = .05; // 0.1, 5

const up = new THREE.Vector3(0, 1, 0);
var vec = new THREE.Vector3();
var tangent = new THREE.Vector3();
var normal = new THREE.Vector3();

const createRibbonGeometry = function() {
	//make geometry, faces & colors for a ribbon
	var i;
	var geom = new THREE.Geometry();
	geom.vertexColors = [];
	//create verts + colors
	for (i = 0; i < ribbonLength; i ++) {
		geom.vertices.push(new THREE.Vector3());
		geom.vertices.push(new THREE.Vector3());
		geom.vertexColors.push(new THREE.Color());
		geom.vertexColors.push(new THREE.Color());
	}
	//create faces
	for (i = 0; i < ribbonLength - 1; i ++) {
		geom.faces.push( new THREE.Face3(i * 2, i * 2 + 1, i * 2 + 2));
		geom.faces.push( new THREE.Face3(i * 2 + 1, i * 2 + 3, i * 2 + 2));
	}
	return geom;
}

const reset = function() {
	//reset a ribbon back to an emitter
	var i;
	this.id = Math.random()*ribbonNoiseSeparation;
	this.head.copy(ATUtil.randomVector3(this.bounds));
	//reset tail position
	this.tail.copy(this.head);
	//reset mesh geom
	for (i = 0; i < ribbonLength; i ++) {
		this.meshGeom.vertices[i * 2].copy(this.head);
		this.meshGeom.vertices[i * 2 + 1].copy(this.head);
	}
	//init colors for this ribbon
	//hue is set by start x position
	var hue = (this.head.x /(this.bounds * .5)) * .5 + .5;
	if (Math.random() < .1)  hue = Math.random();
	var sat = ATUtil.randomRange(.6, 1);
	var lightness = ATUtil.randomRange(.2, .6);
	var col = new THREE.Color();
	for (i = 0; i < ribbonLength - 1; i ++) {
		//add lightness gradient based on spine position
		col.setHSL( hue, sat, (1 - i/ ribbonLength) * lightness * .25 + lightness * 3 * .25 );
		this.meshGeom.faces[i * 2].color.copy(col);
		this.meshGeom.faces[i * 2 + 1].color.copy(col);
	}
	this.meshGeom.verticesNeedUpdate = true;
	this.meshGeom.colorsNeedUpdate = true;
}


function Ribbon(bounds) {
	this.bounds = bounds;
	this.velocity = new THREE.Vector3();
	this.speed = ATUtil.randomRange(1., 3.);
	this.ribbonWidth = ATUtil.randomRange(.75, 1.5);
	//head is the thing that moves, tail follows behind
	this.head = new THREE.Vector3();
	this.tail = new THREE.Vector3();
	//ADD MESH
	this.meshGeom = createRibbonGeometry.call(this);
	reset.call(this);
}


Ribbon.prototype =  {

	constructor: Ribbon,

    update: function(time) {
    	time /= 50000.;
		//MOVE HEAD
		this.tail.copy(this.head);

		//move head via noisefield
		//3 noisefields one for each axis (using offset of 50 to create new field)
		//3D noisefield is a greyscale 3D cloud with values varying from -1 to 1
		//4th dimension is time to make cloud change over time
		
		vec.copy(this.head).divideScalar(ribbonNoiseScale);

		this.velocity.x = noise.noise4d(vec.x, vec.y, vec.z, time + this.id ) * this.speed * ribbonSpeed;
		this.velocity.y = noise.noise4d(vec.x, vec.y, vec.z, time + this.id * 10. ) * this.speed * ribbonSpeed;
		this.velocity.z = noise.noise4d(vec.x, vec.y, vec.z, time + this.id * 5.) * this.speed * ribbonSpeed;
		this.head.add(this.velocity);

		//reset if Out Of Bounds
		
		if (this.head.x > this.bounds || this.head.x < -this.bounds ||
			this.head.y > this.bounds || this.head.y < -this.bounds ||
			this.head.z > this.bounds || this.head.z < -this.bounds ) {
			reset.call(this);
		}

		//UPDATE MESH GEOM

		//add 2 new verts onto the end of the mesh geometry
		//rather than push and pop we copy each vert into the previous one
		//to prevent memory thrashing
		
		
		//calc new L + R edge positions from tangent between head and tail
		tangent.subVectors(this.head,this.tail).normalize();
		vec.crossVectors( tangent, up ).normalize();
		normal.crossVectors( tangent, vec );
		normal.multiplyScalar(this.ribbonWidth);

		//shift each 2 verts down one posn
		//e.g. copy verts (0,1) -> (2,3)
		var i;
		for (i = ribbonLength - 1; i > 0; i --) {
			this.meshGeom.vertices[i * 2].copy(this.meshGeom.vertices[(i - 1) * 2]);
			this.meshGeom.vertices[i * 2 + 1].copy(this.meshGeom.vertices[(i - 1) * 2 + 1]);
		}

		//populate 1st 2 verts with left and right edges
		this.meshGeom.vertices[0].copy(this.head).add(normal);
		this.meshGeom.vertices[1].copy(this.head).sub(normal);

		this.meshGeom.verticesNeedUpdate = true;
	}
};