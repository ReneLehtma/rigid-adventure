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
	bodies: [],
	k: 1.3, //spring coefficient
	damp: 0.03,
	particleDensity: 0.1
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
	generateParticles(SIM.scene.cube1, 0.6);
	generateParticles(SIM.scene.cube2, 0.6);
	var chopper = SIM.scene.chopper;
	generateParticles(chopper, 0.4);
	
	SIM.bodies[0].velocity = new THREE.Vector3(0, 0, 0.02);
	SIM.bodies[1].velocity = new THREE.Vector3(0, 0, -0.08);
	SIM.bodies[2].velocity = new THREE.Vector3(0, 0, 0);
	
	SIM.bodies[0].angularVelocity = new THREE.Vector3(0, 0, 0);
	SIM.bodies[1].angularVelocity = new THREE.Vector3(0, 0, 0);
	SIM.bodies[2].angularVelocity = new THREE.Vector3(0, 0, 0);
	
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
	}
	if(keyboard.pressed("d")){
		
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
	SIM.octree = new OctreeNode(new THREE.Vector3(0,0,0), 50, 0);
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

//takes as arguments spring constant k, particle diameter, 
//and relative position of one particle with respect to the other
//based on those calculates and returns the repulsive force
function calculateRepulsiveForce(k, d, position) {
	var result = position.clone();
	result.normalize();
	result.multiplyScalar(-k * (d - position.length()));
	return result;
}

//takes as arguments damping coefficient and relative velocity 
//of one particle with respect to the other
function calculateDampingForce(damp, velocity) {
	var result = velocity.clone();
	result.multiplyScalar(damp);
	return result;
}

//takes as arguments a coefficient k and the relative velocity
function calculateShearForce(k, relPosition, velocity) {
	var result = calculateRelativeTangentialVelocity(relPosition, velocity).clone();
	result.multiplyScalar(k);
	return result;
}

//takes as arguments relative velocity and relative position
function calculateRelativeTangentialVelocity(position, velocity) {
	var pos = position.clone();
	pos.normalize();
	
	var result = velocity.clone();
	result.sub(pos.multiplyScalar(result.dot(pos)));
	return result;
}

//for each body's each particle get its collisions and calculate resulting forces/torques, 
//based on those forces, for each body calculate the resulting sum of the forces/torques
function handleCollisions(dt) {
	SIM.bodies.forEach(
		function(body) {
			body.force = new THREE.Vector3();
			body.torque = new THREE.Vector3();
			body.forEach(
				function (particle) {
					
					var collisions = SIM.octree.query(particle);
				
					collisions.forEach(function (otherParticle) {
						var relativeVelocity = otherParticle.velocity.clone();
						relativeVelocity.sub(particle.velocity);
						
						var relPosition = otherParticle.centerWorld.clone();
						relPosition.sub(particle.centerWorld);
						
						var repulsiveForce = calculateRepulsiveForce(1.3, particle.radius + otherParticle.radius, relPosition);
						//console.log(particle);
						//console.log(repulsiveForce);
						var dampingForce = calculateDampingForce(0.8, relativeVelocity);
						//console.log(dampingForce);
						var shearForce = calculateShearForce(0.3, relPosition, relativeVelocity);
						
						
						var forceSum = new THREE.Vector3();
						forceSum.add(repulsiveForce);
						forceSum.add(dampingForce);
						forceSum.add(shearForce);
						
						body.force.add(forceSum);
						torque = particle.center.clone();
						torque.cross(forceSum);
						
						body.torque.add(torque);
					});
				}
			);
			var changeInVelocity = body.force.clone();			
			changeInVelocity.multiplyScalar(dt / body.mass);
			body.velocity.add(changeInVelocity);
			
			var cube;
			
			switch (SIM.bodies.indexOf(body)) {
				case 0:
					cube = SIM.scene.cube1;
					break;
				case 1:
					cube = SIM.scene.cube2;
					break;
				case 2:
					cube = SIM.scene.chopper;
					break;
			}
			
			var angularVelocity = body.torque.clone();
			angularVelocity.divideScalar(body.momentOfInertia / dt);
			
			body.angularVelocity = angularVelocity.clone();
			
			var rotationAxis = angularVelocity.clone();
			rotationAxis.normalize();
			
			var rotationAngle = angularVelocity.length();
			cube.rotateOnAxis(rotationAxis, rotationAngle);
			
			
		}
	);
}

function calculateParticleVelocities() {
	SIM.bodies.forEach(function(body) {
		body.forEach(function(particle) {
			//particle.velocity = body.velocity.clone();
			particle.velocity = body.angularVelocity.clone();
			particle.velocity.cross(particle.center);
			particle.velocity.add(body.velocity);
		});
	});
}
 
function draw() {
	var scene = SIM.scene;
	var clock = SIM.clock;
	var dt = clock.getDelta();
	
	calculateParticleVelocities();
	updateOctree();
	handleCollisions(dt);
	
	//console.log(SIM.scene.cube1.position);
	
	SIM.scene.cube1.position.add(SIM.bodies[0].velocity);
	SIM.bodies[0].forEach(function(particle){
		particle.centerWorld = particle.center.clone();
		particle.centerWorld.add(SIM.scene.cube1.position);
	});
	
	SIM.scene.cube2.position.add(SIM.bodies[1].velocity);
	SIM.bodies[1].forEach(function(particle){
		particle.centerWorld = particle.center.clone();
		particle.centerWorld.add(SIM.scene.cube2.position);
	});
	
	SIM.scene.chopper.position.add(SIM.bodies[2].velocity);
	SIM.bodies[2].forEach(function(particle){
		particle.centerWorld = particle.center.clone();
		particle.centerWorld.add(SIM.scene.chopper.position);
	});
	
	//console.log(SIM.scene.cube1.position);
	
	var time = clock.getElapsedTime(); //Take the time
	requestAnimationFrame(draw);
	
	parseControls(dt);
	
	var m = time / 6;
	
	scene.light.position.copy(scene.light.trajectory.getPoint(m - parseInt(m)));
	
	SIM.renderer.render(scene, SIM.camera); //We render our scene with our camera
}