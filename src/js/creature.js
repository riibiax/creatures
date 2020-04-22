'use strict';
const createMeshGeom = function() {
	var offset = new THREE.Vector2();
	
	var creatureGeometry = new THREE.Geometry();

	var creatureIndexes = [];
	creatureIndexes.push(0);

    var nose = creatingNose(offset);
    creatureGeometry.merge(nose);
    creatureIndexes.push(nose.vertices.length);

    creatureGeometry.computeBoundingBox();
    creatureGeometry.computeBoundingSphere();
    offset.x = creatureGeometry.boundingBox.max.x;
    offset.y = creatureGeometry.boundingBox.max.y * 1.5 - creatureGeometry.boundingSphere.center.y;
    var offsetYMouth = -creatureGeometry.boundingBox.max.y + creatureGeometry.boundingSphere.center.y*2.;

    var eyes = creatingEyes(offset);
    creatureGeometry.merge(eyes);
    var eyesGeometrySize = eyes.vertices.length*0.5;
    creatureIndexes.push(creatureIndexes[creatureIndexes.length-1]+eyesGeometrySize);
   	creatureIndexes.push(creatureIndexes[creatureIndexes.length-1]+eyesGeometrySize);


    creatureGeometry.computeBoundingBox();
    offset.x = creatureGeometry.boundingBox.max.x;
    offset.y = creatureGeometry.boundingBox.max.y;

    var ears = creatingEars(offset);
    creatureGeometry.merge(ears);
    var earsGeometrySize = ears.vertices.length*0.5;
    creatureIndexes.push(creatureIndexes[creatureIndexes.length-1]+earsGeometrySize);
   	creatureIndexes.push(creatureIndexes[creatureIndexes.length-1]+earsGeometrySize);

    offset.y =  offsetYMouth;

    var mouth = creatingMouth(offset);
    creatureGeometry.merge(mouth);
    creatureIndexes.push(creatureIndexes[creatureIndexes.length-1]+mouth.vertices.length);

    //creatureGeometry.computeFaceNormals();
    //creatureGeometry.computeVertexNormals();
    creatureGeometry.scale(this.scale, this.scale, this.scale);
    creatureGeometry.translate(this.position.x, this.position.y, this.position.z);
	
	return { geometry: creatureGeometry, indexes: creatureIndexes};
}

const creatingNose = function(offset) {
    var coneUpDown = new THREE.ConeGeometry(1., 1., 14, 5);
    coneUpDown.computeBoundingBox();
    coneUpDown.applyMatrix(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), Math.PI));
    coneUpDown.applyMatrix(new THREE.Matrix4().makeTranslation(0, -coneUpDown.boundingBox.max.y * .5, 0));                
    var coneDownUp = new THREE.ConeGeometry(1., 1., 14, 5);
    coneDownUp.computeBoundingBox();
    coneDownUp.applyMatrix(new THREE.Matrix4().makeTranslation(0, coneDownUp.boundingBox.max.y, 0)); 
    var box = new THREE.BoxGeometry(.75, .75, .75, 3, 3, 3);
    box.computeBoundingBox();
    box.applyMatrix(new THREE.Matrix4().makeTranslation(0, -box.boundingBox.max.y * .75, 0));
    var sphere = new THREE.SphereGeometry(.5, 10, 7);
    sphere.computeBoundingBox();
    sphere.applyMatrix(new THREE.Matrix4().makeTranslation(0, sphere.boundingBox.max.y * .5, 0));
    var cylinder =  new THREE.CylinderGeometry(.5, .5, 1.25, 12, 7);
    var noseGeometries = [
        coneUpDown,
        coneDownUp,
        box,
        sphere,
        cylinder
    ];
    var index = ATUtil.randomInt(0, noseGeometries.length-1);
    return noseGeometries [index | 0];
}

