sortindex = a => {
	for (let i = 0; i < a.length; i ++) {
		a[i] = [a[i], i];
	}
	a.sort((l, r) => {
		return l[0] < r[0] ? -1 : 1;
	});
	a.s = [];
	for (let j = 0; j < a.length; j ++) {
		a.s.push(a[j][1]);
		a[j] = a[j][0];
	}
	return a;
}

sorttogether = (e, a) => {
	let p = sortindex(JSON.parse(JSON.stringify(e)).map(e=>parseInt(e)));
	let aa = []
	for (let i = 0; i < p.s.length; i ++) {
		aa.push(a[p.s[i]]);
	}
	delete p.s;
	return [p, aa];
}

module.exports = {sortindex, sorttogether};
