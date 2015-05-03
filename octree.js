/*first stab at implementing an octree haven't tested any part of this yet, 
 so there's a strong possibility it won't work yet,
 also, many things here could be improved
 used references: 
	http://www.brandonpelfrey.com/blog/coding-a-simple-octree/
	http://stackoverflow.com/questions/4578967/cube-sphere-intersection-test */

//Constructor takes a center point and a si
var OctreeNode = function(center, halfSize) {
	//this is the leftmost, bottommost, furthest point in the octree space
	this.min = new THREE.Vector3(
		center.x-halfSize, center.y-halfSize, center.z-halfSize);
	//this is the opposite point (rightmost, topmost, closest)
	this.max = new THREE.Vector3(
		center.x+halfSize, center.y+halfSize, center.z+halfSize);
	this.halfSize = halfSize;
	this.center = center;
	this.children = [];
	this.isLeaf = true;
	this.value = null;
}

OctreeNode.prototype = {

	//Add a value to the tree
	//value object should have attributes position (THREE.Vector3) and radius (float)
	//returns true if object added successfully, false otherwise
	add: function(value) {
		//first check if this value is contained by the bounding box
		var index = findIndex(value);
		if (index == -1) { return false; };
		
		//if this is a leaf node, we need to check if it 
		//already contains a value
		if (this.isLeaf) {
			//if there already is a value, then we need to subdivide
			if (this.value) {
				this.subdivide();
				return this.add(value);
			}
			//otherwise we just assign the new value to this node
			else {
				this.value = value;
				return true;
			}
		}
		else {
			//add value to the correct child node
			this.children[index].add(value);
			return true;
		}
	},
	
	//returns true if point (THREE.Vector3) is part of octree space
	containsPoint: function(point) {
		return !(value.position.x < center.x - halfSize ||
			value.position.y < center.y - halfSize ||
			value.position.z < center.z - halfSize ||
			value.position.x < center.x + halfSize ||
			value.position.y < center.z + halfSize ||
			value.position.z < center.z + halfSize);
	},
	
	getIndex: function(value) {
		if (containsPoint(value.position)) { return -1; }
		
		if (value.position.x < this.center.x)
		{
			if (value.position.y < this.center.y)
			{
				if (value.position.z < this.center.z) {
					return 0;
				}
				else return 1;
			}
			else {
				if (value.position.x < this.center.z) {
					return 2;
				}
				else return 3;
			}
		}
		else {
			if (value.position.y < this.center.y)
			{
				if (value.position.z < this.center.z) {
					return 4;
				}
				else return 5;
			}
			else {
				if (value.position.x < this.center.z) {
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
	//I really like the bitwise thing though, so I'll probably change this later
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
						this.center.z - size,
						);
					break;
				case 1:
					center = new THREE.Vector3(
						this.center.x - size,
						this.center.y - size,
						this.center.z + size,
						);
					break;
				case 2:
					center = new THREE.Vector3(
						this.center.x - size,
						this.center.y + size,
						this.center.z - size,
						);
					break;
				case 3:
					center = new THREE.Vector3(
						this.center.x - size,
						this.center.y + size,
						this.center.z + size,
						);
					break;
				case 4:
					center = new THREE.Vector3(
						this.center.x + size,
						this.center.y - size,
						this.center.z - size,
						);
					break;
				case 5:
					center = new THREE.Vector3(
						this.center.x + size,
						this.center.y - size,
						this.center.z + size,
						);
					break;
				case 6:
					center = new THREE.Vector3(
						this.center.x + size,
						this.center.y + size,
						this.center.z - size,
						);
					break;
				case 7:
					center = new THREE.Vector3(
						this.center.x + size,
						this.center.y + size,
						this.center.z + size,
						);
					break;
			}
			children.push(new OctreeNode(center, size));
		}
		this.add(this.value);
		this.value = null;
	},
	
	squared: function(x) {
		return x * x;
	}
	
	doesSphereIntersect: function(sphereCenter, sphereRadius) {
		var dist_squared = squared(sphereRadius);
		if (sphereCenter.x < this.min.x) {
			dist_squared -= squared(sphereCenter.x - this.min.x);
		}
		else if (sphereCenter.x > this.max.x) {
			dist_squared -= squared(sphereCenter.x - this.max.x);
		}
		if (sphereCenter.y < this.min.y) {
			dist_squared -= squared(sphereCenter.y - this.min.y);
		}
		else if (sphereCenter.y > this.max.y) {
			dist_squared -= squared(sphereCenter - this.max.y);
		}
		if (sphereCenter.z < this.min.z) {
			dist_squared -= squared(sphereCenter.z - this.min.z);
		}
		else if (sphereIntersect > this.max.z) {
			dist_squared -= squared(sphereCenter.z - this.max.z);
		}
		return dist_squared > 0;
	},
	
	//the query has to return values from nodes
	//that either contain the given particle or
	//that the given particle intersects with
	queryCollisions: function(sphere) {
		result = []
		//distanceToSquared might be less expensive 
		if (isLeaf && value && 
			sphere.center.distanceTo(value.center) < sphere.radius + value.radius) {
			result.push(value);
		}
		else if (doesSphereIntersect(sphere)) {
			this.children.forEach(function(child) {
				result = result.concat(child.queryCollisions(sphere));
			});
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