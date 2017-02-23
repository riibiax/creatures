var THREE = require('three');
var TWEEN = require("tween.js");
var io = require('socket.io-client');
var socket;

if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var frameLimit=90;
var currentFrame=0;

var canvas, content;

var scenes = [], renderer;

var stats;

var verticesBufferGeometry;
var textures = {};
var baseSize;
var visualisation = {
    standardMaterial :  false,
    rawShader: false,
    particlesMaterial: true,
    ribbonMode: false
} 


var RIBBON_COUNT = 600;
var ribbons = [];

var EMITTER_COUNT = 10;
var emitters = [];

var noise = new SimplexNoise();
var noiseTime = Math.random()*1000;

var worldHolder;


createTextures();
init();

function init() {
    canvas = document.getElementById( "c" );                
    content = document.getElementById( "content" );
    
    createSubmit();
    
    socketInit();

    addStats();
}

function createSubmit() {
    var submit = document.createElement( "INPUT" );
    submit.setAttribute("id", "submit"); 
    submit.setAttribute("type", "submit"); 
    submit.setAttribute("onclick", "sendLocation();"); 
    content.appendChild( submit );
}

function initSketch(numberInstances) {
    var template = document.getElementById( "template" ).text;
    var i;
    
    for (i =  0; i < numberInstances; i ++) {

        verticesBufferGeometry = [];
        var scene = new THREE.Scene();

        // make a list item
        var element = document.createElement( "div" );
        element.className = "list-item";
        element.innerHTML = template.replace( '$', i + 1 );

        // Look up the element that represents the area
        // we want to render the scene
        scene.userData.element = element.querySelector( ".scene" );
        content.appendChild( element );

        var camera = new THREE.PerspectiveCamera( 50, 1, 1, 20 );
        camera.position.z = 10;
        scene.userData.camera = camera;

        var controls = new THREE.OrbitControls( scene.userData.camera, scene.userData.element );
        controls.minDistance = 1;
        controls.maxDistance = 15;
        controls.enablePan = false;
        controls.enableZoom = true;
        scene.userData.controls = controls;

        // add one random mesh to each scene

       
        var geometry = creatingCreature();
        var creatureMesh;
        if(visualisation.rawShader || visualisation.particlesMaterial){
            var bufferGeometry = new THREE.BufferGeometry();
        }
        if(visualisation.standardMaterial)
        {
            var standardMaterial = new THREE.MeshStandardMaterial( {
                color: new THREE.Color().setHSL( Math.random(), 1, 0.75 ),
                roughness: 0.5,
                metalness: 0,
                shading: THREE.FlatShading,
                //wireframe: true
            } );
            creatureMesh = new THREE.Mesh(geometry, standardMaterial);

        } 
        else if(visualisation.rawShader)
        {
            bufferGeometry.addAttribute( 'position', new THREE.BufferAttribute( verticesBufferGeometry, 3 ) );
            var bufferGeometrySize = Math.floor(verticesBufferGeometry.length/3);
            var colors = new Uint8Array( bufferGeometrySize * 4 );
            for ( var n = 0, l = bufferGeometrySize * 4; n < l; n += 4 ) {
                colors[ n     ] = Math.random() * 255;
                colors[ n + 1 ] = Math.random() * 255;
                colors[ n + 2 ] = Math.random() * 255;
                colors[ n + 3 ] = Math.random() * 255;
            }

            bufferGeometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 4, true ) );

            var rawShaderMaterial = new THREE.RawShaderMaterial( {
                uniforms: {
                    time: { value: 1.0 }
                },
                vertexShader: document.getElementById( 'vertexRawShader' ).textContent,
                fragmentShader: document.getElementById( 'fragmentRawShader' ).textContent,
                side: THREE.DoubleSide,
                transparent: true
            } );
            creatureMesh = new THREE.Mesh(bufferGeometry,rawShaderMaterial);
        }
        else if(visualisation.particlesMaterial)
        {
            var uniformsParticles = {
                amplitude: { type: "f", value: 1.0 },
                texture:   { type: "t", value: textures.map },
                time:      { type: "f", value: 0.1 },
                noiseFactor: { type: "f", value: 0.1 } ,
            };

            var shaderMaterialParticles = new THREE.ShaderMaterial( {
                uniforms:       uniformsParticles,
                vertexShader:   document.getElementById( 'vertexParticleShader' ).textContent,
                fragmentShader: document.getElementById( 'fragmentParticleShader' ).textContent,
                blending:       THREE.AdditiveBlending,
                depthTest:      false,
                transparent:    true
            });

            var geometrySize = geometry.vertices.length;
            var geometryVertices = geometry.vertices;
            var sizes = new Float32Array( geometrySize );
            var customPosition = new Float32Array( geometrySize * 3 );
            var positions = new Float32Array( geometrySize * 3 );
            baseSize = []; 
            var indexParticles;
            for (var v = 0, i3 = 0; v < geometrySize; v ++, i3 += 3) 
            {
                var vector = getRandomPointOnparticles(1+Math.random()*1.5);
                positions[ i3 + 0 ] = vector.x;
                positions[ i3 + 1 ] = vector.y;
                positions[ i3 + 2 ] = vector.z;
            } 

            for( var v = 0; v < geometrySize; v++ ) 
            {
                indexParticles= v * 3;
                baseSize[v] = 1+Math.random()*3;
                sizes[v] = baseSize[v];
                customPosition[ indexParticles     ] = geometryVertices[ v ].x;
                customPosition[ indexParticles + 1 ] = geometryVertices[ v ].y;
                customPosition[ indexParticles + 2 ] = geometryVertices[ v ].z;
            }
            bufferGeometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ));
            bufferGeometry.addAttribute( 'size', new THREE.BufferAttribute(sizes,1).setDynamic(true));
            bufferGeometry.addAttribute( 'customPosition', new THREE.BufferAttribute( customPosition, 3 ).setDynamic(true));

            creatureMesh = new THREE.Points( bufferGeometry, shaderMaterialParticles );
            creatureMesh.geometry.attributes.customPosition.needsUpdate = true;
            
        }
        
        creatureMesh.name = "creature";
        scene.add( creatureMesh );
        scene.add( new THREE.HemisphereLight( 0xaaaaaa, 0x444444 ) );

        if(visualisation.ribbonMode){
            worldHolder = new THREE.Object3D();

            scene.add(worldHolder);

            creatureMesh.geometry.computeBoundingBox();
            //CREATE EMITTERS
            for (var i = 0; i < EMITTER_COUNT; i++) {
                //todo
                //creatureMesh.geometry.boundingBox.max.y
                emitters[i] = ATUtil.randomVector3(500);
            }

            //CREATE RIBBONS
            for (i = 0; i < RIBBON_COUNT; i++) {
                //todo
                //creatureMesh.geometry.boundingBox.max.y
                var r = new Ribbon(500,EMITTER_COUNT);
                r.init();
                worldHolder.add(r.mesh);
                ribbons.push(r);
            }
        }



        var light = new THREE.DirectionalLight( 0xffffff, 0.5 );
        light.position.set( 1, 1, 1 );
        scene.add( light );

        scenes.push( scene );
    }
    if(visualisation.particlesMaterial)
    {
        //Animation
        setInterval(compositionEffect, 4500, 2000);
    }

    renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );
    renderer.setClearColor( 0xffffff, 1 );
    renderer.setPixelRatio( window.devicePixelRatio );

    animate();
}


