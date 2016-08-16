(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

module.exports = function (type, cb) {
	var isGA = type === 'event' || type === 'social';
	var isTagManager = type === 'tagManager';

	if (isGA) checkIfAnalyticsLoaded(type, cb);
	if (isTagManager) setTagManager(cb);
};

function checkIfAnalyticsLoaded(type, cb) {
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
		setTimeout(function () {
			checkIfAnalyticsLoaded(type, cb);
		}, 1000);
	}
}

function setTagManager(cb) {

	if (window.dataLayer && window.dataLayer[0]['gtm.start']) {
		if (cb) cb();

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
	} else {
		setTimeout(function () {
			setTagManager(cb);
		}, 1000);
	}
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
		popUp: osElement.getAttribute('data-open-share-popup'),
		key: osElement.getAttribute('data-key')
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
		var _ref$key = _ref.key;
		var key = _ref$key === undefined ? null : _ref$key;

		_classCallCheck(this, Count);

		var countNode = document.createElement(element || 'span');

		countNode.setAttribute('data-open-share-count', type);
		countNode.setAttribute('data-open-share-count-url', url);
		if (key) countNode.setAttribute('data-key', key);

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
			url: 'https://api.openshare.social/job?url=' + url + '&key=',
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
			this.key = this.os.getAttribute('data-key');

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
						if (countData.url.toLowerCase().indexOf('https://api.openshare.social/job?') === 0) {
							console.error('Please sign up for Twitter counts at https://openshare.social/twitter/auth');
						} else console.error('Failed to get API data from', countData.url, '. Please use the latest version of OpenShare.');
					}
				}
			};
			countData.url = this.key ? countData.url + this.key : countData.url;
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
					return this.openWindow(this.shareUrl, this.transformData.popup);
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

