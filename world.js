var mouse = {x:0,y:0,down:false};
var view = {x:0,y:0};
var globalTime = 0;
var partList = [];
var bindList = [];
var wallList = [];
var keys = [];
var numTimes = 10;
var num = 0;
var bindNum = 0;
var grav =.0098;
var speed = .01;

var mode = 0;

var numPoints = 28;


if(mode === 0){
//square:
	var sideLength = 50;
	var xStar = 400;
	var yStar = 100;
	var numPerSide = Math.round(numPoints/4);
	for(var i = 0;i < numPerSide;i++){
		var relativeX = xStar+(i*(sideLength/numPerSide));
		var relativeY = yStar;
		makePart(relativeX,relativeY,1,0,0);
	}
	for(var i = 0;i < numPerSide;i++){
		var relativeX = xStar+sideLength;
		var relativeY = yStar+(i*(sideLength/numPerSide));
		makePart(relativeX,relativeY,1,0,0);
	}
	for(var i = numPerSide;i >= 0;i--){
		var relativeX = xStar+(i*(sideLength/numPerSide))
		var relativeY = yStar+sideLength;
		makePart(relativeX,relativeY,1,0,0);
	}
	for(var i = numPerSide-1;i >= 0;i--){
		var relativeX = xStar;
		var relativeY = yStar+(i*(sideLength/numPerSide))
		makePart(relativeX,relativeY,1,0,0);
	}

	for(var i = 0;i < numPoints;i++){
		for(var ii = 1;ii < numPoints; ii++){
			var next = i + ii;
			if(next>=partList.length){
				next = next - numPoints;
			}
			makeBind(i,next,-1,.0003);
		}
	}
}
else if(mode === 1){
//circle:
	var radius = 30;
	var xMain = 400;
	var yMain = 150;
	for(var i = 0;i < numPoints;i++){
		var angle = i*((2*3.141592638)/numPoints);
		var relativeX = xMain+(radius*Math.cos(angle));
		var relativeY = yMain+(radius*Math.sin(angle));
		makePart(relativeX,relativeY,1,0,0);
	}
	for(var i = 0;i < numPoints;i++){
		//neighbor:
		for(var ii = numPoints/2;ii < numPoints; ii++){
			var next = i + ii;
			if(next>=partList.length){
				next = next - numPoints;
			}
			makeBind(i,next,-1,.0003);
		}
	}
}

//makeBind(0,numPoints,-1,.0003);

var xBegin = 0;
var yBegin = 250;
var xNext = 0;
var yNext = 0;
for(var i = 0;i < 200;i++){
	xNext = xBegin+10+Math.random()*10;
	yNext = yBegin+40-Math.random()*80;
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
		//box bounds, simulate, and reset
		for(var i = 0;i < partList.length;i++){
			partList[i].vel = partList[i].pos.subtract(partList[i].prevPos);
			if(partList[i].vel.y<-10) partList[i].vel.y = partList[i].vel.y/1.5;
			partList[i].acc = partList[i].acc.add(new vector2(0,grav));
			
			
			//wasd:
			if(68 in keys){
				partList[i].acc = partList[i].acc.add(new vector2(speed,0));
			}
			if(65 in keys){
				partList[i].acc = partList[i].acc.add(new vector2(-speed,0));
			}
			if(83 in keys){
				partList[i].acc = partList[i].acc.add(new vector2(0,speed));
			}
			
			
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
			for(var ii = 0;ii < partList.length;ii++){
				if(partList[ii].pos.x > wallList[i].x1 && partList[ii].pos.x < wallList[i].x2){
					var relY = (wallList[i].slope * partList[ii].pos.x)+wallList[i].b;
					if(partList[ii].pos.y>relY){
						var temp = partList[ii].pos;
						partList[ii].pos = partList[ii].prevPos;
						partList[ii].prevPos = temp;
						if(partList[ii].pos.y>relY){
							partList[ii].pos.y = relY;
						}
					}
				}
			}
		}
	}
	
	function redraw(){
		canX.fillStyle = "rgb(255,255,255)";
		canX.clearRect(0,0,800,300);
		canX.fillRect(0,0,800,300);
		canX.fillStyle = "rgb(0,0,0)";
		for(var i = 0 ;i < partList.length;i++){
			//canX.fillRect(partList[i].pos.x-.8-view.x,partList[i].pos.y-.8-view.y,1.6,1.6);
		}
		for(var i = 0;i <= numPoints;i++){
			var next = i + 1;
			if(next>=partList.length){
				next = next - numPoints;
			}
			canX.beginPath();
			canX.moveTo(partList[i].pos.x-view.x,partList[i].pos.y-view.y);
			canX.lineTo(partList[next].pos.x-view.x,partList[next].pos.y-view.y);
			canX.stroke()
		}
		for(var i = 0;i < wallList.length;i++){
			canX.beginPath();
			canX.moveTo(wallList[i].x1-view.x,wallList[i].y1-view.y);
			canX.lineTo(wallList[i].x2-view.x,wallList[i].y2-view.y);
			canX.stroke();
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
			var tempNum = num;
			makePart(mouse.x-20,mouse.y-20,1,0,0);
			makePart(mouse.x+20,mouse.y-20,1,0,0);
			makePart(mouse.x+20,mouse.y+20,1,0,0);
			makePart(mouse.x-20,mouse.y+20,1,0,0);
			makeBind(tempNum,tempNum+1,-1,.5,1);
			makeBind(tempNum+1,tempNum+2,-1,.5,1);
			makeBind(tempNum+2,tempNum+3,-1,.5,1);
			makeBind(tempNum+3,tempNum,-1,.5,1);
			makeBind(tempNum,tempNum+2,-1,.5,0);
			makeBind(tempNum+1,tempNum+3,-1,.5,0);
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