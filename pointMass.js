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

pointMass.prototype.step = function(currentTime){
	var timePassed = (currentTime-this.currTime);
	this.currTime = currentTime;
	
	var nextPos = this.pos.add(this.vel.add(this.acc));
	this.prevPos.x = this.pos.x;
	this.prevPos.y = this.pos.y;
	this.pos = nextPos;
}