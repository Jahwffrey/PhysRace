function pointMass(x,y,mass,sXVel,sYVel,id){
	this.pos = new vector2(x,y);
	this.prevPos = new vector2(x-sXVel,y-sYVel);
	this.nextPos = new vector2(0,0);
	this.vel = new vector2(0,0);
	this.acc = new vector2(0,0);
	this.currTime = globalTime;
	this.mass = mass;
	this.id = id;
	this.friction = false;
}