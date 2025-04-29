#!/usr/bin/nodejs
console.log("===================\nNew process spawned\n===================");
const express = require("express");
const app = express();
const port = 8000;
const cors = require("cors");
const bodyparser = require("body-parser");

var messages = [];
var banned = [];
var adminkeys = ["cd66451d-776d-4dd0-b4e1-5c8ddb0225ab"];
var users = {};
var update = () => {
	messages.push("Restarting in 5 seconds, pulling code...");
	console.log("cued restart");
	require("child_process").exec("git pull");
	require("child_process").exec("npm i");
	setTimeout(() => {
		require("child_process").spawn(process.argv.shift(), process.argv, {
			cwd: process.cwd(),
			detached: true,
			stdio: "inherit"
		});
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

app.use(bodyparser.json());
app.use(cors());
app.use(bodyparser.urlencoded({
	extended: true
}));
app.use(express.static(__dirname + "/public"));


app.set("view engine", "ejs");

app.post("/register", (req, res) => {
	if(banned.includes(req.body.uuid)){
		res.status(403).render("banned");
	}
	users[req.body.uuid] = req.body.un;
	res.redirect("/");
});
app.get("/register", (req, res) => {
	if(banned.includes(req.body.key)){
		res.status(403).render("banned");
	}
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
	if(messages.length >= 10){
		messages.shift();
	}
	if(/\S/.test(req.body.message) && req.body.message.length <= 1024){
		if(/^\/.{1,}/.test(req.body.message)){
			if(req.body.message == "/clear"){
				messages = ["[messages cleared]"];
				console.log("requested message clear");
			}
		} else {
			messages.push(`[${new Date().toLocaleString().split(" ")[1]}] ${users[req.body.key] || "(anonymous) idhash." + hash(req.body.key)} : ${req.body.message}`);
			console.log(`requested post "${req.body.message}" (success)`);
		}
	} else {
		console.log(`requested post "${req.body.message}" (fail)`);
	}
	res.redirect("/");
});
app.get("/", (req, res) => {
	if(banned.includes(req.body.key)){
		return res.status(403).render("banned");
	}
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
