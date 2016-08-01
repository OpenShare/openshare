(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

module.exports = function (type, cb) {
	var count = 10;

	// document.addEventListener('DOMContentLoaded', function () {

	var isGA = type === 'event' || type === 'social';
	var isTagManager = type === 'tagManager';

	if (isGA) checkIfAnalyticsLoaded(type, cb, count);
	if (isTagManager) setTagManager(cb);
	// });
};

function checkIfAnalyticsLoaded(type, cb, count) {
	count--;
	if (window.ga) {
		if (cb) cb();
		// bind to shared event on each individual node
		listen(function (e) {
			var platform = e.target.getAttribute('data-open-share');
			var target = e.target.getAttribute('data-open-share-link') || e.target.getAttribute('data-open-share-url') || e.target.getAttribute('data-open-share-username') || e.target.getAttribute('data-open-share-center') || e.target.getAttribute('data-open-share-search') || e.target.getAttribute('data-open-share-body');

			if (type === 'event') {
				ga('send', 'event', {
					eventCategory: 'OpenShare Click',
					eventAction: platform,
					eventLabel: target,
					transport: 'beacon'
				});
			}

			if (type === 'social') {
				ga('send', {
					hitType: 'social',
					socialNetwork: platform,
					socialAction: 'share',
					socialTarget: target
				});
			}
		});
	} else {
		if (count) {
			setTimeout(function () {
				checkIfAnalyticsLoaded(type, cb, count);
			}, 1000);
		}
	}
}

function setTagManager(cb) {
	if (cb) cb();

	window.dataLayer = window.dataLayer || [];

	listen(onShareTagManger);

	getCounts(function (e) {
		var count = e.target ? e.target.innerHTML : e.innerHTML;

		var platform = e.target ? e.target.getAttribute('data-open-share-count-url') : e.getAttribute('data-open-share-count-url');

		window.dataLayer.push({
			'event': 'OpenShare Count',
			'platform': platform,
			'resource': count,
			'activity': 'count'
		});
	});
}

function listen(cb) {
	// bind to shared event on each individual node
	[].forEach.call(document.querySelectorAll('[data-open-share]'), function (node) {
		node.addEventListener('OpenShare.shared', cb);
	});
}

function getCounts(cb) {
	var countNode = document.querySelectorAll('[data-open-share-count]');

	[].forEach.call(countNode, function (node) {
		if (node.textContent) cb(node);else node.addEventListener('OpenShare.counted-' + node.getAttribute('data-open-share-count-url'), cb);
	});
}

function onShareTagManger(e) {
	var platform = e.target.getAttribute('data-open-share');
	var target = e.target.getAttribute('data-open-share-link') || e.target.getAttribute('data-open-share-url') || e.target.getAttribute('data-open-share-username') || e.target.getAttribute('data-open-share-center') || e.target.getAttribute('data-open-share-search') || e.target.getAttribute('data-open-share-body');

	window.dataLayer.push({
		'event': 'OpenShare Share',
		'platform': platform,
		'resource': target,
		'activity': 'share'
	});
}

},{}],2:[function(require,module,exports){
'use strict';

module.exports = function () {
	document.addEventListener('DOMContentLoaded', require('./lib/init')({
		api: 'count',
		selector: '[data-open-share-count]:not([data-open-share-node])',
		cb: require('./lib/initializeCountNode')
	}));

	return require('./src/modules/count-api')();
}();

},{"./lib/init":5,"./lib/initializeCountNode":6,"./src/modules/count-api":14}],3:[function(require,module,exports){
'use strict';

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

function thousandify(num) {
	return round(num / 1000, 1) + 'K';
}

function millionify(num) {
	return round(num / 1000000, 1) + 'M';
}

function countReduce(el, count, cb) {
	if (count > 999999) {
		el.innerHTML = millionify(count);
		if (cb && typeof cb === 'function') cb(el);
	} else if (count > 999) {
		el.innerHTML = thousandify(count);
		if (cb && typeof cb === 'function') cb(el);
	} else {
		el.innerHTML = count;
		if (cb && typeof cb === 'function') cb(el);
	}
}

},{}],4:[function(require,module,exports){
"use strict";

// type contains a dash
// transform to camelcase for function reference
// TODO: only supports single dash, should should support multiple
module.exports = function (dash, type) {
	var nextChar = type.substr(dash + 1, 1),
	    group = type.substr(dash, 2);

	type = type.replace(group, nextChar.toUpperCase());
	return type;
};

},{}],5:[function(require,module,exports){
'use strict';

var initializeNodes = require('./initializeNodes');
var initializeWatcher = require('./initializeWatcher');

module.exports = init;

function init(opts) {
	return function () {
		var initNodes = initializeNodes({
			api: opts.api || null,
			container: opts.container || document,
			selector: opts.selector,
			cb: opts.cb
		});

		initNodes();

		// check for mutation observers before using, IE11 only
		if (window.MutationObserver !== undefined) {
			initializeWatcher(document.querySelectorAll('[data-open-share-watch]'), initNodes);
		}
	};
}

},{"./initializeNodes":7,"./initializeWatcher":9}],6:[function(require,module,exports){
'use strict';

var Count = require('../src/modules/count');

module.exports = initializeCountNode;

function initializeCountNode(os) {
	// initialize open share object with type attribute
	var type = os.getAttribute('data-open-share-count'),
	    url = os.getAttribute('data-open-share-count-repo') || os.getAttribute('data-open-share-count-shot') || os.getAttribute('data-open-share-count-url'),
	    count = new Count(type, url);

	count.count(os);
	os.setAttribute('data-open-share-node', type);
}

},{"../src/modules/count":16}],7:[function(require,module,exports){
'use strict';

var Events = require('../src/modules/events');
var analytics = require('../analytics');

module.exports = initializeNodes;

function initializeNodes(opts) {
	// loop through open share node collection
	return function () {
		// check for analytics
		checkAnalytics();

		if (opts.api) {
			var nodes = opts.container.querySelectorAll(opts.selector);
			[].forEach.call(nodes, opts.cb);

			// trigger completed event
			Events.trigger(document, opts.api + '-loaded');
		} else {
			// loop through open share node collection
			var shareNodes = opts.container.querySelectorAll(opts.selector.share);
			[].forEach.call(shareNodes, opts.cb.share);

			// trigger completed event
			Events.trigger(document, 'share-loaded');

			// loop through count node collection
			var countNodes = opts.container.querySelectorAll(opts.selector.count);
			[].forEach.call(countNodes, opts.cb.count);

			// trigger completed event
			Events.trigger(document, 'count-loaded');
		}
	};
}

function checkAnalytics() {
	// check for analytics
	if (document.querySelector('[data-open-share-analytics]')) {
		var provider = document.querySelector('[data-open-share-analytics]').getAttribute('data-open-share-analytics');

		if (provider.indexOf(',') > -1) {
			var providers = provider.split(',');
			providers.forEach(function (p) {
				return analytics(p);
			});
		} else analytics(provider);
	}
}

},{"../analytics":1,"../src/modules/events":17}],8:[function(require,module,exports){
'use strict';

var ShareTransforms = require('../src/modules/share-transforms');
var OpenShare = require('../src/modules/open-share');
var setData = require('./setData');
var share = require('./share');
var dashToCamel = require('./dashToCamel');

module.exports = initializeShareNode;

function initializeShareNode(os) {
	// initialize open share object with type attribute
	var type = os.getAttribute('data-open-share'),
	    dash = type.indexOf('-'),
	    openShare = void 0;

	if (dash > -1) {
		type = dashToCamel(dash, type);
	}

	var transform = ShareTransforms[type];

	if (!transform) {
		throw new Error('Open Share: ' + type + ' is an invalid type');
	}

	openShare = new OpenShare(type, transform);

	// specify if this is a dynamic instance
	if (os.getAttribute('data-open-share-dynamic')) {
		openShare.dynamic = true;
	}

	// specify if this is a popup instance
	if (os.getAttribute('data-open-share-popup')) {
		openShare.popup = true;
	}

	// set all optional attributes on open share instance
	setData(openShare, os);

	// open share dialog on click
	os.addEventListener('click', function (e) {
		share(e, os, openShare);
	});

	os.addEventListener('OpenShare.trigger', function (e) {
		share(e, os, openShare);
	});

	os.setAttribute('data-open-share-node', type);
}

},{"../src/modules/open-share":18,"../src/modules/share-transforms":20,"./dashToCamel":4,"./setData":10,"./share":11}],9:[function(require,module,exports){
"use strict";

module.exports = initializeWatcher;

function initializeWatcher(watcher, fn) {
	[].forEach.call(watcher, function (w) {
		var observer = new MutationObserver(function (mutations) {
			// target will match between all mutations so just use first
			fn(mutations[0].target);
		});

		observer.observe(w, {
			childList: true
		});
	});
}

},{}],10:[function(require,module,exports){
'use strict';

module.exports = setData;

function setData(osInstance, osElement) {
	osInstance.setData({
		url: osElement.getAttribute('data-open-share-url'),
		text: osElement.getAttribute('data-open-share-text'),
		via: osElement.getAttribute('data-open-share-via'),
		hashtags: osElement.getAttribute('data-open-share-hashtags'),
		tweetId: osElement.getAttribute('data-open-share-tweet-id'),
		related: osElement.getAttribute('data-open-share-related'),
		screenName: osElement.getAttribute('data-open-share-screen-name'),
		userId: osElement.getAttribute('data-open-share-user-id'),
		link: osElement.getAttribute('data-open-share-link'),
		picture: osElement.getAttribute('data-open-share-picture'),
		caption: osElement.getAttribute('data-open-share-caption'),
		description: osElement.getAttribute('data-open-share-description'),
		user: osElement.getAttribute('data-open-share-user'),
		video: osElement.getAttribute('data-open-share-video'),
		username: osElement.getAttribute('data-open-share-username'),
		title: osElement.getAttribute('data-open-share-title'),
		media: osElement.getAttribute('data-open-share-media'),
		to: osElement.getAttribute('data-open-share-to'),
		subject: osElement.getAttribute('data-open-share-subject'),
		body: osElement.getAttribute('data-open-share-body'),
		ios: osElement.getAttribute('data-open-share-ios'),
		type: osElement.getAttribute('data-open-share-type'),
		center: osElement.getAttribute('data-open-share-center'),
		views: osElement.getAttribute('data-open-share-views'),
		zoom: osElement.getAttribute('data-open-share-zoom'),
		search: osElement.getAttribute('data-open-share-search'),
		saddr: osElement.getAttribute('data-open-share-saddr'),
		daddr: osElement.getAttribute('data-open-share-daddr'),
		directionsmode: osElement.getAttribute('data-open-share-directions-mode'),
		repo: osElement.getAttribute('data-open-share-repo'),
		shot: osElement.getAttribute('data-open-share-shot'),
		pen: osElement.getAttribute('data-open-share-pen'),
		view: osElement.getAttribute('data-open-share-view'),
		issue: osElement.getAttribute('data-open-share-issue'),
		buttonId: osElement.getAttribute('data-open-share-buttonId'),
		popUp: osElement.getAttribute('data-open-share-popup')
	});
}

},{}],11:[function(require,module,exports){
'use strict';

var Events = require('../src/modules/events');
var setData = require('./setData');

module.exports = share;

function share(e, os, openShare) {
	// if dynamic instance then fetch attributes again in case of updates
	if (openShare.dynamic) {
		setData(openShare, os);
	}

	openShare.share(e);

	// trigger shared event
	Events.trigger(os, 'shared');
}

},{"../src/modules/events":17,"./setData":10}],12:[function(require,module,exports){
'use strict';

/*
   Sometimes social platforms get confused and drop share counts.
   In this module we check if the returned count is less than the count in
   localstorage.
   If the local count is greater than the returned count,
   we store the local count + the returned count.
   Otherwise, store the returned count.
*/

module.exports = function (t, count) {
	var isArr = t.type.indexOf(',') > -1;
	var local = Number(t.storeGet(t.type + '-' + t.shared));

	if (local > count && !isArr) {
		var latestCount = Number(t.storeGet(t.type + '-' + t.shared + '-latestCount'));
		t.storeSet(t.type + '-' + t.shared + '-latestCount', count);

		count = isNumeric(latestCount) && latestCount > 0 ? count += local - latestCount : count += local;
	}

	if (!isArr) t.storeSet(t.type + '-' + t.shared, count);
	return count;
};

function isNumeric(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

},{}],13:[function(require,module,exports){
'use strict';

module.exports = function () {
	document.addEventListener('DOMContentLoaded', require('./lib/init')({
		api: 'share',
		selector: '[data-open-share]:not([data-open-share-node])',
		cb: require('./lib/initializeShareNode')
	}));

	return require('./src/modules/share-api')();
}();

},{"./lib/init":5,"./lib/initializeShareNode":8,"./src/modules/share-api":19}],14:[function(require,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * count API
 */

var count = require('./count');

module.exports = function () {

	// global OpenShare referencing internal class for instance generation
	var Count = function Count(_ref, cb) {
		var type = _ref.type;
		var url = _ref.url;
		var _ref$appendTo = _ref.appendTo;
		var appendTo = _ref$appendTo === undefined ? false : _ref$appendTo;
		var element = _ref.element;
		var classes = _ref.classes;

		_classCallCheck(this, Count);

		var countNode = document.createElement(element || 'span');

		countNode.setAttribute('data-open-share-count', type);
		countNode.setAttribute('data-open-share-count-url', url);

		countNode.classList.add('open-share-count');

		if (classes && Array.isArray(classes)) {
			classes.forEach(function (cssCLass) {
				countNode.classList.add(cssCLass);
			});
		}

		if (appendTo) {
			return new count(type, url).count(countNode, cb, appendTo);
		}

		return new count(type, url).count(countNode, cb);
	};

	return Count;
};

},{"./count":16}],15:[function(require,module,exports){
'use strict';

var countReduce = require('../../lib/countReduce');
var storeCount = require('../../lib/storeCount');

/**
 * Object of transform functions for each openshare api
 * Transform functions passed into OpenShare instance when instantiated
 * Return object containing URL and key/value args
 */
module.exports = {

	// facebook count data
	facebook: function facebook(url) {
		return {
			type: 'get',
			url: 'https://graph.facebook.com/?id=' + url,
			transform: function transform(xhr) {
				var count = JSON.parse(xhr.responseText).shares;
				return storeCount(this, count);
			}
		};
	},


	// pinterest count data
	pinterest: function pinterest(url) {
		return {
			type: 'jsonp',
			url: 'https://api.pinterest.com/v1/urls/count.json?callback=?&url=' + url,
			transform: function transform(data) {
				var count = data.count;
				return storeCount(this, count);
			}
		};
	},


	// linkedin count data
	linkedin: function linkedin(url) {
		return {
			type: 'jsonp',
			url: 'https://www.linkedin.com/countserv/count/share?url=' + url + '&format=jsonp&callback=?',
			transform: function transform(data) {
				var count = data.count;
				return storeCount(this, count);
			}
		};
	},


	// reddit count data
	reddit: function reddit(url) {
		return {
			type: 'get',
			url: 'https://www.reddit.com/api/info.json?url=' + url,
			transform: function transform(xhr) {
				var posts = JSON.parse(xhr.responseText).data.children,
				    ups = 0;

				posts.forEach(function (post) {
					ups += Number(post.data.ups);
				});

				return storeCount(this, ups);
			}
		};
	},


	// google count data
	google: function google(url) {
		return {
			type: 'post',
			data: {
				method: 'pos.plusones.get',
				id: 'p',
				params: {
					nolog: true,
					id: url,
					source: 'widget',
					userId: '@viewer',
					groupId: '@self'
				},
				jsonrpc: '2.0',
				key: 'p',
				apiVersion: 'v1'
			},
			url: 'https://clients6.google.com/rpc',
			transform: function transform(xhr) {
				var count = JSON.parse(xhr.responseText).result.metadata.globalCounts.count;
				return storeCount(this, count);
			}
		};
	},


	// github star count
	githubStars: function githubStars(repo) {
		repo = repo.indexOf('github.com/') > -1 ? repo.split('github.com/')[1] : repo;
		return {
			type: 'get',
			url: 'https://api.github.com/repos/' + repo,
			transform: function transform(xhr) {
				var count = JSON.parse(xhr.responseText).stargazers_count;
				return storeCount(this, count);
			}
		};
	},


	// github forks count
	githubForks: function githubForks(repo) {
		repo = repo.indexOf('github.com/') > -1 ? repo.split('github.com/')[1] : repo;
		return {
			type: 'get',
			url: 'https://api.github.com/repos/' + repo,
			transform: function transform(xhr) {
				var count = JSON.parse(xhr.responseText).forks_count;
				return storeCount(this, count);
			}
		};
	},


	// github watchers count
	githubWatchers: function githubWatchers(repo) {
		repo = repo.indexOf('github.com/') > -1 ? repo.split('github.com/')[1] : repo;
		return {
			type: 'get',
			url: 'https://api.github.com/repos/' + repo,
			transform: function transform(xhr) {
				var count = JSON.parse(xhr.responseText).watchers_count;
				return storeCount(this, count);
			}
		};
	},


	// dribbble likes count
	dribbble: function dribbble(shot) {
		shot = shot.indexOf('dribbble.com/shots') > -1 ? shot.split('shots/')[1] : shot;
		var url = 'https://api.dribbble.com/v1/shots/' + shot + '/likes';
		return {
			type: 'get',
			url: url,
			transform: function transform(xhr, Events) {
				var _this = this;

				var count = JSON.parse(xhr.responseText).length;

				// at this time dribbble limits a response of 12 likes per page
				if (count === 12) {
					var page = 2;
					recursiveCount(url, page, count, function (finalCount) {
						if (_this.appendTo && typeof _this.appendTo !== 'function') {
							_this.appendTo.appendChild(_this.os);
						}
						countReduce(_this.os, finalCount, _this.cb);
						Events.trigger(_this.os, 'counted-' + _this.url);
						return storeCount(_this, finalCount);
					});
				} else {
					return storeCount(this, count);
				}
			}
		};
	},
	twitter: function twitter(url) {
		return {
			type: 'get',
			url: 'https://api.openshare.social/job?url=' + url,
			transform: function transform(xhr) {
				var count = JSON.parse(xhr.responseText).count;
				return storeCount(this, count);
			}
		};
	}
};

function recursiveCount(url, page, count, cb) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url + '?page=' + page);
	xhr.addEventListener('load', function () {
		var likes = JSON.parse(this.response);
		count += likes.length;

		// dribbble like per page is 12
		if (likes.length === 12) {
			page++;
			recursiveCount(url, page, count, cb);
		} else {
			cb(count);
		}
	});
	xhr.send();
}

},{"../../lib/countReduce":3,"../../lib/storeCount":12}],16:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Generate share count instance from one to many networks
 */

var CountTransforms = require('./count-transforms');
var Events = require('./events');
var countReduce = require('../../lib/countReduce');
var storeCount = require('../../lib/storeCount');

