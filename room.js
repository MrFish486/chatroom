#!/usr/bin/nodejs
console.log("===================\nNew process spawned\n===================");
const express = require("express");
const app = express();
const port = 8000;
const cors = require("cors");
const bodyparser = require("body-parser");

var messages = [];
var banned = [];

app.use(bodyparser.json());
app.use(cors());
app.use(bodyparser.urlencoded({
	extended: true
}));

app.set("view engine", "ejs");

app.post("/", (req, res) => {
	if(banned.includes(req.socket.remoteAddress)){
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
			} else if(req.body.message == "/update"){
				messages.push("Restarting in 5 seconds, pulling code...");
				console.log("cued restart");
				require("child_process").exec("git pull");
				require("child_process").exec("npm install");
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
		} else {
			messages.push(`[${new Date().toLocaleString()}] ${req.body.key} : ${req.body.message}`);
			console.log(`requested post "${req.body.message}" (success)`);
		}
	} else {
		console.log(`requested post "${req.body.message}" (fail)`);
	}
	res.redirect("/");
});
app.get("/", (req, res) => {
	if(banned.includes(req.socket.remoteAddress)){
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
