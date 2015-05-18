//The usual three
var renderer, scene, camera;

//We have those main objects: chopper from .obj+.mtl, chopper from .dae (collada) and a marine from .json (three.js)
var chopperCollada;
var assetsToLoad = 2;

//We use the clock to measure time, an extension for the keyboard
var clock = new THREE.Clock();
var keyboard = new THREEx.KeyboardState();

function onLoad() { 
	var canvasContainer = document.getElementById('myCanvasContainer'); 
	var width = 800; 
	var height = 500;
	
	getStatusContainer().innerHTML = 'Loading...';
	
	//Create a perspective camera.
	//We are going to modify the camera for a third-person view later
	camera = new THREE.PerspectiveCamera(80, width / height, 1, 1000);
	camera.up = new THREE.Vector3(0,1,0);
	
	camera.position.set(0, 0, 40);
	camera.updateProjectionMatrix();
	
	renderer = new THREE.WebGLRenderer(); 
	renderer.setSize(width, height);
	renderer.gammaInput = true; 
	renderer.gammaOutput = true;
	canvasContainer.appendChild(renderer.domElement);
	
	scene = buildScene();
	loaded();
}

/**
 * Things are loaded. Initialize draw loop.
 */
function loaded() {
	getStatusContainer().innerHTML = 'Running.';
	draw();
}

function parseControls(dt) {
	var moveIncrement = dt * 3;
	if(keyboard.pressed("left")){
		camera.position.x -= moveIncrement;
	}
	if(keyboard.pressed("right")){
		camera.position.x += moveIncrement;
	}
	if(keyboard.pressed("up")){
		camera.position.z -= moveIncrement;
	}
	if(keyboard.pressed("down")){
		camera.position.z += moveIncrement;
	}
	if (keyboard.pressed("shift")) {
		camera.position.y -= moveIncrement;
	}
	if (keyboard.pressed("space")) {
		camera.position.y += moveIncrement;
	}
	if(keyboard.pressed("e")){
		camera.rotation.set(camera.rotation.x, camera.rotation.y + toRad(5), camera.rotation.z);
	}
	if(keyboard.pressed("q")){
		camera.rotation.set(camera.rotation.x, camera.rotation.y - toRad(5), camera.rotation.z);
	}
	if(keyboard.pressed("w")){
		camera.rotation.set(camera.rotation.x + toRad(5*dt), camera.rotation.y,  camera.rotation.z);
	}
	if(keyboard.pressed("s")){
		camera.rotation.set(camera.rotation.x - toRad(5*dt), camera.rotation.y,  camera.rotation.z);
	}
}

function draw() {
	var dt = clock.getDelta();
	
	//basic pseudocode: 
	//octree.update()
	//handleCollisions(octree, dt); particle interactions are calculated
	//calculateCOMposition(dt); these should be calculated for each rigid body based on particle interactions (COM - center of mass)
	//calculateCOMrotation(dt); since particle objects are hierarchically under the rigid body object, 
	//							their positions relative to the COM should stay the same
	
	var time = clock.getElapsedTime(); //Take the time
	requestAnimationFrame(draw);
	
	parseControls(dt);
	
	var m = time / 6;
	scene.light.position.copy(scene.light.trajectory.getPoint(m - parseInt(m)));
	
	renderer.render(scene, camera); //We render our scene with our camera
}