module.exports = function () {
	function Count(type, url) {
		var _this = this;

		_classCallCheck(this, Count);

		// throw error if no url provided
		if (!url) {
			throw new Error('Open Share: no url provided for count');
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
			this.typeArr.forEach(function (t) {
				if (!CountTransforms[t]) {
					throw new Error('Open Share: ' + type + ' is an invalid count type');
				}

				_this.countData.push(CountTransforms[t](url));
			});

			// throw error if invalid type provided
		} else if (!CountTransforms[type]) {
			throw new Error('Open Share: ' + type + ' is an invalid count type');

			// single count
			// store count URL and transform function
		} else {
			this.type = type;
			this.countData = CountTransforms[type](url);
		}
	}

	// handle calling getCount / getCounts
	// depending on number of types


	_createClass(Count, [{
		key: 'count',
		value: function count(os, cb, appendTo) {
			this.os = os;
			this.appendTo = appendTo;
			this.cb = cb;
			this.url = this.os.getAttribute('data-open-share-count');
			this.shared = this.os.getAttribute('data-open-share-count-url');

			if (!Array.isArray(this.countData)) {
				this.getCount();
			} else {
				this.getCounts();
			}
		}

		// fetch count either AJAX or JSONP

	}, {
		key: 'getCount',
		value: function getCount() {
			var count = this.storeGet(this.type + '-' + this.shared);

			if (count) {
				if (this.appendTo && typeof this.appendTo !== 'function') {
					this.appendTo.appendChild(this.os);
				}
				countReduce(this.os, count);
			}
			this[this.countData.type](this.countData);
		}

		// fetch multiple counts and aggregate

	}, {
		key: 'getCounts',
		value: function getCounts() {
			var _this2 = this;

			this.total = [];

			var count = this.storeGet(this.type + '-' + this.shared);

			if (count) {
				if (this.appendTo && typeof this.appendTo !== 'function') {
					this.appendTo.appendChild(this.os);
				}
				countReduce(this.os, count);
			}

			this.countData.forEach(function (countData) {

				_this2[countData.type](countData, function (num) {
					_this2.total.push(num);

					// total counts length now equals type array length
					// so aggregate, store and insert into DOM
					if (_this2.total.length === _this2.typeArr.length) {
						var tot = 0;

						_this2.total.forEach(function (t) {
							tot += t;
						});

						if (_this2.appendTo && typeof _this2.appendTo !== 'function') {
							_this2.appendTo.appendChild(_this2.os);
						}

						var local = Number(_this2.storeGet(_this2.type + '-' + _this2.shared));
						if (local > tot) {
							var latestCount = Number(_this2.storeGet(_this2.type + '-' + _this2.shared + '-latestCount'));
							_this2.storeSet(_this2.type + '-' + _this2.shared + '-latestCount', tot);

							tot = isNumeric(latestCount) && latestCount > 0 ? tot += local - latestCount : tot += local;
						}
						_this2.storeSet(_this2.type + '-' + _this2.shared, tot);

						countReduce(_this2.os, tot);
					}
				});
			});

			if (this.appendTo && typeof this.appendTo !== 'function') {
				this.appendTo.appendChild(this.os);
			}
		}

		// handle JSONP requests

	}, {
		key: 'jsonp',
		value: function jsonp(countData, cb) {
			var _this3 = this;

			// define random callback and assign transform function
			var callback = Math.random().toString(36).substring(7).replace(/[^a-zA-Z]/g, '');
			window[callback] = function (data) {
				var count = countData.transform.apply(_this3, [data]) || 0;

				if (cb && typeof cb === 'function') {
					cb(count);
				} else {
					if (_this3.appendTo && typeof _this3.appendTo !== 'function') {
						_this3.appendTo.appendChild(_this3.os);
					}
					countReduce(_this3.os, count, _this3.cb);
				}

				Events.trigger(_this3.os, 'counted-' + _this3.url);
			};

			// append JSONP script tag to page
			var script = document.createElement('script');
			script.src = countData.url.replace('callback=?', 'callback=' + callback);
			document.getElementsByTagName('head')[0].appendChild(script);

			return;
		}

		// handle AJAX GET request

	}, {
		key: 'get',
		value: function get(countData, cb) {
			var _this4 = this;

			var xhr = new XMLHttpRequest();

			// on success pass response to transform function
			xhr.onreadystatechange = function () {
				if (xhr.readyState === 4) {
					if (xhr.status === 200) {
						var count = countData.transform.apply(_this4, [xhr, Events]) || 0;

						if (cb && typeof cb === 'function') {
							cb(count);
						} else {
							if (_this4.appendTo && typeof _this4.appendTo !== 'function') {
								_this4.appendTo.appendChild(_this4.os);
							}
							countReduce(_this4.os, count, _this4.cb);
						}

						Events.trigger(_this4.os, 'counted-' + _this4.url);
					} else {
						console.error('Failed to get API data from', countData.url, '. Please use the latest version of OpenShare.');
					}
				}
			};

			xhr.open('GET', countData.url);
			xhr.send();
		}

		// handle AJAX POST request

	}, {
		key: 'post',
		value: function post(countData, cb) {
			var _this5 = this;

			var xhr = new XMLHttpRequest();

			// on success pass response to transform function
			xhr.onreadystatechange = function () {
				if (xhr.readyState !== XMLHttpRequest.DONE || xhr.status !== 200) {
					return;
				}

				var count = countData.transform.apply(_this5, [xhr]) || 0;

				if (cb && typeof cb === 'function') {
					cb(count);
				} else {
					if (_this5.appendTo && typeof _this5.appendTo !== 'function') {
						_this5.appendTo.appendChild(_this5.os);
					}
					countReduce(_this5.os, count, _this5.cb);
				}
				Events.trigger(_this5.os, 'counted-' + _this5.url);
			};

			xhr.open('POST', countData.url);
			xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
			xhr.send(JSON.stringify(countData.data));
		}
	}, {
		key: 'storeSet',
		value: function storeSet(type) {
			var count = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

			if (!window.localStorage || !type) {
				return;
			}

			localStorage.setItem('OpenShare-' + type, count);
		}
	}, {
		key: 'storeGet',
		value: function storeGet(type) {
			if (!window.localStorage || !type) {
				return;
			}

			return localStorage.getItem('OpenShare-' + type);
		}
	}]);

	return Count;
}();

function isNumeric(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

},{"../../lib/countReduce":3,"../../lib/storeCount":12,"./count-transforms":15,"./events":17}],17:[function(require,module,exports){
'use strict';

/**
 * Trigger custom OpenShare namespaced event
 */
module.exports = {
	trigger: function trigger(element, event) {
		var ev = document.createEvent('Event');
		ev.initEvent('OpenShare.' + event, true, true);
		element.dispatchEvent(ev);
	}
};

},{}],18:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * OpenShare generates a single share link
 */
module.exports = function () {
	function OpenShare(type, transform) {
		_classCallCheck(this, OpenShare);

		this.ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
		this.type = type;
		this.dynamic = false;
		this.transform = transform;

		// capitalized type
		this.typeCaps = type.charAt(0).toUpperCase() + type.slice(1);
	}

	// returns function named as type set in constructor
	// e.g twitter()


	_createClass(OpenShare, [{
		key: 'setData',
		value: function setData(data) {
			// if iOS user and ios data attribute defined
			// build iOS URL scheme as single string
			if (this.ios) {
				this.transformData = this.transform(data, true);
				this.mobileShareUrl = this.template(this.transformData.url, this.transformData.data);
			}

			this.transformData = this.transform(data);
			this.shareUrl = this.template(this.transformData.url, this.transformData.data);
		}

		// open share URL defined in individual platform functions

	}, {
		key: 'share',
		value: function share(e) {
			var _this = this;

			// if iOS share URL has been set then use timeout hack
			// test for native app and fall back to web
			if (this.mobileShareUrl) {
				var start = new Date().valueOf();

				setTimeout(function () {
					var end = new Date().valueOf();

					// if the user is still here, fall back to web
					if (end - start > 1600) {
						return;
					}

					window.location = _this.shareUrl;
				}, 1500);

				window.location = this.mobileShareUrl;

				// open mailto links in same window
			} else if (this.type === 'email') {
				window.location = this.shareUrl;

				// open social share URLs in new window
			} else {
				// if popup object present then set window dimensions / position
				if (this.popup && this.transformData.popup) {
					this.openWindow(this.shareUrl, this.transformData.popup);
				}

				window.open(this.shareUrl);
			}
		}

		// create share URL with GET params
		// appending valid properties to query string

	}, {
		key: 'template',
		value: function template(url, data) {
			var nonURLProps = ['appendTo', 'innerHTML', 'classes'];

			var shareUrl = url,
			    i = void 0;

			for (i in data) {
				// only append valid properties
				if (!data[i] || nonURLProps.indexOf(i) > -1) {
					continue;
				}

				// append URL encoded GET param to share URL
				data[i] = encodeURIComponent(data[i]);
				shareUrl += i + '=' + data[i] + '&';
			}

			return shareUrl.substr(0, shareUrl.length - 1);
		}

		// center popup window supporting dual screens

	}, {
		key: 'openWindow',
		value: function openWindow(url, options) {
			var dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left,
			    dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top,
			    width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width,
			    height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height,
			    left = width / 2 - options.width / 2 + dualScreenLeft,
			    top = height / 2 - options.height / 2 + dualScreenTop,
			    newWindow = window.open(url, 'OpenShare', 'width=' + options.width + ', height=' + options.height + ', top=' + top + ', left=' + left);

			// Puts focus on the newWindow
			if (window.focus) {
				newWindow.focus();
			}
		}
	}]);

	return OpenShare;
}();

},{}],19:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Global OpenShare API to generate instances programmatically
 */

var OS = require('./open-share');
var ShareTransforms = require('./share-transforms');
var Events = require('./events');
var dashToCamel = require('../../lib/dashToCamel');

