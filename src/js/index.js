var THREE = require('three');
var TWEEN = require("tween.js");
var io = require('socket.io-client');
var socket;

if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var frameLimit = 90;
var currentFrame = 0;

var canvas, content;

var scenes = [], renderer;
var time;
var stats;

var textures = {};
var baseSize;

var creatures = [];
var noise = new SimplexNoise();
var rawShaderMaterial;

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

    rawShaderMaterial = new THREE.RawShaderMaterial( {
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
        scale:     { type: "f", value: 1.0 }
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

        var camera = new THREE.PerspectiveCamera( 50, 1, 0.1, 300 );
        camera.position.z = 100;
        scene.userData.camera = camera;

        var controls = new THREE.OrbitControls( scene.userData.camera, scene.userData.element );
        controls.minDistance = 1;
        controls.maxDistance = 200;
        controls.enablePan = false;
        controls.enableZoom = true;
        scene.userData.controls = controls;

        // add one random mesh to each scene

        var creatureObj = new Creature(0, 0, 0, 10, particleShaderMaterial, rawShaderMaterial, 10);
        creatureObj.switchState();
        creatures.push(creatureObj);
        scene.add( creatureObj.creatureHolder);
        //scene.add( new THREE.HemisphereLight( 0xaaaaaa, 0x444444 ) );

        var light = new THREE.DirectionalLight( 0xffffff, 0.5 );
        light.position.set( 1, 1, 1 );
        scene.add( light );

        scenes.push( scene );
    }
    //ANIMATION
    startParticlesAnimation(particleShaderMaterial.uniforms.amplitude);
    
    renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );
    renderer.setClearColor( 0xffffff, 1 );
    renderer.setPixelRatio( window.devicePixelRatio );

    animate();
}

function startParticlesAnimation(amplitude) {   
    var atween = new TWEEN.Tween(amplitude)
            .to({value: 0.0}, 7500)
            .delay(1000)
            .easing(TWEEN.Easing.Back.InOut);
    var btween = new TWEEN.Tween(amplitude)
            .to({value: 1.0}, 7500)
            .delay(1000)
            .easing(TWEEN.Easing.Back.InOut);
    atween.chain(btween);
    btween.chain(atween);
    atween.start();
}
 
function stopParticlesAnimation() {
    TWEEN.removeAll();
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


function animateCreatures() {
    rawShaderMaterial.uniforms.time.value = time * 0.002;
    var creatureIndex;
    var creaturesLength = creatures.length;
    for (creatureIndex = 0; creatureIndex < creaturesLength; creatureIndex++) {
       creatures[creatureIndex].update(time); 
    }
}

function animate() {
    render();
    stats.update();
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
        renderer.render( scene, camera );
    } );

    if( currentFrame >= 1 && currentFrame <= frameLimit ) {
        sendFrame();
        currentFrame++;
    }
}