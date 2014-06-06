var mouse = {x:0,y:0,down:false};
var view = {x:0,y:0};
var globalTime = 0;
var partList = [];
var bindList = [];
var wallList = [];
var changeList = [];
var otherPeopleList = [];
var keys = [];
var num = 0;
var bindNum = 0;
var date  = new Date();
var lastTime = date.getTime();
var currentTime = date.getTime();
var timeLeftOver = 0;
var fixedDelta = 16;
var perTime = 1000;
var fixedTimeChange = fixedDelta/perTime;
var yMax = 0;
var waterLevel = 0; 
var cChange = true;
var gColorF = [255,255,255]; // Actually change the start color
var sColorF = [255,255,255];
var syColorF = [255,255,255];
var gColor = "rgb(255,255,255)";
var sColor = "rgb(255,255,255)";
var syColor = "rgb(255,255,255)";
var thingsLoaded  = 0;
var m = 0;

//shape parameters:
var numPoints = 30;
var perimeter = 200;
var numSides = 4;

//Pararmeters:
var numTimes = 5; //Higher means more accurate physics but slower speed;
var fricConst = 1; //how much friction the ground has, 0 to 1
var grav = .016*perTime; //acceleration due to gravity
var speed = .01*perTime; // how fast the blob accelerates
var devmode = false; //show behind the scenes things or not
var eldrichMonstrosities = false; //really stupid if you set to true
var gColorO = [255,255,255]; //Color of the ground
var sColorO = [255,255,255]; //Color of the surface
var syColorO = [255,255,255];//Color of the sky
var myColor = "rgb("+Math.round(Math.random()*255)+","+Math.round(Math.random()*255)+","+Math.round(Math.random()*255)+")";

function changeColors(type){
	switch(type){
		case 0: //Flatlands
			cChange = true;
			gColorO = [181,128,66];
			sColorO = [251,223,110];
			syColorO = [100,100,255];
			break;
		case 1: //Cliff
			cChange = true;
			gColorO = [230,141,97];
			sColorO = [149,50,30];
			syColorO = [125,170,211];
			break;
		case 2: //Valley
			cChange = true;
			gColorO = [86,132,45];
			sColorO = [120,166,100];
			syColorO = [125,170,211];
			break;
		case 3: //Rocky
			cChange = true;
			gColorO = [100,100,100];
			sColorO = [150,150,150]; 
			syColorO = [80,80,235];
			break;
		case 4: //Steps
			cChange = true;
			gColorO = [70,70,70];
			sColorO = [10,10,10]; 
			syColorO = [125,170,211];
			break;
	}
}

