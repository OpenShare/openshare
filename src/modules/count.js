/**
 * Generate share count instance from one to many networks
 */

var CountTransforms = require('./count-transforms');
var Events = require('./events');

module.exports = class Count {

	constructor(type, url) {

		// throw error if no url provided
		if (!url) {
			throw new Error(`Open Share: no url provided for count`);
		}

		// check for Github counts
		if (type.indexOf('github') === 0) {
			if (type === 'github-stars') {
				type = 'githubStars';
			} else if (type === 'github-forks') {
				type = 'githubForks';
			} else if (type === 'github-watchers') {
				type = 'githubWatchers';
			} else {
				console.error('Invalid Github count type. Try github-stars, github-forks, or github-watchers.');
			}
		}

		// if type is comma separate list create array
		if (type.indexOf(',') > -1) {
			this.type = type;
			this.typeArr = this.type.split(',');
			this.countData = [];

			// check each type supplied is valid
			this.typeArr.forEach((t) => {
				if (!CountTransforms[t]) {
					throw new Error(`Open Share: ${type} is an invalid count type`);
				}

				this.countData.push(CountTransforms[t](url));
			});

		// throw error if invalid type provided
		} else if (!CountTransforms[type]) {
			throw new Error(`Open Share: ${type} is an invalid count type`);

		// single count
		// store count URL and transform function
		} else {
			this.type = type;
			this.countData = CountTransforms[type](url);
		}
	}

	// handle calling getCount / getCounts
	// depending on number of types
	count(os) {
		this.os = os;
    	this.url = this.os.getAttribute('data-open-share-count');
		this.shared = this.os.getAttribute('data-open-share-count-url');

		if (!Array.isArray(this.countData)) {
			this.getCount();
		} else {
			this.getCounts();
		}
	}

	// fetch count either AJAX or JSONP
	getCount() {
		var count = this.storeGet(this.type + '-' + this.shared);

		if (count) {
			countReduce(this.os, count);
		}


		this[this.countData.type](this.countData);
	}

	// fetch multiple counts and aggregate
	getCounts() {
		this.total = [];

		var count = this.storeGet(this.type + '-' + this.shared);

		if (count) {
			countReduce(this.os, count);
		}

		this.countData.forEach((countData) => {

			this[countData.type](countData, (num) => {
				this.total.push(num);

				// total counts length now equals type array length
				// so aggregate, store and insert into DOM
				if (this.total.length === this.typeArr.length) {
					let tot = 0;

					this.total.forEach((t) => {
						tot += t;
					});

					this.storeSet(this.type + '-' + this.shared, tot);
					countReduce(this.os, tot);
				}
			});
		});

		countReduce(this.os, this.total);
	}

	// handle JSONP requests
	jsonp(countData, cb) {
		// define random callback and assign transform function
		let callback = Math.random().toString(36).substring(7).replace(/[^a-zA-Z]/g, '');
		window[callback] = (data) => {
			let count = countData.transform.apply(this, [data]) || 0;

			if (cb && typeof cb === 'function') {
				cb(count);
			} else {
				countReduce(this.os, count);
			}

			Events.trigger(this.os, 'counted-' + this.url);
		};

		// append JSONP script tag to page
		let script = document.createElement('script');
		script.src = countData.url.replace('callback=?', `callback=${callback}`);
		document.getElementsByTagName('head')[0].appendChild(script);

		return;
	}

	// handle AJAX GET request
	get(countData, cb) {
		let xhr = new XMLHttpRequest();

		// on success pass response to transform function
		xhr.onreadystatechange = () => {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					let count = countData.transform.apply(this, [xhr, Events]) || 0;

					if (cb && typeof cb === 'function') {
						cb(count);
					} else {
						countReduce(this.os, count);
					}

					Events.trigger(this.os, 'counted-' + this.url);
				} else {
					console.error('Failed to get API data from', countData.url, '. Please use the latest version of OpenShare.');
				}
			}
		};

		xhr.open('GET', countData.url);
		xhr.send();
	}

	// handle AJAX POST request
	post(countData, cb) {
		let xhr = new XMLHttpRequest();

		// on success pass response to transform function
		xhr.onreadystatechange = () => {
			if (xhr.readyState !== XMLHttpRequest.DONE ||
				xhr.status !== 200) {
				return;
			}

			let count = countData.transform.apply(this, [xhr]) || 0;

			if (cb && typeof cb === 'function') {
				cb(count);
			} else {
				countReduce(this.os, count);
			}
			Events.trigger(this.os, 'counted-' + this.url);
		};

		xhr.open('POST', countData.url);
		xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
		xhr.send(JSON.stringify(countData.data));
	}

	storeSet(type, count = 0) {
		if (!window.localStorage || !type) {
			return;
		}

		localStorage.setItem(`OpenShare-${type}`, count);
	}

	storeGet(type) {
		if (!window.localStorage || !type) {
			return;
		}

		return localStorage.getItem(`OpenShare-${type}`);
	}

};

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

function countReduce (el, count) {
	if (count > 999999)  {
		el.innerHTML = millionify(count);
	} else if (count > 999) {
		el.innerHTML = thousandify(count);
	} else {
		el.innerHTML = count;
	}
}
