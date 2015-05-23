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
			var inters = raycaster.intersectObject(mesh);
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

function generateParticles(mesh, cellSize) {
	var geometry = mesh.geometry;
	geometry.computeBoundingBox();
	var box = geometry.boundingBox;
	
	var yzIntersects = calculateIntersections(mesh, box, cellSize);
	mesh.visible = true;
	
	var boxSize = box.size();
	var particleGeometry = new THREE.BufferGeometry();
	var particles = [];
	
	var positions = [];
	var colors = [];
	var color = new THREE.Color();
	var particleRadius = cellSize / 2;
	
	//the center of mass
	var com = new THREE.Vector3();
	
	drawPos = box.min.clone();
	
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
							x * cellSize <= yzIntersects[y][z][intersectionCount].distance)
						{
							intersectionCount++;		
						}
						if (intersectionCount % 2 == 1 ) {
								var posWithOffset = drawPos.clone()
								posWithOffset.addScalar(particleRadius);
								
								positions.push(posWithOffset.x);
								positions.push(posWithOffset.y);
								positions.push(posWithOffset.z);	
								
								var centerw = posWithOffset.clone();
								centerw.add(mesh.position);
								
								var particle = {
									bodyID: SIM.bodies.length, 
									center: posWithOffset, 
									centerWorld: centerw, 
									radius: particleRadius};
								particle.bodyID = SIM.bodies.length;
								particles.push(particle);
								
								com.add(drawPos);
							}
							drawPos.x += cellSize;
					}
				}
				drawPos.z += cellSize;
			}
		}
		drawPos.y += cellSize;
	}
	com.divideScalar(particles.length);
	particleGeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
	particleGeometry.computeBoundingSphere();
	
	var material = new THREE.PointCloudMaterial( { size: cellSize} );

	var particleSystem = new THREE.PointCloud(particleGeometry, material);
	mesh.add(particleSystem);
	
	//TODO: Need to calculate position for Center of Mass, 
	//add particleGeometry as children to Object3D based on that location
	SIM.bodies.push(particles);
}