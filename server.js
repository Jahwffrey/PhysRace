var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var TAU = 2*Math.PI;
var wallList = [];
var changeList = [];
var waterLevel = 200000;
var yMax = 2000;
var jelloConst = .00016//.0002; //Stiffness, from 0 to .5
var requiredLoad = 0;
var eldrichMonstrosities = false;

var personList = [];
var pLen = 0;
personList.length = 0;

app.use(express.static(__dirname + "\\public"));

app.get('/',function(req,res){
	res.sendfile(__dirname+"\\public\\index.html");
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
	console.log("Person "+mee+" connected.");
	socket.emit('setup',{wL: wallList,cL: changeList, wLe: waterLevel,yM: yMax,whom: mee});
	var broadcast = setInterval(function(){
		socket.emit('ppl',personList);
	},10);
	
	socket.on('setCol',function(msg){
		personList[msg.who].colr = msg.col;
	});
	
	socket.on('myPos',function(msg){
		try{
			personList[msg.who].pList = msg.pos;
		} catch(err){
			console.log(err);
		}
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

function makeWall(x1,y1,x2,y2,type){
	wallList.push(new wall(x1,y1,x2,y2,type));
}

function makePart(x,y,mass,hspeed,vspeed,partList,num){
	num+=1;
	partList[num-1] = new pointMass(x,y,mass,hspeed,vspeed,num);
}

function makeBind(num1,num2,dist,stiff,partList,bindList){
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
				var turnpoint = Math.round(Math.random()*gLen);
				var sign = Math.random(2);
				(sign<1) ? sign=-1 : sign=1;
				for(var i = 0;i < gLen;i++){
					xNext = xBegin+40+Math.random()*50;
					if(i<turnpoint){
						yNext = yBegin+sign*(10+Math.random()*40);
					}
					else{
						yNext = yBegin+(-sign)*(10+Math.random()*40);
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
	this.currTime = 0;
	this.mass = mass;
	this.id = id;
	this.friction = false;
}