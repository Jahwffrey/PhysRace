var mouse = {x:0,y:0,down:false};
var view = {x:0,y:0};
var globalTime = 0;
var partList = [];
var bindList = [];
var wallList = [];
var keys = [];
var num = 0;
var bindNum = 0;
var TAU = 2*3.141592638;

//Pararmeters:
var numTimes = 10; //Higher means more accurate physics but slower speed;
var jelloConst = .00008; //Stiffness, from 0 to .5
var fricConst = 1; //how much friction the ground has, 0 to 1
var grav =.0098; //acceleration due to gravity
var speed = .2; // how fast the blob accelerates
var devmode = false; //show behind the scenes things or not

//Shape perameters:
var numPoints = 30;
var perimeter = 200;
var numSides = 4;


var xStart = 400;
var xFirst = xStart;
var yStart = 100;
var yFirst = yStart;
var sideLen = perimeter/numSides;
var numPerSide = Math.round(numPoints/numSides);
numPoints = numPerSide*numSides;

var theta = 0;
for(var i = 0;i < numSides;i++){
	theta = i*((TAU)/numSides);
	for(var ii = 0;ii<numPerSide;ii++){
		makePart(xStart,yStart,1,0,0);
		xStart = xStart+(sideLen/numPerSide)*Math.cos(theta);
		yStart = yStart+(sideLen/numPerSide)*Math.sin(theta);
	}
}

for(var i = 0;i < partList.length;i++){
	var next = i + 1;
	if(next>=partList.length) next = 0;
	makeBind(i,next,-1,.5);
}

for(var ii  = Math.round(numPoints/4); ii < 2*numPoints/4;ii++){
	for(var i = 0;i < partList.length;i++){
		var next = i + ii;
		if(next>=partList.length) next = next - numPoints;
		makeBind(i,next,-1,jelloConst);
	}
}

var midX = xFirst+sideLen/2;
var midY = (partList[0].pos.y+partList[Math.round((partList.length-1)/2)].pos.y)/2;

makePart(midX,midY,1,0,0);
for(var i = 0;i < partList.length-1;i++){
	makeBind(i,partList.length-1,-1,jelloConst);
}

var xBegin = 0;
var yBegin = 250;
var xNext = 0;
var yNext = 0;
for(var i = 0;i < 200;i++){
	xNext = xBegin+10+Math.random()*200;
	yNext = yBegin-20+Math.random()*40;
	makeWall(xBegin,yBegin,xNext,yNext);
	xBegin = xNext;
	yBegin = yNext;
}


function makePart(x,y,mass,hspeed,vspeed){
	num+=1;
	partList[num-1] = new pointMass(x,y,mass,hspeed,vspeed,num);
}

function makeBind(num1,num2,dist,stiff){
	if(dist<0){
		dist = Math.sqrt(Math.pow(partList[num1].pos.x-partList[num2].pos.x,2)+Math.pow(partList[num1].pos.y-partList[num2].pos.y,2));
	}
	bindList[bindNum] = new constraint(partList[num1],partList[num2],dist,stiff);
	bindNum+=1;
}

function makeWall(x1,y1,x2,y2){
	wallList.push(new wall(x1,y1,x2,y2));
}