function createTextures() {
    textures.map = new THREE.TextureLoader().load("img/spark1.png");
}


function getRandom(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}


function getRandomPointOnparticles(r) {
    var angle = Math.random() * Math.PI * 2;
    var u = Math.random() * 2 - 1;  
    var v = new THREE.Vector3(
        Math.cos(angle) * Math.sqrt(1 - Math.pow(u, 2)) * r,
        Math.sin(angle) * Math.sqrt(1 - Math.pow(u, 2)) * r,
        u * r
    );
    return v;
}



function compositionEffect(timer) {
    scenes.forEach( function( scene ) {
        var object = scene.children[ 0 ];
        if(object.material.uniforms.amplitude) {
            var atween = new TWEEN.Tween(object.material.uniforms.amplitude)
                .to({value: 0.0}, timer)
                .easing(TWEEN.Easing.Back.InOut);
            var btween = new TWEEN.Tween(object.material.uniforms.amplitude)
                .to({value: 1.0}, timer)
                .easing(TWEEN.Easing.Back.InOut);
            atween.chain(btween);
            atween.start();
        }
    });
}


function Float32Concat(first, second) {
    var firstLength = first.length;
    var result = new Float32Array(firstLength + second.length);
    result.set(first);
    result.set(second, firstLength);
    return result;
}

