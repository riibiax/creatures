var Creature = function(posX, posY, posZ, scale, material1, material2){

	this.init = function(){

		this.position = new THREE.Vector3();
		this.position.x =  posX || 0;
		this.position.y =  posY || 0;
		this.position.z =  posZ || 0;

		this.meshes = [];
		this.state = 0;
		this.atween;
		this.btween;

		var meshGeom = createMeshGeom();

        this.meshes.push( createParticlesMesh(meshGeom[0]) );
        startParticlesAnimation(this.meshes[0]);

		this.meshes.push( createTrianglesMesh(meshGeom[1]) );
	};


	this.update = function(time) {
    	this.meshes[this.state].rotation.y = time * 0.0005;
    	this.meshes[this.state].material.uniforms.time.value = time * 0.005;
	};

	this.switchState = function() {
	   	if (this.state == 0) {
    		this.state = 1;
    		stopParticlesAnimation();	
    	}
    	else  {
    		this.state = 0;
    		startParticlesAnimation(this.meshes[this.state]);
    	}
	};

	function createParticlesMesh(particlesGeometry) {
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
        var creatureParticleMesh = new THREE.Points( bufferGeometry, material2 );
        creatureParticleMesh.geometry.attributes.customPosition.needsUpdate = true;
        return creatureParticleMesh;
	}

	function createTrianglesMesh(trianglesArray) {
		var bufferGeometry = new THREE.BufferGeometry();
		bufferGeometry.addAttribute( 'position', new THREE.BufferAttribute(trianglesArray, 3));
        var bufferGeometrySize = Math.floor(trianglesArray.length / 3);
        var colors = new Uint8Array( bufferGeometrySize * 4 );
        var n, l;
        for (n = 0, l = bufferGeometrySize * 4; n < l; n += 4) {
            colors[ n     ] = Math.random() * 255;
            colors[ n + 1 ] = Math.random() * 255;
            colors[ n + 2 ] = Math.random() * 255;
            colors[ n + 3 ] = Math.random() * 255;
        }
        bufferGeometry.addAttribute( 'color', new THREE.BufferAttribute(colors, 4, true));
		var creatureRawMesh = new THREE.Mesh(bufferGeometry, material1);
        return creatureRawMesh;
	}

	function startParticlesAnimation(particleMesh) {
		if (!this.atween && !this.btween) {
			this.atween = new TWEEN.Tween(particleMesh.material.uniforms.amplitude)
	            .to({value: 0.0}, 3000)
	            .delay(1000)
	            .easing(TWEEN.Easing.Back.InOut);
	        this.btween = new TWEEN.Tween(particleMesh.material.uniforms.amplitude)
	            .to({value: 1.0}, 3000)
	            .delay(1000)
	            .easing(TWEEN.Easing.Back.InOut);
	        this.atween.chain(this.btween);
	        this.btween.chain(this.atween);
		}
        this.atween.start();
	}

	function stopParticlesAnimation() {
		if (this.atween) {
			this.atween.stop();
		}
	}

	function getTrianglesVertices(geom) {
        var verticesGeometry = geom.vertices;
        var verticesGeometrySize = geom.vertices.length;
        var vertices = new Float32Array(verticesGeometrySize * 3 * 3);
        var n, f;
        var randomIndex;
        for (n = 0, f = 0; f < verticesGeometrySize; n += 3)
        {
            if(n % 9 == 0 )
            {
                vertices[ n     ] = verticesGeometry[ f ].x;
                vertices[ n + 1 ] = verticesGeometry[ f ].y;
                vertices[ n + 2 ] = verticesGeometry[ f ].z;
                f++;
            }
            else
            {
                randomIndex = ATUtil.randomInt(0, verticesGeometrySize - 1);
                vertices[ n     ] = verticesGeometry[ randomIndex ].x * (Math.random() * .3 + 1);
                vertices[ n + 1 ] = verticesGeometry[ randomIndex ].y * (Math.random() * .3 + 1);
                vertices[ n + 2 ] = verticesGeometry[ randomIndex ].z * (Math.random() * .3 + 1);
            }
        }
        return vertices;
	}

	function createMeshGeom() {
		var offset = new THREE.Vector2();
		
		var creatureGeometry = new THREE.Geometry();

		var rawVerticesArray = [];

	    var noseGeometry = creatingNose(offset);

	    creatureGeometry.merge(noseGeometry[0]);
	   	rawVerticesArray = ATUtil.float32Concat(rawVerticesArray, noseGeometry[1]);

	    creatureGeometry.computeBoundingBox();
	    creatureGeometry.computeBoundingSphere();
	    offset.x = creatureGeometry.boundingBox.max.x;
	    offset.y = creatureGeometry.boundingBox.max.y * 1.5 - creatureGeometry.boundingSphere.center.y;
	    var offsetYMouth = -creatureGeometry.boundingBox.max.y + creatureGeometry.boundingSphere.center.y*2.;

	    var eyesGeometry = creatingEyes(offset);
	    
	    creatureGeometry.merge(eyesGeometry[0]);
	    rawVerticesArray = ATUtil.float32Concat(rawVerticesArray, eyesGeometry[1]);
	    creatureGeometry.computeBoundingBox();
	    offset.x = creatureGeometry.boundingBox.max.x;
	    offset.y = creatureGeometry.boundingBox.max.y;

	    var earsGeometry = creatingEars(offset);
	    creatureGeometry.merge(earsGeometry[0]);
		rawVerticesArray = ATUtil.float32Concat(rawVerticesArray, earsGeometry[1]);

	    offset.y =  offsetYMouth;
	    var mouthGeometry = creatingMouth(offset);
	    creatureGeometry.merge(mouthGeometry[0]);
	    rawVerticesArray = ATUtil.float32Concat(rawVerticesArray, mouthGeometry[1]);
	    //creatureGeometry.computeFaceNormals();
	    //creatureGeometry.computeVertexNormals();
		
		return [creatureGeometry, rawVerticesArray];
	};

	function creatingNose(offset) {
	    var coneUpDown = new THREE.ConeGeometry(1., 1., 3, 15);
	    coneUpDown.computeBoundingBox();
	    coneUpDown.applyMatrix(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), Math.PI));
	    coneUpDown.applyMatrix(new THREE.Matrix4().makeTranslation(0, -coneUpDown.boundingBox.max.y * .5, 0));                
	    var coneDownUp = new THREE.ConeGeometry(1., 1., 3, 15);
	    coneDownUp.computeBoundingBox();
	    coneDownUp.applyMatrix(new THREE.Matrix4().makeTranslation(0, coneDownUp.boundingBox.max.y, 0)); 
	    var box = new THREE.BoxGeometry(.75, .75, .75, 5, 5, 5);
	    box.computeBoundingBox();
	    box.applyMatrix(new THREE.Matrix4().makeTranslation(0, -box.boundingBox.max.y * .75, 0));
	    var sphere = new THREE.SphereGeometry(.5, 12, 12);
	    sphere.computeBoundingBox();
	    sphere.applyMatrix(new THREE.Matrix4().makeTranslation(0, sphere.boundingBox.max.y * .5, 0));
	    var cylinder =  new THREE.CylinderGeometry(.5, .5, 1.25, 12, 10);
	    var noseGeometries = [
	        coneUpDown,
	        coneDownUp,
	        box,
	        sphere,
	        cylinder
	    ];
	    var index = ATUtil.randomInt(0, noseGeometries.length-1);
	    var noseGeometry = noseGeometries [index | 0];
	    var rawVertices = getTrianglesVertices(noseGeometry);
	    return [noseGeometry, rawVertices];
	}

	function creatingEyes(offset) {
	    var coneUpDown = new THREE.ConeGeometry( .5, .5, 3, 15);
	    coneUpDown.applyMatrix(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), Math.PI));
	    var coneDownUp = new THREE.ConeGeometry( .5, .5, 3, 15);
	    var box = new THREE.BoxGeometry(.5, .5, .5, 5, 5, 5);
	    var sphere = new THREE.SphereGeometry( .25, 12, 12);
	    var cylinderVertical =  new THREE.CylinderGeometry( .25, .25, .5, 12, 10);
	    var cylinderHorizontal = new THREE.CylinderGeometry( .25, .25, .5, 12, 10);
	    cylinderHorizontal.applyMatrix(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), Math.PI / 2.));
	    var torus = new THREE.TorusGeometry( .25, .1, 16, 20);
	    torus.computeBoundingBox();
	    torus.applyMatrix(new THREE.Matrix4().makeTranslation(.0, -torus.boundingBox.max.y * .25, 0));
	    var torusUp = new THREE.TorusGeometry( .25, .1, 16, 20, Math.PI );
	    torusUp.computeBoundingBox();
	    torusUp.applyMatrix(new THREE.Matrix4().makeTranslation(.0, -torusUp.boundingBox.max.y * .5, 0));
	    var torusDown = new THREE.TorusGeometry( .25, .1, 16, 20, -Math.PI );
	    torusDown.applyMatrix(new THREE.Matrix4().makeTranslation(.0, torusUp.boundingBox.max.y , 0));
	    var torusHorizontal = new THREE.TorusGeometry( .25, .1, 16, 20);
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

	    var rawVertices = getTrianglesVertices(eyesGeometry);
	    rawVertices = ATUtil.float32Concat(rawVertices, getTrianglesVertices(eyesGeometrySpecular));

	    eyesGeometry.merge(eyesGeometrySpecular);
	    return [eyesGeometry, rawVertices];
	}

	function creatingEars(offset) {
	    var rotatedConeUp = new THREE.ConeGeometry(.25, 1.5, 4, 15);
	    rotatedConeUp.applyMatrix(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), -Math.PI / 8.));

	    var rotatedConeDown =  new THREE.ConeGeometry(.25, 2., 4, 15);
	    rotatedConeDown.applyMatrix(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), -Math.PI / 4. * 3.));
	    rotatedConeDown.computeBoundingBox();
	    rotatedConeDown.applyMatrix(new THREE.Matrix4().makeTranslation(0, -rotatedConeDown.boundingBox.max.y, 0));

	    var box = new THREE.BoxGeometry(.25, .25, .25, 5, 5, 5);
	    box.applyMatrix(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), Math.PI / 4.)); 

	    var sphere = new THREE.SphereGeometry(.25, 12, 12);

	    var cylinderUp = new THREE.CylinderGeometry(.125, .125, .75, 12, 10);
	    cylinderUp.applyMatrix(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), -Math.PI / 8.));

	    var cylinderDown = new THREE.CylinderGeometry(.125, .125, 1., 12, 10);
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
	    var rawVertices = getTrianglesVertices(earsGeometry);
	    rawVertices = ATUtil.float32Concat(rawVertices, getTrianglesVertices(earsGeometrySpecular));

	    earsGeometry.merge(earsGeometrySpecular);
	    return [earsGeometry, rawVertices];
	}

	function creatingMouth(offset) {
	    var coneUpDown = new THREE.ConeGeometry(2., 1., 25, 10);
	    coneUpDown.applyMatrix(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), Math.PI));              
	    var coneDownUp = new THREE.ConeGeometry(2.25, 1.25, 25, 10);
	    var box = new THREE.BoxGeometry(2.5, 1., 2.5, 10, 10, 10);
	    box.applyMatrix(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), Math.PI/4));
	    var sphere = new THREE.SphereGeometry(1.25, 12, 12);

	    var circle = new THREE.CircleGeometry( 1.5, 32 );
	    circle.applyMatrix(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), Math.PI));
	    var halfSphere = new THREE.SphereGeometry(1.5, 12, 12, 0, Math.PI);
	    halfSphere.merge(circle);
	    halfSphere.applyMatrix(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2.));
	    halfSphere.computeFaceNormals();
	    halfSphere.computeVertexNormals();

	    var cylinder =  new THREE.CylinderGeometry(.25, .25, 3., 12, 10);
	    cylinder.applyMatrix(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), Math.PI / 2.));

	    var torusVertical = new THREE.TorusGeometry( 1., .15, 16, 20);

	    var torusHorizontal = new THREE.TorusGeometry( 1.5, .25, 16, 20);
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

	    var rawVertices = getTrianglesVertices(mouthGeometry);
	    return [mouthGeometry, rawVertices];
	}

};