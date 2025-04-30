#!/usr/bin/nodejs
class poll {
	constructor (question, time, options) {
		this.question = question;
		this.time = time;
		this.options = options;
		this.start = new Date() * 1;
		this.results = {};
	}
	over () {
		return (this.start + time) >= new Date() * 1;
	}
	promiseOver () {
		return new Promise((res, rej) => {
			setInterval(() => {
				if (this.over()) {
					res();
				}
			}, 10);
		});
	}
	answer (id, ab) {
		if (! this.over() ) {
			this.results[id] = ab;
			return true;
		} else {
			return false;
		}
	}
	result () {
		if (Object.values(this.results).filter(a => a == "a") > Object.values(this.results).filter(a => a == "b") {
			return "a";
		} else if (Object.values(this.results).filter( a => a == "b") > Object.values(this.results).filter(a => a == "a")) {
			return "b";
		} else {
			return undefined;
		}
	}
}
