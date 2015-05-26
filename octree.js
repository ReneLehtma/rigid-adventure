/*first stab at implementing an octree haven't tested any part of this yet, 
 so there's a strong possibility it won't work yet,
 also, many things here could be improved
 used references: 
	http://www.brandonpelfrey.com/blog/coding-a-simple-octree/
	http://stackoverflow.com/questions/4578967/cube-sphere-intersection-test */

//An octree for storing THREE.Sphere
var OctreeNode = function(center, halfSize, depth) {
	this.depth = depth;
	//this is the leftmost, bottommost, furthest point in the octree space
	this.min = new THREE.Vector3(
		center.x - halfSize, center.y - halfSize, center.z - halfSize);
	//this is the opposite point (rightmost, topmost, closest)
	this.max = new THREE.Vector3(
		center.x + halfSize, center.y + halfSize, center.z + halfSize);
	this.halfSize = halfSize;
	this.center = center;
	this.children = [];
	this.isLeaf = true;
	this.particles = [];
	return this;
}
OctreeNode.MAX_DEPTH = 11;
OctreeNode.prototype = {
	getParticleCount: function() {
		if (this.isLeaf) {
			return this.particles.length;
		}
		var sum = 0;
		this.children.forEach(function(child) {sum += child.getParticleCount()});
		return sum;
	},
	//Add a value to the tree
	//value object should have attributes center (THREE.Vector3) and radius (float)
	//returns true if object added successfully, false otherwise
	add: function(particle) {
		//first check if this value is contained by the bounding box
		//console.log(particle);
		var index = this.getIndex(particle);
		if (index == -1) { return false; };
		
		//if this is a leaf node, we need to check if it 
		//already contains a value
		if (this.isLeaf) {
			//if the depth is less than the limit and there already is a value, then we need to subdivide
			if (this.depth <= OctreeNode.MAX_DEPTH && this.particles.length >= 1) {
				this.subdivide();
				return this.add(particle);
			}
				
			//otherwise we just assign the new value to this node
			else {
				this.particles.push(particle);
				return true;
			}
		}
		else {
			//add value to the correct child node
			return this.children[index].add(particle);
		}
	},
	
	//returns true if point (THREE.Vector3) is part of octree space
	containsPoint: function(point) {
		return !(
			point.x < this.min.x || point.y < this.min.y || point.z < this.min.z ||
			point.x > this.max.x || point.y > this.max.y || point.z > this.max.z);
	},
	
	getIndex: function(particle) {
		if (!this.containsPoint(particle.centerWorld)) { 
		return -1; 
		}
		
		if (particle.centerWorld.x < this.center.x)
		{
			if (particle.centerWorld.y < this.center.y)
			{
				if (particle.centerWorld.z < this.center.z) {
					return 0;
				}
				else return 1;
			}
			else {
				if (particle.centerWorld.z < this.center.z) {
					return 2;
				}
				else return 3;
			}
		}
		else {
			if (particle.centerWorld.y < this.center.y)
			{
				if (particle.centerWorld.z < this.center.z) {
					return 4;
				}
				else return 5;
			}
			else {
				if (particle.centerWorld.z < this.center.z) {
					return 6;
				}
				else return 7;
			}
			
		}
	},
	
	//create 8 new child nodes and add the value contained by
	//this node to one of the newly created children
	
	//the reference from above used bitwise operations, which is a much more elegant
	//solution, but it's maybe a bit (no pun intended) more difficult to understand
	//than this dumb approach with a simple switch statement
	//also, it turns out JavaScript doesn't really benefit from bitwise operations
	subdivide: function() {
		this.isLeaf = false;
		var size = this.halfSize / 2;
		//need to calculate new boxes for each of the 8 new children
		for (var i = 0; i < 8; i++) {
			//calculate new subdivision dimensions
			var center;
			switch(i) {
				case 0:
					//it's pretty easy to see the pattern here, 
					//and why the bit operations would make sense
					center = new THREE.Vector3(
						this.center.x - size,
						this.center.y - size,
						this.center.z - size);
					break;
				case 1:
					center = new THREE.Vector3(
						this.center.x - size,
						this.center.y - size,
						this.center.z + size);
					break;
				case 2:
					center = new THREE.Vector3(
						this.center.x - size,
						this.center.y + size,
						this.center.z - size);
					break;
				case 3:
					center = new THREE.Vector3(
						this.center.x - size,
						this.center.y + size,
						this.center.z + size);
					break;
				case 4:
					center = new THREE.Vector3(
						this.center.x + size,
						this.center.y - size,
						this.center.z - size);
					break;
				case 5:
					center = new THREE.Vector3(
						this.center.x + size,
						this.center.y - size,
						this.center.z + size);
					break;
				case 6:
					center = new THREE.Vector3(
						this.center.x + size,
						this.center.y + size,
						this.center.z - size);
					break;
				case 7:
					center = new THREE.Vector3(
						this.center.x + size,
						this.center.y + size,
						this.center.z + size);
					break;
			}
			this.children.push(new OctreeNode(center, size, this.depth + 1));
		}
		for (var i = 0; i < this.particles.length; i++) {
			this.add(this.particles[i]);
		}
		
		this.particles = [];
	},
	
	doesParticleIntersect: function(particle) {
		var p_center = particle.centerWorld;
		
		var dist_squared = squared(particle.radius * 2.0); 
		if (p_center.x < this.min.x) {
			dist_squared -= squared(p_center.x - this.min.x);
		}
		else if (p_center.x > this.max.x) {
			dist_squared -= squared(p_center.x - this.max.x);
		}
		if (p_center.y < this.min.y) {
			dist_squared -= squared(p_center.y - this.min.y);
		}
		else if (p_center.y > this.max.y) {
			dist_squared -= squared(p_center - this.max.y);
		}
		if (p_center.z < this.min.z) {
			dist_squared -= squared(p_center.z - this.min.z);
		}
		else if (p_center.z > this.max.z) {
			dist_squared -= squared(p_center.z - this.max.z);
		}
		return dist_squared > 0;
	},
	
	//the query has to return values from nodes
	//that either contain the given particle or
	//that the given particle intersects with
	query: function(particle) {
		var result = [];
		if (this.isLeaf && this.particles.length >= 1) {
			this.particles.forEach(
				function (p) {
					//can actually use THREE.js Sphere with intersectsSphere
					if (p.bodyID !== particle.bodyID &&
						p.centerWorld.distanceTo(particle.centerWorld) <= p.radius + particle.radius) {
						result.push(p);
					}
				});
		}
		else if (!this.isLeaf && this.doesParticleIntersect(particle)) {
			this.children.forEach(function(child) {
				result.push.apply(result, child.query(particle));
				}
			);
			//for (var i = 0; i < 8; i++) {
			//	result = result.concat(this.children[i].query(particle));
			//}
		}
		return result;
	},
	
	/*remove particle from tree if it exists, 
	if none of the children contain a value, 
	the node should be made a leaf again*/
	remove: function(value) {
		var i = getIndex(value);
		
		if (this.isLeaf && this.value.position == value.position) {
			value = null;
			return true;
		}
		else if (i == -1) {
			return false;
		}
		else {
			i = getIndex(value);
			return children[i].remove(value);
		}
	},
	
}