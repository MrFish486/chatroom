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
const replaceProfanities = require("no-profanity").replaceProfanities;
const ss = require("./sorts.js");

var poll = new polls.poll("Are cats or dogs better?", 28800000, ["Cats", "Dogs"]);
poll.promiseOver().then(() => {
	poll.winners().forEach((v, i) => {
		points[v] += 1000;
	}); 
});
var messages = [[], []];
var banned = [];
var adminkeys = ["cd66451d-776d-4dd0-b4e1-5c8ddb0225ab"];
var users = {};
var points = {};
var update = () => {
	console.log("\033[1;31m" + "cued restart" + "\033[0m");
	messages[0].push("Restart cued");
	save();
	messages[0].push("Data saved");
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
	poll = new polls.poll(question, time, options);
	poll.promiseOver().then(() => {
		poll.winners().forEach((v, i) => {
			points[v] += 100;
		}); 
	});
}
var save = () => {
	try {
		fs.writeFileSync(__dirname + "/../stat/savedstate.json", JSON.stringify({users : users, points : points, banned : banned}));
	} catch (e) {
		return e;
	}
}
var load = () => {
	try {
		let q = JSON.parse(fs.readFileSync(__dirname + "/../stat/savedstate.json", "utf8"));
		users = q.users;
		points = q.points;
		banned = q.banned;
	} catch (e) {
		return e;
	}
}

try {
	load();
	console.log("Fetched data");
} catch (e) {
	console.log(`Corrupted data ${e}`);
}

app.use(bodyparser.json({limit : "10kb"}));
app.use(cors());
app.use(bodyparser.urlencoded({
	extended: true
}));
app.use(express.static(__dirname + "/public"));

app.set("view engine", "ejs");

app.get("/poll", (req, res) => {
	if(poll.over()){
		res.render("pollresults", {poll : poll});
		console.log("requested load poll, pollresults sent");
	} else {
		res.render("poll", {poll : poll});
		console.log("requested load poll");
	}
});
app.post("/poll", (req, res) => {
	poll.answer(req.query.f, req.query.a);
});
app.get("/leaderboard", (req, res) => {
	console.log("requested load leaderboard");
	res.render("leaderboard", {"users" : ss.sorttogether(Object.values(points), Object.values(users))[1].reverse(), "stats" : ss.sorttogether(Object.values(points), Object.values(users))[0].reverse()});
});
app.post("/award", (req, res) => {
	if(banned.includes(req.query.f)){
		return res.status(403).render("banned");
	}
	if(Object.keys(users).indexOf(req.query.f) == req.query.i){
		console.log("\033[1;33m" + `${users[req.query.f]} (${req.query.f}) tried to reward themself` + "\033[0m");
		res.redirect("/award");
	} else{
		let rewarding = ss.sorttogether(Object.values(points), Object.keys(points))[1].reverse()[parseInt(req.query.i)];
		points[rewarding] ++;
		console.log(`${users[req.query.f]} (${req.query.f}) rewarded ${users[rewarding]} (${rewarding}) 1 point`);
	}
});
app.post("/register", (req, res) => {
	if(req.body.un.length > 32) {
		res.status(413).send("Request too large. Try a name with less than 32 characters.")
	} else if(!Object.keys(users).includes(req.body.uuid)){
		users[req.body.uuid] = replaceProfanities(req.body.un);
		points[req.body.uuid] = 0;
		console.log(`registered ${req.body.uuid} as ${replaceProfanities(req.body.un)} (success)`);
		res.redirect("/");
	} else{
		res.send(`You are already registered under name "${users[req.body.uuid]}"!`);
		console.log("\033[1;33m" + `attempted rename ${users[req.body.uuid]} to ${req.body.un} (${req.body.uuid})` + "\033[0m");
	}
});
app.get("/register", (req, res) => {
	console.log("request load register");
	res.render("register");
});
app.post("/admin", (req, res) => {
	if(adminkeys.includes(req.body.key)){
		res.send(eval(req.body.script));
		console.log("\033[1;33m" + `admin request : "${req.body.script}" under key "${req.body.key}" (success)` + "\033[0m");
	} else{
		res.send("Incorrect admin key. This incident will be reported.");
		console.log("\033[1;31m" + `admin request : "${req.body.script}" under key "${req.body.key}" (fail)` + "\033[0m");
	}
});
app.get("/admin", (req, res) => {
	res.render("admin");
	console.log("request load admin");
});
app.post("/", (req, res) => {	
	if(banned.includes(req.body.key)){
		return res.status(403).render("banned");
	}
	if(/\S/.test(req.body.message) && req.body.message.length <= 256){
		if(/^\/.{1,}/.test(req.body.message)){
			if(req.body.message == "/clear"){
				messages[req.body.pannel] = [`[messages cleared by ${users[req.body.key] || "(anonymous) idhash." + hash(req.body.key)}]`];
				console.log(`requested message clear from ${users[req.body.key]} (${req.body.key})`);
			}
		} else {
			messages[req.body.pannel].push(`[${new Date().toLocaleString().split(" ")[1]}] ${users[req.body.key] || "(anonymous) idhash." + hash(req.body.key)} : ${replaceProfanities(req.body.message)}`);
			if(messages[req.body.pannel].length >= 10){
				messages[req.body.pannel].shift();
			}
			console.log(`requested post "${replaceProfanities(req.body.message)}" from ${req.body.key} (success)`);
		}
	} else {
		console.log("\033[1;33m" + `requested post "${replaceProfanities(req.body.message)}" from ${req.body.key} (fail)` + "\033[0m");
	}
	res.redirect("/");
});
app.get("/", (req, res) => {
	console.log(`requested load index`);
	res.render("index", {messages: messages});
});
app.get("/port", (req, res) => {
	if(banned.includes(req.socket.remoteAddress)){
		return res.status(403).render("banned");
	}
	res.json(messages);
});

app.listen(port, () => {
	console.log(`App active on ${port}.`);
});
