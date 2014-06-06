function constraint(mass1,mass2,dist,stiffness){
	this.mass1 = mass1;
	this.mass2 = mass2;
	this.dist = dist;
	this.stiffness = stiffness;
}

constraint.prototype.calc = function(){
	var diff = this.mass1.pos.subtract(this.mass2.pos);
	var distance = Math.sqrt((diff.x*diff.x)+(diff.y*diff.y));
	var temp = this.stiffness;
	var mainDiff = (this.dist-distance)/distance;
	var changeVect = new vector2(diff.x*this.stiffness*mainDiff,diff.y*this.stiffness*mainDiff);
	
	this.mass1.pos = this.mass1.pos.add(changeVect);
	this.mass2.pos = this.mass2.pos.subtract(changeVect);
	this.stiffness = temp;
}