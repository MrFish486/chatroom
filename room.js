#!/usr/bin/nodejs
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
	if(req.body.message != "" && req.body.message.length <= 1024){
		messages.push(`(${new Date().toLocaleString()}) ${req.socket.remoteAddress == "::1" ? "admin" : req.socket.remoteAddress}:${req.body.message}`);
		console.log(`requested post "${req.body.message}" (success)`);
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
