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

OpenShare.analytics('tagManager', function () {
	console.log('tag manager loaded');
});

OpenShare.analytics('event', function () {
	console.log('google analytics events loaded');
});

OpenShare.analytics('social', function () {
	console.log('google analytics social loaded');
});

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiYW5hbHl0aWNzLmpzIiwiY291bnQuanMiLCJsaWIvY291bnRSZWR1Y2UuanMiLCJsaWIvZGFzaFRvQ2FtZWwuanMiLCJsaWIvaW5pdC5qcyIsImxpYi9pbml0aWFsaXplQ291bnROb2RlLmpzIiwibGliL2luaXRpYWxpemVOb2Rlcy5qcyIsImxpYi9pbml0aWFsaXplU2hhcmVOb2RlLmpzIiwibGliL2luaXRpYWxpemVXYXRjaGVyLmpzIiwibGliL3NldERhdGEuanMiLCJsaWIvc2hhcmUuanMiLCJsaWIvc3RvcmVDb3VudC5qcyIsInNoYXJlLmpzIiwic3JjL21vZHVsZXMvY291bnQtYXBpLmpzIiwic3JjL21vZHVsZXMvY291bnQtdHJhbnNmb3Jtcy5qcyIsInNyYy9tb2R1bGVzL2NvdW50LmpzIiwic3JjL21vZHVsZXMvZXZlbnRzLmpzIiwic3JjL21vZHVsZXMvb3Blbi1zaGFyZS5qcyIsInNyYy9tb2R1bGVzL3NoYXJlLWFwaS5qcyIsInNyYy9tb2R1bGVzL3NoYXJlLXRyYW5zZm9ybXMuanMiLCJzcmMvdGVzdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsT0FBTyxPQUFQLEdBQWlCLFVBQVUsSUFBVixFQUFnQixFQUFoQixFQUFvQjtBQUNwQyxLQUFNLE9BQU8sU0FBUyxPQUFULElBQW9CLFNBQVMsUUFBMUM7QUFDQSxLQUFNLGVBQWUsU0FBUyxZQUE5Qjs7QUFFQSxLQUFJLElBQUosRUFBVSx1QkFBdUIsSUFBdkIsRUFBNkIsRUFBN0I7QUFDVixLQUFJLFlBQUosRUFBa0IsY0FBYyxFQUFkO0FBQ2xCLENBTkQ7O0FBUUEsU0FBUyxzQkFBVCxDQUFnQyxJQUFoQyxFQUFzQyxFQUF0QyxFQUEwQztBQUN6QyxLQUFJLE9BQU8sRUFBWCxFQUFlO0FBQ1osTUFBSSxFQUFKLEVBQVE7QUFDUjtBQUNBLFNBQU8sVUFBVSxDQUFWLEVBQWE7QUFDckIsT0FBTSxXQUFXLEVBQUUsTUFBRixDQUFTLFlBQVQsQ0FBc0IsaUJBQXRCLENBQWpCO0FBQ0EsT0FBTSxTQUFTLEVBQUUsTUFBRixDQUFTLFlBQVQsQ0FBc0Isc0JBQXRCLEtBQ2QsRUFBRSxNQUFGLENBQVMsWUFBVCxDQUFzQixxQkFBdEIsQ0FEYyxJQUVkLEVBQUUsTUFBRixDQUFTLFlBQVQsQ0FBc0IsMEJBQXRCLENBRmMsSUFHWCxFQUFFLE1BQUYsQ0FBUyxZQUFULENBQXNCLHdCQUF0QixDQUhXLElBSWQsRUFBRSxNQUFGLENBQVMsWUFBVCxDQUFzQix3QkFBdEIsQ0FKYyxJQUtkLEVBQUUsTUFBRixDQUFTLFlBQVQsQ0FBc0Isc0JBQXRCLENBTEQ7O0FBT0EsT0FBSSxTQUFTLE9BQWIsRUFBc0I7QUFDckIsT0FBRyxNQUFILEVBQVcsT0FBWCxFQUFvQjtBQUNuQixvQkFBZSxpQkFESTtBQUVuQixrQkFBYSxRQUZNO0FBR25CLGlCQUFZLE1BSE87QUFJbkIsZ0JBQVc7QUFKUSxLQUFwQjtBQU1BOztBQUVELE9BQUksU0FBUyxRQUFiLEVBQXVCO0FBQ3RCLE9BQUcsTUFBSCxFQUFXO0FBQ1YsY0FBUyxRQURDO0FBRVYsb0JBQWUsUUFGTDtBQUdWLG1CQUFjLE9BSEo7QUFJVixtQkFBYztBQUpKLEtBQVg7QUFNQTtBQUNELEdBMUJDO0FBNEJGLEVBL0JELE1BZ0NLO0FBQ0osYUFBVyxZQUFZO0FBQ3RCLDBCQUF1QixJQUF2QixFQUE2QixFQUE3QjtBQUNFLEdBRkgsRUFFSyxJQUZMO0FBR0E7QUFDRDs7QUFFRCxTQUFTLGFBQVQsQ0FBd0IsRUFBeEIsRUFBNEI7O0FBRTNCLEtBQUksT0FBTyxTQUFQLElBQW9CLE9BQU8sU0FBUCxDQUFpQixDQUFqQixFQUFvQixXQUFwQixDQUF4QixFQUEwRDtBQUN6RCxNQUFJLEVBQUosRUFBUTs7QUFFUixTQUFPLGdCQUFQOztBQUVBLFlBQVUsVUFBUyxDQUFULEVBQVk7QUFDckIsT0FBTSxRQUFRLEVBQUUsTUFBRixHQUNaLEVBQUUsTUFBRixDQUFTLFNBREcsR0FFWixFQUFFLFNBRko7O0FBSUEsT0FBTSxXQUFXLEVBQUUsTUFBRixHQUNkLEVBQUUsTUFBRixDQUFTLFlBQVQsQ0FBc0IsMkJBQXRCLENBRGMsR0FFZCxFQUFFLFlBQUYsQ0FBZSwyQkFBZixDQUZIOztBQUlBLFVBQU8sU0FBUCxDQUFpQixJQUFqQixDQUFzQjtBQUNyQixhQUFVLGlCQURXO0FBRXJCLGdCQUFZLFFBRlM7QUFHckIsZ0JBQVksS0FIUztBQUlyQixnQkFBWTtBQUpTLElBQXRCO0FBTUEsR0FmRDtBQWdCQSxFQXJCRCxNQXFCTztBQUNOLGFBQVcsWUFBWTtBQUN0QixpQkFBYyxFQUFkO0FBQ0EsR0FGRCxFQUVHLElBRkg7QUFHQTtBQUNEOztBQUVELFNBQVMsTUFBVCxDQUFpQixFQUFqQixFQUFxQjtBQUNwQjtBQUNBLElBQUcsT0FBSCxDQUFXLElBQVgsQ0FBZ0IsU0FBUyxnQkFBVCxDQUEwQixtQkFBMUIsQ0FBaEIsRUFBZ0UsVUFBUyxJQUFULEVBQWU7QUFDOUUsT0FBSyxnQkFBTCxDQUFzQixrQkFBdEIsRUFBMEMsRUFBMUM7QUFDQSxFQUZEO0FBR0E7O0FBRUQsU0FBUyxTQUFULENBQW9CLEVBQXBCLEVBQXdCO0FBQ3ZCLEtBQUksWUFBWSxTQUFTLGdCQUFULENBQTBCLHlCQUExQixDQUFoQjs7QUFFQSxJQUFHLE9BQUgsQ0FBVyxJQUFYLENBQWdCLFNBQWhCLEVBQTJCLFVBQVMsSUFBVCxFQUFlO0FBQ3pDLE1BQUksS0FBSyxXQUFULEVBQXNCLEdBQUcsSUFBSCxFQUF0QixLQUNLLEtBQUssZ0JBQUwsQ0FBc0IsdUJBQXVCLEtBQUssWUFBTCxDQUFrQiwyQkFBbEIsQ0FBN0MsRUFBNkYsRUFBN0Y7QUFDTCxFQUhEO0FBSUE7O0FBRUQsU0FBUyxnQkFBVCxDQUEyQixDQUEzQixFQUE4QjtBQUM3QixLQUFNLFdBQVcsRUFBRSxNQUFGLENBQVMsWUFBVCxDQUFzQixpQkFBdEIsQ0FBakI7QUFDQSxLQUFNLFNBQVMsRUFBRSxNQUFGLENBQVMsWUFBVCxDQUFzQixzQkFBdEIsS0FDZCxFQUFFLE1BQUYsQ0FBUyxZQUFULENBQXNCLHFCQUF0QixDQURjLElBRWQsRUFBRSxNQUFGLENBQVMsWUFBVCxDQUFzQiwwQkFBdEIsQ0FGYyxJQUdkLEVBQUUsTUFBRixDQUFTLFlBQVQsQ0FBc0Isd0JBQXRCLENBSGMsSUFJZCxFQUFFLE1BQUYsQ0FBUyxZQUFULENBQXNCLHdCQUF0QixDQUpjLElBS2QsRUFBRSxNQUFGLENBQVMsWUFBVCxDQUFzQixzQkFBdEIsQ0FMRDs7QUFPQSxRQUFPLFNBQVAsQ0FBaUIsSUFBakIsQ0FBc0I7QUFDckIsV0FBVSxpQkFEVztBQUVyQixjQUFZLFFBRlM7QUFHckIsY0FBWSxNQUhTO0FBSXJCLGNBQVk7QUFKUyxFQUF0QjtBQU1BOzs7OztBQzdHRCxPQUFPLE9BQVAsR0FBa0IsWUFBVztBQUM1QixVQUFTLGdCQUFULENBQTBCLGtCQUExQixFQUE4QyxRQUFRLFlBQVIsRUFBc0I7QUFDbkUsT0FBSyxPQUQ4RDtBQUVuRSxZQUFVLHFEQUZ5RDtBQUduRSxNQUFJLFFBQVEsMkJBQVI7QUFIK0QsRUFBdEIsQ0FBOUM7O0FBTUEsUUFBTyxRQUFRLHlCQUFSLEdBQVA7QUFDQSxDQVJnQixFQUFqQjs7Ozs7QUNBQSxPQUFPLE9BQVAsR0FBaUIsV0FBakI7O0FBRUEsU0FBUyxLQUFULENBQWUsQ0FBZixFQUFrQixTQUFsQixFQUE2QjtBQUM1QixLQUFJLE9BQU8sQ0FBUCxLQUFhLFFBQWpCLEVBQTJCO0FBQzFCLFFBQU0sSUFBSSxTQUFKLENBQWMsK0JBQWQsQ0FBTjtBQUNBOztBQUVELEtBQUksV0FBVyxZQUFZLENBQVosR0FBZ0IsR0FBaEIsR0FBc0IsSUFBckM7QUFDQSxLQUFJLGNBQWMsWUFBWSxDQUFaLEdBQWdCLElBQWhCLEdBQXVCLEdBQXpDO0FBQ0EsYUFBWSxLQUFLLEdBQUwsQ0FBUyxTQUFULENBQVo7O0FBRUEsUUFBTyxPQUFPLEtBQUssS0FBTCxDQUFXLElBQUksUUFBSixHQUFlLFNBQTFCLElBQXVDLFdBQXZDLEdBQXFELFNBQTVELENBQVA7QUFDQTs7QUFFRCxTQUFTLFdBQVQsQ0FBc0IsR0FBdEIsRUFBMkI7QUFDMUIsUUFBTyxNQUFNLE1BQUksSUFBVixFQUFnQixDQUFoQixJQUFxQixHQUE1QjtBQUNBOztBQUVELFNBQVMsVUFBVCxDQUFxQixHQUFyQixFQUEwQjtBQUN6QixRQUFPLE1BQU0sTUFBSSxPQUFWLEVBQW1CLENBQW5CLElBQXdCLEdBQS9CO0FBQ0E7O0FBRUQsU0FBUyxXQUFULENBQXNCLEVBQXRCLEVBQTBCLEtBQTFCLEVBQWlDLEVBQWpDLEVBQXFDO0FBQ3BDLEtBQUksUUFBUSxNQUFaLEVBQXFCO0FBQ3BCLEtBQUcsU0FBSCxHQUFlLFdBQVcsS0FBWCxDQUFmO0FBQ0EsTUFBSSxNQUFPLE9BQU8sRUFBUCxLQUFjLFVBQXpCLEVBQXFDLEdBQUcsRUFBSDtBQUNyQyxFQUhELE1BR08sSUFBSSxRQUFRLEdBQVosRUFBaUI7QUFDdkIsS0FBRyxTQUFILEdBQWUsWUFBWSxLQUFaLENBQWY7QUFDQSxNQUFJLE1BQU8sT0FBTyxFQUFQLEtBQWMsVUFBekIsRUFBcUMsR0FBRyxFQUFIO0FBQ3JDLEVBSE0sTUFHQTtBQUNOLEtBQUcsU0FBSCxHQUFlLEtBQWY7QUFDQSxNQUFJLE1BQU8sT0FBTyxFQUFQLEtBQWMsVUFBekIsRUFBcUMsR0FBRyxFQUFIO0FBQ3JDO0FBQ0Q7Ozs7O0FDakNEO0FBQ0E7QUFDQTtBQUNBLE9BQU8sT0FBUCxHQUFpQixVQUFDLElBQUQsRUFBTyxJQUFQLEVBQWdCO0FBQ2hDLEtBQUksV0FBVyxLQUFLLE1BQUwsQ0FBWSxPQUFPLENBQW5CLEVBQXNCLENBQXRCLENBQWY7QUFBQSxLQUNDLFFBQVEsS0FBSyxNQUFMLENBQVksSUFBWixFQUFrQixDQUFsQixDQURUOztBQUdBLFFBQU8sS0FBSyxPQUFMLENBQWEsS0FBYixFQUFvQixTQUFTLFdBQVQsRUFBcEIsQ0FBUDtBQUNBLFFBQU8sSUFBUDtBQUNBLENBTkQ7Ozs7O0FDSEEsSUFBTSxrQkFBa0IsUUFBUSxtQkFBUixDQUF4QjtBQUNBLElBQU0sb0JBQW9CLFFBQVEscUJBQVIsQ0FBMUI7O0FBRUEsT0FBTyxPQUFQLEdBQWlCLElBQWpCOztBQUVBLFNBQVMsSUFBVCxDQUFjLElBQWQsRUFBb0I7QUFDbkIsUUFBTyxZQUFNO0FBQ1osTUFBTSxZQUFZLGdCQUFnQjtBQUNqQyxRQUFLLEtBQUssR0FBTCxJQUFZLElBRGdCO0FBRWpDLGNBQVcsS0FBSyxTQUFMLElBQWtCLFFBRkk7QUFHakMsYUFBVSxLQUFLLFFBSGtCO0FBSWpDLE9BQUksS0FBSztBQUp3QixHQUFoQixDQUFsQjs7QUFPQTs7QUFFQTtBQUNBLE1BQUksT0FBTyxnQkFBUCxLQUE0QixTQUFoQyxFQUEyQztBQUMxQyxxQkFBa0IsU0FBUyxnQkFBVCxDQUEwQix5QkFBMUIsQ0FBbEIsRUFBd0UsU0FBeEU7QUFDQTtBQUNELEVBZEQ7QUFlQTs7Ozs7QUNyQkQsSUFBTSxRQUFRLFFBQVEsc0JBQVIsQ0FBZDs7QUFFQSxPQUFPLE9BQVAsR0FBaUIsbUJBQWpCOztBQUVBLFNBQVMsbUJBQVQsQ0FBNkIsRUFBN0IsRUFBaUM7QUFDaEM7QUFDQSxLQUFJLE9BQU8sR0FBRyxZQUFILENBQWdCLHVCQUFoQixDQUFYO0FBQUEsS0FDQyxNQUFNLEdBQUcsWUFBSCxDQUFnQiw0QkFBaEIsS0FDTCxHQUFHLFlBQUgsQ0FBZ0IsNEJBQWhCLENBREssSUFFTCxHQUFHLFlBQUgsQ0FBZ0IsMkJBQWhCLENBSEY7QUFBQSxLQUlDLFFBQVEsSUFBSSxLQUFKLENBQVUsSUFBVixFQUFnQixHQUFoQixDQUpUOztBQU1BLE9BQU0sS0FBTixDQUFZLEVBQVo7QUFDQSxJQUFHLFlBQUgsQ0FBZ0Isc0JBQWhCLEVBQXdDLElBQXhDO0FBQ0E7Ozs7O0FDZEQsSUFBTSxTQUFTLFFBQVEsdUJBQVIsQ0FBZjtBQUNBLElBQU0sWUFBWSxRQUFRLGNBQVIsQ0FBbEI7O0FBR0EsT0FBTyxPQUFQLEdBQWlCLGVBQWpCOztBQUVBLFNBQVMsZUFBVCxDQUF5QixJQUF6QixFQUErQjtBQUM5QjtBQUNBLFFBQU8sWUFBTTtBQUNaO0FBQ0E7O0FBRUEsTUFBSSxLQUFLLEdBQVQsRUFBYztBQUNiLE9BQUksUUFBUSxLQUFLLFNBQUwsQ0FBZSxnQkFBZixDQUFnQyxLQUFLLFFBQXJDLENBQVo7QUFDQSxNQUFHLE9BQUgsQ0FBVyxJQUFYLENBQWdCLEtBQWhCLEVBQXVCLEtBQUssRUFBNUI7O0FBRUE7QUFDQSxVQUFPLE9BQVAsQ0FBZSxRQUFmLEVBQXlCLEtBQUssR0FBTCxHQUFXLFNBQXBDO0FBQ0EsR0FORCxNQU1PO0FBQ047QUFDQSxPQUFJLGFBQWEsS0FBSyxTQUFMLENBQWUsZ0JBQWYsQ0FBZ0MsS0FBSyxRQUFMLENBQWMsS0FBOUMsQ0FBakI7QUFDQSxNQUFHLE9BQUgsQ0FBVyxJQUFYLENBQWdCLFVBQWhCLEVBQTRCLEtBQUssRUFBTCxDQUFRLEtBQXBDOztBQUVBO0FBQ0EsVUFBTyxPQUFQLENBQWUsUUFBZixFQUF5QixjQUF6Qjs7QUFFQTtBQUNBLE9BQUksYUFBYSxLQUFLLFNBQUwsQ0FBZSxnQkFBZixDQUFnQyxLQUFLLFFBQUwsQ0FBYyxLQUE5QyxDQUFqQjtBQUNBLE1BQUcsT0FBSCxDQUFXLElBQVgsQ0FBZ0IsVUFBaEIsRUFBNEIsS0FBSyxFQUFMLENBQVEsS0FBcEM7O0FBRUE7QUFDQSxVQUFPLE9BQVAsQ0FBZSxRQUFmLEVBQXlCLGNBQXpCO0FBQ0E7QUFDRCxFQXpCRDtBQTBCQTs7QUFFRCxTQUFTLGNBQVQsR0FBMkI7QUFDMUI7QUFDQSxLQUFJLFNBQVMsYUFBVCxDQUF1Qiw2QkFBdkIsQ0FBSixFQUEyRDtBQUMxRCxNQUFNLFdBQVcsU0FBUyxhQUFULENBQXVCLDZCQUF2QixFQUNmLFlBRGUsQ0FDRiwyQkFERSxDQUFqQjs7QUFHQSxNQUFJLFNBQVMsT0FBVCxDQUFpQixHQUFqQixJQUF3QixDQUFDLENBQTdCLEVBQWdDO0FBQy9CLE9BQU0sWUFBWSxTQUFTLEtBQVQsQ0FBZSxHQUFmLENBQWxCO0FBQ0EsYUFBVSxPQUFWLENBQWtCO0FBQUEsV0FBSyxVQUFVLENBQVYsQ0FBTDtBQUFBLElBQWxCO0FBQ0EsR0FIRCxNQUdPLFVBQVUsUUFBVjtBQUVQO0FBQ0Q7Ozs7O0FDaERELElBQU0sa0JBQWtCLFFBQVEsaUNBQVIsQ0FBeEI7QUFDQSxJQUFNLFlBQVksUUFBUSwyQkFBUixDQUFsQjtBQUNBLElBQU0sVUFBVSxRQUFRLFdBQVIsQ0FBaEI7QUFDQSxJQUFNLFFBQVEsUUFBUSxTQUFSLENBQWQ7QUFDQSxJQUFNLGNBQWMsUUFBUSxlQUFSLENBQXBCOztBQUVBLE9BQU8sT0FBUCxHQUFpQixtQkFBakI7O0FBRUEsU0FBUyxtQkFBVCxDQUE2QixFQUE3QixFQUFpQztBQUNoQztBQUNBLEtBQUksT0FBTyxHQUFHLFlBQUgsQ0FBZ0IsaUJBQWhCLENBQVg7QUFBQSxLQUNDLE9BQU8sS0FBSyxPQUFMLENBQWEsR0FBYixDQURSO0FBQUEsS0FFQyxrQkFGRDs7QUFJQSxLQUFJLE9BQU8sQ0FBQyxDQUFaLEVBQWU7QUFDZCxTQUFPLFlBQVksSUFBWixFQUFrQixJQUFsQixDQUFQO0FBQ0E7O0FBRUQsS0FBSSxZQUFZLGdCQUFnQixJQUFoQixDQUFoQjs7QUFFQSxLQUFJLENBQUMsU0FBTCxFQUFnQjtBQUNmLFFBQU0sSUFBSSxLQUFKLGtCQUF5QixJQUF6Qix5QkFBTjtBQUNBOztBQUVELGFBQVksSUFBSSxTQUFKLENBQWMsSUFBZCxFQUFvQixTQUFwQixDQUFaOztBQUVBO0FBQ0EsS0FBSSxHQUFHLFlBQUgsQ0FBZ0IseUJBQWhCLENBQUosRUFBZ0Q7QUFDL0MsWUFBVSxPQUFWLEdBQW9CLElBQXBCO0FBQ0E7O0FBRUQ7QUFDQSxLQUFJLEdBQUcsWUFBSCxDQUFnQix1QkFBaEIsQ0FBSixFQUE4QztBQUM3QyxZQUFVLEtBQVYsR0FBa0IsSUFBbEI7QUFDQTs7QUFFRDtBQUNBLFNBQVEsU0FBUixFQUFtQixFQUFuQjs7QUFFQTtBQUNBLElBQUcsZ0JBQUgsQ0FBb0IsT0FBcEIsRUFBNkIsVUFBQyxDQUFELEVBQU87QUFDbkMsUUFBTSxDQUFOLEVBQVMsRUFBVCxFQUFhLFNBQWI7QUFDQSxFQUZEOztBQUlBLElBQUcsZ0JBQUgsQ0FBb0IsbUJBQXBCLEVBQXlDLFVBQUMsQ0FBRCxFQUFPO0FBQy9DLFFBQU0sQ0FBTixFQUFTLEVBQVQsRUFBYSxTQUFiO0FBQ0EsRUFGRDs7QUFJQSxJQUFHLFlBQUgsQ0FBZ0Isc0JBQWhCLEVBQXdDLElBQXhDO0FBQ0E7Ozs7O0FDakRELE9BQU8sT0FBUCxHQUFpQixpQkFBakI7O0FBRUEsU0FBUyxpQkFBVCxDQUEyQixPQUEzQixFQUFvQyxFQUFwQyxFQUF3QztBQUN2QyxJQUFHLE9BQUgsQ0FBVyxJQUFYLENBQWdCLE9BQWhCLEVBQXlCLFVBQUMsQ0FBRCxFQUFPO0FBQy9CLE1BQUksV0FBVyxJQUFJLGdCQUFKLENBQXFCLFVBQUMsU0FBRCxFQUFlO0FBQ2xEO0FBQ0EsTUFBRyxVQUFVLENBQVYsRUFBYSxNQUFoQjtBQUNBLEdBSGMsQ0FBZjs7QUFLQSxXQUFTLE9BQVQsQ0FBaUIsQ0FBakIsRUFBb0I7QUFDbkIsY0FBVztBQURRLEdBQXBCO0FBR0EsRUFURDtBQVVBOzs7OztBQ2JELE9BQU8sT0FBUCxHQUFpQixPQUFqQjs7QUFFQSxTQUFTLE9BQVQsQ0FBaUIsVUFBakIsRUFBNkIsU0FBN0IsRUFBd0M7QUFDdkMsWUFBVyxPQUFYLENBQW1CO0FBQ2xCLE9BQUssVUFBVSxZQUFWLENBQXVCLHFCQUF2QixDQURhO0FBRWxCLFFBQU0sVUFBVSxZQUFWLENBQXVCLHNCQUF2QixDQUZZO0FBR2xCLE9BQUssVUFBVSxZQUFWLENBQXVCLHFCQUF2QixDQUhhO0FBSWxCLFlBQVUsVUFBVSxZQUFWLENBQXVCLDBCQUF2QixDQUpRO0FBS2xCLFdBQVMsVUFBVSxZQUFWLENBQXVCLDBCQUF2QixDQUxTO0FBTWxCLFdBQVMsVUFBVSxZQUFWLENBQXVCLHlCQUF2QixDQU5TO0FBT2xCLGNBQVksVUFBVSxZQUFWLENBQXVCLDZCQUF2QixDQVBNO0FBUWxCLFVBQVEsVUFBVSxZQUFWLENBQXVCLHlCQUF2QixDQVJVO0FBU2xCLFFBQU0sVUFBVSxZQUFWLENBQXVCLHNCQUF2QixDQVRZO0FBVWxCLFdBQVMsVUFBVSxZQUFWLENBQXVCLHlCQUF2QixDQVZTO0FBV2xCLFdBQVMsVUFBVSxZQUFWLENBQXVCLHlCQUF2QixDQVhTO0FBWWxCLGVBQWEsVUFBVSxZQUFWLENBQXVCLDZCQUF2QixDQVpLO0FBYWxCLFFBQU0sVUFBVSxZQUFWLENBQXVCLHNCQUF2QixDQWJZO0FBY2xCLFNBQU8sVUFBVSxZQUFWLENBQXVCLHVCQUF2QixDQWRXO0FBZWxCLFlBQVUsVUFBVSxZQUFWLENBQXVCLDBCQUF2QixDQWZRO0FBZ0JsQixTQUFPLFVBQVUsWUFBVixDQUF1Qix1QkFBdkIsQ0FoQlc7QUFpQmxCLFNBQU8sVUFBVSxZQUFWLENBQXVCLHVCQUF2QixDQWpCVztBQWtCbEIsTUFBSSxVQUFVLFlBQVYsQ0FBdUIsb0JBQXZCLENBbEJjO0FBbUJsQixXQUFTLFVBQVUsWUFBVixDQUF1Qix5QkFBdkIsQ0FuQlM7QUFvQmxCLFFBQU0sVUFBVSxZQUFWLENBQXVCLHNCQUF2QixDQXBCWTtBQXFCbEIsT0FBSyxVQUFVLFlBQVYsQ0FBdUIscUJBQXZCLENBckJhO0FBc0JsQixRQUFNLFVBQVUsWUFBVixDQUF1QixzQkFBdkIsQ0F0Qlk7QUF1QmxCLFVBQVEsVUFBVSxZQUFWLENBQXVCLHdCQUF2QixDQXZCVTtBQXdCbEIsU0FBTyxVQUFVLFlBQVYsQ0FBdUIsdUJBQXZCLENBeEJXO0FBeUJsQixRQUFNLFVBQVUsWUFBVixDQUF1QixzQkFBdkIsQ0F6Qlk7QUEwQmxCLFVBQVEsVUFBVSxZQUFWLENBQXVCLHdCQUF2QixDQTFCVTtBQTJCbEIsU0FBTyxVQUFVLFlBQVYsQ0FBdUIsdUJBQXZCLENBM0JXO0FBNEJsQixTQUFPLFVBQVUsWUFBVixDQUF1Qix1QkFBdkIsQ0E1Qlc7QUE2QmxCLGtCQUFnQixVQUFVLFlBQVYsQ0FBdUIsaUNBQXZCLENBN0JFO0FBOEJsQixRQUFNLFVBQVUsWUFBVixDQUF1QixzQkFBdkIsQ0E5Qlk7QUErQmxCLFFBQU0sVUFBVSxZQUFWLENBQXVCLHNCQUF2QixDQS9CWTtBQWdDbEIsT0FBSyxVQUFVLFlBQVYsQ0FBdUIscUJBQXZCLENBaENhO0FBaUNsQixRQUFNLFVBQVUsWUFBVixDQUF1QixzQkFBdkIsQ0FqQ1k7QUFrQ2xCLFNBQU8sVUFBVSxZQUFWLENBQXVCLHVCQUF2QixDQWxDVztBQW1DbEIsWUFBVSxVQUFVLFlBQVYsQ0FBdUIsMEJBQXZCLENBbkNRO0FBb0NsQixTQUFPLFVBQVUsWUFBVixDQUF1Qix1QkFBdkIsQ0FwQ1c7QUFxQ2xCLE9BQUssVUFBVSxZQUFWLENBQXVCLFVBQXZCO0FBckNhLEVBQW5CO0FBdUNBOzs7OztBQzFDRCxJQUFNLFNBQVMsUUFBUSx1QkFBUixDQUFmO0FBQ0EsSUFBTSxVQUFVLFFBQVEsV0FBUixDQUFoQjs7QUFFQSxPQUFPLE9BQVAsR0FBaUIsS0FBakI7O0FBRUEsU0FBUyxLQUFULENBQWUsQ0FBZixFQUFrQixFQUFsQixFQUFzQixTQUF0QixFQUFpQztBQUNoQztBQUNBLEtBQUksVUFBVSxPQUFkLEVBQXVCO0FBQ3RCLFVBQVEsU0FBUixFQUFtQixFQUFuQjtBQUNBOztBQUVELFdBQVUsS0FBVixDQUFnQixDQUFoQjs7QUFFQTtBQUNBLFFBQU8sT0FBUCxDQUFlLEVBQWYsRUFBbUIsUUFBbkI7QUFDQTs7Ozs7QUNmRDs7Ozs7Ozs7O0FBU0EsT0FBTyxPQUFQLEdBQWlCLFVBQUMsQ0FBRCxFQUFJLEtBQUosRUFBYztBQUM5QixLQUFNLFFBQVEsRUFBRSxJQUFGLENBQU8sT0FBUCxDQUFlLEdBQWYsSUFBc0IsQ0FBQyxDQUFyQztBQUNBLEtBQU0sUUFBUSxPQUFPLEVBQUUsUUFBRixDQUFXLEVBQUUsSUFBRixHQUFTLEdBQVQsR0FBZSxFQUFFLE1BQTVCLENBQVAsQ0FBZDs7QUFFQSxLQUFJLFFBQVEsS0FBUixJQUFpQixDQUFDLEtBQXRCLEVBQTZCO0FBQzVCLE1BQU0sY0FBYyxPQUFPLEVBQUUsUUFBRixDQUFXLEVBQUUsSUFBRixHQUFTLEdBQVQsR0FBZSxFQUFFLE1BQWpCLEdBQTBCLGNBQXJDLENBQVAsQ0FBcEI7QUFDQSxJQUFFLFFBQUYsQ0FBVyxFQUFFLElBQUYsR0FBUyxHQUFULEdBQWUsRUFBRSxNQUFqQixHQUEwQixjQUFyQyxFQUFxRCxLQUFyRDs7QUFFQSxVQUFRLFVBQVUsV0FBVixLQUEwQixjQUFjLENBQXhDLEdBQ1AsU0FBUyxRQUFRLFdBRFYsR0FFUCxTQUFTLEtBRlY7QUFJQTs7QUFFRCxLQUFJLENBQUMsS0FBTCxFQUFZLEVBQUUsUUFBRixDQUFXLEVBQUUsSUFBRixHQUFTLEdBQVQsR0FBZSxFQUFFLE1BQTVCLEVBQW9DLEtBQXBDO0FBQ1osUUFBTyxLQUFQO0FBQ0EsQ0FoQkQ7O0FBa0JBLFNBQVMsU0FBVCxDQUFtQixDQUFuQixFQUFzQjtBQUNwQixRQUFPLENBQUMsTUFBTSxXQUFXLENBQVgsQ0FBTixDQUFELElBQXlCLFNBQVMsQ0FBVCxDQUFoQztBQUNEOzs7OztBQzdCRCxPQUFPLE9BQVAsR0FBa0IsWUFBVztBQUM1QixVQUFTLGdCQUFULENBQTBCLGtCQUExQixFQUE4QyxRQUFRLFlBQVIsRUFBc0I7QUFDbkUsT0FBSyxPQUQ4RDtBQUVuRSxZQUFVLCtDQUZ5RDtBQUduRSxNQUFJLFFBQVEsMkJBQVI7QUFIK0QsRUFBdEIsQ0FBOUM7O0FBTUEsUUFBTyxRQUFRLHlCQUFSLEdBQVA7QUFDQSxDQVJnQixFQUFqQjs7Ozs7OztBQ0FBOzs7O0FBSUEsSUFBSSxRQUFRLFFBQVEsU0FBUixDQUFaOztBQUVBLE9BQU8sT0FBUCxHQUFpQixZQUFXOztBQUUzQjtBQUYyQixLQUdyQixLQUhxQixHQUsxQixxQkFPRyxFQVBILEVBT087QUFBQSxNQU5OLElBTU0sUUFOTixJQU1NO0FBQUEsTUFMTixHQUtNLFFBTE4sR0FLTTtBQUFBLDJCQUpOLFFBSU07QUFBQSxNQUpOLFFBSU0saUNBSkssS0FJTDtBQUFBLE1BSE4sT0FHTSxRQUhOLE9BR007QUFBQSxNQUZOLE9BRU0sUUFGTixPQUVNO0FBQUEsc0JBRE4sR0FDTTtBQUFBLE1BRE4sR0FDTSw0QkFEQSxJQUNBOztBQUFBOztBQUNOLE1BQUksWUFBWSxTQUFTLGFBQVQsQ0FBdUIsV0FBVyxNQUFsQyxDQUFoQjs7QUFFQSxZQUFVLFlBQVYsQ0FBdUIsdUJBQXZCLEVBQWdELElBQWhEO0FBQ0EsWUFBVSxZQUFWLENBQXVCLDJCQUF2QixFQUFvRCxHQUFwRDtBQUNBLE1BQUksR0FBSixFQUFTLFVBQVUsWUFBVixDQUF1QixVQUF2QixFQUFtQyxHQUFuQzs7QUFFVCxZQUFVLFNBQVYsQ0FBb0IsR0FBcEIsQ0FBd0Isa0JBQXhCOztBQUVBLE1BQUksV0FBVyxNQUFNLE9BQU4sQ0FBYyxPQUFkLENBQWYsRUFBdUM7QUFDdEMsV0FBUSxPQUFSLENBQWdCLG9CQUFZO0FBQzNCLGNBQVUsU0FBVixDQUFvQixHQUFwQixDQUF3QixRQUF4QjtBQUNBLElBRkQ7QUFHQTs7QUFFRCxNQUFJLFFBQUosRUFBYztBQUNiLFVBQU8sSUFBSSxLQUFKLENBQVUsSUFBVixFQUFnQixHQUFoQixFQUFxQixLQUFyQixDQUEyQixTQUEzQixFQUFzQyxFQUF0QyxFQUEwQyxRQUExQyxDQUFQO0FBQ0E7O0FBRUQsU0FBTyxJQUFJLEtBQUosQ0FBVSxJQUFWLEVBQWdCLEdBQWhCLEVBQXFCLEtBQXJCLENBQTJCLFNBQTNCLEVBQXNDLEVBQXRDLENBQVA7QUFDQSxFQWhDeUI7O0FBbUMzQixRQUFPLEtBQVA7QUFDQSxDQXBDRDs7Ozs7QUNOQSxJQUFNLGNBQWMsUUFBUSx1QkFBUixDQUFwQjtBQUNBLElBQU0sYUFBYSxRQUFRLHNCQUFSLENBQW5COztBQUVBOzs7OztBQUtBLE9BQU8sT0FBUCxHQUFpQjs7QUFFaEI7QUFDQSxTQUhnQixvQkFHTixHQUhNLEVBR0Q7QUFDZCxTQUFPO0FBQ04sU0FBTSxLQURBO0FBRU4sNENBQXVDLEdBRmpDO0FBR04sY0FBVyxtQkFBUyxHQUFULEVBQWM7QUFDeEIsUUFBSSxRQUFRLEtBQUssS0FBTCxDQUFXLElBQUksWUFBZixFQUE2QixNQUF6QztBQUNBLFdBQU8sV0FBVyxJQUFYLEVBQWlCLEtBQWpCLENBQVA7QUFDQTtBQU5LLEdBQVA7QUFRQSxFQVplOzs7QUFjaEI7QUFDQSxVQWZnQixxQkFlTCxHQWZLLEVBZUE7QUFDZixTQUFPO0FBQ04sU0FBTSxPQURBO0FBRU4seUVBQW9FLEdBRjlEO0FBR04sY0FBVyxtQkFBUyxJQUFULEVBQWU7QUFDekIsUUFBSSxRQUFRLEtBQUssS0FBakI7QUFDQSxXQUFPLFdBQVcsSUFBWCxFQUFpQixLQUFqQixDQUFQO0FBQ0E7QUFOSyxHQUFQO0FBUUEsRUF4QmU7OztBQTBCaEI7QUFDQSxTQTNCZ0Isb0JBMkJOLEdBM0JNLEVBMkJEO0FBQ2QsU0FBTztBQUNOLFNBQU0sT0FEQTtBQUVOLGdFQUEyRCxHQUEzRCw2QkFGTTtBQUdOLGNBQVcsbUJBQVMsSUFBVCxFQUFlO0FBQ3pCLFFBQUksUUFBUSxLQUFLLEtBQWpCO0FBQ0EsV0FBTyxXQUFXLElBQVgsRUFBaUIsS0FBakIsQ0FBUDtBQUNBO0FBTkssR0FBUDtBQVFBLEVBcENlOzs7QUFzQ2hCO0FBQ0EsT0F2Q2dCLGtCQXVDUixHQXZDUSxFQXVDSDtBQUNaLFNBQU87QUFDTixTQUFNLEtBREE7QUFFTixzREFBaUQsR0FGM0M7QUFHTixjQUFXLG1CQUFTLEdBQVQsRUFBYztBQUN4QixRQUFJLFFBQVEsS0FBSyxLQUFMLENBQVcsSUFBSSxZQUFmLEVBQTZCLElBQTdCLENBQWtDLFFBQTlDO0FBQUEsUUFDQyxNQUFNLENBRFA7O0FBR0EsVUFBTSxPQUFOLENBQWMsVUFBQyxJQUFELEVBQVU7QUFDdkIsWUFBTyxPQUFPLEtBQUssSUFBTCxDQUFVLEdBQWpCLENBQVA7QUFDQSxLQUZEOztBQUlBLFdBQU8sV0FBVyxJQUFYLEVBQWlCLEdBQWpCLENBQVA7QUFDQTtBQVpLLEdBQVA7QUFjQSxFQXREZTs7O0FBd0RoQjtBQUNBLE9BekRnQixrQkF5RFIsR0F6RFEsRUF5REg7QUFDWixTQUFPO0FBQ04sU0FBTSxNQURBO0FBRU4sU0FBTTtBQUNMLFlBQVEsa0JBREg7QUFFTCxRQUFJLEdBRkM7QUFHTCxZQUFRO0FBQ1AsWUFBTyxJQURBO0FBRVAsU0FBSSxHQUZHO0FBR1AsYUFBUSxRQUhEO0FBSVAsYUFBUSxTQUpEO0FBS1AsY0FBUztBQUxGLEtBSEg7QUFVTCxhQUFTLEtBVko7QUFXTCxTQUFLLEdBWEE7QUFZTCxnQkFBWTtBQVpQLElBRkE7QUFnQk4seUNBaEJNO0FBaUJOLGNBQVcsbUJBQVMsR0FBVCxFQUFjO0FBQ3hCLFFBQUksUUFBUSxLQUFLLEtBQUwsQ0FBVyxJQUFJLFlBQWYsRUFBNkIsTUFBN0IsQ0FBb0MsUUFBcEMsQ0FBNkMsWUFBN0MsQ0FBMEQsS0FBdEU7QUFDQSxXQUFPLFdBQVcsSUFBWCxFQUFpQixLQUFqQixDQUFQO0FBQ0E7QUFwQkssR0FBUDtBQXNCQSxFQWhGZTs7O0FBa0ZoQjtBQUNBLFlBbkZnQix1QkFtRkgsSUFuRkcsRUFtRkc7QUFDbEIsU0FBTyxLQUFLLE9BQUwsQ0FBYSxhQUFiLElBQThCLENBQUMsQ0FBL0IsR0FDTixLQUFLLEtBQUwsQ0FBVyxhQUFYLEVBQTBCLENBQTFCLENBRE0sR0FFTixJQUZEO0FBR0EsU0FBTztBQUNOLFNBQU0sS0FEQTtBQUVOLDBDQUFxQyxJQUYvQjtBQUdOLGNBQVcsbUJBQVMsR0FBVCxFQUFjO0FBQ3hCLFFBQUksUUFBUSxLQUFLLEtBQUwsQ0FBVyxJQUFJLFlBQWYsRUFBNkIsZ0JBQXpDO0FBQ0EsV0FBTyxXQUFXLElBQVgsRUFBaUIsS0FBakIsQ0FBUDtBQUNBO0FBTkssR0FBUDtBQVFBLEVBL0ZlOzs7QUFpR2hCO0FBQ0EsWUFsR2dCLHVCQWtHSCxJQWxHRyxFQWtHRztBQUNsQixTQUFPLEtBQUssT0FBTCxDQUFhLGFBQWIsSUFBOEIsQ0FBQyxDQUEvQixHQUNOLEtBQUssS0FBTCxDQUFXLGFBQVgsRUFBMEIsQ0FBMUIsQ0FETSxHQUVOLElBRkQ7QUFHQSxTQUFPO0FBQ04sU0FBTSxLQURBO0FBRU4sMENBQXFDLElBRi9CO0FBR04sY0FBVyxtQkFBUyxHQUFULEVBQWM7QUFDeEIsUUFBSSxRQUFRLEtBQUssS0FBTCxDQUFXLElBQUksWUFBZixFQUE2QixXQUF6QztBQUNBLFdBQU8sV0FBVyxJQUFYLEVBQWlCLEtBQWpCLENBQVA7QUFDQTtBQU5LLEdBQVA7QUFRQSxFQTlHZTs7O0FBZ0hoQjtBQUNBLGVBakhnQiwwQkFpSEEsSUFqSEEsRUFpSE07QUFDckIsU0FBTyxLQUFLLE9BQUwsQ0FBYSxhQUFiLElBQThCLENBQUMsQ0FBL0IsR0FDTixLQUFLLEtBQUwsQ0FBVyxhQUFYLEVBQTBCLENBQTFCLENBRE0sR0FFTixJQUZEO0FBR0EsU0FBTztBQUNOLFNBQU0sS0FEQTtBQUVOLDBDQUFxQyxJQUYvQjtBQUdOLGNBQVcsbUJBQVMsR0FBVCxFQUFjO0FBQ3hCLFFBQUksUUFBUSxLQUFLLEtBQUwsQ0FBVyxJQUFJLFlBQWYsRUFBNkIsY0FBekM7QUFDQSxXQUFPLFdBQVcsSUFBWCxFQUFpQixLQUFqQixDQUFQO0FBQ0E7QUFOSyxHQUFQO0FBUUEsRUE3SGU7OztBQStIaEI7QUFDQSxTQWhJZ0Isb0JBZ0lOLElBaElNLEVBZ0lBO0FBQ2YsU0FBTyxLQUFLLE9BQUwsQ0FBYSxvQkFBYixJQUFxQyxDQUFDLENBQXRDLEdBQ04sS0FBSyxLQUFMLENBQVcsUUFBWCxFQUFxQixDQUFyQixDQURNLEdBRU4sSUFGRDtBQUdBLE1BQU0sNkNBQTJDLElBQTNDLFdBQU47QUFDQSxTQUFPO0FBQ04sU0FBTSxLQURBO0FBRU4sUUFBSyxHQUZDO0FBR04sY0FBVyxtQkFBUyxHQUFULEVBQWMsTUFBZCxFQUFzQjtBQUFBOztBQUNoQyxRQUFJLFFBQVEsS0FBSyxLQUFMLENBQVcsSUFBSSxZQUFmLEVBQTZCLE1BQXpDOztBQUVBO0FBQ0EsUUFBSSxVQUFVLEVBQWQsRUFBa0I7QUFDakIsU0FBSSxPQUFPLENBQVg7QUFDQSxvQkFBZSxHQUFmLEVBQW9CLElBQXBCLEVBQTBCLEtBQTFCLEVBQWlDLHNCQUFjO0FBQzlDLFVBQUksTUFBSyxRQUFMLElBQWlCLE9BQU8sTUFBSyxRQUFaLEtBQXlCLFVBQTlDLEVBQTBEO0FBQ3pELGFBQUssUUFBTCxDQUFjLFdBQWQsQ0FBMEIsTUFBSyxFQUEvQjtBQUNBO0FBQ0Qsa0JBQVksTUFBSyxFQUFqQixFQUFxQixVQUFyQixFQUFpQyxNQUFLLEVBQXRDO0FBQ0EsYUFBTyxPQUFQLENBQWUsTUFBSyxFQUFwQixFQUF3QixhQUFhLE1BQUssR0FBMUM7QUFDQSxhQUFPLGtCQUFpQixVQUFqQixDQUFQO0FBQ0EsTUFQRDtBQVFBLEtBVkQsTUFVTztBQUNOLFlBQU8sV0FBVyxJQUFYLEVBQWlCLEtBQWpCLENBQVA7QUFDQTtBQUNEO0FBcEJLLEdBQVA7QUFzQkEsRUEzSmU7QUE2SmhCLFFBN0pnQixtQkE2SlAsR0E3Sk8sRUE2SkY7QUFDYixTQUFPO0FBQ04sU0FBTSxLQURBO0FBRU4sa0RBQTZDLEdBQTdDLFVBRk07QUFHTixjQUFXLG1CQUFTLEdBQVQsRUFBYztBQUN4QixRQUFJLFFBQVEsS0FBSyxLQUFMLENBQVcsSUFBSSxZQUFmLEVBQTZCLEtBQXpDO0FBQ0EsV0FBTyxXQUFXLElBQVgsRUFBaUIsS0FBakIsQ0FBUDtBQUNBO0FBTkssR0FBUDtBQVFBO0FBdEtlLENBQWpCOztBQXlLQSxTQUFTLGNBQVQsQ0FBeUIsR0FBekIsRUFBOEIsSUFBOUIsRUFBb0MsS0FBcEMsRUFBMkMsRUFBM0MsRUFBK0M7QUFDOUMsS0FBTSxNQUFNLElBQUksY0FBSixFQUFaO0FBQ0EsS0FBSSxJQUFKLENBQVMsS0FBVCxFQUFnQixNQUFNLFFBQU4sR0FBaUIsSUFBakM7QUFDQSxLQUFJLGdCQUFKLENBQXFCLE1BQXJCLEVBQTZCLFlBQVk7QUFDeEMsTUFBTSxRQUFRLEtBQUssS0FBTCxDQUFXLEtBQUssUUFBaEIsQ0FBZDtBQUNBLFdBQVMsTUFBTSxNQUFmOztBQUVBO0FBQ0EsTUFBSSxNQUFNLE1BQU4sS0FBaUIsRUFBckIsRUFBeUI7QUFDeEI7QUFDQSxrQkFBZSxHQUFmLEVBQW9CLElBQXBCLEVBQTBCLEtBQTFCLEVBQWlDLEVBQWpDO0FBQ0EsR0FIRCxNQUlLO0FBQ0osTUFBRyxLQUFIO0FBQ0E7QUFDRCxFQVpEO0FBYUEsS0FBSSxJQUFKO0FBQ0E7Ozs7Ozs7OztBQ2xNRDs7OztBQUlBLElBQU0sa0JBQWtCLFFBQVEsb0JBQVIsQ0FBeEI7QUFDQSxJQUFNLFNBQVMsUUFBUSxVQUFSLENBQWY7QUFDQSxJQUFNLGNBQWMsUUFBUSx1QkFBUixDQUFwQjtBQUNBLElBQU0sYUFBYSxRQUFRLHNCQUFSLENBQW5COztBQUVBLE9BQU8sT0FBUDtBQUVDLGdCQUFZLElBQVosRUFBa0IsR0FBbEIsRUFBdUI7QUFBQTs7QUFBQTs7QUFFdEI7QUFDQSxNQUFJLENBQUMsR0FBTCxFQUFVO0FBQ1QsU0FBTSxJQUFJLEtBQUoseUNBQU47QUFDQTs7QUFFRDtBQUNBLE1BQUksS0FBSyxPQUFMLENBQWEsUUFBYixNQUEyQixDQUEvQixFQUFrQztBQUNqQyxPQUFJLFNBQVMsY0FBYixFQUE2QjtBQUM1QixXQUFPLGFBQVA7QUFDQSxJQUZELE1BRU8sSUFBSSxTQUFTLGNBQWIsRUFBNkI7QUFDbkMsV0FBTyxhQUFQO0FBQ0EsSUFGTSxNQUVBLElBQUksU0FBUyxpQkFBYixFQUFnQztBQUN0QyxXQUFPLGdCQUFQO0FBQ0EsSUFGTSxNQUVBO0FBQ04sWUFBUSxLQUFSLENBQWMsZ0ZBQWQ7QUFDQTtBQUNEOztBQUVEO0FBQ0EsTUFBSSxLQUFLLE9BQUwsQ0FBYSxHQUFiLElBQW9CLENBQUMsQ0FBekIsRUFBNEI7QUFDM0IsUUFBSyxJQUFMLEdBQVksSUFBWjtBQUNBLFFBQUssT0FBTCxHQUFlLEtBQUssSUFBTCxDQUFVLEtBQVYsQ0FBZ0IsR0FBaEIsQ0FBZjtBQUNBLFFBQUssU0FBTCxHQUFpQixFQUFqQjs7QUFFQTtBQUNBLFFBQUssT0FBTCxDQUFhLE9BQWIsQ0FBcUIsVUFBQyxDQUFELEVBQU87QUFDM0IsUUFBSSxDQUFDLGdCQUFnQixDQUFoQixDQUFMLEVBQXlCO0FBQ3hCLFdBQU0sSUFBSSxLQUFKLGtCQUF5QixJQUF6QiwrQkFBTjtBQUNBOztBQUVELFVBQUssU0FBTCxDQUFlLElBQWYsQ0FBb0IsZ0JBQWdCLENBQWhCLEVBQW1CLEdBQW5CLENBQXBCO0FBQ0EsSUFORDs7QUFRRDtBQUNDLEdBZkQsTUFlTyxJQUFJLENBQUMsZ0JBQWdCLElBQWhCLENBQUwsRUFBNEI7QUFDbEMsU0FBTSxJQUFJLEtBQUosa0JBQXlCLElBQXpCLCtCQUFOOztBQUVEO0FBQ0E7QUFDQyxHQUxNLE1BS0E7QUFDTixRQUFLLElBQUwsR0FBWSxJQUFaO0FBQ0EsUUFBSyxTQUFMLEdBQWlCLGdCQUFnQixJQUFoQixFQUFzQixHQUF0QixDQUFqQjtBQUNBO0FBQ0Q7O0FBRUQ7QUFDQTs7O0FBbEREO0FBQUE7QUFBQSx3QkFtRE8sRUFuRFAsRUFtRFcsRUFuRFgsRUFtRGUsUUFuRGYsRUFtRHlCO0FBQ3ZCLFFBQUssRUFBTCxHQUFVLEVBQVY7QUFDQSxRQUFLLFFBQUwsR0FBZ0IsUUFBaEI7QUFDQSxRQUFLLEVBQUwsR0FBVSxFQUFWO0FBQ0csUUFBSyxHQUFMLEdBQVcsS0FBSyxFQUFMLENBQVEsWUFBUixDQUFxQix1QkFBckIsQ0FBWDtBQUNILFFBQUssTUFBTCxHQUFjLEtBQUssRUFBTCxDQUFRLFlBQVIsQ0FBcUIsMkJBQXJCLENBQWQ7QUFDQSxRQUFLLEdBQUwsR0FBVyxLQUFLLEVBQUwsQ0FBUSxZQUFSLENBQXFCLFVBQXJCLENBQVg7O0FBRUEsT0FBSSxDQUFDLE1BQU0sT0FBTixDQUFjLEtBQUssU0FBbkIsQ0FBTCxFQUFvQztBQUNuQyxTQUFLLFFBQUw7QUFDQSxJQUZELE1BRU87QUFDTixTQUFLLFNBQUw7QUFDQTtBQUNEOztBQUVEOztBQWxFRDtBQUFBO0FBQUEsNkJBbUVZO0FBQ1YsT0FBSSxRQUFRLEtBQUssUUFBTCxDQUFjLEtBQUssSUFBTCxHQUFZLEdBQVosR0FBa0IsS0FBSyxNQUFyQyxDQUFaOztBQUVBLE9BQUksS0FBSixFQUFXO0FBQ1YsUUFBSSxLQUFLLFFBQUwsSUFBaUIsT0FBTyxLQUFLLFFBQVosS0FBeUIsVUFBOUMsRUFBMEQ7QUFDekQsVUFBSyxRQUFMLENBQWMsV0FBZCxDQUEwQixLQUFLLEVBQS9CO0FBQ0E7QUFDRCxnQkFBWSxLQUFLLEVBQWpCLEVBQXFCLEtBQXJCO0FBQ0E7QUFDRCxRQUFLLEtBQUssU0FBTCxDQUFlLElBQXBCLEVBQTBCLEtBQUssU0FBL0I7QUFDQTs7QUFFRDs7QUEvRUQ7QUFBQTtBQUFBLDhCQWdGYTtBQUFBOztBQUNYLFFBQUssS0FBTCxHQUFhLEVBQWI7O0FBRUEsT0FBSSxRQUFRLEtBQUssUUFBTCxDQUFjLEtBQUssSUFBTCxHQUFZLEdBQVosR0FBa0IsS0FBSyxNQUFyQyxDQUFaOztBQUVBLE9BQUksS0FBSixFQUFXO0FBQ1YsUUFBSSxLQUFLLFFBQUwsSUFBa0IsT0FBTyxLQUFLLFFBQVosS0FBeUIsVUFBL0MsRUFBMkQ7QUFDMUQsVUFBSyxRQUFMLENBQWMsV0FBZCxDQUEwQixLQUFLLEVBQS9CO0FBQ0E7QUFDRCxnQkFBWSxLQUFLLEVBQWpCLEVBQXFCLEtBQXJCO0FBQ0E7O0FBRUQsUUFBSyxTQUFMLENBQWUsT0FBZixDQUF1QixxQkFBYTs7QUFFbkMsV0FBSyxVQUFVLElBQWYsRUFBcUIsU0FBckIsRUFBZ0MsVUFBQyxHQUFELEVBQVM7QUFDeEMsWUFBSyxLQUFMLENBQVcsSUFBWCxDQUFnQixHQUFoQjs7QUFFQTtBQUNBO0FBQ0EsU0FBSSxPQUFLLEtBQUwsQ0FBVyxNQUFYLEtBQXNCLE9BQUssT0FBTCxDQUFhLE1BQXZDLEVBQStDO0FBQzlDLFVBQUksTUFBTSxDQUFWOztBQUVBLGFBQUssS0FBTCxDQUFXLE9BQVgsQ0FBbUIsVUFBQyxDQUFELEVBQU87QUFDekIsY0FBTyxDQUFQO0FBQ0EsT0FGRDs7QUFJQSxVQUFJLE9BQUssUUFBTCxJQUFrQixPQUFPLE9BQUssUUFBWixLQUF5QixVQUEvQyxFQUEyRDtBQUMxRCxjQUFLLFFBQUwsQ0FBYyxXQUFkLENBQTBCLE9BQUssRUFBL0I7QUFDQTs7QUFFRCxVQUFNLFFBQVEsT0FBTyxPQUFLLFFBQUwsQ0FBYyxPQUFLLElBQUwsR0FBWSxHQUFaLEdBQWtCLE9BQUssTUFBckMsQ0FBUCxDQUFkO0FBQ0EsVUFBSSxRQUFRLEdBQVosRUFBaUI7QUFDaEIsV0FBTSxjQUFjLE9BQU8sT0FBSyxRQUFMLENBQWMsT0FBSyxJQUFMLEdBQVksR0FBWixHQUFrQixPQUFLLE1BQXZCLEdBQWdDLGNBQTlDLENBQVAsQ0FBcEI7QUFDQSxjQUFLLFFBQUwsQ0FBYyxPQUFLLElBQUwsR0FBWSxHQUFaLEdBQWtCLE9BQUssTUFBdkIsR0FBZ0MsY0FBOUMsRUFBOEQsR0FBOUQ7O0FBRUEsYUFBTSxVQUFVLFdBQVYsS0FBMEIsY0FBYyxDQUF4QyxHQUNMLE9BQU8sUUFBUSxXQURWLEdBRUwsT0FBTyxLQUZSO0FBSUE7QUFDRCxhQUFLLFFBQUwsQ0FBYyxPQUFLLElBQUwsR0FBWSxHQUFaLEdBQWtCLE9BQUssTUFBckMsRUFBNkMsR0FBN0M7O0FBRUEsa0JBQVksT0FBSyxFQUFqQixFQUFxQixHQUFyQjtBQUNBO0FBQ0QsS0E5QkQ7QUErQkEsSUFqQ0Q7O0FBbUNBLE9BQUksS0FBSyxRQUFMLElBQWtCLE9BQU8sS0FBSyxRQUFaLEtBQXlCLFVBQS9DLEVBQTJEO0FBQzFELFNBQUssUUFBTCxDQUFjLFdBQWQsQ0FBMEIsS0FBSyxFQUEvQjtBQUNBO0FBQ0Q7O0FBRUQ7O0FBcElEO0FBQUE7QUFBQSx3QkFxSU8sU0FySVAsRUFxSWtCLEVBcklsQixFQXFJc0I7QUFBQTs7QUFDcEI7QUFDQSxPQUFJLFdBQVcsS0FBSyxNQUFMLEdBQWMsUUFBZCxDQUF1QixFQUF2QixFQUEyQixTQUEzQixDQUFxQyxDQUFyQyxFQUF3QyxPQUF4QyxDQUFnRCxZQUFoRCxFQUE4RCxFQUE5RCxDQUFmO0FBQ0EsVUFBTyxRQUFQLElBQW1CLFVBQUMsSUFBRCxFQUFVO0FBQzVCLFFBQUksUUFBUSxVQUFVLFNBQVYsQ0FBb0IsS0FBcEIsU0FBZ0MsQ0FBQyxJQUFELENBQWhDLEtBQTJDLENBQXZEOztBQUVBLFFBQUksTUFBTSxPQUFPLEVBQVAsS0FBYyxVQUF4QixFQUFvQztBQUNuQyxRQUFHLEtBQUg7QUFDQSxLQUZELE1BRU87QUFDTixTQUFJLE9BQUssUUFBTCxJQUFrQixPQUFPLE9BQUssUUFBWixLQUF5QixVQUEvQyxFQUEyRDtBQUMxRCxhQUFLLFFBQUwsQ0FBYyxXQUFkLENBQTBCLE9BQUssRUFBL0I7QUFDQTtBQUNELGlCQUFZLE9BQUssRUFBakIsRUFBcUIsS0FBckIsRUFBNEIsT0FBSyxFQUFqQztBQUNBOztBQUVELFdBQU8sT0FBUCxDQUFlLE9BQUssRUFBcEIsRUFBd0IsYUFBYSxPQUFLLEdBQTFDO0FBQ0EsSUFiRDs7QUFlQTtBQUNBLE9BQUksU0FBUyxTQUFTLGFBQVQsQ0FBdUIsUUFBdkIsQ0FBYjtBQUNBLFVBQU8sR0FBUCxHQUFhLFVBQVUsR0FBVixDQUFjLE9BQWQsQ0FBc0IsWUFBdEIsZ0JBQWdELFFBQWhELENBQWI7QUFDQSxZQUFTLG9CQUFULENBQThCLE1BQTlCLEVBQXNDLENBQXRDLEVBQXlDLFdBQXpDLENBQXFELE1BQXJEOztBQUVBO0FBQ0E7O0FBRUQ7O0FBL0pEO0FBQUE7QUFBQSxzQkFnS0ssU0FoS0wsRUFnS2dCLEVBaEtoQixFQWdLb0I7QUFBQTs7QUFDbEIsT0FBSSxNQUFNLElBQUksY0FBSixFQUFWOztBQUVBO0FBQ0EsT0FBSSxrQkFBSixHQUF5QixZQUFNO0FBQzlCLFFBQUksSUFBSSxVQUFKLEtBQW1CLENBQXZCLEVBQTBCO0FBQ3pCLFNBQUksSUFBSSxNQUFKLEtBQWUsR0FBbkIsRUFBd0I7QUFDdkIsVUFBSSxRQUFRLFVBQVUsU0FBVixDQUFvQixLQUFwQixTQUFnQyxDQUFDLEdBQUQsRUFBTSxNQUFOLENBQWhDLEtBQWtELENBQTlEOztBQUVBLFVBQUksTUFBTSxPQUFPLEVBQVAsS0FBYyxVQUF4QixFQUFvQztBQUNuQyxVQUFHLEtBQUg7QUFDQSxPQUZELE1BRU87QUFDTixXQUFJLE9BQUssUUFBTCxJQUFpQixPQUFPLE9BQUssUUFBWixLQUF5QixVQUE5QyxFQUEwRDtBQUN6RCxlQUFLLFFBQUwsQ0FBYyxXQUFkLENBQTBCLE9BQUssRUFBL0I7QUFDQTtBQUNELG1CQUFZLE9BQUssRUFBakIsRUFBcUIsS0FBckIsRUFBNEIsT0FBSyxFQUFqQztBQUNBOztBQUVELGFBQU8sT0FBUCxDQUFlLE9BQUssRUFBcEIsRUFBd0IsYUFBYSxPQUFLLEdBQTFDO0FBQ0EsTUFiRCxNQWFPO0FBQ04sVUFBSSxVQUFVLEdBQVYsQ0FBYyxXQUFkLEdBQTRCLE9BQTVCLENBQW9DLG1DQUFwQyxNQUE2RSxDQUFqRixFQUFvRjtBQUNuRixlQUFRLEtBQVIsQ0FBYyw0RUFBZDtBQUNBLE9BRkQsTUFFTyxRQUFRLEtBQVIsQ0FBYyw2QkFBZCxFQUE2QyxVQUFVLEdBQXZELEVBQTRELCtDQUE1RDtBQUNQO0FBQ0Q7QUFDRCxJQXJCRDtBQXNCQSxhQUFVLEdBQVYsR0FBZ0IsS0FBSyxHQUFMLEdBQVcsVUFBVSxHQUFWLEdBQWdCLEtBQUssR0FBaEMsR0FBc0MsVUFBVSxHQUFoRTtBQUNBLE9BQUksSUFBSixDQUFTLEtBQVQsRUFBZ0IsVUFBVSxHQUExQjtBQUNBLE9BQUksSUFBSjtBQUNBOztBQUVEOztBQS9MRDtBQUFBO0FBQUEsdUJBZ01NLFNBaE1OLEVBZ01pQixFQWhNakIsRUFnTXFCO0FBQUE7O0FBQ25CLE9BQUksTUFBTSxJQUFJLGNBQUosRUFBVjs7QUFFQTtBQUNBLE9BQUksa0JBQUosR0FBeUIsWUFBTTtBQUM5QixRQUFJLElBQUksVUFBSixLQUFtQixlQUFlLElBQWxDLElBQ0gsSUFBSSxNQUFKLEtBQWUsR0FEaEIsRUFDcUI7QUFDcEI7QUFDQTs7QUFFRCxRQUFJLFFBQVEsVUFBVSxTQUFWLENBQW9CLEtBQXBCLFNBQWdDLENBQUMsR0FBRCxDQUFoQyxLQUEwQyxDQUF0RDs7QUFFQSxRQUFJLE1BQU0sT0FBTyxFQUFQLEtBQWMsVUFBeEIsRUFBb0M7QUFDbkMsUUFBRyxLQUFIO0FBQ0EsS0FGRCxNQUVPO0FBQ04sU0FBSSxPQUFLLFFBQUwsSUFBaUIsT0FBTyxPQUFLLFFBQVosS0FBeUIsVUFBOUMsRUFBMEQ7QUFDekQsYUFBSyxRQUFMLENBQWMsV0FBZCxDQUEwQixPQUFLLEVBQS9CO0FBQ0E7QUFDRCxpQkFBWSxPQUFLLEVBQWpCLEVBQXFCLEtBQXJCLEVBQTRCLE9BQUssRUFBakM7QUFDQTtBQUNELFdBQU8sT0FBUCxDQUFlLE9BQUssRUFBcEIsRUFBd0IsYUFBYSxPQUFLLEdBQTFDO0FBQ0EsSUFqQkQ7O0FBbUJBLE9BQUksSUFBSixDQUFTLE1BQVQsRUFBaUIsVUFBVSxHQUEzQjtBQUNBLE9BQUksZ0JBQUosQ0FBcUIsY0FBckIsRUFBcUMsZ0NBQXJDO0FBQ0EsT0FBSSxJQUFKLENBQVMsS0FBSyxTQUFMLENBQWUsVUFBVSxJQUF6QixDQUFUO0FBQ0E7QUExTkY7QUFBQTtBQUFBLDJCQTROVSxJQTVOVixFQTROMkI7QUFBQSxPQUFYLEtBQVcseURBQUgsQ0FBRzs7QUFDekIsT0FBSSxDQUFDLE9BQU8sWUFBUixJQUF3QixDQUFDLElBQTdCLEVBQW1DO0FBQ2xDO0FBQ0E7O0FBRUQsZ0JBQWEsT0FBYixnQkFBa0MsSUFBbEMsRUFBMEMsS0FBMUM7QUFDQTtBQWxPRjtBQUFBO0FBQUEsMkJBb09VLElBcE9WLEVBb09nQjtBQUNkLE9BQUksQ0FBQyxPQUFPLFlBQVIsSUFBd0IsQ0FBQyxJQUE3QixFQUFtQztBQUNsQztBQUNBOztBQUVELFVBQU8sYUFBYSxPQUFiLGdCQUFrQyxJQUFsQyxDQUFQO0FBQ0E7QUExT0Y7O0FBQUE7QUFBQTs7QUE4T0EsU0FBUyxTQUFULENBQW1CLENBQW5CLEVBQXNCO0FBQ3BCLFFBQU8sQ0FBQyxNQUFNLFdBQVcsQ0FBWCxDQUFOLENBQUQsSUFBeUIsU0FBUyxDQUFULENBQWhDO0FBQ0Q7Ozs7O0FDelBEOzs7QUFHQSxPQUFPLE9BQVAsR0FBaUI7QUFDaEIsVUFBUyxpQkFBUyxPQUFULEVBQWtCLEtBQWxCLEVBQXlCO0FBQ2pDLE1BQUksS0FBSyxTQUFTLFdBQVQsQ0FBcUIsT0FBckIsQ0FBVDtBQUNBLEtBQUcsU0FBSCxDQUFhLGVBQWUsS0FBNUIsRUFBbUMsSUFBbkMsRUFBeUMsSUFBekM7QUFDQSxVQUFRLGFBQVIsQ0FBc0IsRUFBdEI7QUFDQTtBQUxlLENBQWpCOzs7Ozs7Ozs7QUNIQTs7O0FBR0EsT0FBTyxPQUFQO0FBRUMsb0JBQVksSUFBWixFQUFrQixTQUFsQixFQUE2QjtBQUFBOztBQUM1QixPQUFLLEdBQUwsR0FBVyxtQkFBbUIsSUFBbkIsQ0FBd0IsVUFBVSxTQUFsQyxLQUFnRCxDQUFDLE9BQU8sUUFBbkU7QUFDQSxPQUFLLElBQUwsR0FBWSxJQUFaO0FBQ0EsT0FBSyxPQUFMLEdBQWUsS0FBZjtBQUNBLE9BQUssU0FBTCxHQUFpQixTQUFqQjs7QUFFQTtBQUNBLE9BQUssUUFBTCxHQUFnQixLQUFLLE1BQUwsQ0FBWSxDQUFaLEVBQWUsV0FBZixLQUErQixLQUFLLEtBQUwsQ0FBVyxDQUFYLENBQS9DO0FBQ0E7O0FBRUQ7QUFDQTs7O0FBYkQ7QUFBQTtBQUFBLDBCQWNTLElBZFQsRUFjZTtBQUNiO0FBQ0E7QUFDQSxPQUFJLEtBQUssR0FBVCxFQUFjO0FBQ2IsU0FBSyxhQUFMLEdBQXFCLEtBQUssU0FBTCxDQUFlLElBQWYsRUFBcUIsSUFBckIsQ0FBckI7QUFDQSxTQUFLLGNBQUwsR0FBc0IsS0FBSyxRQUFMLENBQWMsS0FBSyxhQUFMLENBQW1CLEdBQWpDLEVBQXNDLEtBQUssYUFBTCxDQUFtQixJQUF6RCxDQUF0QjtBQUNBOztBQUVELFFBQUssYUFBTCxHQUFxQixLQUFLLFNBQUwsQ0FBZSxJQUFmLENBQXJCO0FBQ0EsUUFBSyxRQUFMLEdBQWdCLEtBQUssUUFBTCxDQUFjLEtBQUssYUFBTCxDQUFtQixHQUFqQyxFQUFzQyxLQUFLLGFBQUwsQ0FBbUIsSUFBekQsQ0FBaEI7QUFDQTs7QUFFRDs7QUExQkQ7QUFBQTtBQUFBLHdCQTJCTyxDQTNCUCxFQTJCVTtBQUFBOztBQUNSO0FBQ0E7QUFDQSxPQUFJLEtBQUssY0FBVCxFQUF5QjtBQUN4QixRQUFJLFFBQVMsSUFBSSxJQUFKLEVBQUQsQ0FBYSxPQUFiLEVBQVo7O0FBRUEsZUFBVyxZQUFNO0FBQ2hCLFNBQUksTUFBTyxJQUFJLElBQUosRUFBRCxDQUFhLE9BQWIsRUFBVjs7QUFFQTtBQUNBLFNBQUksTUFBTSxLQUFOLEdBQWMsSUFBbEIsRUFBd0I7QUFDdkI7QUFDQTs7QUFFRCxZQUFPLFFBQVAsR0FBa0IsTUFBSyxRQUF2QjtBQUNBLEtBVEQsRUFTRyxJQVRIOztBQVdBLFdBQU8sUUFBUCxHQUFrQixLQUFLLGNBQXZCOztBQUVEO0FBQ0MsSUFqQkQsTUFpQk8sSUFBSSxLQUFLLElBQUwsS0FBYyxPQUFsQixFQUEyQjtBQUNqQyxXQUFPLFFBQVAsR0FBa0IsS0FBSyxRQUF2Qjs7QUFFRDtBQUNDLElBSk0sTUFJQTtBQUNOO0FBQ0EsUUFBRyxLQUFLLEtBQUwsSUFBYyxLQUFLLGFBQUwsQ0FBbUIsS0FBcEMsRUFBMkM7QUFDMUMsWUFBTyxLQUFLLFVBQUwsQ0FBZ0IsS0FBSyxRQUFyQixFQUErQixLQUFLLGFBQUwsQ0FBbUIsS0FBbEQsQ0FBUDtBQUNBOztBQUVELFdBQU8sSUFBUCxDQUFZLEtBQUssUUFBakI7QUFDQTtBQUNEOztBQUVEO0FBQ0E7O0FBOUREO0FBQUE7QUFBQSwyQkErRFUsR0EvRFYsRUErRGUsSUEvRGYsRUErRHFCO0FBQ25CLE9BQUksY0FBYyxDQUNqQixVQURpQixFQUVqQixXQUZpQixFQUdqQixTQUhpQixDQUFsQjs7QUFNQSxPQUFJLFdBQVcsR0FBZjtBQUFBLE9BQ0MsVUFERDs7QUFHQSxRQUFLLENBQUwsSUFBVSxJQUFWLEVBQWdCO0FBQ2Y7QUFDQSxRQUFJLENBQUMsS0FBSyxDQUFMLENBQUQsSUFBWSxZQUFZLE9BQVosQ0FBb0IsQ0FBcEIsSUFBeUIsQ0FBQyxDQUExQyxFQUE2QztBQUM1QztBQUNBOztBQUVEO0FBQ0EsU0FBSyxDQUFMLElBQVUsbUJBQW1CLEtBQUssQ0FBTCxDQUFuQixDQUFWO0FBQ0EsZ0JBQWUsQ0FBZixTQUFvQixLQUFLLENBQUwsQ0FBcEI7QUFDQTs7QUFFRCxVQUFPLFNBQVMsTUFBVCxDQUFnQixDQUFoQixFQUFtQixTQUFTLE1BQVQsR0FBa0IsQ0FBckMsQ0FBUDtBQUNBOztBQUVEOztBQXZGRDtBQUFBO0FBQUEsNkJBd0ZZLEdBeEZaLEVBd0ZpQixPQXhGakIsRUF3RjBCO0FBQ3hCLE9BQUksaUJBQWlCLE9BQU8sVUFBUCxJQUFxQixTQUFyQixHQUFpQyxPQUFPLFVBQXhDLEdBQXFELE9BQU8sSUFBakY7QUFBQSxPQUNDLGdCQUFnQixPQUFPLFNBQVAsSUFBb0IsU0FBcEIsR0FBZ0MsT0FBTyxTQUF2QyxHQUFtRCxPQUFPLEdBRDNFO0FBQUEsT0FFQyxRQUFRLE9BQU8sVUFBUCxHQUFvQixPQUFPLFVBQTNCLEdBQXdDLFNBQVMsZUFBVCxDQUF5QixXQUF6QixHQUF1QyxTQUFTLGVBQVQsQ0FBeUIsV0FBaEUsR0FBOEUsT0FBTyxLQUZ0STtBQUFBLE9BR0MsU0FBUyxPQUFPLFdBQVAsR0FBcUIsT0FBTyxXQUE1QixHQUEwQyxTQUFTLGVBQVQsQ0FBeUIsWUFBekIsR0FBd0MsU0FBUyxlQUFULENBQXlCLFlBQWpFLEdBQWdGLE9BQU8sTUFIM0k7QUFBQSxPQUlDLE9BQVMsUUFBUSxDQUFULEdBQWUsUUFBUSxLQUFSLEdBQWdCLENBQWhDLEdBQXNDLGNBSjlDO0FBQUEsT0FLQyxNQUFRLFNBQVMsQ0FBVixHQUFnQixRQUFRLE1BQVIsR0FBaUIsQ0FBbEMsR0FBd0MsYUFML0M7QUFBQSxPQU1DLFlBQVksT0FBTyxJQUFQLENBQVksR0FBWixFQUFpQixXQUFqQixhQUF1QyxRQUFRLEtBQS9DLGlCQUFnRSxRQUFRLE1BQXhFLGNBQXVGLEdBQXZGLGVBQW9HLElBQXBHLENBTmI7O0FBUUE7QUFDQSxPQUFJLE9BQU8sS0FBWCxFQUFrQjtBQUNqQixjQUFVLEtBQVY7QUFDQTtBQUNEO0FBckdGOztBQUFBO0FBQUE7Ozs7Ozs7OztBQ0hBOzs7O0FBSUEsSUFBTSxLQUFLLFFBQVEsY0FBUixDQUFYO0FBQ0EsSUFBTSxrQkFBa0IsUUFBUSxvQkFBUixDQUF4QjtBQUNBLElBQU0sU0FBUyxRQUFRLFVBQVIsQ0FBZjtBQUNBLElBQU0sY0FBYyxRQUFRLHVCQUFSLENBQXBCOztBQUVBLE9BQU8sT0FBUCxHQUFpQixZQUFXOztBQUUzQjtBQUYyQixLQUdyQixTQUhxQjtBQUsxQixxQkFBWSxJQUFaLEVBQWtCLE9BQWxCLEVBQTJCO0FBQUE7O0FBQUE7O0FBRTFCLE9BQUksQ0FBQyxLQUFLLFNBQVYsRUFBcUIsS0FBSyxTQUFMLEdBQWlCLElBQWpCOztBQUVyQixPQUFJLE9BQU8sS0FBSyxJQUFMLENBQVUsT0FBVixDQUFrQixHQUFsQixDQUFYOztBQUVBLE9BQUksT0FBTyxDQUFDLENBQVosRUFBZTtBQUNkLFNBQUssSUFBTCxHQUFZLFlBQVksSUFBWixFQUFrQixLQUFLLElBQXZCLENBQVo7QUFDQTs7QUFFRCxPQUFJLGFBQUo7QUFDQSxRQUFLLE9BQUwsR0FBZSxPQUFmO0FBQ0EsUUFBSyxJQUFMLEdBQVksSUFBWjs7QUFFQSxRQUFLLEVBQUwsR0FBVSxJQUFJLEVBQUosQ0FBTyxLQUFLLElBQVosRUFBa0IsZ0JBQWdCLEtBQUssSUFBckIsQ0FBbEIsQ0FBVjtBQUNBLFFBQUssRUFBTCxDQUFRLE9BQVIsQ0FBZ0IsSUFBaEI7O0FBRUEsT0FBSSxDQUFDLE9BQUQsSUFBWSxLQUFLLE9BQXJCLEVBQThCO0FBQzdCLGNBQVUsS0FBSyxPQUFmO0FBQ0EsV0FBTyxTQUFTLGFBQVQsQ0FBdUIsV0FBVyxHQUFsQyxDQUFQO0FBQ0EsUUFBSSxLQUFLLElBQVQsRUFBZTtBQUNkLFVBQUssU0FBTCxDQUFlLEdBQWYsQ0FBbUIsaUJBQW5CLEVBQXNDLEtBQUssSUFBM0M7QUFDQSxVQUFLLFlBQUwsQ0FBa0IsaUJBQWxCLEVBQXFDLEtBQUssSUFBMUM7QUFDQSxVQUFLLFlBQUwsQ0FBa0Isc0JBQWxCLEVBQTBDLEtBQUssSUFBL0M7QUFDQTtBQUNELFFBQUksS0FBSyxTQUFULEVBQW9CLEtBQUssU0FBTCxHQUFpQixLQUFLLFNBQXRCO0FBQ3BCO0FBQ0QsT0FBSSxJQUFKLEVBQVUsVUFBVSxJQUFWOztBQUVWLE9BQUksS0FBSyxTQUFULEVBQW9CO0FBQ25CLFlBQVEsZ0JBQVIsQ0FBeUIsT0FBekIsRUFBa0MsVUFBQyxDQUFELEVBQU87QUFDeEMsV0FBSyxLQUFMO0FBQ0EsS0FGRDtBQUdBOztBQUVELE9BQUksS0FBSyxRQUFULEVBQW1CO0FBQ2xCLFNBQUssUUFBTCxDQUFjLFdBQWQsQ0FBMEIsT0FBMUI7QUFDQTs7QUFFRCxPQUFJLEtBQUssT0FBTCxJQUFnQixNQUFNLE9BQU4sQ0FBYyxLQUFLLE9BQW5CLENBQXBCLEVBQWlEO0FBQ2hELFNBQUssT0FBTCxDQUFhLE9BQWIsQ0FBcUIsb0JBQVk7QUFDaEMsYUFBUSxTQUFSLENBQWtCLEdBQWxCLENBQXNCLFFBQXRCO0FBQ0EsS0FGRDtBQUdBOztBQUVELE9BQUksS0FBSyxJQUFMLENBQVUsV0FBVixPQUE0QixRQUFoQyxFQUEwQztBQUN6QyxRQUFNLFNBQVMsS0FBSyxPQUFMLEdBQ1osK0NBRFksR0FFWix1Q0FGSDs7QUFJQSxRQUFNLFNBQVMsS0FBSyxPQUFMLEdBQ2QsOERBRGMsR0FFZCw2REFGRDs7QUFJQSxRQUFNLFdBQVcsS0FBSyxPQUFMLEdBQ2hCLHNEQURnQixHQUVoQixxREFGRDs7QUFLQSxRQUFNLGlDQUErQixNQUEvQiwrU0FNa0QsS0FBSyxRQU52RCxrSkFVSSxNQVZKLHVJQWFJLFFBYkosMEJBQU47O0FBaUJBLFFBQU0sWUFBWSxTQUFTLGFBQVQsQ0FBdUIsS0FBdkIsQ0FBbEI7QUFDQSxjQUFVLEtBQVYsQ0FBZ0IsT0FBaEIsR0FBMEIsTUFBMUI7QUFDQSxjQUFVLFNBQVYsR0FBc0IsWUFBdEI7QUFDQSxhQUFTLElBQVQsQ0FBYyxXQUFkLENBQTBCLFNBQTFCOztBQUVBLFNBQUssTUFBTCxHQUFjLFVBQVUsYUFBVixDQUF3QixNQUF4QixDQUFkO0FBQ0E7O0FBRUQsUUFBSyxPQUFMLEdBQWUsT0FBZjtBQUNBLFVBQU8sT0FBUDtBQUNBOztBQUVEOzs7QUE3RjBCO0FBQUE7QUFBQSx5QkE4RnBCLENBOUZvQixFQThGakI7QUFDUjtBQUNBLFFBQUksS0FBSyxJQUFMLENBQVUsT0FBZCxFQUF1QjtBQUN0QixVQUFLLEVBQUwsQ0FBUSxPQUFSLENBQWdCLElBQWhCO0FBQ0E7O0FBRUQsUUFBSSxLQUFLLElBQUwsQ0FBVSxJQUFWLENBQWUsV0FBZixPQUFpQyxRQUFyQyxFQUErQztBQUM5QyxVQUFLLE1BQUwsQ0FBWSxNQUFaO0FBQ0EsS0FGRCxNQUVPLEtBQUssRUFBTCxDQUFRLEtBQVIsQ0FBYyxDQUFkOztBQUVQLFdBQU8sT0FBUCxDQUFlLEtBQUssT0FBcEIsRUFBNkIsUUFBN0I7QUFDQTtBQXpHeUI7O0FBQUE7QUFBQTs7QUE0RzNCLFFBQU8sU0FBUDtBQUNBLENBN0dEOzs7OztBQ1RBOzs7OztBQUtBLE9BQU8sT0FBUCxHQUFpQjs7QUFFaEI7QUFDQSxVQUFTLGlCQUFTLElBQVQsRUFBNEI7QUFBQSxNQUFiLEdBQWEseURBQVAsS0FBTzs7QUFDcEM7QUFDQTtBQUNBLE1BQUksT0FBTyxLQUFLLEdBQWhCLEVBQXFCOztBQUVwQixPQUFJLFlBQUo7O0FBRUEsT0FBSSxLQUFLLElBQVQsRUFBZTtBQUNkLGVBQVcsS0FBSyxJQUFoQjtBQUNBOztBQUVELE9BQUksS0FBSyxHQUFULEVBQWM7QUFDYix1QkFBaUIsS0FBSyxHQUF0QjtBQUNBOztBQUVELE9BQUksS0FBSyxRQUFULEVBQW1CO0FBQ2xCLFFBQUksT0FBTyxLQUFLLFFBQUwsQ0FBYyxLQUFkLENBQW9CLEdBQXBCLENBQVg7QUFDQSxTQUFLLE9BQUwsQ0FBYSxVQUFTLEdBQVQsRUFBYztBQUMxQix1QkFBZ0IsR0FBaEI7QUFDQSxLQUZEO0FBR0E7O0FBRUQsT0FBSSxLQUFLLEdBQVQsRUFBYztBQUNiLHlCQUFtQixLQUFLLEdBQXhCO0FBQ0E7O0FBRUQsVUFBTztBQUNOLFNBQUssaUJBREM7QUFFTixVQUFNO0FBQ0wsY0FBUztBQURKO0FBRkEsSUFBUDtBQU1BOztBQUVELFNBQU87QUFDTixRQUFLLDRCQURDO0FBRU4sU0FBTSxJQUZBO0FBR04sVUFBTztBQUNOLFdBQU8sR0FERDtBQUVOLFlBQVE7QUFGRjtBQUhELEdBQVA7QUFRQSxFQTdDZTs7QUErQ2hCO0FBQ0EsaUJBQWdCLHdCQUFTLElBQVQsRUFBNEI7QUFBQSxNQUFiLEdBQWEseURBQVAsS0FBTzs7QUFDM0M7QUFDQSxNQUFJLE9BQU8sS0FBSyxHQUFoQixFQUFxQjtBQUNwQixVQUFPO0FBQ04sU0FBSyxtQkFEQztBQUVOLFVBQU07QUFDTCxTQUFJLEtBQUs7QUFESjtBQUZBLElBQVA7QUFNQTs7QUFFRCxTQUFPO0FBQ04sUUFBSyxxQ0FEQztBQUVOLFNBQU07QUFDTCxjQUFVLEtBQUssT0FEVjtBQUVMLGFBQVMsS0FBSztBQUZULElBRkE7QUFNTixVQUFPO0FBQ04sV0FBTyxHQUREO0FBRU4sWUFBUTtBQUZGO0FBTkQsR0FBUDtBQVdBLEVBdEVlOztBQXdFaEI7QUFDQSxjQUFhLHFCQUFTLElBQVQsRUFBNEI7QUFBQSxNQUFiLEdBQWEseURBQVAsS0FBTzs7QUFDeEM7QUFDQSxNQUFJLE9BQU8sS0FBSyxHQUFoQixFQUFxQjtBQUNwQixVQUFPO0FBQ04sU0FBSyxtQkFEQztBQUVOLFVBQU07QUFDTCxTQUFJLEtBQUs7QUFESjtBQUZBLElBQVA7QUFNQTs7QUFFRCxTQUFPO0FBQ04sUUFBSyxzQ0FEQztBQUVOLFNBQU07QUFDTCxjQUFVLEtBQUssT0FEVjtBQUVMLGFBQVMsS0FBSztBQUZULElBRkE7QUFNTixVQUFPO0FBQ04sV0FBTyxHQUREO0FBRU4sWUFBUTtBQUZGO0FBTkQsR0FBUDtBQVdBLEVBL0ZlOztBQWlHaEI7QUFDQSxnQkFBZSx1QkFBUyxJQUFULEVBQTRCO0FBQUEsTUFBYixHQUFhLHlEQUFQLEtBQU87O0FBQzFDO0FBQ0EsTUFBSSxPQUFPLEtBQUssR0FBaEIsRUFBcUI7QUFDcEIsT0FBSSxVQUFVLEtBQUssVUFBTCxHQUFrQjtBQUMvQixtQkFBZSxLQUFLO0FBRFcsSUFBbEIsR0FFVjtBQUNILFVBQU0sS0FBSztBQURSLElBRko7O0FBTUEsVUFBTztBQUNOLFNBQUssaUJBREM7QUFFTixVQUFNO0FBRkEsSUFBUDtBQUlBOztBQUVELFNBQU87QUFDTixRQUFLLGtDQURDO0FBRU4sU0FBTTtBQUNMLGlCQUFhLEtBQUssVUFEYjtBQUVMLGFBQVMsS0FBSztBQUZULElBRkE7QUFNTixVQUFPO0FBQ04sV0FBTyxHQUREO0FBRU4sWUFBUTtBQUZGO0FBTkQsR0FBUDtBQVdBLEVBNUhlOztBQThIaEI7QUFDQSxXQUFVLGtCQUFTLElBQVQsRUFBZTtBQUN4QixTQUFPO0FBQ04sUUFBSywrRkFEQztBQUVOLFNBQU0sSUFGQTtBQUdOLFVBQU87QUFDTixXQUFPLEdBREQ7QUFFTixZQUFRO0FBRkY7QUFIRCxHQUFQO0FBUUEsRUF4SWU7O0FBMEloQjtBQUNBLGVBQWMsc0JBQVMsSUFBVCxFQUFlO0FBQzVCLFNBQU87QUFDTixRQUFLLCtGQURDO0FBRU4sU0FBTSxJQUZBO0FBR04sVUFBTztBQUNOLFdBQU8sR0FERDtBQUVOLFlBQVE7QUFGRjtBQUhELEdBQVA7QUFRQSxFQXBKZTs7QUFzSmhCO0FBQ0EsVUFBUyxpQkFBUyxJQUFULEVBQTRCO0FBQUEsTUFBYixHQUFhLHlEQUFQLEtBQU87O0FBQ3BDO0FBQ0EsTUFBSSxPQUFPLEtBQUssR0FBaEIsRUFBcUI7QUFDcEIsVUFBTztBQUNOLHNCQUFnQixLQUFLLEtBQXJCO0FBRE0sSUFBUDtBQUdBLEdBSkQsTUFJTztBQUNOLFVBQU87QUFDTiw4Q0FBd0MsS0FBSyxLQUE3QyxNQURNO0FBRU4sV0FBTztBQUNOLFlBQU8sSUFERDtBQUVOLGFBQVE7QUFGRjtBQUZELElBQVA7QUFPQTtBQUNELEVBdEtlOztBQXdLaEI7QUFDQSxtQkFBa0IsMEJBQVMsSUFBVCxFQUE0QjtBQUFBLE1BQWIsR0FBYSx5REFBUCxLQUFPOztBQUM3QztBQUNBLE1BQUksT0FBTyxLQUFLLEdBQWhCLEVBQXFCO0FBQ3BCLFVBQU87QUFDTiw2Q0FBdUMsS0FBSyxJQUE1QztBQURNLElBQVA7QUFHQSxHQUpELE1BSU87QUFDTixVQUFPO0FBQ04sMkNBQXFDLEtBQUssSUFBMUMsTUFETTtBQUVOLFdBQU87QUFDTixZQUFPLEdBREQ7QUFFTixhQUFRO0FBRkY7QUFGRCxJQUFQO0FBT0E7QUFDRCxFQXhMZTs7QUEwTGhCO0FBQ0EsWUFBVyxtQkFBUyxJQUFULEVBQWU7QUFDekIsU0FBTztBQUNOO0FBRE0sR0FBUDtBQUdBLEVBL0xlOztBQWlNaEI7QUFDQSxrQkFBaUIseUJBQVMsSUFBVCxFQUE0QjtBQUFBLE1BQWIsR0FBYSx5REFBUCxLQUFPOztBQUM1QztBQUNBLE1BQUksT0FBTyxLQUFLLEdBQWhCLEVBQXFCO0FBQ3BCLFVBQU87QUFDTixTQUFLLG1CQURDO0FBRU4sVUFBTTtBQUZBLElBQVA7QUFJQSxHQUxELE1BS087QUFDTixVQUFPO0FBQ04sdUNBQWlDLEtBQUssUUFBdEMsTUFETTtBQUVOLFdBQU87QUFDTixZQUFPLEdBREQ7QUFFTixhQUFRO0FBRkY7QUFGRCxJQUFQO0FBT0E7QUFDRCxFQWxOZTs7QUFvTmhCO0FBQ0EsU0FyTmdCLG9CQXFOTixJQXJOTSxFQXFOQTtBQUNmLFNBQU87QUFDTiw0QkFBdUIsS0FBSyxRQUE1QjtBQURNLEdBQVA7QUFHQSxFQXpOZTs7O0FBMk5oQjtBQUNBLE9BNU5nQixrQkE0TlIsSUE1TlEsRUE0TkY7QUFDYixTQUFPO0FBQ04sUUFBSyxnQ0FEQztBQUVOLFNBQU0sSUFGQTtBQUdOLFVBQU87QUFDTixXQUFPLEdBREQ7QUFFTixZQUFRO0FBRkY7QUFIRCxHQUFQO0FBUUEsRUFyT2U7OztBQXVPaEI7QUFDQSxXQXhPZ0Isc0JBd09KLElBeE9JLEVBd09lO0FBQUEsTUFBYixHQUFhLHlEQUFQLEtBQU87OztBQUU5QixNQUFJLEtBQUssTUFBVCxFQUFpQjtBQUNoQixRQUFLLENBQUwsR0FBUyxLQUFLLE1BQWQ7QUFDQSxVQUFPLEtBQUssTUFBWjtBQUNBOztBQUVEO0FBQ0EsTUFBSSxPQUFPLEtBQUssR0FBaEIsRUFBcUI7QUFDcEIsVUFBTztBQUNOLFNBQUssbUJBREM7QUFFTixVQUFNO0FBRkEsSUFBUDtBQUlBOztBQUVELE1BQUksQ0FBQyxHQUFELElBQVEsS0FBSyxHQUFqQixFQUFzQjtBQUNyQixVQUFPLEtBQUssR0FBWjtBQUNBOztBQUVELFNBQU87QUFDTixRQUFLLDJCQURDO0FBRU4sU0FBTSxJQUZBO0FBR04sVUFBTztBQUNOLFdBQU8sR0FERDtBQUVOLFlBQVE7QUFGRjtBQUhELEdBQVA7QUFRQSxFQW5RZTs7O0FBcVFoQjtBQUNBLFVBdFFnQixxQkFzUUwsSUF0UUssRUFzUUM7QUFDaEIsU0FBTztBQUNOLFFBQUssZ0RBREM7QUFFTixTQUFNLElBRkE7QUFHTixVQUFPO0FBQ04sV0FBTyxHQUREO0FBRU4sWUFBUTtBQUZGO0FBSEQsR0FBUDtBQVFBLEVBL1FlOzs7QUFpUmhCO0FBQ0EsU0FsUmdCLG9CQWtSTixJQWxSTSxFQWtSQTtBQUNmLFNBQU87QUFDTixRQUFLLHVDQURDO0FBRU4sU0FBTSxJQUZBO0FBR04sVUFBTztBQUNOLFdBQU8sR0FERDtBQUVOLFlBQVE7QUFGRjtBQUhELEdBQVA7QUFRQSxFQTNSZTs7O0FBNlJoQjtBQUNBLE9BOVJnQixrQkE4UlIsSUE5UlEsRUE4UkY7QUFDYixTQUFPO0FBQ04sUUFBSywyQkFEQztBQUVOLFNBQU0sSUFGQTtBQUdOLFVBQU87QUFDTixXQUFPLEdBREQ7QUFFTixZQUFRO0FBRkY7QUFIRCxHQUFQO0FBUUEsRUF2U2U7OztBQXlTaEI7QUFDQSxPQTFTZ0Isa0JBMFNSLElBMVNRLEVBMFNGO0FBQ2IsU0FBTztBQUNOLFFBQUssNENBREM7QUFFTixTQUFNLElBRkE7QUFHTixVQUFPO0FBQ04sV0FBTyxHQUREO0FBRU4sWUFBUTtBQUZGO0FBSEQsR0FBUDtBQVFBLEVBblRlOzs7QUFxVGhCO0FBQ0EsT0F0VGdCLGtCQXNUUixJQXRUUSxFQXNURjtBQUNiLFNBQU87QUFDTixRQUFLLDJCQURDO0FBRU4sU0FBTSxJQUZBO0FBR04sVUFBTztBQUNOLFdBQU8sR0FERDtBQUVOLFlBQVE7QUFGRjtBQUhELEdBQVA7QUFRQSxFQS9UZTs7O0FBaVVoQjtBQUNBLE9BbFVnQixrQkFrVVIsSUFsVVEsRUFrVVc7QUFBQSxNQUFiLEdBQWEseURBQVAsS0FBTzs7QUFDMUI7QUFDQSxNQUFJLE9BQU8sS0FBSyxHQUFoQixFQUFxQjtBQUNwQixVQUFPO0FBQ04sOEJBQXdCLEtBQUssUUFBN0I7QUFETSxJQUFQO0FBR0EsR0FKRCxNQUlPO0FBQ04sVUFBTztBQUNOLDJDQUFxQyxLQUFLLFFBQTFDLE1BRE07QUFFTixXQUFPO0FBQ04sWUFBTyxHQUREO0FBRU4sYUFBUTtBQUZGO0FBRkQsSUFBUDtBQU9BO0FBQ0QsRUFqVmU7OztBQW1WaEI7QUFDQSxTQXBWZ0Isb0JBb1ZOLElBcFZNLEVBb1ZBO0FBQ2YsU0FBTztBQUNOLFFBQUssa0JBREM7QUFFTixTQUFNO0FBRkEsR0FBUDtBQUlBLEVBelZlOzs7QUEyVmhCO0FBQ0EsSUE1VmdCLGVBNFZYLElBNVZXLEVBNFZRO0FBQUEsTUFBYixHQUFhLHlEQUFQLEtBQU87O0FBQ3ZCLFNBQU87QUFDTixRQUFLLE1BQU0sT0FBTixHQUFnQixPQURmO0FBRU4sU0FBTTtBQUZBLEdBQVA7QUFJQSxFQWpXZTs7O0FBbVdoQjtBQUNBLE1BcFdnQixpQkFvV1QsSUFwV1MsRUFvV0g7O0FBRVosTUFBSSxlQUFKOztBQUVBO0FBQ0EsTUFBSSxLQUFLLEVBQUwsS0FBWSxJQUFoQixFQUFzQjtBQUNyQixlQUFVLEtBQUssRUFBZjtBQUNBOztBQUVEOztBQUVBLFNBQU87QUFDTixRQUFLLEdBREM7QUFFTixTQUFNO0FBQ0wsYUFBUyxLQUFLLE9BRFQ7QUFFTCxVQUFNLEtBQUs7QUFGTjtBQUZBLEdBQVA7QUFPQSxFQXRYZTs7O0FBd1hoQjtBQUNBLE9BelhnQixrQkF5WFIsSUF6WFEsRUF5WFc7QUFBQSxNQUFiLEdBQWEseURBQVAsS0FBTzs7QUFDMUIsTUFBSSxNQUFNLEtBQUssSUFBTCwyQkFDYSxLQUFLLElBRGxCLEdBRVQsS0FBSyxHQUZOOztBQUlBLE1BQUksS0FBSyxLQUFULEVBQWdCO0FBQ2YsVUFBTyx1QkFDTixLQUFLLEtBREMsR0FFTixRQUZNLEdBR04sS0FBSyxJQUhOO0FBSUE7O0FBRUQsU0FBTztBQUNOLFFBQUssTUFBTSxHQURMO0FBRU4sVUFBTztBQUNOLFdBQU8sSUFERDtBQUVOLFlBQVE7QUFGRjtBQUZELEdBQVA7QUFPQSxFQTVZZTs7O0FBOFloQjtBQUNBLFNBL1lnQixvQkErWU4sSUEvWU0sRUErWWE7QUFBQSxNQUFiLEdBQWEseURBQVAsS0FBTzs7QUFDNUIsTUFBTSxNQUFNLEtBQUssSUFBTCxtQ0FDbUIsS0FBSyxJQUR4QixTQUVYLEtBQUssR0FBTCxHQUFXLEdBRlo7QUFHQSxTQUFPO0FBQ04sUUFBSyxHQURDO0FBRU4sVUFBTztBQUNOLFdBQU8sR0FERDtBQUVOLFlBQVE7QUFGRjtBQUZELEdBQVA7QUFPQSxFQTFaZTtBQTRaaEIsUUE1WmdCLG1CQTRaUCxJQTVaTyxFQTRaRDtBQUNkLE1BQU0sTUFBTyxLQUFLLEdBQUwsSUFBWSxLQUFLLFFBQWpCLElBQTZCLEtBQUssSUFBbkMsMkJBQ1csS0FBSyxRQURoQixTQUM0QixLQUFLLElBRGpDLFNBQ3lDLEtBQUssR0FEOUMsU0FFWCxLQUFLLEdBQUwsR0FBVyxHQUZaO0FBR0EsU0FBTztBQUNOLFFBQUssR0FEQztBQUVOLFVBQU87QUFDTixXQUFPLElBREQ7QUFFTixZQUFRO0FBRkY7QUFGRCxHQUFQO0FBT0EsRUF2YWU7QUF5YWhCLE9BemFnQixrQkF5YVIsSUF6YVEsRUF5YUY7QUFDYixTQUFPO0FBQ04sU0FBTTtBQURBLEdBQVA7QUFHQTtBQTdhZSxDQUFqQjs7Ozs7QUNMQSxJQUFJLFlBQVk7QUFDZixRQUFPLFFBQVEsYUFBUixDQURRO0FBRWYsUUFBTyxRQUFRLGFBQVIsQ0FGUTtBQUdmLFlBQVcsUUFBUSxpQkFBUjtBQUhJLENBQWhCOztBQU1BLFVBQVUsU0FBVixDQUFvQixZQUFwQixFQUFrQyxZQUFZO0FBQzVDLFNBQVEsR0FBUixDQUFZLG9CQUFaO0FBQ0QsQ0FGRDs7QUFJQSxVQUFVLFNBQVYsQ0FBb0IsT0FBcEIsRUFBNkIsWUFBWTtBQUN2QyxTQUFRLEdBQVIsQ0FBWSxnQ0FBWjtBQUNELENBRkQ7O0FBSUEsVUFBVSxTQUFWLENBQW9CLFFBQXBCLEVBQThCLFlBQVk7QUFDeEMsU0FBUSxHQUFSLENBQVksZ0NBQVo7QUFDRCxDQUZEOztBQUlBLElBQUksa0JBQWtCO0FBQ3JCLFFBQU8sZ0NBRGM7QUFFckIsUUFBTyxpQkFGYztBQUdyQixTQUFRLGtCQUhhO0FBSXJCLGFBQVksaUJBSlM7QUFLckIsV0FBVTtBQUxXLENBQXRCOztBQVFBLFNBQVMsbUJBQVQsQ0FBNkIsSUFBN0IsRUFBbUM7QUFDbEMsS0FBSSxZQUFZLFNBQVMsYUFBVCxDQUF1QixHQUF2QixDQUFoQjs7QUFFQSxXQUFVLFNBQVYsQ0FBb0IsR0FBcEIsQ0FBd0IsaUJBQXhCLEVBQTJDLFNBQTNDO0FBQ0EsV0FBVSxZQUFWLENBQXVCLGlCQUF2QixFQUEwQyxTQUExQztBQUNBLFdBQVUsWUFBVixDQUF1QixxQkFBdkIsRUFBOEMsS0FBSyxHQUFuRDtBQUNBLFdBQVUsWUFBVixDQUF1QixxQkFBdkIsRUFBOEMsS0FBSyxHQUFuRDtBQUNBLFdBQVUsWUFBVixDQUF1QixzQkFBdkIsRUFBK0MsS0FBSyxJQUFwRDtBQUNBLFdBQVUsWUFBVixDQUF1QiwwQkFBdkIsRUFBbUQsS0FBSyxRQUF4RDtBQUNBLFdBQVUsU0FBVixHQUFzQix3Q0FBd0MsS0FBSyxNQUFuRTs7QUFFQSxLQUFJLE9BQU8sSUFBSSxVQUFVLEtBQWQsQ0FBb0I7QUFDOUIsUUFBTSxTQUR3QjtBQUU5QixPQUFLLGdDQUZ5QjtBQUc5QixPQUFLLGlCQUh5QjtBQUk5QixZQUFVLGlCQUpvQjtBQUs5QixZQUFVLFNBQVMsYUFBVCxDQUF1QixtQkFBdkIsQ0FMb0I7QUFNOUIsYUFBVywwQkFObUI7QUFPOUIsV0FBUyxLQVBxQjtBQVE5QixXQUFTLENBQUMsS0FBRCxFQUFRLE1BQVIsRUFBZ0IsU0FBaEI7QUFScUIsRUFBcEIsQ0FBWDs7QUFXQSxRQUFPLFNBQVA7QUFDQTs7QUFFRCxTQUFTLE9BQVQsR0FBbUI7QUFDbEIsS0FBSSxPQUFPLGVBQVg7QUFDQSxVQUFTLGFBQVQsQ0FBdUIsbUJBQXZCLEVBQ0UsV0FERixDQUNjLG9CQUFvQixJQUFwQixDQURkO0FBRUE7O0FBRUQsT0FBTyxPQUFQLEdBQWlCLE9BQWpCOztBQUVBLFNBQVMsZ0JBQVQsR0FBNEI7QUFDM0IsS0FBSSxPQUFPLGVBQVg7O0FBRUEsS0FBSSxVQUFVLEtBQWQsQ0FBb0I7QUFDbkIsUUFBTSxVQURhO0FBRW5CLE9BQUs7QUFGYyxFQUFwQixFQUdHLFVBQVUsSUFBVixFQUFnQjtBQUNsQixNQUFJLEtBQUssSUFBSSxVQUFVLEtBQWQsQ0FBb0I7QUFDM0IsU0FBTSxTQURxQjtBQUUzQixRQUFLLGdDQUZzQjtBQUczQixRQUFLLGlCQUhzQjtBQUkzQixhQUFVLGlCQUppQjtBQUszQixjQUFXLDBCQUxnQjtBQU0zQixZQUFTLEtBTmtCO0FBTzNCLFlBQVMsQ0FBQyxLQUFELEVBQVEsTUFBUixFQUFnQixTQUFoQjtBQVBrQixHQUFwQixDQUFUO0FBU0EsV0FBUyxhQUFULENBQXVCLHNCQUF2QixFQUNHLFdBREgsQ0FDZSxFQURmO0FBRUUsS0FBRyxXQUFILENBQWUsSUFBZjtBQUNGLEVBaEJEO0FBaUJBOztBQUVELE9BQU8sZ0JBQVAsR0FBMEIsZ0JBQTFCOztBQUVBLFNBQVMsZUFBVCxHQUEyQjtBQUN6QixLQUFJLFlBQVksU0FBUyxhQUFULENBQXVCLDBCQUF2QixDQUFoQjtBQUNELEtBQUksT0FBTyxVQUFVLGFBQVYsQ0FBd0Isa0JBQXhCLEVBQTRDLEtBQXZEO0FBQ0EsS0FBSSxNQUFNLFVBQVUsYUFBVixDQUF3QixpQkFBeEIsRUFBMkMsS0FBckQ7O0FBRUEsS0FBSSxVQUFVLEtBQWQsQ0FBb0I7QUFDbkIsUUFBTSxJQURhO0FBRW5CLE9BQUssR0FGYztBQUduQixZQUFVLFNBSFM7QUFJbkIsV0FBUyxDQUFDLE1BQUQ7QUFKVSxFQUFwQixFQUtHLFVBQVUsSUFBVixFQUFnQjtBQUNsQixPQUFLLEtBQUwsQ0FBVyxRQUFYLEdBQXNCLFVBQXRCO0FBQ0EsRUFQRDs7QUFVQSxXQUFVLGFBQVYsQ0FBd0Isa0JBQXhCLEVBQTRDLEtBQTVDLEdBQW9ELEVBQXBEO0FBQ0EsV0FBVSxhQUFWLENBQXdCLGlCQUF4QixFQUEyQyxLQUEzQyxHQUFtRCxFQUFuRDtBQUNBOztBQUVELE9BQU8sZUFBUCxHQUF5QixlQUF6Qjs7QUFFQTs7QUFFQSxJQUFJLFVBQVUsS0FBZCxDQUFvQjtBQUNuQixPQUFNLFlBRGE7QUFFbkIsU0FBUSxzQkFGVztBQUduQixPQUFNLFNBSGE7QUFJbkIsT0FBTSxFQUphO0FBS25CLFdBQVUsU0FBUyxJQUxBO0FBTW5CLFlBQVc7QUFOUSxDQUFwQjs7QUFTQSxJQUFJLFVBQVUsS0FBZCxDQUFvQjtBQUNuQixPQUFNLGdCQURhO0FBRW5CLGFBQVksaUJBRk87QUFHbkIsU0FBUSxVQUhXO0FBSW5CLFdBQVUsU0FBUyxJQUpBO0FBS25CLFlBQVc7QUFMUSxDQUFwQjs7QUFRQTtBQUNBLElBQUksVUFBVSxLQUFkLENBQW9CO0FBQ25CLE9BQU0sUUFEYTtBQUVuQixXQUFVLGVBRlM7QUFHbkIsVUFBUyxJQUhVO0FBSW5CLFdBQVUsU0FBUyxJQUpBO0FBS25CLFlBQVc7QUFMUSxDQUFwQjs7QUFRQTtBQUNBLFNBQVMsZ0JBQVQsQ0FBMEIsd0JBQTFCLEVBQW9ELFlBQVc7QUFDOUQsU0FBUSxHQUFSLENBQVksMEJBQVo7QUFDQSxDQUZEOztBQUlBO0FBQ0EsU0FBUyxnQkFBVCxDQUEwQix3QkFBMUIsRUFBb0QsWUFBVztBQUM5RCxTQUFRLEdBQVIsQ0FBWSwwQkFBWjs7QUFFQTtBQUNBLElBQUcsT0FBSCxDQUFXLElBQVgsQ0FBZ0IsU0FBUyxnQkFBVCxDQUEwQixtQkFBMUIsQ0FBaEIsRUFBZ0UsVUFBUyxJQUFULEVBQWU7QUFDOUUsT0FBSyxnQkFBTCxDQUFzQixrQkFBdEIsRUFBMEMsVUFBUyxDQUFULEVBQVk7QUFDckQsV0FBUSxHQUFSLENBQVksbUJBQVosRUFBaUMsQ0FBakM7QUFDQSxHQUZEO0FBR0EsRUFKRDs7QUFNQSxLQUFJLFdBQVc7QUFDZCxXQUFTLElBQUksVUFBVSxLQUFkLENBQW9CO0FBQzVCLFNBQU0sU0FEc0I7QUFFNUIsY0FBVyxJQUZpQjtBQUc1QixRQUFLLDRCQUh1QjtBQUk1QixRQUFLLGlCQUp1QjtBQUs1QixTQUFNLGtCQUxzQjtBQU01QixhQUFVO0FBTmtCLEdBQXBCLEVBT04sU0FBUyxhQUFULENBQXVCLDhCQUF2QixDQVBNLENBREs7O0FBVWQsWUFBVSxJQUFJLFVBQVUsS0FBZCxDQUFvQjtBQUM3QixTQUFNLFVBRHVCO0FBRTdCLGNBQVcsSUFGa0I7QUFHN0IsU0FBTSw0QkFIdUI7QUFJN0IsWUFBUyw2REFKb0I7QUFLN0IsWUFBUyxrQkFMb0I7QUFNN0IsZ0JBQWE7QUFOZ0IsR0FBcEIsRUFPUCxTQUFTLGFBQVQsQ0FBdUIsK0JBQXZCLENBUE8sQ0FWSTs7QUFtQmQsYUFBVyxJQUFJLFVBQVUsS0FBZCxDQUFvQjtBQUM5QixTQUFNLFdBRHdCO0FBRTlCLGNBQVcsSUFGbUI7QUFHOUIsUUFBSyw0QkFIeUI7QUFJOUIsVUFBTyw2REFKdUI7QUFLOUIsZ0JBQWEsa0JBTGlCO0FBTTlCLGFBQVUsU0FBUztBQU5XLEdBQXBCLEVBT1IsU0FBUyxhQUFULENBQXVCLGdDQUF2QixDQVBRLENBbkJHOztBQTRCZCxTQUFPLElBQUksVUFBVSxLQUFkLENBQW9CO0FBQzFCLFNBQU0sT0FEb0I7QUFFMUIsY0FBVyxJQUZlO0FBRzFCLE9BQUksOEJBSHNCO0FBSTFCLFlBQVMsa0JBSmlCO0FBSzFCLFNBQU07QUFMb0IsR0FBcEIsRUFNSixTQUFTLGFBQVQsQ0FBdUIsNEJBQXZCLENBTkk7QUE1Qk8sRUFBZjtBQW9DQSxDQTlDRDs7QUFnREE7QUFDQSxJQUFJLE9BQU8sQ0FDVixVQURVLEVBRVYsUUFGVSxFQUdWLFVBSFUsRUFJVixRQUpVLEVBS1YsV0FMVSxFQU1WLENBQ0MsUUFERCxFQUVDLFVBRkQsRUFHQyxRQUhELEVBSUMsV0FKRCxDQU5VLENBQVg7O0FBY0EsS0FBSyxPQUFMLENBQWEsVUFBUyxHQUFULEVBQWM7QUFDMUIsS0FBSSxNQUFNLE9BQU4sQ0FBYyxHQUFkLENBQUosRUFBd0I7QUFDdkIsUUFBTSxJQUFJLElBQUosQ0FBUyxHQUFULENBQU47QUFDQTtBQUNELEtBQUksWUFBWSxTQUFTLGdCQUFULENBQTBCLDZCQUE2QixHQUE3QixHQUFtQyxJQUE3RCxDQUFoQjs7QUFFQSxJQUFHLE9BQUgsQ0FBVyxJQUFYLENBQWdCLFNBQWhCLEVBQTJCLFVBQVMsSUFBVCxFQUFlO0FBQ3pDLE9BQUssZ0JBQUwsQ0FBc0IsdUJBQXVCLEdBQTdDLEVBQWtELFlBQVc7QUFDNUQsT0FBSSxTQUFTLEtBQUssU0FBbEI7QUFDQSxPQUFJLE1BQUosRUFBWSxRQUFRLEdBQVIsQ0FBWSxHQUFaLEVBQWlCLFVBQWpCLEVBQTZCLE1BQTdCO0FBQ1osR0FIRDtBQUlBLEVBTEQ7QUFNQSxDQVpEOztBQWNBO0FBQ0EsSUFBSSxVQUFVLEtBQWQsQ0FBb0I7QUFDbkIsT0FBTSxTQURhO0FBRW5CLE1BQUssZ0ZBRmM7QUFHbkIsTUFBSztBQUhjLENBQXBCLEVBSUcsVUFBVSxJQUFWLEVBQWdCO0FBQ2xCLEtBQUksS0FBSyxJQUFJLFVBQVUsS0FBZCxDQUFvQjtBQUMzQixRQUFNLFNBRHFCO0FBRTNCLE9BQUssZ0ZBRnNCO0FBRzNCLE9BQUssaUJBSHNCO0FBSTNCLFlBQVUsNkJBSmlCO0FBSzNCLFlBQVUsU0FBUyxJQUxRO0FBTTNCLGFBQVc7QUFOZ0IsRUFBcEIsQ0FBVDtBQVFBLElBQUcsV0FBSCxDQUFlLElBQWY7QUFDQSxDQWREIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHR5cGUsIGNiKSB7XG5cdGNvbnN0IGlzR0EgPSB0eXBlID09PSAnZXZlbnQnIHx8IHR5cGUgPT09ICdzb2NpYWwnO1xuXHRjb25zdCBpc1RhZ01hbmFnZXIgPSB0eXBlID09PSAndGFnTWFuYWdlcic7XG5cblx0aWYgKGlzR0EpIGNoZWNrSWZBbmFseXRpY3NMb2FkZWQodHlwZSwgY2IpO1xuXHRpZiAoaXNUYWdNYW5hZ2VyKSBzZXRUYWdNYW5hZ2VyKGNiKTtcbn07XG5cbmZ1bmN0aW9uIGNoZWNrSWZBbmFseXRpY3NMb2FkZWQodHlwZSwgY2IpIHtcblx0aWYgKHdpbmRvdy5nYSkge1xuXHRcdCAgaWYgKGNiKSBjYigpO1xuXHRcdCAgLy8gYmluZCB0byBzaGFyZWQgZXZlbnQgb24gZWFjaCBpbmRpdmlkdWFsIG5vZGVcblx0XHQgIGxpc3RlbihmdW5jdGlvbiAoZSkge1xuXHRcdFx0Y29uc3QgcGxhdGZvcm0gPSBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZScpO1xuXHRcdFx0Y29uc3QgdGFyZ2V0ID0gZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtbGluaycpIHx8XG5cdFx0XHRcdGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXVybCcpIHx8XG5cdFx0XHRcdGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXVzZXJuYW1lJykgfHxcblx0XHRcdCAgICBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jZW50ZXInKSB8fFxuXHRcdFx0XHRlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1zZWFyY2gnKSB8fFxuXHRcdFx0XHRlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1ib2R5Jyk7XG5cblx0XHRcdGlmICh0eXBlID09PSAnZXZlbnQnKSB7XG5cdFx0XHRcdGdhKCdzZW5kJywgJ2V2ZW50Jywge1xuXHRcdFx0XHRcdGV2ZW50Q2F0ZWdvcnk6ICdPcGVuU2hhcmUgQ2xpY2snLFxuXHRcdFx0XHRcdGV2ZW50QWN0aW9uOiBwbGF0Zm9ybSxcblx0XHRcdFx0XHRldmVudExhYmVsOiB0YXJnZXQsXG5cdFx0XHRcdFx0dHJhbnNwb3J0OiAnYmVhY29uJ1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHR5cGUgPT09ICdzb2NpYWwnKSB7XG5cdFx0XHRcdGdhKCdzZW5kJywge1xuXHRcdFx0XHRcdGhpdFR5cGU6ICdzb2NpYWwnLFxuXHRcdFx0XHRcdHNvY2lhbE5ldHdvcms6IHBsYXRmb3JtLFxuXHRcdFx0XHRcdHNvY2lhbEFjdGlvbjogJ3NoYXJlJyxcblx0XHRcdFx0XHRzb2NpYWxUYXJnZXQ6IHRhcmdldFxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHR9XG5cdGVsc2Uge1xuXHRcdHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXHRcdFx0Y2hlY2tJZkFuYWx5dGljc0xvYWRlZCh0eXBlLCBjYik7XG5cdCAgXHR9LCAxMDAwKTtcblx0fVxufVxuXG5mdW5jdGlvbiBzZXRUYWdNYW5hZ2VyIChjYikge1xuXG5cdGlmICh3aW5kb3cuZGF0YUxheWVyICYmIHdpbmRvdy5kYXRhTGF5ZXJbMF1bJ2d0bS5zdGFydCddKSB7XG5cdFx0aWYgKGNiKSBjYigpO1xuXG5cdFx0bGlzdGVuKG9uU2hhcmVUYWdNYW5nZXIpO1xuXG5cdFx0Z2V0Q291bnRzKGZ1bmN0aW9uKGUpIHtcblx0XHRcdGNvbnN0IGNvdW50ID0gZS50YXJnZXQgP1xuXHRcdFx0ICBlLnRhcmdldC5pbm5lckhUTUwgOlxuXHRcdFx0ICBlLmlubmVySFRNTDtcblxuXHRcdFx0Y29uc3QgcGxhdGZvcm0gPSBlLnRhcmdldCA/XG5cdFx0XHQgICBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudC11cmwnKSA6XG5cdFx0XHQgICBlLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50LXVybCcpO1xuXG5cdFx0XHR3aW5kb3cuZGF0YUxheWVyLnB1c2goe1xuXHRcdFx0XHQnZXZlbnQnIDogJ09wZW5TaGFyZSBDb3VudCcsXG5cdFx0XHRcdCdwbGF0Zm9ybSc6IHBsYXRmb3JtLFxuXHRcdFx0XHQncmVzb3VyY2UnOiBjb3VudCxcblx0XHRcdFx0J2FjdGl2aXR5JzogJ2NvdW50J1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH0gZWxzZSB7XG5cdFx0c2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG5cdFx0XHRzZXRUYWdNYW5hZ2VyKGNiKTtcblx0XHR9LCAxMDAwKTtcblx0fVxufVxuXG5mdW5jdGlvbiBsaXN0ZW4gKGNiKSB7XG5cdC8vIGJpbmQgdG8gc2hhcmVkIGV2ZW50IG9uIGVhY2ggaW5kaXZpZHVhbCBub2RlXG5cdFtdLmZvckVhY2guY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1vcGVuLXNoYXJlXScpLCBmdW5jdGlvbihub2RlKSB7XG5cdFx0bm9kZS5hZGRFdmVudExpc3RlbmVyKCdPcGVuU2hhcmUuc2hhcmVkJywgY2IpO1xuXHR9KTtcbn1cblxuZnVuY3Rpb24gZ2V0Q291bnRzIChjYikge1xuXHR2YXIgY291bnROb2RlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtb3Blbi1zaGFyZS1jb3VudF0nKTtcblxuXHRbXS5mb3JFYWNoLmNhbGwoY291bnROb2RlLCBmdW5jdGlvbihub2RlKSB7XG5cdFx0aWYgKG5vZGUudGV4dENvbnRlbnQpIGNiKG5vZGUpO1xuXHRcdGVsc2Ugbm9kZS5hZGRFdmVudExpc3RlbmVyKCdPcGVuU2hhcmUuY291bnRlZC0nICsgbm9kZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudC11cmwnKSwgY2IpO1xuXHR9KTtcbn1cblxuZnVuY3Rpb24gb25TaGFyZVRhZ01hbmdlciAoZSkge1xuXHRjb25zdCBwbGF0Zm9ybSA9IGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlJyk7XG5cdGNvbnN0IHRhcmdldCA9IGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWxpbmsnKSB8fFxuXHRcdGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXVybCcpIHx8XG5cdFx0ZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdXNlcm5hbWUnKSB8fFxuXHRcdGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNlbnRlcicpIHx8XG5cdFx0ZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtc2VhcmNoJykgfHxcblx0XHRlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1ib2R5Jyk7XG5cblx0d2luZG93LmRhdGFMYXllci5wdXNoKHtcblx0XHQnZXZlbnQnIDogJ09wZW5TaGFyZSBTaGFyZScsXG5cdFx0J3BsYXRmb3JtJzogcGxhdGZvcm0sXG5cdFx0J3Jlc291cmNlJzogdGFyZ2V0LFxuXHRcdCdhY3Rpdml0eSc6ICdzaGFyZSdcblx0fSk7XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHtcblx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIHJlcXVpcmUoJy4vbGliL2luaXQnKSh7XG5cdFx0YXBpOiAnY291bnQnLFxuXHRcdHNlbGVjdG9yOiAnW2RhdGEtb3Blbi1zaGFyZS1jb3VudF06bm90KFtkYXRhLW9wZW4tc2hhcmUtbm9kZV0pJyxcblx0XHRjYjogcmVxdWlyZSgnLi9saWIvaW5pdGlhbGl6ZUNvdW50Tm9kZScpXG5cdH0pKTtcblxuXHRyZXR1cm4gcmVxdWlyZSgnLi9zcmMvbW9kdWxlcy9jb3VudC1hcGknKSgpO1xufSkoKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gY291bnRSZWR1Y2U7XG5cbmZ1bmN0aW9uIHJvdW5kKHgsIHByZWNpc2lvbikge1xuXHRpZiAodHlwZW9mIHggIT09ICdudW1iZXInKSB7XG5cdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgdmFsdWUgdG8gYmUgYSBudW1iZXInKTtcblx0fVxuXG5cdHZhciBleHBvbmVudCA9IHByZWNpc2lvbiA+IDAgPyAnZScgOiAnZS0nO1xuXHR2YXIgZXhwb25lbnROZWcgPSBwcmVjaXNpb24gPiAwID8gJ2UtJyA6ICdlJztcblx0cHJlY2lzaW9uID0gTWF0aC5hYnMocHJlY2lzaW9uKTtcblxuXHRyZXR1cm4gTnVtYmVyKE1hdGgucm91bmQoeCArIGV4cG9uZW50ICsgcHJlY2lzaW9uKSArIGV4cG9uZW50TmVnICsgcHJlY2lzaW9uKTtcbn1cblxuZnVuY3Rpb24gdGhvdXNhbmRpZnkgKG51bSkge1xuXHRyZXR1cm4gcm91bmQobnVtLzEwMDAsIDEpICsgJ0snO1xufVxuXG5mdW5jdGlvbiBtaWxsaW9uaWZ5IChudW0pIHtcblx0cmV0dXJuIHJvdW5kKG51bS8xMDAwMDAwLCAxKSArICdNJztcbn1cblxuZnVuY3Rpb24gY291bnRSZWR1Y2UgKGVsLCBjb3VudCwgY2IpIHtcblx0aWYgKGNvdW50ID4gOTk5OTk5KSAge1xuXHRcdGVsLmlubmVySFRNTCA9IG1pbGxpb25pZnkoY291bnQpO1xuXHRcdGlmIChjYiAgJiYgdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSBjYihlbCk7XG5cdH0gZWxzZSBpZiAoY291bnQgPiA5OTkpIHtcblx0XHRlbC5pbm5lckhUTUwgPSB0aG91c2FuZGlmeShjb3VudCk7XG5cdFx0aWYgKGNiICAmJiB0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpIGNiKGVsKTtcblx0fSBlbHNlIHtcblx0XHRlbC5pbm5lckhUTUwgPSBjb3VudDtcblx0XHRpZiAoY2IgICYmIHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykgY2IoZWwpO1xuXHR9XG59XG4iLCIvLyB0eXBlIGNvbnRhaW5zIGEgZGFzaFxuLy8gdHJhbnNmb3JtIHRvIGNhbWVsY2FzZSBmb3IgZnVuY3Rpb24gcmVmZXJlbmNlXG4vLyBUT0RPOiBvbmx5IHN1cHBvcnRzIHNpbmdsZSBkYXNoLCBzaG91bGQgc2hvdWxkIHN1cHBvcnQgbXVsdGlwbGVcbm1vZHVsZS5leHBvcnRzID0gKGRhc2gsIHR5cGUpID0+IHtcblx0bGV0IG5leHRDaGFyID0gdHlwZS5zdWJzdHIoZGFzaCArIDEsIDEpLFxuXHRcdGdyb3VwID0gdHlwZS5zdWJzdHIoZGFzaCwgMik7XG5cblx0dHlwZSA9IHR5cGUucmVwbGFjZShncm91cCwgbmV4dENoYXIudG9VcHBlckNhc2UoKSk7XG5cdHJldHVybiB0eXBlO1xufTtcbiIsImNvbnN0IGluaXRpYWxpemVOb2RlcyA9IHJlcXVpcmUoJy4vaW5pdGlhbGl6ZU5vZGVzJyk7XG5jb25zdCBpbml0aWFsaXplV2F0Y2hlciA9IHJlcXVpcmUoJy4vaW5pdGlhbGl6ZVdhdGNoZXInKTtcblxubW9kdWxlLmV4cG9ydHMgPSBpbml0O1xuXG5mdW5jdGlvbiBpbml0KG9wdHMpIHtcblx0cmV0dXJuICgpID0+IHtcblx0XHRjb25zdCBpbml0Tm9kZXMgPSBpbml0aWFsaXplTm9kZXMoe1xuXHRcdFx0YXBpOiBvcHRzLmFwaSB8fCBudWxsLFxuXHRcdFx0Y29udGFpbmVyOiBvcHRzLmNvbnRhaW5lciB8fCBkb2N1bWVudCxcblx0XHRcdHNlbGVjdG9yOiBvcHRzLnNlbGVjdG9yLFxuXHRcdFx0Y2I6IG9wdHMuY2Jcblx0XHR9KTtcblxuXHRcdGluaXROb2RlcygpO1xuXG5cdFx0Ly8gY2hlY2sgZm9yIG11dGF0aW9uIG9ic2VydmVycyBiZWZvcmUgdXNpbmcsIElFMTEgb25seVxuXHRcdGlmICh3aW5kb3cuTXV0YXRpb25PYnNlcnZlciAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRpbml0aWFsaXplV2F0Y2hlcihkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1vcGVuLXNoYXJlLXdhdGNoXScpLCBpbml0Tm9kZXMpO1xuXHRcdH1cblx0fTtcbn1cbiIsImNvbnN0IENvdW50ID0gcmVxdWlyZSgnLi4vc3JjL21vZHVsZXMvY291bnQnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBpbml0aWFsaXplQ291bnROb2RlO1xuXG5mdW5jdGlvbiBpbml0aWFsaXplQ291bnROb2RlKG9zKSB7XG5cdC8vIGluaXRpYWxpemUgb3BlbiBzaGFyZSBvYmplY3Qgd2l0aCB0eXBlIGF0dHJpYnV0ZVxuXHRsZXQgdHlwZSA9IG9zLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50JyksXG5cdFx0dXJsID0gb3MuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY291bnQtcmVwbycpIHx8XG5cdFx0XHRvcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudC1zaG90JykgfHxcblx0XHRcdG9zLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50LXVybCcpLFxuXHRcdGNvdW50ID0gbmV3IENvdW50KHR5cGUsIHVybCk7XG5cblx0Y291bnQuY291bnQob3MpO1xuXHRvcy5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1ub2RlJywgdHlwZSk7XG59XG4iLCJjb25zdCBFdmVudHMgPSByZXF1aXJlKCcuLi9zcmMvbW9kdWxlcy9ldmVudHMnKTtcbmNvbnN0IGFuYWx5dGljcyA9IHJlcXVpcmUoJy4uL2FuYWx5dGljcycpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gaW5pdGlhbGl6ZU5vZGVzO1xuXG5mdW5jdGlvbiBpbml0aWFsaXplTm9kZXMob3B0cykge1xuXHQvLyBsb29wIHRocm91Z2ggb3BlbiBzaGFyZSBub2RlIGNvbGxlY3Rpb25cblx0cmV0dXJuICgpID0+IHtcblx0XHQvLyBjaGVjayBmb3IgYW5hbHl0aWNzXG5cdFx0Y2hlY2tBbmFseXRpY3MoKTtcblxuXHRcdGlmIChvcHRzLmFwaSkge1xuXHRcdFx0bGV0IG5vZGVzID0gb3B0cy5jb250YWluZXIucXVlcnlTZWxlY3RvckFsbChvcHRzLnNlbGVjdG9yKTtcblx0XHRcdFtdLmZvckVhY2guY2FsbChub2Rlcywgb3B0cy5jYik7XG5cblx0XHRcdC8vIHRyaWdnZXIgY29tcGxldGVkIGV2ZW50XG5cdFx0XHRFdmVudHMudHJpZ2dlcihkb2N1bWVudCwgb3B0cy5hcGkgKyAnLWxvYWRlZCcpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBsb29wIHRocm91Z2ggb3BlbiBzaGFyZSBub2RlIGNvbGxlY3Rpb25cblx0XHRcdGxldCBzaGFyZU5vZGVzID0gb3B0cy5jb250YWluZXIucXVlcnlTZWxlY3RvckFsbChvcHRzLnNlbGVjdG9yLnNoYXJlKTtcblx0XHRcdFtdLmZvckVhY2guY2FsbChzaGFyZU5vZGVzLCBvcHRzLmNiLnNoYXJlKTtcblxuXHRcdFx0Ly8gdHJpZ2dlciBjb21wbGV0ZWQgZXZlbnRcblx0XHRcdEV2ZW50cy50cmlnZ2VyKGRvY3VtZW50LCAnc2hhcmUtbG9hZGVkJyk7XG5cblx0XHRcdC8vIGxvb3AgdGhyb3VnaCBjb3VudCBub2RlIGNvbGxlY3Rpb25cblx0XHRcdGxldCBjb3VudE5vZGVzID0gb3B0cy5jb250YWluZXIucXVlcnlTZWxlY3RvckFsbChvcHRzLnNlbGVjdG9yLmNvdW50KTtcblx0XHRcdFtdLmZvckVhY2guY2FsbChjb3VudE5vZGVzLCBvcHRzLmNiLmNvdW50KTtcblxuXHRcdFx0Ly8gdHJpZ2dlciBjb21wbGV0ZWQgZXZlbnRcblx0XHRcdEV2ZW50cy50cmlnZ2VyKGRvY3VtZW50LCAnY291bnQtbG9hZGVkJyk7XG5cdFx0fVxuXHR9O1xufVxuXG5mdW5jdGlvbiBjaGVja0FuYWx5dGljcyAoKSB7XG5cdC8vIGNoZWNrIGZvciBhbmFseXRpY3Ncblx0aWYgKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLW9wZW4tc2hhcmUtYW5hbHl0aWNzXScpKSB7XG5cdFx0Y29uc3QgcHJvdmlkZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbZGF0YS1vcGVuLXNoYXJlLWFuYWx5dGljc10nKVxuXHRcdFx0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWFuYWx5dGljcycpO1xuXG5cdFx0aWYgKHByb3ZpZGVyLmluZGV4T2YoJywnKSA+IC0xKSB7XG5cdFx0XHRjb25zdCBwcm92aWRlcnMgPSBwcm92aWRlci5zcGxpdCgnLCcpO1xuXHRcdFx0cHJvdmlkZXJzLmZvckVhY2gocCA9PiBhbmFseXRpY3MocCkpO1xuXHRcdH0gZWxzZSBhbmFseXRpY3MocHJvdmlkZXIpO1xuXG5cdH1cbn1cbiIsImNvbnN0IFNoYXJlVHJhbnNmb3JtcyA9IHJlcXVpcmUoJy4uL3NyYy9tb2R1bGVzL3NoYXJlLXRyYW5zZm9ybXMnKTtcbmNvbnN0IE9wZW5TaGFyZSA9IHJlcXVpcmUoJy4uL3NyYy9tb2R1bGVzL29wZW4tc2hhcmUnKTtcbmNvbnN0IHNldERhdGEgPSByZXF1aXJlKCcuL3NldERhdGEnKTtcbmNvbnN0IHNoYXJlID0gcmVxdWlyZSgnLi9zaGFyZScpO1xuY29uc3QgZGFzaFRvQ2FtZWwgPSByZXF1aXJlKCcuL2Rhc2hUb0NhbWVsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gaW5pdGlhbGl6ZVNoYXJlTm9kZTtcblxuZnVuY3Rpb24gaW5pdGlhbGl6ZVNoYXJlTm9kZShvcykge1xuXHQvLyBpbml0aWFsaXplIG9wZW4gc2hhcmUgb2JqZWN0IHdpdGggdHlwZSBhdHRyaWJ1dGVcblx0bGV0IHR5cGUgPSBvcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZScpLFxuXHRcdGRhc2ggPSB0eXBlLmluZGV4T2YoJy0nKSxcblx0XHRvcGVuU2hhcmU7XG5cblx0aWYgKGRhc2ggPiAtMSkge1xuXHRcdHR5cGUgPSBkYXNoVG9DYW1lbChkYXNoLCB0eXBlKTtcblx0fVxuXG5cdGxldCB0cmFuc2Zvcm0gPSBTaGFyZVRyYW5zZm9ybXNbdHlwZV07XG5cblx0aWYgKCF0cmFuc2Zvcm0pIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoYE9wZW4gU2hhcmU6ICR7dHlwZX0gaXMgYW4gaW52YWxpZCB0eXBlYCk7XG5cdH1cblxuXHRvcGVuU2hhcmUgPSBuZXcgT3BlblNoYXJlKHR5cGUsIHRyYW5zZm9ybSk7XG5cblx0Ly8gc3BlY2lmeSBpZiB0aGlzIGlzIGEgZHluYW1pYyBpbnN0YW5jZVxuXHRpZiAob3MuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtZHluYW1pYycpKSB7XG5cdFx0b3BlblNoYXJlLmR5bmFtaWMgPSB0cnVlO1xuXHR9XG5cblx0Ly8gc3BlY2lmeSBpZiB0aGlzIGlzIGEgcG9wdXAgaW5zdGFuY2Vcblx0aWYgKG9zLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXBvcHVwJykpIHtcblx0XHRvcGVuU2hhcmUucG9wdXAgPSB0cnVlO1xuXHR9XG5cblx0Ly8gc2V0IGFsbCBvcHRpb25hbCBhdHRyaWJ1dGVzIG9uIG9wZW4gc2hhcmUgaW5zdGFuY2Vcblx0c2V0RGF0YShvcGVuU2hhcmUsIG9zKTtcblxuXHQvLyBvcGVuIHNoYXJlIGRpYWxvZyBvbiBjbGlja1xuXHRvcy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XG5cdFx0c2hhcmUoZSwgb3MsIG9wZW5TaGFyZSk7XG5cdH0pO1xuXG5cdG9zLmFkZEV2ZW50TGlzdGVuZXIoJ09wZW5TaGFyZS50cmlnZ2VyJywgKGUpID0+IHtcblx0XHRzaGFyZShlLCBvcywgb3BlblNoYXJlKTtcblx0fSk7XG5cblx0b3Muc2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtbm9kZScsIHR5cGUpO1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBpbml0aWFsaXplV2F0Y2hlcjtcblxuZnVuY3Rpb24gaW5pdGlhbGl6ZVdhdGNoZXIod2F0Y2hlciwgZm4pIHtcblx0W10uZm9yRWFjaC5jYWxsKHdhdGNoZXIsICh3KSA9PiB7XG5cdFx0dmFyIG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoKG11dGF0aW9ucykgPT4ge1xuXHRcdFx0Ly8gdGFyZ2V0IHdpbGwgbWF0Y2ggYmV0d2VlbiBhbGwgbXV0YXRpb25zIHNvIGp1c3QgdXNlIGZpcnN0XG5cdFx0XHRmbihtdXRhdGlvbnNbMF0udGFyZ2V0KTtcblx0XHR9KTtcblxuXHRcdG9ic2VydmVyLm9ic2VydmUodywge1xuXHRcdFx0Y2hpbGRMaXN0OiB0cnVlXG5cdFx0fSk7XG5cdH0pO1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBzZXREYXRhO1xuXG5mdW5jdGlvbiBzZXREYXRhKG9zSW5zdGFuY2UsIG9zRWxlbWVudCkge1xuXHRvc0luc3RhbmNlLnNldERhdGEoe1xuXHRcdHVybDogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXVybCcpLFxuXHRcdHRleHQ6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS10ZXh0JyksXG5cdFx0dmlhOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdmlhJyksXG5cdFx0aGFzaHRhZ3M6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1oYXNodGFncycpLFxuXHRcdHR3ZWV0SWQ6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS10d2VldC1pZCcpLFxuXHRcdHJlbGF0ZWQ6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1yZWxhdGVkJyksXG5cdFx0c2NyZWVuTmFtZTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXNjcmVlbi1uYW1lJyksXG5cdFx0dXNlcklkOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdXNlci1pZCcpLFxuXHRcdGxpbms6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1saW5rJyksXG5cdFx0cGljdHVyZTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXBpY3R1cmUnKSxcblx0XHRjYXB0aW9uOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY2FwdGlvbicpLFxuXHRcdGRlc2NyaXB0aW9uOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtZGVzY3JpcHRpb24nKSxcblx0XHR1c2VyOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdXNlcicpLFxuXHRcdHZpZGVvOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdmlkZW8nKSxcblx0XHR1c2VybmFtZTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXVzZXJuYW1lJyksXG5cdFx0dGl0bGU6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS10aXRsZScpLFxuXHRcdG1lZGlhOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtbWVkaWEnKSxcblx0XHR0bzogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXRvJyksXG5cdFx0c3ViamVjdDogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXN1YmplY3QnKSxcblx0XHRib2R5OiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtYm9keScpLFxuXHRcdGlvczogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWlvcycpLFxuXHRcdHR5cGU6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS10eXBlJyksXG5cdFx0Y2VudGVyOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY2VudGVyJyksXG5cdFx0dmlld3M6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS12aWV3cycpLFxuXHRcdHpvb206IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS16b29tJyksXG5cdFx0c2VhcmNoOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtc2VhcmNoJyksXG5cdFx0c2FkZHI6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1zYWRkcicpLFxuXHRcdGRhZGRyOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtZGFkZHInKSxcblx0XHRkaXJlY3Rpb25zbW9kZTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWRpcmVjdGlvbnMtbW9kZScpLFxuXHRcdHJlcG86IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1yZXBvJyksXG5cdFx0c2hvdDogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXNob3QnKSxcblx0XHRwZW46IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1wZW4nKSxcblx0XHR2aWV3OiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdmlldycpLFxuXHRcdGlzc3VlOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtaXNzdWUnKSxcblx0XHRidXR0b25JZDogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWJ1dHRvbklkJyksXG5cdFx0cG9wVXA6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1wb3B1cCcpLFxuXHRcdGtleTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1rZXknKVxuXHR9KTtcbn1cbiIsImNvbnN0IEV2ZW50cyA9IHJlcXVpcmUoJy4uL3NyYy9tb2R1bGVzL2V2ZW50cycpO1xuY29uc3Qgc2V0RGF0YSA9IHJlcXVpcmUoJy4vc2V0RGF0YScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNoYXJlO1xuXG5mdW5jdGlvbiBzaGFyZShlLCBvcywgb3BlblNoYXJlKSB7XG5cdC8vIGlmIGR5bmFtaWMgaW5zdGFuY2UgdGhlbiBmZXRjaCBhdHRyaWJ1dGVzIGFnYWluIGluIGNhc2Ugb2YgdXBkYXRlc1xuXHRpZiAob3BlblNoYXJlLmR5bmFtaWMpIHtcblx0XHRzZXREYXRhKG9wZW5TaGFyZSwgb3MpO1xuXHR9XG5cblx0b3BlblNoYXJlLnNoYXJlKGUpO1xuXG5cdC8vIHRyaWdnZXIgc2hhcmVkIGV2ZW50XG5cdEV2ZW50cy50cmlnZ2VyKG9zLCAnc2hhcmVkJyk7XG59XG4iLCIvKlxuICAgU29tZXRpbWVzIHNvY2lhbCBwbGF0Zm9ybXMgZ2V0IGNvbmZ1c2VkIGFuZCBkcm9wIHNoYXJlIGNvdW50cy5cbiAgIEluIHRoaXMgbW9kdWxlIHdlIGNoZWNrIGlmIHRoZSByZXR1cm5lZCBjb3VudCBpcyBsZXNzIHRoYW4gdGhlIGNvdW50IGluXG4gICBsb2NhbHN0b3JhZ2UuXG4gICBJZiB0aGUgbG9jYWwgY291bnQgaXMgZ3JlYXRlciB0aGFuIHRoZSByZXR1cm5lZCBjb3VudCxcbiAgIHdlIHN0b3JlIHRoZSBsb2NhbCBjb3VudCArIHRoZSByZXR1cm5lZCBjb3VudC5cbiAgIE90aGVyd2lzZSwgc3RvcmUgdGhlIHJldHVybmVkIGNvdW50LlxuKi9cblxubW9kdWxlLmV4cG9ydHMgPSAodCwgY291bnQpID0+IHtcblx0Y29uc3QgaXNBcnIgPSB0LnR5cGUuaW5kZXhPZignLCcpID4gLTE7XG5cdGNvbnN0IGxvY2FsID0gTnVtYmVyKHQuc3RvcmVHZXQodC50eXBlICsgJy0nICsgdC5zaGFyZWQpKTtcblxuXHRpZiAobG9jYWwgPiBjb3VudCAmJiAhaXNBcnIpIHtcblx0XHRjb25zdCBsYXRlc3RDb3VudCA9IE51bWJlcih0LnN0b3JlR2V0KHQudHlwZSArICctJyArIHQuc2hhcmVkICsgJy1sYXRlc3RDb3VudCcpKTtcblx0XHR0LnN0b3JlU2V0KHQudHlwZSArICctJyArIHQuc2hhcmVkICsgJy1sYXRlc3RDb3VudCcsIGNvdW50KTtcblxuXHRcdGNvdW50ID0gaXNOdW1lcmljKGxhdGVzdENvdW50KSAmJiBsYXRlc3RDb3VudCA+IDAgP1xuXHRcdFx0Y291bnQgKz0gbG9jYWwgLSBsYXRlc3RDb3VudCA6XG5cdFx0XHRjb3VudCArPSBsb2NhbDtcblxuXHR9XG5cblx0aWYgKCFpc0FycikgdC5zdG9yZVNldCh0LnR5cGUgKyAnLScgKyB0LnNoYXJlZCwgY291bnQpO1xuXHRyZXR1cm4gY291bnQ7XG59O1xuXG5mdW5jdGlvbiBpc051bWVyaWMobikge1xuICByZXR1cm4gIWlzTmFOKHBhcnNlRmxvYXQobikpICYmIGlzRmluaXRlKG4pO1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7XG5cdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCByZXF1aXJlKCcuL2xpYi9pbml0Jykoe1xuXHRcdGFwaTogJ3NoYXJlJyxcblx0XHRzZWxlY3RvcjogJ1tkYXRhLW9wZW4tc2hhcmVdOm5vdChbZGF0YS1vcGVuLXNoYXJlLW5vZGVdKScsXG5cdFx0Y2I6IHJlcXVpcmUoJy4vbGliL2luaXRpYWxpemVTaGFyZU5vZGUnKVxuXHR9KSk7XG5cblx0cmV0dXJuIHJlcXVpcmUoJy4vc3JjL21vZHVsZXMvc2hhcmUtYXBpJykoKTtcbn0pKCk7XG4iLCIvKipcbiAqIGNvdW50IEFQSVxuICovXG5cbnZhciBjb3VudCA9IHJlcXVpcmUoJy4vY291bnQnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcblxuXHQvLyBnbG9iYWwgT3BlblNoYXJlIHJlZmVyZW5jaW5nIGludGVybmFsIGNsYXNzIGZvciBpbnN0YW5jZSBnZW5lcmF0aW9uXG5cdGNsYXNzIENvdW50IHtcblxuXHRcdGNvbnN0cnVjdG9yKHtcblx0XHRcdHR5cGUsXG5cdFx0XHR1cmwsXG5cdFx0XHRhcHBlbmRUbyA9IGZhbHNlLFxuXHRcdFx0ZWxlbWVudCxcblx0XHRcdGNsYXNzZXMsXG5cdFx0XHRrZXkgPSBudWxsXG5cdFx0fSwgY2IpIHtcblx0XHRcdHZhciBjb3VudE5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGVsZW1lbnQgfHwgJ3NwYW4nKTtcblxuXHRcdFx0Y291bnROb2RlLnNldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50JywgdHlwZSk7XG5cdFx0XHRjb3VudE5vZGUuc2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY291bnQtdXJsJywgdXJsKTtcblx0XHRcdGlmIChrZXkpIGNvdW50Tm9kZS5zZXRBdHRyaWJ1dGUoJ2RhdGEta2V5Jywga2V5KTtcblx0XHRcdFxuXHRcdFx0Y291bnROb2RlLmNsYXNzTGlzdC5hZGQoJ29wZW4tc2hhcmUtY291bnQnKTtcblxuXHRcdFx0aWYgKGNsYXNzZXMgJiYgQXJyYXkuaXNBcnJheShjbGFzc2VzKSkge1xuXHRcdFx0XHRjbGFzc2VzLmZvckVhY2goY3NzQ0xhc3MgPT4ge1xuXHRcdFx0XHRcdGNvdW50Tm9kZS5jbGFzc0xpc3QuYWRkKGNzc0NMYXNzKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChhcHBlbmRUbykge1xuXHRcdFx0XHRyZXR1cm4gbmV3IGNvdW50KHR5cGUsIHVybCkuY291bnQoY291bnROb2RlLCBjYiwgYXBwZW5kVG8pO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gbmV3IGNvdW50KHR5cGUsIHVybCkuY291bnQoY291bnROb2RlLCBjYik7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIENvdW50O1xufTtcbiIsImNvbnN0IGNvdW50UmVkdWNlID0gcmVxdWlyZSgnLi4vLi4vbGliL2NvdW50UmVkdWNlJyk7XG5jb25zdCBzdG9yZUNvdW50ID0gcmVxdWlyZSgnLi4vLi4vbGliL3N0b3JlQ291bnQnKTtcblxuLyoqXG4gKiBPYmplY3Qgb2YgdHJhbnNmb3JtIGZ1bmN0aW9ucyBmb3IgZWFjaCBvcGVuc2hhcmUgYXBpXG4gKiBUcmFuc2Zvcm0gZnVuY3Rpb25zIHBhc3NlZCBpbnRvIE9wZW5TaGFyZSBpbnN0YW5jZSB3aGVuIGluc3RhbnRpYXRlZFxuICogUmV0dXJuIG9iamVjdCBjb250YWluaW5nIFVSTCBhbmQga2V5L3ZhbHVlIGFyZ3NcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSB7XG5cblx0Ly8gZmFjZWJvb2sgY291bnQgZGF0YVxuXHRmYWNlYm9vayAodXJsKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHR5cGU6ICdnZXQnLFxuXHRcdFx0dXJsOiBgaHR0cHM6Ly9ncmFwaC5mYWNlYm9vay5jb20vP2lkPSR7dXJsfWAsXG5cdFx0XHR0cmFuc2Zvcm06IGZ1bmN0aW9uKHhocikge1xuXHRcdFx0XHRsZXQgY291bnQgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpLnNoYXJlcztcblx0XHRcdFx0cmV0dXJuIHN0b3JlQ291bnQodGhpcywgY291bnQpO1xuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gcGludGVyZXN0IGNvdW50IGRhdGFcblx0cGludGVyZXN0ICh1cmwpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogJ2pzb25wJyxcblx0XHRcdHVybDogYGh0dHBzOi8vYXBpLnBpbnRlcmVzdC5jb20vdjEvdXJscy9jb3VudC5qc29uP2NhbGxiYWNrPT8mdXJsPSR7dXJsfWAsXG5cdFx0XHR0cmFuc2Zvcm06IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdFx0bGV0IGNvdW50ID0gZGF0YS5jb3VudDtcblx0XHRcdFx0cmV0dXJuIHN0b3JlQ291bnQodGhpcywgY291bnQpO1xuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gbGlua2VkaW4gY291bnQgZGF0YVxuXHRsaW5rZWRpbiAodXJsKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHR5cGU6ICdqc29ucCcsXG5cdFx0XHR1cmw6IGBodHRwczovL3d3dy5saW5rZWRpbi5jb20vY291bnRzZXJ2L2NvdW50L3NoYXJlP3VybD0ke3VybH0mZm9ybWF0PWpzb25wJmNhbGxiYWNrPT9gLFxuXHRcdFx0dHJhbnNmb3JtOiBmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHRcdGxldCBjb3VudCA9IGRhdGEuY291bnQ7XG5cdFx0XHRcdHJldHVybiBzdG9yZUNvdW50KHRoaXMsIGNvdW50KTtcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIHJlZGRpdCBjb3VudCBkYXRhXG5cdHJlZGRpdCAodXJsKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHR5cGU6ICdnZXQnLFxuXHRcdFx0dXJsOiBgaHR0cHM6Ly93d3cucmVkZGl0LmNvbS9hcGkvaW5mby5qc29uP3VybD0ke3VybH1gLFxuXHRcdFx0dHJhbnNmb3JtOiBmdW5jdGlvbih4aHIpIHtcblx0XHRcdFx0bGV0IHBvc3RzID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KS5kYXRhLmNoaWxkcmVuLFxuXHRcdFx0XHRcdHVwcyA9IDA7XG5cblx0XHRcdFx0cG9zdHMuZm9yRWFjaCgocG9zdCkgPT4ge1xuXHRcdFx0XHRcdHVwcyArPSBOdW1iZXIocG9zdC5kYXRhLnVwcyk7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdHJldHVybiBzdG9yZUNvdW50KHRoaXMsIHVwcyk7XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBnb29nbGUgY291bnQgZGF0YVxuXHRnb29nbGUgKHVybCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiAncG9zdCcsXG5cdFx0XHRkYXRhOiB7XG5cdFx0XHRcdG1ldGhvZDogJ3Bvcy5wbHVzb25lcy5nZXQnLFxuXHRcdFx0XHRpZDogJ3AnLFxuXHRcdFx0XHRwYXJhbXM6IHtcblx0XHRcdFx0XHRub2xvZzogdHJ1ZSxcblx0XHRcdFx0XHRpZDogdXJsLFxuXHRcdFx0XHRcdHNvdXJjZTogJ3dpZGdldCcsXG5cdFx0XHRcdFx0dXNlcklkOiAnQHZpZXdlcicsXG5cdFx0XHRcdFx0Z3JvdXBJZDogJ0BzZWxmJ1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRqc29ucnBjOiAnMi4wJyxcblx0XHRcdFx0a2V5OiAncCcsXG5cdFx0XHRcdGFwaVZlcnNpb246ICd2MSdcblx0XHRcdH0sXG5cdFx0XHR1cmw6IGBodHRwczovL2NsaWVudHM2Lmdvb2dsZS5jb20vcnBjYCxcblx0XHRcdHRyYW5zZm9ybTogZnVuY3Rpb24oeGhyKSB7XG5cdFx0XHRcdGxldCBjb3VudCA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCkucmVzdWx0Lm1ldGFkYXRhLmdsb2JhbENvdW50cy5jb3VudDtcblx0XHRcdFx0cmV0dXJuIHN0b3JlQ291bnQodGhpcywgY291bnQpO1xuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gZ2l0aHViIHN0YXIgY291bnRcblx0Z2l0aHViU3RhcnMgKHJlcG8pIHtcblx0XHRyZXBvID0gcmVwby5pbmRleE9mKCdnaXRodWIuY29tLycpID4gLTEgP1xuXHRcdFx0cmVwby5zcGxpdCgnZ2l0aHViLmNvbS8nKVsxXSA6XG5cdFx0XHRyZXBvO1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiAnZ2V0Jyxcblx0XHRcdHVybDogYGh0dHBzOi8vYXBpLmdpdGh1Yi5jb20vcmVwb3MvJHtyZXBvfWAsXG5cdFx0XHR0cmFuc2Zvcm06IGZ1bmN0aW9uKHhocikge1xuXHRcdFx0XHRsZXQgY291bnQgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpLnN0YXJnYXplcnNfY291bnQ7XG5cdFx0XHRcdHJldHVybiBzdG9yZUNvdW50KHRoaXMsIGNvdW50KTtcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIGdpdGh1YiBmb3JrcyBjb3VudFxuXHRnaXRodWJGb3JrcyAocmVwbykge1xuXHRcdHJlcG8gPSByZXBvLmluZGV4T2YoJ2dpdGh1Yi5jb20vJykgPiAtMSA/XG5cdFx0XHRyZXBvLnNwbGl0KCdnaXRodWIuY29tLycpWzFdIDpcblx0XHRcdHJlcG87XG5cdFx0cmV0dXJuIHtcblx0XHRcdHR5cGU6ICdnZXQnLFxuXHRcdFx0dXJsOiBgaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9yZXBvcy8ke3JlcG99YCxcblx0XHRcdHRyYW5zZm9ybTogZnVuY3Rpb24oeGhyKSB7XG5cdFx0XHRcdGxldCBjb3VudCA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCkuZm9ya3NfY291bnQ7XG5cdFx0XHRcdHJldHVybiBzdG9yZUNvdW50KHRoaXMsIGNvdW50KTtcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIGdpdGh1YiB3YXRjaGVycyBjb3VudFxuXHRnaXRodWJXYXRjaGVycyAocmVwbykge1xuXHRcdHJlcG8gPSByZXBvLmluZGV4T2YoJ2dpdGh1Yi5jb20vJykgPiAtMSA/XG5cdFx0XHRyZXBvLnNwbGl0KCdnaXRodWIuY29tLycpWzFdIDpcblx0XHRcdHJlcG87XG5cdFx0cmV0dXJuIHtcblx0XHRcdHR5cGU6ICdnZXQnLFxuXHRcdFx0dXJsOiBgaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9yZXBvcy8ke3JlcG99YCxcblx0XHRcdHRyYW5zZm9ybTogZnVuY3Rpb24oeGhyKSB7XG5cdFx0XHRcdGxldCBjb3VudCA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCkud2F0Y2hlcnNfY291bnQ7XG5cdFx0XHRcdHJldHVybiBzdG9yZUNvdW50KHRoaXMsIGNvdW50KTtcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIGRyaWJiYmxlIGxpa2VzIGNvdW50XG5cdGRyaWJiYmxlIChzaG90KSB7XG5cdFx0c2hvdCA9IHNob3QuaW5kZXhPZignZHJpYmJibGUuY29tL3Nob3RzJykgPiAtMSA/XG5cdFx0XHRzaG90LnNwbGl0KCdzaG90cy8nKVsxXSA6XG5cdFx0XHRzaG90O1xuXHRcdGNvbnN0IHVybCA9IGBodHRwczovL2FwaS5kcmliYmJsZS5jb20vdjEvc2hvdHMvJHtzaG90fS9saWtlc2A7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHR5cGU6ICdnZXQnLFxuXHRcdFx0dXJsOiB1cmwsXG5cdFx0XHR0cmFuc2Zvcm06IGZ1bmN0aW9uKHhociwgRXZlbnRzKSB7XG5cdFx0XHRcdGxldCBjb3VudCA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCkubGVuZ3RoO1xuXG5cdFx0XHRcdC8vIGF0IHRoaXMgdGltZSBkcmliYmJsZSBsaW1pdHMgYSByZXNwb25zZSBvZiAxMiBsaWtlcyBwZXIgcGFnZVxuXHRcdFx0XHRpZiAoY291bnQgPT09IDEyKSB7XG5cdFx0XHRcdFx0bGV0IHBhZ2UgPSAyO1xuXHRcdFx0XHRcdHJlY3Vyc2l2ZUNvdW50KHVybCwgcGFnZSwgY291bnQsIGZpbmFsQ291bnQgPT4ge1xuXHRcdFx0XHRcdFx0aWYgKHRoaXMuYXBwZW5kVG8gJiYgdHlwZW9mIHRoaXMuYXBwZW5kVG8gIT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRcdFx0dGhpcy5hcHBlbmRUby5hcHBlbmRDaGlsZCh0aGlzLm9zKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGNvdW50UmVkdWNlKHRoaXMub3MsIGZpbmFsQ291bnQsIHRoaXMuY2IpO1xuXHRcdFx0XHRcdFx0RXZlbnRzLnRyaWdnZXIodGhpcy5vcywgJ2NvdW50ZWQtJyArIHRoaXMudXJsKTtcblx0XHRcdFx0XHRcdHJldHVybiBzdG9yZUNvdW50KHRoaXMsIGZpbmFsQ291bnQpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiBzdG9yZUNvdW50KHRoaXMsIGNvdW50KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0dHdpdHRlciAodXJsKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHR5cGU6ICdnZXQnLFxuXHRcdFx0dXJsOiBgaHR0cHM6Ly9hcGkub3BlbnNoYXJlLnNvY2lhbC9qb2I/dXJsPSR7dXJsfSZrZXk9YCxcblx0XHRcdHRyYW5zZm9ybTogZnVuY3Rpb24oeGhyKSB7XG5cdFx0XHRcdGxldCBjb3VudCA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCkuY291bnQ7XG5cdFx0XHRcdHJldHVybiBzdG9yZUNvdW50KHRoaXMsIGNvdW50KTtcblx0XHRcdH1cblx0XHR9O1xuXHR9XG59O1xuXG5mdW5jdGlvbiByZWN1cnNpdmVDb3VudCAodXJsLCBwYWdlLCBjb3VudCwgY2IpIHtcblx0Y29uc3QgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cdHhoci5vcGVuKCdHRVQnLCB1cmwgKyAnP3BhZ2U9JyArIHBhZ2UpO1xuXHR4aHIuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcblx0XHRjb25zdCBsaWtlcyA9IEpTT04ucGFyc2UodGhpcy5yZXNwb25zZSk7XG5cdFx0Y291bnQgKz0gbGlrZXMubGVuZ3RoO1xuXG5cdFx0Ly8gZHJpYmJibGUgbGlrZSBwZXIgcGFnZSBpcyAxMlxuXHRcdGlmIChsaWtlcy5sZW5ndGggPT09IDEyKSB7XG5cdFx0XHRwYWdlKys7XG5cdFx0XHRyZWN1cnNpdmVDb3VudCh1cmwsIHBhZ2UsIGNvdW50LCBjYik7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0Y2IoY291bnQpO1xuXHRcdH1cblx0fSk7XG5cdHhoci5zZW5kKCk7XG59XG4iLCIvKipcbiAqIEdlbmVyYXRlIHNoYXJlIGNvdW50IGluc3RhbmNlIGZyb20gb25lIHRvIG1hbnkgbmV0d29ya3NcbiAqL1xuXG5jb25zdCBDb3VudFRyYW5zZm9ybXMgPSByZXF1aXJlKCcuL2NvdW50LXRyYW5zZm9ybXMnKTtcbmNvbnN0IEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG5jb25zdCBjb3VudFJlZHVjZSA9IHJlcXVpcmUoJy4uLy4uL2xpYi9jb3VudFJlZHVjZScpO1xuY29uc3Qgc3RvcmVDb3VudCA9IHJlcXVpcmUoJy4uLy4uL2xpYi9zdG9yZUNvdW50Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgQ291bnQge1xuXG5cdGNvbnN0cnVjdG9yKHR5cGUsIHVybCkge1xuXG5cdFx0Ly8gdGhyb3cgZXJyb3IgaWYgbm8gdXJsIHByb3ZpZGVkXG5cdFx0aWYgKCF1cmwpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihgT3BlbiBTaGFyZTogbm8gdXJsIHByb3ZpZGVkIGZvciBjb3VudGApO1xuXHRcdH1cblxuXHRcdC8vIGNoZWNrIGZvciBHaXRodWIgY291bnRzXG5cdFx0aWYgKHR5cGUuaW5kZXhPZignZ2l0aHViJykgPT09IDApIHtcblx0XHRcdGlmICh0eXBlID09PSAnZ2l0aHViLXN0YXJzJykge1xuXHRcdFx0XHR0eXBlID0gJ2dpdGh1YlN0YXJzJztcblx0XHRcdH0gZWxzZSBpZiAodHlwZSA9PT0gJ2dpdGh1Yi1mb3JrcycpIHtcblx0XHRcdFx0dHlwZSA9ICdnaXRodWJGb3Jrcyc7XG5cdFx0XHR9IGVsc2UgaWYgKHR5cGUgPT09ICdnaXRodWItd2F0Y2hlcnMnKSB7XG5cdFx0XHRcdHR5cGUgPSAnZ2l0aHViV2F0Y2hlcnMnO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y29uc29sZS5lcnJvcignSW52YWxpZCBHaXRodWIgY291bnQgdHlwZS4gVHJ5IGdpdGh1Yi1zdGFycywgZ2l0aHViLWZvcmtzLCBvciBnaXRodWItd2F0Y2hlcnMuJyk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gaWYgdHlwZSBpcyBjb21tYSBzZXBhcmF0ZSBsaXN0IGNyZWF0ZSBhcnJheVxuXHRcdGlmICh0eXBlLmluZGV4T2YoJywnKSA+IC0xKSB7XG5cdFx0XHR0aGlzLnR5cGUgPSB0eXBlO1xuXHRcdFx0dGhpcy50eXBlQXJyID0gdGhpcy50eXBlLnNwbGl0KCcsJyk7XG5cdFx0XHR0aGlzLmNvdW50RGF0YSA9IFtdO1xuXG5cdFx0XHQvLyBjaGVjayBlYWNoIHR5cGUgc3VwcGxpZWQgaXMgdmFsaWRcblx0XHRcdHRoaXMudHlwZUFyci5mb3JFYWNoKCh0KSA9PiB7XG5cdFx0XHRcdGlmICghQ291bnRUcmFuc2Zvcm1zW3RdKSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGBPcGVuIFNoYXJlOiAke3R5cGV9IGlzIGFuIGludmFsaWQgY291bnQgdHlwZWApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dGhpcy5jb3VudERhdGEucHVzaChDb3VudFRyYW5zZm9ybXNbdF0odXJsKSk7XG5cdFx0XHR9KTtcblxuXHRcdC8vIHRocm93IGVycm9yIGlmIGludmFsaWQgdHlwZSBwcm92aWRlZFxuXHRcdH0gZWxzZSBpZiAoIUNvdW50VHJhbnNmb3Jtc1t0eXBlXSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBPcGVuIFNoYXJlOiAke3R5cGV9IGlzIGFuIGludmFsaWQgY291bnQgdHlwZWApO1xuXG5cdFx0Ly8gc2luZ2xlIGNvdW50XG5cdFx0Ly8gc3RvcmUgY291bnQgVVJMIGFuZCB0cmFuc2Zvcm0gZnVuY3Rpb25cblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy50eXBlID0gdHlwZTtcblx0XHRcdHRoaXMuY291bnREYXRhID0gQ291bnRUcmFuc2Zvcm1zW3R5cGVdKHVybCk7XG5cdFx0fVxuXHR9XG5cblx0Ly8gaGFuZGxlIGNhbGxpbmcgZ2V0Q291bnQgLyBnZXRDb3VudHNcblx0Ly8gZGVwZW5kaW5nIG9uIG51bWJlciBvZiB0eXBlc1xuXHRjb3VudChvcywgY2IsIGFwcGVuZFRvKSB7XG5cdFx0dGhpcy5vcyA9IG9zO1xuXHRcdHRoaXMuYXBwZW5kVG8gPSBhcHBlbmRUbztcblx0XHR0aGlzLmNiID0gY2I7XG4gICAgXHR0aGlzLnVybCA9IHRoaXMub3MuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY291bnQnKTtcblx0XHR0aGlzLnNoYXJlZCA9IHRoaXMub3MuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY291bnQtdXJsJyk7XG5cdFx0dGhpcy5rZXkgPSB0aGlzLm9zLmdldEF0dHJpYnV0ZSgnZGF0YS1rZXknKTtcblxuXHRcdGlmICghQXJyYXkuaXNBcnJheSh0aGlzLmNvdW50RGF0YSkpIHtcblx0XHRcdHRoaXMuZ2V0Q291bnQoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5nZXRDb3VudHMoKTtcblx0XHR9XG5cdH1cblxuXHQvLyBmZXRjaCBjb3VudCBlaXRoZXIgQUpBWCBvciBKU09OUFxuXHRnZXRDb3VudCgpIHtcblx0XHR2YXIgY291bnQgPSB0aGlzLnN0b3JlR2V0KHRoaXMudHlwZSArICctJyArIHRoaXMuc2hhcmVkKTtcblxuXHRcdGlmIChjb3VudCkge1xuXHRcdFx0aWYgKHRoaXMuYXBwZW5kVG8gJiYgdHlwZW9mIHRoaXMuYXBwZW5kVG8gIT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0dGhpcy5hcHBlbmRUby5hcHBlbmRDaGlsZCh0aGlzLm9zKTtcblx0XHRcdH1cblx0XHRcdGNvdW50UmVkdWNlKHRoaXMub3MsIGNvdW50KTtcblx0XHR9XG5cdFx0dGhpc1t0aGlzLmNvdW50RGF0YS50eXBlXSh0aGlzLmNvdW50RGF0YSk7XG5cdH1cblxuXHQvLyBmZXRjaCBtdWx0aXBsZSBjb3VudHMgYW5kIGFnZ3JlZ2F0ZVxuXHRnZXRDb3VudHMoKSB7XG5cdFx0dGhpcy50b3RhbCA9IFtdO1xuXG5cdFx0dmFyIGNvdW50ID0gdGhpcy5zdG9yZUdldCh0aGlzLnR5cGUgKyAnLScgKyB0aGlzLnNoYXJlZCk7XG5cblx0XHRpZiAoY291bnQpIHtcblx0XHRcdGlmICh0aGlzLmFwcGVuZFRvICAmJiB0eXBlb2YgdGhpcy5hcHBlbmRUbyAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHR0aGlzLmFwcGVuZFRvLmFwcGVuZENoaWxkKHRoaXMub3MpO1xuXHRcdFx0fVxuXHRcdFx0Y291bnRSZWR1Y2UodGhpcy5vcywgY291bnQpO1xuXHRcdH1cblxuXHRcdHRoaXMuY291bnREYXRhLmZvckVhY2goY291bnREYXRhID0+IHtcblxuXHRcdFx0dGhpc1tjb3VudERhdGEudHlwZV0oY291bnREYXRhLCAobnVtKSA9PiB7XG5cdFx0XHRcdHRoaXMudG90YWwucHVzaChudW0pO1xuXG5cdFx0XHRcdC8vIHRvdGFsIGNvdW50cyBsZW5ndGggbm93IGVxdWFscyB0eXBlIGFycmF5IGxlbmd0aFxuXHRcdFx0XHQvLyBzbyBhZ2dyZWdhdGUsIHN0b3JlIGFuZCBpbnNlcnQgaW50byBET01cblx0XHRcdFx0aWYgKHRoaXMudG90YWwubGVuZ3RoID09PSB0aGlzLnR5cGVBcnIubGVuZ3RoKSB7XG5cdFx0XHRcdFx0bGV0IHRvdCA9IDA7XG5cblx0XHRcdFx0XHR0aGlzLnRvdGFsLmZvckVhY2goKHQpID0+IHtcblx0XHRcdFx0XHRcdHRvdCArPSB0O1xuXHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0aWYgKHRoaXMuYXBwZW5kVG8gICYmIHR5cGVvZiB0aGlzLmFwcGVuZFRvICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0XHR0aGlzLmFwcGVuZFRvLmFwcGVuZENoaWxkKHRoaXMub3MpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGNvbnN0IGxvY2FsID0gTnVtYmVyKHRoaXMuc3RvcmVHZXQodGhpcy50eXBlICsgJy0nICsgdGhpcy5zaGFyZWQpKTtcblx0XHRcdFx0XHRpZiAobG9jYWwgPiB0b3QpIHtcblx0XHRcdFx0XHRcdGNvbnN0IGxhdGVzdENvdW50ID0gTnVtYmVyKHRoaXMuc3RvcmVHZXQodGhpcy50eXBlICsgJy0nICsgdGhpcy5zaGFyZWQgKyAnLWxhdGVzdENvdW50JykpO1xuXHRcdFx0XHRcdFx0dGhpcy5zdG9yZVNldCh0aGlzLnR5cGUgKyAnLScgKyB0aGlzLnNoYXJlZCArICctbGF0ZXN0Q291bnQnLCB0b3QpO1xuXG5cdFx0XHRcdFx0XHR0b3QgPSBpc051bWVyaWMobGF0ZXN0Q291bnQpICYmIGxhdGVzdENvdW50ID4gMCA/XG5cdFx0XHRcdFx0XHRcdHRvdCArPSBsb2NhbCAtIGxhdGVzdENvdW50IDpcblx0XHRcdFx0XHRcdFx0dG90ICs9IGxvY2FsO1xuXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHRoaXMuc3RvcmVTZXQodGhpcy50eXBlICsgJy0nICsgdGhpcy5zaGFyZWQsIHRvdCk7XG5cblx0XHRcdFx0XHRjb3VudFJlZHVjZSh0aGlzLm9zLCB0b3QpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdGlmICh0aGlzLmFwcGVuZFRvICAmJiB0eXBlb2YgdGhpcy5hcHBlbmRUbyAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0dGhpcy5hcHBlbmRUby5hcHBlbmRDaGlsZCh0aGlzLm9zKTtcblx0XHR9XG5cdH1cblxuXHQvLyBoYW5kbGUgSlNPTlAgcmVxdWVzdHNcblx0anNvbnAoY291bnREYXRhLCBjYikge1xuXHRcdC8vIGRlZmluZSByYW5kb20gY2FsbGJhY2sgYW5kIGFzc2lnbiB0cmFuc2Zvcm0gZnVuY3Rpb25cblx0XHRsZXQgY2FsbGJhY2sgPSBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHJpbmcoNykucmVwbGFjZSgvW15hLXpBLVpdL2csICcnKTtcblx0XHR3aW5kb3dbY2FsbGJhY2tdID0gKGRhdGEpID0+IHtcblx0XHRcdGxldCBjb3VudCA9IGNvdW50RGF0YS50cmFuc2Zvcm0uYXBwbHkodGhpcywgW2RhdGFdKSB8fCAwO1xuXG5cdFx0XHRpZiAoY2IgJiYgdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdGNiKGNvdW50KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGlmICh0aGlzLmFwcGVuZFRvICAmJiB0eXBlb2YgdGhpcy5hcHBlbmRUbyAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdHRoaXMuYXBwZW5kVG8uYXBwZW5kQ2hpbGQodGhpcy5vcyk7XG5cdFx0XHRcdH1cblx0XHRcdFx0Y291bnRSZWR1Y2UodGhpcy5vcywgY291bnQsIHRoaXMuY2IpO1xuXHRcdFx0fVxuXG5cdFx0XHRFdmVudHMudHJpZ2dlcih0aGlzLm9zLCAnY291bnRlZC0nICsgdGhpcy51cmwpO1xuXHRcdH07XG5cblx0XHQvLyBhcHBlbmQgSlNPTlAgc2NyaXB0IHRhZyB0byBwYWdlXG5cdFx0bGV0IHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuXHRcdHNjcmlwdC5zcmMgPSBjb3VudERhdGEudXJsLnJlcGxhY2UoJ2NhbGxiYWNrPT8nLCBgY2FsbGJhY2s9JHtjYWxsYmFja31gKTtcblx0XHRkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdLmFwcGVuZENoaWxkKHNjcmlwdCk7XG5cblx0XHRyZXR1cm47XG5cdH1cblxuXHQvLyBoYW5kbGUgQUpBWCBHRVQgcmVxdWVzdFxuXHRnZXQoY291bnREYXRhLCBjYikge1xuXHRcdGxldCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuXHRcdC8vIG9uIHN1Y2Nlc3MgcGFzcyByZXNwb25zZSB0byB0cmFuc2Zvcm0gZnVuY3Rpb25cblx0XHR4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gKCkgPT4ge1xuXHRcdFx0aWYgKHhoci5yZWFkeVN0YXRlID09PSA0KSB7XG5cdFx0XHRcdGlmICh4aHIuc3RhdHVzID09PSAyMDApIHtcblx0XHRcdFx0XHRsZXQgY291bnQgPSBjb3VudERhdGEudHJhbnNmb3JtLmFwcGx5KHRoaXMsIFt4aHIsIEV2ZW50c10pIHx8IDA7XG5cblx0XHRcdFx0XHRpZiAoY2IgJiYgdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0XHRjYihjb3VudCk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGlmICh0aGlzLmFwcGVuZFRvICYmIHR5cGVvZiB0aGlzLmFwcGVuZFRvICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMuYXBwZW5kVG8uYXBwZW5kQ2hpbGQodGhpcy5vcyk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRjb3VudFJlZHVjZSh0aGlzLm9zLCBjb3VudCwgdGhpcy5jYik7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0RXZlbnRzLnRyaWdnZXIodGhpcy5vcywgJ2NvdW50ZWQtJyArIHRoaXMudXJsKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRpZiAoY291bnREYXRhLnVybC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ2h0dHBzOi8vYXBpLm9wZW5zaGFyZS5zb2NpYWwvam9iPycpID09PSAwKSB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKCdQbGVhc2Ugc2lnbiB1cCBmb3IgVHdpdHRlciBjb3VudHMgYXQgaHR0cHM6Ly9vcGVuc2hhcmUuc29jaWFsL3R3aXR0ZXIvYXV0aCcpO1xuXHRcdFx0XHRcdH0gZWxzZSBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gZ2V0IEFQSSBkYXRhIGZyb20nLCBjb3VudERhdGEudXJsLCAnLiBQbGVhc2UgdXNlIHRoZSBsYXRlc3QgdmVyc2lvbiBvZiBPcGVuU2hhcmUuJyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXHRcdGNvdW50RGF0YS51cmwgPSB0aGlzLmtleSA/IGNvdW50RGF0YS51cmwgKyB0aGlzLmtleSA6IGNvdW50RGF0YS51cmw7XG5cdFx0eGhyLm9wZW4oJ0dFVCcsIGNvdW50RGF0YS51cmwpO1xuXHRcdHhoci5zZW5kKCk7XG5cdH1cblxuXHQvLyBoYW5kbGUgQUpBWCBQT1NUIHJlcXVlc3Rcblx0cG9zdChjb3VudERhdGEsIGNiKSB7XG5cdFx0bGV0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG5cdFx0Ly8gb24gc3VjY2VzcyBwYXNzIHJlc3BvbnNlIHRvIHRyYW5zZm9ybSBmdW5jdGlvblxuXHRcdHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSAoKSA9PiB7XG5cdFx0XHRpZiAoeGhyLnJlYWR5U3RhdGUgIT09IFhNTEh0dHBSZXF1ZXN0LkRPTkUgfHxcblx0XHRcdFx0eGhyLnN0YXR1cyAhPT0gMjAwKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0bGV0IGNvdW50ID0gY291bnREYXRhLnRyYW5zZm9ybS5hcHBseSh0aGlzLCBbeGhyXSkgfHwgMDtcblxuXHRcdFx0aWYgKGNiICYmIHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRjYihjb3VudCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAodGhpcy5hcHBlbmRUbyAmJiB0eXBlb2YgdGhpcy5hcHBlbmRUbyAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdHRoaXMuYXBwZW5kVG8uYXBwZW5kQ2hpbGQodGhpcy5vcyk7XG5cdFx0XHRcdH1cblx0XHRcdFx0Y291bnRSZWR1Y2UodGhpcy5vcywgY291bnQsIHRoaXMuY2IpO1xuXHRcdFx0fVxuXHRcdFx0RXZlbnRzLnRyaWdnZXIodGhpcy5vcywgJ2NvdW50ZWQtJyArIHRoaXMudXJsKTtcblx0XHR9O1xuXG5cdFx0eGhyLm9wZW4oJ1BPU1QnLCBjb3VudERhdGEudXJsKTtcblx0XHR4aHIuc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb247Y2hhcnNldD1VVEYtOCcpO1xuXHRcdHhoci5zZW5kKEpTT04uc3RyaW5naWZ5KGNvdW50RGF0YS5kYXRhKSk7XG5cdH1cblxuXHRzdG9yZVNldCh0eXBlLCBjb3VudCA9IDApIHtcblx0XHRpZiAoIXdpbmRvdy5sb2NhbFN0b3JhZ2UgfHwgIXR5cGUpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRsb2NhbFN0b3JhZ2Uuc2V0SXRlbShgT3BlblNoYXJlLSR7dHlwZX1gLCBjb3VudCk7XG5cdH1cblxuXHRzdG9yZUdldCh0eXBlKSB7XG5cdFx0aWYgKCF3aW5kb3cubG9jYWxTdG9yYWdlIHx8ICF0eXBlKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGxvY2FsU3RvcmFnZS5nZXRJdGVtKGBPcGVuU2hhcmUtJHt0eXBlfWApO1xuXHR9XG5cbn07XG5cbmZ1bmN0aW9uIGlzTnVtZXJpYyhuKSB7XG4gIHJldHVybiAhaXNOYU4ocGFyc2VGbG9hdChuKSkgJiYgaXNGaW5pdGUobik7XG59XG4iLCIvKipcbiAqIFRyaWdnZXIgY3VzdG9tIE9wZW5TaGFyZSBuYW1lc3BhY2VkIGV2ZW50XG4gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuXHR0cmlnZ2VyOiBmdW5jdGlvbihlbGVtZW50LCBldmVudCkge1xuXHRcdGxldCBldiA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdFdmVudCcpO1xuXHRcdGV2LmluaXRFdmVudCgnT3BlblNoYXJlLicgKyBldmVudCwgdHJ1ZSwgdHJ1ZSk7XG5cdFx0ZWxlbWVudC5kaXNwYXRjaEV2ZW50KGV2KTtcblx0fVxufTtcbiIsIi8qKlxuICogT3BlblNoYXJlIGdlbmVyYXRlcyBhIHNpbmdsZSBzaGFyZSBsaW5rXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgT3BlblNoYXJlIHtcblxuXHRjb25zdHJ1Y3Rvcih0eXBlLCB0cmFuc2Zvcm0pIHtcblx0XHR0aGlzLmlvcyA9IC9pUGFkfGlQaG9uZXxpUG9kLy50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpICYmICF3aW5kb3cuTVNTdHJlYW07XG5cdFx0dGhpcy50eXBlID0gdHlwZTtcblx0XHR0aGlzLmR5bmFtaWMgPSBmYWxzZTtcblx0XHR0aGlzLnRyYW5zZm9ybSA9IHRyYW5zZm9ybTtcblxuXHRcdC8vIGNhcGl0YWxpemVkIHR5cGVcblx0XHR0aGlzLnR5cGVDYXBzID0gdHlwZS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHR5cGUuc2xpY2UoMSk7XG5cdH1cblxuXHQvLyByZXR1cm5zIGZ1bmN0aW9uIG5hbWVkIGFzIHR5cGUgc2V0IGluIGNvbnN0cnVjdG9yXG5cdC8vIGUuZyB0d2l0dGVyKClcblx0c2V0RGF0YShkYXRhKSB7XG5cdFx0Ly8gaWYgaU9TIHVzZXIgYW5kIGlvcyBkYXRhIGF0dHJpYnV0ZSBkZWZpbmVkXG5cdFx0Ly8gYnVpbGQgaU9TIFVSTCBzY2hlbWUgYXMgc2luZ2xlIHN0cmluZ1xuXHRcdGlmICh0aGlzLmlvcykge1xuXHRcdFx0dGhpcy50cmFuc2Zvcm1EYXRhID0gdGhpcy50cmFuc2Zvcm0oZGF0YSwgdHJ1ZSk7XG5cdFx0XHR0aGlzLm1vYmlsZVNoYXJlVXJsID0gdGhpcy50ZW1wbGF0ZSh0aGlzLnRyYW5zZm9ybURhdGEudXJsLCB0aGlzLnRyYW5zZm9ybURhdGEuZGF0YSk7XG5cdFx0fVxuXG5cdFx0dGhpcy50cmFuc2Zvcm1EYXRhID0gdGhpcy50cmFuc2Zvcm0oZGF0YSk7XG5cdFx0dGhpcy5zaGFyZVVybCA9IHRoaXMudGVtcGxhdGUodGhpcy50cmFuc2Zvcm1EYXRhLnVybCwgdGhpcy50cmFuc2Zvcm1EYXRhLmRhdGEpO1xuXHR9XG5cblx0Ly8gb3BlbiBzaGFyZSBVUkwgZGVmaW5lZCBpbiBpbmRpdmlkdWFsIHBsYXRmb3JtIGZ1bmN0aW9uc1xuXHRzaGFyZShlKSB7XG5cdFx0Ly8gaWYgaU9TIHNoYXJlIFVSTCBoYXMgYmVlbiBzZXQgdGhlbiB1c2UgdGltZW91dCBoYWNrXG5cdFx0Ly8gdGVzdCBmb3IgbmF0aXZlIGFwcCBhbmQgZmFsbCBiYWNrIHRvIHdlYlxuXHRcdGlmICh0aGlzLm1vYmlsZVNoYXJlVXJsKSB7XG5cdFx0XHR2YXIgc3RhcnQgPSAobmV3IERhdGUoKSkudmFsdWVPZigpO1xuXG5cdFx0XHRzZXRUaW1lb3V0KCgpID0+IHtcblx0XHRcdFx0dmFyIGVuZCA9IChuZXcgRGF0ZSgpKS52YWx1ZU9mKCk7XG5cblx0XHRcdFx0Ly8gaWYgdGhlIHVzZXIgaXMgc3RpbGwgaGVyZSwgZmFsbCBiYWNrIHRvIHdlYlxuXHRcdFx0XHRpZiAoZW5kIC0gc3RhcnQgPiAxNjAwKSB7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0d2luZG93LmxvY2F0aW9uID0gdGhpcy5zaGFyZVVybDtcblx0XHRcdH0sIDE1MDApO1xuXG5cdFx0XHR3aW5kb3cubG9jYXRpb24gPSB0aGlzLm1vYmlsZVNoYXJlVXJsO1xuXG5cdFx0Ly8gb3BlbiBtYWlsdG8gbGlua3MgaW4gc2FtZSB3aW5kb3dcblx0XHR9IGVsc2UgaWYgKHRoaXMudHlwZSA9PT0gJ2VtYWlsJykge1xuXHRcdFx0d2luZG93LmxvY2F0aW9uID0gdGhpcy5zaGFyZVVybDtcblxuXHRcdC8vIG9wZW4gc29jaWFsIHNoYXJlIFVSTHMgaW4gbmV3IHdpbmRvd1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBpZiBwb3B1cCBvYmplY3QgcHJlc2VudCB0aGVuIHNldCB3aW5kb3cgZGltZW5zaW9ucyAvIHBvc2l0aW9uXG5cdFx0XHRpZih0aGlzLnBvcHVwICYmIHRoaXMudHJhbnNmb3JtRGF0YS5wb3B1cCkge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5vcGVuV2luZG93KHRoaXMuc2hhcmVVcmwsIHRoaXMudHJhbnNmb3JtRGF0YS5wb3B1cCk7XG5cdFx0XHR9XG5cblx0XHRcdHdpbmRvdy5vcGVuKHRoaXMuc2hhcmVVcmwpO1xuXHRcdH1cblx0fVxuXG5cdC8vIGNyZWF0ZSBzaGFyZSBVUkwgd2l0aCBHRVQgcGFyYW1zXG5cdC8vIGFwcGVuZGluZyB2YWxpZCBwcm9wZXJ0aWVzIHRvIHF1ZXJ5IHN0cmluZ1xuXHR0ZW1wbGF0ZSh1cmwsIGRhdGEpIHtcblx0XHRsZXQgbm9uVVJMUHJvcHMgPSBbXG5cdFx0XHQnYXBwZW5kVG8nLFxuXHRcdFx0J2lubmVySFRNTCcsXG5cdFx0XHQnY2xhc3Nlcydcblx0XHRdO1xuXG5cdFx0bGV0IHNoYXJlVXJsID0gdXJsLFxuXHRcdFx0aTtcblxuXHRcdGZvciAoaSBpbiBkYXRhKSB7XG5cdFx0XHQvLyBvbmx5IGFwcGVuZCB2YWxpZCBwcm9wZXJ0aWVzXG5cdFx0XHRpZiAoIWRhdGFbaV0gfHwgbm9uVVJMUHJvcHMuaW5kZXhPZihpKSA+IC0xKSB7XG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBhcHBlbmQgVVJMIGVuY29kZWQgR0VUIHBhcmFtIHRvIHNoYXJlIFVSTFxuXHRcdFx0ZGF0YVtpXSA9IGVuY29kZVVSSUNvbXBvbmVudChkYXRhW2ldKTtcblx0XHRcdHNoYXJlVXJsICs9IGAke2l9PSR7ZGF0YVtpXX0mYDtcblx0XHR9XG5cblx0XHRyZXR1cm4gc2hhcmVVcmwuc3Vic3RyKDAsIHNoYXJlVXJsLmxlbmd0aCAtIDEpO1xuXHR9XG5cblx0Ly8gY2VudGVyIHBvcHVwIHdpbmRvdyBzdXBwb3J0aW5nIGR1YWwgc2NyZWVuc1xuXHRvcGVuV2luZG93KHVybCwgb3B0aW9ucykge1xuXHRcdGxldCBkdWFsU2NyZWVuTGVmdCA9IHdpbmRvdy5zY3JlZW5MZWZ0ICE9IHVuZGVmaW5lZCA/IHdpbmRvdy5zY3JlZW5MZWZ0IDogc2NyZWVuLmxlZnQsXG5cdFx0XHRkdWFsU2NyZWVuVG9wID0gd2luZG93LnNjcmVlblRvcCAhPSB1bmRlZmluZWQgPyB3aW5kb3cuc2NyZWVuVG9wIDogc2NyZWVuLnRvcCxcblx0XHRcdHdpZHRoID0gd2luZG93LmlubmVyV2lkdGggPyB3aW5kb3cuaW5uZXJXaWR0aCA6IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aCA/IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aCA6IHNjcmVlbi53aWR0aCxcblx0XHRcdGhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodCA/IHdpbmRvdy5pbm5lckhlaWdodCA6IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQgPyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0IDogc2NyZWVuLmhlaWdodCxcblx0XHRcdGxlZnQgPSAoKHdpZHRoIC8gMikgLSAob3B0aW9ucy53aWR0aCAvIDIpKSArIGR1YWxTY3JlZW5MZWZ0LFxuXHRcdFx0dG9wID0gKChoZWlnaHQgLyAyKSAtIChvcHRpb25zLmhlaWdodCAvIDIpKSArIGR1YWxTY3JlZW5Ub3AsXG5cdFx0XHRuZXdXaW5kb3cgPSB3aW5kb3cub3Blbih1cmwsICdPcGVuU2hhcmUnLCBgd2lkdGg9JHtvcHRpb25zLndpZHRofSwgaGVpZ2h0PSR7b3B0aW9ucy5oZWlnaHR9LCB0b3A9JHt0b3B9LCBsZWZ0PSR7bGVmdH1gKTtcblxuXHRcdC8vIFB1dHMgZm9jdXMgb24gdGhlIG5ld1dpbmRvd1xuXHRcdGlmICh3aW5kb3cuZm9jdXMpIHtcblx0XHRcdG5ld1dpbmRvdy5mb2N1cygpO1xuXHRcdH1cblx0fVxufTtcbiIsIi8qKlxuICogR2xvYmFsIE9wZW5TaGFyZSBBUEkgdG8gZ2VuZXJhdGUgaW5zdGFuY2VzIHByb2dyYW1tYXRpY2FsbHlcbiAqL1xuXG5jb25zdCBPUyA9IHJlcXVpcmUoJy4vb3Blbi1zaGFyZScpO1xuY29uc3QgU2hhcmVUcmFuc2Zvcm1zID0gcmVxdWlyZSgnLi9zaGFyZS10cmFuc2Zvcm1zJyk7XG5jb25zdCBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xuY29uc3QgZGFzaFRvQ2FtZWwgPSByZXF1aXJlKCcuLi8uLi9saWIvZGFzaFRvQ2FtZWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcblxuXHQvLyBnbG9iYWwgT3BlblNoYXJlIHJlZmVyZW5jaW5nIGludGVybmFsIGNsYXNzIGZvciBpbnN0YW5jZSBnZW5lcmF0aW9uXG5cdGNsYXNzIE9wZW5TaGFyZSB7XG5cblx0XHRjb25zdHJ1Y3RvcihkYXRhLCBlbGVtZW50KSB7XG5cblx0XHRcdGlmICghZGF0YS5iaW5kQ2xpY2spIGRhdGEuYmluZENsaWNrID0gdHJ1ZTtcblxuXHRcdFx0bGV0IGRhc2ggPSBkYXRhLnR5cGUuaW5kZXhPZignLScpO1xuXG5cdFx0XHRpZiAoZGFzaCA+IC0xKSB7XG5cdFx0XHRcdGRhdGEudHlwZSA9IGRhc2hUb0NhbWVsKGRhc2gsIGRhdGEudHlwZSk7XG5cdFx0XHR9XG5cblx0XHRcdGxldCBub2RlO1xuXHRcdFx0dGhpcy5lbGVtZW50ID0gZWxlbWVudDtcblx0XHRcdHRoaXMuZGF0YSA9IGRhdGE7XG5cblx0XHRcdHRoaXMub3MgPSBuZXcgT1MoZGF0YS50eXBlLCBTaGFyZVRyYW5zZm9ybXNbZGF0YS50eXBlXSk7XG5cdFx0XHR0aGlzLm9zLnNldERhdGEoZGF0YSk7XG5cblx0XHRcdGlmICghZWxlbWVudCB8fCBkYXRhLmVsZW1lbnQpIHtcblx0XHRcdFx0ZWxlbWVudCA9IGRhdGEuZWxlbWVudDtcblx0XHRcdFx0bm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoZWxlbWVudCB8fCAnYScpO1xuXHRcdFx0XHRpZiAoZGF0YS50eXBlKSB7XG5cdFx0XHRcdFx0bm9kZS5jbGFzc0xpc3QuYWRkKCdvcGVuLXNoYXJlLWxpbmsnLCBkYXRhLnR5cGUpO1xuXHRcdFx0XHRcdG5vZGUuc2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUnLCBkYXRhLnR5cGUpO1xuXHRcdFx0XHRcdG5vZGUuc2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtbm9kZScsIGRhdGEudHlwZSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGRhdGEuaW5uZXJIVE1MKSBub2RlLmlubmVySFRNTCA9IGRhdGEuaW5uZXJIVE1MO1xuXHRcdFx0fVxuXHRcdFx0aWYgKG5vZGUpIGVsZW1lbnQgPSBub2RlO1xuXG5cdFx0XHRpZiAoZGF0YS5iaW5kQ2xpY2spIHtcblx0XHRcdFx0ZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5zaGFyZSgpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRhdGEuYXBwZW5kVG8pIHtcblx0XHRcdFx0ZGF0YS5hcHBlbmRUby5hcHBlbmRDaGlsZChlbGVtZW50KTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRhdGEuY2xhc3NlcyAmJiBBcnJheS5pc0FycmF5KGRhdGEuY2xhc3NlcykpIHtcblx0XHRcdFx0ZGF0YS5jbGFzc2VzLmZvckVhY2goY3NzQ2xhc3MgPT4ge1xuXHRcdFx0XHRcdGVsZW1lbnQuY2xhc3NMaXN0LmFkZChjc3NDbGFzcyk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGF0YS50eXBlLnRvTG93ZXJDYXNlKCkgPT09ICdwYXlwYWwnKSB7XG5cdFx0XHRcdGNvbnN0IGFjdGlvbiA9IGRhdGEuc2FuZGJveCA/XG5cdFx0XHRcdCAgIFwiaHR0cHM6Ly93d3cuc2FuZGJveC5wYXlwYWwuY29tL2NnaS1iaW4vd2Vic2NyXCIgOlxuXHRcdFx0XHQgICBcImh0dHBzOi8vd3d3LnBheXBhbC5jb20vY2dpLWJpbi93ZWJzY3JcIjtcblxuXHRcdFx0XHRjb25zdCBidXlHSUYgPSBkYXRhLnNhbmRib3ggP1xuXHRcdFx0XHRcdFwiaHR0cHM6Ly93d3cuc2FuZGJveC5wYXlwYWwuY29tL2VuX1VTL2kvYnRuL2J0bl9idXlub3dfTEcuZ2lmXCIgOlxuXHRcdFx0XHRcdFwiaHR0cHM6Ly93d3cucGF5cGFsb2JqZWN0cy5jb20vZW5fVVMvaS9idG4vYnRuX2J1eW5vd19MRy5naWZcIjtcblxuXHRcdFx0XHRjb25zdCBwaXhlbEdJRiA9IGRhdGEuc2FuZGJveCA/XG5cdFx0XHRcdFx0XCJodHRwczovL3d3dy5zYW5kYm94LnBheXBhbC5jb20vZW5fVVMvaS9zY3IvcGl4ZWwuZ2lmXCIgOlxuXHRcdFx0XHRcdFwiaHR0cHM6Ly93d3cucGF5cGFsb2JqZWN0cy5jb20vZW5fVVMvaS9zY3IvcGl4ZWwuZ2lmXCI7XG5cblxuXHRcdFx0XHRjb25zdCBwYXlwYWxCdXR0b24gPSBgPGZvcm0gYWN0aW9uPSR7YWN0aW9ufSBtZXRob2Q9XCJwb3N0XCIgdGFyZ2V0PVwiX2JsYW5rXCI+XG5cblx0XHRcdFx0ICA8IS0tIFNhdmVkIGJ1dHRvbnMgdXNlIHRoZSBcInNlY3VyZSBjbGlja1wiIGNvbW1hbmQgLS0+XG5cdFx0XHRcdCAgPGlucHV0IHR5cGU9XCJoaWRkZW5cIiBuYW1lPVwiY21kXCIgdmFsdWU9XCJfcy14Y2xpY2tcIj5cblxuXHRcdFx0XHQgIDwhLS0gU2F2ZWQgYnV0dG9ucyBhcmUgaWRlbnRpZmllZCBieSB0aGVpciBidXR0b24gSURzIC0tPlxuXHRcdFx0XHQgIDxpbnB1dCB0eXBlPVwiaGlkZGVuXCIgbmFtZT1cImhvc3RlZF9idXR0b25faWRcIiB2YWx1ZT1cIiR7ZGF0YS5idXR0b25JZH1cIj5cblxuXHRcdFx0XHQgIDwhLS0gU2F2ZWQgYnV0dG9ucyBkaXNwbGF5IGFuIGFwcHJvcHJpYXRlIGJ1dHRvbiBpbWFnZS4gLS0+XG5cdFx0XHRcdCAgPGlucHV0IHR5cGU9XCJpbWFnZVwiIG5hbWU9XCJzdWJtaXRcIlxuXHRcdFx0XHQgICAgc3JjPSR7YnV5R0lGfVxuXHRcdFx0XHQgICAgYWx0PVwiUGF5UGFsIC0gVGhlIHNhZmVyLCBlYXNpZXIgd2F5IHRvIHBheSBvbmxpbmVcIj5cblx0XHRcdFx0ICA8aW1nIGFsdD1cIlwiIHdpZHRoPVwiMVwiIGhlaWdodD1cIjFcIlxuXHRcdFx0XHQgICAgc3JjPSR7cGl4ZWxHSUZ9ID5cblxuXHRcdFx0XHQ8L2Zvcm0+YDtcblxuXHRcdFx0XHRjb25zdCBoaWRkZW5EaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0XHRcdFx0aGlkZGVuRGl2LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cdFx0XHRcdGhpZGRlbkRpdi5pbm5lckhUTUwgPSBwYXlwYWxCdXR0b247XG5cdFx0XHRcdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoaGlkZGVuRGl2KTtcblxuXHRcdFx0XHR0aGlzLnBheXBhbCA9IGhpZGRlbkRpdi5xdWVyeVNlbGVjdG9yKCdmb3JtJyk7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG5cdFx0XHRyZXR1cm4gZWxlbWVudDtcblx0XHR9XG5cblx0XHQvLyBwdWJsaWMgc2hhcmUgbWV0aG9kIHRvIHRyaWdnZXIgc2hhcmUgcHJvZ3JhbW1hdGljYWxseVxuXHRcdHNoYXJlKGUpIHtcblx0XHRcdC8vIGlmIGR5bmFtaWMgaW5zdGFuY2UgdGhlbiBmZXRjaCBhdHRyaWJ1dGVzIGFnYWluIGluIGNhc2Ugb2YgdXBkYXRlc1xuXHRcdFx0aWYgKHRoaXMuZGF0YS5keW5hbWljKSB7XG5cdFx0XHRcdHRoaXMub3Muc2V0RGF0YShkYXRhKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHRoaXMuZGF0YS50eXBlLnRvTG93ZXJDYXNlKCkgPT09ICdwYXlwYWwnKSB7XG5cdFx0XHRcdHRoaXMucGF5cGFsLnN1Ym1pdCgpO1xuXHRcdFx0fSBlbHNlIHRoaXMub3Muc2hhcmUoZSk7XG5cblx0XHRcdEV2ZW50cy50cmlnZ2VyKHRoaXMuZWxlbWVudCwgJ3NoYXJlZCcpO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBPcGVuU2hhcmU7XG59O1xuIiwiLyoqXG4gKiBPYmplY3Qgb2YgdHJhbnNmb3JtIGZ1bmN0aW9ucyBmb3IgZWFjaCBvcGVuc2hhcmUgYXBpXG4gKiBUcmFuc2Zvcm0gZnVuY3Rpb25zIHBhc3NlZCBpbnRvIE9wZW5TaGFyZSBpbnN0YW5jZSB3aGVuIGluc3RhbnRpYXRlZFxuICogUmV0dXJuIG9iamVjdCBjb250YWluaW5nIFVSTCBhbmQga2V5L3ZhbHVlIGFyZ3NcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSB7XG5cblx0Ly8gc2V0IFR3aXR0ZXIgc2hhcmUgVVJMXG5cdHR3aXR0ZXI6IGZ1bmN0aW9uKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG5cdFx0Ly8gaWYgaU9TIHVzZXIgYW5kIGlvcyBkYXRhIGF0dHJpYnV0ZSBkZWZpbmVkXG5cdFx0Ly8gYnVpbGQgaU9TIFVSTCBzY2hlbWUgYXMgc2luZ2xlIHN0cmluZ1xuXHRcdGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcblxuXHRcdFx0bGV0IG1lc3NhZ2UgPSBgYDtcblxuXHRcdFx0aWYgKGRhdGEudGV4dCkge1xuXHRcdFx0XHRtZXNzYWdlICs9IGRhdGEudGV4dDtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRhdGEudXJsKSB7XG5cdFx0XHRcdG1lc3NhZ2UgKz0gYCAtICR7ZGF0YS51cmx9YDtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRhdGEuaGFzaHRhZ3MpIHtcblx0XHRcdFx0bGV0IHRhZ3MgPSBkYXRhLmhhc2h0YWdzLnNwbGl0KCcsJyk7XG5cdFx0XHRcdHRhZ3MuZm9yRWFjaChmdW5jdGlvbih0YWcpIHtcblx0XHRcdFx0XHRtZXNzYWdlICs9IGAgIyR7dGFnfWA7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGF0YS52aWEpIHtcblx0XHRcdFx0bWVzc2FnZSArPSBgIHZpYSAke2RhdGEudmlhfWA7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVybDogJ3R3aXR0ZXI6Ly9wb3N0PycsXG5cdFx0XHRcdGRhdGE6IHtcblx0XHRcdFx0XHRtZXNzYWdlOiBtZXNzYWdlXG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybDogJ2h0dHBzOi8vdHdpdHRlci5jb20vc2hhcmU/Jyxcblx0XHRcdGRhdGE6IGRhdGEsXG5cdFx0XHRwb3B1cDoge1xuXHRcdFx0XHR3aWR0aDogNzAwLFxuXHRcdFx0XHRoZWlnaHQ6IDI5NlxuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gc2V0IFR3aXR0ZXIgcmV0d2VldCBVUkxcblx0dHdpdHRlclJldHdlZXQ6IGZ1bmN0aW9uKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG5cdFx0Ly8gaWYgaU9TIHVzZXIgYW5kIGlvcyBkYXRhIGF0dHJpYnV0ZSBkZWZpbmVkXG5cdFx0aWYgKGlvcyAmJiBkYXRhLmlvcykge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0dXJsOiAndHdpdHRlcjovL3N0YXR1cz8nLFxuXHRcdFx0XHRkYXRhOiB7XG5cdFx0XHRcdFx0aWQ6IGRhdGEudHdlZXRJZFxuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6ICdodHRwczovL3R3aXR0ZXIuY29tL2ludGVudC9yZXR3ZWV0PycsXG5cdFx0XHRkYXRhOiB7XG5cdFx0XHRcdHR3ZWV0X2lkOiBkYXRhLnR3ZWV0SWQsXG5cdFx0XHRcdHJlbGF0ZWQ6IGRhdGEucmVsYXRlZFxuXHRcdFx0fSxcblx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdHdpZHRoOiA3MDAsXG5cdFx0XHRcdGhlaWdodDogMjk2XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBzZXQgVHdpdHRlciBsaWtlIFVSTFxuXHR0d2l0dGVyTGlrZTogZnVuY3Rpb24oZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHQvLyBpZiBpT1MgdXNlciBhbmQgaW9zIGRhdGEgYXR0cmlidXRlIGRlZmluZWRcblx0XHRpZiAoaW9zICYmIGRhdGEuaW9zKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR1cmw6ICd0d2l0dGVyOi8vc3RhdHVzPycsXG5cdFx0XHRcdGRhdGE6IHtcblx0XHRcdFx0XHRpZDogZGF0YS50d2VldElkXG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybDogJ2h0dHBzOi8vdHdpdHRlci5jb20vaW50ZW50L2Zhdm9yaXRlPycsXG5cdFx0XHRkYXRhOiB7XG5cdFx0XHRcdHR3ZWV0X2lkOiBkYXRhLnR3ZWV0SWQsXG5cdFx0XHRcdHJlbGF0ZWQ6IGRhdGEucmVsYXRlZFxuXHRcdFx0fSxcblx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdHdpZHRoOiA3MDAsXG5cdFx0XHRcdGhlaWdodDogMjk2XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBzZXQgVHdpdHRlciBmb2xsb3cgVVJMXG5cdHR3aXR0ZXJGb2xsb3c6IGZ1bmN0aW9uKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG5cdFx0Ly8gaWYgaU9TIHVzZXIgYW5kIGlvcyBkYXRhIGF0dHJpYnV0ZSBkZWZpbmVkXG5cdFx0aWYgKGlvcyAmJiBkYXRhLmlvcykge1xuXHRcdFx0bGV0IGlvc0RhdGEgPSBkYXRhLnNjcmVlbk5hbWUgPyB7XG5cdFx0XHRcdCdzY3JlZW5fbmFtZSc6IGRhdGEuc2NyZWVuTmFtZVxuXHRcdFx0fSA6IHtcblx0XHRcdFx0J2lkJzogZGF0YS51c2VySWRcblx0XHRcdH07XG5cblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVybDogJ3R3aXR0ZXI6Ly91c2VyPycsXG5cdFx0XHRcdGRhdGE6IGlvc0RhdGFcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybDogJ2h0dHBzOi8vdHdpdHRlci5jb20vaW50ZW50L3VzZXI/Jyxcblx0XHRcdGRhdGE6IHtcblx0XHRcdFx0c2NyZWVuX25hbWU6IGRhdGEuc2NyZWVuTmFtZSxcblx0XHRcdFx0dXNlcl9pZDogZGF0YS51c2VySWRcblx0XHRcdH0sXG5cdFx0XHRwb3B1cDoge1xuXHRcdFx0XHR3aWR0aDogNzAwLFxuXHRcdFx0XHRoZWlnaHQ6IDI5NlxuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gc2V0IEZhY2Vib29rIHNoYXJlIFVSTFxuXHRmYWNlYm9vazogZnVuY3Rpb24oZGF0YSkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6ICdodHRwczovL3d3dy5mYWNlYm9vay5jb20vZGlhbG9nL2ZlZWQ/YXBwX2lkPTk2MTM0MjU0MzkyMjMyMiZyZWRpcmVjdF91cmk9aHR0cDovL2ZhY2Vib29rLmNvbSYnLFxuXHRcdFx0ZGF0YTogZGF0YSxcblx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdHdpZHRoOiA1NjAsXG5cdFx0XHRcdGhlaWdodDogNTkzXG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBzZXQgRmFjZWJvb2sgc2VuZCBVUkxcblx0ZmFjZWJvb2tTZW5kOiBmdW5jdGlvbihkYXRhKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybDogJ2h0dHBzOi8vd3d3LmZhY2Vib29rLmNvbS9kaWFsb2cvc2VuZD9hcHBfaWQ9OTYxMzQyNTQzOTIyMzIyJnJlZGlyZWN0X3VyaT1odHRwOi8vZmFjZWJvb2suY29tJicsXG5cdFx0XHRkYXRhOiBkYXRhLFxuXHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0d2lkdGg6IDk4MCxcblx0XHRcdFx0aGVpZ2h0OiA1OTZcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBZb3VUdWJlIHBsYXkgVVJMXG5cdHlvdXR1YmU6IGZ1bmN0aW9uKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG5cdFx0Ly8gaWYgaU9TIHVzZXJcblx0XHRpZiAoaW9zICYmIGRhdGEuaW9zKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR1cmw6IGB5b3V0dWJlOiR7ZGF0YS52aWRlb30/YFxuXHRcdFx0fTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0dXJsOiBgaHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g/dj0ke2RhdGEudmlkZW99P2AsXG5cdFx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdFx0d2lkdGg6IDEwODYsXG5cdFx0XHRcdFx0aGVpZ2h0OiA2MDhcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9XG5cdH0sXG5cblx0Ly8gc2V0IFlvdVR1YmUgc3ViY3JpYmUgVVJMXG5cdHlvdXR1YmVTdWJzY3JpYmU6IGZ1bmN0aW9uKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG5cdFx0Ly8gaWYgaU9TIHVzZXJcblx0XHRpZiAoaW9zICYmIGRhdGEuaW9zKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR1cmw6IGB5b3V0dWJlOi8vd3d3LnlvdXR1YmUuY29tL3VzZXIvJHtkYXRhLnVzZXJ9P2Bcblx0XHRcdH07XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVybDogYGh0dHBzOi8vd3d3LnlvdXR1YmUuY29tL3VzZXIvJHtkYXRhLnVzZXJ9P2AsXG5cdFx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdFx0d2lkdGg6IDg4MCxcblx0XHRcdFx0XHRoZWlnaHQ6IDM1MFxuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdH1cblx0fSxcblxuXHQvLyBzZXQgSW5zdGFncmFtIGZvbGxvdyBVUkxcblx0aW5zdGFncmFtOiBmdW5jdGlvbihkYXRhKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybDogYGluc3RhZ3JhbTovL2NhbWVyYT9gXG5cdFx0fTtcblx0fSxcblxuXHQvLyBzZXQgSW5zdGFncmFtIGZvbGxvdyBVUkxcblx0aW5zdGFncmFtRm9sbG93OiBmdW5jdGlvbihkYXRhLCBpb3MgPSBmYWxzZSkge1xuXHRcdC8vIGlmIGlPUyB1c2VyXG5cdFx0aWYgKGlvcyAmJiBkYXRhLmlvcykge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0dXJsOiAnaW5zdGFncmFtOi8vdXNlcj8nLFxuXHRcdFx0XHRkYXRhOiBkYXRhXG5cdFx0XHR9O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR1cmw6IGBodHRwOi8vd3d3Lmluc3RhZ3JhbS5jb20vJHtkYXRhLnVzZXJuYW1lfT9gLFxuXHRcdFx0XHRwb3B1cDoge1xuXHRcdFx0XHRcdHdpZHRoOiA5ODAsXG5cdFx0XHRcdFx0aGVpZ2h0OiA2NTVcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9XG5cdH0sXG5cblx0Ly8gc2V0IFNuYXBjaGF0IGZvbGxvdyBVUkxcblx0c25hcGNoYXQgKGRhdGEpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiBgc25hcGNoYXQ6Ly9hZGQvJHtkYXRhLnVzZXJuYW1lfT9gXG5cdFx0fTtcblx0fSxcblxuXHQvLyBzZXQgR29vZ2xlIHNoYXJlIFVSTFxuXHRnb29nbGUgKGRhdGEpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiAnaHR0cHM6Ly9wbHVzLmdvb2dsZS5jb20vc2hhcmU/Jyxcblx0XHRcdGRhdGE6IGRhdGEsXG5cdFx0XHRwb3B1cDoge1xuXHRcdFx0XHR3aWR0aDogNDk1LFxuXHRcdFx0XHRoZWlnaHQ6IDgxNVxuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gc2V0IEdvb2dsZSBtYXBzIFVSTFxuXHRnb29nbGVNYXBzIChkYXRhLCBpb3MgPSBmYWxzZSkge1xuXG5cdFx0aWYgKGRhdGEuc2VhcmNoKSB7XG5cdFx0XHRkYXRhLnEgPSBkYXRhLnNlYXJjaDtcblx0XHRcdGRlbGV0ZSBkYXRhLnNlYXJjaDtcblx0XHR9XG5cblx0XHQvLyBpZiBpT1MgdXNlciBhbmQgaW9zIGRhdGEgYXR0cmlidXRlIGRlZmluZWRcblx0XHRpZiAoaW9zICYmIGRhdGEuaW9zKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR1cmw6ICdjb21nb29nbGVtYXBzOi8vPycsXG5cdFx0XHRcdGRhdGE6IGlvc1xuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRpZiAoIWlvcyAmJiBkYXRhLmlvcykge1xuXHRcdFx0ZGVsZXRlIGRhdGEuaW9zO1xuXHRcdH1cblxuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6ICdodHRwczovL21hcHMuZ29vZ2xlLmNvbS8/Jyxcblx0XHRcdGRhdGE6IGRhdGEsXG5cdFx0XHRwb3B1cDoge1xuXHRcdFx0XHR3aWR0aDogODAwLFxuXHRcdFx0XHRoZWlnaHQ6IDYwMFxuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gc2V0IFBpbnRlcmVzdCBzaGFyZSBVUkxcblx0cGludGVyZXN0IChkYXRhKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybDogJ2h0dHBzOi8vcGludGVyZXN0LmNvbS9waW4vY3JlYXRlL2Jvb2ttYXJrbGV0Lz8nLFxuXHRcdFx0ZGF0YTogZGF0YSxcblx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdHdpZHRoOiA3NDUsXG5cdFx0XHRcdGhlaWdodDogNjIwXG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBzZXQgTGlua2VkSW4gc2hhcmUgVVJMXG5cdGxpbmtlZGluIChkYXRhKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybDogJ2h0dHA6Ly93d3cubGlua2VkaW4uY29tL3NoYXJlQXJ0aWNsZT8nLFxuXHRcdFx0ZGF0YTogZGF0YSxcblx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdHdpZHRoOiA3ODAsXG5cdFx0XHRcdGhlaWdodDogNDkyXG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBzZXQgQnVmZmVyIHNoYXJlIFVSTFxuXHRidWZmZXIgKGRhdGEpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiAnaHR0cDovL2J1ZmZlcmFwcC5jb20vYWRkPycsXG5cdFx0XHRkYXRhOiBkYXRhLFxuXHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0d2lkdGg6IDc0NSxcblx0XHRcdFx0aGVpZ2h0OiAzNDVcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBUdW1ibHIgc2hhcmUgVVJMXG5cdHR1bWJsciAoZGF0YSkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6ICdodHRwczovL3d3dy50dW1ibHIuY29tL3dpZGdldHMvc2hhcmUvdG9vbD8nLFxuXHRcdFx0ZGF0YTogZGF0YSxcblx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdHdpZHRoOiA1NDAsXG5cdFx0XHRcdGhlaWdodDogOTQwXG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBzZXQgUmVkZGl0IHNoYXJlIFVSTFxuXHRyZWRkaXQgKGRhdGEpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiAnaHR0cDovL3JlZGRpdC5jb20vc3VibWl0PycsXG5cdFx0XHRkYXRhOiBkYXRhLFxuXHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0d2lkdGg6IDg2MCxcblx0XHRcdFx0aGVpZ2h0OiA4ODBcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBGbGlja3IgZm9sbG93IFVSTFxuXHRmbGlja3IgKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG5cdFx0Ly8gaWYgaU9TIHVzZXJcblx0XHRpZiAoaW9zICYmIGRhdGEuaW9zKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR1cmw6IGBmbGlja3I6Ly9waG90b3MvJHtkYXRhLnVzZXJuYW1lfT9gXG5cdFx0XHR9O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR1cmw6IGBodHRwOi8vd3d3LmZsaWNrci5jb20vcGhvdG9zLyR7ZGF0YS51c2VybmFtZX0/YCxcblx0XHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0XHR3aWR0aDogNjAwLFxuXHRcdFx0XHRcdGhlaWdodDogNjUwXG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0fVxuXHR9LFxuXG5cdC8vIHNldCBXaGF0c0FwcCBzaGFyZSBVUkxcblx0d2hhdHNhcHAgKGRhdGEpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiAnd2hhdHNhcHA6Ly9zZW5kPycsXG5cdFx0XHRkYXRhOiBkYXRhXG5cdFx0fTtcblx0fSxcblxuXHQvLyBzZXQgc21zIHNoYXJlIFVSTFxuXHRzbXMgKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybDogaW9zID8gJ3NtczomJyA6ICdzbXM6PycsXG5cdFx0XHRkYXRhOiBkYXRhXG5cdFx0fTtcblx0fSxcblxuXHQvLyBzZXQgRW1haWwgc2hhcmUgVVJMXG5cdGVtYWlsIChkYXRhKSB7XG5cblx0XHR2YXIgdXJsID0gYG1haWx0bzpgO1xuXG5cdFx0Ly8gaWYgdG8gYWRkcmVzcyBzcGVjaWZpZWQgdGhlbiBhZGQgdG8gVVJMXG5cdFx0aWYgKGRhdGEudG8gIT09IG51bGwpIHtcblx0XHRcdHVybCArPSBgJHtkYXRhLnRvfWA7XG5cdFx0fVxuXG5cdFx0dXJsICs9IGA/YDtcblxuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6IHVybCxcblx0XHRcdGRhdGE6IHtcblx0XHRcdFx0c3ViamVjdDogZGF0YS5zdWJqZWN0LFxuXHRcdFx0XHRib2R5OiBkYXRhLmJvZHlcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBHaXRodWIgZm9yayBVUkxcblx0Z2l0aHViIChkYXRhLCBpb3MgPSBmYWxzZSkge1xuXHRcdGxldCB1cmwgPSBkYXRhLnJlcG8gP1xuXHRcdFx0YGh0dHBzOi8vZ2l0aHViLmNvbS8ke2RhdGEucmVwb31gIDpcblx0XHRcdGRhdGEudXJsO1xuXG5cdFx0aWYgKGRhdGEuaXNzdWUpIHtcblx0XHRcdHVybCArPSAnL2lzc3Vlcy9uZXc/dGl0bGU9JyArXG5cdFx0XHRcdGRhdGEuaXNzdWUgK1xuXHRcdFx0XHQnJmJvZHk9JyArXG5cdFx0XHRcdGRhdGEuYm9keTtcblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiB1cmwgKyAnPycsXG5cdFx0XHRwb3B1cDoge1xuXHRcdFx0XHR3aWR0aDogMTAyMCxcblx0XHRcdFx0aGVpZ2h0OiAzMjNcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBEcmliYmJsZSBzaGFyZSBVUkxcblx0ZHJpYmJibGUgKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG5cdFx0Y29uc3QgdXJsID0gZGF0YS5zaG90ID9cblx0XHRcdGBodHRwczovL2RyaWJiYmxlLmNvbS9zaG90cy8ke2RhdGEuc2hvdH0/YCA6XG5cdFx0XHRkYXRhLnVybCArICc/Jztcblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiB1cmwsXG5cdFx0XHRwb3B1cDoge1xuXHRcdFx0XHR3aWR0aDogNDQwLFxuXHRcdFx0XHRoZWlnaHQ6IDY0MFxuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Y29kZXBlbiAoZGF0YSkge1xuXHRcdGNvbnN0IHVybCA9IChkYXRhLnBlbiAmJiBkYXRhLnVzZXJuYW1lICYmIGRhdGEudmlldykgP1xuXHRcdFx0YGh0dHBzOi8vY29kZXBlbi5pby8ke2RhdGEudXNlcm5hbWV9LyR7ZGF0YS52aWV3fS8ke2RhdGEucGVufT9gIDpcblx0XHRcdGRhdGEudXJsICsgJz8nO1xuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6IHVybCxcblx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdHdpZHRoOiAxMjAwLFxuXHRcdFx0XHRoZWlnaHQ6IDgwMFxuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0cGF5cGFsIChkYXRhKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGRhdGE6IGRhdGFcblx0XHR9O1xuXHR9XG59O1xuIiwidmFyIE9wZW5TaGFyZSA9IHtcblx0c2hhcmU6IHJlcXVpcmUoJy4uL3NoYXJlLmpzJyksXG5cdGNvdW50OiByZXF1aXJlKCcuLi9jb3VudC5qcycpLFxuXHRhbmFseXRpY3M6IHJlcXVpcmUoJy4uL2FuYWx5dGljcy5qcycpXG59O1xuXG5PcGVuU2hhcmUuYW5hbHl0aWNzKCd0YWdNYW5hZ2VyJywgZnVuY3Rpb24gKCkge1xuICBjb25zb2xlLmxvZygndGFnIG1hbmFnZXIgbG9hZGVkJyk7XG59KTtcblxuT3BlblNoYXJlLmFuYWx5dGljcygnZXZlbnQnLCBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdnb29nbGUgYW5hbHl0aWNzIGV2ZW50cyBsb2FkZWQnKTtcbn0pO1xuXG5PcGVuU2hhcmUuYW5hbHl0aWNzKCdzb2NpYWwnLCBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdnb29nbGUgYW5hbHl0aWNzIHNvY2lhbCBsb2FkZWQnKTtcbn0pO1xuXG52YXIgZHluYW1pY05vZGVEYXRhID0ge1xuXHQndXJsJzogJ2h0dHA6Ly93d3cuZGlnaXRhbHN1cmdlb25zLmNvbScsXG5cdCd2aWEnOiAnZGlnaXRhbHN1cmdlb25zJyxcblx0J3RleHQnOiAnRm9yd2FyZCBPYnNlc3NlZCcsXG5cdCdoYXNodGFncyc6ICdmb3J3YXJkb2JzZXNzZWQnLFxuXHQnYnV0dG9uJzogJ09wZW4gU2hhcmUgV2F0Y2hlciEnXG59O1xuXG5mdW5jdGlvbiBjcmVhdGVPcGVuU2hhcmVOb2RlKGRhdGEpIHtcblx0dmFyIG9wZW5TaGFyZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcblxuXHRvcGVuU2hhcmUuY2xhc3NMaXN0LmFkZCgnb3Blbi1zaGFyZS1saW5rJywgJ3R3aXR0ZXInKTtcblx0b3BlblNoYXJlLnNldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlJywgJ3R3aXR0ZXInKTtcblx0b3BlblNoYXJlLnNldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXVybCcsIGRhdGEudXJsKTtcblx0b3BlblNoYXJlLnNldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXZpYScsIGRhdGEudmlhKTtcblx0b3BlblNoYXJlLnNldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXRleHQnLCBkYXRhLnRleHQpO1xuXHRvcGVuU2hhcmUuc2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtaGFzaHRhZ3MnLCBkYXRhLmhhc2h0YWdzKTtcblx0b3BlblNoYXJlLmlubmVySFRNTCA9ICc8c3BhbiBjbGFzcz1cImZhIGZhLXR3aXR0ZXJcIj48L3NwYW4+JyArIGRhdGEuYnV0dG9uO1xuXG5cdHZhciBub2RlID0gbmV3IE9wZW5TaGFyZS5zaGFyZSh7XG5cdFx0dHlwZTogJ3R3aXR0ZXInLFxuXHRcdHVybDogJ2h0dHA6Ly93d3cuZGlnaXRhbHN1cmdlb25zLmNvbScsXG5cdFx0dmlhOiAnZGlnaXRhbHN1cmdlb25zJyxcblx0XHRoYXNodGFnczogJ2ZvcndhcmRvYnNlc3NlZCcsXG5cdFx0YXBwZW5kVG86IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5vcGVuLXNoYXJlLXdhdGNoJyksXG5cdFx0aW5uZXJIVE1MOiAnQ3JlYXRlZCB2aWEgT3BlblNoYXJlQVBJJyxcblx0XHRlbGVtZW50OiAnZGl2Jyxcblx0XHRjbGFzc2VzOiBbJ3dvdycsICdzdWNoJywgJ2NsYXNzZXMnXVxuXHR9KTtcblxuXHRyZXR1cm4gb3BlblNoYXJlO1xufVxuXG5mdW5jdGlvbiBhZGROb2RlKCkge1xuXHR2YXIgZGF0YSA9IGR5bmFtaWNOb2RlRGF0YTtcblx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLm9wZW4tc2hhcmUtd2F0Y2gnKVxuXHRcdC5hcHBlbmRDaGlsZChjcmVhdGVPcGVuU2hhcmVOb2RlKGRhdGEpKTtcbn1cblxud2luZG93LmFkZE5vZGUgPSBhZGROb2RlO1xuXG5mdW5jdGlvbiBhZGROb2RlV2l0aENvdW50KCkge1xuXHR2YXIgZGF0YSA9IGR5bmFtaWNOb2RlRGF0YTtcblxuXHRuZXcgT3BlblNoYXJlLmNvdW50KHtcblx0XHR0eXBlOiAnZmFjZWJvb2snLFxuXHRcdHVybDogJ2h0dHBzOi8vd3d3LmRpZ2l0YWxzdXJnZW9ucy5jb20vJ1xuXHR9LCBmdW5jdGlvbiAobm9kZSkge1xuXHRcdHZhciBvcyA9IG5ldyBPcGVuU2hhcmUuc2hhcmUoe1xuXHRcdCAgdHlwZTogJ3R3aXR0ZXInLFxuXHRcdCAgdXJsOiAnaHR0cDovL3d3dy5kaWdpdGFsc3VyZ2VvbnMuY29tJyxcblx0XHQgIHZpYTogJ2RpZ2l0YWxzdXJnZW9ucycsXG5cdFx0ICBoYXNodGFnczogJ2ZvcndhcmRvYnNlc3NlZCcsXG5cdFx0ICBpbm5lckhUTUw6ICdDcmVhdGVkIHZpYSBPcGVuU2hhcmVBUEknLFxuXHRcdCAgZWxlbWVudDogJ2RpdicsXG5cdFx0ICBjbGFzc2VzOiBbJ3dvdycsICdzdWNoJywgJ2NsYXNzZXMnXVxuXHQgIH0pO1xuXHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5jcmVhdGUtbm9kZS53LWNvdW50Jylcblx0XHQgIC5hcHBlbmRDaGlsZChvcyk7XG5cdFx0ICBvcy5hcHBlbmRDaGlsZChub2RlKTtcblx0fSk7XG59XG5cbndpbmRvdy5hZGROb2RlV2l0aENvdW50ID0gYWRkTm9kZVdpdGhDb3VudDtcblxuZnVuY3Rpb24gY3JlYXRlQ291bnROb2RlKCkge1xuIFx0dmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5jcmVhdGUtbm9kZS5jb3VudC1ub2RlcycpO1xuXHR2YXIgdHlwZSA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdpbnB1dC5jb3VudC10eXBlJykudmFsdWU7XG5cdHZhciB1cmwgPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignaW5wdXQuY291bnQtdXJsJykudmFsdWU7XG5cblx0bmV3IE9wZW5TaGFyZS5jb3VudCh7XG5cdFx0dHlwZTogdHlwZSxcblx0XHR1cmw6IHVybCxcblx0XHRhcHBlbmRUbzogY29udGFpbmVyLFxuXHRcdGNsYXNzZXM6IFsndGVzdCddXG5cdH0sIGZ1bmN0aW9uIChub2RlKSB7XG5cdFx0bm9kZS5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG5cdH0pO1xuXG5cblx0Y29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0LmNvdW50LXR5cGUnKS52YWx1ZSA9ICcnO1xuXHRjb250YWluZXIucXVlcnlTZWxlY3RvcignaW5wdXQuY291bnQtdXJsJykudmFsdWUgPSAnJztcbn1cblxud2luZG93LmNyZWF0ZUNvdW50Tm9kZSA9IGNyZWF0ZUNvdW50Tm9kZTtcblxuLy8gdGVzdCBKUyBPcGVuU2hhcmUgQVBJIHdpdGggZGFzaGVzXG5cbm5ldyBPcGVuU2hhcmUuc2hhcmUoe1xuXHR0eXBlOiAnZ29vZ2xlTWFwcycsXG5cdGNlbnRlcjogJzQwLjc2NTgxOSwtNzMuOTc1ODY2Jyxcblx0dmlldzogJ3RyYWZmaWMnLFxuXHR6b29tOiAxNCxcblx0YXBwZW5kVG86IGRvY3VtZW50LmJvZHksXG5cdGlubmVySFRNTDogJ01hcHMnXG59KTtcblxubmV3IE9wZW5TaGFyZS5zaGFyZSh7XG5cdHR5cGU6ICd0d2l0dGVyLWZvbGxvdycsXG5cdHNjcmVlbk5hbWU6ICdkaWdpdGFsc3VyZ2VvbnMnLFxuXHR1c2VySWQ6ICcxODE4OTEzMCcsXG5cdGFwcGVuZFRvOiBkb2N1bWVudC5ib2R5LFxuXHRpbm5lckhUTUw6ICdGb2xsb3cgVGVzdCdcbn0pO1xuXG4vLyB0ZXN0IFBheVBhbFxubmV3IE9wZW5TaGFyZS5zaGFyZSh7XG5cdHR5cGU6ICdwYXlwYWwnLFxuXHRidXR0b25JZDogJzJQM1JKWUVGTDdaNjInLFxuXHRzYW5kYm94OiB0cnVlLFxuXHRhcHBlbmRUbzogZG9jdW1lbnQuYm9keSxcblx0aW5uZXJIVE1MOiAnUGF5UGFsIFRlc3QnXG59KTtcblxuLy8gYmluZCB0byBjb3VudCBsb2FkZWQgZXZlbnRcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ09wZW5TaGFyZS5jb3VudC1sb2FkZWQnLCBmdW5jdGlvbigpIHtcblx0Y29uc29sZS5sb2coJ09wZW5TaGFyZSAoY291bnQpIGxvYWRlZCcpO1xufSk7XG5cbi8vIGJpbmQgdG8gc2hhcmUgbG9hZGVkIGV2ZW50XG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdPcGVuU2hhcmUuc2hhcmUtbG9hZGVkJywgZnVuY3Rpb24oKSB7XG5cdGNvbnNvbGUubG9nKCdPcGVuU2hhcmUgKHNoYXJlKSBsb2FkZWQnKTtcblxuXHQvLyBiaW5kIHRvIHNoYXJlZCBldmVudCBvbiBlYWNoIGluZGl2aWR1YWwgbm9kZVxuXHRbXS5mb3JFYWNoLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtb3Blbi1zaGFyZV0nKSwgZnVuY3Rpb24obm9kZSkge1xuXHRcdG5vZGUuYWRkRXZlbnRMaXN0ZW5lcignT3BlblNoYXJlLnNoYXJlZCcsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdGNvbnNvbGUubG9nKCdPcGVuIFNoYXJlIFNoYXJlZCcsIGUpO1xuXHRcdH0pO1xuXHR9KTtcblxuXHR2YXIgZXhhbXBsZXMgPSB7XG5cdFx0dHdpdHRlcjogbmV3IE9wZW5TaGFyZS5zaGFyZSh7XG5cdFx0XHR0eXBlOiAndHdpdHRlcicsXG5cdFx0XHRiaW5kQ2xpY2s6IHRydWUsXG5cdFx0XHR1cmw6ICdodHRwOi8vZGlnaXRhbHN1cmdlb25zLmNvbScsXG5cdFx0XHR2aWE6ICdkaWdpdGFsc3VyZ2VvbnMnLFxuXHRcdFx0dGV4dDogJ0RpZ2l0YWwgU3VyZ2VvbnMnLFxuXHRcdFx0aGFzaHRhZ3M6ICdmb3J3YXJkb2JzZXNzZWQnXG5cdFx0fSwgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignW2RhdGEtYXBpLWV4YW1wbGU9XCJ0d2l0dGVyXCJdJykpLFxuXG5cdFx0ZmFjZWJvb2s6IG5ldyBPcGVuU2hhcmUuc2hhcmUoe1xuXHRcdFx0dHlwZTogJ2ZhY2Vib29rJyxcblx0XHRcdGJpbmRDbGljazogdHJ1ZSxcblx0XHRcdGxpbms6ICdodHRwOi8vZGlnaXRhbHN1cmdlb25zLmNvbScsXG5cdFx0XHRwaWN0dXJlOiAnaHR0cDovL3d3dy5kaWdpdGFsc3VyZ2VvbnMuY29tL2ltZy9hYm91dC9iZ19vZmZpY2VfdGVhbS5qcGcnLFxuXHRcdFx0Y2FwdGlvbjogJ0RpZ2l0YWwgU3VyZ2VvbnMnLFxuXHRcdFx0ZGVzY3JpcHRpb246ICdmb3J3YXJkb2JzZXNzZWQnXG5cdFx0fSwgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignW2RhdGEtYXBpLWV4YW1wbGU9XCJmYWNlYm9va1wiXScpKSxcblxuXHRcdHBpbnRlcmVzdDogbmV3IE9wZW5TaGFyZS5zaGFyZSh7XG5cdFx0XHR0eXBlOiAncGludGVyZXN0Jyxcblx0XHRcdGJpbmRDbGljazogdHJ1ZSxcblx0XHRcdHVybDogJ2h0dHA6Ly9kaWdpdGFsc3VyZ2VvbnMuY29tJyxcblx0XHRcdG1lZGlhOiAnaHR0cDovL3d3dy5kaWdpdGFsc3VyZ2VvbnMuY29tL2ltZy9hYm91dC9iZ19vZmZpY2VfdGVhbS5qcGcnLFxuXHRcdFx0ZGVzY3JpcHRpb246ICdEaWdpdGFsIFN1cmdlb25zJyxcblx0XHRcdGFwcGVuZFRvOiBkb2N1bWVudC5ib2R5XG5cdFx0fSwgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignW2RhdGEtYXBpLWV4YW1wbGU9XCJwaW50ZXJlc3RcIl0nKSksXG5cblx0XHRlbWFpbDogbmV3IE9wZW5TaGFyZS5zaGFyZSh7XG5cdFx0XHR0eXBlOiAnZW1haWwnLFxuXHRcdFx0YmluZENsaWNrOiB0cnVlLFxuXHRcdFx0dG86ICd0ZWNocm9vbUBkaWdpdGFsc3VyZ2VvbnMuY29tJyxcblx0XHRcdHN1YmplY3Q6ICdEaWdpdGFsIFN1cmdlb25zJyxcblx0XHRcdGJvZHk6ICdGb3J3YXJkIE9ic2Vzc2VkJ1xuXHRcdH0sIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLWFwaS1leGFtcGxlPVwiZW1haWxcIl0nKSlcblx0fTtcbn0pO1xuXG4vLyBFeGFtcGxlIG9mIGxpc3RlbmluZyBmb3IgY291bnRlZCBldmVudHMgb24gaW5kaXZpZHVhbCB1cmxzIG9yIGFycmF5cyBvZiB1cmxzXG52YXIgdXJscyA9IFtcblx0J2ZhY2Vib29rJyxcblx0J2dvb2dsZScsXG5cdCdsaW5rZWRpbicsXG5cdCdyZWRkaXQnLFxuXHQncGludGVyZXN0Jyxcblx0W1xuXHRcdCdnb29nbGUnLFxuXHRcdCdsaW5rZWRpbicsXG5cdFx0J3JlZGRpdCcsXG5cdFx0J3BpbnRlcmVzdCdcblx0XVxuXTtcblxudXJscy5mb3JFYWNoKGZ1bmN0aW9uKHVybCkge1xuXHRpZiAoQXJyYXkuaXNBcnJheSh1cmwpKSB7XG5cdFx0dXJsID0gdXJsLmpvaW4oJywnKTtcblx0fVxuXHR2YXIgY291bnROb2RlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtb3Blbi1zaGFyZS1jb3VudD1cIicgKyB1cmwgKyAnXCJdJyk7XG5cblx0W10uZm9yRWFjaC5jYWxsKGNvdW50Tm9kZSwgZnVuY3Rpb24obm9kZSkge1xuXHRcdG5vZGUuYWRkRXZlbnRMaXN0ZW5lcignT3BlblNoYXJlLmNvdW50ZWQtJyArIHVybCwgZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgY291bnRzID0gbm9kZS5pbm5lckhUTUw7XG5cdFx0XHRpZiAoY291bnRzKSBjb25zb2xlLmxvZyh1cmwsICdzaGFyZXM6ICcsIGNvdW50cyk7XG5cdFx0fSk7XG5cdH0pO1xufSk7XG5cbi8vIHRlc3QgdHdpdHRlciBjb3VudCBqcyBhcGlcbm5ldyBPcGVuU2hhcmUuY291bnQoe1xuXHR0eXBlOiAndHdpdHRlcicsXG5cdHVybDogJ2h0dHBzOi8vd3d3LmRpZ2l0YWxzdXJnZW9ucy5jb20vdGhvdWdodHMvdGVjaG5vbG9neS90aGUtYmxvY2tjaGFpbi1yZXZvbHV0aW9uLycsXG5cdGtleTogJ29zQVBJS2V5J1xufSwgZnVuY3Rpb24gKG5vZGUpIHtcblx0dmFyIG9zID0gbmV3IE9wZW5TaGFyZS5zaGFyZSh7XG5cdCAgdHlwZTogJ3R3aXR0ZXInLFxuXHQgIHVybDogJ2h0dHBzOi8vd3d3LmRpZ2l0YWxzdXJnZW9ucy5jb20vdGhvdWdodHMvdGVjaG5vbG9neS90aGUtYmxvY2tjaGFpbi1yZXZvbHV0aW9uLycsXG5cdCAgdmlhOiAnZGlnaXRhbHN1cmdlb25zJyxcblx0ICBoYXNodGFnczogJ2ZvcndhcmRvYnNlc3NlZCwgYmxvY2tjaGFpbicsXG5cdCAgYXBwZW5kVG86IGRvY3VtZW50LmJvZHksXG5cdCAgaW5uZXJIVE1MOiAnQkxPQ0tDSEFJTidcblx0fSk7XG5cdG9zLmFwcGVuZENoaWxkKG5vZGUpO1xufSk7XG4iXX0=
