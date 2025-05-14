#!/usr/bin/nodejs
class garden {
	constructor (width, height, fill) {
		let world = [];
		for (let x = 0; x < width; x ++) {
			world.push([]);
			for (let y = 0; y < height; y ++) {
				world[x].push(fill);
			}
		}
		this.world = world;
		this.height = height;
		this.width = width;
	}
	tick (water, chance) {
		for (let x = 0; x < this.width; x ++) {
			for (let y = 0; y < this.height; y ++) {
				if (Math.random() < chance) {
					this.world[x][y] = water > 0.5 ? (Math.random() < 0.5 ? 1 : 2) : 0;
				}
			}
		}
	}
}

module.exports = {garden};
