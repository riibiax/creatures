var THREE = require('three');
var TWEEN = require("tween.js");
var io = require('socket.io-client');
var socket;

if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var frameLimit=90;
var currentFrame=0;

var canvas, content;

var scenes = [], renderer;
var time;
var stats;

var textures = {};
var baseSize;
var visualisation = {
    standardMaterial :  false,
    rawShader: false,
    particlesMaterial: true,
    ribbonMode: false
} 

var creatures = [];

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

    var rawShaderMaterial = new THREE.RawShaderMaterial( {
        uniforms: {
            time: { value: 1.0 }
        },
        vertexShader: document.getElementById( 'vertexRawShader' ).textContent,
        fragmentShader: document.getElementById( 'fragmentRawShader' ).textContent,
        side: THREE.DoubleSide,
        transparent: true
    } );

    var particlesUniforms = {
        amplitude: { type: "f", value: 1.0 },
        texture:   { type: "t", value: textures.map },
        time:      { type: "f", value: 0.1 },
        noiseFactor: { type: "f", value: 0.1 } ,
    };

    var particleShaderMaterial = new THREE.ShaderMaterial( {
        uniforms:       particlesUniforms,
        vertexShader:   document.getElementById( 'vertexParticleShader' ).textContent,
        fragmentShader: document.getElementById( 'fragmentParticleShader' ).textContent,
        blending:       THREE.AdditiveBlending,
        depthTest:      false,
        transparent:    true
    });
    
    for (i =  0; i < numberInstances; i ++) {

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

        var creatureObj = new Creature(0, 0, 0, 0, rawShaderMaterial, particleShaderMaterial);
        creatureObj.init();
        creatures.push(creatureObj);


        scene.add( creatureObj.meshes[creatureObj.state]);

        scene.add( new THREE.HemisphereLight( 0xaaaaaa, 0x444444 ) );

        /*if(visualisation.ribbonMode){
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
        }*/



        var light = new THREE.DirectionalLight( 0xffffff, 0.5 );
        light.position.set( 1, 1, 1 );
        scene.add( light );

        scenes.push( scene );
    }

    renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );
    renderer.setClearColor( 0xffffff, 1 );
    renderer.setPixelRatio( window.devicePixelRatio );

    animate();
}


function createTextures() {
    textures.map = new THREE.TextureLoader().load("img/spark1.png");
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
        sendingData.latitude = ATUtil.randomRange(-90.0,90.0);
        sendingData.longitude = ATUtil.randomRange(-180.0,180.0);
        sendingData.altitude = ATUtil.randomInt(0,6000);
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

function animateCreatures() {
    var creatureIndex;
    for (creatureIndex = 0; creatureIndex < creatures.length; creatureIndex++) {
       creatures[creatureIndex].update(time); 
    }
}

function animate() {
    render();
    stats.update();
    animateRibbons();
    animateCreatures();
    requestAnimationFrame( animate );
    TWEEN.update();
}

function render() {
    time = performance.now();
    updateSize();

    renderer.setClearColor( 0xffffff );
    renderer.setScissorTest( false );
    renderer.clear();

    renderer.setClearColor( 0xe0e0e0 );
    renderer.setScissorTest( true );


    scenes.forEach( function( scene ) {


        
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