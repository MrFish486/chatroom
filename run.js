#!/usr/bin/nodejs

const port = 8000;

require("./room.js").app.listen(port, () => {
	console.log("App listening on port " + port + ".");
});
