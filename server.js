var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var TAU = 2*Math.PI;
var wallList = [];
var changeList = [];
var waterLevel = 2000;
var yMax = 2000;
var jelloConst = .00016//.0002; //Stiffness, from 0 to .5
var eldrichMonstrosities = false;

var personList = [];
var pLen = 0;
personList.length = 0;

app.use(express.static(__dirname + "\\public"));

app.get('/',function(req,res){
	res.sendfile(__dirname+"\\public\\index.html");
	//res.sendfile('js/*');
});

io.on('connection',function(socket){
	console.log("Attempted Connection");
	//Find a place for them:
	var mee = 0;
	if(personList.length===0){
		personList.push({pList: [],who: 0,colr: "rgb(0,0,0)", left:0});
		mee = 0;	
		pLen = 1;
	}
	else{
		for(var i = 0;i <= pLen;i++){
			if(!(i===pLen)){
				if(personList[i].left === 1){
					personList[i].left = 0;
					mee = i;
					i = pLen + 1;
				}
			}
			else{
				personList.push({pList: [],who: i,colr: "rgb(0,0,0)", left:0});
				pLen += 1;
				mee = i;
				i = pLen+1;
			}
		}
	}
	socket.on('setup',function(msg){
		var partList = generateShape(msg.nmPts,msh.prmtr,msg.nmSds);
		personList[mee].pList = partList;
		socket.emit('you',{shape: partList,world: wallList,changes: changeList});
	});
	
	socket.on('disconnect',function(){
		clearInterval(broadcast);
		personList[mee].left = 1;
		personList[mee].pList = [];
		personList[mee].colr = "";
		console.log("Person "+mee+" disconnected.");
	});
});

http.listen(4545,function(){
	console.log("listening *:4545");
});

/*
wss.on('connection',function(ws){
	console.log("Attempted Connection");
	//Find a place for them:
	var mee = 0;
	if(personList.length===0){
		personList.push({pList: [],who: 0,colr: "rgb(0,0,0)", left:0});
		mee = 0;	
		pLen = 1;
	}
	else{
		for(var i = 0;i <= pLen;i++){
			if(!(i===pLen)){
				if(personList[i].left === 1){
					personList[i].left = 0;
					mee = i;
					i = pLen + 1;
				}
			}
			else{
				personList.push({pList: [],who: i,colr: "rgb(0,0,0)", left:0});
				pLen += 1;
				mee = i;
				i = pLen+1;
			}
		}
	}
	
	//They are in! Send what is needed:
	console.log("Person "+mee+" connected");
	try{
		ws.send(JSON.stringify({data: wallList,flag: 0}));//Flag 0 = wallList
		ws.send(JSON.stringify({data: changeList,flag: 1}));//Flag 1 = changeList
		ws.send(JSON.stringify({data: {wL: waterLevel,yM: yMax,whom: mee},flag: 2}));//Flag 2 = etc var
	} catch(err){
		console.log(err);
	}
	
	//Send stuff as needed:
	var broadcast = setInterval(function(){
		try{
			ws.send(JSON.stringify({data: personList,flag: 3}));//3 = blob position
		} catch(err){
			console.log(err);
		}
	},5);
	
	//What to do when get a message:
	ws.on('message',function(message){
		try{
			var msg = JSON.parse(message);
			switch(msg.flag){
			case 0://positions
				personList[msg.who].pList = msg.message;
				break;
			case 1://color
				personList[msg.who].colr = msg.message;
			}
		} catch(err){
			console.log(err);
		}
	});
	
	//Somebody left:
	ws.on('close',function(){
		clearInterval(broadcast);
		personList[mee].left = 1;
		personList[mee].pList = [];
		personList[mee].colr = "";
		console.log("Person "+mee+" disconnected.");
	});
});
*/