function addToBufferGeometry(geom) {
    if(visualisation.rawShader){
        var verticesGeometry = geom.vertices;

        var verticesGeometrySize= geom.vertices.length;
        
        var vertices = new Float32Array( verticesGeometrySize * 3 * 3);
        var n;
        var f;
        var randomIndex;
        for (n = 0, f=0; f < verticesGeometrySize; n += 3) {
            
            if(n % 9 == 0 )
            {
                vertices[ n     ] = verticesGeometry[ f ].x;
                vertices[ n + 1 ] = verticesGeometry[ f ].y;
                vertices[ n + 2 ] = verticesGeometry[ f ].z;
                f++;
            }
            else
            {
                randomIndex = getRandom(0, verticesGeometrySize-1);
                vertices[ n     ] = verticesGeometry[ randomIndex ].x * (Math.random() * .3 + 1);
                vertices[ n + 1 ] = verticesGeometry[ randomIndex ].y * (Math.random() * .3 + 1);
                vertices[ n + 2 ] = verticesGeometry[ randomIndex ].z * (Math.random() * .3 + 1);
            }
        }
        verticesBufferGeometry = Float32Concat(verticesBufferGeometry, vertices);
    }
}


function creatingCreature() {
    var offset = new THREE.Vector2();

    var creatureGeometry = creatingNose(offset);
    creatureGeometry.computeBoundingBox();
    creatureGeometry.computeBoundingSphere();
    offset.x = creatureGeometry.boundingBox.max.x;
    offset.y = creatureGeometry.boundingBox.max.y * 1.5 - creatureGeometry.boundingSphere.center.y;
    var offsetYMouth = -creatureGeometry.boundingBox.max.y + creatureGeometry.boundingSphere.center.y*2.;

    var eyesGeometry = creatingEyes(offset);
    
    creatureGeometry.merge(eyesGeometry);
    creatureGeometry.computeBoundingBox();
    offset.x = creatureGeometry.boundingBox.max.x;
    offset.y = creatureGeometry.boundingBox.max.y;

    var earsGeometry = creatingEars(offset);
    creatureGeometry.merge(earsGeometry);

    offset.y =  offsetYMouth;
    var mouthGeometry = creatingMouth(offset);
    creatureGeometry.merge(mouthGeometry);

    creatureGeometry.computeFaceNormals();
    creatureGeometry.computeVertexNormals();
    return creatureGeometry;
}


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
    var index = getRandom (0, noseGeometries.length-1);
    var noseGeometry = noseGeometries [index | 0];
    addToBufferGeometry(noseGeometry);
    return noseGeometry;
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
    var index = getRandom (0, eyesGeometries.length-1);
    var eyesGeometry = eyesGeometries[ index | 0 ];
    eyesGeometry.computeBoundingBox();
    var eyesGeometrySpecular = eyesGeometry.clone();
    eyesGeometrySpecular.computeBoundingBox();

    eyesGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(offset.x + eyesGeometry.boundingBox.max.x * .5, offset.y + eyesGeometry.boundingBox.max.y * 2., 0));

    eyesGeometrySpecular.applyMatrix(new THREE.Matrix4().makeTranslation(-offset.x - eyesGeometrySpecular.boundingBox.max.x * .5, offset.y +  eyesGeometrySpecular.boundingBox.max.y * 2., 0));
    addToBufferGeometry(eyesGeometry);
    addToBufferGeometry(eyesGeometrySpecular);
    eyesGeometry.merge(eyesGeometrySpecular);
    return eyesGeometry;
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
    var index = getRandom (0, earsGeometries.length-1);
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
    addToBufferGeometry(earsGeometry);
    addToBufferGeometry(earsGeometrySpecular);
    earsGeometry.merge(earsGeometrySpecular);
    return earsGeometry;
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
    var index = getRandom (0, mouthGeometries.length-1);
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
    addToBufferGeometry(mouthGeometry);
    return mouthGeometry;
}


