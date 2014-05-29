function wall(x1,y1,x2,y2,type){
	this.x1 = x1;
	this.y1 = y1;
	this.x2 = x2;
	this.y2 = y2;
	this.pos1 = new vector2(x1,y1);
	this.pos2 = new vector2(x2,y2);
	this.slope = (y2-y1)/(x2-x1);
	this.b = y1 - (this.slope * x1);
	this.type = type;
}