function makeWall(x1,y1,x2,y2,type){
	wallList.push(new wall(x1,y1,x2,y2,type));
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

generateWorld();

//WORLD CREATION-----------------------------------------------------------
function generateWorld(){
	console.log("Beginning World Generation");
	var xBegin = 0;
	var yBegin = 250;
	var xNext = 0;
	var yNext = 0;
	var fullLen = 800;
	var gLen = 0;
	var worldType = 4; //0 = Plains
	do{
		worldType = Math.round(Math.random()*4);
		var a = {"x":xBegin,"type":worldType}
		changeList.push(a);
		gLen = Math.min(50+Math.round(Math.random()*100),fullLen);
		fullLen = fullLen - gLen;
		switch(worldType){
			case 0:
				//Flatlands
				for(var i = 0;i < gLen;i++){
					xNext = xBegin+50+Math.random()*150;
					yNext = yBegin-20+Math.random()*40;
					makeWall(xBegin,yBegin,xNext,yNext,0);
					xBegin = xNext;
					yBegin = yNext;
				}
				break;
			case 1:
				//Cliff
				for(var i = 0;i < gLen;i++){
					xNext = xBegin+10+Math.random()*10;
					yNext = yBegin+2+Math.random()*100;
					if(yNext>waterLevel-100) yNext = waterLevel-130;
					if(yNext>yMax) yMax = yNext;
					makeWall(xBegin,yBegin,xNext,yNext,1);
					xBegin = xNext;
					yBegin = yNext;
				}
				break;
			case 2:
				//Valley
				for(var i = 0;i < gLen;i++){
					xNext = xBegin+40+Math.random()*50;
					if(i<gLen/2){
						yNext = yBegin+10+Math.random()*40;
					}
					else{
						yNext = yBegin-10-Math.random()*40;
					}
					if(yNext>yMax) yMax = yNext;
					makeWall(xBegin,yBegin,xNext,yNext,2);
					xBegin = xNext;
					yBegin = yNext;
				}
				break;
			case 3:
				//Rocky
				for(var i = 0;i < gLen;i++){
					xNext = xBegin+10+Math.random()*200;
					yNext = yBegin-60+Math.random()*120;
					makeWall(xBegin,yBegin,xNext,yNext,3);
					xBegin = xNext;
					yBegin = yNext;
				}
				break;
			case 4:
				gLen = gLen * 2;
				//Steps
				for(var i = 0;i < gLen;i++){
					if(i%2===0){
						xNext = xBegin;
						yNext = yBegin-20+Math.random()*40;
						makeWall(xBegin,yBegin,xNext,yNext,4);
						xBegin = xNext;
						yBegin = yNext;
					}
					else{
						xNext = xBegin+20+Math.random()*30;
						yNext = yBegin;
						makeWall(xBegin,yBegin,xNext,yNext,4);
						xBegin = xNext;
						yBegin = yNext;
					}
				}
				break;
		}
	} while(fullLen>0);
	console.log("World Generated");
}
//END WORLD CREATION-------------------------------------------------------

//COMMENCE SHAPE CREATION--------------------------------------------------
function generateShape(nmPts,prmtr,nmSds){
	var partList = [];
	var numPoints = nmPts;
	var perimeter = prmtr;
	var numSides = nmSds;

	var xStart = 100;
	var xFirst = xStart;
	var yStart = 100;
	var yFirst = yStart;
	var sideLen = perimeter/numSides;
	var numPerSide = Math.round(numPoints/numSides);
	numPoints = numPerSide*numSides;

	//COMMENCE THE SHAPE CREATION---------------------------------------------------

	var theta = 0;
	for(var i = 0;i < numSides;i++){
		theta = i*((TAU)/numSides);
		for(var ii = 0;ii<numPerSide;ii++){
			makePart(xStart,yStart,1,0,0);
			xStart = xStart+(sideLen/numPerSide)*Math.cos(theta);
			yStart = yStart+(sideLen/numPerSide)*Math.sin(theta);
		}
	}

	if(!eldrichMonstrosities){
		for(var i = 0;i < partList.length;i++){ //Make the outer shell
			var next = i + 1;
			if(next>=partList.length) next = 0;
			makeBind(i,next,-1,.05); //outer membrane stiffness
		}
	}
	else{speed = speed*6};

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
	
	return partList;
}






function vector2(x,y){
	this.x = x;
	this.y = y;	
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

vector2.prototype.output = function(){
	console.log("["+this.x+","+this.y+"]");
}

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