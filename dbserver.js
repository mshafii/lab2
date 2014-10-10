var express = require('express');
var cookieParser = require('cookie-parser')
var mysql = require('mysql');
var app = express();
var who = [];

app.use(cookieParser());

console.log('Creating db connection');
/* Creating connection to mysql database */
var connection = mysql.createConnection({
	host     : 'mysql.eecs.ku.edu',
	user     : 'mshafii',
	password : 'Mr24shaf'
});

console.log('Connecting to db');
/* Connecting to db */
connection.connect(function(err) {
	if (err) {
		console.error('Error connecting to db: ' + err.stack);
		return;
	}
	console.log('Connected to db as id:' + connection.threadId);
});

/* Set a new cookie for the user's browser to a randomly generated id */
function setCookie(req, res, next){
	req.userid = req.cookies.userid;
	
	if (!req.userid) {
		while ( (!req.userid) || (who[req.userid]) ){
			req.userid = Math.round(Math.random()*1000000);
		}
		res.cookie("userid", req.userid);

		console.log("Adding default state info to new user.");
		who[req.userid] = {
			"location": "strong-hall",
			"inventory": ["laptop"]
		};
		req.who = who[req.userid];
		console.log('New User: ' + req.userid);
		console.log('New Location: ' + req.who.location);
		console.log('New Inventory: ' + req.who.inventory);
		
		/* Create new user in db */
		var queryString = 'INSERT INTO EECS_581_Lab4 (`ID`, `Inventory`, `Location`) VALUES (' + req.userid + ', ' + req.who.inventory + ', ' + req.who.location + ')';
		connection.query(queryString, function (err, rows, fields){
			if(err) throw err;
			console.log('New User added to db. User ID: ' + req.userid);
		});
		
	} else {
		/* If existing user, pull state info from db. */
		
		var locale_num = 0;
		var locale = "";
		var stuff = "";
		
		var selectString = 'SELECT * FROM `EECS_561_Lab4` WHERE `ID` = ' + req.userid;
		connection.query(selectString, function (err, rows, fields){
			if(err) throw err;
			for (var i in rows) {
				locale_num = rows[i].Location;
				stuff = rows[i].Inventory
			}
		});
		console.log('Locale_num: ' + locale_num);
		console.log('Stuff: ' + stuff);
		locale = campus[locale_num].id;
		console.log('Locale: ' + locale);
		
		req.who = who[req.userid];
		req.who.inventory = stuff;
		req.who.location = locale;
		req.who = who[req.userid];
		
		console.log('Returning User: ' + req.userid);
		console.log('User state: ' + req.who);
	}
}

//app.use(setCookie);

app.get('/', function(req, res){

	setCookie(req, res);
	//added terminal print statement to better understand what's going on
	console.log("Upon start of web app after visiting setCookie(), Who: ", req.who);
	
	res.status(200);
	res.sendFile(__dirname + "/index.html");
});

/*app.get('/init', function(req, res){
	var result = 0;
	var selectString = 'SELECT * FROM `EECS_561_Lab4` WHERE `ID` = ' + req.cookies.userid;
	connection.query(selectString, function (err, rows, fields){
		if(err) throw err;
		for (var i in rows) {
			result = rows[i].Location;
		}
		console.log("init: ", campus[result]);
	});
	res.set({'Content-Type': 'application/json'});
	res.status(200);
	res.send(campus[result]);
	return;
});*/

/*app.get('/:id/update', function(req, res){
	console.log("update test");
	var counter = 0;
	var i;
	while(counter < 10){
		if(campus[counter].id == req.params.id){
			i = counter;
			counter = 20;
		}
		else counter++;
	}
	console.log("update " + counter + " " + req.params.id);
	var updateString2 = 'UPDATE EECS_561_Lab4 SET `Location`= ' + i + ' WHERE `ID` =' + req.cookies.userid;
	connection.query(updateString2, function (err, rows, fields){
		if(err) throw err;
		console.log("Update to user with location " + i);
	});
	res.set({'Content-Type': 'application/json'});
	res.status(200);
	res.send("success");
	return;
});*/

app.get('/:id', function(req, res){
	/*if (req.params.id == "init") {
		console.log("init test");

		var result;
		var selectString = 'SELECT * FROM `EECS_561_Lab4` WHERE `ID` = ' + req.cookies.userid;
		connection.query(selectString, function (err, rows, fields){
			if(err) throw err;
			for (var i in rows) {
				result = rows[i].Location;
			}
			console.log("init: ", campus[result]);
			res.set({'Content-Type': 'application/json'});
			res.status(200);
			res.send(campus[result]);
			return;
		});
	}
	else */if (req.params.id == "inventory") {
	    res.set({'Content-Type': 'application/json'});
	    res.status(200);
	    res.send(req.who.inventory);
	    console.log("inventory requested");
	    return;
	} else if (req.params.id == "who") {
		res.set({'Content-Type': 'application/json'});
		res.status(200);
		res.send(who);
		console.log("who requested");
		return;
	} else {
		for (var i in campus) {
			console.log(req.params.id);
			if (req.params.id == campus[i].id) {
				//var updateString = 'UPDATE EECS_561_Lab4 SET `Location`= ' + i + ' WHERE `ID` =' + req.cookies.userid;
				//console.log("user updated #2 with location " + i);
				//connection.query(updateString, function (err, rows, fields){
				//	if(err) throw err;
				//});
				res.set({'Content-Type': 'application/json'});
				res.status(200);
				res.send(campus[i]);
				return;
			}
		}
		res.status(404);
		res.send("not found, sorry");
	}
});

app.get('/images/:name', function(req, res){
	res.status(200);
	res.sendFile(__dirname + "/" + req.params.name);
	console.log("image requested");
});

app.delete('/:id/:item', function(req, res){
	console.log("item deleted");
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
		        res.send(req.who.inventory); // respond with specific user's inventory
				
				campus[i].what.splice(ix, 1); // room no longer has this

				console.log("Who: ", req.who);

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
	console.log("item requested");
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
				} else {
					app.post('/', function(req, res){
						req.session.userName = req.body.userName;
						res.redirect('/');
					});
					res.status(404);
					res.send("you do not have this");
				}
				
				console.log("Who: ", req.who);
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
	if (room.nid == 'allen-fieldhouse' && item == "basketball") {
		room.text	+= " Someone found the ball so there is a game going on!"
		return;
	}
	if (room.what == undefined) {
		room.what = [];
	}
	room.what.push(item);
}

var campus =
    [ { "id": "lied-center",
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
    ]
