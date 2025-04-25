#!/usr/bin/nodejs
const express = require("express");
const app = express();
const port = 8000;
const cors = require("cors");
const bodyparser = require("body-parser");

var messages = [];

app.use(bodyparser.json());
app.use(cors());
app.use(bodyparser.urlencoded({
	extended: true
}));

app.set("view engine", "ejs");

app.post("/", (req, res) => {
	if(messages.length > 10){
		messages.shift();
	}
	if(req.body.message != ""){
		messages.push(req.body.message);
	}
	console.log(messages);
	res.redirect("/");
});
app.get("/", (req, res) => {
	res.render("index", {messages: messages});
});
app.get("/stlye.css", (req, res) => {
	res.set("Content-Type", "text/css");
	res.sendFile("style.css");
});

app.listen(port, () => {
	console.log(`App listening on port ${port}.`);
});
