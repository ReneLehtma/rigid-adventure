//The usual three
var renderer, scene, camera;

//We have those main objects: chopper from .obj+.mtl, chopper from .dae (collada) and a marine from .json (three.js)
var chopperCollada;
var assetsToLoad = 1;

var lightTrajectory;
var light;

//We use the clock to measure time, an extension for the keyboard
var clock = new THREE.Clock();
var keyboard = new THREEx.KeyboardState();

function toRad(degree) {

	return Math.PI * 2 * degree / 360;
}

function onLoad() { 
	var canvasContainer = document.getElementById('myCanvasContainer'); 
	var width = 800; 
	var height = 500;
	
	//Initially we show the loading text under the canvas
	statusContainer = document.getElementById('status'); 
	statusContainer.innerHTML = 'Loading...';
	
	renderer = new THREE.WebGLRenderer(); 
	renderer.setSize(width, height);
	renderer.gammaInput = true; //You can try with (more correct way) and without gamma correction
	renderer.gammaOutput = true;
	canvasContainer.appendChild(renderer.domElement);
	
	scene = new THREE.Scene();
	
	//Create a perspective camera.
	//We are going to modify the camera for a third-person view later
	camera = new THREE.PerspectiveCamera(80, width / height, 1, 1000);
	camera.up = new THREE.Vector3(0,1,0);
	
	camera.position.set(0, 0, 40);
	camera.updateProjectionMatrix();
	
	//We add a red point light
	lightTrajectory = new THREE.ClosedSplineCurve3([
		new THREE.Vector3( 0, 7, -8 ),
		new THREE.Vector3( -2, 3, -5 ),
		new THREE.Vector3( -3, 6, 36 ),
		new THREE.Vector3( 8, 4, 39 ),
	]);
	light = new THREE.PointLight(0xaa3333);
	scene.add(light);
	
	//And a white directional light
	var directionalLight = new THREE.DirectionalLight(0xffffff);
	directionalLight.position.set(1, 1, 1);
	scene.add(directionalLight);
	
	//This is needed for texture loading from the web
	THREE.ImageUtils.crossOrigin = 'Anonymous';
	
	addHangar();
	
	 var colladaLoader = new THREE.ColladaLoader();
	 colladaLoader.crossOrigin = 'Anonymous';
	 colladaLoader.options.convertUpAxis = true;
	 colladaLoader.options.upAxis = 'Y';
	 colladaLoader.load('http://cglearn.codelight.eu/files/course/9/models/chopper/chopper.dae', loadChopperCollada);
}
 
function loadChopperCollada(colladaObject) {

	//We assign the Collada scene node to the chopperCollada variable
	chopperCollada = colladaObject.scene;
	
	//Next, give the chopperCollada a name "ChopperCollada"
	chopperCollada.name = "ChopperCollada";
	//Position it 20 units along the Z axis, so that it doesn't collide with the OBJ chopper
	
	//Fetch the chopper from the chopperCollada by its name "Chopper" (it is already there, because Collada has stored it)
	var chopper = chopperCollada.getObjectByName("Chopper");
	
	//pretty stupid
	chopper.children[0].material.side = THREE.DoubleSide;
	chopper.children[1].children[0].material.side = THREE.DoubleSide;
	
	//chopper.children[2].children[1].children[0].material.side = THREE.DoubleSide;
	console.log(chopper.children);
	chopper.position.set(0, -10, 20);
	//Set the chopper scale to 0.8 in all axes
	chopper.scale.set(0.8, 0.8, 0.8);
	//Rotate the chopper 90 degrees around the Y axis, so that it is sideways
	chopper.rotation.set(0, toRad(45), 0);
	chopper.updateMatrixWorld();
	
	//Add the chopperCollada to the scene
	scene.add(chopperCollada);
	var bboxHelper = new THREE.BoundingBoxHelper(chopper, 0x00ff00);
	bboxHelper.update();
	scene.add(bboxHelper);
	
	camera.lookAt(chopper.position);
	
	generateParticles(chopper.children[1].children[0], bboxHelper.box, 0.7);
	
	//You may want to use this to see what data Collada can give us:
	//console.log(colladaObject);
	
	if (!(--assetsToLoad)) {
		draw();
	}
}

function drawDebugShit(yzIntersects, box, cellSize) {
	var boxSize = box.size();
	var grid = new THREE.Object3D();
	grid.position = box.min;
	
	drawPos = box.min.clone();
	
	gridMaterial = new THREE.MeshBasicMaterial( {wireframe: true, color: 0x00ff00} );
	
	for (var i = 0; i < yzIntersects.length; i++) {
		drawPos.z = box.min.z;
		if (yzIntersects[i].length > 0) {
			for (var j = 0; j < yzIntersects[i].length; j++)
			{
				//for (; drawPos.x < box.min.x + boxSize.x; drawPos.x += cellSize) {
				if (yzIntersects[i][j].length > 0) {
					for (k = 0; k < yzIntersects[i][j].length; k++) {
						if (yzIntersects[i][j][k]) {
						var cell = new THREE.Mesh(new THREE.BoxGeometry(cellSize, cellSize, cellSize), gridMaterial);
							cell.position.set(drawPos.x + yzIntersects[i][j][k].distance, drawPos.y, drawPos.z);
						grid.add(cell);
						}
					}
				//}
				}
				drawPos.z += cellSize;
			}
		}
		drawPos.y += cellSize;
	}
	scene.add(grid);
}