$(document).ready(function(){
	var can = document.getElementById("canv");
	var canX = can.getContext("2d");
	
	function simulate(){
		globalTime+=1;
		view.x = (partList[0].pos.x+partList[Math.round(numPoints/2)].pos.x)/2 - 400;
		view.y = (partList[0].pos.y+partList[Math.round(numPoints/2)].pos.y)/2 - 150;
		if(68 in keys){
			partList[partList.length-1].acc = partList[partList.length-1].acc.add(new vector2(speed,0));
		}
		if(65 in keys){
			partList[partList.length-1].acc = partList[partList.length-1].acc.add(new vector2(-speed,0));
		}
		if(83 in keys){
			partList[partList.length-1].acc = partList[partList.length-1].acc.add(new vector2(0,speed*10));
		}
		//box bounds, simulate, and reset
		for(var i = 0;i < partList.length;i++){
			partList[i].vel = partList[i].pos.subtract(partList[i].prevPos);
			if(partList[i].friction){
				partList[i].vel = partList[i].vel.add(new vector2(-(partList[i].vel.x)*fricConst,0)); //friction
			}
			partList[i].friction = false;
			if(partList[i].vel.y<-10) partList[i].vel.y = partList[i].vel.y/1.5;
			partList[i].acc = partList[i].acc.add(new vector2(0,grav));
			partList[i].step(globalTime);
			partList[i].acc.set(0,0);
		}
		//constraints
		for(var i = 0;i < numTimes;i++){
			//binds:
			for(var ii = 0;ii < bindList.length;ii++){
				bindList[ii].calc();
			}
		}
		//walls
		for(var i = 0;i < wallList.length;i++){
			var iSlope = (-1)/(wallList[i].slope);
			for(var ii = 0;ii < partList.length;ii++){
				if(partList[ii].pos.x > wallList[i].x1 && partList[ii].pos.x < wallList[i].x2){
					var relY = (wallList[i].slope * partList[ii].pos.x)+wallList[i].b;
					var relX = (partList[ii].pos.y - wallList[i].b)/wallList[i].m;
					if(partList[ii].pos.y>relY){
						var x0 = partList[ii].pos.x;
						var y0 = partList[ii].pos.y;
						var m = wallList[i].slope;
						var k = wallList[i].b;
						partList[ii].pos.x = (x0 + (m*y0)-(m*k))/((m*m)+1);
						partList[ii].pos.y = m*((x0 + (m*y0) - (m*k))/((m*m)+1)) + k;
						partList[ii].friction = true;
						if(partList[ii].pos.y>relY){
							partList[ii].pos.y = relY;
						}	
					}
				}
			}
		}
	}
	
	function redraw(){
		canX.fillStyle = "rgb(100,100,255)";
		canX.clearRect(0,0,800,300);
		canX.fillRect(0,0,800,300);
		
		//the ground
		canX.beginPath();
		canX.strokeStyle = "rgb(20,200,20)";
		canX.fillStyle = "rgb(102,51,0)";
		canX.moveTo(wallList[0].x1-view.x,wallList[0].y1-view.y);
		for(var i = 0;i < wallList.length;i++){
			canX.lineTo(wallList[i].x2-view.x,wallList[i].y2-view.y);
		}
		canX.lineTo(wallList[wallList.length-1].x2-view.x,wallList[wallList.length-1].y2-view.y+1000);
		canX.lineTo(wallList[0].x1-view.x,wallList[0].y1-view.y+1000);
		canX.closePath();
		canX.lineWidth = 10;
		canX.fill();
		canX.stroke();
		
		//The shape:
		canX.beginPath();
		canX.strokeStyle="rgb(0,0,0)";
		canX.moveTo(partList[0].pos.x-view.x,partList[0].pos.y-view.y);
		for(var i = 0;i < numPoints-1;i++){
			var next = i + 1;
			if(next===partList.length-1){
				next = 0;
			}
			canX.lineTo(partList[next].pos.x-view.x,partList[next].pos.y-view.y);
		}
		canX.closePath();
		canX.lineWidth = 1;
		canX.stroke();
		canX.fillStyle="rgb(255,0,0)";
		canX.fill();
		
		if(devmode){
			canX.fillStyle="rgb(0,0,0)"
			for(var i = 0;i < partList.length;i++){
				canX.fillRect(partList[i].pos.x-.5-view.x,partList[i].pos.y-.5-view.y,1,1);
			};
			
			canX.strokeStyle="blue";
			canX.lineWidth = .3;
			for(var i = 0;i < bindList.length;i++){
				canX.beginPath();
				canX.moveTo(bindList[i].mass1.pos.x-view.x,bindList[i].mass1.pos.y-view.y);
				canX.lineTo(bindList[i].mass2.pos.x-view.x,bindList[i].mass2.pos.y-view.y);
				canX.stroke();
			}	
		}
		
	}
	
	function go(){
		simulate();
		redraw();
	}
	
	var repeat = setInterval(function(){go()},1);
	
	$("#canv")
		.mousemove(function(evnt){
			mouse.x = evnt.pageX;
			mouse.y = evnt.pageY;
			howFarRight = evnt.target.offsetLeft+1;
			howFarDown = evnt.target.offsetTop+1;
			mouse.x = mouse.x-howFarRight;
			mouse.y = mouse.y-howFarDown;
		})
		.mousedown(function(){
			//mouse.down = true;
		})
		.mouseup(function(){
			mouse.down = false;
		});
		
	$(document)
		.keydown(function(evnt){
			keys[evnt.keyCode] = true;
		})
		.keyup(function(evnt){
			delete keys[evnt.keyCode];
		});
});