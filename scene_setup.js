function buildScene(onLoaded) {
	var scene = SIM.scene = new THREE.Scene();
	var light = new THREE.PointLight(0xaa3333);
	scene.light = light;
	scene.light.trajectory = new THREE.ClosedSplineCurve3([
		new THREE.Vector3( 0, 7, -8 ),
		new THREE.Vector3( -2, 3, -5 ),
		new THREE.Vector3( -3, 6, 36 ),
		new THREE.Vector3( 8, 4, 39 ),
	]);
	scene.add(light);
	
	//And a white directional light
	var directionalLight = new THREE.DirectionalLight(0xffffff);
	directionalLight.position.set(1, 1, 1);
	scene.add(directionalLight);
	
	//This is needed for texture loading from the web
	THREE.ImageUtils.crossOrigin = 'Anonymous';
	
	scene.add(buildHangar());
	
	var colladaLoader = new THREE.ColladaLoader();
	colladaLoader.crossOrigin = 'Anonymous';
	colladaLoader.options.convertUpAxis = true;
	colladaLoader.options.upAxis = 'Y';
	colladaLoader.load('http://cglearn.codelight.eu/files/course/9/models/chopper/chopper.dae', 
		function(colladaObject) { loadChopperCollada(colladaObject, onLoaded); });
}

/**
 * This function loads the floor texture.
 */
function onTextureLoaded(texture) {
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(2, 10);
	texture.needsUpdate = true;
}

function loadChopperCollada(colladaObject, onLoaded) {

	chopperCollada = colladaObject.scene;
	chopperCollada.name = "ChopperCollada";	
	var chopper = chopperCollada.getObjectByName("Chopper");
	var scene = SIM.scene;
	
	//pretty stupid
	chopper.children[0].material.side = THREE.DoubleSide;
	chopper.children[1].children[0].material.side = THREE.DoubleSide;
	
	chopper.position.set(0, -10, 20);
	chopper.scale.set(0.8, 0.8, 0.8);
	chopper.rotation.set(0, toRad(-45), 0);
	
	
	SIM.scene.add(chopperCollada);
	chopper.bboxHelper = new THREE.BoundingBoxHelper(chopper, 0x00ff00);
	
	scene.add(chopper.bboxHelper);
	scene.chopper = chopper;
	
	SIM.camera.lookAt(chopper.position);
	onLoaded();
}

/**
 * Adding the hangar
 */
function buildHangar() {
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
	return hangar;
}

function createWall(colorCode, width, height) {
	var geometry = new THREE.PlaneGeometry(width, height, width, height);
	var material = new THREE.MeshBasicMaterial({color: colorCode});
	var wall = new THREE.Mesh(geometry, material);
	
	return wall;
}