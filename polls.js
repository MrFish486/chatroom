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
		return (this.start + this.time) <= new Date() * 1;
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
		if (Object.values(this.results).filter(a => a == "a").length > Object.values(this.results).filter(a => a == "b").length) {
			return "a";
		} else if (Object.values(this.results).filter( a => a == "b").length > Object.values(this.results).filter(a => a == "a").length) {
			return "b";
		} else {
			return undefined;
		}
	}
	a () {
		return Object.values(this.results).filter(a => a == "a").length / Object.values(this.results).length;
	}
	b () {
		return Object.values(this.results).filter(a => a == "b").length / Object.values(this.results).length;
	}
	winners () {
		return Object.keys(this.results).filter(q => this.results[q] == this.result());
	}
}

module.exports = {poll}
