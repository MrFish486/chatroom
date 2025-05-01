#!/usr/bin/nodejs
console.log("===================\nNew process spawned\n===================");
const express = require("express");
const app = express();
const port = 8000;
const cors = require("cors");
const bodyparser = require("body-parser");
const polls = require("./polls.js");
const fs = require("fs");
const cp = require("child_process");

var poll = new polls.poll("Are cats or dogs better?", 86400000, ["Cats", "Dogs"]);
poll.promiseOver().then(() => {
	poll.winners().forEach((v, i) => {
		points[v] += 100;
	}); 
});
var messages = [[], []];
var banned = [];
var adminkeys = ["cd66451d-776d-4dd0-b4e1-5c8ddb0225ab"];
var users = {};
var points = {};
var update = () => {
	messages[0].push("Restart cued");
	console.log("cued restart");
	cp.exec("git pull");
	messages[0].push("Code pulled");
	cp.exec("npm i");
	messages[0].push("Aditional modules installed");
	setTimeout(() => {
		messages[0].push("Spawning process");
		cp.spawn(process.argv.shift(), process.argv, {
			cwd: process.cwd(),
			detached: true,
			stdio: "inherit"
		});
		messages[0].push("Exiting...");
		console.log("child process spawned, killing self");
		process.exit();
	}, 5000);
}
var hash = a => {
	var h = 0, i, chr;
	if(a.length == 0) return h;
	for(i = 0; i < a.length; i++){
		chr = a.charCodeAt(i);
		h = ((h << 5) - h) + chr;
		h |= 0;
	}
	return h;
}
var setPoll = (question, time, options) => {
	var poll = new polls.poll(question, time, options);
	poll.promiseOver().then(() => {
		poll.winners().forEach((v, i) => {
			points[v] += 100;
		}); 
	});
}
var save = () => {
	try {
		fs.writeFileSync(__dirname + "/../stat/savedstate.json", JSON.stringify({users : users, points : points}));
	} catch (e) {
		return e;
	}
}
var load = () => {
	try {
		let q = JSON.parse(fs.readFileSync(__dirname + "/../stat/savedstate.json", "utf8"));
		users = q.users;
		points = q.points;
	} catch (e) {
		return e;
	}
}

app.use(bodyparser.json());
app.use(cors());
app.use(bodyparser.urlencoded({
	extended: true
}));
app.use(express.static(__dirname + "/public"));

app.set("view engine", "ejs");

app.get("/poll", (req, res) => {
	if(poll.over()){
		res.render("pollresults", {poll : poll});
	} else {
		res.render("poll", {poll : poll});
	}
});
app.post("/poll", (req, res) => {
	console.log(req.query);
	poll.answer(req.query.f, req.query.a);
});
app.get("/leaderboard", (req, res) => {
	res.render("leaderboard", {"users" : Object.values(users), "stats" : Object.values(points)});
});
app.post("/award", (req, res) => {
	if(Object.keys(users).indexOf(req.query.f) == req.query.i){
		res.redirect("/award");
	} else{
		points[Object.keys(points)[parseInt(req.query.i)]] ++;
	}
});
app.post("/register", (req, res) => {
	if(!Object.keys(users).includes(req.body.uuid)){
		users[req.body.uuid] = req.body.un;
		points[req.body.uuid] = 0;
		res.redirect("/");
	} else{
		res.send(`The id "${req.body.uuid}" id already registered under name "${users[req.body.uuid]}"!`);
	}
});
app.get("/register", (req, res) => {
	res.render("register");
});
app.post("/admin", (req, res) => {
	if(adminkeys.includes(req.body.key)){
		res.send(eval(req.body.script));
	} else{
		res.send("Incorrect admin key.");
	}
});
app.get("/admin", (req, res) => {
	res.render("admin");
});
app.post("/", (req, res) => {
	if(banned.includes(req.body.key)){
		return res.status(403).render("banned");
	}
	if(/\S/.test(req.body.message) && req.body.message.length <= 1024){
		if(/^\/.{1,}/.test(req.body.message)){
			if(req.body.message == "/clear"){
				messages[req.body.pannel] = ["[messages cleared]"];
				console.log("requested message clear");
			}
		} else {
			messages[req.body.pannel].push(`[${new Date().toLocaleString().split(" ")[1]}] ${users[req.body.key] || "(anonymous) idhash." + hash(req.body.key)} : ${req.body.message}`);
			if(messages[req.body.pannel].length >= 10){
				messages[req.body.pannel].shift();
			}
			console.log(`requested post "${req.body.message}" (success)`);
		}
	} else {
		console.log(`requested post "${req.body.message}" (fail)`);
	}
	res.redirect("/");
});
app.get("/", (req, res) => {
	console.log(`requested load`);
	res.render("index", {messages: messages});
});
app.get("/port", (req, res) => {
	if(banned.includes(req.socket.remoteAddress)){
		return res.status(403).render("banned");
	}
	res.json(messages);
});

app.listen(port, () => {
	console.log(`App listening on port ${port}.`);
});
