//this was useful for visualizing the grid, and how the rays are cast
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
	
	var yzIntersects = calculateIntersections(mesh, box, cellSize);
	mesh.visible = false;
	
	
	var boxSize = box.size();
	var particles = new THREE.BufferGeometry();
	particles.radius = cellSize / 2;
	
	drawPos = box.min.clone();
	var positions = [];
	var colors = [];
	var color = new THREE.Color();
	
	for (var y = 0; y < boxSize.y / cellSize; y++) {
		if (yzIntersects[y].length > 0)
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
						if (intersectionCount % 2 == 1 ) {
								positions.push(drawPos.x + particles.radius);
								positions.push(drawPos.y + particles.radius);
								positions.push(drawPos.z + particles.radius);	
							}
							drawPos.x += cellSize;
						}
				}
				drawPos.z += cellSize;
			}
		}
		drawPos.y += cellSize;
	}
	particles.addAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
	particles.computeBoundingSphere();
	
	var material = new THREE.PointCloudMaterial( { size: cellSize} );

	particleSystem = new THREE.PointCloud( particles, material );
	scene.add( particleSystem );
	
	//TODO: Need to calculate position for Center of Mass, 
	//add particles as children to Object3D based on that location
	scene.add(particleSystem);
	scene.updateMatrixWorld();
	
	
	return particles;
}