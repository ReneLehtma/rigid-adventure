//here are all the global variables
var SIM = {
	renderer: null,
	scene: null,
	camera: null,
	clock: new THREE.Clock(),
	keyboard: new THREEx.KeyboardState(),
	statusContainer: null,
	octree: null,
	particles: null,
	bodies: []
};

function onLoad() { 
	var renderer = SIM.renderer = new THREE.WebGLRenderer();
	
	var canvasContainer = document.getElementById('myCanvasContainer'); 
	var width = 800; 
	var height = 500;
	
	SIM.statusContainer = document.getElementById('status');
	SIM.statusContainer.innerHTML = 'Loading...';
	
	var camera = SIM.camera = new THREE.PerspectiveCamera(80, width / height, 1, 1000);
	camera.up = new THREE.Vector3(0,1,0);
	
	camera.position.set(0, 0, 40);
	camera.updateProjectionMatrix();
	
	renderer.setSize(width, height);
	renderer.gammaInput = true; 
	renderer.gammaOutput = true;
	canvasContainer.appendChild(renderer.domElement);
	
	buildScene(onLoaded);
}

//Things are loaded. Generate particles and initialize draw loop
function onLoaded() {
	//var chopper = SIM.scene.chopper;
	//SIM.particles = generateParticles(chopper.children[1].children[0], chopper.bboxHelper.box, 0.5);
	
	generateParticles(SIM.scene.cube1, 0.7);
	generateParticles(SIM.scene.cube2, 0.7);
	
	SIM.statusContainer.innerHTML = 'Running.';
	draw();
}

function parseControls(dt) {
	var camera = SIM.camera;
	var keyboard = SIM.keyboard;
	var moveIncrement = dt * 3;
	if(keyboard.pressed("left")){
		camera.position.x -= moveIncrement;
	}
	if(keyboard.pressed("right")){
		camera.position.x += moveIncrement;
	}
	
	if(keyboard.pressed("a")){
		SIM.scene.cube1.position.x -= moveIncrement;
		SIM.bodies[0].forEach(function(particle){particle.centerWorld.x -= moveIncrement})
	}
	if(keyboard.pressed("d")){
		SIM.scene.cube1.position.x += moveIncrement;
		SIM.bodies[0].forEach(function(particle){particle.centerWorld.x += moveIncrement})
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

function updateOctree() {
	//create new octree
	SIM.octree = new OctreeNode(new THREE.Vector3(0,0,0), 100, 0);
	//add all the particles to the tree
	SIM.bodies.forEach(
		function(body) {
			body.forEach(
				function (particle) {
					SIM.octree.add(particle);
				}
			);
		}
	);
}

//for each body's each particle get its collisions and calculate resulting forces/torques, 
//based on those forces, for each body calculate the resulting sum of the forces/torques
function handleCollisions() {
	SIM.bodies.forEach(
		function(body) {
			body.forEach(
				function (particle) {
					var collisions = SIM.octree.query(particle);
					if (collisions.length > 0)
						console.log(collisions);
				}
			);
		}
	)
}
 
function draw() {
	var scene = SIM.scene;
	var clock = SIM.clock;
	var dt = clock.getDelta();
	
	updateOctree();
	handleCollisions();
	
	//updateBodies();
	//calculateParticleVelocities();
	
	var time = clock.getElapsedTime(); //Take the time
	requestAnimationFrame(draw);
	
	parseControls(dt);
	
	var m = time / 6;
	
	scene.light.position.copy(scene.light.trajectory.getPoint(m - parseInt(m)));
	
	SIM.renderer.render(scene, SIM.camera); //We render our scene with our camera
}