const creatingEyes = function(offset) {
    var coneUpDown = new THREE.ConeGeometry( .5, .5, 7, 4);
    coneUpDown.applyMatrix(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), Math.PI));
    var coneDownUp = new THREE.ConeGeometry( .5, .5, 7, 4);
    var box = new THREE.BoxGeometry(.5, .5, .5, 2, 2, 2);
    var sphere = new THREE.SphereGeometry( .25, 7, 4);
    var cylinderVertical =  new THREE.CylinderGeometry( .25, .25, .5, 7, 5);
    var cylinderHorizontal = new THREE.CylinderGeometry( .25, .25, .5, 7, 5);
    cylinderHorizontal.applyMatrix(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), Math.PI / 2.));
    var torus = new THREE.TorusGeometry( .25, .1, 3, 12);
    torus.computeBoundingBox();
    torus.applyMatrix(new THREE.Matrix4().makeTranslation(.0, -torus.boundingBox.max.y * .25, 0));
    var torusUp = new THREE.TorusGeometry( .25, .1, 3, 6, Math.PI );
    torusUp.computeBoundingBox();
    torusUp.applyMatrix(new THREE.Matrix4().makeTranslation(.0, -torusUp.boundingBox.max.y * .5, 0));
    var torusDown = new THREE.TorusGeometry( .25, .1, 3, 6, -Math.PI );
    torusDown.applyMatrix(new THREE.Matrix4().makeTranslation(.0, torusUp.boundingBox.max.y , 0));
    var torusHorizontal = new THREE.TorusGeometry( .25, .1, 3, 12);
    torusHorizontal.applyMatrix(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI/2));  

    var eyesGeometries = [
        coneUpDown,
        coneDownUp,
        box,
        sphere,
        cylinderVertical,
        cylinderHorizontal,
        torus,
        torusUp,
        torusDown,
        torusHorizontal
    ];
    var index = ATUtil.randomInt(0, eyesGeometries.length-1);
    var eyesGeometry = eyesGeometries[ index | 0 ];
    eyesGeometry.computeBoundingBox();
    var eyesGeometrySpecular = eyesGeometry.clone();
    eyesGeometrySpecular.computeBoundingBox();

    eyesGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(offset.x + eyesGeometry.boundingBox.max.x * .5, offset.y + eyesGeometry.boundingBox.max.y * 2., 0));
    eyesGeometrySpecular.applyMatrix(new THREE.Matrix4().makeTranslation(-offset.x - eyesGeometrySpecular.boundingBox.max.x * .5, offset.y +  eyesGeometrySpecular.boundingBox.max.y * 2., 0));

    eyesGeometry.merge(eyesGeometrySpecular);
    return eyesGeometry;
}

const creatingEars = function(offset) {
    var rotatedConeUp = new THREE.ConeGeometry(.25, 1.5, 7, 7);
    rotatedConeUp.applyMatrix(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), -Math.PI / 8.));

    var rotatedConeDown =  new THREE.ConeGeometry(.25, 2., 7, 7);
    rotatedConeDown.applyMatrix(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), -Math.PI / 4. * 3.));
    rotatedConeDown.computeBoundingBox();
    rotatedConeDown.applyMatrix(new THREE.Matrix4().makeTranslation(0, -rotatedConeDown.boundingBox.max.y, 0));

    var box = new THREE.BoxGeometry(.25, .25, .25, 2, 2, 2);
    box.applyMatrix(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), Math.PI / 4.)); 

    var sphere = new THREE.SphereGeometry(.25, 7, 5);

    var cylinderUp = new THREE.CylinderGeometry(.125, .125, .75, 7, 4);
    cylinderUp.applyMatrix(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), -Math.PI / 8.));

    var cylinderDown = new THREE.CylinderGeometry(.125, .125, 1., 7, 4);
    cylinderDown.applyMatrix(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), -Math.PI / 4. * 3.));
    cylinderDown.computeBoundingBox();
    cylinderDown.applyMatrix(new THREE.Matrix4().makeTranslation(0, -cylinderDown.boundingBox.max.y, 0));

    var earsGeometries = [
        rotatedConeUp,
        rotatedConeDown,
        box,
        sphere,
        cylinderUp,
        cylinderDown
    ];
    var index = ATUtil.randomInt(0, earsGeometries.length-1);
    var earsGeometry = earsGeometries[ index | 0 ];
    earsGeometry.computeBoundingBox();
    var earsGeometrySpecular = earsGeometry.clone();
    earsGeometrySpecular.computeBoundingBox();

    earsGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(offset.x + earsGeometry.boundingBox.max.x*1.5, offset.y + earsGeometry.boundingBox.max.y, 0));
    if(index == 0 || index == 4){
        earsGeometrySpecular.applyMatrix(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), Math.PI / 4.)); 
        earsGeometrySpecular.applyMatrix(new THREE.Matrix4().makeTranslation(-offset.x - earsGeometrySpecular.boundingBox.max.x*1.5, offset.y +  earsGeometrySpecular.boundingBox.max.y, 0));
    }
    else if(index == 1 || index == 5){
        earsGeometrySpecular.applyMatrix(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), Math.PI / 2. * 3)); 
        earsGeometrySpecular.applyMatrix(new THREE.Matrix4().makeTranslation(-offset.x - earsGeometrySpecular.boundingBox.max.x*1.5, offset.y -earsGeometrySpecular.boundingBox.max.y, 0));
    }
    else if(index == 2 || index == 3){
        earsGeometrySpecular.applyMatrix(new THREE.Matrix4().makeTranslation(-offset.x - earsGeometrySpecular.boundingBox.max.x*1.5, offset.y +earsGeometrySpecular.boundingBox.max.y, 0));
    }
    else{
        earsGeometrySpecular.applyMatrix(new THREE.Matrix4().makeTranslation(-offset.x - earsGeometrySpecular.boundingBox.max.x*1.5, offset.y +earsGeometrySpecular.boundingBox.max.y, 0));
    }
    
    earsGeometry.merge(earsGeometrySpecular);
    return earsGeometry;
}

