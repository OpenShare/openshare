module.exports = countReduce;

function round(x, precision) {
	if (typeof x !== 'number') {
		throw new TypeError('Expected value to be a number');
	}

	var exponent = precision > 0 ? 'e' : 'e-';
	var exponentNeg = precision > 0 ? 'e-' : 'e';
	precision = Math.abs(precision);

	return Number(Math.round(x + exponent + precision) + exponentNeg + precision);
}

function thousandify (num) {
	return round(num/1000, 1) + 'K';
}

function millionify (num) {
	return round(num/1000000, 1) + 'M';
}

function countReduce (el, count, cb) {
	if (count > 999999)  {
		el.innerHTML = millionify(count);
	} else if (count > 999) {
		el.innerHTML = thousandify(count);
	} else {
		el.innerHTML = count;
	}

	if (cb) cb(el);
}
