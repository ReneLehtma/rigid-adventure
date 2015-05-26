# rigid-adventure
To run, just download the thing and open index.html in a browser.

Report:

Things didn't quite work out as planned (as they rarely do) so the project is not completely finished yet. All the main components are there, but there are some kinks to be worked out, mainly with calculating the physical values. And obviously there are many places where stuff could be better optimized/structured.  

The main program starts with setting up the scene, as in most of the homeworks in the CG course (well, the base was lifted from there, so no huge surprise). A light and some walls are created. Then some meshes are loaded or created.

For some of those mesh objects, particles are generated (they are just some objects that have coordinates for a center and a radius). Particle generation is based on the idea from the GPU Gems 3 Chapter 29 article. Rays are cast on the mesh from one of the faces of its collision box. Then a particle is generated for each voxel between an odd and an even number of intersections. 

I admit that the project could benefit from a more object-oriented design, but being new to JavaScript (which was sometimes a real pain with how easily it let me accidentally declare global variables), it would have taken some more time to figure that stuff out. Still, the octree is implemented in an object-oriented manner, so there's at least that.

Anyway, after generating the particles, they are added to an octree. Then each of the particles queries the octree for colliding particles. After that, the collisions response is calculated, which is basically a bunch of forces and torques between all the colliding pairs. Those forces are summed up and from that the velocity and angular velocity of the rigid body is calculated. Then based on those, the positions and rotations are updated. That's the gist of it.

Something is wrong with the physics calculations right now, could be how the center of mass is calculated or the forces or something. I'll probably continue working on this after the exams are over and figure it out. 

End of report
