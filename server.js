var express = require('express');
var cookieParser = require('cookie-parser')
var app = express();
var who = [];
var inventory;

var mysql = require('mysql');
var connection = mysql.createConnection({
	host :'mysql.eecs.ku.edu',
	user :'hcarothe',
	password : 'Gn0ao5xZ',
	database : 'hcarothe'
	});
	
	connection.connect();


app.use(cookieParser());

function setCookie(req, res, next){
	var inven = [];

	req.userName = req.cookies.UNCOOKIE;
	req.userid = req.cookies.IDCOOKIE;
	
	if (!who[req.userid])
	{

		inven = loadFromDataBase(req,res,next);
		
		who[req.userid] = {
			"location": "strong-hall",
			"inventory": inven
		};
	}
	else
	{
		console.log(inventory);
		saveToDataBase(req,res,next);	
		fs.writeFile('state.txt', JSON.stringify(campus), function (err) {
	  if (err) throw err;
});
	}
	
	req.who = who[req.userid];
	inventory = req.who.inventory;
	next();
}
function saveToDataBase(req,res,next)
{
	req.userName = req.cookies.UNCOOKIE;
	req.userid = req.cookies.IDCOOKIE;
	req.who = who[req.userid];
	inventory = req.who.inventory;
		
	connection.query('UPDATE login SET uName= \''+req.userName+'\', uInventory= \''+inventory+'\' WHERE uName=\''+req.userName+'\'',function(err,result){}); 
	
}
function createUser(req, res, next)
{
		req.userName = req.cookies.UNCOOKIE;
		//console.log("User Doesn't Exist");
		connection.query('INSERT INTO login(uName, uInventory,location) VALUES(\''+req.userName+'\',\'laptop\',\'strong-hall\')',function	(err,result){});
}
function loadFromDataBase(req, res, next)
{
		req.userName = req.cookies.UNCOOKIE;
		var inven = [];
		
		var query = connection.query('SELECT uInventory FROM login where uName = \''+req.userName+'\'', 	 
		function(err, result) 
		{	
			if(result.length == 0)//new user
			{
				createUser(req, res, next);
				inven[0] = 'laptop';
				return inven;
			}
			else//existing user
			{
				var str = '';
				for (var p in result[0]) {
					if (result[0].hasOwnProperty(p)) {
						str += p + '::' + result[0][p] + '\n';
					}
				}
				var str2 = '';
				var i = 12;
				while(i < str.length-1)
				{
					str2 += str[i];
					i++;
				}
				i = 0;var j = 0;var str3 = '';//console.log("stuff2", str2);
				while(i <str2.length)
				{	
					if(str2[i] == ',')
					{
						//console.log(str3);
						inven[j] = str3;//console.log("stuff", str3);
						str3 = '';
						j++;
					}
					else
					{
						if(str2[i] != ' ' && str2[i] != ',')
						{
							str3 += str2[i];
						}
					}
					i++;
				}
				inven[j] = str3;
			} 
		});
		return inven;
}
app.use(setCookie);


app.get('/login.html', function(req, res) {
	
	res.status(200);
	res.sendFile(__dirname + "/login.html");
});
app.get('/', function(req, res){
	//inventory = ["laptop"];
	
	//added terminal print statement to better understand what's going on
	//console.log("Who: ", req.who);
	
	res.status(200);
	resetWorld(req,res);
	res.sendFile(__dirname + "/index.html");
});

app.get('/:id', function(req, res){
	if (req.params.id == "inventory") {
	    res.set({'Content-Type': 'application/json'});
	    res.status(200);
	    res.send(req.who.inventory);
	    return;
	}
	if (req.params.id == "who") {
		res.set({'Content-Type': 'application/json'});
		res.status(200);
		res.send(who);
		return;
	}
	for (var i in campus) {
		if (req.params.id == campus[i].id) {
		    res.set({'Content-Type': 'application/json'});
		    res.status(200);
		    res.send(campus[i]);
		    
		    req.userName = req.cookies.UNCOOKIE;console.log(req.userName,"-",campus[i].id);
		    connection.query('UPDATE login SET uName= \''+req.userName+'\', location= \''+campus[i].id+'\'WHERE uName=\''+req.userName+'\'',function(err,result){}); 
		    
		    return;
		}
	}
	res.status(404);
	res.send("not found, sorry");
});

app.get('/images/:name', function(req, res){
	res.status(200);
	res.sendFile(__dirname + "/" + req.params.name);
});

app.delete('/:id/:item', function(req, res){
	for (var i in campus) {
		if (req.params.id == campus[i].id) {
		    res.set({'Content-Type': 'application/json'});
		    var ix = -1;
		    if (campus[i].what != undefined) {
				ix = campus[i].what.indexOf(req.params.item);
		    }
		    if (ix >= 0) {
				res.status(200);
				
				req.who.inventory.push(campus[i].what[ix]); // stash in specific user's inventory
				inventory = req.who.inventory;
		        res.send(req.who.inventory); // respond with specific user's inventory
				
				campus[i].what.splice(ix, 1); // room no longer has this

				//console.log("Who: ", req.who);

				return;
		    }

		    res.status(200);
		    res.send([]);
		    return;
		}
	}
	res.status(404);
	res.send("location not found");
});