$(document).ready(function(){
	var can = document.getElementById("canv");
	var canX = can.getContext("2d");
	
	var socket = io();
	socket.emit('setup',{nmPts: numPoints,prmtr: perimeter,nmSds: numSides});
	socket.on('you',function(msg){
		partList = msg.you.pList;
		bindList = msg.you.bindList;
		wallList = msg.world;
		changeList = changes;
		thingsLoaded = 3;
	});
	
	
	//THE REST OF THE FXN:
	function simulate(elapsedTime){
		view.x = (partList[0].pos.x+partList[Math.round(numPoints/2)].pos.x)/2 - 400;
		view.y = (partList[0].pos.y+partList[Math.round(numPoints/2)].pos.y)/2 - 150;
		if(changeList.length > 0 && partList[partList.length-1].pos.x > changeList[0].x){
			changeColors(changeList[0].type);
			changeList.splice(0,1);
		}
		var elapsedSq = elapsedTime*elapsedTime;
		if(83 in keys){
			partList[partList.length-1].acc = partList[partList.length-1].acc.add(new vector2(0,grav*100));
		}
			//box bounds, simulate, and reset
		for(var i = 0;i < partList.length;i++){
			//add gravity:
			(partList[i].pos.y<waterLevel) ? partList[i].acc = partList[i].acc.add(new vector2(0,grav)):partList[i].acc = partList[i].acc.add(new vector2(0,-grav*2));
				
			if(i!=partList.length-1){
				var differ = partList[i].pos.subtract(partList[partList.length-1].pos);
				if(68 in keys){
					if(differ.x<0 && differ.y<0) partList[i].acc = partList[i].acc.add(new vector2(speed,-speed));
					else if(differ.x>0 && differ.y<0) partList[i].acc = partList[i].acc.add(new vector2(speed,speed));
					else if(differ.x>0 && differ.y>0) partList[i].acc = partList[i].acc.add(new vector2(-speed,speed));
					else if(differ.x<0 && differ.y>0) partList[i].acc = partList[i].acc.add(new vector2(-speed,-speed));
				}
				if(65 in keys){
					if(differ.x<0 && differ.y<0) partList[i].acc = partList[i].acc.add(new vector2(-speed,speed));
					else if(differ.x>0 && differ.y<0) partList[i].acc = partList[i].acc.add(new vector2(-speed,-speed));
					else if(differ.x>0 && differ.y>0) partList[i].acc = partList[i].acc.add(new vector2(speed,-speed));
					else if(differ.x<0 && differ.y>0) partList[i].acc = partList[i].acc.add(new vector2(speed,speed));
				}
			}
			partList[i].vel = partList[i].pos.subtract(partList[i].prevPos);
			var nextPosX = partList[i].pos.x + partList[i].vel.x + partList[i].acc.x*elapsedSq;
			var nextPosY = partList[i].pos.y + partList[i].vel.y + partList[i].acc.y*elapsedSq;
			partList[i].prevPos.x = partList[i].pos.x;
			partList[i].prevPos.y = partList[i].pos.y;
			partList[i].pos = new vector2(nextPosX,nextPosY);
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
						var b = wallList[i].b;
						partList[ii].prevPos = partList[ii].pos;
						partList[ii].pos.x = (x0 + (m*y0)-(m*b))/((m*m)+1);
						partList[ii].pos.y = m*((x0 + (m*y0) - (m*b))/((m*m)+1)) + b;
						partList[ii].friction = true;
						if(partList[ii].pos.y>relY){
							partList[ii].pos.y = relY;
						}	
					}
				}
			}
		}
		connection.send(JSON.stringify({message: partList,who: me,flag: 0}));//Flag 0 = partList
	}
	
	function redraw(){
		if(cChange){
			cChange = false;
			for(i in gColorF){
				if(gColorF[i]!=gColorO[i]){
					cChange = true;
					(gColorF[i]>gColorO[i]) ? gColorF[i]-=1 : gColorF[i]+=1;
				}
			}
			for(i in sColorF){
				if(sColorF[i]!=sColorO[i]){
					cChange = true;
					(sColorF[i]>sColorO[i]) ? sColorF[i]-=1 : sColorF[i]+=1;
				}
			}
			for(i in syColorF){
				if(syColorF[i]!=syColorO[i]){
					cChange = true;
					(syColorF[i]>syColorO[i]) ? syColorF[i]-=1 : syColorF[i]+=1;
				}
			}
			gColor = "rgb("+gColorF[0]+","+gColorF[1]+","+gColorF[2]+")";
			sColor = "rgb("+sColorF[0]+","+sColorF[1]+","+sColorF[2]+")";
			syColor = "rgb("+syColorF[0]+","+syColorF[1]+","+syColorF[2]+")";
		}
		canX.fillStyle = syColor; 
		canX.clearRect(0,0,800,300);
		canX.fillRect(0,0,800,300);
		
		//the ground
		canX.beginPath();
		canX.strokeStyle = sColor; 
		canX.fillStyle = gColor; 
		canX.moveTo(wallList[0].x1-view.x,wallList[0].y1-view.y);
		for(var i = 0;i < wallList.length;i++){
			canX.lineTo(wallList[i].x2-view.x,wallList[i].y2-view.y);
		}
		canX.lineTo(wallList[wallList.length-1].x2-view.x,yMax+200-view.y);
		canX.lineTo(wallList[0].x1-view.x,yMax+200-view.y);
		canX.closePath();
		canX.lineWidth = 10;
		canX.fill();
		canX.stroke();
		
		//OTHER PEOPLE:
		for(var i = 0;i < otherPeopleList.length;i++){
			if(i!=me && otherPeopleList[i].left!=1){
				if(otherPeopleList[i].pList.length>0){
					drawThing(otherPeopleList[i].pList,otherPeopleList[i].colr);
				}
			}
		}
		
		//Me:
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
		canX.fillStyle=myColor;
		canX.fill();
		
		//WATER:
		canX.beginPath();
		canX.moveTo(0,waterLevel-view.y);
		canX.lineTo(800,waterLevel-view.y);
		canX.lineTo(800,yMax+200-view.y);
		canX.lineTo(0,yMax+200-view.y);
		canX.closePath();
		canX.strokeStyle = "rgb(0,0,255)";
		canX.lineWidth = 8;
		canX.fillStyle = "rgba(0,100,255,.8)";
		canX.stroke();
		canX.fill();
		
		if(devmode){
			canX.fillStyle="rgb(0,0,0)"
			for(var i = 0;i < partList.length;i++){
				canX.fillRect(partList[i].pos.x-.5-view.x,partList[i].pos.y-.5-view.y,1,1);
			};
			
			canX.strokeStyle="blue";
			canX.lineWidth = .1;
			for(var i = 0;i < bindList.length;i++){
				canX.beginPath();
				canX.moveTo(bindList[i].mass1.pos.x-view.x,bindList[i].mass1.pos.y-view.y);
				canX.lineTo(bindList[i].mass2.pos.x-view.x,bindList[i].mass2.pos.y-view.y);
				canX.stroke();
			}	
		}
		
	}
	
	function drawThing(whatThing,coll){
		canX.beginPath();
		canX.strokeStyle="rgb(0,0,0)";
		canX.moveTo(whatThing[0].pos.x-view.x,whatThing[0].pos.y-view.y);
		for(var i = 0;i < whatThing.length-1;i++){
			var next = i + 1;
			if(next===whatThing.length-1){
				next = 0;
			}
			canX.lineTo(whatThing[next].pos.x-view.x,whatThing[next].pos.y-view.y);
		}
		canX.closePath();
		canX.lineWidth = 1;
		canX.stroke();
		canX.fillStyle=coll;
		canX.fill();
	}
	
	function go(){
		if(thingsLoaded===requiredLoad){
			date = new Date();
			currentTime = date.getTime();
			var change = currentTime - lastTime;
			lastTime = currentTime;
			var steps = Math.floor((change + timeLeftOver)/fixedDelta);
			steps = Math.min(steps,20);
			if(steps<1) steps = 1;
			timeLeftOver = change - (steps * fixedDelta);
			
			for(var i = 0;i < steps;i++){
				simulate(fixedTimeChange);
			}
			
			redraw();
			canRec = true;
		}
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
		});
		
	$(document)
		.keydown(function(evnt){
			keys[evnt.keyCode] = true;
		})
		.keyup(function(evnt){
			delete keys[evnt.keyCode];
		});
});