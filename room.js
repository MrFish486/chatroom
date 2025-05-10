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
const ge = require("./garden.js");

var xc = c => {
	var ee;
	var soo;
	var see;
	cp.exec(c, (e, so, se) => {
		ee = e;
		soo = so;
		see = se;
	});
	return [ee, soo, see];
}
var poll = new polls.poll("Are cats or dogs better?", 28800000, ["Cats", "Dogs"]);
poll.promiseOver().then(() => {
	console.log(poll);
	poll.winners().forEach((v, i) => {
		console.log(points[v]);
	}); 
});
var messages = [["Panel 1 init at " + new Date().getTime()], ["Panel 2 init at " + new Date().getTime()]];
var banned = [];
var adminkeys = ["3133feb1-9de5-4b31-b7b3-766173ed0bb3"];
var users = {};
var points = {};
var online = {};
var water = 0.6;
var garden = new ge.garden(10, 10, 0);
setInterval(() => {
	garden.tick(water, 0.25);
	if (water - 0.05 > 0) {
		water -= 0.05;
	}
}, 100000);
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
			points[v] = parseInt(points[v]) + 1000;
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
		for(let i = 0; i < Object.keys(q.points).length; i ++){
			q[Object.keys(q.points)[i]] = parseInt(q[Object.keys(q.points)[i]]);
		}
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


app.post("/garden", (req, res) => {
	console.log("Garden watered");
	if (water + 0.05 <= 1) {
		water += 0.05;
	}
});
app.get("/garden", (req, res) => {
	res.render("garden", {garden : JSON.stringify(garden), water : water});
});
app.post("/ping", (req, res) => {
	online[req.query.i] = new Date() * 1;
	setTimeout(() => {
		if(((new Date() * 1) - online[req.query.i]) > 1000){
			delete online[req.query.i];
		}
	}, 2000);
});
app.get("/ping", (req, res) => {
	res.send(Object.keys(online).map(e=>users[e]||"Anonymous idhash."+hash(e)));
})
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
	let rewarding = ss.sorttogether(Object.values(points), Object.keys(points))[1].reverse()[parseInt(req.query.i)];
	if(rewarding == req.query.f){
		console.log("\033[1;33m" + `${users[req.query.f]} (${req.query.f}) tried to reward themself` + "\033[0m");
		res.redirect("/award");
	} else{
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
		try {
			let prev = fs.readFileSync(__dirname + "/../stat/incidents");
			fs.writeFileSync(__dirname + "/../stat/incidents", prev + `\nadmin request : "${req.body.script}" under key "${req.body.key}" (fail)`);
		} catch {}
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
				messages[req.body.panel] = [`[messages cleared by ${users[req.body.key] || "(anonymous) idhash." + hash(req.body.key)}]`];
				console.log(`requested message clear from ${users[req.body.key]} (${req.body.key})`);
			}
			else if(req.body.message.split(" ")[0] == "/b"){
				let n = req.body.message.split(" ");
				n.shift();
				messages[req.body.panel].push(`[${new Date().toLocaleString().split(" ")[1]}] ${users[req.body.key] || "(anonymous) idhash." + hash(req.body.key)} : ${'‮' + replaceProfanities(n.join(" "))}`)
				if(messages[req.body.panel].length >= 10){
					messages[req.body.panel].shift();
				}
				console.log(`requested post "${replaceProfanities(req.body.message)}" from ${req.body.key} (success)`);
			}
		} else {
			messages[req.body.panel].push(`[${new Date().toLocaleString().split(" ")[1]}] ${users[req.body.key] || "(anonymous) idhash." + hash(req.body.key)} : ${replaceProfanities(req.body.message)}`);
			if(messages[req.body.panel].length >= 10){
				messages[req.body.panel].shift();
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