//calculates intersections with rays cast from the left side (a yz plane) of the box
function calculateIntersections(mesh, box, cellSize) {
	var raycaster = new THREE.Raycaster();
	
	//direction is the x axis
	var direction  = new THREE.Vector3(1, 0, 0);
	var origin = box.min.clone();
	raycaster.near = 0;
	raycaster.far = box.size().x;
	
	intersections = [];
	for (; origin.y < box.max.y; origin.y += cellSize) {
		origin.z = box.min.z;
		var zIntersections = [];
		var any = false;
		for (; origin.z < box.max.z; origin.z += cellSize) {
			raycaster.set(origin, direction);
			var inters = raycaster.intersectObject(mesh, false);
			if (inters.length > 0) {
				any = true;
				zIntersections.push(inters);
			}
			else { zIntersections.push([]); }
		}
		if (any) { intersections.push(zIntersections); }
		else { intersections.push([]); }
		
	}
	return intersections;
}

function generateParticles(mesh, box, cellSize) {
	
	
	var boxSize = box.size();
	
	var yzIntersects = calculateIntersections(mesh, box, cellSize);
	
	
	var boxSize = box.size();
	var grid = new THREE.Object3D();
	grid.position = box.min;
	
	drawPos = box.min.clone();
	
	gridMaterial = new THREE.MeshBasicMaterial( {wireframe: true, color: 0x00ff00} );
	
	for (var y = 0; y < boxSize.y / cellSize; y++) {
		if (yzIntersects[y] && yzIntersects[y].length > 0)
		{
			drawPos.z = box.min.z;
			for (var z = 0; z < boxSize.z / cellSize; z++)
			{
				if (yzIntersects[y][z].length > 0)
				{
					drawPos.x = box.min.x;
					var intersectionCount = 0;
					for (x = 0; x < boxSize.x / cellSize; x++) {
						if (intersectionCount < yzIntersects[y][z].length && 
							x * cellSize >= yzIntersects[y][z][intersectionCount].distance)
						{
							intersectionCount++;		
						}
						if (intersectionCount % 2 == 1) {
							var cell = new THREE.Mesh(new THREE.SphereGeometry(cellSize), gridMaterial);
								cell.position.set(drawPos.x, drawPos.y, drawPos.z);
							grid.add(cell);
							}
							drawPos.x += cellSize;
						}
				}
				drawPos.z += cellSize;
			}
		}
		drawPos.y += cellSize;
	}
	scene.add(grid);

	//drawDebugShit(yzIntersects, box, cellSize);
}


/**
 * This function loads the floor texture.
 */
function onTextureLoaded(texture) {
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(2, 10);
	texture.needsUpdate = true;
	
	if (!(--assetsToLoad)) {
		loaded();
	}
}

/**
 * Things are loaded. Initialize draw loop.
 */
function loaded() {
	statusContainer.innerHTML = 'Running.';
	draw();
}

/**
 * Here we parse some controls and specify some speeds based on the input.
 */
function parseControls(dt) {
	if(keyboard.pressed("left")){
		marine.rotation.set(0, marine.rotation.y + toRad(60 * dt % 360), 0);
	}
	if(keyboard.pressed("right")){
		marine.rotation.set(0, marine.rotation.y - toRad(60 * dt % 360), 0);
	}
	if(keyboard.pressed("up")){
		speed += 0.1;
	}
	if(keyboard.pressed("down")){
		speed -= 0.1;
	}
	speed = Math.min(Math.max(0, speed), 10);
}

function draw() {
	var dt = clock.getDelta();
	
	var time = clock.getElapsedTime(); //Take the time
	requestAnimationFrame(draw);
	
	//parseControls(dt);
	
	
	//We move the light
	var m = time / 6;
	light.position.copy(lightTrajectory.getPoint(m - parseInt(m)));
	
	renderer.render(scene, camera); //We render our scene with our camera
}

/**
 * Adding the hangar
 */
function addHangar() {
	var hangar = new THREE.Mesh();
	var halfPi = Math.PI / 2;
	
	var leftWall = createWall(0x555555, 100, 20);
	leftWall.position.set(-10, 0, 40);
	leftWall.rotation.set(0, halfPi, 0);
	hangar.add(leftWall);
	
	var rightWall = createWall(0x333333, 100, 20);
	rightWall.position.set(10, 0, 40);
	rightWall.rotation.set(0, -halfPi, 0);
	hangar.add(rightWall);
	
	var backWall = createWall(0x444444, 20, 20);
	backWall.position.set(0, 0, -10);
	hangar.add(backWall);
	
	var ceiling = createWall(0x111111, 20, 100);
	ceiling.position.set(0, 10, 40);
	ceiling.rotation.set(halfPi, 0, 0);
	hangar.add(ceiling);
	
	var floor = createWall(0x222222, 20, 100);
	floor.position.set(0, -10, 40);
	floor.rotation.set(-halfPi, 0, 0);
	
	//We load this texture for the floor. Overriding the material assigned to us in the createWall
	floor.material = new THREE.MeshLambertMaterial({
		map: THREE.ImageUtils.loadTexture('http://cglearn.codelight.eu/files/course/7/textures/wallTexture2.jpg', THREE.UVMapping, onTextureLoaded)
	});
	hangar.add(floor);
	
	scene.add(hangar);
}

function createWall(colorCode, width, height) {
	var geometry = new THREE.PlaneGeometry(width, height, width, height);
	var material = new THREE.MeshBasicMaterial({color: colorCode});
	var wall = new THREE.Mesh(geometry, material);
	
	return wall;
}