const creatingMouth = function(offset) {
    var coneUpDown = new THREE.ConeGeometry(2., 1., 28, 10);
    coneUpDown.applyMatrix(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), Math.PI));              
    var coneDownUp = new THREE.ConeGeometry(2.25, 1.25, 28, 10);
    var box = new THREE.BoxGeometry(2.5, 1., 2.5, 8, 6, 8);
    box.applyMatrix(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), Math.PI/4));
    var sphere = new THREE.SphereGeometry(1.25, 14, 14);

    var circle = new THREE.CircleGeometry( 1.5, 30 );
    circle.applyMatrix(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), Math.PI));
    var halfSphere = new THREE.SphereGeometry(1.5, 12, 12, 0, Math.PI);
    halfSphere.merge(circle);
    halfSphere.applyMatrix(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2.));
    halfSphere.computeFaceNormals();
    halfSphere.computeVertexNormals();

    var cylinder =  new THREE.CylinderGeometry(.25, .25, 3., 10, 16);
    cylinder.applyMatrix(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), Math.PI / 2.));

    var torusVertical = new THREE.TorusGeometry( 1., .15, 8, 26);

    var torusHorizontal = new THREE.TorusGeometry( 1.5, .25, 8, 26);
    torusHorizontal.applyMatrix(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI/2));  

    var mouthGeometries = [
        coneUpDown,
        coneDownUp,
        box,
        sphere,
        halfSphere,
        cylinder,
        torusVertical, 
        torusHorizontal
    ];
    var index = ATUtil.randomInt(0, mouthGeometries.length-1);
    var mouthGeometry = mouthGeometries[ index | 0 ];
    mouthGeometry.computeBoundingBox();
    if(index == 0){
        mouthGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, offset.y - mouthGeometry.boundingBox.max.y * 3.5, 0));
    }
    else if (index == 1){
        mouthGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, offset.y - mouthGeometry.boundingBox.max.y * 2.5, 0));
    }
    else if (index == 2){
        mouthGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, offset.y - mouthGeometry.boundingBox.max.y * 3.5, 0));
    }
    else if (index == 3){
        mouthGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, offset.y - mouthGeometry.boundingBox.max.y * 1.5, 0));
    }
    else if (index == 4){
        mouthGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, offset.y - mouthGeometry.boundingBox.max.x * .5, 0));
    }
    else if (index == 5){
        mouthGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, offset.y - mouthGeometry.boundingBox.max.y * 6., 0));
    }
    else if(index == 6){
        mouthGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, offset.y - mouthGeometry.boundingBox.max.x * 1.5, 0));
    }
    else if(index == 7){
        mouthGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, offset.y - mouthGeometry.boundingBox.max.x * .75, 0));
    }
    return mouthGeometry;
}

const createParticlesMesh = function(particlesGeometry, particlesMaterial) {
	var bufferGeometry = new THREE.BufferGeometry()
    var bufferGeometrySize = particlesGeometry.vertices.length;
    var geometryVertices = particlesGeometry.vertices;
    var customPosition = new Float32Array( bufferGeometrySize * 3 );
    var positions = new Float32Array( bufferGeometrySize * 3 );

    var v, i3, vector;
    for (v = 0, i3 = 0; v < bufferGeometrySize; v ++, i3 += 3) {
        vector = ATUtil.randomPointOnParticles(1 + Math.random() * 1.5);
        positions[ i3 	  ] = vector.x;
        positions[ i3 + 1 ] = vector.y;
        positions[ i3 + 2 ] = vector.z;

        customPosition[ i3     ] = geometryVertices[ v ].x;
        customPosition[ i3 + 1 ] = geometryVertices[ v ].y;
        customPosition[ i3 + 2 ] = geometryVertices[ v ].z;
    } 

    bufferGeometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3));
    bufferGeometry.addAttribute( 'customPosition', new THREE.BufferAttribute( customPosition, 3).setDynamic(true));
    var creatureParticleMesh = new THREE.Points( bufferGeometry, particlesMaterial );
    creatureParticleMesh.geometry.attributes.customPosition.needsUpdate = true;
    creatureParticleMesh.material.uniforms.scale.value = this.scale;
    return creatureParticleMesh;
}

