var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({port: 4545});
var wallList = [];
var changeList = [];
var waterLevel = 2000;
var yMax = 2000;

var person = 0;
var personList = [];


wss.on('connection',function(ws){
	personList.push(person);
	var me = person;
	console.log("Person "+me+" connected");
	ws.send(JSON.stringify({data: wallList,flag: 0}));//Flag 0 = wallList
	ws.send(JSON.stringify({data: changeList,flag: 1}));//Flag 1 = changeList
	ws.send(JSON.stringify({data: {wL: waterLevel,yM: yMax,whom: person},flag: 2}));//Flag 2 = etc var
	person+=1;
	
	function reorganize(pivot){
		if(me>pivot) me-=1;
	}
	
	var broadcast = setInterval(function(){
		ws.send(JSON.stringify({data: personList,flag: 3}));//3 = blob position
	},5);
	ws.on('message',function(message){
		var msg = JSON.parse(message);
		switch(msg.flag){
			case 0://positions
				personList[msg.who] = msg.message;
				break;
		}
	});
	ws.on('close',function(){
		clearInterval(broadcast);
		reorganize(me);
		personList.pop();
		person-=1;
		console.log("Person "+me+" disconnected.");
	});
})

//This code is meant to generate the world!

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

function makeWall(x1,y1,x2,y2,type){
	wallList.push(new wall(x1,y1,x2,y2,type));
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