module.exports = function () {

	// global OpenShare referencing internal class for instance generation
	var OpenShare = function () {
		function OpenShare(data, element) {
			var _this = this;

			_classCallCheck(this, OpenShare);

			if (!data.bindClick) data.bindClick = true;

			var dash = data.type.indexOf('-');

			if (dash > -1) {
				data.type = dashToCamel(dash, data.type);
			}

			var node = void 0;
			this.element = element;
			this.data = data;

			this.os = new OS(data.type, ShareTransforms[data.type]);
			this.os.setData(data);

			if (!element || data.element) {
				element = data.element;
				node = document.createElement(element || 'a');
				if (data.type) {
					node.classList.add('open-share-link', data.type);
					node.setAttribute('data-open-share', data.type);
					node.setAttribute('data-open-share-node', data.type);
				}
				if (data.innerHTML) node.innerHTML = data.innerHTML;
			}
			if (node) element = node;

			if (data.bindClick) {
				element.addEventListener('click', function (e) {
					_this.share();
				});
			}

			if (data.appendTo) {
				data.appendTo.appendChild(element);
			}

			if (data.classes && Array.isArray(data.classes)) {
				data.classes.forEach(function (cssClass) {
					element.classList.add(cssClass);
				});
			}

			if (data.type.toLowerCase() === 'paypal') {
				var action = data.sandbox ? "https://www.sandbox.paypal.com/cgi-bin/webscr" : "https://www.paypal.com/cgi-bin/webscr";

				var buyGIF = data.sandbox ? "https://www.sandbox.paypal.com/en_US/i/btn/btn_buynow_LG.gif" : "https://www.paypalobjects.com/en_US/i/btn/btn_buynow_LG.gif";

				var pixelGIF = data.sandbox ? "https://www.sandbox.paypal.com/en_US/i/scr/pixel.gif" : "https://www.paypalobjects.com/en_US/i/scr/pixel.gif";

				var paypalButton = '<form action=' + action + ' method="post" target="_blank">\n\n\t\t\t\t  <!-- Saved buttons use the "secure click" command -->\n\t\t\t\t  <input type="hidden" name="cmd" value="_s-xclick">\n\n\t\t\t\t  <!-- Saved buttons are identified by their button IDs -->\n\t\t\t\t  <input type="hidden" name="hosted_button_id" value="' + data.buttonId + '">\n\n\t\t\t\t  <!-- Saved buttons display an appropriate button image. -->\n\t\t\t\t  <input type="image" name="submit"\n\t\t\t\t    src=' + buyGIF + '\n\t\t\t\t    alt="PayPal - The safer, easier way to pay online">\n\t\t\t\t  <img alt="" width="1" height="1"\n\t\t\t\t    src=' + pixelGIF + ' >\n\n\t\t\t\t</form>';

				var hiddenDiv = document.createElement('div');
				hiddenDiv.style.display = 'none';
				hiddenDiv.innerHTML = paypalButton;
				document.body.appendChild(hiddenDiv);

				this.paypal = hiddenDiv.querySelector('form');
			}

			this.element = element;
			return element;
		}

		// public share method to trigger share programmatically


		_createClass(OpenShare, [{
			key: 'share',
			value: function share(e) {
				// if dynamic instance then fetch attributes again in case of updates
				if (this.data.dynamic) {
					this.os.setData(data);
				}

				if (this.data.type.toLowerCase() === 'paypal') {
					this.paypal.submit();
				} else this.os.share(e);

				Events.trigger(this.element, 'shared');
			}
		}]);

		return OpenShare;
	}();

	return OpenShare;
};

},{"../../lib/dashToCamel":4,"./events":17,"./open-share":18,"./share-transforms":20}],20:[function(require,module,exports){
'use strict';

/**
 * Object of transform functions for each openshare api
 * Transform functions passed into OpenShare instance when instantiated
 * Return object containing URL and key/value args
 */
module.exports = {

	// set Twitter share URL
	twitter: function twitter(data) {
		var ios = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

		// if iOS user and ios data attribute defined
		// build iOS URL scheme as single string
		if (ios && data.ios) {

			var message = '';

			if (data.text) {
				message += data.text;
			}

			if (data.url) {
				message += ' - ' + data.url;
			}

			if (data.hashtags) {
				var tags = data.hashtags.split(',');
				tags.forEach(function (tag) {
					message += ' #' + tag;
				});
			}

			if (data.via) {
				message += ' via ' + data.via;
			}

			return {
				url: 'twitter://post?',
				data: {
					message: message
				}
			};
		}

		return {
			url: 'https://twitter.com/share?',
			data: data,
			popup: {
				width: 700,
				height: 296
			}
		};
	},

	// set Twitter retweet URL
	twitterRetweet: function twitterRetweet(data) {
		var ios = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

		// if iOS user and ios data attribute defined
		if (ios && data.ios) {
			return {
				url: 'twitter://status?',
				data: {
					id: data.tweetId
				}
			};
		}

		return {
			url: 'https://twitter.com/intent/retweet?',
			data: {
				tweet_id: data.tweetId,
				related: data.related
			},
			popup: {
				width: 700,
				height: 296
			}
		};
	},

	// set Twitter like URL
	twitterLike: function twitterLike(data) {
		var ios = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

		// if iOS user and ios data attribute defined
		if (ios && data.ios) {
			return {
				url: 'twitter://status?',
				data: {
					id: data.tweetId
				}
			};
		}

		return {
			url: 'https://twitter.com/intent/favorite?',
			data: {
				tweet_id: data.tweetId,
				related: data.related
			},
			popup: {
				width: 700,
				height: 296
			}
		};
	},

	// set Twitter follow URL
	twitterFollow: function twitterFollow(data) {
		var ios = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

		// if iOS user and ios data attribute defined
		if (ios && data.ios) {
			var iosData = data.screenName ? {
				'screen_name': data.screenName
			} : {
				'id': data.userId
			};

			return {
				url: 'twitter://user?',
				data: iosData
			};
		}

		return {
			url: 'https://twitter.com/intent/user?',
			data: {
				screen_name: data.screenName,
				user_id: data.userId
			},
			popup: {
				width: 700,
				height: 296
			}
		};
	},

	// set Facebook share URL
	facebook: function facebook(data) {
		return {
			url: 'https://www.facebook.com/dialog/feed?app_id=961342543922322&redirect_uri=http://facebook.com&',
			data: data,
			popup: {
				width: 560,
				height: 593
			}
		};
	},

	// set Facebook send URL
	facebookSend: function facebookSend(data) {
		return {
			url: 'https://www.facebook.com/dialog/send?app_id=961342543922322&redirect_uri=http://facebook.com&',
			data: data,
			popup: {
				width: 980,
				height: 596
			}
		};
	},

	// set YouTube play URL
	youtube: function youtube(data) {
		var ios = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

		// if iOS user
		if (ios && data.ios) {
			return {
				url: 'youtube:' + data.video + '?'
			};
		} else {
			return {
				url: 'https://www.youtube.com/watch?v=' + data.video + '?',
				popup: {
					width: 1086,
					height: 608
				}
			};
		}
	},

	// set YouTube subcribe URL
	youtubeSubscribe: function youtubeSubscribe(data) {
		var ios = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

		// if iOS user
		if (ios && data.ios) {
			return {
				url: 'youtube://www.youtube.com/user/' + data.user + '?'
			};
		} else {
			return {
				url: 'https://www.youtube.com/user/' + data.user + '?',
				popup: {
					width: 880,
					height: 350
				}
			};
		}
	},

	// set Instagram follow URL
	instagram: function instagram(data) {
		return {
			url: 'instagram://camera?'
		};
	},

	// set Instagram follow URL
	instagramFollow: function instagramFollow(data) {
		var ios = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

		// if iOS user
		if (ios && data.ios) {
			return {
				url: 'instagram://user?',
				data: data
			};
		} else {
			return {
				url: 'http://www.instagram.com/' + data.username + '?',
				popup: {
					width: 980,
					height: 655
				}
			};
		}
	},

	// set Snapchat follow URL
	snapchat: function snapchat(data) {
		return {
			url: 'snapchat://add/' + data.username + '?'
		};
	},


	// set Google share URL
	google: function google(data) {
		return {
			url: 'https://plus.google.com/share?',
			data: data,
			popup: {
				width: 495,
				height: 815
			}
		};
	},


	// set Google maps URL
	googleMaps: function googleMaps(data) {
		var ios = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];


		if (data.search) {
			data.q = data.search;
			delete data.search;
		}

		// if iOS user and ios data attribute defined
		if (ios && data.ios) {
			return {
				url: 'comgooglemaps://?',
				data: ios
			};
		}

		if (!ios && data.ios) {
			delete data.ios;
		}

		return {
			url: 'https://maps.google.com/?',
			data: data,
			popup: {
				width: 800,
				height: 600
			}
		};
	},


	// set Pinterest share URL
	pinterest: function pinterest(data) {
		return {
			url: 'https://pinterest.com/pin/create/bookmarklet/?',
			data: data,
			popup: {
				width: 745,
				height: 620
			}
		};
	},


	// set LinkedIn share URL
	linkedin: function linkedin(data) {
		return {
			url: 'http://www.linkedin.com/shareArticle?',
			data: data,
			popup: {
				width: 780,
				height: 492
			}
		};
	},


	// set Buffer share URL
	buffer: function buffer(data) {
		return {
			url: 'http://bufferapp.com/add?',
			data: data,
			popup: {
				width: 745,
				height: 345
			}
		};
	},


	// set Tumblr share URL
	tumblr: function tumblr(data) {
		return {
			url: 'https://www.tumblr.com/widgets/share/tool?',
			data: data,
			popup: {
				width: 540,
				height: 940
			}
		};
	},


	// set Reddit share URL
	reddit: function reddit(data) {
		return {
			url: 'http://reddit.com/submit?',
			data: data,
			popup: {
				width: 860,
				height: 880
			}
		};
	},


	// set Flickr follow URL
	flickr: function flickr(data) {
		var ios = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

		// if iOS user
		if (ios && data.ios) {
			return {
				url: 'flickr://photos/' + data.username + '?'
			};
		} else {
			return {
				url: 'http://www.flickr.com/photos/' + data.username + '?',
				popup: {
					width: 600,
					height: 650
				}
			};
		}
	},


	// set WhatsApp share URL
	whatsapp: function whatsapp(data) {
		return {
			url: 'whatsapp://send?',
			data: data
		};
	},


	// set sms share URL
	sms: function sms(data) {
		var ios = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

		return {
			url: ios ? 'sms:&' : 'sms:?',
			data: data
		};
	},


	// set Email share URL
	email: function email(data) {

		var url = 'mailto:';

		// if to address specified then add to URL
		if (data.to !== null) {
			url += '' + data.to;
		}

		url += '?';

		return {
			url: url,
			data: {
				subject: data.subject,
				body: data.body
			}
		};
	},


	// set Github fork URL
	github: function github(data) {
		var ios = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

		var url = data.repo ? 'https://github.com/' + data.repo : data.url;

		if (data.issue) {
			url += '/issues/new?title=' + data.issue + '&body=' + data.body;
		}

		return {
			url: url + '?',
			popup: {
				width: 1020,
				height: 323
			}
		};
	},


	// set Dribbble share URL
	dribbble: function dribbble(data) {
		var ios = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

		var url = data.shot ? 'https://dribbble.com/shots/' + data.shot + '?' : data.url + '?';
		return {
			url: url,
			popup: {
				width: 440,
				height: 640
			}
		};
	},
	codepen: function codepen(data) {
		var url = data.pen && data.username && data.view ? 'https://codepen.io/' + data.username + '/' + data.view + '/' + data.pen + '?' : data.url + '?';
		return {
			url: url,
			popup: {
				width: 1200,
				height: 800
			}
		};
	},
	paypal: function paypal(data) {
		return {
			data: data
		};
	}
};

},{}],21:[function(require,module,exports){
'use strict';

var OpenShare = {
	share: require('../share.js'),
	count: require('../count.js'),
	analytics: require('../analytics.js')
};

// OpenShare.analytics('tagManager', function () {
//   console.log('tag manager loaded');
// });
//
// OpenShare.analytics('event', function () {
//   console.log('google analytics loaded');
// });
//
// OpenShare.analytics('social', function () {
//   console.log('google analytics loaded');
// });

var dynamicNodeData = {
	'url': 'http://www.digitalsurgeons.com',
	'via': 'digitalsurgeons',
	'text': 'Forward Obsessed',
	'hashtags': 'forwardobsessed',
	'button': 'Open Share Watcher!'
};

function createOpenShareNode(data) {
	var openShare = document.createElement('a');

	openShare.classList.add('open-share-link', 'twitter');
	openShare.setAttribute('data-open-share', 'twitter');
	openShare.setAttribute('data-open-share-url', data.url);
	openShare.setAttribute('data-open-share-via', data.via);
	openShare.setAttribute('data-open-share-text', data.text);
	openShare.setAttribute('data-open-share-hashtags', data.hashtags);
	openShare.innerHTML = '<span class="fa fa-twitter"></span>' + data.button;

	var node = new OpenShare.share({
		type: 'twitter',
		url: 'http://www.digitalsurgeons.com',
		via: 'digitalsurgeons',
		hashtags: 'forwardobsessed',
		appendTo: document.querySelector('.open-share-watch'),
		innerHTML: 'Created via OpenShareAPI',
		element: 'div',
		classes: ['wow', 'such', 'classes']
	});

	return openShare;
}

function addNode() {
	var data = dynamicNodeData;
	document.querySelector('.open-share-watch').appendChild(createOpenShareNode(data));
}

window.addNode = addNode;

function addNodeWithCount() {
	var data = dynamicNodeData;

	new OpenShare.count({
		type: 'facebook',
		url: 'https://www.digitalsurgeons.com/'
	}, function (node) {
		var os = new OpenShare.share({
			type: 'twitter',
			url: 'http://www.digitalsurgeons.com',
			via: 'digitalsurgeons',
			hashtags: 'forwardobsessed',
			innerHTML: 'Created via OpenShareAPI',
			element: 'div',
			classes: ['wow', 'such', 'classes']
		});
		document.querySelector('.create-node.w-count').appendChild(os);
		os.appendChild(node);
	});
}

window.addNodeWithCount = addNodeWithCount;

function createCountNode() {
	var container = document.querySelector('.create-node.count-nodes');
	var type = container.querySelector('input.count-type').value;
	var url = container.querySelector('input.count-url').value;

	new OpenShare.count({
		type: type,
		url: url,
		appendTo: container,
		classes: ['test']
	}, function (node) {
		node.style.position = 'relative';
	});

	container.querySelector('input.count-type').value = '';
	container.querySelector('input.count-url').value = '';
}

window.createCountNode = createCountNode;

// test JS OpenShare API with dashes

new OpenShare.share({
	type: 'googleMaps',
	center: '40.765819,-73.975866',
	view: 'traffic',
	zoom: 14,
	appendTo: document.body,
	innerHTML: 'Maps'
});

new OpenShare.share({
	type: 'twitter-follow',
	screenName: 'digitalsurgeons',
	userId: '18189130',
	appendTo: document.body,
	innerHTML: 'Follow Test'
});

// test PayPal
new OpenShare.share({
	type: 'paypal',
	buttonId: '2P3RJYEFL7Z62',
	sandbox: true,
	appendTo: document.body,
	innerHTML: 'PayPal Test'
});

// bind to count loaded event
document.addEventListener('OpenShare.count-loaded', function () {
	console.log('OpenShare (count) loaded');
});

// bind to share loaded event
document.addEventListener('OpenShare.share-loaded', function () {
	console.log('OpenShare (share) loaded');

	// bind to shared event on each individual node
	[].forEach.call(document.querySelectorAll('[data-open-share]'), function (node) {
		node.addEventListener('OpenShare.shared', function (e) {
			console.log('Open Share Shared', e);
		});
	});

	var examples = {
		twitter: new OpenShare.share({
			type: 'twitter',
			bindClick: true,
			url: 'http://digitalsurgeons.com',
			via: 'digitalsurgeons',
			text: 'Digital Surgeons',
			hashtags: 'forwardobsessed'
		}, document.querySelector('[data-api-example="twitter"]')),

		facebook: new OpenShare.share({
			type: 'facebook',
			bindClick: true,
			link: 'http://digitalsurgeons.com',
			picture: 'http://www.digitalsurgeons.com/img/about/bg_office_team.jpg',
			caption: 'Digital Surgeons',
			description: 'forwardobsessed'
		}, document.querySelector('[data-api-example="facebook"]')),

		pinterest: new OpenShare.share({
			type: 'pinterest',
			bindClick: true,
			url: 'http://digitalsurgeons.com',
			media: 'http://www.digitalsurgeons.com/img/about/bg_office_team.jpg',
			description: 'Digital Surgeons',
			appendTo: document.body
		}, document.querySelector('[data-api-example="pinterest"]')),

		email: new OpenShare.share({
			type: 'email',
			bindClick: true,
			to: 'techroom@digitalsurgeons.com',
			subject: 'Digital Surgeons',
			body: 'Forward Obsessed'
		}, document.querySelector('[data-api-example="email"]'))
	};
});

// Example of listening for counted events on individual urls or arrays of urls
var urls = ['facebook', 'google', 'linkedin', 'reddit', 'pinterest', ['google', 'linkedin', 'reddit', 'pinterest']];

urls.forEach(function (url) {
	if (Array.isArray(url)) {
		url = url.join(',');
	}
	var countNode = document.querySelectorAll('[data-open-share-count="' + url + '"]');

	[].forEach.call(countNode, function (node) {
		node.addEventListener('OpenShare.counted-' + url, function () {
			var counts = node.innerHTML;
			if (counts) console.log(url, 'shares: ', counts);
		});
	});
});

},{"../analytics.js":1,"../count.js":2,"../share.js":13}]},{},[21])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhbmFseXRpY3MuanMiLCJjb3VudC5qcyIsImxpYi9jb3VudFJlZHVjZS5qcyIsImxpYi9kYXNoVG9DYW1lbC5qcyIsImxpYi9pbml0LmpzIiwibGliL2luaXRpYWxpemVDb3VudE5vZGUuanMiLCJsaWIvaW5pdGlhbGl6ZU5vZGVzLmpzIiwibGliL2luaXRpYWxpemVTaGFyZU5vZGUuanMiLCJsaWIvaW5pdGlhbGl6ZVdhdGNoZXIuanMiLCJsaWIvc2V0RGF0YS5qcyIsImxpYi9zaGFyZS5qcyIsImxpYi9zdG9yZUNvdW50LmpzIiwic2hhcmUuanMiLCJzcmMvbW9kdWxlcy9jb3VudC1hcGkuanMiLCJzcmMvbW9kdWxlcy9jb3VudC10cmFuc2Zvcm1zLmpzIiwic3JjL21vZHVsZXMvY291bnQuanMiLCJzcmMvbW9kdWxlcy9ldmVudHMuanMiLCJzcmMvbW9kdWxlcy9vcGVuLXNoYXJlLmpzIiwic3JjL21vZHVsZXMvc2hhcmUtYXBpLmpzIiwic3JjL21vZHVsZXMvc2hhcmUtdHJhbnNmb3Jtcy5qcyIsInNyYy90ZXN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxPQUFPLE9BQVAsR0FBaUIsVUFBVSxJQUFWLEVBQWdCLEVBQWhCLEVBQW9CO0FBQ2xDLEtBQUksUUFBUSxFQUFaOztBQUVBOztBQUVDLEtBQU0sT0FBTyxTQUFTLE9BQVQsSUFBb0IsU0FBUyxRQUExQztBQUNBLEtBQU0sZUFBZSxTQUFTLFlBQTlCOztBQUVBLEtBQUksSUFBSixFQUFVLHVCQUF1QixJQUF2QixFQUE2QixFQUE3QixFQUFpQyxLQUFqQztBQUNWLEtBQUksWUFBSixFQUFrQixjQUFjLEVBQWQ7QUFDbkI7QUFDRixDQVhEOztBQWFBLFNBQVMsc0JBQVQsQ0FBZ0MsSUFBaEMsRUFBc0MsRUFBdEMsRUFBMEMsS0FBMUMsRUFBaUQ7QUFDaEQ7QUFDQSxLQUFJLE9BQU8sRUFBWCxFQUFl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QUhELEVBSUMsV0FKRCxDQU5VLENBQVg7O0FBY0EsS0FBSyxPQUFMLENBQWEsVUFBUyxHQUFULEVBQWM7QUFDMUIsS0FBSSxNQUFNLE9BQU4sQ0FBYyxHQUFkLENBQUosRUFBd0I7QUFDdkIsUUFBTSxJQUFJLElBQUosQ0FBUyxHQUFULENBQU47QUFDQTtBQUNELEtBQUksWUFBWSxTQUFTLGdCQUFULENBQTBCLDZCQUE2QixHQUE3QixHQUFtQyxJQUE3RCxDQUFoQjs7QUFFQSxJQUFHLE9BQUgsQ0FBVyxJQUFYLENBQWdCLFNBQWhCLEVBQTJCLFVBQVMsSUFBVCxFQUFlO0FBQ3pDLE9BQUssZ0JBQUwsQ0FBc0IsdUJBQXVCLEdBQTdDLEVBQWtELFlBQVc7QUFDNUQsT0FBSSxTQUFTLEtBQUssU0FBbEI7QUFDQSxPQUFJLE1BQUosRUFBWSxRQUFRLEdBQVIsQ0FBWSxHQUFaLEVBQWlCLFVBQWpCLEVBQTZCLE1BQTdCO0FBQ1osR0FIRDtBQUlBLEVBTEQ7QUFNQSxDQVpEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHR5cGUsIGNiKSB7XG4gICBsZXQgY291bnQgPSAxMDtcblxuICAgLy8gZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGZ1bmN0aW9uICgpIHtcblxuXHQgICBjb25zdCBpc0dBID0gdHlwZSA9PT0gJ2V2ZW50JyB8fCB0eXBlID09PSAnc29jaWFsJztcblx0ICAgY29uc3QgaXNUYWdNYW5hZ2VyID0gdHlwZSA9PT0gJ3RhZ01hbmFnZXInO1xuXG5cdCAgIGlmIChpc0dBKSBjaGVja0lmQW5hbHl0aWNzTG9hZGVkKHR5cGUsIGNiLCBjb3VudCk7XG5cdCAgIGlmIChpc1RhZ01hbmFnZXIpIHNldFRhZ01hbmFnZXIoY2IpO1xuICAgLy8gfSk7XG59O1xuXG5mdW5jdGlvbiBjaGVja0lmQW5hbHl0aWNzTG9hZGVkKHR5cGUsIGNiLCBjb3VudCkge1xuXHRjb3VudC0tO1xuXHRpZiAod2luZG93LmdhKSB7XG5cdFx0ICBpZiAoY2IpIGNiKCk7XG5cdFx0ICAvLyBiaW5kIHRvIHNoYXJlZCBldmVudCBvbiBlYWNoIGluZGl2aWR1YWwgbm9kZVxuXHRcdCAgbGlzdGVuKGZ1bmN0aW9uIChlKSB7XG5cdFx0XHRjb25zdCBwbGF0Zm9ybSA9IGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlJyk7XG5cdFx0XHRjb25zdCB0YXJnZXQgPSBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1saW5rJykgfHxcblx0XHRcdFx0ZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdXJsJykgfHxcblx0XHRcdFx0ZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdXNlcm5hbWUnKSB8fFxuXHRcdFx0ICAgIGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNlbnRlcicpIHx8XG5cdFx0XHRcdGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXNlYXJjaCcpIHx8XG5cdFx0XHRcdGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWJvZHknKTtcblxuXHRcdFx0aWYgKHR5cGUgPT09ICdldmVudCcpIHtcblx0XHRcdFx0Z2EoJ3NlbmQnLCAnZXZlbnQnLCB7XG5cdFx0XHRcdFx0ZXZlbnRDYXRlZ29yeTogJ09wZW5TaGFyZSBDbGljaycsXG5cdFx0XHRcdFx0ZXZlbnRBY3Rpb246IHBsYXRmb3JtLFxuXHRcdFx0XHRcdGV2ZW50TGFiZWw6IHRhcmdldCxcblx0XHRcdFx0XHR0cmFuc3BvcnQ6ICdiZWFjb24nXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAodHlwZSA9PT0gJ3NvY2lhbCcpIHtcblx0XHRcdFx0Z2EoJ3NlbmQnLCB7XG5cdFx0XHRcdFx0aGl0VHlwZTogJ3NvY2lhbCcsXG5cdFx0XHRcdFx0c29jaWFsTmV0d29yazogcGxhdGZvcm0sXG5cdFx0XHRcdFx0c29jaWFsQWN0aW9uOiAnc2hhcmUnLFxuXHRcdFx0XHRcdHNvY2lhbFRhcmdldDogdGFyZ2V0XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdH1cblx0ZWxzZSB7XG5cdFx0ICBpZiAoY291bnQpIHtcblx0XHRcdCAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG5cdFx0XHQgIGNoZWNrSWZBbmFseXRpY3NMb2FkZWQodHlwZSwgY2IsIGNvdW50KTtcblx0XHQgIH0sIDEwMDApO1xuICBcdFx0fVxuXHR9XG59XG5cbmZ1bmN0aW9uIHNldFRhZ01hbmFnZXIgKGNiKSB7XG5cdGlmIChjYikgY2IoKTtcblxuXHR3aW5kb3cuZGF0YUxheWVyID0gd2luZG93LmRhdGFMYXllciB8fCBbXTtcblxuXHRsaXN0ZW4ob25TaGFyZVRhZ01hbmdlcik7XG5cblx0Z2V0Q291bnRzKGZ1bmN0aW9uKGUpIHtcblx0XHRjb25zdCBjb3VudCA9IGUudGFyZ2V0ID9cblx0XHQgIGUudGFyZ2V0LmlubmVySFRNTCA6XG5cdFx0ICBlLmlubmVySFRNTDtcblxuXHRcdGNvbnN0IHBsYXRmb3JtID0gZS50YXJnZXQgP1xuXHRcdCAgIGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50LXVybCcpIDpcblx0XHQgICBlLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50LXVybCcpO1xuXG5cdFx0d2luZG93LmRhdGFMYXllci5wdXNoKHtcblx0XHRcdCdldmVudCcgOiAnT3BlblNoYXJlIENvdW50Jyxcblx0XHRcdCdwbGF0Zm9ybSc6IHBsYXRmb3JtLFxuXHRcdFx0J3Jlc291cmNlJzogY291bnQsXG5cdFx0XHQnYWN0aXZpdHknOiAnY291bnQnXG5cdFx0fSk7XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBsaXN0ZW4gKGNiKSB7XG5cdC8vIGJpbmQgdG8gc2hhcmVkIGV2ZW50IG9uIGVhY2ggaW5kaXZpZHVhbCBub2RlXG5cdFtdLmZvckVhY2guY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1vcGVuLXNoYXJlXScpLCBmdW5jdGlvbihub2RlKSB7XG5cdFx0bm9kZS5hZGRFdmVudExpc3RlbmVyKCdPcGVuU2hhcmUuc2hhcmVkJywgY2IpO1xuXHR9KTtcbn1cblxuZnVuY3Rpb24gZ2V0Q291bnRzIChjYikge1xuXHR2YXIgY291bnROb2RlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtb3Blbi1zaGFyZS1jb3VudF0nKTtcblxuXHRbXS5mb3JFYWNoLmNhbGwoY291bnROb2RlLCBmdW5jdGlvbihub2RlKSB7XG5cdFx0aWYgKG5vZGUudGV4dENvbnRlbnQpIGNiKG5vZGUpO1xuXHRcdGVsc2Ugbm9kZS5hZGRFdmVudExpc3RlbmVyKCdPcGVuU2hhcmUuY291bnRlZC0nICsgbm9kZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudC11cmwnKSwgY2IpO1xuXHR9KTtcbn1cblxuZnVuY3Rpb24gb25TaGFyZVRhZ01hbmdlciAoZSkge1xuXHRjb25zdCBwbGF0Zm9ybSA9IGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlJyk7XG5cdGNvbnN0IHRhcmdldCA9IGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWxpbmsnKSB8fFxuXHRcdGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXVybCcpIHx8XG5cdFx0ZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdXNlcm5hbWUnKSB8fFxuXHRcdGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNlbnRlcicpIHx8XG5cdFx0ZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtc2VhcmNoJykgfHxcblx0XHRlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1ib2R5Jyk7XG5cblx0d2luZG93LmRhdGFMYXllci5wdXNoKHtcblx0XHQnZXZlbnQnIDogJ09wZW5TaGFyZSBTaGFyZScsXG5cdFx0J3BsYXRmb3JtJzogcGxhdGZvcm0sXG5cdFx0J3Jlc291cmNlJzogdGFyZ2V0LFxuXHRcdCdhY3Rpdml0eSc6ICdzaGFyZSdcblx0fSk7XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHtcblx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIHJlcXVpcmUoJy4vbGliL2luaXQnKSh7XG5cdFx0YXBpOiAnY291bnQnLFxuXHRcdHNlbGVjdG9yOiAnW2RhdGEtb3Blbi1zaGFyZS1jb3VudF06bm90KFtkYXRhLW9wZW4tc2hhcmUtbm9kZV0pJyxcblx0XHRjYjogcmVxdWlyZSgnLi9saWIvaW5pdGlhbGl6ZUNvdW50Tm9kZScpXG5cdH0pKTtcblxuXHRyZXR1cm4gcmVxdWlyZSgnLi9zcmMvbW9kdWxlcy9jb3VudC1hcGknKSgpO1xufSkoKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gY291bnRSZWR1Y2U7XG5cbmZ1bmN0aW9uIHJvdW5kKHgsIHByZWNpc2lvbikge1xuXHRpZiAodHlwZW9mIHggIT09ICdudW1iZXInKSB7XG5cdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgdmFsdWUgdG8gYmUgYSBudW1iZXInKTtcblx0fVxuXG5cdHZhciBleHBvbmVudCA9IHByZWNpc2lvbiA+IDAgPyAnZScgOiAnZS0nO1xuXHR2YXIgZXhwb25lbnROZWcgPSBwcmVjaXNpb24gPiAwID8gJ2UtJyA6ICdlJztcblx0cHJlY2lzaW9uID0gTWF0aC5hYnMocHJlY2lzaW9uKTtcblxuXHRyZXR1cm4gTnVtYmVyKE1hdGgucm91bmQoeCArIGV4cG9uZW50ICsgcHJlY2lzaW9uKSArIGV4cG9uZW50TmVnICsgcHJlY2lzaW9uKTtcbn1cblxuZnVuY3Rpb24gdGhvdXNhbmRpZnkgKG51bSkge1xuXHRyZXR1cm4gcm91bmQobnVtLzEwMDAsIDEpICsgJ0snO1xufVxuXG5mdW5jdGlvbiBtaWxsaW9uaWZ5IChudW0pIHtcblx0cmV0dXJuIHJvdW5kKG51bS8xMDAwMDAwLCAxKSArICdNJztcbn1cblxuZnVuY3Rpb24gY291bnRSZWR1Y2UgKGVsLCBjb3VudCwgY2IpIHtcblx0aWYgKGNvdW50ID4gOTk5OTk5KSAge1xuXHRcdGVsLmlubmVySFRNTCA9IG1pbGxpb25pZnkoY291bnQpO1xuXHRcdGlmIChjYiAgJiYgdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSBjYihlbCk7XG5cdH0gZWxzZSBpZiAoY291bnQgPiA5OTkpIHtcblx0XHRlbC5pbm5lckhUTUwgPSB0aG91c2FuZGlmeShjb3VudCk7XG5cdFx0aWYgKGNiICAmJiB0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpIGNiKGVsKTtcblx0fSBlbHNlIHtcblx0XHRlbC5pbm5lckhUTUwgPSBjb3VudDtcblx0XHRpZiAoY2IgICYmIHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykgY2IoZWwpO1xuXHR9XG59XG4iLCIvLyB0eXBlIGNvbnRhaW5zIGEgZGFzaFxuLy8gdHJhbnNmb3JtIHRvIGNhbWVsY2FzZSBmb3IgZnVuY3Rpb24gcmVmZXJlbmNlXG4vLyBUT0RPOiBvbmx5IHN1cHBvcnRzIHNpbmdsZSBkYXNoLCBzaG91bGQgc2hvdWxkIHN1cHBvcnQgbXVsdGlwbGVcbm1vZHVsZS5leHBvcnRzID0gKGRhc2gsIHR5cGUpID0+IHtcblx0bGV0IG5leHRDaGFyID0gdHlwZS5zdWJzdHIoZGFzaCArIDEsIDEpLFxuXHRcdGdyb3VwID0gdHlwZS5zdWJzdHIoZGFzaCwgMik7XG5cblx0dHlwZSA9IHR5cGUucmVwbGFjZShncm91cCwgbmV4dENoYXIudG9VcHBlckNhc2UoKSk7XG5cdHJldHVybiB0eXBlO1xufTtcbiIsImNvbnN0IGluaXRpYWxpemVOb2RlcyA9IHJlcXVpcmUoJy4vaW5pdGlhbGl6ZU5vZGVzJyk7XG5jb25zdCBpbml0aWFsaXplV2F0Y2hlciA9IHJlcXVpcmUoJy4vaW5pdGlhbGl6ZVdhdGNoZXInKTtcblxubW9kdWxlLmV4cG9ydHMgPSBpbml0O1xuXG5mdW5jdGlvbiBpbml0KG9wdHMpIHtcblx0cmV0dXJuICgpID0+IHtcblx0XHRjb25zdCBpbml0Tm9kZXMgPSBpbml0aWFsaXplTm9kZXMoe1xuXHRcdFx0YXBpOiBvcHRzLmFwaSB8fCBudWxsLFxuXHRcdFx0Y29udGFpbmVyOiBvcHRzLmNvbnRhaW5lciB8fCBkb2N1bWVudCxcblx0XHRcdHNlbGVjdG9yOiBvcHRzLnNlbGVjdG9yLFxuXHRcdFx0Y2I6IG9wdHMuY2Jcblx0XHR9KTtcblxuXHRcdGluaXROb2RlcygpO1xuXG5cdFx0Ly8gY2hlY2sgZm9yIG11dGF0aW9uIG9ic2VydmVycyBiZWZvcmUgdXNpbmcsIElFMTEgb25seVxuXHRcdGlmICh3aW5kb3cuTXV0YXRpb25PYnNlcnZlciAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRpbml0aWFsaXplV2F0Y2hlcihkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1vcGVuLXNoYXJlLXdhdGNoXScpLCBpbml0Tm9kZXMpO1xuXHRcdH1cblx0fTtcbn1cbiIsImNvbnN0IENvdW50ID0gcmVxdWlyZSgnLi4vc3JjL21vZHVsZXMvY291bnQnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBpbml0aWFsaXplQ291bnROb2RlO1xuXG5mdW5jdGlvbiBpbml0aWFsaXplQ291bnROb2RlKG9zKSB7XG5cdC8vIGluaXRpYWxpemUgb3BlbiBzaGFyZSBvYmplY3Qgd2l0aCB0eXBlIGF0dHJpYnV0ZVxuXHRsZXQgdHlwZSA9IG9zLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50JyksXG5cdFx0dXJsID0gb3MuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY291bnQtcmVwbycpIHx8XG5cdFx0XHRvcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudC1zaG90JykgfHxcblx0XHRcdG9zLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50LXVybCcpLFxuXHRcdGNvdW50ID0gbmV3IENvdW50KHR5cGUsIHVybCk7XG5cblx0Y291bnQuY291bnQob3MpO1xuXHRvcy5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1ub2RlJywgdHlwZSk7XG59XG4iLCJjb25zdCBFdmVudHMgPSByZXF1aXJlKCcuLi9zcmMvbW9kdWxlcy9ldmVudHMnKTtcbmNvbnN0IGFuYWx5dGljcyA9IHJlcXVpcmUoJy4uL2FuYWx5dGljcycpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gaW5pdGlhbGl6ZU5vZGVzO1xuXG5mdW5jdGlvbiBpbml0aWFsaXplTm9kZXMob3B0cykge1xuXHQvLyBsb29wIHRocm91Z2ggb3BlbiBzaGFyZSBub2RlIGNvbGxlY3Rpb25cblx0cmV0dXJuICgpID0+IHtcblx0XHQvLyBjaGVjayBmb3IgYW5hbHl0aWNzXG5cdFx0Y2hlY2tBbmFseXRpY3MoKTtcblxuXHRcdGlmIChvcHRzLmFwaSkge1xuXHRcdFx0bGV0IG5vZGVzID0gb3B0cy5jb250YWluZXIucXVlcnlTZWxlY3RvckFsbChvcHRzLnNlbGVjdG9yKTtcblx0XHRcdFtdLmZvckVhY2guY2FsbChub2Rlcywgb3B0cy5jYik7XG5cblx0XHRcdC8vIHRyaWdnZXIgY29tcGxldGVkIGV2ZW50XG5cdFx0XHRFdmVudHMudHJpZ2dlcihkb2N1bWVudCwgb3B0cy5hcGkgKyAnLWxvYWRlZCcpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBsb29wIHRocm91Z2ggb3BlbiBzaGFyZSBub2RlIGNvbGxlY3Rpb25cblx0XHRcdGxldCBzaGFyZU5vZGVzID0gb3B0cy5jb250YWluZXIucXVlcnlTZWxlY3RvckFsbChvcHRzLnNlbGVjdG9yLnNoYXJlKTtcblx0XHRcdFtdLmZvckVhY2guY2FsbChzaGFyZU5vZGVzLCBvcHRzLmNiLnNoYXJlKTtcblxuXHRcdFx0Ly8gdHJpZ2dlciBjb21wbGV0ZWQgZXZlbnRcblx0XHRcdEV2ZW50cy50cmlnZ2VyKGRvY3VtZW50LCAnc2hhcmUtbG9hZGVkJyk7XG5cblx0XHRcdC8vIGxvb3AgdGhyb3VnaCBjb3VudCBub2RlIGNvbGxlY3Rpb25cblx0XHRcdGxldCBjb3VudE5vZGVzID0gb3B0cy5jb250YWluZXIucXVlcnlTZWxlY3RvckFsbChvcHRzLnNlbGVjdG9yLmNvdW50KTtcblx0XHRcdFtdLmZvckVhY2guY2FsbChjb3VudE5vZGVzLCBvcHRzLmNiLmNvdW50KTtcblxuXHRcdFx0Ly8gdHJpZ2dlciBjb21wbGV0ZWQgZXZlbnRcblx0XHRcdEV2ZW50cy50cmlnZ2VyKGRvY3VtZW50LCAnY291bnQtbG9hZGVkJyk7XG5cdFx0fVxuXHR9O1xufVxuXG5mdW5jdGlvbiBjaGVja0FuYWx5dGljcyAoKSB7XG5cdC8vIGNoZWNrIGZvciBhbmFseXRpY3Ncblx0aWYgKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLW9wZW4tc2hhcmUtYW5hbHl0aWNzXScpKSB7XG5cdFx0Y29uc3QgcHJvdmlkZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbZGF0YS1vcGVuLXNoYXJlLWFuYWx5dGljc10nKVxuXHRcdFx0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWFuYWx5dGljcycpO1xuXG5cdFx0aWYgKHByb3ZpZGVyLmluZGV4T2YoJywnKSA+IC0xKSB7XG5cdFx0XHRjb25zdCBwcm92aWRlcnMgPSBwcm92aWRlci5zcGxpdCgnLCcpO1xuXHRcdFx0cHJvdmlkZXJzLmZvckVhY2gocCA9PiBhbmFseXRpY3MocCkpO1xuXHRcdH0gZWxzZSBhbmFseXRpY3MocHJvdmlkZXIpO1xuXG5cdH1cbn1cbiIsImNvbnN0IFNoYXJlVHJhbnNmb3JtcyA9IHJlcXVpcmUoJy4uL3NyYy9tb2R1bGVzL3NoYXJlLXRyYW5zZm9ybXMnKTtcbmNvbnN0IE9wZW5TaGFyZSA9IHJlcXVpcmUoJy4uL3NyYy9tb2R1bGVzL29wZW4tc2hhcmUnKTtcbmNvbnN0IHNldERhdGEgPSByZXF1aXJlKCcuL3NldERhdGEnKTtcbmNvbnN0IHNoYXJlID0gcmVxdWlyZSgnLi9zaGFyZScpO1xuY29uc3QgZGFzaFRvQ2FtZWwgPSByZXF1aXJlKCcuL2Rhc2hUb0NhbWVsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gaW5pdGlhbGl6ZVNoYXJlTm9kZTtcblxuZnVuY3Rpb24gaW5pdGlhbGl6ZVNoYXJlTm9kZShvcykge1xuXHQvLyBpbml0aWFsaXplIG9wZW4gc2hhcmUgb2JqZWN0IHdpdGggdHlwZSBhdHRyaWJ1dGVcblx0bGV0IHR5cGUgPSBvcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZScpLFxuXHRcdGRhc2ggPSB0eXBlLmluZGV4T2YoJy0nKSxcblx0XHRvcGVuU2hhcmU7XG5cblx0aWYgKGRhc2ggPiAtMSkge1xuXHRcdHR5cGUgPSBkYXNoVG9DYW1lbChkYXNoLCB0eXBlKTtcblx0fVxuXG5cdGxldCB0cmFuc2Zvcm0gPSBTaGFyZVRyYW5zZm9ybXNbdHlwZV07XG5cblx0aWYgKCF0cmFuc2Zvcm0pIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoYE9wZW4gU2hhcmU6ICR7dHlwZX0gaXMgYW4gaW52YWxpZCB0eXBlYCk7XG5cdH1cblxuXHRvcGVuU2hhcmUgPSBuZXcgT3BlblNoYXJlKHR5cGUsIHRyYW5zZm9ybSk7XG5cblx0Ly8gc3BlY2lmeSBpZiB0aGlzIGlzIGEgZHluYW1pYyBpbnN0YW5jZVxuXHRpZiAob3MuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtZHluYW1pYycpKSB7XG5cdFx0b3BlblNoYXJlLmR5bmFtaWMgPSB0cnVlO1xuXHR9XG5cblx0Ly8gc3BlY2lmeSBpZiB0aGlzIGlzIGEgcG9wdXAgaW5zdGFuY2Vcblx0aWYgKG9zLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXBvcHVwJykpIHtcblx0XHRvcGVuU2hhcmUucG9wdXAgPSB0cnVlO1xuXHR9XG5cblx0Ly8gc2V0IGFsbCBvcHRpb25hbCBhdHRyaWJ1dGVzIG9uIG9wZW4gc2hhcmUgaW5zdGFuY2Vcblx0c2V0RGF0YShvcGVuU2hhcmUsIG9zKTtcblxuXHQvLyBvcGVuIHNoYXJlIGRpYWxvZyBvbiBjbGlja1xuXHRvcy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XG5cdFx0c2hhcmUoZSwgb3MsIG9wZW5TaGFyZSk7XG5cdH0pO1xuXG5cdG9zLmFkZEV2ZW50TGlzdGVuZXIoJ09wZW5TaGFyZS50cmlnZ2VyJywgKGUpID0+IHtcblx0XHRzaGFyZShlLCBvcywgb3BlblNoYXJlKTtcblx0fSk7XG5cblx0b3Muc2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtbm9kZScsIHR5cGUpO1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBpbml0aWFsaXplV2F0Y2hlcjtcblxuZnVuY3Rpb24gaW5pdGlhbGl6ZVdhdGNoZXIod2F0Y2hlciwgZm4pIHtcblx0W10uZm9yRWFjaC5jYWxsKHdhdGNoZXIsICh3KSA9PiB7XG5cdFx0dmFyIG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoKG11dGF0aW9ucykgPT4ge1xuXHRcdFx0Ly8gdGFyZ2V0IHdpbGwgbWF0Y2ggYmV0d2VlbiBhbGwgbXV0YXRpb25zIHNvIGp1c3QgdXNlIGZpcnN0XG5cdFx0XHRmbihtdXRhdGlvbnNbMF0udGFyZ2V0KTtcblx0XHR9KTtcblxuXHRcdG9ic2VydmVyLm9ic2VydmUodywge1xuXHRcdFx0Y2hpbGRMaXN0OiB0cnVlXG5cdFx0fSk7XG5cdH0pO1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBzZXREYXRhO1xuXG5mdW5jdGlvbiBzZXREYXRhKG9zSW5zdGFuY2UsIG9zRWxlbWVudCkge1xuXHRvc0luc3RhbmNlLnNldERhdGEoe1xuXHRcdHVybDogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXVybCcpLFxuXHRcdHRleHQ6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS10ZXh0JyksXG5cdFx0dmlhOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdmlhJyksXG5cdFx0aGFzaHRhZ3M6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1oYXNodGFncycpLFxuXHRcdHR3ZWV0SWQ6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS10d2VldC1pZCcpLFxuXHRcdHJlbGF0ZWQ6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1yZWxhdGVkJyksXG5cdFx0c2NyZWVuTmFtZTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXNjcmVlbi1uYW1lJyksXG5cdFx0dXNlcklkOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdXNlci1pZCcpLFxuXHRcdGxpbms6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1saW5rJyksXG5cdFx0cGljdHVyZTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXBpY3R1cmUnKSxcblx0XHRjYXB0aW9uOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY2FwdGlvbicpLFxuXHRcdGRlc2NyaXB0aW9uOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtZGVzY3JpcHRpb24nKSxcblx0XHR1c2VyOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdXNlcicpLFxuXHRcdHZpZGVvOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdmlkZW8nKSxcblx0XHR1c2VybmFtZTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXVzZXJuYW1lJyksXG5cdFx0dGl0bGU6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS10aXRsZScpLFxuXHRcdG1lZGlhOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtbWVkaWEnKSxcblx0XHR0bzogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXRvJyksXG5cdFx0c3ViamVjdDogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXN1YmplY3QnKSxcblx0XHRib2R5OiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtYm9keScpLFxuXHRcdGlvczogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWlvcycpLFxuXHRcdHR5cGU6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS10eXBlJyksXG5cdFx0Y2VudGVyOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY2VudGVyJyksXG5cdFx0dmlld3M6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS12aWV3cycpLFxuXHRcdHpvb206IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS16b29tJyksXG5cdFx0c2VhcmNoOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtc2VhcmNoJyksXG5cdFx0c2FkZHI6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1zYWRkcicpLFxuXHRcdGRhZGRyOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtZGFkZHInKSxcblx0XHRkaXJlY3Rpb25zbW9kZTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWRpcmVjdGlvbnMtbW9kZScpLFxuXHRcdHJlcG86IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1yZXBvJyksXG5cdFx0c2hvdDogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXNob3QnKSxcblx0XHRwZW46IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1wZW4nKSxcblx0XHR2aWV3OiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdmlldycpLFxuXHRcdGlzc3VlOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtaXNzdWUnKSxcblx0XHRidXR0b25JZDogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWJ1dHRvbklkJyksXG5cdFx0cG9wVXA6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1wb3B1cCcpXG5cdH0pO1xufVxuIiwiY29uc3QgRXZlbnRzID0gcmVxdWlyZSgnLi4vc3JjL21vZHVsZXMvZXZlbnRzJyk7XG5jb25zdCBzZXREYXRhID0gcmVxdWlyZSgnLi9zZXREYXRhJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gc2hhcmU7XG5cbmZ1bmN0aW9uIHNoYXJlKGUsIG9zLCBvcGVuU2hhcmUpIHtcblx0Ly8gaWYgZHluYW1pYyBpbnN0YW5jZSB0aGVuIGZldGNoIGF0dHJpYnV0ZXMgYWdhaW4gaW4gY2FzZSBvZiB1cGRhdGVzXG5cdGlmIChvcGVuU2hhcmUuZHluYW1pYykge1xuXHRcdHNldERhdGEob3BlblNoYXJlLCBvcyk7XG5cdH1cblxuXHRvcGVuU2hhcmUuc2hhcmUoZSk7XG5cblx0Ly8gdHJpZ2dlciBzaGFyZWQgZXZlbnRcblx0RXZlbnRzLnRyaWdnZXIob3MsICdzaGFyZWQnKTtcbn1cbiIsIi8qXG4gICBTb21ldGltZXMgc29jaWFsIHBsYXRmb3JtcyBnZXQgY29uZnVzZWQgYW5kIGRyb3Agc2hhcmUgY291bnRzLlxuICAgSW4gdGhpcyBtb2R1bGUgd2UgY2hlY2sgaWYgdGhlIHJldHVybmVkIGNvdW50IGlzIGxlc3MgdGhhbiB0aGUgY291bnQgaW5cbiAgIGxvY2Fsc3RvcmFnZS5cbiAgIElmIHRoZSBsb2NhbCBjb3VudCBpcyBncmVhdGVyIHRoYW4gdGhlIHJldHVybmVkIGNvdW50LFxuICAgd2Ugc3RvcmUgdGhlIGxvY2FsIGNvdW50ICsgdGhlIHJldHVybmVkIGNvdW50LlxuICAgT3RoZXJ3aXNlLCBzdG9yZSB0aGUgcmV0dXJuZWQgY291bnQuXG4qL1xuXG5tb2R1bGUuZXhwb3J0cyA9ICh0LCBjb3VudCkgPT4ge1xuXHRjb25zdCBpc0FyciA9IHQudHlwZS5pbmRleE9mKCcsJykgPiAtMTtcblx0Y29uc3QgbG9jYWwgPSBOdW1iZXIodC5zdG9yZUdldCh0LnR5cGUgKyAnLScgKyB0LnNoYXJlZCkpO1xuXG5cdGlmIChsb2NhbCA+IGNvdW50ICYmICFpc0Fycikge1xuXHRcdGNvbnN0IGxhdGVzdENvdW50ID0gTnVtYmVyKHQuc3RvcmVHZXQodC50eXBlICsgJy0nICsgdC5zaGFyZWQgKyAnLWxhdGVzdENvdW50JykpO1xuXHRcdHQuc3RvcmVTZXQodC50eXBlICsgJy0nICsgdC5zaGFyZWQgKyAnLWxhdGVzdENvdW50JywgY291bnQpO1xuXG5cdFx0Y291bnQgPSBpc051bWVyaWMobGF0ZXN0Q291bnQpICYmIGxhdGVzdENvdW50ID4gMCA/XG5cdFx0XHRjb3VudCArPSBsb2NhbCAtIGxhdGVzdENvdW50IDpcblx0XHRcdGNvdW50ICs9IGxvY2FsO1xuXG5cdH1cblxuXHRpZiAoIWlzQXJyKSB0LnN0b3JlU2V0KHQudHlwZSArICctJyArIHQuc2hhcmVkLCBjb3VudCk7XG5cdHJldHVybiBjb3VudDtcbn07XG5cbmZ1bmN0aW9uIGlzTnVtZXJpYyhuKSB7XG4gIHJldHVybiAhaXNOYU4ocGFyc2VGbG9hdChuKSkgJiYgaXNGaW5pdGUobik7XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHtcblx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIHJlcXVpcmUoJy4vbGliL2luaXQnKSh7XG5cdFx0YXBpOiAnc2hhcmUnLFxuXHRcdHNlbGVjdG9yOiAnW2RhdGEtb3Blbi1zaGFyZV06bm90KFtkYXRhLW9wZW4tc2hhcmUtbm9kZV0pJyxcblx0XHRjYjogcmVxdWlyZSgnLi9saWIvaW5pdGlhbGl6ZVNoYXJlTm9kZScpXG5cdH0pKTtcblxuXHRyZXR1cm4gcmVxdWlyZSgnLi9zcmMvbW9kdWxlcy9zaGFyZS1hcGknKSgpO1xufSkoKTtcbiIsIi8qKlxuICogY291bnQgQVBJXG4gKi9cblxudmFyIGNvdW50ID0gcmVxdWlyZSgnLi9jb3VudCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuXG5cdC8vIGdsb2JhbCBPcGVuU2hhcmUgcmVmZXJlbmNpbmcgaW50ZXJuYWwgY2xhc3MgZm9yIGluc3RhbmNlIGdlbmVyYXRpb25cblx0Y2xhc3MgQ291bnQge1xuXG5cdFx0Y29uc3RydWN0b3Ioe1xuXHRcdFx0dHlwZSxcblx0XHRcdHVybCxcblx0XHRcdGFwcGVuZFRvID0gZmFsc2UsXG5cdFx0XHRlbGVtZW50LFxuXHRcdFx0Y2xhc3Nlc30sIGNiKSB7XG5cdFx0XHR2YXIgY291bnROb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChlbGVtZW50IHx8ICdzcGFuJyk7XG5cblx0XHRcdGNvdW50Tm9kZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudCcsIHR5cGUpO1xuXHRcdFx0Y291bnROb2RlLnNldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50LXVybCcsIHVybCk7XG5cblx0XHRcdGNvdW50Tm9kZS5jbGFzc0xpc3QuYWRkKCdvcGVuLXNoYXJlLWNvdW50Jyk7XG5cblx0XHRcdGlmIChjbGFzc2VzICYmIEFycmF5LmlzQXJyYXkoY2xhc3NlcykpIHtcblx0XHRcdFx0Y2xhc3Nlcy5mb3JFYWNoKGNzc0NMYXNzID0+IHtcblx0XHRcdFx0XHRjb3VudE5vZGUuY2xhc3NMaXN0LmFkZChjc3NDTGFzcyk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoYXBwZW5kVG8pIHtcblx0XHRcdFx0cmV0dXJuIG5ldyBjb3VudCh0eXBlLCB1cmwpLmNvdW50KGNvdW50Tm9kZSwgY2IsIGFwcGVuZFRvKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIG5ldyBjb3VudCh0eXBlLCB1cmwpLmNvdW50KGNvdW50Tm9kZSwgY2IpO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBDb3VudDtcbn07XG4iLCJjb25zdCBjb3VudFJlZHVjZSA9IHJlcXVpcmUoJy4uLy4uL2xpYi9jb3VudFJlZHVjZScpO1xuY29uc3Qgc3RvcmVDb3VudCA9IHJlcXVpcmUoJy4uLy4uL2xpYi9zdG9yZUNvdW50Jyk7XG5cbi8qKlxuICogT2JqZWN0IG9mIHRyYW5zZm9ybSBmdW5jdGlvbnMgZm9yIGVhY2ggb3BlbnNoYXJlIGFwaVxuICogVHJhbnNmb3JtIGZ1bmN0aW9ucyBwYXNzZWQgaW50byBPcGVuU2hhcmUgaW5zdGFuY2Ugd2hlbiBpbnN0YW50aWF0ZWRcbiAqIFJldHVybiBvYmplY3QgY29udGFpbmluZyBVUkwgYW5kIGtleS92YWx1ZSBhcmdzXG4gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuXG5cdC8vIGZhY2Vib29rIGNvdW50IGRhdGFcblx0ZmFjZWJvb2sgKHVybCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiAnZ2V0Jyxcblx0XHRcdHVybDogYGh0dHBzOi8vZ3JhcGguZmFjZWJvb2suY29tLz9pZD0ke3VybH1gLFxuXHRcdFx0dHJhbnNmb3JtOiBmdW5jdGlvbih4aHIpIHtcblx0XHRcdFx0bGV0IGNvdW50ID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KS5zaGFyZXM7XG5cdFx0XHRcdHJldHVybiBzdG9yZUNvdW50KHRoaXMsIGNvdW50KTtcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIHBpbnRlcmVzdCBjb3VudCBkYXRhXG5cdHBpbnRlcmVzdCAodXJsKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHR5cGU6ICdqc29ucCcsXG5cdFx0XHR1cmw6IGBodHRwczovL2FwaS5waW50ZXJlc3QuY29tL3YxL3VybHMvY291bnQuanNvbj9jYWxsYmFjaz0/JnVybD0ke3VybH1gLFxuXHRcdFx0dHJhbnNmb3JtOiBmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHRcdGxldCBjb3VudCA9IGRhdGEuY291bnQ7XG5cdFx0XHRcdHJldHVybiBzdG9yZUNvdW50KHRoaXMsIGNvdW50KTtcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIGxpbmtlZGluIGNvdW50IGRhdGFcblx0bGlua2VkaW4gKHVybCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiAnanNvbnAnLFxuXHRcdFx0dXJsOiBgaHR0cHM6Ly93d3cubGlua2VkaW4uY29tL2NvdW50c2Vydi9jb3VudC9zaGFyZT91cmw9JHt1cmx9JmZvcm1hdD1qc29ucCZjYWxsYmFjaz0/YCxcblx0XHRcdHRyYW5zZm9ybTogZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0XHRsZXQgY291bnQgPSBkYXRhLmNvdW50O1xuXHRcdFx0XHRyZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBjb3VudCk7XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyByZWRkaXQgY291bnQgZGF0YVxuXHRyZWRkaXQgKHVybCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiAnZ2V0Jyxcblx0XHRcdHVybDogYGh0dHBzOi8vd3d3LnJlZGRpdC5jb20vYXBpL2luZm8uanNvbj91cmw9JHt1cmx9YCxcblx0XHRcdHRyYW5zZm9ybTogZnVuY3Rpb24oeGhyKSB7XG5cdFx0XHRcdGxldCBwb3N0cyA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCkuZGF0YS5jaGlsZHJlbixcblx0XHRcdFx0XHR1cHMgPSAwO1xuXG5cdFx0XHRcdHBvc3RzLmZvckVhY2goKHBvc3QpID0+IHtcblx0XHRcdFx0XHR1cHMgKz0gTnVtYmVyKHBvc3QuZGF0YS51cHMpO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRyZXR1cm4gc3RvcmVDb3VudCh0aGlzLCB1cHMpO1xuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gZ29vZ2xlIGNvdW50IGRhdGFcblx0Z29vZ2xlICh1cmwpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogJ3Bvc3QnLFxuXHRcdFx0ZGF0YToge1xuXHRcdFx0XHRtZXRob2Q6ICdwb3MucGx1c29uZXMuZ2V0Jyxcblx0XHRcdFx0aWQ6ICdwJyxcblx0XHRcdFx0cGFyYW1zOiB7XG5cdFx0XHRcdFx0bm9sb2c6IHRydWUsXG5cdFx0XHRcdFx0aWQ6IHVybCxcblx0XHRcdFx0XHRzb3VyY2U6ICd3aWRnZXQnLFxuXHRcdFx0XHRcdHVzZXJJZDogJ0B2aWV3ZXInLFxuXHRcdFx0XHRcdGdyb3VwSWQ6ICdAc2VsZidcblx0XHRcdFx0fSxcblx0XHRcdFx0anNvbnJwYzogJzIuMCcsXG5cdFx0XHRcdGtleTogJ3AnLFxuXHRcdFx0XHRhcGlWZXJzaW9uOiAndjEnXG5cdFx0XHR9LFxuXHRcdFx0dXJsOiBgaHR0cHM6Ly9jbGllbnRzNi5nb29nbGUuY29tL3JwY2AsXG5cdFx0XHR0cmFuc2Zvcm06IGZ1bmN0aW9uKHhocikge1xuXHRcdFx0XHRsZXQgY291bnQgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpLnJlc3VsdC5tZXRhZGF0YS5nbG9iYWxDb3VudHMuY291bnQ7XG5cdFx0XHRcdHJldHVybiBzdG9yZUNvdW50KHRoaXMsIGNvdW50KTtcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIGdpdGh1YiBzdGFyIGNvdW50XG5cdGdpdGh1YlN0YXJzIChyZXBvKSB7XG5cdFx0cmVwbyA9IHJlcG8uaW5kZXhPZignZ2l0aHViLmNvbS8nKSA+IC0xID9cblx0XHRcdHJlcG8uc3BsaXQoJ2dpdGh1Yi5jb20vJylbMV0gOlxuXHRcdFx0cmVwbztcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogJ2dldCcsXG5cdFx0XHR1cmw6IGBodHRwczovL2FwaS5naXRodWIuY29tL3JlcG9zLyR7cmVwb31gLFxuXHRcdFx0dHJhbnNmb3JtOiBmdW5jdGlvbih4aHIpIHtcblx0XHRcdFx0bGV0IGNvdW50ID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KS5zdGFyZ2F6ZXJzX2NvdW50O1xuXHRcdFx0XHRyZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBjb3VudCk7XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBnaXRodWIgZm9ya3MgY291bnRcblx0Z2l0aHViRm9ya3MgKHJlcG8pIHtcblx0XHRyZXBvID0gcmVwby5pbmRleE9mKCdnaXRodWIuY29tLycpID4gLTEgP1xuXHRcdFx0cmVwby5zcGxpdCgnZ2l0aHViLmNvbS8nKVsxXSA6XG5cdFx0XHRyZXBvO1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiAnZ2V0Jyxcblx0XHRcdHVybDogYGh0dHBzOi8vYXBpLmdpdGh1Yi5jb20vcmVwb3MvJHtyZXBvfWAsXG5cdFx0XHR0cmFuc2Zvcm06IGZ1bmN0aW9uKHhocikge1xuXHRcdFx0XHRsZXQgY291bnQgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpLmZvcmtzX2NvdW50O1xuXHRcdFx0XHRyZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBjb3VudCk7XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBnaXRodWIgd2F0Y2hlcnMgY291bnRcblx0Z2l0aHViV2F0Y2hlcnMgKHJlcG8pIHtcblx0XHRyZXBvID0gcmVwby5pbmRleE9mKCdnaXRodWIuY29tLycpID4gLTEgP1xuXHRcdFx0cmVwby5zcGxpdCgnZ2l0aHViLmNvbS8nKVsxXSA6XG5cdFx0XHRyZXBvO1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiAnZ2V0Jyxcblx0XHRcdHVybDogYGh0dHBzOi8vYXBpLmdpdGh1Yi5jb20vcmVwb3MvJHtyZXBvfWAsXG5cdFx0XHR0cmFuc2Zvcm06IGZ1bmN0aW9uKHhocikge1xuXHRcdFx0XHRsZXQgY291bnQgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpLndhdGNoZXJzX2NvdW50O1xuXHRcdFx0XHRyZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBjb3VudCk7XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBkcmliYmJsZSBsaWtlcyBjb3VudFxuXHRkcmliYmJsZSAoc2hvdCkge1xuXHRcdHNob3QgPSBzaG90LmluZGV4T2YoJ2RyaWJiYmxlLmNvbS9zaG90cycpID4gLTEgP1xuXHRcdFx0c2hvdC5zcGxpdCgnc2hvdHMvJylbMV0gOlxuXHRcdFx0c2hvdDtcblx0XHRjb25zdCB1cmwgPSBgaHR0cHM6Ly9hcGkuZHJpYmJibGUuY29tL3YxL3Nob3RzLyR7c2hvdH0vbGlrZXNgO1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiAnZ2V0Jyxcblx0XHRcdHVybDogdXJsLFxuXHRcdFx0dHJhbnNmb3JtOiBmdW5jdGlvbih4aHIsIEV2ZW50cykge1xuXHRcdFx0XHRsZXQgY291bnQgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpLmxlbmd0aDtcblxuXHRcdFx0XHQvLyBhdCB0aGlzIHRpbWUgZHJpYmJibGUgbGltaXRzIGEgcmVzcG9uc2Ugb2YgMTIgbGlrZXMgcGVyIHBhZ2Vcblx0XHRcdFx0aWYgKGNvdW50ID09PSAxMikge1xuXHRcdFx0XHRcdGxldCBwYWdlID0gMjtcblx0XHRcdFx0XHRyZWN1cnNpdmVDb3VudCh1cmwsIHBhZ2UsIGNvdW50LCBmaW5hbENvdW50ID0+IHtcblx0XHRcdFx0XHRcdGlmICh0aGlzLmFwcGVuZFRvICYmIHR5cGVvZiB0aGlzLmFwcGVuZFRvICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMuYXBwZW5kVG8uYXBwZW5kQ2hpbGQodGhpcy5vcyk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRjb3VudFJlZHVjZSh0aGlzLm9zLCBmaW5hbENvdW50LCB0aGlzLmNiKTtcblx0XHRcdFx0XHRcdEV2ZW50cy50cmlnZ2VyKHRoaXMub3MsICdjb3VudGVkLScgKyB0aGlzLnVybCk7XG5cdFx0XHRcdFx0XHRyZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBmaW5hbENvdW50KTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBjb3VudCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdHR3aXR0ZXIgKHVybCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiAnZ2V0Jyxcblx0XHRcdHVybDogYGh0dHBzOi8vYXBpLm9wZW5zaGFyZS5zb2NpYWwvam9iP3VybD0ke3VybH1gLFxuXHRcdFx0dHJhbnNmb3JtOiBmdW5jdGlvbih4aHIpIHtcblx0XHRcdFx0bGV0IGNvdW50ID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KS5jb3VudDtcblx0XHRcdFx0cmV0dXJuIHN0b3JlQ291bnQodGhpcywgY291bnQpO1xuXHRcdFx0fVxuXHRcdH07XG5cdH1cbn07XG5cbmZ1bmN0aW9uIHJlY3Vyc2l2ZUNvdW50ICh1cmwsIHBhZ2UsIGNvdW50LCBjYikge1xuXHRjb25zdCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblx0eGhyLm9wZW4oJ0dFVCcsIHVybCArICc/cGFnZT0nICsgcGFnZSk7XG5cdHhoci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuXHRcdGNvbnN0IGxpa2VzID0gSlNPTi5wYXJzZSh0aGlzLnJlc3BvbnNlKTtcblx0XHRjb3VudCArPSBsaWtlcy5sZW5ndGg7XG5cblx0XHQvLyBkcmliYmJsZSBsaWtlIHBlciBwYWdlIGlzIDEyXG5cdFx0aWYgKGxpa2VzLmxlbmd0aCA9PT0gMTIpIHtcblx0XHRcdHBhZ2UrKztcblx0XHRcdHJlY3Vyc2l2ZUNvdW50KHVybCwgcGFnZSwgY291bnQsIGNiKTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRjYihjb3VudCk7XG5cdFx0fVxuXHR9KTtcblx0eGhyLnNlbmQoKTtcbn1cbiIsIi8qKlxuICogR2VuZXJhdGUgc2hhcmUgY291bnQgaW5zdGFuY2UgZnJvbSBvbmUgdG8gbWFueSBuZXR3b3Jrc1xuICovXG5cbmNvbnN0IENvdW50VHJhbnNmb3JtcyA9IHJlcXVpcmUoJy4vY291bnQtdHJhbnNmb3JtcycpO1xuY29uc3QgRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcbmNvbnN0IGNvdW50UmVkdWNlID0gcmVxdWlyZSgnLi4vLi4vbGliL2NvdW50UmVkdWNlJyk7XG5jb25zdCBzdG9yZUNvdW50ID0gcmVxdWlyZSgnLi4vLi4vbGliL3N0b3JlQ291bnQnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBDb3VudCB7XG5cblx0Y29uc3RydWN0b3IodHlwZSwgdXJsKSB7XG5cblx0XHQvLyB0aHJvdyBlcnJvciBpZiBubyB1cmwgcHJvdmlkZWRcblx0XHRpZiAoIXVybCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBPcGVuIFNoYXJlOiBubyB1cmwgcHJvdmlkZWQgZm9yIGNvdW50YCk7XG5cdFx0fVxuXG5cdFx0Ly8gY2hlY2sgZm9yIEdpdGh1YiBjb3VudHNcblx0XHRpZiAodHlwZS5pbmRleE9mKCdnaXRodWInKSA9PT0gMCkge1xuXHRcdFx0aWYgKHR5cGUgPT09ICdnaXRodWItc3RhcnMnKSB7XG5cdFx0XHRcdHR5cGUgPSAnZ2l0aHViU3RhcnMnO1xuXHRcdFx0fSBlbHNlIGlmICh0eXBlID09PSAnZ2l0aHViLWZvcmtzJykge1xuXHRcdFx0XHR0eXBlID0gJ2dpdGh1YkZvcmtzJztcblx0XHRcdH0gZWxzZSBpZiAodHlwZSA9PT0gJ2dpdGh1Yi13YXRjaGVycycpIHtcblx0XHRcdFx0dHlwZSA9ICdnaXRodWJXYXRjaGVycyc7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKCdJbnZhbGlkIEdpdGh1YiBjb3VudCB0eXBlLiBUcnkgZ2l0aHViLXN0YXJzLCBnaXRodWItZm9ya3MsIG9yIGdpdGh1Yi13YXRjaGVycy4nKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBpZiB0eXBlIGlzIGNvbW1hIHNlcGFyYXRlIGxpc3QgY3JlYXRlIGFycmF5XG5cdFx0aWYgKHR5cGUuaW5kZXhPZignLCcpID4gLTEpIHtcblx0XHRcdHRoaXMudHlwZSA9IHR5cGU7XG5cdFx0XHR0aGlzLnR5cGVBcnIgPSB0aGlzLnR5cGUuc3BsaXQoJywnKTtcblx0XHRcdHRoaXMuY291bnREYXRhID0gW107XG5cblx0XHRcdC8vIGNoZWNrIGVhY2ggdHlwZSBzdXBwbGllZCBpcyB2YWxpZFxuXHRcdFx0dGhpcy50eXBlQXJyLmZvckVhY2goKHQpID0+IHtcblx0XHRcdFx0aWYgKCFDb3VudFRyYW5zZm9ybXNbdF0pIHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoYE9wZW4gU2hhcmU6ICR7dHlwZX0gaXMgYW4gaW52YWxpZCBjb3VudCB0eXBlYCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR0aGlzLmNvdW50RGF0YS5wdXNoKENvdW50VHJhbnNmb3Jtc1t0XSh1cmwpKTtcblx0XHRcdH0pO1xuXG5cdFx0Ly8gdGhyb3cgZXJyb3IgaWYgaW52YWxpZCB0eXBlIHByb3ZpZGVkXG5cdFx0fSBlbHNlIGlmICghQ291bnRUcmFuc2Zvcm1zW3R5cGVdKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYE9wZW4gU2hhcmU6ICR7dHlwZX0gaXMgYW4gaW52YWxpZCBjb3VudCB0eXBlYCk7XG5cblx0XHQvLyBzaW5nbGUgY291bnRcblx0XHQvLyBzdG9yZSBjb3VudCBVUkwgYW5kIHRyYW5zZm9ybSBmdW5jdGlvblxuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLnR5cGUgPSB0eXBlO1xuXHRcdFx0dGhpcy5jb3VudERhdGEgPSBDb3VudFRyYW5zZm9ybXNbdHlwZV0odXJsKTtcblx0XHR9XG5cdH1cblxuXHQvLyBoYW5kbGUgY2FsbGluZyBnZXRDb3VudCAvIGdldENvdW50c1xuXHQvLyBkZXBlbmRpbmcgb24gbnVtYmVyIG9mIHR5cGVzXG5cdGNvdW50KG9zLCBjYiwgYXBwZW5kVG8pIHtcblx0XHR0aGlzLm9zID0gb3M7XG5cdFx0dGhpcy5hcHBlbmRUbyA9IGFwcGVuZFRvO1xuXHRcdHRoaXMuY2IgPSBjYjtcbiAgICBcdHRoaXMudXJsID0gdGhpcy5vcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudCcpO1xuXHRcdHRoaXMuc2hhcmVkID0gdGhpcy5vcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudC11cmwnKTtcblxuXHRcdGlmICghQXJyYXkuaXNBcnJheSh0aGlzLmNvdW50RGF0YSkpIHtcblx0XHRcdHRoaXMuZ2V0Q291bnQoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5nZXRDb3VudHMoKTtcblx0XHR9XG5cdH1cblxuXHQvLyBmZXRjaCBjb3VudCBlaXRoZXIgQUpBWCBvciBKU09OUFxuXHRnZXRDb3VudCgpIHtcblx0XHR2YXIgY291bnQgPSB0aGlzLnN0b3JlR2V0KHRoaXMudHlwZSArICctJyArIHRoaXMuc2hhcmVkKTtcblxuXHRcdGlmIChjb3VudCkge1xuXHRcdFx0aWYgKHRoaXMuYXBwZW5kVG8gJiYgdHlwZW9mIHRoaXMuYXBwZW5kVG8gIT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0dGhpcy5hcHBlbmRUby5hcHBlbmRDaGlsZCh0aGlzLm9zKTtcblx0XHRcdH1cblx0XHRcdGNvdW50UmVkdWNlKHRoaXMub3MsIGNvdW50KTtcblx0XHR9XG5cdFx0dGhpc1t0aGlzLmNvdW50RGF0YS50eXBlXSh0aGlzLmNvdW50RGF0YSk7XG5cdH1cblxuXHQvLyBmZXRjaCBtdWx0aXBsZSBjb3VudHMgYW5kIGFnZ3JlZ2F0ZVxuXHRnZXRDb3VudHMoKSB7XG5cdFx0dGhpcy50b3RhbCA9IFtdO1xuXG5cdFx0dmFyIGNvdW50ID0gdGhpcy5zdG9yZUdldCh0aGlzLnR5cGUgKyAnLScgKyB0aGlzLnNoYXJlZCk7XG5cblx0XHRpZiAoY291bnQpIHtcblx0XHRcdGlmICh0aGlzLmFwcGVuZFRvICAmJiB0eXBlb2YgdGhpcy5hcHBlbmRUbyAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHR0aGlzLmFwcGVuZFRvLmFwcGVuZENoaWxkKHRoaXMub3MpO1xuXHRcdFx0fVxuXHRcdFx0Y291bnRSZWR1Y2UodGhpcy5vcywgY291bnQpO1xuXHRcdH1cblxuXHRcdHRoaXMuY291bnREYXRhLmZvckVhY2goY291bnREYXRhID0+IHtcblxuXHRcdFx0dGhpc1tjb3VudERhdGEudHlwZV0oY291bnREYXRhLCAobnVtKSA9PiB7XG5cdFx0XHRcdHRoaXMudG90YWwucHVzaChudW0pO1xuXG5cdFx0XHRcdC8vIHRvdGFsIGNvdW50cyBsZW5ndGggbm93IGVxdWFscyB0eXBlIGFycmF5IGxlbmd0aFxuXHRcdFx0XHQvLyBzbyBhZ2dyZWdhdGUsIHN0b3JlIGFuZCBpbnNlcnQgaW50byBET01cblx0XHRcdFx0aWYgKHRoaXMudG90YWwubGVuZ3RoID09PSB0aGlzLnR5cGVBcnIubGVuZ3RoKSB7XG5cdFx0XHRcdFx0bGV0IHRvdCA9IDA7XG5cblx0XHRcdFx0XHR0aGlzLnRvdGFsLmZvckVhY2goKHQpID0+IHtcblx0XHRcdFx0XHRcdHRvdCArPSB0O1xuXHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0aWYgKHRoaXMuYXBwZW5kVG8gICYmIHR5cGVvZiB0aGlzLmFwcGVuZFRvICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0XHR0aGlzLmFwcGVuZFRvLmFwcGVuZENoaWxkKHRoaXMub3MpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGNvbnN0IGxvY2FsID0gTnVtYmVyKHRoaXMuc3RvcmVHZXQodGhpcy50eXBlICsgJy0nICsgdGhpcy5zaGFyZWQpKTtcblx0XHRcdFx0XHRpZiAobG9jYWwgPiB0b3QpIHtcblx0XHRcdFx0XHRcdGNvbnN0IGxhdGVzdENvdW50ID0gTnVtYmVyKHRoaXMuc3RvcmVHZXQodGhpcy50eXBlICsgJy0nICsgdGhpcy5zaGFyZWQgKyAnLWxhdGVzdENvdW50JykpO1xuXHRcdFx0XHRcdFx0dGhpcy5zdG9yZVNldCh0aGlzLnR5cGUgKyAnLScgKyB0aGlzLnNoYXJlZCArICctbGF0ZXN0Q291bnQnLCB0b3QpO1xuXG5cdFx0XHRcdFx0XHR0b3QgPSBpc051bWVyaWMobGF0ZXN0Q291bnQpICYmIGxhdGVzdENvdW50ID4gMCA/XG5cdFx0XHRcdFx0XHRcdHRvdCArPSBsb2NhbCAtIGxhdGVzdENvdW50IDpcblx0XHRcdFx0XHRcdFx0dG90ICs9IGxvY2FsO1xuXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHRoaXMuc3RvcmVTZXQodGhpcy50eXBlICsgJy0nICsgdGhpcy5zaGFyZWQsIHRvdCk7XG5cblx0XHRcdFx0XHRjb3VudFJlZHVjZSh0aGlzLm9zLCB0b3QpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdGlmICh0aGlzLmFwcGVuZFRvICAmJiB0eXBlb2YgdGhpcy5hcHBlbmRUbyAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0dGhpcy5hcHBlbmRUby5hcHBlbmRDaGlsZCh0aGlzLm9zKTtcblx0XHR9XG5cdH1cblxuXHQvLyBoYW5kbGUgSlNPTlAgcmVxdWVzdHNcblx0anNvbnAoY291bnREYXRhLCBjYikge1xuXHRcdC8vIGRlZmluZSByYW5kb20gY2FsbGJhY2sgYW5kIGFzc2lnbiB0cmFuc2Zvcm0gZnVuY3Rpb25cblx0XHRsZXQgY2FsbGJhY2sgPSBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHJpbmcoNykucmVwbGFjZSgvW15hLXpBLVpdL2csICcnKTtcblx0XHR3aW5kb3dbY2FsbGJhY2tdID0gKGRhdGEpID0+IHtcblx0XHRcdGxldCBjb3VudCA9IGNvdW50RGF0YS50cmFuc2Zvcm0uYXBwbHkodGhpcywgW2RhdGFdKSB8fCAwO1xuXG5cdFx0XHRpZiAoY2IgJiYgdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdGNiKGNvdW50KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGlmICh0aGlzLmFwcGVuZFRvICAmJiB0eXBlb2YgdGhpcy5hcHBlbmRUbyAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdHRoaXMuYXBwZW5kVG8uYXBwZW5kQ2hpbGQodGhpcy5vcyk7XG5cdFx0XHRcdH1cblx0XHRcdFx0Y291bnRSZWR1Y2UodGhpcy5vcywgY291bnQsIHRoaXMuY2IpO1xuXHRcdFx0fVxuXG5cdFx0XHRFdmVudHMudHJpZ2dlcih0aGlzLm9zLCAnY291bnRlZC0nICsgdGhpcy51cmwpO1xuXHRcdH07XG5cblx0XHQvLyBhcHBlbmQgSlNPTlAgc2NyaXB0IHRhZyB0byBwYWdlXG5cdFx0bGV0IHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuXHRcdHNjcmlwdC5zcmMgPSBjb3VudERhdGEudXJsLnJlcGxhY2UoJ2NhbGxiYWNrPT8nLCBgY2FsbGJhY2s9JHtjYWxsYmFja31gKTtcblx0XHRkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdLmFwcGVuZENoaWxkKHNjcmlwdCk7XG5cblx0XHRyZXR1cm47XG5cdH1cblxuXHQvLyBoYW5kbGUgQUpBWCBHRVQgcmVxdWVzdFxuXHRnZXQoY291bnREYXRhLCBjYikge1xuXHRcdGxldCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuXHRcdC8vIG9uIHN1Y2Nlc3MgcGFzcyByZXNwb25zZSB0byB0cmFuc2Zvcm0gZnVuY3Rpb25cblx0XHR4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gKCkgPT4ge1xuXHRcdFx0aWYgKHhoci5yZWFkeVN0YXRlID09PSA0KSB7XG5cdFx0XHRcdGlmICh4aHIuc3RhdHVzID09PSAyMDApIHtcblx0XHRcdFx0XHRsZXQgY291bnQgPSBjb3VudERhdGEudHJhbnNmb3JtLmFwcGx5KHRoaXMsIFt4aHIsIEV2ZW50c10pIHx8IDA7XG5cblx0XHRcdFx0XHRpZiAoY2IgJiYgdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0XHRjYihjb3VudCk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGlmICh0aGlzLmFwcGVuZFRvICYmIHR5cGVvZiB0aGlzLmFwcGVuZFRvICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMuYXBwZW5kVG8uYXBwZW5kQ2hpbGQodGhpcy5vcyk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRjb3VudFJlZHVjZSh0aGlzLm9zLCBjb3VudCwgdGhpcy5jYik7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0RXZlbnRzLnRyaWdnZXIodGhpcy5vcywgJ2NvdW50ZWQtJyArIHRoaXMudXJsKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gZ2V0IEFQSSBkYXRhIGZyb20nLCBjb3VudERhdGEudXJsLCAnLiBQbGVhc2UgdXNlIHRoZSBsYXRlc3QgdmVyc2lvbiBvZiBPcGVuU2hhcmUuJyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0eGhyLm9wZW4oJ0dFVCcsIGNvdW50RGF0YS51cmwpO1xuXHRcdHhoci5zZW5kKCk7XG5cdH1cblxuXHQvLyBoYW5kbGUgQUpBWCBQT1NUIHJlcXVlc3Rcblx0cG9zdChjb3VudERhdGEsIGNiKSB7XG5cdFx0bGV0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG5cdFx0Ly8gb24gc3VjY2VzcyBwYXNzIHJlc3BvbnNlIHRvIHRyYW5zZm9ybSBmdW5jdGlvblxuXHRcdHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSAoKSA9PiB7XG5cdFx0XHRpZiAoeGhyLnJlYWR5U3RhdGUgIT09IFhNTEh0dHBSZXF1ZXN0LkRPTkUgfHxcblx0XHRcdFx0eGhyLnN0YXR1cyAhPT0gMjAwKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0bGV0IGNvdW50ID0gY291bnREYXRhLnRyYW5zZm9ybS5hcHBseSh0aGlzLCBbeGhyXSkgfHwgMDtcblxuXHRcdFx0aWYgKGNiICYmIHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRjYihjb3VudCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAodGhpcy5hcHBlbmRUbyAmJiB0eXBlb2YgdGhpcy5hcHBlbmRUbyAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdHRoaXMuYXBwZW5kVG8uYXBwZW5kQ2hpbGQodGhpcy5vcyk7XG5cdFx0XHRcdH1cblx0XHRcdFx0Y291bnRSZWR1Y2UodGhpcy5vcywgY291bnQsIHRoaXMuY2IpO1xuXHRcdFx0fVxuXHRcdFx0RXZlbnRzLnRyaWdnZXIodGhpcy5vcywgJ2NvdW50ZWQtJyArIHRoaXMudXJsKTtcblx0XHR9O1xuXG5cdFx0eGhyLm9wZW4oJ1BPU1QnLCBjb3VudERhdGEudXJsKTtcblx0XHR4aHIuc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb247Y2hhcnNldD1VVEYtOCcpO1xuXHRcdHhoci5zZW5kKEpTT04uc3RyaW5naWZ5KGNvdW50RGF0YS5kYXRhKSk7XG5cdH1cblxuXHRzdG9yZVNldCh0eXBlLCBjb3VudCA9IDApIHtcblx0XHRpZiAoIXdpbmRvdy5sb2NhbFN0b3JhZ2UgfHwgIXR5cGUpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRsb2NhbFN0b3JhZ2Uuc2V0SXRlbShgT3BlblNoYXJlLSR7dHlwZX1gLCBjb3VudCk7XG5cdH1cblxuXHRzdG9yZUdldCh0eXBlKSB7XG5cdFx0aWYgKCF3aW5kb3cubG9jYWxTdG9yYWdlIHx8ICF0eXBlKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGxvY2FsU3RvcmFnZS5nZXRJdGVtKGBPcGVuU2hhcmUtJHt0eXBlfWApO1xuXHR9XG5cbn07XG5cbmZ1bmN0aW9uIGlzTnVtZXJpYyhuKSB7XG4gIHJldHVybiAhaXNOYU4ocGFyc2VGbG9hdChuKSkgJiYgaXNGaW5pdGUobik7XG59XG4iLCIvKipcbiAqIFRyaWdnZXIgY3VzdG9tIE9wZW5TaGFyZSBuYW1lc3BhY2VkIGV2ZW50XG4gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuXHR0cmlnZ2VyOiBmdW5jdGlvbihlbGVtZW50LCBldmVudCkge1xuXHRcdGxldCBldiA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdFdmVudCcpO1xuXHRcdGV2LmluaXRFdmVudCgnT3BlblNoYXJlLicgKyBldmVudCwgdHJ1ZSwgdHJ1ZSk7XG5cdFx0ZWxlbWVudC5kaXNwYXRjaEV2ZW50KGV2KTtcblx0fVxufTtcbiIsIi8qKlxuICogT3BlblNoYXJlIGdlbmVyYXRlcyBhIHNpbmdsZSBzaGFyZSBsaW5rXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgT3BlblNoYXJlIHtcblxuXHRjb25zdHJ1Y3Rvcih0eXBlLCB0cmFuc2Zvcm0pIHtcblx0XHR0aGlzLmlvcyA9IC9pUGFkfGlQaG9uZXxpUG9kLy50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpICYmICF3aW5kb3cuTVNTdHJlYW07XG5cdFx0dGhpcy50eXBlID0gdHlwZTtcblx0XHR0aGlzLmR5bmFtaWMgPSBmYWxzZTtcblx0XHR0aGlzLnRyYW5zZm9ybSA9IHRyYW5zZm9ybTtcblxuXHRcdC8vIGNhcGl0YWxpemVkIHR5cGVcblx0XHR0aGlzLnR5cGVDYXBzID0gdHlwZS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHR5cGUuc2xpY2UoMSk7XG5cdH1cblxuXHQvLyByZXR1cm5zIGZ1bmN0aW9uIG5hbWVkIGFzIHR5cGUgc2V0IGluIGNvbnN0cnVjdG9yXG5cdC8vIGUuZyB0d2l0dGVyKClcblx0c2V0RGF0YShkYXRhKSB7XG5cdFx0Ly8gaWYgaU9TIHVzZXIgYW5kIGlvcyBkYXRhIGF0dHJpYnV0ZSBkZWZpbmVkXG5cdFx0Ly8gYnVpbGQgaU9TIFVSTCBzY2hlbWUgYXMgc2luZ2xlIHN0cmluZ1xuXHRcdGlmICh0aGlzLmlvcykge1xuXHRcdFx0dGhpcy50cmFuc2Zvcm1EYXRhID0gdGhpcy50cmFuc2Zvcm0oZGF0YSwgdHJ1ZSk7XG5cdFx0XHR0aGlzLm1vYmlsZVNoYXJlVXJsID0gdGhpcy50ZW1wbGF0ZSh0aGlzLnRyYW5zZm9ybURhdGEudXJsLCB0aGlzLnRyYW5zZm9ybURhdGEuZGF0YSk7XG5cdFx0fVxuXG5cdFx0dGhpcy50cmFuc2Zvcm1EYXRhID0gdGhpcy50cmFuc2Zvcm0oZGF0YSk7XG5cdFx0dGhpcy5zaGFyZVVybCA9IHRoaXMudGVtcGxhdGUodGhpcy50cmFuc2Zvcm1EYXRhLnVybCwgdGhpcy50cmFuc2Zvcm1EYXRhLmRhdGEpO1xuXHR9XG5cblx0Ly8gb3BlbiBzaGFyZSBVUkwgZGVmaW5lZCBpbiBpbmRpdmlkdWFsIHBsYXRmb3JtIGZ1bmN0aW9uc1xuXHRzaGFyZShlKSB7XG5cdFx0Ly8gaWYgaU9TIHNoYXJlIFVSTCBoYXMgYmVlbiBzZXQgdGhlbiB1c2UgdGltZW91dCBoYWNrXG5cdFx0Ly8gdGVzdCBmb3IgbmF0aXZlIGFwcCBhbmQgZmFsbCBiYWNrIHRvIHdlYlxuXHRcdGlmICh0aGlzLm1vYmlsZVNoYXJlVXJsKSB7XG5cdFx0XHR2YXIgc3RhcnQgPSAobmV3IERhdGUoKSkudmFsdWVPZigpO1xuXG5cdFx0XHRzZXRUaW1lb3V0KCgpID0+IHtcblx0XHRcdFx0dmFyIGVuZCA9IChuZXcgRGF0ZSgpKS52YWx1ZU9mKCk7XG5cblx0XHRcdFx0Ly8gaWYgdGhlIHVzZXIgaXMgc3RpbGwgaGVyZSwgZmFsbCBiYWNrIHRvIHdlYlxuXHRcdFx0XHRpZiAoZW5kIC0gc3RhcnQgPiAxNjAwKSB7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0d2luZG93LmxvY2F0aW9uID0gdGhpcy5zaGFyZVVybDtcblx0XHRcdH0sIDE1MDApO1xuXG5cdFx0XHR3aW5kb3cubG9jYXRpb24gPSB0aGlzLm1vYmlsZVNoYXJlVXJsO1xuXG5cdFx0Ly8gb3BlbiBtYWlsdG8gbGlua3MgaW4gc2FtZSB3aW5kb3dcblx0XHR9IGVsc2UgaWYgKHRoaXMudHlwZSA9PT0gJ2VtYWlsJykge1xuXHRcdFx0d2luZG93LmxvY2F0aW9uID0gdGhpcy5zaGFyZVVybDtcblxuXHRcdC8vIG9wZW4gc29jaWFsIHNoYXJlIFVSTHMgaW4gbmV3IHdpbmRvd1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBpZiBwb3B1cCBvYmplY3QgcHJlc2VudCB0aGVuIHNldCB3aW5kb3cgZGltZW5zaW9ucyAvIHBvc2l0aW9uXG5cdFx0XHRpZih0aGlzLnBvcHVwICYmIHRoaXMudHJhbnNmb3JtRGF0YS5wb3B1cCkge1xuXHRcdFx0XHR0aGlzLm9wZW5XaW5kb3codGhpcy5zaGFyZVVybCwgdGhpcy50cmFuc2Zvcm1EYXRhLnBvcHVwKTtcblx0XHRcdH1cblxuXHRcdFx0d2luZG93Lm9wZW4odGhpcy5zaGFyZVVybCk7XG5cdFx0fVxuXHR9XG5cblx0Ly8gY3JlYXRlIHNoYXJlIFVSTCB3aXRoIEdFVCBwYXJhbXNcblx0Ly8gYXBwZW5kaW5nIHZhbGlkIHByb3BlcnRpZXMgdG8gcXVlcnkgc3RyaW5nXG5cdHRlbXBsYXRlKHVybCwgZGF0YSkge1xuXHRcdGxldCBub25VUkxQcm9wcyA9IFtcblx0XHRcdCdhcHBlbmRUbycsXG5cdFx0XHQnaW5uZXJIVE1MJyxcblx0XHRcdCdjbGFzc2VzJ1xuXHRcdF07XG5cblx0XHRsZXQgc2hhcmVVcmwgPSB1cmwsXG5cdFx0XHRpO1xuXG5cdFx0Zm9yIChpIGluIGRhdGEpIHtcblx0XHRcdC8vIG9ubHkgYXBwZW5kIHZhbGlkIHByb3BlcnRpZXNcblx0XHRcdGlmICghZGF0YVtpXSB8fCBub25VUkxQcm9wcy5pbmRleE9mKGkpID4gLTEpIHtcblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHR9XG5cblx0XHRcdC8vIGFwcGVuZCBVUkwgZW5jb2RlZCBHRVQgcGFyYW0gdG8gc2hhcmUgVVJMXG5cdFx0XHRkYXRhW2ldID0gZW5jb2RlVVJJQ29tcG9uZW50KGRhdGFbaV0pO1xuXHRcdFx0c2hhcmVVcmwgKz0gYCR7aX09JHtkYXRhW2ldfSZgO1xuXHRcdH1cblxuXHRcdHJldHVybiBzaGFyZVVybC5zdWJzdHIoMCwgc2hhcmVVcmwubGVuZ3RoIC0gMSk7XG5cdH1cblxuXHQvLyBjZW50ZXIgcG9wdXAgd2luZG93IHN1cHBvcnRpbmcgZHVhbCBzY3JlZW5zXG5cdG9wZW5XaW5kb3codXJsLCBvcHRpb25zKSB7XG5cdFx0bGV0IGR1YWxTY3JlZW5MZWZ0ID0gd2luZG93LnNjcmVlbkxlZnQgIT0gdW5kZWZpbmVkID8gd2luZG93LnNjcmVlbkxlZnQgOiBzY3JlZW4ubGVmdCxcblx0XHRcdGR1YWxTY3JlZW5Ub3AgPSB3aW5kb3cuc2NyZWVuVG9wICE9IHVuZGVmaW5lZCA/IHdpbmRvdy5zY3JlZW5Ub3AgOiBzY3JlZW4udG9wLFxuXHRcdFx0d2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aCA/IHdpbmRvdy5pbm5lcldpZHRoIDogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoID8gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoIDogc2NyZWVuLndpZHRoLFxuXHRcdFx0aGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0ID8gd2luZG93LmlubmVySGVpZ2h0IDogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodCA/IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQgOiBzY3JlZW4uaGVpZ2h0LFxuXHRcdFx0bGVmdCA9ICgod2lkdGggLyAyKSAtIChvcHRpb25zLndpZHRoIC8gMikpICsgZHVhbFNjcmVlbkxlZnQsXG5cdFx0XHR0b3AgPSAoKGhlaWdodCAvIDIpIC0gKG9wdGlvbnMuaGVpZ2h0IC8gMikpICsgZHVhbFNjcmVlblRvcCxcblx0XHRcdG5ld1dpbmRvdyA9IHdpbmRvdy5vcGVuKHVybCwgJ09wZW5TaGFyZScsIGB3aWR0aD0ke29wdGlvbnMud2lkdGh9LCBoZWlnaHQ9JHtvcHRpb25zLmhlaWdodH0sIHRvcD0ke3RvcH0sIGxlZnQ9JHtsZWZ0fWApO1xuXG5cdFx0Ly8gUHV0cyBmb2N1cyBvbiB0aGUgbmV3V2luZG93XG5cdFx0aWYgKHdpbmRvdy5mb2N1cykge1xuXHRcdFx0bmV3V2luZG93LmZvY3VzKCk7XG5cdFx0fVxuXHR9XG59O1xuIiwiLyoqXG4gKiBHbG9iYWwgT3BlblNoYXJlIEFQSSB0byBnZW5lcmF0ZSBpbnN0YW5jZXMgcHJvZ3JhbW1hdGljYWxseVxuICovXG5cbmNvbnN0IE9TID0gcmVxdWlyZSgnLi9vcGVuLXNoYXJlJyk7XG5jb25zdCBTaGFyZVRyYW5zZm9ybXMgPSByZXF1aXJlKCcuL3NoYXJlLXRyYW5zZm9ybXMnKTtcbmNvbnN0IEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG5jb25zdCBkYXNoVG9DYW1lbCA9IHJlcXVpcmUoJy4uLy4uL2xpYi9kYXNoVG9DYW1lbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuXG5cdC8vIGdsb2JhbCBPcGVuU2hhcmUgcmVmZXJlbmNpbmcgaW50ZXJuYWwgY2xhc3MgZm9yIGluc3RhbmNlIGdlbmVyYXRpb25cblx0Y2xhc3MgT3BlblNoYXJlIHtcblxuXHRcdGNvbnN0cnVjdG9yKGRhdGEsIGVsZW1lbnQpIHtcblxuXHRcdFx0aWYgKCFkYXRhLmJpbmRDbGljaykgZGF0YS5iaW5kQ2xpY2sgPSB0cnVlO1xuXG5cdFx0XHRsZXQgZGFzaCA9IGRhdGEudHlwZS5pbmRleE9mKCctJyk7XG5cblx0XHRcdGlmIChkYXNoID4gLTEpIHtcblx0XHRcdFx0ZGF0YS50eXBlID0gZGFzaFRvQ2FtZWwoZGFzaCwgZGF0YS50eXBlKTtcblx0XHRcdH1cblxuXHRcdFx0bGV0IG5vZGU7XG5cdFx0XHR0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuXHRcdFx0dGhpcy5kYXRhID0gZGF0YTtcblxuXHRcdFx0dGhpcy5vcyA9IG5ldyBPUyhkYXRhLnR5cGUsIFNoYXJlVHJhbnNmb3Jtc1tkYXRhLnR5cGVdKTtcblx0XHRcdHRoaXMub3Muc2V0RGF0YShkYXRhKTtcblxuXHRcdFx0aWYgKCFlbGVtZW50IHx8IGRhdGEuZWxlbWVudCkge1xuXHRcdFx0XHRlbGVtZW50ID0gZGF0YS5lbGVtZW50O1xuXHRcdFx0XHRub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChlbGVtZW50IHx8ICdhJyk7XG5cdFx0XHRcdGlmIChkYXRhLnR5cGUpIHtcblx0XHRcdFx0XHRub2RlLmNsYXNzTGlzdC5hZGQoJ29wZW4tc2hhcmUtbGluaycsIGRhdGEudHlwZSk7XG5cdFx0XHRcdFx0bm9kZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZScsIGRhdGEudHlwZSk7XG5cdFx0XHRcdFx0bm9kZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1ub2RlJywgZGF0YS50eXBlKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoZGF0YS5pbm5lckhUTUwpIG5vZGUuaW5uZXJIVE1MID0gZGF0YS5pbm5lckhUTUw7XG5cdFx0XHR9XG5cdFx0XHRpZiAobm9kZSkgZWxlbWVudCA9IG5vZGU7XG5cblx0XHRcdGlmIChkYXRhLmJpbmRDbGljaykge1xuXHRcdFx0XHRlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcblx0XHRcdFx0XHR0aGlzLnNoYXJlKCk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGF0YS5hcHBlbmRUbykge1xuXHRcdFx0XHRkYXRhLmFwcGVuZFRvLmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGF0YS5jbGFzc2VzICYmIEFycmF5LmlzQXJyYXkoZGF0YS5jbGFzc2VzKSkge1xuXHRcdFx0XHRkYXRhLmNsYXNzZXMuZm9yRWFjaChjc3NDbGFzcyA9PiB7XG5cdFx0XHRcdFx0ZWxlbWVudC5jbGFzc0xpc3QuYWRkKGNzc0NsYXNzKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkYXRhLnR5cGUudG9Mb3dlckNhc2UoKSA9PT0gJ3BheXBhbCcpIHtcblx0XHRcdFx0Y29uc3QgYWN0aW9uID0gZGF0YS5zYW5kYm94ID9cblx0XHRcdFx0ICAgXCJodHRwczovL3d3dy5zYW5kYm94LnBheXBhbC5jb20vY2dpLWJpbi93ZWJzY3JcIiA6XG5cdFx0XHRcdCAgIFwiaHR0cHM6Ly93d3cucGF5cGFsLmNvbS9jZ2ktYmluL3dlYnNjclwiO1xuXG5cdFx0XHRcdGNvbnN0IGJ1eUdJRiA9IGRhdGEuc2FuZGJveCA/XG5cdFx0XHRcdFx0XCJodHRwczovL3d3dy5zYW5kYm94LnBheXBhbC5jb20vZW5fVVMvaS9idG4vYnRuX2J1eW5vd19MRy5naWZcIiA6XG5cdFx0XHRcdFx0XCJodHRwczovL3d3dy5wYXlwYWxvYmplY3RzLmNvbS9lbl9VUy9pL2J0bi9idG5fYnV5bm93X0xHLmdpZlwiO1xuXG5cdFx0XHRcdGNvbnN0IHBpeGVsR0lGID0gZGF0YS5zYW5kYm94ID9cblx0XHRcdFx0XHRcImh0dHBzOi8vd3d3LnNhbmRib3gucGF5cGFsLmNvbS9lbl9VUy9pL3Njci9waXhlbC5naWZcIiA6XG5cdFx0XHRcdFx0XCJodHRwczovL3d3dy5wYXlwYWxvYmplY3RzLmNvbS9lbl9VUy9pL3Njci9waXhlbC5naWZcIjtcblxuXG5cdFx0XHRcdGNvbnN0IHBheXBhbEJ1dHRvbiA9IGA8Zm9ybSBhY3Rpb249JHthY3Rpb259IG1ldGhvZD1cInBvc3RcIiB0YXJnZXQ9XCJfYmxhbmtcIj5cblxuXHRcdFx0XHQgIDwhLS0gU2F2ZWQgYnV0dG9ucyB1c2UgdGhlIFwic2VjdXJlIGNsaWNrXCIgY29tbWFuZCAtLT5cblx0XHRcdFx0ICA8aW5wdXQgdHlwZT1cImhpZGRlblwiIG5hbWU9XCJjbWRcIiB2YWx1ZT1cIl9zLXhjbGlja1wiPlxuXG5cdFx0XHRcdCAgPCEtLSBTYXZlZCBidXR0b25zIGFyZSBpZGVudGlmaWVkIGJ5IHRoZWlyIGJ1dHRvbiBJRHMgLS0+XG5cdFx0XHRcdCAgPGlucHV0IHR5cGU9XCJoaWRkZW5cIiBuYW1lPVwiaG9zdGVkX2J1dHRvbl9pZFwiIHZhbHVlPVwiJHtkYXRhLmJ1dHRvbklkfVwiPlxuXG5cdFx0XHRcdCAgPCEtLSBTYXZlZCBidXR0b25zIGRpc3BsYXkgYW4gYXBwcm9wcmlhdGUgYnV0dG9uIGltYWdlLiAtLT5cblx0XHRcdFx0ICA8aW5wdXQgdHlwZT1cImltYWdlXCIgbmFtZT1cInN1Ym1pdFwiXG5cdFx0XHRcdCAgICBzcmM9JHtidXlHSUZ9XG5cdFx0XHRcdCAgICBhbHQ9XCJQYXlQYWwgLSBUaGUgc2FmZXIsIGVhc2llciB3YXkgdG8gcGF5IG9ubGluZVwiPlxuXHRcdFx0XHQgIDxpbWcgYWx0PVwiXCIgd2lkdGg9XCIxXCIgaGVpZ2h0PVwiMVwiXG5cdFx0XHRcdCAgICBzcmM9JHtwaXhlbEdJRn0gPlxuXG5cdFx0XHRcdDwvZm9ybT5gO1xuXG5cdFx0XHRcdGNvbnN0IGhpZGRlbkRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHRcdFx0XHRoaWRkZW5EaXYuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblx0XHRcdFx0aGlkZGVuRGl2LmlubmVySFRNTCA9IHBheXBhbEJ1dHRvbjtcblx0XHRcdFx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChoaWRkZW5EaXYpO1xuXG5cdFx0XHRcdHRoaXMucGF5cGFsID0gaGlkZGVuRGl2LnF1ZXJ5U2VsZWN0b3IoJ2Zvcm0nKTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5lbGVtZW50ID0gZWxlbWVudDtcblx0XHRcdHJldHVybiBlbGVtZW50O1xuXHRcdH1cblxuXHRcdC8vIHB1YmxpYyBzaGFyZSBtZXRob2QgdG8gdHJpZ2dlciBzaGFyZSBwcm9ncmFtbWF0aWNhbGx5XG5cdFx0c2hhcmUoZSkge1xuXHRcdFx0Ly8gaWYgZHluYW1pYyBpbnN0YW5jZSB0aGVuIGZldGNoIGF0dHJpYnV0ZXMgYWdhaW4gaW4gY2FzZSBvZiB1cGRhdGVzXG5cdFx0XHRpZiAodGhpcy5kYXRhLmR5bmFtaWMpIHtcblx0XHRcdFx0dGhpcy5vcy5zZXREYXRhKGRhdGEpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAodGhpcy5kYXRhLnR5cGUudG9Mb3dlckNhc2UoKSA9PT0gJ3BheXBhbCcpIHtcblx0XHRcdFx0dGhpcy5wYXlwYWwuc3VibWl0KCk7XG5cdFx0XHR9IGVsc2UgdGhpcy5vcy5zaGFyZShlKTtcblxuXHRcdFx0RXZlbnRzLnRyaWdnZXIodGhpcy5lbGVtZW50LCAnc2hhcmVkJyk7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIE9wZW5TaGFyZTtcbn07XG4iLCIvKipcbiAqIE9iamVjdCBvZiB0cmFuc2Zvcm0gZnVuY3Rpb25zIGZvciBlYWNoIG9wZW5zaGFyZSBhcGlcbiAqIFRyYW5zZm9ybSBmdW5jdGlvbnMgcGFzc2VkIGludG8gT3BlblNoYXJlIGluc3RhbmNlIHdoZW4gaW5zdGFudGlhdGVkXG4gKiBSZXR1cm4gb2JqZWN0IGNvbnRhaW5pbmcgVVJMIGFuZCBrZXkvdmFsdWUgYXJnc1xuICovXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuXHQvLyBzZXQgVHdpdHRlciBzaGFyZSBVUkxcblx0dHdpdHRlcjogZnVuY3Rpb24oZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHQvLyBpZiBpT1MgdXNlciBhbmQgaW9zIGRhdGEgYXR0cmlidXRlIGRlZmluZWRcblx0XHQvLyBidWlsZCBpT1MgVVJMIHNjaGVtZSBhcyBzaW5nbGUgc3RyaW5nXG5cdFx0aWYgKGlvcyAmJiBkYXRhLmlvcykge1xuXG5cdFx0XHRsZXQgbWVzc2FnZSA9IGBgO1xuXG5cdFx0XHRpZiAoZGF0YS50ZXh0KSB7XG5cdFx0XHRcdG1lc3NhZ2UgKz0gZGF0YS50ZXh0O1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGF0YS51cmwpIHtcblx0XHRcdFx0bWVzc2FnZSArPSBgIC0gJHtkYXRhLnVybH1gO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGF0YS5oYXNodGFncykge1xuXHRcdFx0XHRsZXQgdGFncyA9IGRhdGEuaGFzaHRhZ3Muc3BsaXQoJywnKTtcblx0XHRcdFx0dGFncy5mb3JFYWNoKGZ1bmN0aW9uKHRhZykge1xuXHRcdFx0XHRcdG1lc3NhZ2UgKz0gYCAjJHt0YWd9YDtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkYXRhLnZpYSkge1xuXHRcdFx0XHRtZXNzYWdlICs9IGAgdmlhICR7ZGF0YS52aWF9YDtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0dXJsOiAndHdpdHRlcjovL3Bvc3Q/Jyxcblx0XHRcdFx0ZGF0YToge1xuXHRcdFx0XHRcdG1lc3NhZ2U6IG1lc3NhZ2Vcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiAnaHR0cHM6Ly90d2l0dGVyLmNvbS9zaGFyZT8nLFxuXHRcdFx0ZGF0YTogZGF0YSxcblx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdHdpZHRoOiA3MDAsXG5cdFx0XHRcdGhlaWdodDogMjk2XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBzZXQgVHdpdHRlciByZXR3ZWV0IFVSTFxuXHR0d2l0dGVyUmV0d2VldDogZnVuY3Rpb24oZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHQvLyBpZiBpT1MgdXNlciBhbmQgaW9zIGRhdGEgYXR0cmlidXRlIGRlZmluZWRcblx0XHRpZiAoaW9zICYmIGRhdGEuaW9zKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR1cmw6ICd0d2l0dGVyOi8vc3RhdHVzPycsXG5cdFx0XHRcdGRhdGE6IHtcblx0XHRcdFx0XHRpZDogZGF0YS50d2VldElkXG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybDogJ2h0dHBzOi8vdHdpdHRlci5jb20vaW50ZW50L3JldHdlZXQ/Jyxcblx0XHRcdGRhdGE6IHtcblx0XHRcdFx0dHdlZXRfaWQ6IGRhdGEudHdlZXRJZCxcblx0XHRcdFx0cmVsYXRlZDogZGF0YS5yZWxhdGVkXG5cdFx0XHR9LFxuXHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0d2lkdGg6IDcwMCxcblx0XHRcdFx0aGVpZ2h0OiAyOTZcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBUd2l0dGVyIGxpa2UgVVJMXG5cdHR3aXR0ZXJMaWtlOiBmdW5jdGlvbihkYXRhLCBpb3MgPSBmYWxzZSkge1xuXHRcdC8vIGlmIGlPUyB1c2VyIGFuZCBpb3MgZGF0YSBhdHRyaWJ1dGUgZGVmaW5lZFxuXHRcdGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVybDogJ3R3aXR0ZXI6Ly9zdGF0dXM/Jyxcblx0XHRcdFx0ZGF0YToge1xuXHRcdFx0XHRcdGlkOiBkYXRhLnR3ZWV0SWRcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiAnaHR0cHM6Ly90d2l0dGVyLmNvbS9pbnRlbnQvZmF2b3JpdGU/Jyxcblx0XHRcdGRhdGE6IHtcblx0XHRcdFx0dHdlZXRfaWQ6IGRhdGEudHdlZXRJZCxcblx0XHRcdFx0cmVsYXRlZDogZGF0YS5yZWxhdGVkXG5cdFx0XHR9LFxuXHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0d2lkdGg6IDcwMCxcblx0XHRcdFx0aGVpZ2h0OiAyOTZcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBUd2l0dGVyIGZvbGxvdyBVUkxcblx0dHdpdHRlckZvbGxvdzogZnVuY3Rpb24oZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHQvLyBpZiBpT1MgdXNlciBhbmQgaW9zIGRhdGEgYXR0cmlidXRlIGRlZmluZWRcblx0XHRpZiAoaW9zICYmIGRhdGEuaW9zKSB7XG5cdFx0XHRsZXQgaW9zRGF0YSA9IGRhdGEuc2NyZWVuTmFtZSA/IHtcblx0XHRcdFx0J3NjcmVlbl9uYW1lJzogZGF0YS5zY3JlZW5OYW1lXG5cdFx0XHR9IDoge1xuXHRcdFx0XHQnaWQnOiBkYXRhLnVzZXJJZFxuXHRcdFx0fTtcblxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0dXJsOiAndHdpdHRlcjovL3VzZXI/Jyxcblx0XHRcdFx0ZGF0YTogaW9zRGF0YVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiAnaHR0cHM6Ly90d2l0dGVyLmNvbS9pbnRlbnQvdXNlcj8nLFxuXHRcdFx0ZGF0YToge1xuXHRcdFx0XHRzY3JlZW5fbmFtZTogZGF0YS5zY3JlZW5OYW1lLFxuXHRcdFx0XHR1c2VyX2lkOiBkYXRhLnVzZXJJZFxuXHRcdFx0fSxcblx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdHdpZHRoOiA3MDAsXG5cdFx0XHRcdGhlaWdodDogMjk2XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBzZXQgRmFjZWJvb2sgc2hhcmUgVVJMXG5cdGZhY2Vib29rOiBmdW5jdGlvbihkYXRhKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybDogJ2h0dHBzOi8vd3d3LmZhY2Vib29rLmNvbS9kaWFsb2cvZmVlZD9hcHBfaWQ9OTYxMzQyNTQzOTIyMzIyJnJlZGlyZWN0X3VyaT1odHRwOi8vZmFjZWJvb2suY29tJicsXG5cdFx0XHRkYXRhOiBkYXRhLFxuXHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0d2lkdGg6IDU2MCxcblx0XHRcdFx0aGVpZ2h0OiA1OTNcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBGYWNlYm9vayBzZW5kIFVSTFxuXHRmYWNlYm9va1NlbmQ6IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiAnaHR0cHM6Ly93d3cuZmFjZWJvb2suY29tL2RpYWxvZy9zZW5kP2FwcF9pZD05NjEzNDI1NDM5MjIzMjImcmVkaXJlY3RfdXJpPWh0dHA6Ly9mYWNlYm9vay5jb20mJyxcblx0XHRcdGRhdGE6IGRhdGEsXG5cdFx0XHRwb3B1cDoge1xuXHRcdFx0XHR3aWR0aDogOTgwLFxuXHRcdFx0XHRoZWlnaHQ6IDU5NlxuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gc2V0IFlvdVR1YmUgcGxheSBVUkxcblx0eW91dHViZTogZnVuY3Rpb24oZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHQvLyBpZiBpT1MgdXNlclxuXHRcdGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVybDogYHlvdXR1YmU6JHtkYXRhLnZpZGVvfT9gXG5cdFx0XHR9O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR1cmw6IGBodHRwczovL3d3dy55b3V0dWJlLmNvbS93YXRjaD92PSR7ZGF0YS52aWRlb30/YCxcblx0XHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0XHR3aWR0aDogMTA4Nixcblx0XHRcdFx0XHRoZWlnaHQ6IDYwOFxuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdH1cblx0fSxcblxuXHQvLyBzZXQgWW91VHViZSBzdWJjcmliZSBVUkxcblx0eW91dHViZVN1YnNjcmliZTogZnVuY3Rpb24oZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHQvLyBpZiBpT1MgdXNlclxuXHRcdGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVybDogYHlvdXR1YmU6Ly93d3cueW91dHViZS5jb20vdXNlci8ke2RhdGEudXNlcn0/YFxuXHRcdFx0fTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0dXJsOiBgaHR0cHM6Ly93d3cueW91dHViZS5jb20vdXNlci8ke2RhdGEudXNlcn0/YCxcblx0XHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0XHR3aWR0aDogODgwLFxuXHRcdFx0XHRcdGhlaWdodDogMzUwXG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0fVxuXHR9LFxuXG5cdC8vIHNldCBJbnN0YWdyYW0gZm9sbG93IFVSTFxuXHRpbnN0YWdyYW06IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiBgaW5zdGFncmFtOi8vY2FtZXJhP2Bcblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBJbnN0YWdyYW0gZm9sbG93IFVSTFxuXHRpbnN0YWdyYW1Gb2xsb3c6IGZ1bmN0aW9uKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG5cdFx0Ly8gaWYgaU9TIHVzZXJcblx0XHRpZiAoaW9zICYmIGRhdGEuaW9zKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR1cmw6ICdpbnN0YWdyYW06Ly91c2VyPycsXG5cdFx0XHRcdGRhdGE6IGRhdGFcblx0XHRcdH07XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVybDogYGh0dHA6Ly93d3cuaW5zdGFncmFtLmNvbS8ke2RhdGEudXNlcm5hbWV9P2AsXG5cdFx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdFx0d2lkdGg6IDk4MCxcblx0XHRcdFx0XHRoZWlnaHQ6IDY1NVxuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdH1cblx0fSxcblxuXHQvLyBzZXQgU25hcGNoYXQgZm9sbG93IFVSTFxuXHRzbmFwY2hhdCAoZGF0YSkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6IGBzbmFwY2hhdDovL2FkZC8ke2RhdGEudXNlcm5hbWV9P2Bcblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBHb29nbGUgc2hhcmUgVVJMXG5cdGdvb2dsZSAoZGF0YSkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6ICdodHRwczovL3BsdXMuZ29vZ2xlLmNvbS9zaGFyZT8nLFxuXHRcdFx0ZGF0YTogZGF0YSxcblx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdHdpZHRoOiA0OTUsXG5cdFx0XHRcdGhlaWdodDogODE1XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBzZXQgR29vZ2xlIG1hcHMgVVJMXG5cdGdvb2dsZU1hcHMgKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG5cblx0XHRpZiAoZGF0YS5zZWFyY2gpIHtcblx0XHRcdGRhdGEucSA9IGRhdGEuc2VhcmNoO1xuXHRcdFx0ZGVsZXRlIGRhdGEuc2VhcmNoO1xuXHRcdH1cblxuXHRcdC8vIGlmIGlPUyB1c2VyIGFuZCBpb3MgZGF0YSBhdHRyaWJ1dGUgZGVmaW5lZFxuXHRcdGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVybDogJ2NvbWdvb2dsZW1hcHM6Ly8/Jyxcblx0XHRcdFx0ZGF0YTogaW9zXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdGlmICghaW9zICYmIGRhdGEuaW9zKSB7XG5cdFx0XHRkZWxldGUgZGF0YS5pb3M7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybDogJ2h0dHBzOi8vbWFwcy5nb29nbGUuY29tLz8nLFxuXHRcdFx0ZGF0YTogZGF0YSxcblx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdHdpZHRoOiA4MDAsXG5cdFx0XHRcdGhlaWdodDogNjAwXG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBzZXQgUGludGVyZXN0IHNoYXJlIFVSTFxuXHRwaW50ZXJlc3QgKGRhdGEpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiAnaHR0cHM6Ly9waW50ZXJlc3QuY29tL3Bpbi9jcmVhdGUvYm9va21hcmtsZXQvPycsXG5cdFx0XHRkYXRhOiBkYXRhLFxuXHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0d2lkdGg6IDc0NSxcblx0XHRcdFx0aGVpZ2h0OiA2MjBcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBMaW5rZWRJbiBzaGFyZSBVUkxcblx0bGlua2VkaW4gKGRhdGEpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiAnaHR0cDovL3d3dy5saW5rZWRpbi5jb20vc2hhcmVBcnRpY2xlPycsXG5cdFx0XHRkYXRhOiBkYXRhLFxuXHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0d2lkdGg6IDc4MCxcblx0XHRcdFx0aGVpZ2h0OiA0OTJcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBCdWZmZXIgc2hhcmUgVVJMXG5cdGJ1ZmZlciAoZGF0YSkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6ICdodHRwOi8vYnVmZmVyYXBwLmNvbS9hZGQ/Jyxcblx0XHRcdGRhdGE6IGRhdGEsXG5cdFx0XHRwb3B1cDoge1xuXHRcdFx0XHR3aWR0aDogNzQ1LFxuXHRcdFx0XHRoZWlnaHQ6IDM0NVxuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gc2V0IFR1bWJsciBzaGFyZSBVUkxcblx0dHVtYmxyIChkYXRhKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybDogJ2h0dHBzOi8vd3d3LnR1bWJsci5jb20vd2lkZ2V0cy9zaGFyZS90b29sPycsXG5cdFx0XHRkYXRhOiBkYXRhLFxuXHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0d2lkdGg6IDU0MCxcblx0XHRcdFx0aGVpZ2h0OiA5NDBcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBSZWRkaXQgc2hhcmUgVVJMXG5cdHJlZGRpdCAoZGF0YSkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6ICdodHRwOi8vcmVkZGl0LmNvbS9zdWJtaXQ/Jyxcblx0XHRcdGRhdGE6IGRhdGEsXG5cdFx0XHRwb3B1cDoge1xuXHRcdFx0XHR3aWR0aDogODYwLFxuXHRcdFx0XHRoZWlnaHQ6IDg4MFxuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gc2V0IEZsaWNrciBmb2xsb3cgVVJMXG5cdGZsaWNrciAoZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHQvLyBpZiBpT1MgdXNlclxuXHRcdGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVybDogYGZsaWNrcjovL3Bob3Rvcy8ke2RhdGEudXNlcm5hbWV9P2Bcblx0XHRcdH07XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVybDogYGh0dHA6Ly93d3cuZmxpY2tyLmNvbS9waG90b3MvJHtkYXRhLnVzZXJuYW1lfT9gLFxuXHRcdFx0XHRwb3B1cDoge1xuXHRcdFx0XHRcdHdpZHRoOiA2MDAsXG5cdFx0XHRcdFx0aGVpZ2h0OiA2NTBcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9XG5cdH0sXG5cblx0Ly8gc2V0IFdoYXRzQXBwIHNoYXJlIFVSTFxuXHR3aGF0c2FwcCAoZGF0YSkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6ICd3aGF0c2FwcDovL3NlbmQ/Jyxcblx0XHRcdGRhdGE6IGRhdGFcblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBzbXMgc2hhcmUgVVJMXG5cdHNtcyAoZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiBpb3MgPyAnc21zOiYnIDogJ3Ntczo/Jyxcblx0XHRcdGRhdGE6IGRhdGFcblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBFbWFpbCBzaGFyZSBVUkxcblx0ZW1haWwgKGRhdGEpIHtcblxuXHRcdHZhciB1cmwgPSBgbWFpbHRvOmA7XG5cblx0XHQvLyBpZiB0byBhZGRyZXNzIHNwZWNpZmllZCB0aGVuIGFkZCB0byBVUkxcblx0XHRpZiAoZGF0YS50byAhPT0gbnVsbCkge1xuXHRcdFx0dXJsICs9IGAke2RhdGEudG99YDtcblx0XHR9XG5cblx0XHR1cmwgKz0gYD9gO1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybDogdXJsLFxuXHRcdFx0ZGF0YToge1xuXHRcdFx0XHRzdWJqZWN0OiBkYXRhLnN1YmplY3QsXG5cdFx0XHRcdGJvZHk6IGRhdGEuYm9keVxuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gc2V0IEdpdGh1YiBmb3JrIFVSTFxuXHRnaXRodWIgKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG5cdFx0bGV0IHVybCA9IGRhdGEucmVwbyA/XG5cdFx0XHRgaHR0cHM6Ly9naXRodWIuY29tLyR7ZGF0YS5yZXBvfWAgOlxuXHRcdFx0ZGF0YS51cmw7XG5cblx0XHRpZiAoZGF0YS5pc3N1ZSkge1xuXHRcdFx0dXJsICs9ICcvaXNzdWVzL25ldz90aXRsZT0nICtcblx0XHRcdFx0ZGF0YS5pc3N1ZSArXG5cdFx0XHRcdCcmYm9keT0nICtcblx0XHRcdFx0ZGF0YS5ib2R5O1xuXHRcdH1cblxuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6IHVybCArICc/Jyxcblx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdHdpZHRoOiAxMDIwLFxuXHRcdFx0XHRoZWlnaHQ6IDMyM1xuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gc2V0IERyaWJiYmxlIHNoYXJlIFVSTFxuXHRkcmliYmJsZSAoZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHRjb25zdCB1cmwgPSBkYXRhLnNob3QgP1xuXHRcdFx0YGh0dHBzOi8vZHJpYmJibGUuY29tL3Nob3RzLyR7ZGF0YS5zaG90fT9gIDpcblx0XHRcdGRhdGEudXJsICsgJz8nO1xuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6IHVybCxcblx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdHdpZHRoOiA0NDAsXG5cdFx0XHRcdGhlaWdodDogNjQwXG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHRjb2RlcGVuIChkYXRhKSB7XG5cdFx0Y29uc3QgdXJsID0gKGRhdGEucGVuICYmIGRhdGEudXNlcm5hbWUgJiYgZGF0YS52aWV3KSA/XG5cdFx0XHRgaHR0cHM6Ly9jb2RlcGVuLmlvLyR7ZGF0YS51c2VybmFtZX0vJHtkYXRhLnZpZXd9LyR7ZGF0YS5wZW59P2AgOlxuXHRcdFx0ZGF0YS51cmwgKyAnPyc7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybDogdXJsLFxuXHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0d2lkdGg6IDEyMDAsXG5cdFx0XHRcdGhlaWdodDogODAwXG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHRwYXlwYWwgKGRhdGEpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0ZGF0YTogZGF0YVxuXHRcdH07XG5cdH1cbn07XG4iLCJ2YXIgT3BlblNoYXJlID0ge1xuXHRzaGFyZTogcmVxdWlyZSgnLi4vc2hhcmUuanMnKSxcblx0Y291bnQ6IHJlcXVpcmUoJy4uL2NvdW50LmpzJyksXG5cdGFuYWx5dGljczogcmVxdWlyZSgnLi4vYW5hbHl0aWNzLmpzJylcbn07XG5cbi8vIE9wZW5TaGFyZS5hbmFseXRpY3MoJ3RhZ01hbmFnZXInLCBmdW5jdGlvbiAoKSB7XG4vLyAgIGNvbnNvbGUubG9nKCd0YWcgbWFuYWdlciBsb2FkZWQnKTtcbi8vIH0pO1xuLy9cbi8vIE9wZW5TaGFyZS5hbmFseXRpY3MoJ2V2ZW50JywgZnVuY3Rpb24gKCkge1xuLy8gICBjb25zb2xlLmxvZygnZ29vZ2xlIGFuYWx5dGljcyBsb2FkZWQnKTtcbi8vIH0pO1xuLy9cbi8vIE9wZW5TaGFyZS5hbmFseXRpY3MoJ3NvY2lhbCcsIGZ1bmN0aW9uICgpIHtcbi8vICAgY29uc29sZS5sb2coJ2dvb2dsZSBhbmFseXRpY3MgbG9hZGVkJyk7XG4vLyB9KTtcblxudmFyIGR5bmFtaWNOb2RlRGF0YSA9IHtcblx0J3VybCc6ICdodHRwOi8vd3d3LmRpZ2l0YWxzdXJnZW9ucy5jb20nLFxuXHQndmlhJzogJ2RpZ2l0YWxzdXJnZW9ucycsXG5cdCd0ZXh0JzogJ0ZvcndhcmQgT2JzZXNzZWQnLFxuXHQnaGFzaHRhZ3MnOiAnZm9yd2FyZG9ic2Vzc2VkJyxcblx0J2J1dHRvbic6ICdPcGVuIFNoYXJlIFdhdGNoZXIhJ1xufTtcblxuZnVuY3Rpb24gY3JlYXRlT3BlblNoYXJlTm9kZShkYXRhKSB7XG5cdHZhciBvcGVuU2hhcmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG5cblx0b3BlblNoYXJlLmNsYXNzTGlzdC5hZGQoJ29wZW4tc2hhcmUtbGluaycsICd0d2l0dGVyJyk7XG5cdG9wZW5TaGFyZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZScsICd0d2l0dGVyJyk7XG5cdG9wZW5TaGFyZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS11cmwnLCBkYXRhLnVybCk7XG5cdG9wZW5TaGFyZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS12aWEnLCBkYXRhLnZpYSk7XG5cdG9wZW5TaGFyZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS10ZXh0JywgZGF0YS50ZXh0KTtcblx0b3BlblNoYXJlLnNldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWhhc2h0YWdzJywgZGF0YS5oYXNodGFncyk7XG5cdG9wZW5TaGFyZS5pbm5lckhUTUwgPSAnPHNwYW4gY2xhc3M9XCJmYSBmYS10d2l0dGVyXCI+PC9zcGFuPicgKyBkYXRhLmJ1dHRvbjtcblxuXHR2YXIgbm9kZSA9IG5ldyBPcGVuU2hhcmUuc2hhcmUoe1xuXHRcdHR5cGU6ICd0d2l0dGVyJyxcblx0XHR1cmw6ICdodHRwOi8vd3d3LmRpZ2l0YWxzdXJnZW9ucy5jb20nLFxuXHRcdHZpYTogJ2RpZ2l0YWxzdXJnZW9ucycsXG5cdFx0aGFzaHRhZ3M6ICdmb3J3YXJkb2JzZXNzZWQnLFxuXHRcdGFwcGVuZFRvOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcub3Blbi1zaGFyZS13YXRjaCcpLFxuXHRcdGlubmVySFRNTDogJ0NyZWF0ZWQgdmlhIE9wZW5TaGFyZUFQSScsXG5cdFx0ZWxlbWVudDogJ2RpdicsXG5cdFx0Y2xhc3NlczogWyd3b3cnLCAnc3VjaCcsICdjbGFzc2VzJ11cblx0fSk7XG5cblx0cmV0dXJuIG9wZW5TaGFyZTtcbn1cblxuZnVuY3Rpb24gYWRkTm9kZSgpIHtcblx0dmFyIGRhdGEgPSBkeW5hbWljTm9kZURhdGE7XG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5vcGVuLXNoYXJlLXdhdGNoJylcblx0XHQuYXBwZW5kQ2hpbGQoY3JlYXRlT3BlblNoYXJlTm9kZShkYXRhKSk7XG59XG5cbndpbmRvdy5hZGROb2RlID0gYWRkTm9kZTtcblxuZnVuY3Rpb24gYWRkTm9kZVdpdGhDb3VudCgpIHtcblx0dmFyIGRhdGEgPSBkeW5hbWljTm9kZURhdGE7XG5cblx0bmV3IE9wZW5TaGFyZS5jb3VudCh7XG5cdFx0dHlwZTogJ2ZhY2Vib29rJyxcblx0XHR1cmw6ICdodHRwczovL3d3dy5kaWdpdGFsc3VyZ2VvbnMuY29tLydcblx0fSwgZnVuY3Rpb24gKG5vZGUpIHtcblx0XHR2YXIgb3MgPSBuZXcgT3BlblNoYXJlLnNoYXJlKHtcblx0XHQgIHR5cGU6ICd0d2l0dGVyJyxcblx0XHQgIHVybDogJ2h0dHA6Ly93d3cuZGlnaXRhbHN1cmdlb25zLmNvbScsXG5cdFx0ICB2aWE6ICdkaWdpdGFsc3VyZ2VvbnMnLFxuXHRcdCAgaGFzaHRhZ3M6ICdmb3J3YXJkb2JzZXNzZWQnLFxuXHRcdCAgaW5uZXJIVE1MOiAnQ3JlYXRlZCB2aWEgT3BlblNoYXJlQVBJJyxcblx0XHQgIGVsZW1lbnQ6ICdkaXYnLFxuXHRcdCAgY2xhc3NlczogWyd3b3cnLCAnc3VjaCcsICdjbGFzc2VzJ11cblx0ICB9KTtcblx0XHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuY3JlYXRlLW5vZGUudy1jb3VudCcpXG5cdFx0ICAuYXBwZW5kQ2hpbGQob3MpO1xuXHRcdCAgb3MuYXBwZW5kQ2hpbGQobm9kZSk7XG5cdH0pO1xufVxuXG53aW5kb3cuYWRkTm9kZVdpdGhDb3VudCA9IGFkZE5vZGVXaXRoQ291bnQ7XG5cbmZ1bmN0aW9uIGNyZWF0ZUNvdW50Tm9kZSgpIHtcbiBcdHZhciBjb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuY3JlYXRlLW5vZGUuY291bnQtbm9kZXMnKTtcblx0dmFyIHR5cGUgPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignaW5wdXQuY291bnQtdHlwZScpLnZhbHVlO1xuXHR2YXIgdXJsID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0LmNvdW50LXVybCcpLnZhbHVlO1xuXG5cdG5ldyBPcGVuU2hhcmUuY291bnQoe1xuXHRcdHR5cGU6IHR5cGUsXG5cdFx0dXJsOiB1cmwsXG5cdFx0YXBwZW5kVG86IGNvbnRhaW5lcixcblx0XHRjbGFzc2VzOiBbJ3Rlc3QnXVxuXHR9LCBmdW5jdGlvbiAobm9kZSkge1xuXHRcdG5vZGUuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuXHR9KTtcblxuXG5cdGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdpbnB1dC5jb3VudC10eXBlJykudmFsdWUgPSAnJztcblx0Y29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0LmNvdW50LXVybCcpLnZhbHVlID0gJyc7XG59XG5cbndpbmRvdy5jcmVhdGVDb3VudE5vZGUgPSBjcmVhdGVDb3VudE5vZGU7XG5cbi8vIHRlc3QgSlMgT3BlblNoYXJlIEFQSSB3aXRoIGRhc2hlc1xuXG5uZXcgT3BlblNoYXJlLnNoYXJlKHtcblx0dHlwZTogJ2dvb2dsZU1hcHMnLFxuXHRjZW50ZXI6ICc0MC43NjU4MTksLTczLjk3NTg2NicsXG5cdHZpZXc6ICd0cmFmZmljJyxcblx0em9vbTogMTQsXG5cdGFwcGVuZFRvOiBkb2N1bWVudC5ib2R5LFxuXHRpbm5lckhUTUw6ICdNYXBzJ1xufSk7XG5cbm5ldyBPcGVuU2hhcmUuc2hhcmUoe1xuXHR0eXBlOiAndHdpdHRlci1mb2xsb3cnLFxuXHRzY3JlZW5OYW1lOiAnZGlnaXRhbHN1cmdlb25zJyxcblx0dXNlcklkOiAnMTgxODkxMzAnLFxuXHRhcHBlbmRUbzogZG9jdW1lbnQuYm9keSxcblx0aW5uZXJIVE1MOiAnRm9sbG93IFRlc3QnXG59KTtcblxuLy8gdGVzdCBQYXlQYWxcbm5ldyBPcGVuU2hhcmUuc2hhcmUoe1xuXHR0eXBlOiAncGF5cGFsJyxcblx0YnV0dG9uSWQ6ICcyUDNSSllFRkw3WjYyJyxcblx0c2FuZGJveDogdHJ1ZSxcblx0YXBwZW5kVG86IGRvY3VtZW50LmJvZHksXG5cdGlubmVySFRNTDogJ1BheVBhbCBUZXN0J1xufSk7XG5cbi8vIGJpbmQgdG8gY291bnQgbG9hZGVkIGV2ZW50XG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdPcGVuU2hhcmUuY291bnQtbG9hZGVkJywgZnVuY3Rpb24oKSB7XG5cdGNvbnNvbGUubG9nKCdPcGVuU2hhcmUgKGNvdW50KSBsb2FkZWQnKTtcbn0pO1xuXG4vLyBiaW5kIHRvIHNoYXJlIGxvYWRlZCBldmVudFxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignT3BlblNoYXJlLnNoYXJlLWxvYWRlZCcsIGZ1bmN0aW9uKCkge1xuXHRjb25zb2xlLmxvZygnT3BlblNoYXJlIChzaGFyZSkgbG9hZGVkJyk7XG5cblx0Ly8gYmluZCB0byBzaGFyZWQgZXZlbnQgb24gZWFjaCBpbmRpdmlkdWFsIG5vZGVcblx0W10uZm9yRWFjaC5jYWxsKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLW9wZW4tc2hhcmVdJyksIGZ1bmN0aW9uKG5vZGUpIHtcblx0XHRub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ09wZW5TaGFyZS5zaGFyZWQnLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRjb25zb2xlLmxvZygnT3BlbiBTaGFyZSBTaGFyZWQnLCBlKTtcblx0XHR9KTtcblx0fSk7XG5cblx0dmFyIGV4YW1wbGVzID0ge1xuXHRcdHR3aXR0ZXI6IG5ldyBPcGVuU2hhcmUuc2hhcmUoe1xuXHRcdFx0dHlwZTogJ3R3aXR0ZXInLFxuXHRcdFx0YmluZENsaWNrOiB0cnVlLFxuXHRcdFx0dXJsOiAnaHR0cDovL2RpZ2l0YWxzdXJnZW9ucy5jb20nLFxuXHRcdFx0dmlhOiAnZGlnaXRhbHN1cmdlb25zJyxcblx0XHRcdHRleHQ6ICdEaWdpdGFsIFN1cmdlb25zJyxcblx0XHRcdGhhc2h0YWdzOiAnZm9yd2FyZG9ic2Vzc2VkJ1xuXHRcdH0sIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLWFwaS1leGFtcGxlPVwidHdpdHRlclwiXScpKSxcblxuXHRcdGZhY2Vib29rOiBuZXcgT3BlblNoYXJlLnNoYXJlKHtcblx0XHRcdHR5cGU6ICdmYWNlYm9vaycsXG5cdFx0XHRiaW5kQ2xpY2s6IHRydWUsXG5cdFx0XHRsaW5rOiAnaHR0cDovL2RpZ2l0YWxzdXJnZW9ucy5jb20nLFxuXHRcdFx0cGljdHVyZTogJ2h0dHA6Ly93d3cuZGlnaXRhbHN1cmdlb25zLmNvbS9pbWcvYWJvdXQvYmdfb2ZmaWNlX3RlYW0uanBnJyxcblx0XHRcdGNhcHRpb246ICdEaWdpdGFsIFN1cmdlb25zJyxcblx0XHRcdGRlc2NyaXB0aW9uOiAnZm9yd2FyZG9ic2Vzc2VkJ1xuXHRcdH0sIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLWFwaS1leGFtcGxlPVwiZmFjZWJvb2tcIl0nKSksXG5cblx0XHRwaW50ZXJlc3Q6IG5ldyBPcGVuU2hhcmUuc2hhcmUoe1xuXHRcdFx0dHlwZTogJ3BpbnRlcmVzdCcsXG5cdFx0XHRiaW5kQ2xpY2s6IHRydWUsXG5cdFx0XHR1cmw6ICdodHRwOi8vZGlnaXRhbHN1cmdlb25zLmNvbScsXG5cdFx0XHRtZWRpYTogJ2h0dHA6Ly93d3cuZGlnaXRhbHN1cmdlb25zLmNvbS9pbWcvYWJvdXQvYmdfb2ZmaWNlX3RlYW0uanBnJyxcblx0XHRcdGRlc2NyaXB0aW9uOiAnRGlnaXRhbCBTdXJnZW9ucycsXG5cdFx0XHRhcHBlbmRUbzogZG9jdW1lbnQuYm9keVxuXHRcdH0sIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLWFwaS1leGFtcGxlPVwicGludGVyZXN0XCJdJykpLFxuXG5cdFx0ZW1haWw6IG5ldyBPcGVuU2hhcmUuc2hhcmUoe1xuXHRcdFx0dHlwZTogJ2VtYWlsJyxcblx0XHRcdGJpbmRDbGljazogdHJ1ZSxcblx0XHRcdHRvOiAndGVjaHJvb21AZGlnaXRhbHN1cmdlb25zLmNvbScsXG5cdFx0XHRzdWJqZWN0OiAnRGlnaXRhbCBTdXJnZW9ucycsXG5cdFx0XHRib2R5OiAnRm9yd2FyZCBPYnNlc3NlZCdcblx0XHR9LCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbZGF0YS1hcGktZXhhbXBsZT1cImVtYWlsXCJdJykpXG5cdH07XG59KTtcblxuLy8gRXhhbXBsZSBvZiBsaXN0ZW5pbmcgZm9yIGNvdW50ZWQgZXZlbnRzIG9uIGluZGl2aWR1YWwgdXJscyBvciBhcnJheXMgb2YgdXJsc1xudmFyIHVybHMgPSBbXG5cdCdmYWNlYm9vaycsXG5cdCdnb29nbGUnLFxuXHQnbGlua2VkaW4nLFxuXHQncmVkZGl0Jyxcblx0J3BpbnRlcmVzdCcsXG5cdFtcblx0XHQnZ29vZ2xlJyxcblx0XHQnbGlua2VkaW4nLFxuXHRcdCdyZWRkaXQnLFxuXHRcdCdwaW50ZXJlc3QnXG5cdF1cbl07XG5cbnVybHMuZm9yRWFjaChmdW5jdGlvbih1cmwpIHtcblx0aWYgKEFycmF5LmlzQXJyYXkodXJsKSkge1xuXHRcdHVybCA9IHVybC5qb2luKCcsJyk7XG5cdH1cblx0dmFyIGNvdW50Tm9kZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLW9wZW4tc2hhcmUtY291bnQ9XCInICsgdXJsICsgJ1wiXScpO1xuXG5cdFtdLmZvckVhY2guY2FsbChjb3VudE5vZGUsIGZ1bmN0aW9uKG5vZGUpIHtcblx0XHRub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ09wZW5TaGFyZS5jb3VudGVkLScgKyB1cmwsIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGNvdW50cyA9IG5vZGUuaW5uZXJIVE1MO1xuXHRcdFx0aWYgKGNvdW50cykgY29uc29sZS5sb2codXJsLCAnc2hhcmVzOiAnLCBjb3VudHMpO1xuXHRcdH0pO1xuXHR9KTtcbn0pO1xuIl19