const createTrianglesMesh = function(trianglesGeometry, trianglesIndexes, trianglesMaterial) {
	var bufferGeometry = new THREE.BufferGeometry();
	var verticesGeometry = trianglesGeometry.vertices;
    var bufferGeometrySize = trianglesGeometry.vertices.length;

	var vertices = new Float32Array(bufferGeometrySize * 3 * 3);
    var f, i;
    var currentStep = 0;
    var randomIndex;
    for (i = 0, f = 0; f < bufferGeometrySize; i += 3) {
        if(i % 9 == 0 ) {
            vertices[ i     ] = verticesGeometry[ f ].x;
            vertices[ i + 1 ] = verticesGeometry[ f ].y;
            vertices[ i + 2 ] = verticesGeometry[ f ].z;
            if(f >= trianglesIndexes[currentStep]) {
        		currentStep++;
        	}
            f++;
        }
        else {
            randomIndex = ATUtil.randomInt(trianglesIndexes [currentStep-1], trianglesIndexes [currentStep] - 1);
            vertices[ i     ] = verticesGeometry[ randomIndex ].x * (Math.random() * .3 + 1);
            vertices[ i + 1 ] = verticesGeometry[ randomIndex ].y * (Math.random() * .3 + 1);
            vertices[ i + 2 ] = verticesGeometry[ randomIndex ].z * (Math.random() * .3 + 1);
        }
    }
    var bufferGeometrySizeColor = bufferGeometrySize * 3 * 4;
    var colors = new Uint8Array( bufferGeometrySize * 3 * 4);
    for (i = 0; i < bufferGeometrySizeColor; i += 4) {
        colors[ i     ] = Math.random() * 255;
        colors[ i + 1 ] = Math.random() * 255;
        colors[ i + 2 ] = Math.random() * 255;
        colors[ i + 3 ] = Math.random() * 255;
    }

	bufferGeometry.addAttribute( 'position', new THREE.BufferAttribute(vertices, 3));
    bufferGeometry.addAttribute( 'color', new THREE.BufferAttribute(colors, 4, true));
	var creatureRawMesh = new THREE.Mesh(bufferGeometry, trianglesMaterial);
    return creatureRawMesh;
}


function Creature(posX, posY, posZ, scale, particlesMaterial, trianglesMaterial, ribbonsCount) {
	this.creatureHolder = new THREE.Group();
    this.position = new THREE.Vector3();
    this.position.set(posX || 0, posY || 0, posZ || 0);
    this.scale = scale;
	this.state = 0;
    this._ribbons = [];
	var meshGeom = createMeshGeom.call(this);
	this.creatureHolder.add( createParticlesMesh.call(this, meshGeom.geometry, particlesMaterial));

	this.creatureHolder.add( createTrianglesMesh.call(this, meshGeom.geometry, meshGeom.indexes, trianglesMaterial) );
    this.creatureHolder.children[1].visible = false;
    meshGeom.geometry.computeBoundingSphere();
    var bounds = meshGeom.geometry.boundingSphere.radius;
    var ribbon;
    var i;
    for (i = 0; i < ribbonsCount; i++) {
        ribbon = new Ribbon(bounds, scale);
        this._ribbons.push(ribbon);
        this.creatureHolder.add(new THREE.Mesh( ribbon.meshGeom, trianglesMaterial ));
    }
}    

Creature.prototype =  {

	constructor: Creature,

    update: function(time) {
        var i;
        var ribbonLength = this._ribbons.length;
        for (i = 0; i < ribbonLength; i++) {
            this._ribbons[i].update(time);
        }
        this.creatureHolder.rotation.y = time * 0.0005;
	},

	switchState: function() {
	   	if (this.state == 0) {
			this.state = 1;
            this.creatureHolder.children[0].visible = false;
            this.creatureHolder.children[1].visible = true;
		}
		else {
			this.state = 0;
            this.creatureHolder.children[0].visible = true;
            this.creatureHolder.children[1].visible = false;
		}
	}
};