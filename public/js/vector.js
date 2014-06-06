function vector2(x,y){
	this.x = x;
	this.y = y;	
}

vector2.prototype.output = function(){
	console.log("["+this.x+","+this.y+"]");
}

vector2.prototype.set = function(x,y){
	this.x = x;
	this.y = y;
}

vector2.prototype.add = function(vector){
	return new vector2(this.x+vector.x,this.y+vector.y);
}

vector2.prototype.subtract = function(vector){
	return new vector2(this.x-vector.x,this.y-vector.y);
}

vector2.prototype.times = function(scalar){
	return new vector2(this.x*scalar,this.y*scalar);
}