function addStats() {
    stats = new Stats();
    content.appendChild( stats.dom );
}


function sendLocation() {
    var position = navigator.geolocation;
    var sendingData = 
    {
        "latitude":     0,
        "longitude":    0,
        "altitude":     0
    };
    if (position) {
        position.getCurrentPosition(setPosition, getErrLocation);
        function setPosition(position) {
            sendingData.latitude = position.coords.latitude;
            sendingData.longitude = position.coords.longitude;
            sendingData.altitude = position.coords.altitude;
            sendingLocation();
        }
    }
    else {
        //Geolocation is not supported by this browser.
        getErrLocation();
    }

    function getErrLocation() {
        sendingData.latitude = getRandomArbitrary(-90.0,90.0);
        sendingData.longitude = getRandomArbitrary(-180.0,180.0);
        sendingData.altitude = getRandom(0,6000);
        sendingLocation();
    }

    function sendingLocation() {
        console.log("Sending location");
        console.log(sendingData);
        socket.emit("pushingData", sendingData);
    }
}


function submitData() {
    var sendingCreatures = 10;
    currentFrame=1;
    socket.emit("broadcastData", sendingCreatures);
    socket.emit("tweetData", sendingCreatures);
}


function socketInit() {
    socket = io.connect('http://localhost:3000');
    socket.on('broadcastData', refreshCreatures);
    //Initialize instances
    socket.on("initializeClient", initializeClient);
    socket.emit("initializeClient");
}


function refreshCreatures(data) {
    //todo refresh my creatures
    console.log("Receiving Data: " + data);
}


function initializeClient(data) {
    console.log("Initializing instances: " + data);
    initSketch(data);
}


function sendFrame() {
    socket.emit('render-frame', {
            frame: currentFrame,
            file: document.querySelector('canvas').toDataURL()
    });
}


function updateSize() {
    var width = canvas.clientWidth;
    var height = canvas.clientHeight;
    if ( canvas.width !== width || canvas.height != height ) 
    {
        renderer.setSize( width, height, false );
    }
}


function animateRibbons() {
    if (visualisation.ribbonMode) 
    {
        noiseTime += 0.001;
        var i;
        for (i = 0; i < RIBBON_COUNT; i++) 
        {
            ribbons[i].update();
        }
        if (worldHolder)
        {
            worldHolder.rotation.y += 0.001;
            worldHolder.rotation.x += 0.001;
        }
    }
}

function animate() {
    render();
    stats.update();
    animateRibbons();
    requestAnimationFrame( animate );
    TWEEN.update();
}

function render() {
    var time = performance.now();
    updateSize();

    renderer.setClearColor( 0xffffff );
    renderer.setScissorTest( false );
    renderer.clear();

    renderer.setClearColor( 0xe0e0e0 );
    renderer.setScissorTest( true );
    scenes.forEach( function( scene ) {

        // so something moves
        var object = scene.children[ 0 ];
        object.rotation.y = Date.now() * 0.0005;
        if(object.material.uniforms) {
            object.material.uniforms.time.value = time * 0.005;
        }

        // get the element that is a place holder for where we want to
        // draw the scene
        var element = scene.userData.element;

        // get its position relative to the page's viewport
        var rect = element.getBoundingClientRect();

        // check if it's offscreen. If so skip it
        if ( rect.bottom < 0 || rect.top  > renderer.domElement.clientHeight ||
             rect.right  < 0 || rect.left > renderer.domElement.clientWidth ) {

            return;  // it's off screen

        }

        // set the viewport
        var width  = rect.right - rect.left;
        var height = rect.bottom - rect.top;
        var left   = rect.left;
        var bottom = renderer.domElement.clientHeight - rect.bottom;

        renderer.setViewport( left, bottom, width, height );
        renderer.setScissor( left, bottom, width, height );

        var camera = scene.userData.camera;

        //camera.aspect = width / height; // not changing in this example
        //camera.updateProjectionMatrix();

        //scene.userData.controls.update();



        renderer.render( scene, camera );


    } );

    if( currentFrame >= 1 && currentFrame <= frameLimit ) {
        sendFrame();
        currentFrame++;
    }
}