// test twitter count js api
new OpenShare.count({
	type: 'twitter',
	url: 'https://www.digitalsurgeons.com/thoughts/technology/the-blockchain-revolution/',
	key: 'osAPIKey'
}, function (node) {
	var os = new OpenShare.share({
		type: 'twitter',
		url: 'https://www.digitalsurgeons.com/thoughts/technology/the-blockchain-revolution/',
		via: 'digitalsurgeons',
		hashtags: 'forwardobsessed, blockchain',
		appendTo: document.body,
		innerHTML: 'BLOCKCHAIN'
	});
	os.appendChild(node);
});

},{"../analytics.js":1,"../count.js":2,"../share.js":13}]},{},[21])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiYW5hbHl0aWNzLmpzIiwiY291bnQuanMiLCJsaWIvY291bnRSZWR1Y2UuanMiLCJsaWIvZGFzaFRvQ2FtZWwuanMiLCJsaWIvaW5pdC5qcyIsImxpYi9pbml0aWFsaXplQ291bnROb2RlLmpzIiwibGliL2luaXRpYWxpemVOb2Rlcy5qcyIsImxpYi9pbml0aWFsaXplU2hhcmVOb2RlLmpzIiwibGliL2luaXRpYWxpemVXYXRjaGVyLmpzIiwibGliL3NldERhdGEuanMiLCJsaWIvc2hhcmUuanMiLCJsaWIvc3RvcmVDb3VudC5qcyIsInNoYXJlLmpzIiwic3JjL21vZHVsZXMvY291bnQtYXBpLmpzIiwic3JjL21vZHVsZXMvY291bnQtdHJhbnNmb3Jtcy5qcyIsInNyYy9tb2R1bGVzL2NvdW50LmpzIiwic3JjL21vZHVsZXMvZXZlbnRzLmpzIiwic3JjL21vZHVsZXMvb3Blbi1zaGFyZS5qcyIsInNyYy9tb2R1bGVzL3NoYXJlLWFwaS5qcyIsInNyYy9tb2R1bGVzL3NoYXJlLXRyYW5zZm9ybXMuanMiLCJzcmMvdGVzdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsT0FBTyxPQUFQLEdBQWlCLFVBQVUsSUFBVixFQUFnQixFQUFoQixFQUFvQjtBQUNwQyxLQUFNLE9BQU8sU0FBUyxPQUFULElBQW9CLFNBQVMsUUFBMUM7QUFDQSxLQUFNLGVBQWUsU0FBUyxZQUE5Qjs7QUFFQSxLQUFJLElBQUosRUFBVSx1QkFBdUIsSUFBdkIsRUFBNkIsRUFBN0I7QUFDVixLQUFJLFlBQUosRUFBa0IsY0FBYyxFQUFkO0FBQ2xCLENBTkQ7O0FBUUEsU0FBUyxzQkFBVCxDQUFnQyxJQUFoQyxFQUFzQyxFQUF0QyxFQUEwQztBQUN6QyxLQUFJLE9BQU8sRUFBWCxFQUFlO0FBQ1osTUFBSSxFQUFKLEVBQVE7QUFDUjtBQUNBLFNBQU8sVUFB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QUFNLFNBRGE7QUFFbkIsTUFBSyxnRkFGYztBQUduQixNQUFLO0FBSGMsQ0FBcEIsRUFJRyxVQUFVLElBQVYsRUFBZ0I7QUFDbEIsS0FBSSxLQUFLLElBQUksVUFBVSxLQUFkLENBQW9CO0FBQzNCLFFBQU0sU0FEcUI7QUFFM0IsT0FBSyxnRkFGc0I7QUFHM0IsT0FBSyxpQkFIc0I7QUFJM0IsWUFBVSw2QkFKaUI7QUFLM0IsWUFBVSxTQUFTLElBTFE7QUFNM0IsYUFBVztBQU5nQixFQUFwQixDQUFUO0FBUUEsSUFBRyxXQUFILENBQWUsSUFBZjtBQUNBLENBZEQiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAodHlwZSwgY2IpIHtcblx0Y29uc3QgaXNHQSA9IHR5cGUgPT09ICdldmVudCcgfHwgdHlwZSA9PT0gJ3NvY2lhbCc7XG5cdGNvbnN0IGlzVGFnTWFuYWdlciA9IHR5cGUgPT09ICd0YWdNYW5hZ2VyJztcblxuXHRpZiAoaXNHQSkgY2hlY2tJZkFuYWx5dGljc0xvYWRlZCh0eXBlLCBjYik7XG5cdGlmIChpc1RhZ01hbmFnZXIpIHNldFRhZ01hbmFnZXIoY2IpO1xufTtcblxuZnVuY3Rpb24gY2hlY2tJZkFuYWx5dGljc0xvYWRlZCh0eXBlLCBjYikge1xuXHRpZiAod2luZG93LmdhKSB7XG5cdFx0ICBpZiAoY2IpIGNiKCk7XG5cdFx0ICAvLyBiaW5kIHRvIHNoYXJlZCBldmVudCBvbiBlYWNoIGluZGl2aWR1YWwgbm9kZVxuXHRcdCAgbGlzdGVuKGZ1bmN0aW9uIChlKSB7XG5cdFx0XHRjb25zdCBwbGF0Zm9ybSA9IGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlJyk7XG5cdFx0XHRjb25zdCB0YXJnZXQgPSBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1saW5rJykgfHxcblx0XHRcdFx0ZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdXJsJykgfHxcblx0XHRcdFx0ZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdXNlcm5hbWUnKSB8fFxuXHRcdFx0ICAgIGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNlbnRlcicpIHx8XG5cdFx0XHRcdGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXNlYXJjaCcpIHx8XG5cdFx0XHRcdGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWJvZHknKTtcblxuXHRcdFx0aWYgKHR5cGUgPT09ICdldmVudCcpIHtcblx0XHRcdFx0Z2EoJ3NlbmQnLCAnZXZlbnQnLCB7XG5cdFx0XHRcdFx0ZXZlbnRDYXRlZ29yeTogJ09wZW5TaGFyZSBDbGljaycsXG5cdFx0XHRcdFx0ZXZlbnRBY3Rpb246IHBsYXRmb3JtLFxuXHRcdFx0XHRcdGV2ZW50TGFiZWw6IHRhcmdldCxcblx0XHRcdFx0XHR0cmFuc3BvcnQ6ICdiZWFjb24nXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAodHlwZSA9PT0gJ3NvY2lhbCcpIHtcblx0XHRcdFx0Z2EoJ3NlbmQnLCB7XG5cdFx0XHRcdFx0aGl0VHlwZTogJ3NvY2lhbCcsXG5cdFx0XHRcdFx0c29jaWFsTmV0d29yazogcGxhdGZvcm0sXG5cdFx0XHRcdFx0c29jaWFsQWN0aW9uOiAnc2hhcmUnLFxuXHRcdFx0XHRcdHNvY2lhbFRhcmdldDogdGFyZ2V0XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdH1cblx0ZWxzZSB7XG5cdFx0c2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG5cdFx0XHRjaGVja0lmQW5hbHl0aWNzTG9hZGVkKHR5cGUsIGNiKTtcblx0ICBcdH0sIDEwMDApO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHNldFRhZ01hbmFnZXIgKGNiKSB7XG5cblx0aWYgKHdpbmRvdy5kYXRhTGF5ZXIgJiYgd2luZG93LmRhdGFMYXllclswXVsnZ3RtLnN0YXJ0J10pIHtcblx0XHRpZiAoY2IpIGNiKCk7XG5cblx0XHRsaXN0ZW4ob25TaGFyZVRhZ01hbmdlcik7XG5cblx0XHRnZXRDb3VudHMoZnVuY3Rpb24oZSkge1xuXHRcdFx0Y29uc3QgY291bnQgPSBlLnRhcmdldCA/XG5cdFx0XHQgIGUudGFyZ2V0LmlubmVySFRNTCA6XG5cdFx0XHQgIGUuaW5uZXJIVE1MO1xuXG5cdFx0XHRjb25zdCBwbGF0Zm9ybSA9IGUudGFyZ2V0ID9cblx0XHRcdCAgIGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50LXVybCcpIDpcblx0XHRcdCAgIGUuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY291bnQtdXJsJyk7XG5cblx0XHRcdHdpbmRvdy5kYXRhTGF5ZXIucHVzaCh7XG5cdFx0XHRcdCdldmVudCcgOiAnT3BlblNoYXJlIENvdW50Jyxcblx0XHRcdFx0J3BsYXRmb3JtJzogcGxhdGZvcm0sXG5cdFx0XHRcdCdyZXNvdXJjZSc6IGNvdW50LFxuXHRcdFx0XHQnYWN0aXZpdHknOiAnY291bnQnXG5cdFx0XHR9KTtcblx0XHR9KTtcblx0fSBlbHNlIHtcblx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcblx0XHRcdHNldFRhZ01hbmFnZXIoY2IpO1xuXHRcdH0sIDEwMDApO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGxpc3RlbiAoY2IpIHtcblx0Ly8gYmluZCB0byBzaGFyZWQgZXZlbnQgb24gZWFjaCBpbmRpdmlkdWFsIG5vZGVcblx0W10uZm9yRWFjaC5jYWxsKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLW9wZW4tc2hhcmVdJyksIGZ1bmN0aW9uKG5vZGUpIHtcblx0XHRub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ09wZW5TaGFyZS5zaGFyZWQnLCBjYik7XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBnZXRDb3VudHMgKGNiKSB7XG5cdHZhciBjb3VudE5vZGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1vcGVuLXNoYXJlLWNvdW50XScpO1xuXG5cdFtdLmZvckVhY2guY2FsbChjb3VudE5vZGUsIGZ1bmN0aW9uKG5vZGUpIHtcblx0XHRpZiAobm9kZS50ZXh0Q29udGVudCkgY2Iobm9kZSk7XG5cdFx0ZWxzZSBub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ09wZW5TaGFyZS5jb3VudGVkLScgKyBub2RlLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50LXVybCcpLCBjYik7XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBvblNoYXJlVGFnTWFuZ2VyIChlKSB7XG5cdGNvbnN0IHBsYXRmb3JtID0gZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUnKTtcblx0Y29uc3QgdGFyZ2V0ID0gZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtbGluaycpIHx8XG5cdFx0ZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdXJsJykgfHxcblx0XHRlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS11c2VybmFtZScpIHx8XG5cdFx0ZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY2VudGVyJykgfHxcblx0XHRlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1zZWFyY2gnKSB8fFxuXHRcdGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWJvZHknKTtcblxuXHR3aW5kb3cuZGF0YUxheWVyLnB1c2goe1xuXHRcdCdldmVudCcgOiAnT3BlblNoYXJlIFNoYXJlJyxcblx0XHQncGxhdGZvcm0nOiBwbGF0Zm9ybSxcblx0XHQncmVzb3VyY2UnOiB0YXJnZXQsXG5cdFx0J2FjdGl2aXR5JzogJ3NoYXJlJ1xuXHR9KTtcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkge1xuXHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgcmVxdWlyZSgnLi9saWIvaW5pdCcpKHtcblx0XHRhcGk6ICdjb3VudCcsXG5cdFx0c2VsZWN0b3I6ICdbZGF0YS1vcGVuLXNoYXJlLWNvdW50XTpub3QoW2RhdGEtb3Blbi1zaGFyZS1ub2RlXSknLFxuXHRcdGNiOiByZXF1aXJlKCcuL2xpYi9pbml0aWFsaXplQ291bnROb2RlJylcblx0fSkpO1xuXG5cdHJldHVybiByZXF1aXJlKCcuL3NyYy9tb2R1bGVzL2NvdW50LWFwaScpKCk7XG59KSgpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBjb3VudFJlZHVjZTtcblxuZnVuY3Rpb24gcm91bmQoeCwgcHJlY2lzaW9uKSB7XG5cdGlmICh0eXBlb2YgeCAhPT0gJ251bWJlcicpIHtcblx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCdFeHBlY3RlZCB2YWx1ZSB0byBiZSBhIG51bWJlcicpO1xuXHR9XG5cblx0dmFyIGV4cG9uZW50ID0gcHJlY2lzaW9uID4gMCA/ICdlJyA6ICdlLSc7XG5cdHZhciBleHBvbmVudE5lZyA9IHByZWNpc2lvbiA+IDAgPyAnZS0nIDogJ2UnO1xuXHRwcmVjaXNpb24gPSBNYXRoLmFicyhwcmVjaXNpb24pO1xuXG5cdHJldHVybiBOdW1iZXIoTWF0aC5yb3VuZCh4ICsgZXhwb25lbnQgKyBwcmVjaXNpb24pICsgZXhwb25lbnROZWcgKyBwcmVjaXNpb24pO1xufVxuXG5mdW5jdGlvbiB0aG91c2FuZGlmeSAobnVtKSB7XG5cdHJldHVybiByb3VuZChudW0vMTAwMCwgMSkgKyAnSyc7XG59XG5cbmZ1bmN0aW9uIG1pbGxpb25pZnkgKG51bSkge1xuXHRyZXR1cm4gcm91bmQobnVtLzEwMDAwMDAsIDEpICsgJ00nO1xufVxuXG5mdW5jdGlvbiBjb3VudFJlZHVjZSAoZWwsIGNvdW50LCBjYikge1xuXHRpZiAoY291bnQgPiA5OTk5OTkpICB7XG5cdFx0ZWwuaW5uZXJIVE1MID0gbWlsbGlvbmlmeShjb3VudCk7XG5cdFx0aWYgKGNiICAmJiB0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpIGNiKGVsKTtcblx0fSBlbHNlIGlmIChjb3VudCA+IDk5OSkge1xuXHRcdGVsLmlubmVySFRNTCA9IHRob3VzYW5kaWZ5KGNvdW50KTtcblx0XHRpZiAoY2IgICYmIHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykgY2IoZWwpO1xuXHR9IGVsc2Uge1xuXHRcdGVsLmlubmVySFRNTCA9IGNvdW50O1xuXHRcdGlmIChjYiAgJiYgdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSBjYihlbCk7XG5cdH1cbn1cbiIsIi8vIHR5cGUgY29udGFpbnMgYSBkYXNoXG4vLyB0cmFuc2Zvcm0gdG8gY2FtZWxjYXNlIGZvciBmdW5jdGlvbiByZWZlcmVuY2Vcbi8vIFRPRE86IG9ubHkgc3VwcG9ydHMgc2luZ2xlIGRhc2gsIHNob3VsZCBzaG91bGQgc3VwcG9ydCBtdWx0aXBsZVxubW9kdWxlLmV4cG9ydHMgPSAoZGFzaCwgdHlwZSkgPT4ge1xuXHRsZXQgbmV4dENoYXIgPSB0eXBlLnN1YnN0cihkYXNoICsgMSwgMSksXG5cdFx0Z3JvdXAgPSB0eXBlLnN1YnN0cihkYXNoLCAyKTtcblxuXHR0eXBlID0gdHlwZS5yZXBsYWNlKGdyb3VwLCBuZXh0Q2hhci50b1VwcGVyQ2FzZSgpKTtcblx0cmV0dXJuIHR5cGU7XG59O1xuIiwiY29uc3QgaW5pdGlhbGl6ZU5vZGVzID0gcmVxdWlyZSgnLi9pbml0aWFsaXplTm9kZXMnKTtcbmNvbnN0IGluaXRpYWxpemVXYXRjaGVyID0gcmVxdWlyZSgnLi9pbml0aWFsaXplV2F0Y2hlcicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGluaXQ7XG5cbmZ1bmN0aW9uIGluaXQob3B0cykge1xuXHRyZXR1cm4gKCkgPT4ge1xuXHRcdGNvbnN0IGluaXROb2RlcyA9IGluaXRpYWxpemVOb2Rlcyh7XG5cdFx0XHRhcGk6IG9wdHMuYXBpIHx8IG51bGwsXG5cdFx0XHRjb250YWluZXI6IG9wdHMuY29udGFpbmVyIHx8IGRvY3VtZW50LFxuXHRcdFx0c2VsZWN0b3I6IG9wdHMuc2VsZWN0b3IsXG5cdFx0XHRjYjogb3B0cy5jYlxuXHRcdH0pO1xuXG5cdFx0aW5pdE5vZGVzKCk7XG5cblx0XHQvLyBjaGVjayBmb3IgbXV0YXRpb24gb2JzZXJ2ZXJzIGJlZm9yZSB1c2luZywgSUUxMSBvbmx5XG5cdFx0aWYgKHdpbmRvdy5NdXRhdGlvbk9ic2VydmVyICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdGluaXRpYWxpemVXYXRjaGVyKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLW9wZW4tc2hhcmUtd2F0Y2hdJyksIGluaXROb2Rlcyk7XG5cdFx0fVxuXHR9O1xufVxuIiwiY29uc3QgQ291bnQgPSByZXF1aXJlKCcuLi9zcmMvbW9kdWxlcy9jb3VudCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGluaXRpYWxpemVDb3VudE5vZGU7XG5cbmZ1bmN0aW9uIGluaXRpYWxpemVDb3VudE5vZGUob3MpIHtcblx0Ly8gaW5pdGlhbGl6ZSBvcGVuIHNoYXJlIG9iamVjdCB3aXRoIHR5cGUgYXR0cmlidXRlXG5cdGxldCB0eXBlID0gb3MuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY291bnQnKSxcblx0XHR1cmwgPSBvcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudC1yZXBvJykgfHxcblx0XHRcdG9zLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50LXNob3QnKSB8fFxuXHRcdFx0b3MuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY291bnQtdXJsJyksXG5cdFx0Y291bnQgPSBuZXcgQ291bnQodHlwZSwgdXJsKTtcblxuXHRjb3VudC5jb3VudChvcyk7XG5cdG9zLnNldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLW5vZGUnLCB0eXBlKTtcbn1cbiIsImNvbnN0IEV2ZW50cyA9IHJlcXVpcmUoJy4uL3NyYy9tb2R1bGVzL2V2ZW50cycpO1xuY29uc3QgYW5hbHl0aWNzID0gcmVxdWlyZSgnLi4vYW5hbHl0aWNzJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBpbml0aWFsaXplTm9kZXM7XG5cbmZ1bmN0aW9uIGluaXRpYWxpemVOb2RlcyhvcHRzKSB7XG5cdC8vIGxvb3AgdGhyb3VnaCBvcGVuIHNoYXJlIG5vZGUgY29sbGVjdGlvblxuXHRyZXR1cm4gKCkgPT4ge1xuXHRcdC8vIGNoZWNrIGZvciBhbmFseXRpY3Ncblx0XHRjaGVja0FuYWx5dGljcygpO1xuXG5cdFx0aWYgKG9wdHMuYXBpKSB7XG5cdFx0XHRsZXQgbm9kZXMgPSBvcHRzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKG9wdHMuc2VsZWN0b3IpO1xuXHRcdFx0W10uZm9yRWFjaC5jYWxsKG5vZGVzLCBvcHRzLmNiKTtcblxuXHRcdFx0Ly8gdHJpZ2dlciBjb21wbGV0ZWQgZXZlbnRcblx0XHRcdEV2ZW50cy50cmlnZ2VyKGRvY3VtZW50LCBvcHRzLmFwaSArICctbG9hZGVkJyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIGxvb3AgdGhyb3VnaCBvcGVuIHNoYXJlIG5vZGUgY29sbGVjdGlvblxuXHRcdFx0bGV0IHNoYXJlTm9kZXMgPSBvcHRzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKG9wdHMuc2VsZWN0b3Iuc2hhcmUpO1xuXHRcdFx0W10uZm9yRWFjaC5jYWxsKHNoYXJlTm9kZXMsIG9wdHMuY2Iuc2hhcmUpO1xuXG5cdFx0XHQvLyB0cmlnZ2VyIGNvbXBsZXRlZCBldmVudFxuXHRcdFx0RXZlbnRzLnRyaWdnZXIoZG9jdW1lbnQsICdzaGFyZS1sb2FkZWQnKTtcblxuXHRcdFx0Ly8gbG9vcCB0aHJvdWdoIGNvdW50IG5vZGUgY29sbGVjdGlvblxuXHRcdFx0bGV0IGNvdW50Tm9kZXMgPSBvcHRzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKG9wdHMuc2VsZWN0b3IuY291bnQpO1xuXHRcdFx0W10uZm9yRWFjaC5jYWxsKGNvdW50Tm9kZXMsIG9wdHMuY2IuY291bnQpO1xuXG5cdFx0XHQvLyB0cmlnZ2VyIGNvbXBsZXRlZCBldmVudFxuXHRcdFx0RXZlbnRzLnRyaWdnZXIoZG9jdW1lbnQsICdjb3VudC1sb2FkZWQnKTtcblx0XHR9XG5cdH07XG59XG5cbmZ1bmN0aW9uIGNoZWNrQW5hbHl0aWNzICgpIHtcblx0Ly8gY2hlY2sgZm9yIGFuYWx5dGljc1xuXHRpZiAoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignW2RhdGEtb3Blbi1zaGFyZS1hbmFseXRpY3NdJykpIHtcblx0XHRjb25zdCBwcm92aWRlciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLW9wZW4tc2hhcmUtYW5hbHl0aWNzXScpXG5cdFx0XHQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtYW5hbHl0aWNzJyk7XG5cblx0XHRpZiAocHJvdmlkZXIuaW5kZXhPZignLCcpID4gLTEpIHtcblx0XHRcdGNvbnN0IHByb3ZpZGVycyA9IHByb3ZpZGVyLnNwbGl0KCcsJyk7XG5cdFx0XHRwcm92aWRlcnMuZm9yRWFjaChwID0+IGFuYWx5dGljcyhwKSk7XG5cdFx0fSBlbHNlIGFuYWx5dGljcyhwcm92aWRlcik7XG5cblx0fVxufVxuIiwiY29uc3QgU2hhcmVUcmFuc2Zvcm1zID0gcmVxdWlyZSgnLi4vc3JjL21vZHVsZXMvc2hhcmUtdHJhbnNmb3JtcycpO1xuY29uc3QgT3BlblNoYXJlID0gcmVxdWlyZSgnLi4vc3JjL21vZHVsZXMvb3Blbi1zaGFyZScpO1xuY29uc3Qgc2V0RGF0YSA9IHJlcXVpcmUoJy4vc2V0RGF0YScpO1xuY29uc3Qgc2hhcmUgPSByZXF1aXJlKCcuL3NoYXJlJyk7XG5jb25zdCBkYXNoVG9DYW1lbCA9IHJlcXVpcmUoJy4vZGFzaFRvQ2FtZWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBpbml0aWFsaXplU2hhcmVOb2RlO1xuXG5mdW5jdGlvbiBpbml0aWFsaXplU2hhcmVOb2RlKG9zKSB7XG5cdC8vIGluaXRpYWxpemUgb3BlbiBzaGFyZSBvYmplY3Qgd2l0aCB0eXBlIGF0dHJpYnV0ZVxuXHRsZXQgdHlwZSA9IG9zLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlJyksXG5cdFx0ZGFzaCA9IHR5cGUuaW5kZXhPZignLScpLFxuXHRcdG9wZW5TaGFyZTtcblxuXHRpZiAoZGFzaCA+IC0xKSB7XG5cdFx0dHlwZSA9IGRhc2hUb0NhbWVsKGRhc2gsIHR5cGUpO1xuXHR9XG5cblx0bGV0IHRyYW5zZm9ybSA9IFNoYXJlVHJhbnNmb3Jtc1t0eXBlXTtcblxuXHRpZiAoIXRyYW5zZm9ybSkge1xuXHRcdHRocm93IG5ldyBFcnJvcihgT3BlbiBTaGFyZTogJHt0eXBlfSBpcyBhbiBpbnZhbGlkIHR5cGVgKTtcblx0fVxuXG5cdG9wZW5TaGFyZSA9IG5ldyBPcGVuU2hhcmUodHlwZSwgdHJhbnNmb3JtKTtcblxuXHQvLyBzcGVjaWZ5IGlmIHRoaXMgaXMgYSBkeW5hbWljIGluc3RhbmNlXG5cdGlmIChvcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1keW5hbWljJykpIHtcblx0XHRvcGVuU2hhcmUuZHluYW1pYyA9IHRydWU7XG5cdH1cblxuXHQvLyBzcGVjaWZ5IGlmIHRoaXMgaXMgYSBwb3B1cCBpbnN0YW5jZVxuXHRpZiAob3MuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtcG9wdXAnKSkge1xuXHRcdG9wZW5TaGFyZS5wb3B1cCA9IHRydWU7XG5cdH1cblxuXHQvLyBzZXQgYWxsIG9wdGlvbmFsIGF0dHJpYnV0ZXMgb24gb3BlbiBzaGFyZSBpbnN0YW5jZVxuXHRzZXREYXRhKG9wZW5TaGFyZSwgb3MpO1xuXG5cdC8vIG9wZW4gc2hhcmUgZGlhbG9nIG9uIGNsaWNrXG5cdG9zLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcblx0XHRzaGFyZShlLCBvcywgb3BlblNoYXJlKTtcblx0fSk7XG5cblx0b3MuYWRkRXZlbnRMaXN0ZW5lcignT3BlblNoYXJlLnRyaWdnZXInLCAoZSkgPT4ge1xuXHRcdHNoYXJlKGUsIG9zLCBvcGVuU2hhcmUpO1xuXHR9KTtcblxuXHRvcy5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1ub2RlJywgdHlwZSk7XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGluaXRpYWxpemVXYXRjaGVyO1xuXG5mdW5jdGlvbiBpbml0aWFsaXplV2F0Y2hlcih3YXRjaGVyLCBmbikge1xuXHRbXS5mb3JFYWNoLmNhbGwod2F0Y2hlciwgKHcpID0+IHtcblx0XHR2YXIgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcigobXV0YXRpb25zKSA9PiB7XG5cdFx0XHQvLyB0YXJnZXQgd2lsbCBtYXRjaCBiZXR3ZWVuIGFsbCBtdXRhdGlvbnMgc28ganVzdCB1c2UgZmlyc3Rcblx0XHRcdGZuKG11dGF0aW9uc1swXS50YXJnZXQpO1xuXHRcdH0pO1xuXG5cdFx0b2JzZXJ2ZXIub2JzZXJ2ZSh3LCB7XG5cdFx0XHRjaGlsZExpc3Q6IHRydWVcblx0XHR9KTtcblx0fSk7XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHNldERhdGE7XG5cbmZ1bmN0aW9uIHNldERhdGEob3NJbnN0YW5jZSwgb3NFbGVtZW50KSB7XG5cdG9zSW5zdGFuY2Uuc2V0RGF0YSh7XG5cdFx0dXJsOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdXJsJyksXG5cdFx0dGV4dDogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXRleHQnKSxcblx0XHR2aWE6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS12aWEnKSxcblx0XHRoYXNodGFnczogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWhhc2h0YWdzJyksXG5cdFx0dHdlZXRJZDogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXR3ZWV0LWlkJyksXG5cdFx0cmVsYXRlZDogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXJlbGF0ZWQnKSxcblx0XHRzY3JlZW5OYW1lOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtc2NyZWVuLW5hbWUnKSxcblx0XHR1c2VySWQ6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS11c2VyLWlkJyksXG5cdFx0bGluazogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWxpbmsnKSxcblx0XHRwaWN0dXJlOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtcGljdHVyZScpLFxuXHRcdGNhcHRpb246IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jYXB0aW9uJyksXG5cdFx0ZGVzY3JpcHRpb246IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1kZXNjcmlwdGlvbicpLFxuXHRcdHVzZXI6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS11c2VyJyksXG5cdFx0dmlkZW86IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS12aWRlbycpLFxuXHRcdHVzZXJuYW1lOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdXNlcm5hbWUnKSxcblx0XHR0aXRsZTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXRpdGxlJyksXG5cdFx0bWVkaWE6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1tZWRpYScpLFxuXHRcdHRvOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdG8nKSxcblx0XHRzdWJqZWN0OiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtc3ViamVjdCcpLFxuXHRcdGJvZHk6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1ib2R5JyksXG5cdFx0aW9zOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtaW9zJyksXG5cdFx0dHlwZTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXR5cGUnKSxcblx0XHRjZW50ZXI6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jZW50ZXInKSxcblx0XHR2aWV3czogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXZpZXdzJyksXG5cdFx0em9vbTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXpvb20nKSxcblx0XHRzZWFyY2g6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1zZWFyY2gnKSxcblx0XHRzYWRkcjogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXNhZGRyJyksXG5cdFx0ZGFkZHI6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1kYWRkcicpLFxuXHRcdGRpcmVjdGlvbnNtb2RlOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtZGlyZWN0aW9ucy1tb2RlJyksXG5cdFx0cmVwbzogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXJlcG8nKSxcblx0XHRzaG90OiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtc2hvdCcpLFxuXHRcdHBlbjogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXBlbicpLFxuXHRcdHZpZXc6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS12aWV3JyksXG5cdFx0aXNzdWU6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1pc3N1ZScpLFxuXHRcdGJ1dHRvbklkOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtYnV0dG9uSWQnKSxcblx0XHRwb3BVcDogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXBvcHVwJyksXG5cdFx0a2V5OiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLWtleScpXG5cdH0pO1xufVxuIiwiY29uc3QgRXZlbnRzID0gcmVxdWlyZSgnLi4vc3JjL21vZHVsZXMvZXZlbnRzJyk7XG5jb25zdCBzZXREYXRhID0gcmVxdWlyZSgnLi9zZXREYXRhJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gc2hhcmU7XG5cbmZ1bmN0aW9uIHNoYXJlKGUsIG9zLCBvcGVuU2hhcmUpIHtcblx0Ly8gaWYgZHluYW1pYyBpbnN0YW5jZSB0aGVuIGZldGNoIGF0dHJpYnV0ZXMgYWdhaW4gaW4gY2FzZSBvZiB1cGRhdGVzXG5cdGlmIChvcGVuU2hhcmUuZHluYW1pYykge1xuXHRcdHNldERhdGEob3BlblNoYXJlLCBvcyk7XG5cdH1cblxuXHRvcGVuU2hhcmUuc2hhcmUoZSk7XG5cblx0Ly8gdHJpZ2dlciBzaGFyZWQgZXZlbnRcblx0RXZlbnRzLnRyaWdnZXIob3MsICdzaGFyZWQnKTtcbn1cbiIsIi8qXG4gICBTb21ldGltZXMgc29jaWFsIHBsYXRmb3JtcyBnZXQgY29uZnVzZWQgYW5kIGRyb3Agc2hhcmUgY291bnRzLlxuICAgSW4gdGhpcyBtb2R1bGUgd2UgY2hlY2sgaWYgdGhlIHJldHVybmVkIGNvdW50IGlzIGxlc3MgdGhhbiB0aGUgY291bnQgaW5cbiAgIGxvY2Fsc3RvcmFnZS5cbiAgIElmIHRoZSBsb2NhbCBjb3VudCBpcyBncmVhdGVyIHRoYW4gdGhlIHJldHVybmVkIGNvdW50LFxuICAgd2Ugc3RvcmUgdGhlIGxvY2FsIGNvdW50ICsgdGhlIHJldHVybmVkIGNvdW50LlxuICAgT3RoZXJ3aXNlLCBzdG9yZSB0aGUgcmV0dXJuZWQgY291bnQuXG4qL1xuXG5tb2R1bGUuZXhwb3J0cyA9ICh0LCBjb3VudCkgPT4ge1xuXHRjb25zdCBpc0FyciA9IHQudHlwZS5pbmRleE9mKCcsJykgPiAtMTtcblx0Y29uc3QgbG9jYWwgPSBOdW1iZXIodC5zdG9yZUdldCh0LnR5cGUgKyAnLScgKyB0LnNoYXJlZCkpO1xuXG5cdGlmIChsb2NhbCA+IGNvdW50ICYmICFpc0Fycikge1xuXHRcdGNvbnN0IGxhdGVzdENvdW50ID0gTnVtYmVyKHQuc3RvcmVHZXQodC50eXBlICsgJy0nICsgdC5zaGFyZWQgKyAnLWxhdGVzdENvdW50JykpO1xuXHRcdHQuc3RvcmVTZXQodC50eXBlICsgJy0nICsgdC5zaGFyZWQgKyAnLWxhdGVzdENvdW50JywgY291bnQpO1xuXG5cdFx0Y291bnQgPSBpc051bWVyaWMobGF0ZXN0Q291bnQpICYmIGxhdGVzdENvdW50ID4gMCA/XG5cdFx0XHRjb3VudCArPSBsb2NhbCAtIGxhdGVzdENvdW50IDpcblx0XHRcdGNvdW50ICs9IGxvY2FsO1xuXG5cdH1cblxuXHRpZiAoIWlzQXJyKSB0LnN0b3JlU2V0KHQudHlwZSArICctJyArIHQuc2hhcmVkLCBjb3VudCk7XG5cdHJldHVybiBjb3VudDtcbn07XG5cbmZ1bmN0aW9uIGlzTnVtZXJpYyhuKSB7XG4gIHJldHVybiAhaXNOYU4ocGFyc2VGbG9hdChuKSkgJiYgaXNGaW5pdGUobik7XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHtcblx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIHJlcXVpcmUoJy4vbGliL2luaXQnKSh7XG5cdFx0YXBpOiAnc2hhcmUnLFxuXHRcdHNlbGVjdG9yOiAnW2RhdGEtb3Blbi1zaGFyZV06bm90KFtkYXRhLW9wZW4tc2hhcmUtbm9kZV0pJyxcblx0XHRjYjogcmVxdWlyZSgnLi9saWIvaW5pdGlhbGl6ZVNoYXJlTm9kZScpXG5cdH0pKTtcblxuXHRyZXR1cm4gcmVxdWlyZSgnLi9zcmMvbW9kdWxlcy9zaGFyZS1hcGknKSgpO1xufSkoKTtcbiIsIi8qKlxuICogY291bnQgQVBJXG4gKi9cblxudmFyIGNvdW50ID0gcmVxdWlyZSgnLi9jb3VudCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuXG5cdC8vIGdsb2JhbCBPcGVuU2hhcmUgcmVmZXJlbmNpbmcgaW50ZXJuYWwgY2xhc3MgZm9yIGluc3RhbmNlIGdlbmVyYXRpb25cblx0Y2xhc3MgQ291bnQge1xuXG5cdFx0Y29uc3RydWN0b3Ioe1xuXHRcdFx0dHlwZSxcblx0XHRcdHVybCxcblx0XHRcdGFwcGVuZFRvID0gZmFsc2UsXG5cdFx0XHRlbGVtZW50LFxuXHRcdFx0Y2xhc3Nlcyxcblx0XHRcdGtleSA9IG51bGxcblx0XHR9LCBjYikge1xuXHRcdFx0dmFyIGNvdW50Tm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoZWxlbWVudCB8fCAnc3BhbicpO1xuXG5cdFx0XHRjb3VudE5vZGUuc2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY291bnQnLCB0eXBlKTtcblx0XHRcdGNvdW50Tm9kZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudC11cmwnLCB1cmwpO1xuXHRcdFx0aWYgKGtleSkgY291bnROb2RlLnNldEF0dHJpYnV0ZSgnZGF0YS1rZXknLCBrZXkpO1xuXHRcdFx0XG5cdFx0XHRjb3VudE5vZGUuY2xhc3NMaXN0LmFkZCgnb3Blbi1zaGFyZS1jb3VudCcpO1xuXG5cdFx0XHRpZiAoY2xhc3NlcyAmJiBBcnJheS5pc0FycmF5KGNsYXNzZXMpKSB7XG5cdFx0XHRcdGNsYXNzZXMuZm9yRWFjaChjc3NDTGFzcyA9PiB7XG5cdFx0XHRcdFx0Y291bnROb2RlLmNsYXNzTGlzdC5hZGQoY3NzQ0xhc3MpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGFwcGVuZFRvKSB7XG5cdFx0XHRcdHJldHVybiBuZXcgY291bnQodHlwZSwgdXJsKS5jb3VudChjb3VudE5vZGUsIGNiLCBhcHBlbmRUbyk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBuZXcgY291bnQodHlwZSwgdXJsKS5jb3VudChjb3VudE5vZGUsIGNiKTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gQ291bnQ7XG59O1xuIiwiY29uc3QgY291bnRSZWR1Y2UgPSByZXF1aXJlKCcuLi8uLi9saWIvY291bnRSZWR1Y2UnKTtcbmNvbnN0IHN0b3JlQ291bnQgPSByZXF1aXJlKCcuLi8uLi9saWIvc3RvcmVDb3VudCcpO1xuXG4vKipcbiAqIE9iamVjdCBvZiB0cmFuc2Zvcm0gZnVuY3Rpb25zIGZvciBlYWNoIG9wZW5zaGFyZSBhcGlcbiAqIFRyYW5zZm9ybSBmdW5jdGlvbnMgcGFzc2VkIGludG8gT3BlblNoYXJlIGluc3RhbmNlIHdoZW4gaW5zdGFudGlhdGVkXG4gKiBSZXR1cm4gb2JqZWN0IGNvbnRhaW5pbmcgVVJMIGFuZCBrZXkvdmFsdWUgYXJnc1xuICovXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuXHQvLyBmYWNlYm9vayBjb3VudCBkYXRhXG5cdGZhY2Vib29rICh1cmwpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogJ2dldCcsXG5cdFx0XHR1cmw6IGBodHRwczovL2dyYXBoLmZhY2Vib29rLmNvbS8/aWQ9JHt1cmx9YCxcblx0XHRcdHRyYW5zZm9ybTogZnVuY3Rpb24oeGhyKSB7XG5cdFx0XHRcdGxldCBjb3VudCA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCkuc2hhcmVzO1xuXHRcdFx0XHRyZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBjb3VudCk7XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBwaW50ZXJlc3QgY291bnQgZGF0YVxuXHRwaW50ZXJlc3QgKHVybCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiAnanNvbnAnLFxuXHRcdFx0dXJsOiBgaHR0cHM6Ly9hcGkucGludGVyZXN0LmNvbS92MS91cmxzL2NvdW50Lmpzb24/Y2FsbGJhY2s9PyZ1cmw9JHt1cmx9YCxcblx0XHRcdHRyYW5zZm9ybTogZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0XHRsZXQgY291bnQgPSBkYXRhLmNvdW50O1xuXHRcdFx0XHRyZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBjb3VudCk7XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBsaW5rZWRpbiBjb3VudCBkYXRhXG5cdGxpbmtlZGluICh1cmwpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogJ2pzb25wJyxcblx0XHRcdHVybDogYGh0dHBzOi8vd3d3LmxpbmtlZGluLmNvbS9jb3VudHNlcnYvY291bnQvc2hhcmU/dXJsPSR7dXJsfSZmb3JtYXQ9anNvbnAmY2FsbGJhY2s9P2AsXG5cdFx0XHR0cmFuc2Zvcm06IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdFx0bGV0IGNvdW50ID0gZGF0YS5jb3VudDtcblx0XHRcdFx0cmV0dXJuIHN0b3JlQ291bnQodGhpcywgY291bnQpO1xuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gcmVkZGl0IGNvdW50IGRhdGFcblx0cmVkZGl0ICh1cmwpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogJ2dldCcsXG5cdFx0XHR1cmw6IGBodHRwczovL3d3dy5yZWRkaXQuY29tL2FwaS9pbmZvLmpzb24/dXJsPSR7dXJsfWAsXG5cdFx0XHR0cmFuc2Zvcm06IGZ1bmN0aW9uKHhocikge1xuXHRcdFx0XHRsZXQgcG9zdHMgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpLmRhdGEuY2hpbGRyZW4sXG5cdFx0XHRcdFx0dXBzID0gMDtcblxuXHRcdFx0XHRwb3N0cy5mb3JFYWNoKChwb3N0KSA9PiB7XG5cdFx0XHRcdFx0dXBzICs9IE51bWJlcihwb3N0LmRhdGEudXBzKTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0cmV0dXJuIHN0b3JlQ291bnQodGhpcywgdXBzKTtcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIGdvb2dsZSBjb3VudCBkYXRhXG5cdGdvb2dsZSAodXJsKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHR5cGU6ICdwb3N0Jyxcblx0XHRcdGRhdGE6IHtcblx0XHRcdFx0bWV0aG9kOiAncG9zLnBsdXNvbmVzLmdldCcsXG5cdFx0XHRcdGlkOiAncCcsXG5cdFx0XHRcdHBhcmFtczoge1xuXHRcdFx0XHRcdG5vbG9nOiB0cnVlLFxuXHRcdFx0XHRcdGlkOiB1cmwsXG5cdFx0XHRcdFx0c291cmNlOiAnd2lkZ2V0Jyxcblx0XHRcdFx0XHR1c2VySWQ6ICdAdmlld2VyJyxcblx0XHRcdFx0XHRncm91cElkOiAnQHNlbGYnXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGpzb25ycGM6ICcyLjAnLFxuXHRcdFx0XHRrZXk6ICdwJyxcblx0XHRcdFx0YXBpVmVyc2lvbjogJ3YxJ1xuXHRcdFx0fSxcblx0XHRcdHVybDogYGh0dHBzOi8vY2xpZW50czYuZ29vZ2xlLmNvbS9ycGNgLFxuXHRcdFx0dHJhbnNmb3JtOiBmdW5jdGlvbih4aHIpIHtcblx0XHRcdFx0bGV0IGNvdW50ID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KS5yZXN1bHQubWV0YWRhdGEuZ2xvYmFsQ291bnRzLmNvdW50O1xuXHRcdFx0XHRyZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBjb3VudCk7XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBnaXRodWIgc3RhciBjb3VudFxuXHRnaXRodWJTdGFycyAocmVwbykge1xuXHRcdHJlcG8gPSByZXBvLmluZGV4T2YoJ2dpdGh1Yi5jb20vJykgPiAtMSA/XG5cdFx0XHRyZXBvLnNwbGl0KCdnaXRodWIuY29tLycpWzFdIDpcblx0XHRcdHJlcG87XG5cdFx0cmV0dXJuIHtcblx0XHRcdHR5cGU6ICdnZXQnLFxuXHRcdFx0dXJsOiBgaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9yZXBvcy8ke3JlcG99YCxcblx0XHRcdHRyYW5zZm9ybTogZnVuY3Rpb24oeGhyKSB7XG5cdFx0XHRcdGxldCBjb3VudCA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCkuc3RhcmdhemVyc19jb3VudDtcblx0XHRcdFx0cmV0dXJuIHN0b3JlQ291bnQodGhpcywgY291bnQpO1xuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gZ2l0aHViIGZvcmtzIGNvdW50XG5cdGdpdGh1YkZvcmtzIChyZXBvKSB7XG5cdFx0cmVwbyA9IHJlcG8uaW5kZXhPZignZ2l0aHViLmNvbS8nKSA+IC0xID9cblx0XHRcdHJlcG8uc3BsaXQoJ2dpdGh1Yi5jb20vJylbMV0gOlxuXHRcdFx0cmVwbztcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogJ2dldCcsXG5cdFx0XHR1cmw6IGBodHRwczovL2FwaS5naXRodWIuY29tL3JlcG9zLyR7cmVwb31gLFxuXHRcdFx0dHJhbnNmb3JtOiBmdW5jdGlvbih4aHIpIHtcblx0XHRcdFx0bGV0IGNvdW50ID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KS5mb3Jrc19jb3VudDtcblx0XHRcdFx0cmV0dXJuIHN0b3JlQ291bnQodGhpcywgY291bnQpO1xuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gZ2l0aHViIHdhdGNoZXJzIGNvdW50XG5cdGdpdGh1YldhdGNoZXJzIChyZXBvKSB7XG5cdFx0cmVwbyA9IHJlcG8uaW5kZXhPZignZ2l0aHViLmNvbS8nKSA+IC0xID9cblx0XHRcdHJlcG8uc3BsaXQoJ2dpdGh1Yi5jb20vJylbMV0gOlxuXHRcdFx0cmVwbztcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogJ2dldCcsXG5cdFx0XHR1cmw6IGBodHRwczovL2FwaS5naXRodWIuY29tL3JlcG9zLyR7cmVwb31gLFxuXHRcdFx0dHJhbnNmb3JtOiBmdW5jdGlvbih4aHIpIHtcblx0XHRcdFx0bGV0IGNvdW50ID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KS53YXRjaGVyc19jb3VudDtcblx0XHRcdFx0cmV0dXJuIHN0b3JlQ291bnQodGhpcywgY291bnQpO1xuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gZHJpYmJibGUgbGlrZXMgY291bnRcblx0ZHJpYmJibGUgKHNob3QpIHtcblx0XHRzaG90ID0gc2hvdC5pbmRleE9mKCdkcmliYmJsZS5jb20vc2hvdHMnKSA+IC0xID9cblx0XHRcdHNob3Quc3BsaXQoJ3Nob3RzLycpWzFdIDpcblx0XHRcdHNob3Q7XG5cdFx0Y29uc3QgdXJsID0gYGh0dHBzOi8vYXBpLmRyaWJiYmxlLmNvbS92MS9zaG90cy8ke3Nob3R9L2xpa2VzYDtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogJ2dldCcsXG5cdFx0XHR1cmw6IHVybCxcblx0XHRcdHRyYW5zZm9ybTogZnVuY3Rpb24oeGhyLCBFdmVudHMpIHtcblx0XHRcdFx0bGV0IGNvdW50ID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KS5sZW5ndGg7XG5cblx0XHRcdFx0Ly8gYXQgdGhpcyB0aW1lIGRyaWJiYmxlIGxpbWl0cyBhIHJlc3BvbnNlIG9mIDEyIGxpa2VzIHBlciBwYWdlXG5cdFx0XHRcdGlmIChjb3VudCA9PT0gMTIpIHtcblx0XHRcdFx0XHRsZXQgcGFnZSA9IDI7XG5cdFx0XHRcdFx0cmVjdXJzaXZlQ291bnQodXJsLCBwYWdlLCBjb3VudCwgZmluYWxDb3VudCA9PiB7XG5cdFx0XHRcdFx0XHRpZiAodGhpcy5hcHBlbmRUbyAmJiB0eXBlb2YgdGhpcy5hcHBlbmRUbyAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdFx0XHR0aGlzLmFwcGVuZFRvLmFwcGVuZENoaWxkKHRoaXMub3MpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0Y291bnRSZWR1Y2UodGhpcy5vcywgZmluYWxDb3VudCwgdGhpcy5jYik7XG5cdFx0XHRcdFx0XHRFdmVudHMudHJpZ2dlcih0aGlzLm9zLCAnY291bnRlZC0nICsgdGhpcy51cmwpO1xuXHRcdFx0XHRcdFx0cmV0dXJuIHN0b3JlQ291bnQodGhpcywgZmluYWxDb3VudCk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmV0dXJuIHN0b3JlQ291bnQodGhpcywgY291bnQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHR0d2l0dGVyICh1cmwpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogJ2dldCcsXG5cdFx0XHR1cmw6IGBodHRwczovL2FwaS5vcGVuc2hhcmUuc29jaWFsL2pvYj91cmw9JHt1cmx9JmtleT1gLFxuXHRcdFx0dHJhbnNmb3JtOiBmdW5jdGlvbih4aHIpIHtcblx0XHRcdFx0bGV0IGNvdW50ID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KS5jb3VudDtcblx0XHRcdFx0cmV0dXJuIHN0b3JlQ291bnQodGhpcywgY291bnQpO1xuXHRcdFx0fVxuXHRcdH07XG5cdH1cbn07XG5cbmZ1bmN0aW9uIHJlY3Vyc2l2ZUNvdW50ICh1cmwsIHBhZ2UsIGNvdW50LCBjYikge1xuXHRjb25zdCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblx0eGhyLm9wZW4oJ0dFVCcsIHVybCArICc/cGFnZT0nICsgcGFnZSk7XG5cdHhoci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuXHRcdGNvbnN0IGxpa2VzID0gSlNPTi5wYXJzZSh0aGlzLnJlc3BvbnNlKTtcblx0XHRjb3VudCArPSBsaWtlcy5sZW5ndGg7XG5cblx0XHQvLyBkcmliYmJsZSBsaWtlIHBlciBwYWdlIGlzIDEyXG5cdFx0aWYgKGxpa2VzLmxlbmd0aCA9PT0gMTIpIHtcblx0XHRcdHBhZ2UrKztcblx0XHRcdHJlY3Vyc2l2ZUNvdW50KHVybCwgcGFnZSwgY291bnQsIGNiKTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRjYihjb3VudCk7XG5cdFx0fVxuXHR9KTtcblx0eGhyLnNlbmQoKTtcbn1cbiIsIi8qKlxuICogR2VuZXJhdGUgc2hhcmUgY291bnQgaW5zdGFuY2UgZnJvbSBvbmUgdG8gbWFueSBuZXR3b3Jrc1xuICovXG5cbmNvbnN0IENvdW50VHJhbnNmb3JtcyA9IHJlcXVpcmUoJy4vY291bnQtdHJhbnNmb3JtcycpO1xuY29uc3QgRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcbmNvbnN0IGNvdW50UmVkdWNlID0gcmVxdWlyZSgnLi4vLi4vbGliL2NvdW50UmVkdWNlJyk7XG5jb25zdCBzdG9yZUNvdW50ID0gcmVxdWlyZSgnLi4vLi4vbGliL3N0b3JlQ291bnQnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBDb3VudCB7XG5cblx0Y29uc3RydWN0b3IodHlwZSwgdXJsKSB7XG5cblx0XHQvLyB0aHJvdyBlcnJvciBpZiBubyB1cmwgcHJvdmlkZWRcblx0XHRpZiAoIXVybCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBPcGVuIFNoYXJlOiBubyB1cmwgcHJvdmlkZWQgZm9yIGNvdW50YCk7XG5cdFx0fVxuXG5cdFx0Ly8gY2hlY2sgZm9yIEdpdGh1YiBjb3VudHNcblx0XHRpZiAodHlwZS5pbmRleE9mKCdnaXRodWInKSA9PT0gMCkge1xuXHRcdFx0aWYgKHR5cGUgPT09ICdnaXRodWItc3RhcnMnKSB7XG5cdFx0XHRcdHR5cGUgPSAnZ2l0aHViU3RhcnMnO1xuXHRcdFx0fSBlbHNlIGlmICh0eXBlID09PSAnZ2l0aHViLWZvcmtzJykge1xuXHRcdFx0XHR0eXBlID0gJ2dpdGh1YkZvcmtzJztcblx0XHRcdH0gZWxzZSBpZiAodHlwZSA9PT0gJ2dpdGh1Yi13YXRjaGVycycpIHtcblx0XHRcdFx0dHlwZSA9ICdnaXRodWJXYXRjaGVycyc7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKCdJbnZhbGlkIEdpdGh1YiBjb3VudCB0eXBlLiBUcnkgZ2l0aHViLXN0YXJzLCBnaXRodWItZm9ya3MsIG9yIGdpdGh1Yi13YXRjaGVycy4nKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBpZiB0eXBlIGlzIGNvbW1hIHNlcGFyYXRlIGxpc3QgY3JlYXRlIGFycmF5XG5cdFx0aWYgKHR5cGUuaW5kZXhPZignLCcpID4gLTEpIHtcblx0XHRcdHRoaXMudHlwZSA9IHR5cGU7XG5cdFx0XHR0aGlzLnR5cGVBcnIgPSB0aGlzLnR5cGUuc3BsaXQoJywnKTtcblx0XHRcdHRoaXMuY291bnREYXRhID0gW107XG5cblx0XHRcdC8vIGNoZWNrIGVhY2ggdHlwZSBzdXBwbGllZCBpcyB2YWxpZFxuXHRcdFx0dGhpcy50eXBlQXJyLmZvckVhY2goKHQpID0+IHtcblx0XHRcdFx0aWYgKCFDb3VudFRyYW5zZm9ybXNbdF0pIHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoYE9wZW4gU2hhcmU6ICR7dHlwZX0gaXMgYW4gaW52YWxpZCBjb3VudCB0eXBlYCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR0aGlzLmNvdW50RGF0YS5wdXNoKENvdW50VHJhbnNmb3Jtc1t0XSh1cmwpKTtcblx0XHRcdH0pO1xuXG5cdFx0Ly8gdGhyb3cgZXJyb3IgaWYgaW52YWxpZCB0eXBlIHByb3ZpZGVkXG5cdFx0fSBlbHNlIGlmICghQ291bnRUcmFuc2Zvcm1zW3R5cGVdKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYE9wZW4gU2hhcmU6ICR7dHlwZX0gaXMgYW4gaW52YWxpZCBjb3VudCB0eXBlYCk7XG5cblx0XHQvLyBzaW5nbGUgY291bnRcblx0XHQvLyBzdG9yZSBjb3VudCBVUkwgYW5kIHRyYW5zZm9ybSBmdW5jdGlvblxuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLnR5cGUgPSB0eXBlO1xuXHRcdFx0dGhpcy5jb3VudERhdGEgPSBDb3VudFRyYW5zZm9ybXNbdHlwZV0odXJsKTtcblx0XHR9XG5cdH1cblxuXHQvLyBoYW5kbGUgY2FsbGluZyBnZXRDb3VudCAvIGdldENvdW50c1xuXHQvLyBkZXBlbmRpbmcgb24gbnVtYmVyIG9mIHR5cGVzXG5cdGNvdW50KG9zLCBjYiwgYXBwZW5kVG8pIHtcblx0XHR0aGlzLm9zID0gb3M7XG5cdFx0dGhpcy5hcHBlbmRUbyA9IGFwcGVuZFRvO1xuXHRcdHRoaXMuY2IgPSBjYjtcbiAgICBcdHRoaXMudXJsID0gdGhpcy5vcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudCcpO1xuXHRcdHRoaXMuc2hhcmVkID0gdGhpcy5vcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudC11cmwnKTtcblx0XHR0aGlzLmtleSA9IHRoaXMub3MuZ2V0QXR0cmlidXRlKCdkYXRhLWtleScpO1xuXG5cdFx0aWYgKCFBcnJheS5pc0FycmF5KHRoaXMuY291bnREYXRhKSkge1xuXHRcdFx0dGhpcy5nZXRDb3VudCgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLmdldENvdW50cygpO1xuXHRcdH1cblx0fVxuXG5cdC8vIGZldGNoIGNvdW50IGVpdGhlciBBSkFYIG9yIEpTT05QXG5cdGdldENvdW50KCkge1xuXHRcdHZhciBjb3VudCA9IHRoaXMuc3RvcmVHZXQodGhpcy50eXBlICsgJy0nICsgdGhpcy5zaGFyZWQpO1xuXG5cdFx0aWYgKGNvdW50KSB7XG5cdFx0XHRpZiAodGhpcy5hcHBlbmRUbyAmJiB0eXBlb2YgdGhpcy5hcHBlbmRUbyAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHR0aGlzLmFwcGVuZFRvLmFwcGVuZENoaWxkKHRoaXMub3MpO1xuXHRcdFx0fVxuXHRcdFx0Y291bnRSZWR1Y2UodGhpcy5vcywgY291bnQpO1xuXHRcdH1cblx0XHR0aGlzW3RoaXMuY291bnREYXRhLnR5cGVdKHRoaXMuY291bnREYXRhKTtcblx0fVxuXG5cdC8vIGZldGNoIG11bHRpcGxlIGNvdW50cyBhbmQgYWdncmVnYXRlXG5cdGdldENvdW50cygpIHtcblx0XHR0aGlzLnRvdGFsID0gW107XG5cblx0XHR2YXIgY291bnQgPSB0aGlzLnN0b3JlR2V0KHRoaXMudHlwZSArICctJyArIHRoaXMuc2hhcmVkKTtcblxuXHRcdGlmIChjb3VudCkge1xuXHRcdFx0aWYgKHRoaXMuYXBwZW5kVG8gICYmIHR5cGVvZiB0aGlzLmFwcGVuZFRvICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdHRoaXMuYXBwZW5kVG8uYXBwZW5kQ2hpbGQodGhpcy5vcyk7XG5cdFx0XHR9XG5cdFx0XHRjb3VudFJlZHVjZSh0aGlzLm9zLCBjb3VudCk7XG5cdFx0fVxuXG5cdFx0dGhpcy5jb3VudERhdGEuZm9yRWFjaChjb3VudERhdGEgPT4ge1xuXG5cdFx0XHR0aGlzW2NvdW50RGF0YS50eXBlXShjb3VudERhdGEsIChudW0pID0+IHtcblx0XHRcdFx0dGhpcy50b3RhbC5wdXNoKG51bSk7XG5cblx0XHRcdFx0Ly8gdG90YWwgY291bnRzIGxlbmd0aCBub3cgZXF1YWxzIHR5cGUgYXJyYXkgbGVuZ3RoXG5cdFx0XHRcdC8vIHNvIGFnZ3JlZ2F0ZSwgc3RvcmUgYW5kIGluc2VydCBpbnRvIERPTVxuXHRcdFx0XHRpZiAodGhpcy50b3RhbC5sZW5ndGggPT09IHRoaXMudHlwZUFyci5sZW5ndGgpIHtcblx0XHRcdFx0XHRsZXQgdG90ID0gMDtcblxuXHRcdFx0XHRcdHRoaXMudG90YWwuZm9yRWFjaCgodCkgPT4ge1xuXHRcdFx0XHRcdFx0dG90ICs9IHQ7XG5cdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRpZiAodGhpcy5hcHBlbmRUbyAgJiYgdHlwZW9mIHRoaXMuYXBwZW5kVG8gIT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRcdHRoaXMuYXBwZW5kVG8uYXBwZW5kQ2hpbGQodGhpcy5vcyk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Y29uc3QgbG9jYWwgPSBOdW1iZXIodGhpcy5zdG9yZUdldCh0aGlzLnR5cGUgKyAnLScgKyB0aGlzLnNoYXJlZCkpO1xuXHRcdFx0XHRcdGlmIChsb2NhbCA+IHRvdCkge1xuXHRcdFx0XHRcdFx0Y29uc3QgbGF0ZXN0Q291bnQgPSBOdW1iZXIodGhpcy5zdG9yZUdldCh0aGlzLnR5cGUgKyAnLScgKyB0aGlzLnNoYXJlZCArICctbGF0ZXN0Q291bnQnKSk7XG5cdFx0XHRcdFx0XHR0aGlzLnN0b3JlU2V0KHRoaXMudHlwZSArICctJyArIHRoaXMuc2hhcmVkICsgJy1sYXRlc3RDb3VudCcsIHRvdCk7XG5cblx0XHRcdFx0XHRcdHRvdCA9IGlzTnVtZXJpYyhsYXRlc3RDb3VudCkgJiYgbGF0ZXN0Q291bnQgPiAwID9cblx0XHRcdFx0XHRcdFx0dG90ICs9IGxvY2FsIC0gbGF0ZXN0Q291bnQgOlxuXHRcdFx0XHRcdFx0XHR0b3QgKz0gbG9jYWw7XG5cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0dGhpcy5zdG9yZVNldCh0aGlzLnR5cGUgKyAnLScgKyB0aGlzLnNoYXJlZCwgdG90KTtcblxuXHRcdFx0XHRcdGNvdW50UmVkdWNlKHRoaXMub3MsIHRvdCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0aWYgKHRoaXMuYXBwZW5kVG8gICYmIHR5cGVvZiB0aGlzLmFwcGVuZFRvICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHR0aGlzLmFwcGVuZFRvLmFwcGVuZENoaWxkKHRoaXMub3MpO1xuXHRcdH1cblx0fVxuXG5cdC8vIGhhbmRsZSBKU09OUCByZXF1ZXN0c1xuXHRqc29ucChjb3VudERhdGEsIGNiKSB7XG5cdFx0Ly8gZGVmaW5lIHJhbmRvbSBjYWxsYmFjayBhbmQgYXNzaWduIHRyYW5zZm9ybSBmdW5jdGlvblxuXHRcdGxldCBjYWxsYmFjayA9IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZyg3KS5yZXBsYWNlKC9bXmEtekEtWl0vZywgJycpO1xuXHRcdHdpbmRvd1tjYWxsYmFja10gPSAoZGF0YSkgPT4ge1xuXHRcdFx0bGV0IGNvdW50ID0gY291bnREYXRhLnRyYW5zZm9ybS5hcHBseSh0aGlzLCBbZGF0YV0pIHx8IDA7XG5cblx0XHRcdGlmIChjYiAmJiB0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0Y2IoY291bnQpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aWYgKHRoaXMuYXBwZW5kVG8gICYmIHR5cGVvZiB0aGlzLmFwcGVuZFRvICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0dGhpcy5hcHBlbmRUby5hcHBlbmRDaGlsZCh0aGlzLm9zKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRjb3VudFJlZHVjZSh0aGlzLm9zLCBjb3VudCwgdGhpcy5jYik7XG5cdFx0XHR9XG5cblx0XHRcdEV2ZW50cy50cmlnZ2VyKHRoaXMub3MsICdjb3VudGVkLScgKyB0aGlzLnVybCk7XG5cdFx0fTtcblxuXHRcdC8vIGFwcGVuZCBKU09OUCBzY3JpcHQgdGFnIHRvIHBhZ2Vcblx0XHRsZXQgc2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG5cdFx0c2NyaXB0LnNyYyA9IGNvdW50RGF0YS51cmwucmVwbGFjZSgnY2FsbGJhY2s9PycsIGBjYWxsYmFjaz0ke2NhbGxiYWNrfWApO1xuXHRcdGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0uYXBwZW5kQ2hpbGQoc2NyaXB0KTtcblxuXHRcdHJldHVybjtcblx0fVxuXG5cdC8vIGhhbmRsZSBBSkFYIEdFVCByZXF1ZXN0XG5cdGdldChjb3VudERhdGEsIGNiKSB7XG5cdFx0bGV0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG5cdFx0Ly8gb24gc3VjY2VzcyBwYXNzIHJlc3BvbnNlIHRvIHRyYW5zZm9ybSBmdW5jdGlvblxuXHRcdHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSAoKSA9PiB7XG5cdFx0XHRpZiAoeGhyLnJlYWR5U3RhdGUgPT09IDQpIHtcblx0XHRcdFx0aWYgKHhoci5zdGF0dXMgPT09IDIwMCkge1xuXHRcdFx0XHRcdGxldCBjb3VudCA9IGNvdW50RGF0YS50cmFuc2Zvcm0uYXBwbHkodGhpcywgW3hociwgRXZlbnRzXSkgfHwgMDtcblxuXHRcdFx0XHRcdGlmIChjYiAmJiB0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRcdGNiKGNvdW50KTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0aWYgKHRoaXMuYXBwZW5kVG8gJiYgdHlwZW9mIHRoaXMuYXBwZW5kVG8gIT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRcdFx0dGhpcy5hcHBlbmRUby5hcHBlbmRDaGlsZCh0aGlzLm9zKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGNvdW50UmVkdWNlKHRoaXMub3MsIGNvdW50LCB0aGlzLmNiKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRFdmVudHMudHJpZ2dlcih0aGlzLm9zLCAnY291bnRlZC0nICsgdGhpcy51cmwpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGlmIChjb3VudERhdGEudXJsLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignaHR0cHM6Ly9hcGkub3BlbnNoYXJlLnNvY2lhbC9qb2I/JykgPT09IDApIHtcblx0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoJ1BsZWFzZSBzaWduIHVwIGZvciBUd2l0dGVyIGNvdW50cyBhdCBodHRwczovL29wZW5zaGFyZS5zb2NpYWwvdHdpdHRlci9hdXRoJyk7XG5cdFx0XHRcdFx0fSBlbHNlIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBnZXQgQVBJIGRhdGEgZnJvbScsIGNvdW50RGF0YS51cmwsICcuIFBsZWFzZSB1c2UgdGhlIGxhdGVzdCB2ZXJzaW9uIG9mIE9wZW5TaGFyZS4nKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cdFx0Y291bnREYXRhLnVybCA9IHRoaXMua2V5ID8gY291bnREYXRhLnVybCArIHRoaXMua2V5IDogY291bnREYXRhLnVybDtcblx0XHR4aHIub3BlbignR0VUJywgY291bnREYXRhLnVybCk7XG5cdFx0eGhyLnNlbmQoKTtcblx0fVxuXG5cdC8vIGhhbmRsZSBBSkFYIFBPU1QgcmVxdWVzdFxuXHRwb3N0KGNvdW50RGF0YSwgY2IpIHtcblx0XHRsZXQgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cblx0XHQvLyBvbiBzdWNjZXNzIHBhc3MgcmVzcG9uc2UgdG8gdHJhbnNmb3JtIGZ1bmN0aW9uXG5cdFx0eGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9ICgpID0+IHtcblx0XHRcdGlmICh4aHIucmVhZHlTdGF0ZSAhPT0gWE1MSHR0cFJlcXVlc3QuRE9ORSB8fFxuXHRcdFx0XHR4aHIuc3RhdHVzICE9PSAyMDApIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRsZXQgY291bnQgPSBjb3VudERhdGEudHJhbnNmb3JtLmFwcGx5KHRoaXMsIFt4aHJdKSB8fCAwO1xuXG5cdFx0XHRpZiAoY2IgJiYgdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdGNiKGNvdW50KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGlmICh0aGlzLmFwcGVuZFRvICYmIHR5cGVvZiB0aGlzLmFwcGVuZFRvICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0dGhpcy5hcHBlbmRUby5hcHBlbmRDaGlsZCh0aGlzLm9zKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRjb3VudFJlZHVjZSh0aGlzLm9zLCBjb3VudCwgdGhpcy5jYik7XG5cdFx0XHR9XG5cdFx0XHRFdmVudHMudHJpZ2dlcih0aGlzLm9zLCAnY291bnRlZC0nICsgdGhpcy51cmwpO1xuXHRcdH07XG5cblx0XHR4aHIub3BlbignUE9TVCcsIGNvdW50RGF0YS51cmwpO1xuXHRcdHhoci5zZXRSZXF1ZXN0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbjtjaGFyc2V0PVVURi04Jyk7XG5cdFx0eGhyLnNlbmQoSlNPTi5zdHJpbmdpZnkoY291bnREYXRhLmRhdGEpKTtcblx0fVxuXG5cdHN0b3JlU2V0KHR5cGUsIGNvdW50ID0gMCkge1xuXHRcdGlmICghd2luZG93LmxvY2FsU3RvcmFnZSB8fCAhdHlwZSkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGxvY2FsU3RvcmFnZS5zZXRJdGVtKGBPcGVuU2hhcmUtJHt0eXBlfWAsIGNvdW50KTtcblx0fVxuXG5cdHN0b3JlR2V0KHR5cGUpIHtcblx0XHRpZiAoIXdpbmRvdy5sb2NhbFN0b3JhZ2UgfHwgIXR5cGUpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRyZXR1cm4gbG9jYWxTdG9yYWdlLmdldEl0ZW0oYE9wZW5TaGFyZS0ke3R5cGV9YCk7XG5cdH1cblxufTtcblxuZnVuY3Rpb24gaXNOdW1lcmljKG4pIHtcbiAgcmV0dXJuICFpc05hTihwYXJzZUZsb2F0KG4pKSAmJiBpc0Zpbml0ZShuKTtcbn1cbiIsIi8qKlxuICogVHJpZ2dlciBjdXN0b20gT3BlblNoYXJlIG5hbWVzcGFjZWQgZXZlbnRcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSB7XG5cdHRyaWdnZXI6IGZ1bmN0aW9uKGVsZW1lbnQsIGV2ZW50KSB7XG5cdFx0bGV0IGV2ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0V2ZW50Jyk7XG5cdFx0ZXYuaW5pdEV2ZW50KCdPcGVuU2hhcmUuJyArIGV2ZW50LCB0cnVlLCB0cnVlKTtcblx0XHRlbGVtZW50LmRpc3BhdGNoRXZlbnQoZXYpO1xuXHR9XG59O1xuIiwiLyoqXG4gKiBPcGVuU2hhcmUgZ2VuZXJhdGVzIGEgc2luZ2xlIHNoYXJlIGxpbmtcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBPcGVuU2hhcmUge1xuXG5cdGNvbnN0cnVjdG9yKHR5cGUsIHRyYW5zZm9ybSkge1xuXHRcdHRoaXMuaW9zID0gL2lQYWR8aVBob25lfGlQb2QvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkgJiYgIXdpbmRvdy5NU1N0cmVhbTtcblx0XHR0aGlzLnR5cGUgPSB0eXBlO1xuXHRcdHRoaXMuZHluYW1pYyA9IGZhbHNlO1xuXHRcdHRoaXMudHJhbnNmb3JtID0gdHJhbnNmb3JtO1xuXG5cdFx0Ly8gY2FwaXRhbGl6ZWQgdHlwZVxuXHRcdHRoaXMudHlwZUNhcHMgPSB0eXBlLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgdHlwZS5zbGljZSgxKTtcblx0fVxuXG5cdC8vIHJldHVybnMgZnVuY3Rpb24gbmFtZWQgYXMgdHlwZSBzZXQgaW4gY29uc3RydWN0b3Jcblx0Ly8gZS5nIHR3aXR0ZXIoKVxuXHRzZXREYXRhKGRhdGEpIHtcblx0XHQvLyBpZiBpT1MgdXNlciBhbmQgaW9zIGRhdGEgYXR0cmlidXRlIGRlZmluZWRcblx0XHQvLyBidWlsZCBpT1MgVVJMIHNjaGVtZSBhcyBzaW5nbGUgc3RyaW5nXG5cdFx0aWYgKHRoaXMuaW9zKSB7XG5cdFx0XHR0aGlzLnRyYW5zZm9ybURhdGEgPSB0aGlzLnRyYW5zZm9ybShkYXRhLCB0cnVlKTtcblx0XHRcdHRoaXMubW9iaWxlU2hhcmVVcmwgPSB0aGlzLnRlbXBsYXRlKHRoaXMudHJhbnNmb3JtRGF0YS51cmwsIHRoaXMudHJhbnNmb3JtRGF0YS5kYXRhKTtcblx0XHR9XG5cblx0XHR0aGlzLnRyYW5zZm9ybURhdGEgPSB0aGlzLnRyYW5zZm9ybShkYXRhKTtcblx0XHR0aGlzLnNoYXJlVXJsID0gdGhpcy50ZW1wbGF0ZSh0aGlzLnRyYW5zZm9ybURhdGEudXJsLCB0aGlzLnRyYW5zZm9ybURhdGEuZGF0YSk7XG5cdH1cblxuXHQvLyBvcGVuIHNoYXJlIFVSTCBkZWZpbmVkIGluIGluZGl2aWR1YWwgcGxhdGZvcm0gZnVuY3Rpb25zXG5cdHNoYXJlKGUpIHtcblx0XHQvLyBpZiBpT1Mgc2hhcmUgVVJMIGhhcyBiZWVuIHNldCB0aGVuIHVzZSB0aW1lb3V0IGhhY2tcblx0XHQvLyB0ZXN0IGZvciBuYXRpdmUgYXBwIGFuZCBmYWxsIGJhY2sgdG8gd2ViXG5cdFx0aWYgKHRoaXMubW9iaWxlU2hhcmVVcmwpIHtcblx0XHRcdHZhciBzdGFydCA9IChuZXcgRGF0ZSgpKS52YWx1ZU9mKCk7XG5cblx0XHRcdHNldFRpbWVvdXQoKCkgPT4ge1xuXHRcdFx0XHR2YXIgZW5kID0gKG5ldyBEYXRlKCkpLnZhbHVlT2YoKTtcblxuXHRcdFx0XHQvLyBpZiB0aGUgdXNlciBpcyBzdGlsbCBoZXJlLCBmYWxsIGJhY2sgdG8gd2ViXG5cdFx0XHRcdGlmIChlbmQgLSBzdGFydCA+IDE2MDApIHtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR3aW5kb3cubG9jYXRpb24gPSB0aGlzLnNoYXJlVXJsO1xuXHRcdFx0fSwgMTUwMCk7XG5cblx0XHRcdHdpbmRvdy5sb2NhdGlvbiA9IHRoaXMubW9iaWxlU2hhcmVVcmw7XG5cblx0XHQvLyBvcGVuIG1haWx0byBsaW5rcyBpbiBzYW1lIHdpbmRvd1xuXHRcdH0gZWxzZSBpZiAodGhpcy50eXBlID09PSAnZW1haWwnKSB7XG5cdFx0XHR3aW5kb3cubG9jYXRpb24gPSB0aGlzLnNoYXJlVXJsO1xuXG5cdFx0Ly8gb3BlbiBzb2NpYWwgc2hhcmUgVVJMcyBpbiBuZXcgd2luZG93XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIGlmIHBvcHVwIG9iamVjdCBwcmVzZW50IHRoZW4gc2V0IHdpbmRvdyBkaW1lbnNpb25zIC8gcG9zaXRpb25cblx0XHRcdGlmKHRoaXMucG9wdXAgJiYgdGhpcy50cmFuc2Zvcm1EYXRhLnBvcHVwKSB7XG5cdFx0XHRcdHJldHVybiB0aGlzLm9wZW5XaW5kb3codGhpcy5zaGFyZVVybCwgdGhpcy50cmFuc2Zvcm1EYXRhLnBvcHVwKTtcblx0XHRcdH1cblxuXHRcdFx0d2luZG93Lm9wZW4odGhpcy5zaGFyZVVybCk7XG5cdFx0fVxuXHR9XG5cblx0Ly8gY3JlYXRlIHNoYXJlIFVSTCB3aXRoIEdFVCBwYXJhbXNcblx0Ly8gYXBwZW5kaW5nIHZhbGlkIHByb3BlcnRpZXMgdG8gcXVlcnkgc3RyaW5nXG5cdHRlbXBsYXRlKHVybCwgZGF0YSkge1xuXHRcdGxldCBub25VUkxQcm9wcyA9IFtcblx0XHRcdCdhcHBlbmRUbycsXG5cdFx0XHQnaW5uZXJIVE1MJyxcblx0XHRcdCdjbGFzc2VzJ1xuXHRcdF07XG5cblx0XHRsZXQgc2hhcmVVcmwgPSB1cmwsXG5cdFx0XHRpO1xuXG5cdFx0Zm9yIChpIGluIGRhdGEpIHtcblx0XHRcdC8vIG9ubHkgYXBwZW5kIHZhbGlkIHByb3BlcnRpZXNcblx0XHRcdGlmICghZGF0YVtpXSB8fCBub25VUkxQcm9wcy5pbmRleE9mKGkpID4gLTEpIHtcblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHR9XG5cblx0XHRcdC8vIGFwcGVuZCBVUkwgZW5jb2RlZCBHRVQgcGFyYW0gdG8gc2hhcmUgVVJMXG5cdFx0XHRkYXRhW2ldID0gZW5jb2RlVVJJQ29tcG9uZW50KGRhdGFbaV0pO1xuXHRcdFx0c2hhcmVVcmwgKz0gYCR7aX09JHtkYXRhW2ldfSZgO1xuXHRcdH1cblxuXHRcdHJldHVybiBzaGFyZVVybC5zdWJzdHIoMCwgc2hhcmVVcmwubGVuZ3RoIC0gMSk7XG5cdH1cblxuXHQvLyBjZW50ZXIgcG9wdXAgd2luZG93IHN1cHBvcnRpbmcgZHVhbCBzY3JlZW5zXG5cdG9wZW5XaW5kb3codXJsLCBvcHRpb25zKSB7XG5cdFx0bGV0IGR1YWxTY3JlZW5MZWZ0ID0gd2luZG93LnNjcmVlbkxlZnQgIT0gdW5kZWZpbmVkID8gd2luZG93LnNjcmVlbkxlZnQgOiBzY3JlZW4ubGVmdCxcblx0XHRcdGR1YWxTY3JlZW5Ub3AgPSB3aW5kb3cuc2NyZWVuVG9wICE9IHVuZGVmaW5lZCA/IHdpbmRvdy5zY3JlZW5Ub3AgOiBzY3JlZW4udG9wLFxuXHRcdFx0d2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aCA/IHdpbmRvdy5pbm5lcldpZHRoIDogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoID8gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoIDogc2NyZWVuLndpZHRoLFxuXHRcdFx0aGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0ID8gd2luZG93LmlubmVySGVpZ2h0IDogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodCA/IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQgOiBzY3JlZW4uaGVpZ2h0LFxuXHRcdFx0bGVmdCA9ICgod2lkdGggLyAyKSAtIChvcHRpb25zLndpZHRoIC8gMikpICsgZHVhbFNjcmVlbkxlZnQsXG5cdFx0XHR0b3AgPSAoKGhlaWdodCAvIDIpIC0gKG9wdGlvbnMuaGVpZ2h0IC8gMikpICsgZHVhbFNjcmVlblRvcCxcblx0XHRcdG5ld1dpbmRvdyA9IHdpbmRvdy5vcGVuKHVybCwgJ09wZW5TaGFyZScsIGB3aWR0aD0ke29wdGlvbnMud2lkdGh9LCBoZWlnaHQ9JHtvcHRpb25zLmhlaWdodH0sIHRvcD0ke3RvcH0sIGxlZnQ9JHtsZWZ0fWApO1xuXG5cdFx0Ly8gUHV0cyBmb2N1cyBvbiB0aGUgbmV3V2luZG93XG5cdFx0aWYgKHdpbmRvdy5mb2N1cykge1xuXHRcdFx0bmV3V2luZG93LmZvY3VzKCk7XG5cdFx0fVxuXHR9XG59O1xuIiwiLyoqXG4gKiBHbG9iYWwgT3BlblNoYXJlIEFQSSB0byBnZW5lcmF0ZSBpbnN0YW5jZXMgcHJvZ3JhbW1hdGljYWxseVxuICovXG5cbmNvbnN0IE9TID0gcmVxdWlyZSgnLi9vcGVuLXNoYXJlJyk7XG5jb25zdCBTaGFyZVRyYW5zZm9ybXMgPSByZXF1aXJlKCcuL3NoYXJlLXRyYW5zZm9ybXMnKTtcbmNvbnN0IEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG5jb25zdCBkYXNoVG9DYW1lbCA9IHJlcXVpcmUoJy4uLy4uL2xpYi9kYXNoVG9DYW1lbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuXG5cdC8vIGdsb2JhbCBPcGVuU2hhcmUgcmVmZXJlbmNpbmcgaW50ZXJuYWwgY2xhc3MgZm9yIGluc3RhbmNlIGdlbmVyYXRpb25cblx0Y2xhc3MgT3BlblNoYXJlIHtcblxuXHRcdGNvbnN0cnVjdG9yKGRhdGEsIGVsZW1lbnQpIHtcblxuXHRcdFx0aWYgKCFkYXRhLmJpbmRDbGljaykgZGF0YS5iaW5kQ2xpY2sgPSB0cnVlO1xuXG5cdFx0XHRsZXQgZGFzaCA9IGRhdGEudHlwZS5pbmRleE9mKCctJyk7XG5cblx0XHRcdGlmIChkYXNoID4gLTEpIHtcblx0XHRcdFx0ZGF0YS50eXBlID0gZGFzaFRvQ2FtZWwoZGFzaCwgZGF0YS50eXBlKTtcblx0XHRcdH1cblxuXHRcdFx0bGV0IG5vZGU7XG5cdFx0XHR0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuXHRcdFx0dGhpcy5kYXRhID0gZGF0YTtcblxuXHRcdFx0dGhpcy5vcyA9IG5ldyBPUyhkYXRhLnR5cGUsIFNoYXJlVHJhbnNmb3Jtc1tkYXRhLnR5cGVdKTtcblx0XHRcdHRoaXMub3Muc2V0RGF0YShkYXRhKTtcblxuXHRcdFx0aWYgKCFlbGVtZW50IHx8IGRhdGEuZWxlbWVudCkge1xuXHRcdFx0XHRlbGVtZW50ID0gZGF0YS5lbGVtZW50O1xuXHRcdFx0XHRub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChlbGVtZW50IHx8ICdhJyk7XG5cdFx0XHRcdGlmIChkYXRhLnR5cGUpIHtcblx0XHRcdFx0XHRub2RlLmNsYXNzTGlzdC5hZGQoJ29wZW4tc2hhcmUtbGluaycsIGRhdGEudHlwZSk7XG5cdFx0XHRcdFx0bm9kZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZScsIGRhdGEudHlwZSk7XG5cdFx0XHRcdFx0bm9kZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1ub2RlJywgZGF0YS50eXBlKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoZGF0YS5pbm5lckhUTUwpIG5vZGUuaW5uZXJIVE1MID0gZGF0YS5pbm5lckhUTUw7XG5cdFx0XHR9XG5cdFx0XHRpZiAobm9kZSkgZWxlbWVudCA9IG5vZGU7XG5cblx0XHRcdGlmIChkYXRhLmJpbmRDbGljaykge1xuXHRcdFx0XHRlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcblx0XHRcdFx0XHR0aGlzLnNoYXJlKCk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGF0YS5hcHBlbmRUbykge1xuXHRcdFx0XHRkYXRhLmFwcGVuZFRvLmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGF0YS5jbGFzc2VzICYmIEFycmF5LmlzQXJyYXkoZGF0YS5jbGFzc2VzKSkge1xuXHRcdFx0XHRkYXRhLmNsYXNzZXMuZm9yRWFjaChjc3NDbGFzcyA9PiB7XG5cdFx0XHRcdFx0ZWxlbWVudC5jbGFzc0xpc3QuYWRkKGNzc0NsYXNzKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkYXRhLnR5cGUudG9Mb3dlckNhc2UoKSA9PT0gJ3BheXBhbCcpIHtcblx0XHRcdFx0Y29uc3QgYWN0aW9uID0gZGF0YS5zYW5kYm94ID9cblx0XHRcdFx0ICAgXCJodHRwczovL3d3dy5zYW5kYm94LnBheXBhbC5jb20vY2dpLWJpbi93ZWJzY3JcIiA6XG5cdFx0XHRcdCAgIFwiaHR0cHM6Ly93d3cucGF5cGFsLmNvbS9jZ2ktYmluL3dlYnNjclwiO1xuXG5cdFx0XHRcdGNvbnN0IGJ1eUdJRiA9IGRhdGEuc2FuZGJveCA/XG5cdFx0XHRcdFx0XCJodHRwczovL3d3dy5zYW5kYm94LnBheXBhbC5jb20vZW5fVVMvaS9idG4vYnRuX2J1eW5vd19MRy5naWZcIiA6XG5cdFx0XHRcdFx0XCJodHRwczovL3d3dy5wYXlwYWxvYmplY3RzLmNvbS9lbl9VUy9pL2J0bi9idG5fYnV5bm93X0xHLmdpZlwiO1xuXG5cdFx0XHRcdGNvbnN0IHBpeGVsR0lGID0gZGF0YS5zYW5kYm94ID9cblx0XHRcdFx0XHRcImh0dHBzOi8vd3d3LnNhbmRib3gucGF5cGFsLmNvbS9lbl9VUy9pL3Njci9waXhlbC5naWZcIiA6XG5cdFx0XHRcdFx0XCJodHRwczovL3d3dy5wYXlwYWxvYmplY3RzLmNvbS9lbl9VUy9pL3Njci9waXhlbC5naWZcIjtcblxuXG5cdFx0XHRcdGNvbnN0IHBheXBhbEJ1dHRvbiA9IGA8Zm9ybSBhY3Rpb249JHthY3Rpb259IG1ldGhvZD1cInBvc3RcIiB0YXJnZXQ9XCJfYmxhbmtcIj5cblxuXHRcdFx0XHQgIDwhLS0gU2F2ZWQgYnV0dG9ucyB1c2UgdGhlIFwic2VjdXJlIGNsaWNrXCIgY29tbWFuZCAtLT5cblx0XHRcdFx0ICA8aW5wdXQgdHlwZT1cImhpZGRlblwiIG5hbWU9XCJjbWRcIiB2YWx1ZT1cIl9zLXhjbGlja1wiPlxuXG5cdFx0XHRcdCAgPCEtLSBTYXZlZCBidXR0b25zIGFyZSBpZGVudGlmaWVkIGJ5IHRoZWlyIGJ1dHRvbiBJRHMgLS0+XG5cdFx0XHRcdCAgPGlucHV0IHR5cGU9XCJoaWRkZW5cIiBuYW1lPVwiaG9zdGVkX2J1dHRvbl9pZFwiIHZhbHVlPVwiJHtkYXRhLmJ1dHRvbklkfVwiPlxuXG5cdFx0XHRcdCAgPCEtLSBTYXZlZCBidXR0b25zIGRpc3BsYXkgYW4gYXBwcm9wcmlhdGUgYnV0dG9uIGltYWdlLiAtLT5cblx0XHRcdFx0ICA8aW5wdXQgdHlwZT1cImltYWdlXCIgbmFtZT1cInN1Ym1pdFwiXG5cdFx0XHRcdCAgICBzcmM9JHtidXlHSUZ9XG5cdFx0XHRcdCAgICBhbHQ9XCJQYXlQYWwgLSBUaGUgc2FmZXIsIGVhc2llciB3YXkgdG8gcGF5IG9ubGluZVwiPlxuXHRcdFx0XHQgIDxpbWcgYWx0PVwiXCIgd2lkdGg9XCIxXCIgaGVpZ2h0PVwiMVwiXG5cdFx0XHRcdCAgICBzcmM9JHtwaXhlbEdJRn0gPlxuXG5cdFx0XHRcdDwvZm9ybT5gO1xuXG5cdFx0XHRcdGNvbnN0IGhpZGRlbkRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHRcdFx0XHRoaWRkZW5EaXYuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblx0XHRcdFx0aGlkZGVuRGl2LmlubmVySFRNTCA9IHBheXBhbEJ1dHRvbjtcblx0XHRcdFx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChoaWRkZW5EaXYpO1xuXG5cdFx0XHRcdHRoaXMucGF5cGFsID0gaGlkZGVuRGl2LnF1ZXJ5U2VsZWN0b3IoJ2Zvcm0nKTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5lbGVtZW50ID0gZWxlbWVudDtcblx0XHRcdHJldHVybiBlbGVtZW50O1xuXHRcdH1cblxuXHRcdC8vIHB1YmxpYyBzaGFyZSBtZXRob2QgdG8gdHJpZ2dlciBzaGFyZSBwcm9ncmFtbWF0aWNhbGx5XG5cdFx0c2hhcmUoZSkge1xuXHRcdFx0Ly8gaWYgZHluYW1pYyBpbnN0YW5jZSB0aGVuIGZldGNoIGF0dHJpYnV0ZXMgYWdhaW4gaW4gY2FzZSBvZiB1cGRhdGVzXG5cdFx0XHRpZiAodGhpcy5kYXRhLmR5bmFtaWMpIHtcblx0XHRcdFx0dGhpcy5vcy5zZXREYXRhKGRhdGEpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAodGhpcy5kYXRhLnR5cGUudG9Mb3dlckNhc2UoKSA9PT0gJ3BheXBhbCcpIHtcblx0XHRcdFx0dGhpcy5wYXlwYWwuc3VibWl0KCk7XG5cdFx0XHR9IGVsc2UgdGhpcy5vcy5zaGFyZShlKTtcblxuXHRcdFx0RXZlbnRzLnRyaWdnZXIodGhpcy5lbGVtZW50LCAnc2hhcmVkJyk7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIE9wZW5TaGFyZTtcbn07XG4iLCIvKipcbiAqIE9iamVjdCBvZiB0cmFuc2Zvcm0gZnVuY3Rpb25zIGZvciBlYWNoIG9wZW5zaGFyZSBhcGlcbiAqIFRyYW5zZm9ybSBmdW5jdGlvbnMgcGFzc2VkIGludG8gT3BlblNoYXJlIGluc3RhbmNlIHdoZW4gaW5zdGFudGlhdGVkXG4gKiBSZXR1cm4gb2JqZWN0IGNvbnRhaW5pbmcgVVJMIGFuZCBrZXkvdmFsdWUgYXJnc1xuICovXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuXHQvLyBzZXQgVHdpdHRlciBzaGFyZSBVUkxcblx0dHdpdHRlcjogZnVuY3Rpb24oZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHQvLyBpZiBpT1MgdXNlciBhbmQgaW9zIGRhdGEgYXR0cmlidXRlIGRlZmluZWRcblx0XHQvLyBidWlsZCBpT1MgVVJMIHNjaGVtZSBhcyBzaW5nbGUgc3RyaW5nXG5cdFx0aWYgKGlvcyAmJiBkYXRhLmlvcykge1xuXG5cdFx0XHRsZXQgbWVzc2FnZSA9IGBgO1xuXG5cdFx0XHRpZiAoZGF0YS50ZXh0KSB7XG5cdFx0XHRcdG1lc3NhZ2UgKz0gZGF0YS50ZXh0O1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGF0YS51cmwpIHtcblx0XHRcdFx0bWVzc2FnZSArPSBgIC0gJHtkYXRhLnVybH1gO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGF0YS5oYXNodGFncykge1xuXHRcdFx0XHRsZXQgdGFncyA9IGRhdGEuaGFzaHRhZ3Muc3BsaXQoJywnKTtcblx0XHRcdFx0dGFncy5mb3JFYWNoKGZ1bmN0aW9uKHRhZykge1xuXHRcdFx0XHRcdG1lc3NhZ2UgKz0gYCAjJHt0YWd9YDtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkYXRhLnZpYSkge1xuXHRcdFx0XHRtZXNzYWdlICs9IGAgdmlhICR7ZGF0YS52aWF9YDtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0dXJsOiAndHdpdHRlcjovL3Bvc3Q/Jyxcblx0XHRcdFx0ZGF0YToge1xuXHRcdFx0XHRcdG1lc3NhZ2U6IG1lc3NhZ2Vcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiAnaHR0cHM6Ly90d2l0dGVyLmNvbS9zaGFyZT8nLFxuXHRcdFx0ZGF0YTogZGF0YSxcblx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdHdpZHRoOiA3MDAsXG5cdFx0XHRcdGhlaWdodDogMjk2XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBzZXQgVHdpdHRlciByZXR3ZWV0IFVSTFxuXHR0d2l0dGVyUmV0d2VldDogZnVuY3Rpb24oZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHQvLyBpZiBpT1MgdXNlciBhbmQgaW9zIGRhdGEgYXR0cmlidXRlIGRlZmluZWRcblx0XHRpZiAoaW9zICYmIGRhdGEuaW9zKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR1cmw6ICd0d2l0dGVyOi8vc3RhdHVzPycsXG5cdFx0XHRcdGRhdGE6IHtcblx0XHRcdFx0XHRpZDogZGF0YS50d2VldElkXG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybDogJ2h0dHBzOi8vdHdpdHRlci5jb20vaW50ZW50L3JldHdlZXQ/Jyxcblx0XHRcdGRhdGE6IHtcblx0XHRcdFx0dHdlZXRfaWQ6IGRhdGEudHdlZXRJZCxcblx0XHRcdFx0cmVsYXRlZDogZGF0YS5yZWxhdGVkXG5cdFx0XHR9LFxuXHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0d2lkdGg6IDcwMCxcblx0XHRcdFx0aGVpZ2h0OiAyOTZcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBUd2l0dGVyIGxpa2UgVVJMXG5cdHR3aXR0ZXJMaWtlOiBmdW5jdGlvbihkYXRhLCBpb3MgPSBmYWxzZSkge1xuXHRcdC8vIGlmIGlPUyB1c2VyIGFuZCBpb3MgZGF0YSBhdHRyaWJ1dGUgZGVmaW5lZFxuXHRcdGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVybDogJ3R3aXR0ZXI6Ly9zdGF0dXM/Jyxcblx0XHRcdFx0ZGF0YToge1xuXHRcdFx0XHRcdGlkOiBkYXRhLnR3ZWV0SWRcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiAnaHR0cHM6Ly90d2l0dGVyLmNvbS9pbnRlbnQvZmF2b3JpdGU/Jyxcblx0XHRcdGRhdGE6IHtcblx0XHRcdFx0dHdlZXRfaWQ6IGRhdGEudHdlZXRJZCxcblx0XHRcdFx0cmVsYXRlZDogZGF0YS5yZWxhdGVkXG5cdFx0XHR9LFxuXHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0d2lkdGg6IDcwMCxcblx0XHRcdFx0aGVpZ2h0OiAyOTZcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBUd2l0dGVyIGZvbGxvdyBVUkxcblx0dHdpdHRlckZvbGxvdzogZnVuY3Rpb24oZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHQvLyBpZiBpT1MgdXNlciBhbmQgaW9zIGRhdGEgYXR0cmlidXRlIGRlZmluZWRcblx0XHRpZiAoaW9zICYmIGRhdGEuaW9zKSB7XG5cdFx0XHRsZXQgaW9zRGF0YSA9IGRhdGEuc2NyZWVuTmFtZSA/IHtcblx0XHRcdFx0J3NjcmVlbl9uYW1lJzogZGF0YS5zY3JlZW5OYW1lXG5cdFx0XHR9IDoge1xuXHRcdFx0XHQnaWQnOiBkYXRhLnVzZXJJZFxuXHRcdFx0fTtcblxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0dXJsOiAndHdpdHRlcjovL3VzZXI/Jyxcblx0XHRcdFx0ZGF0YTogaW9zRGF0YVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiAnaHR0cHM6Ly90d2l0dGVyLmNvbS9pbnRlbnQvdXNlcj8nLFxuXHRcdFx0ZGF0YToge1xuXHRcdFx0XHRzY3JlZW5fbmFtZTogZGF0YS5zY3JlZW5OYW1lLFxuXHRcdFx0XHR1c2VyX2lkOiBkYXRhLnVzZXJJZFxuXHRcdFx0fSxcblx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdHdpZHRoOiA3MDAsXG5cdFx0XHRcdGhlaWdodDogMjk2XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBzZXQgRmFjZWJvb2sgc2hhcmUgVVJMXG5cdGZhY2Vib29rOiBmdW5jdGlvbihkYXRhKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybDogJ2h0dHBzOi8vd3d3LmZhY2Vib29rLmNvbS9kaWFsb2cvZmVlZD9hcHBfaWQ9OTYxMzQyNTQzOTIyMzIyJnJlZGlyZWN0X3VyaT1odHRwOi8vZmFjZWJvb2suY29tJicsXG5cdFx0XHRkYXRhOiBkYXRhLFxuXHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0d2lkdGg6IDU2MCxcblx0XHRcdFx0aGVpZ2h0OiA1OTNcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBGYWNlYm9vayBzZW5kIFVSTFxuXHRmYWNlYm9va1NlbmQ6IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiAnaHR0cHM6Ly93d3cuZmFjZWJvb2suY29tL2RpYWxvZy9zZW5kP2FwcF9pZD05NjEzNDI1NDM5MjIzMjImcmVkaXJlY3RfdXJpPWh0dHA6Ly9mYWNlYm9vay5jb20mJyxcblx0XHRcdGRhdGE6IGRhdGEsXG5cdFx0XHRwb3B1cDoge1xuXHRcdFx0XHR3aWR0aDogOTgwLFxuXHRcdFx0XHRoZWlnaHQ6IDU5NlxuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gc2V0IFlvdVR1YmUgcGxheSBVUkxcblx0eW91dHViZTogZnVuY3Rpb24oZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHQvLyBpZiBpT1MgdXNlclxuXHRcdGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVybDogYHlvdXR1YmU6JHtkYXRhLnZpZGVvfT9gXG5cdFx0XHR9O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR1cmw6IGBodHRwczovL3d3dy55b3V0dWJlLmNvbS93YXRjaD92PSR7ZGF0YS52aWRlb30/YCxcblx0XHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0XHR3aWR0aDogMTA4Nixcblx0XHRcdFx0XHRoZWlnaHQ6IDYwOFxuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdH1cblx0fSxcblxuXHQvLyBzZXQgWW91VHViZSBzdWJjcmliZSBVUkxcblx0eW91dHViZVN1YnNjcmliZTogZnVuY3Rpb24oZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHQvLyBpZiBpT1MgdXNlclxuXHRcdGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVybDogYHlvdXR1YmU6Ly93d3cueW91dHViZS5jb20vdXNlci8ke2RhdGEudXNlcn0/YFxuXHRcdFx0fTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0dXJsOiBgaHR0cHM6Ly93d3cueW91dHViZS5jb20vdXNlci8ke2RhdGEudXNlcn0/YCxcblx0XHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0XHR3aWR0aDogODgwLFxuXHRcdFx0XHRcdGhlaWdodDogMzUwXG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0fVxuXHR9LFxuXG5cdC8vIHNldCBJbnN0YWdyYW0gZm9sbG93IFVSTFxuXHRpbnN0YWdyYW06IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiBgaW5zdGFncmFtOi8vY2FtZXJhP2Bcblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBJbnN0YWdyYW0gZm9sbG93IFVSTFxuXHRpbnN0YWdyYW1Gb2xsb3c6IGZ1bmN0aW9uKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG5cdFx0Ly8gaWYgaU9TIHVzZXJcblx0XHRpZiAoaW9zICYmIGRhdGEuaW9zKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR1cmw6ICdpbnN0YWdyYW06Ly91c2VyPycsXG5cdFx0XHRcdGRhdGE6IGRhdGFcblx0XHRcdH07XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVybDogYGh0dHA6Ly93d3cuaW5zdGFncmFtLmNvbS8ke2RhdGEudXNlcm5hbWV9P2AsXG5cdFx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdFx0d2lkdGg6IDk4MCxcblx0XHRcdFx0XHRoZWlnaHQ6IDY1NVxuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdH1cblx0fSxcblxuXHQvLyBzZXQgU25hcGNoYXQgZm9sbG93IFVSTFxuXHRzbmFwY2hhdCAoZGF0YSkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6IGBzbmFwY2hhdDovL2FkZC8ke2RhdGEudXNlcm5hbWV9P2Bcblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBHb29nbGUgc2hhcmUgVVJMXG5cdGdvb2dsZSAoZGF0YSkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6ICdodHRwczovL3BsdXMuZ29vZ2xlLmNvbS9zaGFyZT8nLFxuXHRcdFx0ZGF0YTogZGF0YSxcblx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdHdpZHRoOiA0OTUsXG5cdFx0XHRcdGhlaWdodDogODE1XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBzZXQgR29vZ2xlIG1hcHMgVVJMXG5cdGdvb2dsZU1hcHMgKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG5cblx0XHRpZiAoZGF0YS5zZWFyY2gpIHtcblx0XHRcdGRhdGEucSA9IGRhdGEuc2VhcmNoO1xuXHRcdFx0ZGVsZXRlIGRhdGEuc2VhcmNoO1xuXHRcdH1cblxuXHRcdC8vIGlmIGlPUyB1c2VyIGFuZCBpb3MgZGF0YSBhdHRyaWJ1dGUgZGVmaW5lZFxuXHRcdGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVybDogJ2NvbWdvb2dsZW1hcHM6Ly8/Jyxcblx0XHRcdFx0ZGF0YTogaW9zXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdGlmICghaW9zICYmIGRhdGEuaW9zKSB7XG5cdFx0XHRkZWxldGUgZGF0YS5pb3M7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybDogJ2h0dHBzOi8vbWFwcy5nb29nbGUuY29tLz8nLFxuXHRcdFx0ZGF0YTogZGF0YSxcblx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdHdpZHRoOiA4MDAsXG5cdFx0XHRcdGhlaWdodDogNjAwXG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBzZXQgUGludGVyZXN0IHNoYXJlIFVSTFxuXHRwaW50ZXJlc3QgKGRhdGEpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiAnaHR0cHM6Ly9waW50ZXJlc3QuY29tL3Bpbi9jcmVhdGUvYm9va21hcmtsZXQvPycsXG5cdFx0XHRkYXRhOiBkYXRhLFxuXHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0d2lkdGg6IDc0NSxcblx0XHRcdFx0aGVpZ2h0OiA2MjBcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBMaW5rZWRJbiBzaGFyZSBVUkxcblx0bGlua2VkaW4gKGRhdGEpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiAnaHR0cDovL3d3dy5saW5rZWRpbi5jb20vc2hhcmVBcnRpY2xlPycsXG5cdFx0XHRkYXRhOiBkYXRhLFxuXHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0d2lkdGg6IDc4MCxcblx0XHRcdFx0aGVpZ2h0OiA0OTJcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBCdWZmZXIgc2hhcmUgVVJMXG5cdGJ1ZmZlciAoZGF0YSkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6ICdodHRwOi8vYnVmZmVyYXBwLmNvbS9hZGQ/Jyxcblx0XHRcdGRhdGE6IGRhdGEsXG5cdFx0XHRwb3B1cDoge1xuXHRcdFx0XHR3aWR0aDogNzQ1LFxuXHRcdFx0XHRoZWlnaHQ6IDM0NVxuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gc2V0IFR1bWJsciBzaGFyZSBVUkxcblx0dHVtYmxyIChkYXRhKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybDogJ2h0dHBzOi8vd3d3LnR1bWJsci5jb20vd2lkZ2V0cy9zaGFyZS90b29sPycsXG5cdFx0XHRkYXRhOiBkYXRhLFxuXHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0d2lkdGg6IDU0MCxcblx0XHRcdFx0aGVpZ2h0OiA5NDBcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBSZWRkaXQgc2hhcmUgVVJMXG5cdHJlZGRpdCAoZGF0YSkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6ICdodHRwOi8vcmVkZGl0LmNvbS9zdWJtaXQ/Jyxcblx0XHRcdGRhdGE6IGRhdGEsXG5cdFx0XHRwb3B1cDoge1xuXHRcdFx0XHR3aWR0aDogODYwLFxuXHRcdFx0XHRoZWlnaHQ6IDg4MFxuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gc2V0IEZsaWNrciBmb2xsb3cgVVJMXG5cdGZsaWNrciAoZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHQvLyBpZiBpT1MgdXNlclxuXHRcdGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVybDogYGZsaWNrcjovL3Bob3Rvcy8ke2RhdGEudXNlcm5hbWV9P2Bcblx0XHRcdH07XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVybDogYGh0dHA6Ly93d3cuZmxpY2tyLmNvbS9waG90b3MvJHtkYXRhLnVzZXJuYW1lfT9gLFxuXHRcdFx0XHRwb3B1cDoge1xuXHRcdFx0XHRcdHdpZHRoOiA2MDAsXG5cdFx0XHRcdFx0aGVpZ2h0OiA2NTBcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9XG5cdH0sXG5cblx0Ly8gc2V0IFdoYXRzQXBwIHNoYXJlIFVSTFxuXHR3aGF0c2FwcCAoZGF0YSkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6ICd3aGF0c2FwcDovL3NlbmQ/Jyxcblx0XHRcdGRhdGE6IGRhdGFcblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBzbXMgc2hhcmUgVVJMXG5cdHNtcyAoZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiBpb3MgPyAnc21zOiYnIDogJ3Ntczo/Jyxcblx0XHRcdGRhdGE6IGRhdGFcblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBFbWFpbCBzaGFyZSBVUkxcblx0ZW1haWwgKGRhdGEpIHtcblxuXHRcdHZhciB1cmwgPSBgbWFpbHRvOmA7XG5cblx0XHQvLyBpZiB0byBhZGRyZXNzIHNwZWNpZmllZCB0aGVuIGFkZCB0byBVUkxcblx0XHRpZiAoZGF0YS50byAhPT0gbnVsbCkge1xuXHRcdFx0dXJsICs9IGAke2RhdGEudG99YDtcblx0XHR9XG5cblx0XHR1cmwgKz0gYD9gO1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybDogdXJsLFxuXHRcdFx0ZGF0YToge1xuXHRcdFx0XHRzdWJqZWN0OiBkYXRhLnN1YmplY3QsXG5cdFx0XHRcdGJvZHk6IGRhdGEuYm9keVxuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gc2V0IEdpdGh1YiBmb3JrIFVSTFxuXHRnaXRodWIgKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG5cdFx0bGV0IHVybCA9IGRhdGEucmVwbyA/XG5cdFx0XHRgaHR0cHM6Ly9naXRodWIuY29tLyR7ZGF0YS5yZXBvfWAgOlxuXHRcdFx0ZGF0YS51cmw7XG5cblx0XHRpZiAoZGF0YS5pc3N1ZSkge1xuXHRcdFx0dXJsICs9ICcvaXNzdWVzL25ldz90aXRsZT0nICtcblx0XHRcdFx0ZGF0YS5pc3N1ZSArXG5cdFx0XHRcdCcmYm9keT0nICtcblx0XHRcdFx0ZGF0YS5ib2R5O1xuXHRcdH1cblxuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6IHVybCArICc/Jyxcblx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdHdpZHRoOiAxMDIwLFxuXHRcdFx0XHRoZWlnaHQ6IDMyM1xuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gc2V0IERyaWJiYmxlIHNoYXJlIFVSTFxuXHRkcmliYmJsZSAoZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHRjb25zdCB1cmwgPSBkYXRhLnNob3QgP1xuXHRcdFx0YGh0dHBzOi8vZHJpYmJibGUuY29tL3Nob3RzLyR7ZGF0YS5zaG90fT9gIDpcblx0XHRcdGRhdGEudXJsICsgJz8nO1xuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6IHVybCxcblx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdHdpZHRoOiA0NDAsXG5cdFx0XHRcdGhlaWdodDogNjQwXG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHRjb2RlcGVuIChkYXRhKSB7XG5cdFx0Y29uc3QgdXJsID0gKGRhdGEucGVuICYmIGRhdGEudXNlcm5hbWUgJiYgZGF0YS52aWV3KSA/XG5cdFx0XHRgaHR0cHM6Ly9jb2RlcGVuLmlvLyR7ZGF0YS51c2VybmFtZX0vJHtkYXRhLnZpZXd9LyR7ZGF0YS5wZW59P2AgOlxuXHRcdFx0ZGF0YS51cmwgKyAnPyc7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybDogdXJsLFxuXHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0d2lkdGg6IDEyMDAsXG5cdFx0XHRcdGhlaWdodDogODAwXG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHRwYXlwYWwgKGRhdGEpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0ZGF0YTogZGF0YVxuXHRcdH07XG5cdH1cbn07XG4iLCJ2YXIgT3BlblNoYXJlID0ge1xuXHRzaGFyZTogcmVxdWlyZSgnLi4vc2hhcmUuanMnKSxcblx0Y291bnQ6IHJlcXVpcmUoJy4uL2NvdW50LmpzJyksXG5cdGFuYWx5dGljczogcmVxdWlyZSgnLi4vYW5hbHl0aWNzLmpzJylcbn07XG5cbi8vIE9wZW5TaGFyZS5hbmFseXRpY3MoJ3RhZ01hbmFnZXInLCBmdW5jdGlvbiAoKSB7XG4vLyAgIGNvbnNvbGUubG9nKCd0YWcgbWFuYWdlciBsb2FkZWQnKTtcbi8vIH0pO1xuLy9cbi8vIE9wZW5TaGFyZS5hbmFseXRpY3MoJ2V2ZW50JywgZnVuY3Rpb24gKCkge1xuLy8gICBjb25zb2xlLmxvZygnZ29vZ2xlIGFuYWx5dGljcyBsb2FkZWQnKTtcbi8vIH0pO1xuLy9cbi8vIE9wZW5TaGFyZS5hbmFseXRpY3MoJ3NvY2lhbCcsIGZ1bmN0aW9uICgpIHtcbi8vICAgY29uc29sZS5sb2coJ2dvb2dsZSBhbmFseXRpY3MgbG9hZGVkJyk7XG4vLyB9KTtcblxudmFyIGR5bmFtaWNOb2RlRGF0YSA9IHtcblx0J3VybCc6ICdodHRwOi8vd3d3LmRpZ2l0YWxzdXJnZW9ucy5jb20nLFxuXHQndmlhJzogJ2RpZ2l0YWxzdXJnZW9ucycsXG5cdCd0ZXh0JzogJ0ZvcndhcmQgT2JzZXNzZWQnLFxuXHQnaGFzaHRhZ3MnOiAnZm9yd2FyZG9ic2Vzc2VkJyxcblx0J2J1dHRvbic6ICdPcGVuIFNoYXJlIFdhdGNoZXIhJ1xufTtcblxuZnVuY3Rpb24gY3JlYXRlT3BlblNoYXJlTm9kZShkYXRhKSB7XG5cdHZhciBvcGVuU2hhcmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG5cblx0b3BlblNoYXJlLmNsYXNzTGlzdC5hZGQoJ29wZW4tc2hhcmUtbGluaycsICd0d2l0dGVyJyk7XG5cdG9wZW5TaGFyZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZScsICd0d2l0dGVyJyk7XG5cdG9wZW5TaGFyZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS11cmwnLCBkYXRhLnVybCk7XG5cdG9wZW5TaGFyZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS12aWEnLCBkYXRhLnZpYSk7XG5cdG9wZW5TaGFyZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS10ZXh0JywgZGF0YS50ZXh0KTtcblx0b3BlblNoYXJlLnNldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWhhc2h0YWdzJywgZGF0YS5oYXNodGFncyk7XG5cdG9wZW5TaGFyZS5pbm5lckhUTUwgPSAnPHNwYW4gY2xhc3M9XCJmYSBmYS10d2l0dGVyXCI+PC9zcGFuPicgKyBkYXRhLmJ1dHRvbjtcblxuXHR2YXIgbm9kZSA9IG5ldyBPcGVuU2hhcmUuc2hhcmUoe1xuXHRcdHR5cGU6ICd0d2l0dGVyJyxcblx0XHR1cmw6ICdodHRwOi8vd3d3LmRpZ2l0YWxzdXJnZW9ucy5jb20nLFxuXHRcdHZpYTogJ2RpZ2l0YWxzdXJnZW9ucycsXG5cdFx0aGFzaHRhZ3M6ICdmb3J3YXJkb2JzZXNzZWQnLFxuXHRcdGFwcGVuZFRvOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcub3Blbi1zaGFyZS13YXRjaCcpLFxuXHRcdGlubmVySFRNTDogJ0NyZWF0ZWQgdmlhIE9wZW5TaGFyZUFQSScsXG5cdFx0ZWxlbWVudDogJ2RpdicsXG5cdFx0Y2xhc3NlczogWyd3b3cnLCAnc3VjaCcsICdjbGFzc2VzJ11cblx0fSk7XG5cblx0cmV0dXJuIG9wZW5TaGFyZTtcbn1cblxuZnVuY3Rpb24gYWRkTm9kZSgpIHtcblx0dmFyIGRhdGEgPSBkeW5hbWljTm9kZURhdGE7XG5cdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5vcGVuLXNoYXJlLXdhdGNoJylcblx0XHQuYXBwZW5kQ2hpbGQoY3JlYXRlT3BlblNoYXJlTm9kZShkYXRhKSk7XG59XG5cbndpbmRvdy5hZGROb2RlID0gYWRkTm9kZTtcblxuZnVuY3Rpb24gYWRkTm9kZVdpdGhDb3VudCgpIHtcblx0dmFyIGRhdGEgPSBkeW5hbWljTm9kZURhdGE7XG5cblx0bmV3IE9wZW5TaGFyZS5jb3VudCh7XG5cdFx0dHlwZTogJ2ZhY2Vib29rJyxcblx0XHR1cmw6ICdodHRwczovL3d3dy5kaWdpdGFsc3VyZ2VvbnMuY29tLydcblx0fSwgZnVuY3Rpb24gKG5vZGUpIHtcblx0XHR2YXIgb3MgPSBuZXcgT3BlblNoYXJlLnNoYXJlKHtcblx0XHQgIHR5cGU6ICd0d2l0dGVyJyxcblx0XHQgIHVybDogJ2h0dHA6Ly93d3cuZGlnaXRhbHN1cmdlb25zLmNvbScsXG5cdFx0ICB2aWE6ICdkaWdpdGFsc3VyZ2VvbnMnLFxuXHRcdCAgaGFzaHRhZ3M6ICdmb3J3YXJkb2JzZXNzZWQnLFxuXHRcdCAgaW5uZXJIVE1MOiAnQ3JlYXRlZCB2aWEgT3BlblNoYXJlQVBJJyxcblx0XHQgIGVsZW1lbnQ6ICdkaXYnLFxuXHRcdCAgY2xhc3NlczogWyd3b3cnLCAnc3VjaCcsICdjbGFzc2VzJ11cblx0ICB9KTtcblx0XHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuY3JlYXRlLW5vZGUudy1jb3VudCcpXG5cdFx0ICAuYXBwZW5kQ2hpbGQob3MpO1xuXHRcdCAgb3MuYXBwZW5kQ2hpbGQobm9kZSk7XG5cdH0pO1xufVxuXG53aW5kb3cuYWRkTm9kZVdpdGhDb3VudCA9IGFkZE5vZGVXaXRoQ291bnQ7XG5cbmZ1bmN0aW9uIGNyZWF0ZUNvdW50Tm9kZSgpIHtcbiBcdHZhciBjb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuY3JlYXRlLW5vZGUuY291bnQtbm9kZXMnKTtcblx0dmFyIHR5cGUgPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignaW5wdXQuY291bnQtdHlwZScpLnZhbHVlO1xuXHR2YXIgdXJsID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0LmNvdW50LXVybCcpLnZhbHVlO1xuXG5cdG5ldyBPcGVuU2hhcmUuY291bnQoe1xuXHRcdHR5cGU6IHR5cGUsXG5cdFx0dXJsOiB1cmwsXG5cdFx0YXBwZW5kVG86IGNvbnRhaW5lcixcblx0XHRjbGFzc2VzOiBbJ3Rlc3QnXVxuXHR9LCBmdW5jdGlvbiAobm9kZSkge1xuXHRcdG5vZGUuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuXHR9KTtcblxuXG5cdGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdpbnB1dC5jb3VudC10eXBlJykudmFsdWUgPSAnJztcblx0Y29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0LmNvdW50LXVybCcpLnZhbHVlID0gJyc7XG59XG5cbndpbmRvdy5jcmVhdGVDb3VudE5vZGUgPSBjcmVhdGVDb3VudE5vZGU7XG5cbi8vIHRlc3QgSlMgT3BlblNoYXJlIEFQSSB3aXRoIGRhc2hlc1xuXG5uZXcgT3BlblNoYXJlLnNoYXJlKHtcblx0dHlwZTogJ2dvb2dsZU1hcHMnLFxuXHRjZW50ZXI6ICc0MC43NjU4MTksLTczLjk3NTg2NicsXG5cdHZpZXc6ICd0cmFmZmljJyxcblx0em9vbTogMTQsXG5cdGFwcGVuZFRvOiBkb2N1bWVudC5ib2R5LFxuXHRpbm5lckhUTUw6ICdNYXBzJ1xufSk7XG5cbm5ldyBPcGVuU2hhcmUuc2hhcmUoe1xuXHR0eXBlOiAndHdpdHRlci1mb2xsb3cnLFxuXHRzY3JlZW5OYW1lOiAnZGlnaXRhbHN1cmdlb25zJyxcblx0dXNlcklkOiAnMTgxODkxMzAnLFxuXHRhcHBlbmRUbzogZG9jdW1lbnQuYm9keSxcblx0aW5uZXJIVE1MOiAnRm9sbG93IFRlc3QnXG59KTtcblxuLy8gdGVzdCBQYXlQYWxcbm5ldyBPcGVuU2hhcmUuc2hhcmUoe1xuXHR0eXBlOiAncGF5cGFsJyxcblx0YnV0dG9uSWQ6ICcyUDNSSllFRkw3WjYyJyxcblx0c2FuZGJveDogdHJ1ZSxcblx0YXBwZW5kVG86IGRvY3VtZW50LmJvZHksXG5cdGlubmVySFRNTDogJ1BheVBhbCBUZXN0J1xufSk7XG5cbi8vIGJpbmQgdG8gY291bnQgbG9hZGVkIGV2ZW50XG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdPcGVuU2hhcmUuY291bnQtbG9hZGVkJywgZnVuY3Rpb24oKSB7XG5cdGNvbnNvbGUubG9nKCdPcGVuU2hhcmUgKGNvdW50KSBsb2FkZWQnKTtcbn0pO1xuXG4vLyBiaW5kIHRvIHNoYXJlIGxvYWRlZCBldmVudFxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignT3BlblNoYXJlLnNoYXJlLWxvYWRlZCcsIGZ1bmN0aW9uKCkge1xuXHRjb25zb2xlLmxvZygnT3BlblNoYXJlIChzaGFyZSkgbG9hZGVkJyk7XG5cblx0Ly8gYmluZCB0byBzaGFyZWQgZXZlbnQgb24gZWFjaCBpbmRpdmlkdWFsIG5vZGVcblx0W10uZm9yRWFjaC5jYWxsKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLW9wZW4tc2hhcmVdJyksIGZ1bmN0aW9uKG5vZGUpIHtcblx0XHRub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ09wZW5TaGFyZS5zaGFyZWQnLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRjb25zb2xlLmxvZygnT3BlbiBTaGFyZSBTaGFyZWQnLCBlKTtcblx0XHR9KTtcblx0fSk7XG5cblx0dmFyIGV4YW1wbGVzID0ge1xuXHRcdHR3aXR0ZXI6IG5ldyBPcGVuU2hhcmUuc2hhcmUoe1xuXHRcdFx0dHlwZTogJ3R3aXR0ZXInLFxuXHRcdFx0YmluZENsaWNrOiB0cnVlLFxuXHRcdFx0dXJsOiAnaHR0cDovL2RpZ2l0YWxzdXJnZW9ucy5jb20nLFxuXHRcdFx0dmlhOiAnZGlnaXRhbHN1cmdlb25zJyxcblx0XHRcdHRleHQ6ICdEaWdpdGFsIFN1cmdlb25zJyxcblx0XHRcdGhhc2h0YWdzOiAnZm9yd2FyZG9ic2Vzc2VkJ1xuXHRcdH0sIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLWFwaS1leGFtcGxlPVwidHdpdHRlclwiXScpKSxcblxuXHRcdGZhY2Vib29rOiBuZXcgT3BlblNoYXJlLnNoYXJlKHtcblx0XHRcdHR5cGU6ICdmYWNlYm9vaycsXG5cdFx0XHRiaW5kQ2xpY2s6IHRydWUsXG5cdFx0XHRsaW5rOiAnaHR0cDovL2RpZ2l0YWxzdXJnZW9ucy5jb20nLFxuXHRcdFx0cGljdHVyZTogJ2h0dHA6Ly93d3cuZGlnaXRhbHN1cmdlb25zLmNvbS9pbWcvYWJvdXQvYmdfb2ZmaWNlX3RlYW0uanBnJyxcblx0XHRcdGNhcHRpb246ICdEaWdpdGFsIFN1cmdlb25zJyxcblx0XHRcdGRlc2NyaXB0aW9uOiAnZm9yd2FyZG9ic2Vzc2VkJ1xuXHRcdH0sIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLWFwaS1leGFtcGxlPVwiZmFjZWJvb2tcIl0nKSksXG5cblx0XHRwaW50ZXJlc3Q6IG5ldyBPcGVuU2hhcmUuc2hhcmUoe1xuXHRcdFx0dHlwZTogJ3BpbnRlcmVzdCcsXG5cdFx0XHRiaW5kQ2xpY2s6IHRydWUsXG5cdFx0XHR1cmw6ICdodHRwOi8vZGlnaXRhbHN1cmdlb25zLmNvbScsXG5cdFx0XHRtZWRpYTogJ2h0dHA6Ly93d3cuZGlnaXRhbHN1cmdlb25zLmNvbS9pbWcvYWJvdXQvYmdfb2ZmaWNlX3RlYW0uanBnJyxcblx0XHRcdGRlc2NyaXB0aW9uOiAnRGlnaXRhbCBTdXJnZW9ucycsXG5cdFx0XHRhcHBlbmRUbzogZG9jdW1lbnQuYm9keVxuXHRcdH0sIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLWFwaS1leGFtcGxlPVwicGludGVyZXN0XCJdJykpLFxuXG5cdFx0ZW1haWw6IG5ldyBPcGVuU2hhcmUuc2hhcmUoe1xuXHRcdFx0dHlwZTogJ2VtYWlsJyxcblx0XHRcdGJpbmRDbGljazogdHJ1ZSxcblx0XHRcdHRvOiAndGVjaHJvb21AZGlnaXRhbHN1cmdlb25zLmNvbScsXG5cdFx0XHRzdWJqZWN0OiAnRGlnaXRhbCBTdXJnZW9ucycsXG5cdFx0XHRib2R5OiAnRm9yd2FyZCBPYnNlc3NlZCdcblx0XHR9LCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbZGF0YS1hcGktZXhhbXBsZT1cImVtYWlsXCJdJykpXG5cdH07XG59KTtcblxuLy8gRXhhbXBsZSBvZiBsaXN0ZW5pbmcgZm9yIGNvdW50ZWQgZXZlbnRzIG9uIGluZGl2aWR1YWwgdXJscyBvciBhcnJheXMgb2YgdXJsc1xudmFyIHVybHMgPSBbXG5cdCdmYWNlYm9vaycsXG5cdCdnb29nbGUnLFxuXHQnbGlua2VkaW4nLFxuXHQncmVkZGl0Jyxcblx0J3BpbnRlcmVzdCcsXG5cdFtcblx0XHQnZ29vZ2xlJyxcblx0XHQnbGlua2VkaW4nLFxuXHRcdCdyZWRkaXQnLFxuXHRcdCdwaW50ZXJlc3QnXG5cdF1cbl07XG5cbnVybHMuZm9yRWFjaChmdW5jdGlvbih1cmwpIHtcblx0aWYgKEFycmF5LmlzQXJyYXkodXJsKSkge1xuXHRcdHVybCA9IHVybC5qb2luKCcsJyk7XG5cdH1cblx0dmFyIGNvdW50Tm9kZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLW9wZW4tc2hhcmUtY291bnQ9XCInICsgdXJsICsgJ1wiXScpO1xuXG5cdFtdLmZvckVhY2guY2FsbChjb3VudE5vZGUsIGZ1bmN0aW9uKG5vZGUpIHtcblx0XHRub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ09wZW5TaGFyZS5jb3VudGVkLScgKyB1cmwsIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGNvdW50cyA9IG5vZGUuaW5uZXJIVE1MO1xuXHRcdFx0aWYgKGNvdW50cykgY29uc29sZS5sb2codXJsLCAnc2hhcmVzOiAnLCBjb3VudHMpO1xuXHRcdH0pO1xuXHR9KTtcbn0pO1xuXG4vLyB0ZXN0IHR3aXR0ZXIgY291bnQganMgYXBpXG5uZXcgT3BlblNoYXJlLmNvdW50KHtcblx0dHlwZTogJ3R3aXR0ZXInLFxuXHR1cmw6ICdodHRwczovL3d3dy5kaWdpdGFsc3VyZ2VvbnMuY29tL3Rob3VnaHRzL3RlY2hub2xvZ3kvdGhlLWJsb2NrY2hhaW4tcmV2b2x1dGlvbi8nLFxuXHRrZXk6ICdvc0FQSUtleSdcbn0sIGZ1bmN0aW9uIChub2RlKSB7XG5cdHZhciBvcyA9IG5ldyBPcGVuU2hhcmUuc2hhcmUoe1xuXHQgIHR5cGU6ICd0d2l0dGVyJyxcblx0ICB1cmw6ICdodHRwczovL3d3dy5kaWdpdGFsc3VyZ2VvbnMuY29tL3Rob3VnaHRzL3RlY2hub2xvZ3kvdGhlLWJsb2NrY2hhaW4tcmV2b2x1dGlvbi8nLFxuXHQgIHZpYTogJ2RpZ2l0YWxzdXJnZW9ucycsXG5cdCAgaGFzaHRhZ3M6ICdmb3J3YXJkb2JzZXNzZWQsIGJsb2NrY2hhaW4nLFxuXHQgIGFwcGVuZFRvOiBkb2N1bWVudC5ib2R5LFxuXHQgIGlubmVySFRNTDogJ0JMT0NLQ0hBSU4nXG5cdH0pO1xuXHRvcy5hcHBlbmRDaGlsZChub2RlKTtcbn0pO1xuIl19