app.put('/:id/:item/', function(req, res){
	for (var i in campus) {
		if (req.params.id == campus[i].id) {
		
				// Check that specific user has this
				var ix = req.who.inventory.indexOf(req.params.item)
				
				if (ix >= 0) {
				
					//add req as parameter to dropbox()
					dropbox(ix,campus[i],req);
					
					res.set({'Content-Type': 'application/json'});
					res.status(200);
					res.send([]);
				} else {app.post('/', function(req, res){
							req.session.userName = req.body.userName;
							res.redirect('/');
						});
					res.status(404);
					res.send("you do not have this");
				}
				
				//console.log("Who: ", req.who);
				return;
		}
	}
	res.status(404);
	res.send("location not found");
});

app.listen(3000);

var dropbox = function(ix,room,req) {
	var item = req.who.inventory[ix];    // take note of what item to remove is
	req.who.inventory.splice(ix, 1);	 // remove from specific user's inventory
	inventory = req.who.inventory;
	if (room.id == 'allen-fieldhouse' && item == "basketball") {
		room.text	+= " Someone found the ball so there is a game going on!"
		return;
	}
	if (room.what == undefined) {
		room.what = [];
	}
	room.what.push(item);
}

////////////////////
	var fs = require("fs");
	var campus;
	
	var fileName = "state.txt";
	function resetWorld(req,res)
	{
		var reset = req.cookies.WRCOOKIE;
		
		if(reset == 1)
		{
			fileName = "worldReset.txt";
			fs.readFile(fileName, 'utf8',function (err,data) {	
			  if (err) {
				return console.log(err);
			  }
			  //console.log(data);
			  campus = JSON.parse(data);
			});
				}
	}
	fs.readFile(fileName, 'utf8',function (err,data) {	
	  if (err) {
		return console.log(err);
	  }
	  //console.log(data);
	  campus = JSON.parse(data);
	});
	
	
		 
	////////////////


//console.log(campus);
    /*[ { "id": "lied-center",
	"where": "LiedCenter.jpg",
	"next": {"east": "eaton-hall", "south": "dole-institute"},
	"text": "You are outside the Lied Center."
      },
      { "id": "dole-institute",
	"where": "DoleInstituteofPolitics.jpg",
	"next": {"east": "allen-fieldhouse", "north": "lied-center"},
	"text": "You take in the view of the Dole Institute of Politics. This is the best part of your walk to Nichols Hall."
      },
      { "id": "eaton-hall",
	"where": "EatonHall.jpg",
	"next": {"east": "snow-hall", "south": "allen-fieldhouse", "west": "lied-center"},
	"text": "You are outside Eaton Hall. You should recognize here."
      },
      { "id": "snow-hall",
	"where": "SnowHall.jpg",
	"next": {"east": "strong-hall", "south": "ambler-recreation", "west": "eaton-hall"},
	"text": "You are outside Snow Hall. Math class? Waiting for the bus?"
      },
      { "id": "strong-hall",
	"where": "StrongHall.jpg",
	"next": {"east": "outside-fraser", "north": "memorial-stadium", "west": "snow-hall"},
	"what": ["coffee"],
	"text": "You are outside Strong Hall."
      },
      { "id": "ambler-recreation",
	"where": "AmblerRecreation.jpg",
	"next": {"west": "allen-fieldhouse", "north": "snow-hall"},
	"text": "It's the starting of the semester, and you feel motivated to be at the Gym. Let's see about that in 3 weeks."
      },
      { "id": "outside-fraser",
    "where": "OutsideFraserHall.jpg",
	"next": {"west": "strong-hall","north":"spencer-museum"},
	"what": ["basketball"],
	"text": "On your walk to the Kansas Union, you wish you had class outside."
      },
      { "id": "spencer-museum",
	"where": "SpencerMuseum.jpg",
	"next": {"south": "outside-fraser","west":"memorial-stadium"},
	"what": ["art"],
	"text": "You are at the Spencer Museum of Art."
      },
      { "id": "memorial-stadium",
	"where": "MemorialStadium.jpg",
	"next": {"south": "strong-hall","east":"spencer-museum"},
	"what": ["ku flag"],
	"text": "Half the crowd is wearing KU Basketball gear at the football game."
      },
      { "id": "allen-fieldhouse",
	"where": "AllenFieldhouse.jpg",
	"next": {"north": "eaton-hall","east": "ambler-recreation","west": "dole-institute"},
	"text": "Rock Chalk! You're at the field house."
      }
    ]*/
