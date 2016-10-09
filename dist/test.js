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
		key: osElement.getAttribute('data-open-share-key')
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
		if (key) countNode.setAttribute('data-open-share-key', key);

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
				var fb = JSON.parse(xhr.responseText);

				var count = fb.share && fb.share.share_count || 0;

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
			this.key = this.os.getAttribute('data-open-share-key');

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

			countData.url = countData.url.startsWith('https://api.openshare.social/job?') && this.key ? countData.url + this.key : countData.url;

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
			var count = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

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
		var ios = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

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
		var ios = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

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
		var ios = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

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
		var ios = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

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
		var ios = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

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
		var ios = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

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
		var ios = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

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
		var ios = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;


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
		var ios = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

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
		var ios = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

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
		var ios = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

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
		var ios = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

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
  url: 'http://www.digitalsurgeons.com',
  via: 'digitalsurgeons',
  text: 'Forward Obsessed',
  hashtags: 'forwardobsessed',
  button: 'Open Share Watcher!'
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

  var node = new OpenShare.share({ //eslint-disable-line
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
  new OpenShare.count({ //eslint-disable-line
    type: 'facebook',
    url: 'https://www.digitalsurgeons.com/'
  }, function (node) {
    var os = new OpenShare.share({ //eslint-disable-line
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

  new OpenShare.count({ //eslint-disable-line
    type: type, //eslint-disable-line
    url: url, //eslint-disable-line
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
new OpenShare.share({ //eslint-disable-line
  type: 'googleMaps',
  center: '40.765819,-73.975866',
  view: 'traffic',
  zoom: 14,
  appendTo: document.body,
  innerHTML: 'Maps'
});

new OpenShare.share({ //eslint-disable-line
  type: 'twitter-follow',
  screenName: 'digitalsurgeons',
  userId: '18189130',
  appendTo: document.body,
  innerHTML: 'Follow Test'
});

// test PayPal
new OpenShare.share({ //eslint-disable-line
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
    twitter: new OpenShare.share({ //eslint-disable-line
      type: 'twitter',
      bindClick: true,
      url: 'http://digitalsurgeons.com',
      via: 'digitalsurgeons',
      text: 'Digital Surgeons',
      hashtags: 'forwardobsessed'
    }, document.querySelector('[data-api-example="twitter"]')),

    facebook: new OpenShare.share({ //eslint-disable-line
      type: 'facebook',
      bindClick: true,
      link: 'http://digitalsurgeons.com',
      picture: 'http://www.digitalsurgeons.com/img/about/bg_office_team.jpg',
      caption: 'Digital Surgeons',
      description: 'forwardobsessed'
    }, document.querySelector('[data-api-example="facebook"]')),

    pinterest: new OpenShare.share({ //eslint-disable-line
      type: 'pinterest',
      bindClick: true,
      url: 'http://digitalsurgeons.com',
      media: 'http://www.digitalsurgeons.com/img/about/bg_office_team.jpg',
      description: 'Digital Surgeons',
      appendTo: document.body
    }, document.querySelector('[data-api-example="pinterest"]')),

    email: new OpenShare.share({ //eslint-disable-line
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
new OpenShare.count({ //eslint-disable-line
  type: 'twitter',
  url: 'https://www.digitalsurgeons.com/thoughts/technology/the-blockchain-revolution',
  key: 'dstweets'
}, function (node) {
  var os = new OpenShare.share({ //eslint-disable-line
    type: 'twitter',
    url: 'https://www.digitalsurgeons.com/thoughts/technology/the-blockchain-revolution',
    via: 'digitalsurgeons',
    hashtags: 'forwardobsessed, blockchain',
    appendTo: document.body,
    innerHTML: 'BLOCKCHAIN'
  });
  os.appendChild(node);
});

},{"../analytics.js":1,"../count.js":2,"../share.js":13}]},{},[21])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiYW5hbHl0aWNzLmpzIiwiY291bnQuanMiLCJsaWIvY291bnRSZWR1Y2UuanMiLCJsaWIvZGFzaFRvQ2FtZWwuanMiLCJsaWIvaW5pdC5qcyIsImxpYi9pbml0aWFsaXplQ291bnROb2RlLmpzIiwibGliL2luaXRpYWxpemVOb2Rlcy5qcyIsImxpYi9pbml0aWFsaXplU2hhcmVOb2RlLmpzIiwibGliL2luaXRpYWxpemVXYXRjaGVyLmpzIiwibGliL3NldERhdGEuanMiLCJsaWIvc2hhcmUuanMiLCJsaWIvc3RvcmVDb3VudC5qcyIsInNoYXJlLmpzIiwic3JjL21vZHVsZXMvY291bnQtYXBpLmpzIiwic3JjL21vZHVsZXMvY291bnQtdHJhbnNmb3Jtcy5qcyIsInNyYy9tb2R1bGVzL2NvdW50LmpzIiwic3JjL21vZHVsZXMvZXZlbnRzLmpzIiwic3JjL21vZHVsZXMvb3Blbi1zaGFyZS5qcyIsInNyYy9tb2R1bGVzL3NoYXJlLWFwaS5qcyIsInNyYy9tb2R1bGVzL3NoYXJlLXRyYW5zZm9ybXMuanMiLCJzcmMvdGVzdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsT0FBTyxPQUFQLEdBQWlCLFVBQVUsSUFBVixFQUFnQixFQUFoQixFQUFvQjtBQUNwQyxLQUFNLE9BQU8sU0FBUyxPQUFULElBQW9CLFNBQVMsUUFBMUM7QUFDQSxLQUFNLGVBQWUsU0FBUyxZQUE5Qjs7QUFFQSxLQUFJLElBQUosRUFBVSx1QkFBdUIsSUFBdkIsRUFBNkIsRUFBN0I7QUFDVixLQUFJLFlBQUosRUFBa0IsY0FBYyxFQUFkO0FBQ2xCLENBTkQ7O0FBUUEsU0FBUyxzQkFBVCxDQUFnQyxJQUFoQyxFQUFzQyxFQUF0QyxFQUEwQztBQUN6QyxLQUFJLE9BQU8sRUFBWCxFQUFlO0FBQ1osTUFBSSxFQUFKLEVBQVE7QUFDUjtBQUNBLFNBQU8sVUFB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QVQsQ0FBTjtBQUNEO0FBQ0QsTUFBTSxZQUFZLFNBQVMsZ0JBQVQsOEJBQXFELEdBQXJELFFBQWxCOztBQUVBLEtBQUcsT0FBSCxDQUFXLElBQVgsQ0FBZ0IsU0FBaEIsRUFBMkIsVUFBQyxJQUFELEVBQVU7QUFDbkMsU0FBSyxnQkFBTCx3QkFBMkMsR0FBM0MsRUFBa0QsWUFBTTtBQUN0RCxVQUFNLFNBQVMsS0FBSyxTQUFwQjtBQUNBLFVBQUksTUFBSixFQUFZLFFBQVEsR0FBUixDQUFZLEdBQVosRUFBaUIsVUFBakIsRUFBNkIsTUFBN0I7QUFDYixLQUhEO0FBSUQsR0FMRDtBQU1ELENBWkQ7O0FBY0E7QUFDQSxJQUFJLFVBQVUsS0FBZCxDQUFvQixFQUFFO0FBQ3BCLFFBQU0sU0FEWTtBQUVsQixPQUFLLCtFQUZhO0FBR2xCLE9BQUs7QUFIYSxDQUFwQixFQUlHLFVBQUMsSUFBRCxFQUFVO0FBQ1gsTUFBTSxLQUFLLElBQUksVUFBVSxLQUFkLENBQW9CLEVBQUU7QUFDL0IsVUFBTSxTQUR1QjtBQUU3QixTQUFLLCtFQUZ3QjtBQUc3QixTQUFLLGlCQUh3QjtBQUk3QixjQUFVLDZCQUptQjtBQUs3QixjQUFVLFNBQVMsSUFMVTtBQU03QixlQUFXO0FBTmtCLEdBQXBCLENBQVg7QUFRQSxLQUFHLFdBQUgsQ0FBZSxJQUFmO0FBQ0QsQ0FkRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICh0eXBlLCBjYikge1xuXHRjb25zdCBpc0dBID0gdHlwZSA9PT0gJ2V2ZW50JyB8fCB0eXBlID09PSAnc29jaWFsJztcblx0Y29uc3QgaXNUYWdNYW5hZ2VyID0gdHlwZSA9PT0gJ3RhZ01hbmFnZXInO1xuXG5cdGlmIChpc0dBKSBjaGVja0lmQW5hbHl0aWNzTG9hZGVkKHR5cGUsIGNiKTtcblx0aWYgKGlzVGFnTWFuYWdlcikgc2V0VGFnTWFuYWdlcihjYik7XG59O1xuXG5mdW5jdGlvbiBjaGVja0lmQW5hbHl0aWNzTG9hZGVkKHR5cGUsIGNiKSB7XG5cdGlmICh3aW5kb3cuZ2EpIHtcblx0XHQgIGlmIChjYikgY2IoKTtcblx0XHQgIC8vIGJpbmQgdG8gc2hhcmVkIGV2ZW50IG9uIGVhY2ggaW5kaXZpZHVhbCBub2RlXG5cdFx0ICBsaXN0ZW4oZnVuY3Rpb24gKGUpIHtcblx0XHRcdGNvbnN0IHBsYXRmb3JtID0gZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUnKTtcblx0XHRcdGNvbnN0IHRhcmdldCA9IGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWxpbmsnKSB8fFxuXHRcdFx0XHRlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS11cmwnKSB8fFxuXHRcdFx0XHRlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS11c2VybmFtZScpIHx8XG5cdFx0XHQgICAgZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY2VudGVyJykgfHxcblx0XHRcdFx0ZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtc2VhcmNoJykgfHxcblx0XHRcdFx0ZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtYm9keScpO1xuXG5cdFx0XHRpZiAodHlwZSA9PT0gJ2V2ZW50Jykge1xuXHRcdFx0XHRnYSgnc2VuZCcsICdldmVudCcsIHtcblx0XHRcdFx0XHRldmVudENhdGVnb3J5OiAnT3BlblNoYXJlIENsaWNrJyxcblx0XHRcdFx0XHRldmVudEFjdGlvbjogcGxhdGZvcm0sXG5cdFx0XHRcdFx0ZXZlbnRMYWJlbDogdGFyZ2V0LFxuXHRcdFx0XHRcdHRyYW5zcG9ydDogJ2JlYWNvbidcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmICh0eXBlID09PSAnc29jaWFsJykge1xuXHRcdFx0XHRnYSgnc2VuZCcsIHtcblx0XHRcdFx0XHRoaXRUeXBlOiAnc29jaWFsJyxcblx0XHRcdFx0XHRzb2NpYWxOZXR3b3JrOiBwbGF0Zm9ybSxcblx0XHRcdFx0XHRzb2NpYWxBY3Rpb246ICdzaGFyZScsXG5cdFx0XHRcdFx0c29jaWFsVGFyZ2V0OiB0YXJnZXRcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0fVxuXHRlbHNlIHtcblx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcblx0XHRcdGNoZWNrSWZBbmFseXRpY3NMb2FkZWQodHlwZSwgY2IpO1xuXHQgIFx0fSwgMTAwMCk7XG5cdH1cbn1cblxuZnVuY3Rpb24gc2V0VGFnTWFuYWdlciAoY2IpIHtcblxuXHRpZiAod2luZG93LmRhdGFMYXllciAmJiB3aW5kb3cuZGF0YUxheWVyWzBdWydndG0uc3RhcnQnXSkge1xuXHRcdGlmIChjYikgY2IoKTtcblxuXHRcdGxpc3RlbihvblNoYXJlVGFnTWFuZ2VyKTtcblxuXHRcdGdldENvdW50cyhmdW5jdGlvbihlKSB7XG5cdFx0XHRjb25zdCBjb3VudCA9IGUudGFyZ2V0ID9cblx0XHRcdCAgZS50YXJnZXQuaW5uZXJIVE1MIDpcblx0XHRcdCAgZS5pbm5lckhUTUw7XG5cblx0XHRcdGNvbnN0IHBsYXRmb3JtID0gZS50YXJnZXQgP1xuXHRcdFx0ICAgZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY291bnQtdXJsJykgOlxuXHRcdFx0ICAgZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudC11cmwnKTtcblxuXHRcdFx0d2luZG93LmRhdGFMYXllci5wdXNoKHtcblx0XHRcdFx0J2V2ZW50JyA6ICdPcGVuU2hhcmUgQ291bnQnLFxuXHRcdFx0XHQncGxhdGZvcm0nOiBwbGF0Zm9ybSxcblx0XHRcdFx0J3Jlc291cmNlJzogY291bnQsXG5cdFx0XHRcdCdhY3Rpdml0eSc6ICdjb3VudCdcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9IGVsc2Uge1xuXHRcdHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXHRcdFx0c2V0VGFnTWFuYWdlcihjYik7XG5cdFx0fSwgMTAwMCk7XG5cdH1cbn1cblxuZnVuY3Rpb24gbGlzdGVuIChjYikge1xuXHQvLyBiaW5kIHRvIHNoYXJlZCBldmVudCBvbiBlYWNoIGluZGl2aWR1YWwgbm9kZVxuXHRbXS5mb3JFYWNoLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtb3Blbi1zaGFyZV0nKSwgZnVuY3Rpb24obm9kZSkge1xuXHRcdG5vZGUuYWRkRXZlbnRMaXN0ZW5lcignT3BlblNoYXJlLnNoYXJlZCcsIGNiKTtcblx0fSk7XG59XG5cbmZ1bmN0aW9uIGdldENvdW50cyAoY2IpIHtcblx0dmFyIGNvdW50Tm9kZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLW9wZW4tc2hhcmUtY291bnRdJyk7XG5cblx0W10uZm9yRWFjaC5jYWxsKGNvdW50Tm9kZSwgZnVuY3Rpb24obm9kZSkge1xuXHRcdGlmIChub2RlLnRleHRDb250ZW50KSBjYihub2RlKTtcblx0XHRlbHNlIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcignT3BlblNoYXJlLmNvdW50ZWQtJyArIG5vZGUuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY291bnQtdXJsJyksIGNiKTtcblx0fSk7XG59XG5cbmZ1bmN0aW9uIG9uU2hhcmVUYWdNYW5nZXIgKGUpIHtcblx0Y29uc3QgcGxhdGZvcm0gPSBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZScpO1xuXHRjb25zdCB0YXJnZXQgPSBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1saW5rJykgfHxcblx0XHRlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS11cmwnKSB8fFxuXHRcdGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXVzZXJuYW1lJykgfHxcblx0XHRlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jZW50ZXInKSB8fFxuXHRcdGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXNlYXJjaCcpIHx8XG5cdFx0ZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtYm9keScpO1xuXG5cdHdpbmRvdy5kYXRhTGF5ZXIucHVzaCh7XG5cdFx0J2V2ZW50JyA6ICdPcGVuU2hhcmUgU2hhcmUnLFxuXHRcdCdwbGF0Zm9ybSc6IHBsYXRmb3JtLFxuXHRcdCdyZXNvdXJjZSc6IHRhcmdldCxcblx0XHQnYWN0aXZpdHknOiAnc2hhcmUnXG5cdH0pO1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7XG5cdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCByZXF1aXJlKCcuL2xpYi9pbml0Jykoe1xuXHRcdGFwaTogJ2NvdW50Jyxcblx0XHRzZWxlY3RvcjogJ1tkYXRhLW9wZW4tc2hhcmUtY291bnRdOm5vdChbZGF0YS1vcGVuLXNoYXJlLW5vZGVdKScsXG5cdFx0Y2I6IHJlcXVpcmUoJy4vbGliL2luaXRpYWxpemVDb3VudE5vZGUnKVxuXHR9KSk7XG5cblx0cmV0dXJuIHJlcXVpcmUoJy4vc3JjL21vZHVsZXMvY291bnQtYXBpJykoKTtcbn0pKCk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGNvdW50UmVkdWNlO1xuXG5mdW5jdGlvbiByb3VuZCh4LCBwcmVjaXNpb24pIHtcblx0aWYgKHR5cGVvZiB4ICE9PSAnbnVtYmVyJykge1xuXHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIHZhbHVlIHRvIGJlIGEgbnVtYmVyJyk7XG5cdH1cblxuXHR2YXIgZXhwb25lbnQgPSBwcmVjaXNpb24gPiAwID8gJ2UnIDogJ2UtJztcblx0dmFyIGV4cG9uZW50TmVnID0gcHJlY2lzaW9uID4gMCA/ICdlLScgOiAnZSc7XG5cdHByZWNpc2lvbiA9IE1hdGguYWJzKHByZWNpc2lvbik7XG5cblx0cmV0dXJuIE51bWJlcihNYXRoLnJvdW5kKHggKyBleHBvbmVudCArIHByZWNpc2lvbikgKyBleHBvbmVudE5lZyArIHByZWNpc2lvbik7XG59XG5cbmZ1bmN0aW9uIHRob3VzYW5kaWZ5IChudW0pIHtcblx0cmV0dXJuIHJvdW5kKG51bS8xMDAwLCAxKSArICdLJztcbn1cblxuZnVuY3Rpb24gbWlsbGlvbmlmeSAobnVtKSB7XG5cdHJldHVybiByb3VuZChudW0vMTAwMDAwMCwgMSkgKyAnTSc7XG59XG5cbmZ1bmN0aW9uIGNvdW50UmVkdWNlIChlbCwgY291bnQsIGNiKSB7XG5cdGlmIChjb3VudCA+IDk5OTk5OSkgIHtcblx0XHRlbC5pbm5lckhUTUwgPSBtaWxsaW9uaWZ5KGNvdW50KTtcblx0XHRpZiAoY2IgICYmIHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykgY2IoZWwpO1xuXHR9IGVsc2UgaWYgKGNvdW50ID4gOTk5KSB7XG5cdFx0ZWwuaW5uZXJIVE1MID0gdGhvdXNhbmRpZnkoY291bnQpO1xuXHRcdGlmIChjYiAgJiYgdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSBjYihlbCk7XG5cdH0gZWxzZSB7XG5cdFx0ZWwuaW5uZXJIVE1MID0gY291bnQ7XG5cdFx0aWYgKGNiICAmJiB0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpIGNiKGVsKTtcblx0fVxufVxuIiwiLy8gdHlwZSBjb250YWlucyBhIGRhc2hcbi8vIHRyYW5zZm9ybSB0byBjYW1lbGNhc2UgZm9yIGZ1bmN0aW9uIHJlZmVyZW5jZVxuLy8gVE9ETzogb25seSBzdXBwb3J0cyBzaW5nbGUgZGFzaCwgc2hvdWxkIHNob3VsZCBzdXBwb3J0IG11bHRpcGxlXG5tb2R1bGUuZXhwb3J0cyA9IChkYXNoLCB0eXBlKSA9PiB7XG5cdGxldCBuZXh0Q2hhciA9IHR5cGUuc3Vic3RyKGRhc2ggKyAxLCAxKSxcblx0XHRncm91cCA9IHR5cGUuc3Vic3RyKGRhc2gsIDIpO1xuXG5cdHR5cGUgPSB0eXBlLnJlcGxhY2UoZ3JvdXAsIG5leHRDaGFyLnRvVXBwZXJDYXNlKCkpO1xuXHRyZXR1cm4gdHlwZTtcbn07XG4iLCJjb25zdCBpbml0aWFsaXplTm9kZXMgPSByZXF1aXJlKCcuL2luaXRpYWxpemVOb2RlcycpO1xuY29uc3QgaW5pdGlhbGl6ZVdhdGNoZXIgPSByZXF1aXJlKCcuL2luaXRpYWxpemVXYXRjaGVyJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gaW5pdDtcblxuZnVuY3Rpb24gaW5pdChvcHRzKSB7XG5cdHJldHVybiAoKSA9PiB7XG5cdFx0Y29uc3QgaW5pdE5vZGVzID0gaW5pdGlhbGl6ZU5vZGVzKHtcblx0XHRcdGFwaTogb3B0cy5hcGkgfHwgbnVsbCxcblx0XHRcdGNvbnRhaW5lcjogb3B0cy5jb250YWluZXIgfHwgZG9jdW1lbnQsXG5cdFx0XHRzZWxlY3Rvcjogb3B0cy5zZWxlY3Rvcixcblx0XHRcdGNiOiBvcHRzLmNiXG5cdFx0fSk7XG5cblx0XHRpbml0Tm9kZXMoKTtcblxuXHRcdC8vIGNoZWNrIGZvciBtdXRhdGlvbiBvYnNlcnZlcnMgYmVmb3JlIHVzaW5nLCBJRTExIG9ubHlcblx0XHRpZiAod2luZG93Lk11dGF0aW9uT2JzZXJ2ZXIgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0aW5pdGlhbGl6ZVdhdGNoZXIoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtb3Blbi1zaGFyZS13YXRjaF0nKSwgaW5pdE5vZGVzKTtcblx0XHR9XG5cdH07XG59XG4iLCJjb25zdCBDb3VudCA9IHJlcXVpcmUoJy4uL3NyYy9tb2R1bGVzL2NvdW50Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gaW5pdGlhbGl6ZUNvdW50Tm9kZTtcblxuZnVuY3Rpb24gaW5pdGlhbGl6ZUNvdW50Tm9kZShvcykge1xuXHQvLyBpbml0aWFsaXplIG9wZW4gc2hhcmUgb2JqZWN0IHdpdGggdHlwZSBhdHRyaWJ1dGVcblx0bGV0IHR5cGUgPSBvcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudCcpLFxuXHRcdHVybCA9IG9zLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50LXJlcG8nKSB8fFxuXHRcdFx0b3MuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY291bnQtc2hvdCcpIHx8XG5cdFx0XHRvcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudC11cmwnKSxcblx0XHRjb3VudCA9IG5ldyBDb3VudCh0eXBlLCB1cmwpO1xuXG5cdGNvdW50LmNvdW50KG9zKTtcblx0b3Muc2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtbm9kZScsIHR5cGUpO1xufVxuIiwiY29uc3QgRXZlbnRzID0gcmVxdWlyZSgnLi4vc3JjL21vZHVsZXMvZXZlbnRzJyk7XG5jb25zdCBhbmFseXRpY3MgPSByZXF1aXJlKCcuLi9hbmFseXRpY3MnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGluaXRpYWxpemVOb2RlcztcblxuZnVuY3Rpb24gaW5pdGlhbGl6ZU5vZGVzKG9wdHMpIHtcblx0Ly8gbG9vcCB0aHJvdWdoIG9wZW4gc2hhcmUgbm9kZSBjb2xsZWN0aW9uXG5cdHJldHVybiAoKSA9PiB7XG5cdFx0Ly8gY2hlY2sgZm9yIGFuYWx5dGljc1xuXHRcdGNoZWNrQW5hbHl0aWNzKCk7XG5cblx0XHRpZiAob3B0cy5hcGkpIHtcblx0XHRcdGxldCBub2RlcyA9IG9wdHMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwob3B0cy5zZWxlY3Rvcik7XG5cdFx0XHRbXS5mb3JFYWNoLmNhbGwobm9kZXMsIG9wdHMuY2IpO1xuXG5cdFx0XHQvLyB0cmlnZ2VyIGNvbXBsZXRlZCBldmVudFxuXHRcdFx0RXZlbnRzLnRyaWdnZXIoZG9jdW1lbnQsIG9wdHMuYXBpICsgJy1sb2FkZWQnKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gbG9vcCB0aHJvdWdoIG9wZW4gc2hhcmUgbm9kZSBjb2xsZWN0aW9uXG5cdFx0XHRsZXQgc2hhcmVOb2RlcyA9IG9wdHMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwob3B0cy5zZWxlY3Rvci5zaGFyZSk7XG5cdFx0XHRbXS5mb3JFYWNoLmNhbGwoc2hhcmVOb2Rlcywgb3B0cy5jYi5zaGFyZSk7XG5cblx0XHRcdC8vIHRyaWdnZXIgY29tcGxldGVkIGV2ZW50XG5cdFx0XHRFdmVudHMudHJpZ2dlcihkb2N1bWVudCwgJ3NoYXJlLWxvYWRlZCcpO1xuXG5cdFx0XHQvLyBsb29wIHRocm91Z2ggY291bnQgbm9kZSBjb2xsZWN0aW9uXG5cdFx0XHRsZXQgY291bnROb2RlcyA9IG9wdHMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwob3B0cy5zZWxlY3Rvci5jb3VudCk7XG5cdFx0XHRbXS5mb3JFYWNoLmNhbGwoY291bnROb2Rlcywgb3B0cy5jYi5jb3VudCk7XG5cblx0XHRcdC8vIHRyaWdnZXIgY29tcGxldGVkIGV2ZW50XG5cdFx0XHRFdmVudHMudHJpZ2dlcihkb2N1bWVudCwgJ2NvdW50LWxvYWRlZCcpO1xuXHRcdH1cblx0fTtcbn1cblxuZnVuY3Rpb24gY2hlY2tBbmFseXRpY3MgKCkge1xuXHQvLyBjaGVjayBmb3IgYW5hbHl0aWNzXG5cdGlmIChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbZGF0YS1vcGVuLXNoYXJlLWFuYWx5dGljc10nKSkge1xuXHRcdGNvbnN0IHByb3ZpZGVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignW2RhdGEtb3Blbi1zaGFyZS1hbmFseXRpY3NdJylcblx0XHRcdC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1hbmFseXRpY3MnKTtcblxuXHRcdGlmIChwcm92aWRlci5pbmRleE9mKCcsJykgPiAtMSkge1xuXHRcdFx0Y29uc3QgcHJvdmlkZXJzID0gcHJvdmlkZXIuc3BsaXQoJywnKTtcblx0XHRcdHByb3ZpZGVycy5mb3JFYWNoKHAgPT4gYW5hbHl0aWNzKHApKTtcblx0XHR9IGVsc2UgYW5hbHl0aWNzKHByb3ZpZGVyKTtcblxuXHR9XG59XG4iLCJjb25zdCBTaGFyZVRyYW5zZm9ybXMgPSByZXF1aXJlKCcuLi9zcmMvbW9kdWxlcy9zaGFyZS10cmFuc2Zvcm1zJyk7XG5jb25zdCBPcGVuU2hhcmUgPSByZXF1aXJlKCcuLi9zcmMvbW9kdWxlcy9vcGVuLXNoYXJlJyk7XG5jb25zdCBzZXREYXRhID0gcmVxdWlyZSgnLi9zZXREYXRhJyk7XG5jb25zdCBzaGFyZSA9IHJlcXVpcmUoJy4vc2hhcmUnKTtcbmNvbnN0IGRhc2hUb0NhbWVsID0gcmVxdWlyZSgnLi9kYXNoVG9DYW1lbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGluaXRpYWxpemVTaGFyZU5vZGU7XG5cbmZ1bmN0aW9uIGluaXRpYWxpemVTaGFyZU5vZGUob3MpIHtcblx0Ly8gaW5pdGlhbGl6ZSBvcGVuIHNoYXJlIG9iamVjdCB3aXRoIHR5cGUgYXR0cmlidXRlXG5cdGxldCB0eXBlID0gb3MuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUnKSxcblx0XHRkYXNoID0gdHlwZS5pbmRleE9mKCctJyksXG5cdFx0b3BlblNoYXJlO1xuXG5cdGlmIChkYXNoID4gLTEpIHtcblx0XHR0eXBlID0gZGFzaFRvQ2FtZWwoZGFzaCwgdHlwZSk7XG5cdH1cblxuXHRsZXQgdHJhbnNmb3JtID0gU2hhcmVUcmFuc2Zvcm1zW3R5cGVdO1xuXG5cdGlmICghdHJhbnNmb3JtKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKGBPcGVuIFNoYXJlOiAke3R5cGV9IGlzIGFuIGludmFsaWQgdHlwZWApO1xuXHR9XG5cblx0b3BlblNoYXJlID0gbmV3IE9wZW5TaGFyZSh0eXBlLCB0cmFuc2Zvcm0pO1xuXG5cdC8vIHNwZWNpZnkgaWYgdGhpcyBpcyBhIGR5bmFtaWMgaW5zdGFuY2Vcblx0aWYgKG9zLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWR5bmFtaWMnKSkge1xuXHRcdG9wZW5TaGFyZS5keW5hbWljID0gdHJ1ZTtcblx0fVxuXG5cdC8vIHNwZWNpZnkgaWYgdGhpcyBpcyBhIHBvcHVwIGluc3RhbmNlXG5cdGlmIChvcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1wb3B1cCcpKSB7XG5cdFx0b3BlblNoYXJlLnBvcHVwID0gdHJ1ZTtcblx0fVxuXG5cdC8vIHNldCBhbGwgb3B0aW9uYWwgYXR0cmlidXRlcyBvbiBvcGVuIHNoYXJlIGluc3RhbmNlXG5cdHNldERhdGEob3BlblNoYXJlLCBvcyk7XG5cblx0Ly8gb3BlbiBzaGFyZSBkaWFsb2cgb24gY2xpY2tcblx0b3MuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuXHRcdHNoYXJlKGUsIG9zLCBvcGVuU2hhcmUpO1xuXHR9KTtcblxuXHRvcy5hZGRFdmVudExpc3RlbmVyKCdPcGVuU2hhcmUudHJpZ2dlcicsIChlKSA9PiB7XG5cdFx0c2hhcmUoZSwgb3MsIG9wZW5TaGFyZSk7XG5cdH0pO1xuXG5cdG9zLnNldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLW5vZGUnLCB0eXBlKTtcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gaW5pdGlhbGl6ZVdhdGNoZXI7XG5cbmZ1bmN0aW9uIGluaXRpYWxpemVXYXRjaGVyKHdhdGNoZXIsIGZuKSB7XG5cdFtdLmZvckVhY2guY2FsbCh3YXRjaGVyLCAodykgPT4ge1xuXHRcdHZhciBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKChtdXRhdGlvbnMpID0+IHtcblx0XHRcdC8vIHRhcmdldCB3aWxsIG1hdGNoIGJldHdlZW4gYWxsIG11dGF0aW9ucyBzbyBqdXN0IHVzZSBmaXJzdFxuXHRcdFx0Zm4obXV0YXRpb25zWzBdLnRhcmdldCk7XG5cdFx0fSk7XG5cblx0XHRvYnNlcnZlci5vYnNlcnZlKHcsIHtcblx0XHRcdGNoaWxkTGlzdDogdHJ1ZVxuXHRcdH0pO1xuXHR9KTtcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gc2V0RGF0YTtcblxuZnVuY3Rpb24gc2V0RGF0YShvc0luc3RhbmNlLCBvc0VsZW1lbnQpIHtcblx0b3NJbnN0YW5jZS5zZXREYXRhKHtcblx0XHR1cmw6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS11cmwnKSxcblx0XHR0ZXh0OiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdGV4dCcpLFxuXHRcdHZpYTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXZpYScpLFxuXHRcdGhhc2h0YWdzOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtaGFzaHRhZ3MnKSxcblx0XHR0d2VldElkOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdHdlZXQtaWQnKSxcblx0XHRyZWxhdGVkOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtcmVsYXRlZCcpLFxuXHRcdHNjcmVlbk5hbWU6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1zY3JlZW4tbmFtZScpLFxuXHRcdHVzZXJJZDogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXVzZXItaWQnKSxcblx0XHRsaW5rOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtbGluaycpLFxuXHRcdHBpY3R1cmU6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1waWN0dXJlJyksXG5cdFx0Y2FwdGlvbjogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNhcHRpb24nKSxcblx0XHRkZXNjcmlwdGlvbjogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWRlc2NyaXB0aW9uJyksXG5cdFx0dXNlcjogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXVzZXInKSxcblx0XHR2aWRlbzogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXZpZGVvJyksXG5cdFx0dXNlcm5hbWU6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS11c2VybmFtZScpLFxuXHRcdHRpdGxlOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdGl0bGUnKSxcblx0XHRtZWRpYTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLW1lZGlhJyksXG5cdFx0dG86IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS10bycpLFxuXHRcdHN1YmplY3Q6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1zdWJqZWN0JyksXG5cdFx0Ym9keTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWJvZHknKSxcblx0XHRpb3M6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1pb3MnKSxcblx0XHR0eXBlOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdHlwZScpLFxuXHRcdGNlbnRlcjogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNlbnRlcicpLFxuXHRcdHZpZXdzOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdmlld3MnKSxcblx0XHR6b29tOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtem9vbScpLFxuXHRcdHNlYXJjaDogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXNlYXJjaCcpLFxuXHRcdHNhZGRyOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtc2FkZHInKSxcblx0XHRkYWRkcjogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWRhZGRyJyksXG5cdFx0ZGlyZWN0aW9uc21vZGU6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1kaXJlY3Rpb25zLW1vZGUnKSxcblx0XHRyZXBvOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtcmVwbycpLFxuXHRcdHNob3Q6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1zaG90JyksXG5cdFx0cGVuOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtcGVuJyksXG5cdFx0dmlldzogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXZpZXcnKSxcblx0XHRpc3N1ZTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWlzc3VlJyksXG5cdFx0YnV0dG9uSWQ6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1idXR0b25JZCcpLFxuXHRcdHBvcFVwOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtcG9wdXAnKSxcblx0XHRrZXk6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1rZXknKVxuXHR9KTtcbn1cbiIsImNvbnN0IEV2ZW50cyA9IHJlcXVpcmUoJy4uL3NyYy9tb2R1bGVzL2V2ZW50cycpO1xuY29uc3Qgc2V0RGF0YSA9IHJlcXVpcmUoJy4vc2V0RGF0YScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNoYXJlO1xuXG5mdW5jdGlvbiBzaGFyZShlLCBvcywgb3BlblNoYXJlKSB7XG5cdC8vIGlmIGR5bmFtaWMgaW5zdGFuY2UgdGhlbiBmZXRjaCBhdHRyaWJ1dGVzIGFnYWluIGluIGNhc2Ugb2YgdXBkYXRlc1xuXHRpZiAob3BlblNoYXJlLmR5bmFtaWMpIHtcblx0XHRzZXREYXRhKG9wZW5TaGFyZSwgb3MpO1xuXHR9XG5cblx0b3BlblNoYXJlLnNoYXJlKGUpO1xuXG5cdC8vIHRyaWdnZXIgc2hhcmVkIGV2ZW50XG5cdEV2ZW50cy50cmlnZ2VyKG9zLCAnc2hhcmVkJyk7XG59XG4iLCIvKlxuICAgU29tZXRpbWVzIHNvY2lhbCBwbGF0Zm9ybXMgZ2V0IGNvbmZ1c2VkIGFuZCBkcm9wIHNoYXJlIGNvdW50cy5cbiAgIEluIHRoaXMgbW9kdWxlIHdlIGNoZWNrIGlmIHRoZSByZXR1cm5lZCBjb3VudCBpcyBsZXNzIHRoYW4gdGhlIGNvdW50IGluXG4gICBsb2NhbHN0b3JhZ2UuXG4gICBJZiB0aGUgbG9jYWwgY291bnQgaXMgZ3JlYXRlciB0aGFuIHRoZSByZXR1cm5lZCBjb3VudCxcbiAgIHdlIHN0b3JlIHRoZSBsb2NhbCBjb3VudCArIHRoZSByZXR1cm5lZCBjb3VudC5cbiAgIE90aGVyd2lzZSwgc3RvcmUgdGhlIHJldHVybmVkIGNvdW50LlxuKi9cblxubW9kdWxlLmV4cG9ydHMgPSAodCwgY291bnQpID0+IHtcblx0Y29uc3QgaXNBcnIgPSB0LnR5cGUuaW5kZXhPZignLCcpID4gLTE7XG5cdGNvbnN0IGxvY2FsID0gTnVtYmVyKHQuc3RvcmVHZXQodC50eXBlICsgJy0nICsgdC5zaGFyZWQpKTtcblxuXHRpZiAobG9jYWwgPiBjb3VudCAmJiAhaXNBcnIpIHtcblx0XHRjb25zdCBsYXRlc3RDb3VudCA9IE51bWJlcih0LnN0b3JlR2V0KHQudHlwZSArICctJyArIHQuc2hhcmVkICsgJy1sYXRlc3RDb3VudCcpKTtcblx0XHR0LnN0b3JlU2V0KHQudHlwZSArICctJyArIHQuc2hhcmVkICsgJy1sYXRlc3RDb3VudCcsIGNvdW50KTtcblxuXHRcdGNvdW50ID0gaXNOdW1lcmljKGxhdGVzdENvdW50KSAmJiBsYXRlc3RDb3VudCA+IDAgP1xuXHRcdFx0Y291bnQgKz0gbG9jYWwgLSBsYXRlc3RDb3VudCA6XG5cdFx0XHRjb3VudCArPSBsb2NhbDtcblxuXHR9XG5cblx0aWYgKCFpc0FycikgdC5zdG9yZVNldCh0LnR5cGUgKyAnLScgKyB0LnNoYXJlZCwgY291bnQpO1xuXHRyZXR1cm4gY291bnQ7XG59O1xuXG5mdW5jdGlvbiBpc051bWVyaWMobikge1xuICByZXR1cm4gIWlzTmFOKHBhcnNlRmxvYXQobikpICYmIGlzRmluaXRlKG4pO1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7XG5cdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCByZXF1aXJlKCcuL2xpYi9pbml0Jykoe1xuXHRcdGFwaTogJ3NoYXJlJyxcblx0XHRzZWxlY3RvcjogJ1tkYXRhLW9wZW4tc2hhcmVdOm5vdChbZGF0YS1vcGVuLXNoYXJlLW5vZGVdKScsXG5cdFx0Y2I6IHJlcXVpcmUoJy4vbGliL2luaXRpYWxpemVTaGFyZU5vZGUnKVxuXHR9KSk7XG5cblx0cmV0dXJuIHJlcXVpcmUoJy4vc3JjL21vZHVsZXMvc2hhcmUtYXBpJykoKTtcbn0pKCk7XG4iLCIvKipcbiAqIGNvdW50IEFQSVxuICovXG5cbnZhciBjb3VudCA9IHJlcXVpcmUoJy4vY291bnQnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcblxuXHQvLyBnbG9iYWwgT3BlblNoYXJlIHJlZmVyZW5jaW5nIGludGVybmFsIGNsYXNzIGZvciBpbnN0YW5jZSBnZW5lcmF0aW9uXG5cdGNsYXNzIENvdW50IHtcblxuXHRcdGNvbnN0cnVjdG9yKHtcblx0XHRcdHR5cGUsXG5cdFx0XHR1cmwsXG5cdFx0XHRhcHBlbmRUbyA9IGZhbHNlLFxuXHRcdFx0ZWxlbWVudCxcblx0XHRcdGNsYXNzZXMsXG5cdFx0XHRrZXkgPSBudWxsXG5cdFx0fSwgY2IpIHtcblx0XHRcdHZhciBjb3VudE5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGVsZW1lbnQgfHwgJ3NwYW4nKTtcblxuXHRcdFx0Y291bnROb2RlLnNldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50JywgdHlwZSk7XG5cdFx0XHRjb3VudE5vZGUuc2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY291bnQtdXJsJywgdXJsKTtcblx0XHRcdGlmIChrZXkpIGNvdW50Tm9kZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1rZXknLCBrZXkpO1xuXG5cdFx0XHRjb3VudE5vZGUuY2xhc3NMaXN0LmFkZCgnb3Blbi1zaGFyZS1jb3VudCcpO1xuXG5cdFx0XHRpZiAoY2xhc3NlcyAmJiBBcnJheS5pc0FycmF5KGNsYXNzZXMpKSB7XG5cdFx0XHRcdGNsYXNzZXMuZm9yRWFjaChjc3NDTGFzcyA9PiB7XG5cdFx0XHRcdFx0Y291bnROb2RlLmNsYXNzTGlzdC5hZGQoY3NzQ0xhc3MpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGFwcGVuZFRvKSB7XG5cdFx0XHRcdHJldHVybiBuZXcgY291bnQodHlwZSwgdXJsKS5jb3VudChjb3VudE5vZGUsIGNiLCBhcHBlbmRUbyk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBuZXcgY291bnQodHlwZSwgdXJsKS5jb3VudChjb3VudE5vZGUsIGNiKTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gQ291bnQ7XG59O1xuIiwiY29uc3QgY291bnRSZWR1Y2UgPSByZXF1aXJlKCcuLi8uLi9saWIvY291bnRSZWR1Y2UnKTtcbmNvbnN0IHN0b3JlQ291bnQgPSByZXF1aXJlKCcuLi8uLi9saWIvc3RvcmVDb3VudCcpO1xuXG4vKipcbiAqIE9iamVjdCBvZiB0cmFuc2Zvcm0gZnVuY3Rpb25zIGZvciBlYWNoIG9wZW5zaGFyZSBhcGlcbiAqIFRyYW5zZm9ybSBmdW5jdGlvbnMgcGFzc2VkIGludG8gT3BlblNoYXJlIGluc3RhbmNlIHdoZW4gaW5zdGFudGlhdGVkXG4gKiBSZXR1cm4gb2JqZWN0IGNvbnRhaW5pbmcgVVJMIGFuZCBrZXkvdmFsdWUgYXJnc1xuICovXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuXHQvLyBmYWNlYm9vayBjb3VudCBkYXRhXG5cdGZhY2Vib29rICh1cmwpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogJ2dldCcsXG5cdFx0XHR1cmw6IGBodHRwczovL2dyYXBoLmZhY2Vib29rLmNvbS8/aWQ9JHt1cmx9YCxcblx0XHRcdHRyYW5zZm9ybTogZnVuY3Rpb24oeGhyKSB7XG5cdFx0XHRcdGNvbnN0IGZiID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KTtcblxuXHRcdFx0XHRsZXQgY291bnQgPSBmYi5zaGFyZSAmJiBmYi5zaGFyZS5zaGFyZV9jb3VudCB8fCAwO1xuXG5cdFx0XHRcdHJldHVybiBzdG9yZUNvdW50KHRoaXMsIGNvdW50KTtcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIHBpbnRlcmVzdCBjb3VudCBkYXRhXG5cdHBpbnRlcmVzdCAodXJsKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHR5cGU6ICdqc29ucCcsXG5cdFx0XHR1cmw6IGBodHRwczovL2FwaS5waW50ZXJlc3QuY29tL3YxL3VybHMvY291bnQuanNvbj9jYWxsYmFjaz0/JnVybD0ke3VybH1gLFxuXHRcdFx0dHJhbnNmb3JtOiBmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHRcdGxldCBjb3VudCA9IGRhdGEuY291bnQ7XG5cdFx0XHRcdHJldHVybiBzdG9yZUNvdW50KHRoaXMsIGNvdW50KTtcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIGxpbmtlZGluIGNvdW50IGRhdGFcblx0bGlua2VkaW4gKHVybCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiAnanNvbnAnLFxuXHRcdFx0dXJsOiBgaHR0cHM6Ly93d3cubGlua2VkaW4uY29tL2NvdW50c2Vydi9jb3VudC9zaGFyZT91cmw9JHt1cmx9JmZvcm1hdD1qc29ucCZjYWxsYmFjaz0/YCxcblx0XHRcdHRyYW5zZm9ybTogZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0XHRsZXQgY291bnQgPSBkYXRhLmNvdW50O1xuXHRcdFx0XHRyZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBjb3VudCk7XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyByZWRkaXQgY291bnQgZGF0YVxuXHRyZWRkaXQgKHVybCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiAnZ2V0Jyxcblx0XHRcdHVybDogYGh0dHBzOi8vd3d3LnJlZGRpdC5jb20vYXBpL2luZm8uanNvbj91cmw9JHt1cmx9YCxcblx0XHRcdHRyYW5zZm9ybTogZnVuY3Rpb24oeGhyKSB7XG5cdFx0XHRcdGxldCBwb3N0cyA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCkuZGF0YS5jaGlsZHJlbixcblx0XHRcdFx0XHR1cHMgPSAwO1xuXG5cdFx0XHRcdHBvc3RzLmZvckVhY2goKHBvc3QpID0+IHtcblx0XHRcdFx0XHR1cHMgKz0gTnVtYmVyKHBvc3QuZGF0YS51cHMpO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRyZXR1cm4gc3RvcmVDb3VudCh0aGlzLCB1cHMpO1xuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gZ29vZ2xlIGNvdW50IGRhdGFcblx0Z29vZ2xlICh1cmwpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogJ3Bvc3QnLFxuXHRcdFx0ZGF0YToge1xuXHRcdFx0XHRtZXRob2Q6ICdwb3MucGx1c29uZXMuZ2V0Jyxcblx0XHRcdFx0aWQ6ICdwJyxcblx0XHRcdFx0cGFyYW1zOiB7XG5cdFx0XHRcdFx0bm9sb2c6IHRydWUsXG5cdFx0XHRcdFx0aWQ6IHVybCxcblx0XHRcdFx0XHRzb3VyY2U6ICd3aWRnZXQnLFxuXHRcdFx0XHRcdHVzZXJJZDogJ0B2aWV3ZXInLFxuXHRcdFx0XHRcdGdyb3VwSWQ6ICdAc2VsZidcblx0XHRcdFx0fSxcblx0XHRcdFx0anNvbnJwYzogJzIuMCcsXG5cdFx0XHRcdGtleTogJ3AnLFxuXHRcdFx0XHRhcGlWZXJzaW9uOiAndjEnXG5cdFx0XHR9LFxuXHRcdFx0dXJsOiBgaHR0cHM6Ly9jbGllbnRzNi5nb29nbGUuY29tL3JwY2AsXG5cdFx0XHR0cmFuc2Zvcm06IGZ1bmN0aW9uKHhocikge1xuXHRcdFx0XHRsZXQgY291bnQgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpLnJlc3VsdC5tZXRhZGF0YS5nbG9iYWxDb3VudHMuY291bnQ7XG5cdFx0XHRcdHJldHVybiBzdG9yZUNvdW50KHRoaXMsIGNvdW50KTtcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIGdpdGh1YiBzdGFyIGNvdW50XG5cdGdpdGh1YlN0YXJzIChyZXBvKSB7XG5cdFx0cmVwbyA9IHJlcG8uaW5kZXhPZignZ2l0aHViLmNvbS8nKSA+IC0xID9cblx0XHRcdHJlcG8uc3BsaXQoJ2dpdGh1Yi5jb20vJylbMV0gOlxuXHRcdFx0cmVwbztcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogJ2dldCcsXG5cdFx0XHR1cmw6IGBodHRwczovL2FwaS5naXRodWIuY29tL3JlcG9zLyR7cmVwb31gLFxuXHRcdFx0dHJhbnNmb3JtOiBmdW5jdGlvbih4aHIpIHtcblx0XHRcdFx0bGV0IGNvdW50ID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KS5zdGFyZ2F6ZXJzX2NvdW50O1xuXHRcdFx0XHRyZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBjb3VudCk7XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBnaXRodWIgZm9ya3MgY291bnRcblx0Z2l0aHViRm9ya3MgKHJlcG8pIHtcblx0XHRyZXBvID0gcmVwby5pbmRleE9mKCdnaXRodWIuY29tLycpID4gLTEgP1xuXHRcdFx0cmVwby5zcGxpdCgnZ2l0aHViLmNvbS8nKVsxXSA6XG5cdFx0XHRyZXBvO1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiAnZ2V0Jyxcblx0XHRcdHVybDogYGh0dHBzOi8vYXBpLmdpdGh1Yi5jb20vcmVwb3MvJHtyZXBvfWAsXG5cdFx0XHR0cmFuc2Zvcm06IGZ1bmN0aW9uKHhocikge1xuXHRcdFx0XHRsZXQgY291bnQgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpLmZvcmtzX2NvdW50O1xuXHRcdFx0XHRyZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBjb3VudCk7XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBnaXRodWIgd2F0Y2hlcnMgY291bnRcblx0Z2l0aHViV2F0Y2hlcnMgKHJlcG8pIHtcblx0XHRyZXBvID0gcmVwby5pbmRleE9mKCdnaXRodWIuY29tLycpID4gLTEgP1xuXHRcdFx0cmVwby5zcGxpdCgnZ2l0aHViLmNvbS8nKVsxXSA6XG5cdFx0XHRyZXBvO1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiAnZ2V0Jyxcblx0XHRcdHVybDogYGh0dHBzOi8vYXBpLmdpdGh1Yi5jb20vcmVwb3MvJHtyZXBvfWAsXG5cdFx0XHR0cmFuc2Zvcm06IGZ1bmN0aW9uKHhocikge1xuXHRcdFx0XHRsZXQgY291bnQgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpLndhdGNoZXJzX2NvdW50O1xuXHRcdFx0XHRyZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBjb3VudCk7XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBkcmliYmJsZSBsaWtlcyBjb3VudFxuXHRkcmliYmJsZSAoc2hvdCkge1xuXHRcdHNob3QgPSBzaG90LmluZGV4T2YoJ2RyaWJiYmxlLmNvbS9zaG90cycpID4gLTEgP1xuXHRcdFx0c2hvdC5zcGxpdCgnc2hvdHMvJylbMV0gOlxuXHRcdFx0c2hvdDtcblx0XHRjb25zdCB1cmwgPSBgaHR0cHM6Ly9hcGkuZHJpYmJibGUuY29tL3YxL3Nob3RzLyR7c2hvdH0vbGlrZXNgO1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiAnZ2V0Jyxcblx0XHRcdHVybDogdXJsLFxuXHRcdFx0dHJhbnNmb3JtOiBmdW5jdGlvbih4aHIsIEV2ZW50cykge1xuXHRcdFx0XHRsZXQgY291bnQgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpLmxlbmd0aDtcblxuXHRcdFx0XHQvLyBhdCB0aGlzIHRpbWUgZHJpYmJibGUgbGltaXRzIGEgcmVzcG9uc2Ugb2YgMTIgbGlrZXMgcGVyIHBhZ2Vcblx0XHRcdFx0aWYgKGNvdW50ID09PSAxMikge1xuXHRcdFx0XHRcdGxldCBwYWdlID0gMjtcblx0XHRcdFx0XHRyZWN1cnNpdmVDb3VudCh1cmwsIHBhZ2UsIGNvdW50LCBmaW5hbENvdW50ID0+IHtcblx0XHRcdFx0XHRcdGlmICh0aGlzLmFwcGVuZFRvICYmIHR5cGVvZiB0aGlzLmFwcGVuZFRvICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMuYXBwZW5kVG8uYXBwZW5kQ2hpbGQodGhpcy5vcyk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRjb3VudFJlZHVjZSh0aGlzLm9zLCBmaW5hbENvdW50LCB0aGlzLmNiKTtcblx0XHRcdFx0XHRcdEV2ZW50cy50cmlnZ2VyKHRoaXMub3MsICdjb3VudGVkLScgKyB0aGlzLnVybCk7XG5cdFx0XHRcdFx0XHRyZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBmaW5hbENvdW50KTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBjb3VudCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdHR3aXR0ZXIgKHVybCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiAnZ2V0Jyxcblx0XHRcdHVybDogYGh0dHBzOi8vYXBpLm9wZW5zaGFyZS5zb2NpYWwvam9iP3VybD0ke3VybH0ma2V5PWAsXG5cdFx0XHR0cmFuc2Zvcm06IGZ1bmN0aW9uKHhocikge1xuXHRcdFx0XHRsZXQgY291bnQgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpLmNvdW50O1xuXHRcdFx0XHRyZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBjb3VudCk7XG5cdFx0XHR9XG5cdFx0fTtcblx0fVxufTtcblxuZnVuY3Rpb24gcmVjdXJzaXZlQ291bnQgKHVybCwgcGFnZSwgY291bnQsIGNiKSB7XG5cdGNvbnN0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXHR4aHIub3BlbignR0VUJywgdXJsICsgJz9wYWdlPScgKyBwYWdlKTtcblx0eGhyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG5cdFx0Y29uc3QgbGlrZXMgPSBKU09OLnBhcnNlKHRoaXMucmVzcG9uc2UpO1xuXHRcdGNvdW50ICs9IGxpa2VzLmxlbmd0aDtcblxuXHRcdC8vIGRyaWJiYmxlIGxpa2UgcGVyIHBhZ2UgaXMgMTJcblx0XHRpZiAobGlrZXMubGVuZ3RoID09PSAxMikge1xuXHRcdFx0cGFnZSsrO1xuXHRcdFx0cmVjdXJzaXZlQ291bnQodXJsLCBwYWdlLCBjb3VudCwgY2IpO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGNiKGNvdW50KTtcblx0XHR9XG5cdH0pO1xuXHR4aHIuc2VuZCgpO1xufVxuIiwiLyoqXG4gKiBHZW5lcmF0ZSBzaGFyZSBjb3VudCBpbnN0YW5jZSBmcm9tIG9uZSB0byBtYW55IG5ldHdvcmtzXG4gKi9cblxuY29uc3QgQ291bnRUcmFuc2Zvcm1zID0gcmVxdWlyZSgnLi9jb3VudC10cmFuc2Zvcm1zJyk7XG5jb25zdCBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xuY29uc3QgY291bnRSZWR1Y2UgPSByZXF1aXJlKCcuLi8uLi9saWIvY291bnRSZWR1Y2UnKTtcbmNvbnN0IHN0b3JlQ291bnQgPSByZXF1aXJlKCcuLi8uLi9saWIvc3RvcmVDb3VudCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIENvdW50IHtcblxuXHRjb25zdHJ1Y3Rvcih0eXBlLCB1cmwpIHtcblxuXHRcdC8vIHRocm93IGVycm9yIGlmIG5vIHVybCBwcm92aWRlZFxuXHRcdGlmICghdXJsKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYE9wZW4gU2hhcmU6IG5vIHVybCBwcm92aWRlZCBmb3IgY291bnRgKTtcblx0XHR9XG5cblx0XHQvLyBjaGVjayBmb3IgR2l0aHViIGNvdW50c1xuXHRcdGlmICh0eXBlLmluZGV4T2YoJ2dpdGh1YicpID09PSAwKSB7XG5cdFx0XHRpZiAodHlwZSA9PT0gJ2dpdGh1Yi1zdGFycycpIHtcblx0XHRcdFx0dHlwZSA9ICdnaXRodWJTdGFycyc7XG5cdFx0XHR9IGVsc2UgaWYgKHR5cGUgPT09ICdnaXRodWItZm9ya3MnKSB7XG5cdFx0XHRcdHR5cGUgPSAnZ2l0aHViRm9ya3MnO1xuXHRcdFx0fSBlbHNlIGlmICh0eXBlID09PSAnZ2l0aHViLXdhdGNoZXJzJykge1xuXHRcdFx0XHR0eXBlID0gJ2dpdGh1YldhdGNoZXJzJztcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoJ0ludmFsaWQgR2l0aHViIGNvdW50IHR5cGUuIFRyeSBnaXRodWItc3RhcnMsIGdpdGh1Yi1mb3Jrcywgb3IgZ2l0aHViLXdhdGNoZXJzLicpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIGlmIHR5cGUgaXMgY29tbWEgc2VwYXJhdGUgbGlzdCBjcmVhdGUgYXJyYXlcblx0XHRpZiAodHlwZS5pbmRleE9mKCcsJykgPiAtMSkge1xuXHRcdFx0dGhpcy50eXBlID0gdHlwZTtcblx0XHRcdHRoaXMudHlwZUFyciA9IHRoaXMudHlwZS5zcGxpdCgnLCcpO1xuXHRcdFx0dGhpcy5jb3VudERhdGEgPSBbXTtcblxuXHRcdFx0Ly8gY2hlY2sgZWFjaCB0eXBlIHN1cHBsaWVkIGlzIHZhbGlkXG5cdFx0XHR0aGlzLnR5cGVBcnIuZm9yRWFjaCgodCkgPT4ge1xuXHRcdFx0XHRpZiAoIUNvdW50VHJhbnNmb3Jtc1t0XSkge1xuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihgT3BlbiBTaGFyZTogJHt0eXBlfSBpcyBhbiBpbnZhbGlkIGNvdW50IHR5cGVgKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRoaXMuY291bnREYXRhLnB1c2goQ291bnRUcmFuc2Zvcm1zW3RdKHVybCkpO1xuXHRcdFx0fSk7XG5cblx0XHQvLyB0aHJvdyBlcnJvciBpZiBpbnZhbGlkIHR5cGUgcHJvdmlkZWRcblx0XHR9IGVsc2UgaWYgKCFDb3VudFRyYW5zZm9ybXNbdHlwZV0pIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihgT3BlbiBTaGFyZTogJHt0eXBlfSBpcyBhbiBpbnZhbGlkIGNvdW50IHR5cGVgKTtcblxuXHRcdC8vIHNpbmdsZSBjb3VudFxuXHRcdC8vIHN0b3JlIGNvdW50IFVSTCBhbmQgdHJhbnNmb3JtIGZ1bmN0aW9uXG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMudHlwZSA9IHR5cGU7XG5cdFx0XHR0aGlzLmNvdW50RGF0YSA9IENvdW50VHJhbnNmb3Jtc1t0eXBlXSh1cmwpO1xuXHRcdH1cblx0fVxuXG5cdC8vIGhhbmRsZSBjYWxsaW5nIGdldENvdW50IC8gZ2V0Q291bnRzXG5cdC8vIGRlcGVuZGluZyBvbiBudW1iZXIgb2YgdHlwZXNcblx0Y291bnQob3MsIGNiLCBhcHBlbmRUbykge1xuXHRcdHRoaXMub3MgPSBvcztcblx0XHR0aGlzLmFwcGVuZFRvID0gYXBwZW5kVG87XG5cdFx0dGhpcy5jYiA9IGNiO1xuICAgIFx0dGhpcy51cmwgPSB0aGlzLm9zLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50Jyk7XG5cdFx0dGhpcy5zaGFyZWQgPSB0aGlzLm9zLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50LXVybCcpO1xuXHRcdHRoaXMua2V5ID0gdGhpcy5vcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1rZXknKTtcblxuXHRcdGlmICghQXJyYXkuaXNBcnJheSh0aGlzLmNvdW50RGF0YSkpIHtcblx0XHRcdHRoaXMuZ2V0Q291bnQoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5nZXRDb3VudHMoKTtcblx0XHR9XG5cdH1cblxuXHQvLyBmZXRjaCBjb3VudCBlaXRoZXIgQUpBWCBvciBKU09OUFxuXHRnZXRDb3VudCgpIHtcblx0XHR2YXIgY291bnQgPSB0aGlzLnN0b3JlR2V0KHRoaXMudHlwZSArICctJyArIHRoaXMuc2hhcmVkKTtcblxuXHRcdGlmIChjb3VudCkge1xuXHRcdFx0aWYgKHRoaXMuYXBwZW5kVG8gJiYgdHlwZW9mIHRoaXMuYXBwZW5kVG8gIT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0dGhpcy5hcHBlbmRUby5hcHBlbmRDaGlsZCh0aGlzLm9zKTtcblx0XHRcdH1cblx0XHRcdGNvdW50UmVkdWNlKHRoaXMub3MsIGNvdW50KTtcblx0XHR9XG5cdFx0dGhpc1t0aGlzLmNvdW50RGF0YS50eXBlXSh0aGlzLmNvdW50RGF0YSk7XG5cdH1cblxuXHQvLyBmZXRjaCBtdWx0aXBsZSBjb3VudHMgYW5kIGFnZ3JlZ2F0ZVxuXHRnZXRDb3VudHMoKSB7XG5cdFx0dGhpcy50b3RhbCA9IFtdO1xuXG5cdFx0dmFyIGNvdW50ID0gdGhpcy5zdG9yZUdldCh0aGlzLnR5cGUgKyAnLScgKyB0aGlzLnNoYXJlZCk7XG5cblx0XHRpZiAoY291bnQpIHtcblx0XHRcdGlmICh0aGlzLmFwcGVuZFRvICAmJiB0eXBlb2YgdGhpcy5hcHBlbmRUbyAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHR0aGlzLmFwcGVuZFRvLmFwcGVuZENoaWxkKHRoaXMub3MpO1xuXHRcdFx0fVxuXHRcdFx0Y291bnRSZWR1Y2UodGhpcy5vcywgY291bnQpO1xuXHRcdH1cblxuXHRcdHRoaXMuY291bnREYXRhLmZvckVhY2goY291bnREYXRhID0+IHtcblxuXHRcdFx0dGhpc1tjb3VudERhdGEudHlwZV0oY291bnREYXRhLCAobnVtKSA9PiB7XG5cdFx0XHRcdHRoaXMudG90YWwucHVzaChudW0pO1xuXG5cdFx0XHRcdC8vIHRvdGFsIGNvdW50cyBsZW5ndGggbm93IGVxdWFscyB0eXBlIGFycmF5IGxlbmd0aFxuXHRcdFx0XHQvLyBzbyBhZ2dyZWdhdGUsIHN0b3JlIGFuZCBpbnNlcnQgaW50byBET01cblx0XHRcdFx0aWYgKHRoaXMudG90YWwubGVuZ3RoID09PSB0aGlzLnR5cGVBcnIubGVuZ3RoKSB7XG5cdFx0XHRcdFx0bGV0IHRvdCA9IDA7XG5cblx0XHRcdFx0XHR0aGlzLnRvdGFsLmZvckVhY2goKHQpID0+IHtcblx0XHRcdFx0XHRcdHRvdCArPSB0O1xuXHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0aWYgKHRoaXMuYXBwZW5kVG8gICYmIHR5cGVvZiB0aGlzLmFwcGVuZFRvICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0XHR0aGlzLmFwcGVuZFRvLmFwcGVuZENoaWxkKHRoaXMub3MpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGNvbnN0IGxvY2FsID0gTnVtYmVyKHRoaXMuc3RvcmVHZXQodGhpcy50eXBlICsgJy0nICsgdGhpcy5zaGFyZWQpKTtcblx0XHRcdFx0XHRpZiAobG9jYWwgPiB0b3QpIHtcblx0XHRcdFx0XHRcdGNvbnN0IGxhdGVzdENvdW50ID0gTnVtYmVyKHRoaXMuc3RvcmVHZXQodGhpcy50eXBlICsgJy0nICsgdGhpcy5zaGFyZWQgKyAnLWxhdGVzdENvdW50JykpO1xuXHRcdFx0XHRcdFx0dGhpcy5zdG9yZVNldCh0aGlzLnR5cGUgKyAnLScgKyB0aGlzLnNoYXJlZCArICctbGF0ZXN0Q291bnQnLCB0b3QpO1xuXG5cdFx0XHRcdFx0XHR0b3QgPSBpc051bWVyaWMobGF0ZXN0Q291bnQpICYmIGxhdGVzdENvdW50ID4gMCA/XG5cdFx0XHRcdFx0XHRcdHRvdCArPSBsb2NhbCAtIGxhdGVzdENvdW50IDpcblx0XHRcdFx0XHRcdFx0dG90ICs9IGxvY2FsO1xuXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHRoaXMuc3RvcmVTZXQodGhpcy50eXBlICsgJy0nICsgdGhpcy5zaGFyZWQsIHRvdCk7XG5cblx0XHRcdFx0XHRjb3VudFJlZHVjZSh0aGlzLm9zLCB0b3QpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdGlmICh0aGlzLmFwcGVuZFRvICAmJiB0eXBlb2YgdGhpcy5hcHBlbmRUbyAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0dGhpcy5hcHBlbmRUby5hcHBlbmRDaGlsZCh0aGlzLm9zKTtcblx0XHR9XG5cdH1cblxuXHQvLyBoYW5kbGUgSlNPTlAgcmVxdWVzdHNcblx0anNvbnAoY291bnREYXRhLCBjYikge1xuXHRcdC8vIGRlZmluZSByYW5kb20gY2FsbGJhY2sgYW5kIGFzc2lnbiB0cmFuc2Zvcm0gZnVuY3Rpb25cblx0XHRsZXQgY2FsbGJhY2sgPSBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHJpbmcoNykucmVwbGFjZSgvW15hLXpBLVpdL2csICcnKTtcblx0XHR3aW5kb3dbY2FsbGJhY2tdID0gKGRhdGEpID0+IHtcblx0XHRcdGxldCBjb3VudCA9IGNvdW50RGF0YS50cmFuc2Zvcm0uYXBwbHkodGhpcywgW2RhdGFdKSB8fCAwO1xuXG5cdFx0XHRpZiAoY2IgJiYgdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdGNiKGNvdW50KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGlmICh0aGlzLmFwcGVuZFRvICAmJiB0eXBlb2YgdGhpcy5hcHBlbmRUbyAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdHRoaXMuYXBwZW5kVG8uYXBwZW5kQ2hpbGQodGhpcy5vcyk7XG5cdFx0XHRcdH1cblx0XHRcdFx0Y291bnRSZWR1Y2UodGhpcy5vcywgY291bnQsIHRoaXMuY2IpO1xuXHRcdFx0fVxuXG5cdFx0XHRFdmVudHMudHJpZ2dlcih0aGlzLm9zLCAnY291bnRlZC0nICsgdGhpcy51cmwpO1xuXHRcdH07XG5cblx0XHQvLyBhcHBlbmQgSlNPTlAgc2NyaXB0IHRhZyB0byBwYWdlXG5cdFx0bGV0IHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuXHRcdHNjcmlwdC5zcmMgPSBjb3VudERhdGEudXJsLnJlcGxhY2UoJ2NhbGxiYWNrPT8nLCBgY2FsbGJhY2s9JHtjYWxsYmFja31gKTtcblx0XHRkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdLmFwcGVuZENoaWxkKHNjcmlwdCk7XG5cblx0XHRyZXR1cm47XG5cdH1cblxuXHQvLyBoYW5kbGUgQUpBWCBHRVQgcmVxdWVzdFxuXHRnZXQoY291bnREYXRhLCBjYikge1xuXHRcdGxldCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuXHRcdC8vIG9uIHN1Y2Nlc3MgcGFzcyByZXNwb25zZSB0byB0cmFuc2Zvcm0gZnVuY3Rpb25cblx0XHR4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gKCkgPT4ge1xuXHRcdFx0aWYgKHhoci5yZWFkeVN0YXRlID09PSA0KSB7XG5cdFx0XHRcdGlmICh4aHIuc3RhdHVzID09PSAyMDApIHtcblx0XHRcdFx0XHRsZXQgY291bnQgPSBjb3VudERhdGEudHJhbnNmb3JtLmFwcGx5KHRoaXMsIFt4aHIsIEV2ZW50c10pIHx8IDA7XG5cblx0XHRcdFx0XHRpZiAoY2IgJiYgdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0XHRjYihjb3VudCk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGlmICh0aGlzLmFwcGVuZFRvICYmIHR5cGVvZiB0aGlzLmFwcGVuZFRvICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMuYXBwZW5kVG8uYXBwZW5kQ2hpbGQodGhpcy5vcyk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRjb3VudFJlZHVjZSh0aGlzLm9zLCBjb3VudCwgdGhpcy5jYik7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0RXZlbnRzLnRyaWdnZXIodGhpcy5vcywgJ2NvdW50ZWQtJyArIHRoaXMudXJsKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRpZiAoY291bnREYXRhLnVybC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ2h0dHBzOi8vYXBpLm9wZW5zaGFyZS5zb2NpYWwvam9iPycpID09PSAwKSB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKCdQbGVhc2Ugc2lnbiB1cCBmb3IgVHdpdHRlciBjb3VudHMgYXQgaHR0cHM6Ly9vcGVuc2hhcmUuc29jaWFsL3R3aXR0ZXIvYXV0aCcpO1xuXHRcdFx0XHRcdH0gZWxzZSBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gZ2V0IEFQSSBkYXRhIGZyb20nLCBjb3VudERhdGEudXJsLCAnLiBQbGVhc2UgdXNlIHRoZSBsYXRlc3QgdmVyc2lvbiBvZiBPcGVuU2hhcmUuJyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0Y291bnREYXRhLnVybCA9IGNvdW50RGF0YS51cmwuc3RhcnRzV2l0aCgnaHR0cHM6Ly9hcGkub3BlbnNoYXJlLnNvY2lhbC9qb2I/JykgJiYgdGhpcy5rZXkgP1xuXHRcdFx0Y291bnREYXRhLnVybCArIHRoaXMua2V5IDpcblx0XHRcdGNvdW50RGF0YS51cmw7XG5cblx0XHR4aHIub3BlbignR0VUJywgY291bnREYXRhLnVybCk7XG5cdFx0eGhyLnNlbmQoKTtcblx0fVxuXG5cdC8vIGhhbmRsZSBBSkFYIFBPU1QgcmVxdWVzdFxuXHRwb3N0KGNvdW50RGF0YSwgY2IpIHtcblx0XHRsZXQgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cblx0XHQvLyBvbiBzdWNjZXNzIHBhc3MgcmVzcG9uc2UgdG8gdHJhbnNmb3JtIGZ1bmN0aW9uXG5cdFx0eGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9ICgpID0+IHtcblx0XHRcdGlmICh4aHIucmVhZHlTdGF0ZSAhPT0gWE1MSHR0cFJlcXVlc3QuRE9ORSB8fFxuXHRcdFx0XHR4aHIuc3RhdHVzICE9PSAyMDApIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRsZXQgY291bnQgPSBjb3VudERhdGEudHJhbnNmb3JtLmFwcGx5KHRoaXMsIFt4aHJdKSB8fCAwO1xuXG5cdFx0XHRpZiAoY2IgJiYgdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdGNiKGNvdW50KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGlmICh0aGlzLmFwcGVuZFRvICYmIHR5cGVvZiB0aGlzLmFwcGVuZFRvICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0dGhpcy5hcHBlbmRUby5hcHBlbmRDaGlsZCh0aGlzLm9zKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRjb3VudFJlZHVjZSh0aGlzLm9zLCBjb3VudCwgdGhpcy5jYik7XG5cdFx0XHR9XG5cdFx0XHRFdmVudHMudHJpZ2dlcih0aGlzLm9zLCAnY291bnRlZC0nICsgdGhpcy51cmwpO1xuXHRcdH07XG5cblx0XHR4aHIub3BlbignUE9TVCcsIGNvdW50RGF0YS51cmwpO1xuXHRcdHhoci5zZXRSZXF1ZXN0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbjtjaGFyc2V0PVVURi04Jyk7XG5cdFx0eGhyLnNlbmQoSlNPTi5zdHJpbmdpZnkoY291bnREYXRhLmRhdGEpKTtcblx0fVxuXG5cdHN0b3JlU2V0KHR5cGUsIGNvdW50ID0gMCkge1xuXHRcdGlmICghd2luZG93LmxvY2FsU3RvcmFnZSB8fCAhdHlwZSkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGxvY2FsU3RvcmFnZS5zZXRJdGVtKGBPcGVuU2hhcmUtJHt0eXBlfWAsIGNvdW50KTtcblx0fVxuXG5cdHN0b3JlR2V0KHR5cGUpIHtcblx0XHRpZiAoIXdpbmRvdy5sb2NhbFN0b3JhZ2UgfHwgIXR5cGUpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRyZXR1cm4gbG9jYWxTdG9yYWdlLmdldEl0ZW0oYE9wZW5TaGFyZS0ke3R5cGV9YCk7XG5cdH1cblxufTtcblxuZnVuY3Rpb24gaXNOdW1lcmljKG4pIHtcbiAgcmV0dXJuICFpc05hTihwYXJzZUZsb2F0KG4pKSAmJiBpc0Zpbml0ZShuKTtcbn1cbiIsIi8qKlxuICogVHJpZ2dlciBjdXN0b20gT3BlblNoYXJlIG5hbWVzcGFjZWQgZXZlbnRcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSB7XG5cdHRyaWdnZXI6IGZ1bmN0aW9uKGVsZW1lbnQsIGV2ZW50KSB7XG5cdFx0bGV0IGV2ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0V2ZW50Jyk7XG5cdFx0ZXYuaW5pdEV2ZW50KCdPcGVuU2hhcmUuJyArIGV2ZW50LCB0cnVlLCB0cnVlKTtcblx0XHRlbGVtZW50LmRpc3BhdGNoRXZlbnQoZXYpO1xuXHR9XG59O1xuIiwiLyoqXG4gKiBPcGVuU2hhcmUgZ2VuZXJhdGVzIGEgc2luZ2xlIHNoYXJlIGxpbmtcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBPcGVuU2hhcmUge1xuXG5cdGNvbnN0cnVjdG9yKHR5cGUsIHRyYW5zZm9ybSkge1xuXHRcdHRoaXMuaW9zID0gL2lQYWR8aVBob25lfGlQb2QvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkgJiYgIXdpbmRvdy5NU1N0cmVhbTtcblx0XHR0aGlzLnR5cGUgPSB0eXBlO1xuXHRcdHRoaXMuZHluYW1pYyA9IGZhbHNlO1xuXHRcdHRoaXMudHJhbnNmb3JtID0gdHJhbnNmb3JtO1xuXG5cdFx0Ly8gY2FwaXRhbGl6ZWQgdHlwZVxuXHRcdHRoaXMudHlwZUNhcHMgPSB0eXBlLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgdHlwZS5zbGljZSgxKTtcblx0fVxuXG5cdC8vIHJldHVybnMgZnVuY3Rpb24gbmFtZWQgYXMgdHlwZSBzZXQgaW4gY29uc3RydWN0b3Jcblx0Ly8gZS5nIHR3aXR0ZXIoKVxuXHRzZXREYXRhKGRhdGEpIHtcblx0XHQvLyBpZiBpT1MgdXNlciBhbmQgaW9zIGRhdGEgYXR0cmlidXRlIGRlZmluZWRcblx0XHQvLyBidWlsZCBpT1MgVVJMIHNjaGVtZSBhcyBzaW5nbGUgc3RyaW5nXG5cdFx0aWYgKHRoaXMuaW9zKSB7XG5cdFx0XHR0aGlzLnRyYW5zZm9ybURhdGEgPSB0aGlzLnRyYW5zZm9ybShkYXRhLCB0cnVlKTtcblx0XHRcdHRoaXMubW9iaWxlU2hhcmVVcmwgPSB0aGlzLnRlbXBsYXRlKHRoaXMudHJhbnNmb3JtRGF0YS51cmwsIHRoaXMudHJhbnNmb3JtRGF0YS5kYXRhKTtcblx0XHR9XG5cblx0XHR0aGlzLnRyYW5zZm9ybURhdGEgPSB0aGlzLnRyYW5zZm9ybShkYXRhKTtcblx0XHR0aGlzLnNoYXJlVXJsID0gdGhpcy50ZW1wbGF0ZSh0aGlzLnRyYW5zZm9ybURhdGEudXJsLCB0aGlzLnRyYW5zZm9ybURhdGEuZGF0YSk7XG5cdH1cblxuXHQvLyBvcGVuIHNoYXJlIFVSTCBkZWZpbmVkIGluIGluZGl2aWR1YWwgcGxhdGZvcm0gZnVuY3Rpb25zXG5cdHNoYXJlKGUpIHtcblx0XHQvLyBpZiBpT1Mgc2hhcmUgVVJMIGhhcyBiZWVuIHNldCB0aGVuIHVzZSB0aW1lb3V0IGhhY2tcblx0XHQvLyB0ZXN0IGZvciBuYXRpdmUgYXBwIGFuZCBmYWxsIGJhY2sgdG8gd2ViXG5cdFx0aWYgKHRoaXMubW9iaWxlU2hhcmVVcmwpIHtcblx0XHRcdHZhciBzdGFydCA9IChuZXcgRGF0ZSgpKS52YWx1ZU9mKCk7XG5cblx0XHRcdHNldFRpbWVvdXQoKCkgPT4ge1xuXHRcdFx0XHR2YXIgZW5kID0gKG5ldyBEYXRlKCkpLnZhbHVlT2YoKTtcblxuXHRcdFx0XHQvLyBpZiB0aGUgdXNlciBpcyBzdGlsbCBoZXJlLCBmYWxsIGJhY2sgdG8gd2ViXG5cdFx0XHRcdGlmIChlbmQgLSBzdGFydCA+IDE2MDApIHtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR3aW5kb3cubG9jYXRpb24gPSB0aGlzLnNoYXJlVXJsO1xuXHRcdFx0fSwgMTUwMCk7XG5cblx0XHRcdHdpbmRvdy5sb2NhdGlvbiA9IHRoaXMubW9iaWxlU2hhcmVVcmw7XG5cblx0XHQvLyBvcGVuIG1haWx0byBsaW5rcyBpbiBzYW1lIHdpbmRvd1xuXHRcdH0gZWxzZSBpZiAodGhpcy50eXBlID09PSAnZW1haWwnKSB7XG5cdFx0XHR3aW5kb3cubG9jYXRpb24gPSB0aGlzLnNoYXJlVXJsO1xuXG5cdFx0Ly8gb3BlbiBzb2NpYWwgc2hhcmUgVVJMcyBpbiBuZXcgd2luZG93XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIGlmIHBvcHVwIG9iamVjdCBwcmVzZW50IHRoZW4gc2V0IHdpbmRvdyBkaW1lbnNpb25zIC8gcG9zaXRpb25cblx0XHRcdGlmKHRoaXMucG9wdXAgJiYgdGhpcy50cmFuc2Zvcm1EYXRhLnBvcHVwKSB7XG5cdFx0XHRcdHJldHVybiB0aGlzLm9wZW5XaW5kb3codGhpcy5zaGFyZVVybCwgdGhpcy50cmFuc2Zvcm1EYXRhLnBvcHVwKTtcblx0XHRcdH1cblxuXHRcdFx0d2luZG93Lm9wZW4odGhpcy5zaGFyZVVybCk7XG5cdFx0fVxuXHR9XG5cblx0Ly8gY3JlYXRlIHNoYXJlIFVSTCB3aXRoIEdFVCBwYXJhbXNcblx0Ly8gYXBwZW5kaW5nIHZhbGlkIHByb3BlcnRpZXMgdG8gcXVlcnkgc3RyaW5nXG5cdHRlbXBsYXRlKHVybCwgZGF0YSkge1xuXHRcdGxldCBub25VUkxQcm9wcyA9IFtcblx0XHRcdCdhcHBlbmRUbycsXG5cdFx0XHQnaW5uZXJIVE1MJyxcblx0XHRcdCdjbGFzc2VzJ1xuXHRcdF07XG5cblx0XHRsZXQgc2hhcmVVcmwgPSB1cmwsXG5cdFx0XHRpO1xuXG5cdFx0Zm9yIChpIGluIGRhdGEpIHtcblx0XHRcdC8vIG9ubHkgYXBwZW5kIHZhbGlkIHByb3BlcnRpZXNcblx0XHRcdGlmICghZGF0YVtpXSB8fCBub25VUkxQcm9wcy5pbmRleE9mKGkpID4gLTEpIHtcblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHR9XG5cblx0XHRcdC8vIGFwcGVuZCBVUkwgZW5jb2RlZCBHRVQgcGFyYW0gdG8gc2hhcmUgVVJMXG5cdFx0XHRkYXRhW2ldID0gZW5jb2RlVVJJQ29tcG9uZW50KGRhdGFbaV0pO1xuXHRcdFx0c2hhcmVVcmwgKz0gYCR7aX09JHtkYXRhW2ldfSZgO1xuXHRcdH1cblxuXHRcdHJldHVybiBzaGFyZVVybC5zdWJzdHIoMCwgc2hhcmVVcmwubGVuZ3RoIC0gMSk7XG5cdH1cblxuXHQvLyBjZW50ZXIgcG9wdXAgd2luZG93IHN1cHBvcnRpbmcgZHVhbCBzY3JlZW5zXG5cdG9wZW5XaW5kb3codXJsLCBvcHRpb25zKSB7XG5cdFx0bGV0IGR1YWxTY3JlZW5MZWZ0ID0gd2luZG93LnNjcmVlbkxlZnQgIT0gdW5kZWZpbmVkID8gd2luZG93LnNjcmVlbkxlZnQgOiBzY3JlZW4ubGVmdCxcblx0XHRcdGR1YWxTY3JlZW5Ub3AgPSB3aW5kb3cuc2NyZWVuVG9wICE9IHVuZGVmaW5lZCA/IHdpbmRvdy5zY3JlZW5Ub3AgOiBzY3JlZW4udG9wLFxuXHRcdFx0d2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aCA/IHdpbmRvdy5pbm5lcldpZHRoIDogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoID8gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoIDogc2NyZWVuLndpZHRoLFxuXHRcdFx0aGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0ID8gd2luZG93LmlubmVySGVpZ2h0IDogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodCA/IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQgOiBzY3JlZW4uaGVpZ2h0LFxuXHRcdFx0bGVmdCA9ICgod2lkdGggLyAyKSAtIChvcHRpb25zLndpZHRoIC8gMikpICsgZHVhbFNjcmVlbkxlZnQsXG5cdFx0XHR0b3AgPSAoKGhlaWdodCAvIDIpIC0gKG9wdGlvbnMuaGVpZ2h0IC8gMikpICsgZHVhbFNjcmVlblRvcCxcblx0XHRcdG5ld1dpbmRvdyA9IHdpbmRvdy5vcGVuKHVybCwgJ09wZW5TaGFyZScsIGB3aWR0aD0ke29wdGlvbnMud2lkdGh9LCBoZWlnaHQ9JHtvcHRpb25zLmhlaWdodH0sIHRvcD0ke3RvcH0sIGxlZnQ9JHtsZWZ0fWApO1xuXG5cdFx0Ly8gUHV0cyBmb2N1cyBvbiB0aGUgbmV3V2luZG93XG5cdFx0aWYgKHdpbmRvdy5mb2N1cykge1xuXHRcdFx0bmV3V2luZG93LmZvY3VzKCk7XG5cdFx0fVxuXHR9XG59O1xuIiwiLyoqXG4gKiBHbG9iYWwgT3BlblNoYXJlIEFQSSB0byBnZW5lcmF0ZSBpbnN0YW5jZXMgcHJvZ3JhbW1hdGljYWxseVxuICovXG5cbmNvbnN0IE9TID0gcmVxdWlyZSgnLi9vcGVuLXNoYXJlJyk7XG5jb25zdCBTaGFyZVRyYW5zZm9ybXMgPSByZXF1aXJlKCcuL3NoYXJlLXRyYW5zZm9ybXMnKTtcbmNvbnN0IEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG5jb25zdCBkYXNoVG9DYW1lbCA9IHJlcXVpcmUoJy4uLy4uL2xpYi9kYXNoVG9DYW1lbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuXG5cdC8vIGdsb2JhbCBPcGVuU2hhcmUgcmVmZXJlbmNpbmcgaW50ZXJuYWwgY2xhc3MgZm9yIGluc3RhbmNlIGdlbmVyYXRpb25cblx0Y2xhc3MgT3BlblNoYXJlIHtcblxuXHRcdGNvbnN0cnVjdG9yKGRhdGEsIGVsZW1lbnQpIHtcblxuXHRcdFx0aWYgKCFkYXRhLmJpbmRDbGljaykgZGF0YS5iaW5kQ2xpY2sgPSB0cnVlO1xuXG5cdFx0XHRsZXQgZGFzaCA9IGRhdGEudHlwZS5pbmRleE9mKCctJyk7XG5cblx0XHRcdGlmIChkYXNoID4gLTEpIHtcblx0XHRcdFx0ZGF0YS50eXBlID0gZGFzaFRvQ2FtZWwoZGFzaCwgZGF0YS50eXBlKTtcblx0XHRcdH1cblxuXHRcdFx0bGV0IG5vZGU7XG5cdFx0XHR0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuXHRcdFx0dGhpcy5kYXRhID0gZGF0YTtcblxuXHRcdFx0dGhpcy5vcyA9IG5ldyBPUyhkYXRhLnR5cGUsIFNoYXJlVHJhbnNmb3Jtc1tkYXRhLnR5cGVdKTtcblx0XHRcdHRoaXMub3Muc2V0RGF0YShkYXRhKTtcblxuXHRcdFx0aWYgKCFlbGVtZW50IHx8IGRhdGEuZWxlbWVudCkge1xuXHRcdFx0XHRlbGVtZW50ID0gZGF0YS5lbGVtZW50O1xuXHRcdFx0XHRub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChlbGVtZW50IHx8ICdhJyk7XG5cdFx0XHRcdGlmIChkYXRhLnR5cGUpIHtcblx0XHRcdFx0XHRub2RlLmNsYXNzTGlzdC5hZGQoJ29wZW4tc2hhcmUtbGluaycsIGRhdGEudHlwZSk7XG5cdFx0XHRcdFx0bm9kZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZScsIGRhdGEudHlwZSk7XG5cdFx0XHRcdFx0bm9kZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1ub2RlJywgZGF0YS50eXBlKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoZGF0YS5pbm5lckhUTUwpIG5vZGUuaW5uZXJIVE1MID0gZGF0YS5pbm5lckhUTUw7XG5cdFx0XHR9XG5cdFx0XHRpZiAobm9kZSkgZWxlbWVudCA9IG5vZGU7XG5cblx0XHRcdGlmIChkYXRhLmJpbmRDbGljaykge1xuXHRcdFx0XHRlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcblx0XHRcdFx0XHR0aGlzLnNoYXJlKCk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGF0YS5hcHBlbmRUbykge1xuXHRcdFx0XHRkYXRhLmFwcGVuZFRvLmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGF0YS5jbGFzc2VzICYmIEFycmF5LmlzQXJyYXkoZGF0YS5jbGFzc2VzKSkge1xuXHRcdFx0XHRkYXRhLmNsYXNzZXMuZm9yRWFjaChjc3NDbGFzcyA9PiB7XG5cdFx0XHRcdFx0ZWxlbWVudC5jbGFzc0xpc3QuYWRkKGNzc0NsYXNzKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkYXRhLnR5cGUudG9Mb3dlckNhc2UoKSA9PT0gJ3BheXBhbCcpIHtcblx0XHRcdFx0Y29uc3QgYWN0aW9uID0gZGF0YS5zYW5kYm94ID9cblx0XHRcdFx0ICAgXCJodHRwczovL3d3dy5zYW5kYm94LnBheXBhbC5jb20vY2dpLWJpbi93ZWJzY3JcIiA6XG5cdFx0XHRcdCAgIFwiaHR0cHM6Ly93d3cucGF5cGFsLmNvbS9jZ2ktYmluL3dlYnNjclwiO1xuXG5cdFx0XHRcdGNvbnN0IGJ1eUdJRiA9IGRhdGEuc2FuZGJveCA/XG5cdFx0XHRcdFx0XCJodHRwczovL3d3dy5zYW5kYm94LnBheXBhbC5jb20vZW5fVVMvaS9idG4vYnRuX2J1eW5vd19MRy5naWZcIiA6XG5cdFx0XHRcdFx0XCJodHRwczovL3d3dy5wYXlwYWxvYmplY3RzLmNvbS9lbl9VUy9pL2J0bi9idG5fYnV5bm93X0xHLmdpZlwiO1xuXG5cdFx0XHRcdGNvbnN0IHBpeGVsR0lGID0gZGF0YS5zYW5kYm94ID9cblx0XHRcdFx0XHRcImh0dHBzOi8vd3d3LnNhbmRib3gucGF5cGFsLmNvbS9lbl9VUy9pL3Njci9waXhlbC5naWZcIiA6XG5cdFx0XHRcdFx0XCJodHRwczovL3d3dy5wYXlwYWxvYmplY3RzLmNvbS9lbl9VUy9pL3Njci9waXhlbC5naWZcIjtcblxuXG5cdFx0XHRcdGNvbnN0IHBheXBhbEJ1dHRvbiA9IGA8Zm9ybSBhY3Rpb249JHthY3Rpb259IG1ldGhvZD1cInBvc3RcIiB0YXJnZXQ9XCJfYmxhbmtcIj5cblxuXHRcdFx0XHQgIDwhLS0gU2F2ZWQgYnV0dG9ucyB1c2UgdGhlIFwic2VjdXJlIGNsaWNrXCIgY29tbWFuZCAtLT5cblx0XHRcdFx0ICA8aW5wdXQgdHlwZT1cImhpZGRlblwiIG5hbWU9XCJjbWRcIiB2YWx1ZT1cIl9zLXhjbGlja1wiPlxuXG5cdFx0XHRcdCAgPCEtLSBTYXZlZCBidXR0b25zIGFyZSBpZGVudGlmaWVkIGJ5IHRoZWlyIGJ1dHRvbiBJRHMgLS0+XG5cdFx0XHRcdCAgPGlucHV0IHR5cGU9XCJoaWRkZW5cIiBuYW1lPVwiaG9zdGVkX2J1dHRvbl9pZFwiIHZhbHVlPVwiJHtkYXRhLmJ1dHRvbklkfVwiPlxuXG5cdFx0XHRcdCAgPCEtLSBTYXZlZCBidXR0b25zIGRpc3BsYXkgYW4gYXBwcm9wcmlhdGUgYnV0dG9uIGltYWdlLiAtLT5cblx0XHRcdFx0ICA8aW5wdXQgdHlwZT1cImltYWdlXCIgbmFtZT1cInN1Ym1pdFwiXG5cdFx0XHRcdCAgICBzcmM9JHtidXlHSUZ9XG5cdFx0XHRcdCAgICBhbHQ9XCJQYXlQYWwgLSBUaGUgc2FmZXIsIGVhc2llciB3YXkgdG8gcGF5IG9ubGluZVwiPlxuXHRcdFx0XHQgIDxpbWcgYWx0PVwiXCIgd2lkdGg9XCIxXCIgaGVpZ2h0PVwiMVwiXG5cdFx0XHRcdCAgICBzcmM9JHtwaXhlbEdJRn0gPlxuXG5cdFx0XHRcdDwvZm9ybT5gO1xuXG5cdFx0XHRcdGNvbnN0IGhpZGRlbkRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHRcdFx0XHRoaWRkZW5EaXYuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblx0XHRcdFx0aGlkZGVuRGl2LmlubmVySFRNTCA9IHBheXBhbEJ1dHRvbjtcblx0XHRcdFx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChoaWRkZW5EaXYpO1xuXG5cdFx0XHRcdHRoaXMucGF5cGFsID0gaGlkZGVuRGl2LnF1ZXJ5U2VsZWN0b3IoJ2Zvcm0nKTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5lbGVtZW50ID0gZWxlbWVudDtcblx0XHRcdHJldHVybiBlbGVtZW50O1xuXHRcdH1cblxuXHRcdC8vIHB1YmxpYyBzaGFyZSBtZXRob2QgdG8gdHJpZ2dlciBzaGFyZSBwcm9ncmFtbWF0aWNhbGx5XG5cdFx0c2hhcmUoZSkge1xuXHRcdFx0Ly8gaWYgZHluYW1pYyBpbnN0YW5jZSB0aGVuIGZldGNoIGF0dHJpYnV0ZXMgYWdhaW4gaW4gY2FzZSBvZiB1cGRhdGVzXG5cdFx0XHRpZiAodGhpcy5kYXRhLmR5bmFtaWMpIHtcblx0XHRcdFx0dGhpcy5vcy5zZXREYXRhKGRhdGEpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAodGhpcy5kYXRhLnR5cGUudG9Mb3dlckNhc2UoKSA9PT0gJ3BheXBhbCcpIHtcblx0XHRcdFx0dGhpcy5wYXlwYWwuc3VibWl0KCk7XG5cdFx0XHR9IGVsc2UgdGhpcy5vcy5zaGFyZShlKTtcblxuXHRcdFx0RXZlbnRzLnRyaWdnZXIodGhpcy5lbGVtZW50LCAnc2hhcmVkJyk7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIE9wZW5TaGFyZTtcbn07XG4iLCIvKipcbiAqIE9iamVjdCBvZiB0cmFuc2Zvcm0gZnVuY3Rpb25zIGZvciBlYWNoIG9wZW5zaGFyZSBhcGlcbiAqIFRyYW5zZm9ybSBmdW5jdGlvbnMgcGFzc2VkIGludG8gT3BlblNoYXJlIGluc3RhbmNlIHdoZW4gaW5zdGFudGlhdGVkXG4gKiBSZXR1cm4gb2JqZWN0IGNvbnRhaW5pbmcgVVJMIGFuZCBrZXkvdmFsdWUgYXJnc1xuICovXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuXHQvLyBzZXQgVHdpdHRlciBzaGFyZSBVUkxcblx0dHdpdHRlcjogZnVuY3Rpb24oZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHQvLyBpZiBpT1MgdXNlciBhbmQgaW9zIGRhdGEgYXR0cmlidXRlIGRlZmluZWRcblx0XHQvLyBidWlsZCBpT1MgVVJMIHNjaGVtZSBhcyBzaW5nbGUgc3RyaW5nXG5cdFx0aWYgKGlvcyAmJiBkYXRhLmlvcykge1xuXG5cdFx0XHRsZXQgbWVzc2FnZSA9IGBgO1xuXG5cdFx0XHRpZiAoZGF0YS50ZXh0KSB7XG5cdFx0XHRcdG1lc3NhZ2UgKz0gZGF0YS50ZXh0O1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGF0YS51cmwpIHtcblx0XHRcdFx0bWVzc2FnZSArPSBgIC0gJHtkYXRhLnVybH1gO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGF0YS5oYXNodGFncykge1xuXHRcdFx0XHRsZXQgdGFncyA9IGRhdGEuaGFzaHRhZ3Muc3BsaXQoJywnKTtcblx0XHRcdFx0dGFncy5mb3JFYWNoKGZ1bmN0aW9uKHRhZykge1xuXHRcdFx0XHRcdG1lc3NhZ2UgKz0gYCAjJHt0YWd9YDtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkYXRhLnZpYSkge1xuXHRcdFx0XHRtZXNzYWdlICs9IGAgdmlhICR7ZGF0YS52aWF9YDtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0dXJsOiAndHdpdHRlcjovL3Bvc3Q/Jyxcblx0XHRcdFx0ZGF0YToge1xuXHRcdFx0XHRcdG1lc3NhZ2U6IG1lc3NhZ2Vcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiAnaHR0cHM6Ly90d2l0dGVyLmNvbS9zaGFyZT8nLFxuXHRcdFx0ZGF0YTogZGF0YSxcblx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdHdpZHRoOiA3MDAsXG5cdFx0XHRcdGhlaWdodDogMjk2XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBzZXQgVHdpdHRlciByZXR3ZWV0IFVSTFxuXHR0d2l0dGVyUmV0d2VldDogZnVuY3Rpb24oZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHQvLyBpZiBpT1MgdXNlciBhbmQgaW9zIGRhdGEgYXR0cmlidXRlIGRlZmluZWRcblx0XHRpZiAoaW9zICYmIGRhdGEuaW9zKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR1cmw6ICd0d2l0dGVyOi8vc3RhdHVzPycsXG5cdFx0XHRcdGRhdGE6IHtcblx0XHRcdFx0XHRpZDogZGF0YS50d2VldElkXG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybDogJ2h0dHBzOi8vdHdpdHRlci5jb20vaW50ZW50L3JldHdlZXQ/Jyxcblx0XHRcdGRhdGE6IHtcblx0XHRcdFx0dHdlZXRfaWQ6IGRhdGEudHdlZXRJZCxcblx0XHRcdFx0cmVsYXRlZDogZGF0YS5yZWxhdGVkXG5cdFx0XHR9LFxuXHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0d2lkdGg6IDcwMCxcblx0XHRcdFx0aGVpZ2h0OiAyOTZcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBUd2l0dGVyIGxpa2UgVVJMXG5cdHR3aXR0ZXJMaWtlOiBmdW5jdGlvbihkYXRhLCBpb3MgPSBmYWxzZSkge1xuXHRcdC8vIGlmIGlPUyB1c2VyIGFuZCBpb3MgZGF0YSBhdHRyaWJ1dGUgZGVmaW5lZFxuXHRcdGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVybDogJ3R3aXR0ZXI6Ly9zdGF0dXM/Jyxcblx0XHRcdFx0ZGF0YToge1xuXHRcdFx0XHRcdGlkOiBkYXRhLnR3ZWV0SWRcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiAnaHR0cHM6Ly90d2l0dGVyLmNvbS9pbnRlbnQvZmF2b3JpdGU/Jyxcblx0XHRcdGRhdGE6IHtcblx0XHRcdFx0dHdlZXRfaWQ6IGRhdGEudHdlZXRJZCxcblx0XHRcdFx0cmVsYXRlZDogZGF0YS5yZWxhdGVkXG5cdFx0XHR9LFxuXHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0d2lkdGg6IDcwMCxcblx0XHRcdFx0aGVpZ2h0OiAyOTZcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBUd2l0dGVyIGZvbGxvdyBVUkxcblx0dHdpdHRlckZvbGxvdzogZnVuY3Rpb24oZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHQvLyBpZiBpT1MgdXNlciBhbmQgaW9zIGRhdGEgYXR0cmlidXRlIGRlZmluZWRcblx0XHRpZiAoaW9zICYmIGRhdGEuaW9zKSB7XG5cdFx0XHRsZXQgaW9zRGF0YSA9IGRhdGEuc2NyZWVuTmFtZSA/IHtcblx0XHRcdFx0J3NjcmVlbl9uYW1lJzogZGF0YS5zY3JlZW5OYW1lXG5cdFx0XHR9IDoge1xuXHRcdFx0XHQnaWQnOiBkYXRhLnVzZXJJZFxuXHRcdFx0fTtcblxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0dXJsOiAndHdpdHRlcjovL3VzZXI/Jyxcblx0XHRcdFx0ZGF0YTogaW9zRGF0YVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiAnaHR0cHM6Ly90d2l0dGVyLmNvbS9pbnRlbnQvdXNlcj8nLFxuXHRcdFx0ZGF0YToge1xuXHRcdFx0XHRzY3JlZW5fbmFtZTogZGF0YS5zY3JlZW5OYW1lLFxuXHRcdFx0XHR1c2VyX2lkOiBkYXRhLnVzZXJJZFxuXHRcdFx0fSxcblx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdHdpZHRoOiA3MDAsXG5cdFx0XHRcdGhlaWdodDogMjk2XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBzZXQgRmFjZWJvb2sgc2hhcmUgVVJMXG5cdGZhY2Vib29rOiBmdW5jdGlvbihkYXRhKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybDogJ2h0dHBzOi8vd3d3LmZhY2Vib29rLmNvbS9kaWFsb2cvZmVlZD9hcHBfaWQ9OTYxMzQyNTQzOTIyMzIyJnJlZGlyZWN0X3VyaT1odHRwOi8vZmFjZWJvb2suY29tJicsXG5cdFx0XHRkYXRhOiBkYXRhLFxuXHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0d2lkdGg6IDU2MCxcblx0XHRcdFx0aGVpZ2h0OiA1OTNcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBGYWNlYm9vayBzZW5kIFVSTFxuXHRmYWNlYm9va1NlbmQ6IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiAnaHR0cHM6Ly93d3cuZmFjZWJvb2suY29tL2RpYWxvZy9zZW5kP2FwcF9pZD05NjEzNDI1NDM5MjIzMjImcmVkaXJlY3RfdXJpPWh0dHA6Ly9mYWNlYm9vay5jb20mJyxcblx0XHRcdGRhdGE6IGRhdGEsXG5cdFx0XHRwb3B1cDoge1xuXHRcdFx0XHR3aWR0aDogOTgwLFxuXHRcdFx0XHRoZWlnaHQ6IDU5NlxuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gc2V0IFlvdVR1YmUgcGxheSBVUkxcblx0eW91dHViZTogZnVuY3Rpb24oZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHQvLyBpZiBpT1MgdXNlclxuXHRcdGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVybDogYHlvdXR1YmU6JHtkYXRhLnZpZGVvfT9gXG5cdFx0XHR9O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR1cmw6IGBodHRwczovL3d3dy55b3V0dWJlLmNvbS93YXRjaD92PSR7ZGF0YS52aWRlb30/YCxcblx0XHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0XHR3aWR0aDogMTA4Nixcblx0XHRcdFx0XHRoZWlnaHQ6IDYwOFxuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdH1cblx0fSxcblxuXHQvLyBzZXQgWW91VHViZSBzdWJjcmliZSBVUkxcblx0eW91dHViZVN1YnNjcmliZTogZnVuY3Rpb24oZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHQvLyBpZiBpT1MgdXNlclxuXHRcdGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVybDogYHlvdXR1YmU6Ly93d3cueW91dHViZS5jb20vdXNlci8ke2RhdGEudXNlcn0/YFxuXHRcdFx0fTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0dXJsOiBgaHR0cHM6Ly93d3cueW91dHViZS5jb20vdXNlci8ke2RhdGEudXNlcn0/YCxcblx0XHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0XHR3aWR0aDogODgwLFxuXHRcdFx0XHRcdGhlaWdodDogMzUwXG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0fVxuXHR9LFxuXG5cdC8vIHNldCBJbnN0YWdyYW0gZm9sbG93IFVSTFxuXHRpbnN0YWdyYW06IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiBgaW5zdGFncmFtOi8vY2FtZXJhP2Bcblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBJbnN0YWdyYW0gZm9sbG93IFVSTFxuXHRpbnN0YWdyYW1Gb2xsb3c6IGZ1bmN0aW9uKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG5cdFx0Ly8gaWYgaU9TIHVzZXJcblx0XHRpZiAoaW9zICYmIGRhdGEuaW9zKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR1cmw6ICdpbnN0YWdyYW06Ly91c2VyPycsXG5cdFx0XHRcdGRhdGE6IGRhdGFcblx0XHRcdH07XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVybDogYGh0dHA6Ly93d3cuaW5zdGFncmFtLmNvbS8ke2RhdGEudXNlcm5hbWV9P2AsXG5cdFx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdFx0d2lkdGg6IDk4MCxcblx0XHRcdFx0XHRoZWlnaHQ6IDY1NVxuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdH1cblx0fSxcblxuXHQvLyBzZXQgU25hcGNoYXQgZm9sbG93IFVSTFxuXHRzbmFwY2hhdCAoZGF0YSkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6IGBzbmFwY2hhdDovL2FkZC8ke2RhdGEudXNlcm5hbWV9P2Bcblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBHb29nbGUgc2hhcmUgVVJMXG5cdGdvb2dsZSAoZGF0YSkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6ICdodHRwczovL3BsdXMuZ29vZ2xlLmNvbS9zaGFyZT8nLFxuXHRcdFx0ZGF0YTogZGF0YSxcblx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdHdpZHRoOiA0OTUsXG5cdFx0XHRcdGhlaWdodDogODE1XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBzZXQgR29vZ2xlIG1hcHMgVVJMXG5cdGdvb2dsZU1hcHMgKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG5cblx0XHRpZiAoZGF0YS5zZWFyY2gpIHtcblx0XHRcdGRhdGEucSA9IGRhdGEuc2VhcmNoO1xuXHRcdFx0ZGVsZXRlIGRhdGEuc2VhcmNoO1xuXHRcdH1cblxuXHRcdC8vIGlmIGlPUyB1c2VyIGFuZCBpb3MgZGF0YSBhdHRyaWJ1dGUgZGVmaW5lZFxuXHRcdGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVybDogJ2NvbWdvb2dsZW1hcHM6Ly8/Jyxcblx0XHRcdFx0ZGF0YTogaW9zXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdGlmICghaW9zICYmIGRhdGEuaW9zKSB7XG5cdFx0XHRkZWxldGUgZGF0YS5pb3M7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybDogJ2h0dHBzOi8vbWFwcy5nb29nbGUuY29tLz8nLFxuXHRcdFx0ZGF0YTogZGF0YSxcblx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdHdpZHRoOiA4MDAsXG5cdFx0XHRcdGhlaWdodDogNjAwXG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBzZXQgUGludGVyZXN0IHNoYXJlIFVSTFxuXHRwaW50ZXJlc3QgKGRhdGEpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiAnaHR0cHM6Ly9waW50ZXJlc3QuY29tL3Bpbi9jcmVhdGUvYm9va21hcmtsZXQvPycsXG5cdFx0XHRkYXRhOiBkYXRhLFxuXHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0d2lkdGg6IDc0NSxcblx0XHRcdFx0aGVpZ2h0OiA2MjBcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBMaW5rZWRJbiBzaGFyZSBVUkxcblx0bGlua2VkaW4gKGRhdGEpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiAnaHR0cDovL3d3dy5saW5rZWRpbi5jb20vc2hhcmVBcnRpY2xlPycsXG5cdFx0XHRkYXRhOiBkYXRhLFxuXHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0d2lkdGg6IDc4MCxcblx0XHRcdFx0aGVpZ2h0OiA0OTJcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBCdWZmZXIgc2hhcmUgVVJMXG5cdGJ1ZmZlciAoZGF0YSkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6ICdodHRwOi8vYnVmZmVyYXBwLmNvbS9hZGQ/Jyxcblx0XHRcdGRhdGE6IGRhdGEsXG5cdFx0XHRwb3B1cDoge1xuXHRcdFx0XHR3aWR0aDogNzQ1LFxuXHRcdFx0XHRoZWlnaHQ6IDM0NVxuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gc2V0IFR1bWJsciBzaGFyZSBVUkxcblx0dHVtYmxyIChkYXRhKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybDogJ2h0dHBzOi8vd3d3LnR1bWJsci5jb20vd2lkZ2V0cy9zaGFyZS90b29sPycsXG5cdFx0XHRkYXRhOiBkYXRhLFxuXHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0d2lkdGg6IDU0MCxcblx0XHRcdFx0aGVpZ2h0OiA5NDBcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBSZWRkaXQgc2hhcmUgVVJMXG5cdHJlZGRpdCAoZGF0YSkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6ICdodHRwOi8vcmVkZGl0LmNvbS9zdWJtaXQ/Jyxcblx0XHRcdGRhdGE6IGRhdGEsXG5cdFx0XHRwb3B1cDoge1xuXHRcdFx0XHR3aWR0aDogODYwLFxuXHRcdFx0XHRoZWlnaHQ6IDg4MFxuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gc2V0IEZsaWNrciBmb2xsb3cgVVJMXG5cdGZsaWNrciAoZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHQvLyBpZiBpT1MgdXNlclxuXHRcdGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVybDogYGZsaWNrcjovL3Bob3Rvcy8ke2RhdGEudXNlcm5hbWV9P2Bcblx0XHRcdH07XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVybDogYGh0dHA6Ly93d3cuZmxpY2tyLmNvbS9waG90b3MvJHtkYXRhLnVzZXJuYW1lfT9gLFxuXHRcdFx0XHRwb3B1cDoge1xuXHRcdFx0XHRcdHdpZHRoOiA2MDAsXG5cdFx0XHRcdFx0aGVpZ2h0OiA2NTBcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9XG5cdH0sXG5cblx0Ly8gc2V0IFdoYXRzQXBwIHNoYXJlIFVSTFxuXHR3aGF0c2FwcCAoZGF0YSkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6ICd3aGF0c2FwcDovL3NlbmQ/Jyxcblx0XHRcdGRhdGE6IGRhdGFcblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBzbXMgc2hhcmUgVVJMXG5cdHNtcyAoZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiBpb3MgPyAnc21zOiYnIDogJ3Ntczo/Jyxcblx0XHRcdGRhdGE6IGRhdGFcblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBFbWFpbCBzaGFyZSBVUkxcblx0ZW1haWwgKGRhdGEpIHtcblxuXHRcdHZhciB1cmwgPSBgbWFpbHRvOmA7XG5cblx0XHQvLyBpZiB0byBhZGRyZXNzIHNwZWNpZmllZCB0aGVuIGFkZCB0byBVUkxcblx0XHRpZiAoZGF0YS50byAhPT0gbnVsbCkge1xuXHRcdFx0dXJsICs9IGAke2RhdGEudG99YDtcblx0XHR9XG5cblx0XHR1cmwgKz0gYD9gO1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybDogdXJsLFxuXHRcdFx0ZGF0YToge1xuXHRcdFx0XHRzdWJqZWN0OiBkYXRhLnN1YmplY3QsXG5cdFx0XHRcdGJvZHk6IGRhdGEuYm9keVxuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gc2V0IEdpdGh1YiBmb3JrIFVSTFxuXHRnaXRodWIgKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG5cdFx0bGV0IHVybCA9IGRhdGEucmVwbyA/XG5cdFx0XHRgaHR0cHM6Ly9naXRodWIuY29tLyR7ZGF0YS5yZXBvfWAgOlxuXHRcdFx0ZGF0YS51cmw7XG5cblx0XHRpZiAoZGF0YS5pc3N1ZSkge1xuXHRcdFx0dXJsICs9ICcvaXNzdWVzL25ldz90aXRsZT0nICtcblx0XHRcdFx0ZGF0YS5pc3N1ZSArXG5cdFx0XHRcdCcmYm9keT0nICtcblx0XHRcdFx0ZGF0YS5ib2R5O1xuXHRcdH1cblxuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6IHVybCArICc/Jyxcblx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdHdpZHRoOiAxMDIwLFxuXHRcdFx0XHRoZWlnaHQ6IDMyM1xuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gc2V0IERyaWJiYmxlIHNoYXJlIFVSTFxuXHRkcmliYmJsZSAoZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHRjb25zdCB1cmwgPSBkYXRhLnNob3QgP1xuXHRcdFx0YGh0dHBzOi8vZHJpYmJibGUuY29tL3Nob3RzLyR7ZGF0YS5zaG90fT9gIDpcblx0XHRcdGRhdGEudXJsICsgJz8nO1xuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6IHVybCxcblx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdHdpZHRoOiA0NDAsXG5cdFx0XHRcdGhlaWdodDogNjQwXG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHRjb2RlcGVuIChkYXRhKSB7XG5cdFx0Y29uc3QgdXJsID0gKGRhdGEucGVuICYmIGRhdGEudXNlcm5hbWUgJiYgZGF0YS52aWV3KSA/XG5cdFx0XHRgaHR0cHM6Ly9jb2RlcGVuLmlvLyR7ZGF0YS51c2VybmFtZX0vJHtkYXRhLnZpZXd9LyR7ZGF0YS5wZW59P2AgOlxuXHRcdFx0ZGF0YS51cmwgKyAnPyc7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybDogdXJsLFxuXHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0d2lkdGg6IDEyMDAsXG5cdFx0XHRcdGhlaWdodDogODAwXG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHRwYXlwYWwgKGRhdGEpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0ZGF0YTogZGF0YVxuXHRcdH07XG5cdH1cbn07XG4iLCJjb25zdCBPcGVuU2hhcmUgPSB7XG4gIHNoYXJlOiByZXF1aXJlKCcuLi9zaGFyZS5qcycpLFxuICBjb3VudDogcmVxdWlyZSgnLi4vY291bnQuanMnKSxcbiAgYW5hbHl0aWNzOiByZXF1aXJlKCcuLi9hbmFseXRpY3MuanMnKSxcbn07XG5cbk9wZW5TaGFyZS5hbmFseXRpY3MoJ3RhZ01hbmFnZXInLCAoKSA9PiB7XG4gIGNvbnNvbGUubG9nKCd0YWcgbWFuYWdlciBsb2FkZWQnKTtcbn0pO1xuXG5PcGVuU2hhcmUuYW5hbHl0aWNzKCdldmVudCcsICgpID0+IHtcbiAgY29uc29sZS5sb2coJ2dvb2dsZSBhbmFseXRpY3MgZXZlbnRzIGxvYWRlZCcpO1xufSk7XG5cbk9wZW5TaGFyZS5hbmFseXRpY3MoJ3NvY2lhbCcsICgpID0+IHtcbiAgY29uc29sZS5sb2coJ2dvb2dsZSBhbmFseXRpY3Mgc29jaWFsIGxvYWRlZCcpO1xufSk7XG5cbmNvbnN0IGR5bmFtaWNOb2RlRGF0YSA9IHtcbiAgdXJsOiAnaHR0cDovL3d3dy5kaWdpdGFsc3VyZ2VvbnMuY29tJyxcbiAgdmlhOiAnZGlnaXRhbHN1cmdlb25zJyxcbiAgdGV4dDogJ0ZvcndhcmQgT2JzZXNzZWQnLFxuICBoYXNodGFnczogJ2ZvcndhcmRvYnNlc3NlZCcsXG4gIGJ1dHRvbjogJ09wZW4gU2hhcmUgV2F0Y2hlciEnLFxufTtcblxuZnVuY3Rpb24gY3JlYXRlT3BlblNoYXJlTm9kZShkYXRhKSB7XG4gIGNvbnN0IG9wZW5TaGFyZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcblxuICBvcGVuU2hhcmUuY2xhc3NMaXN0LmFkZCgnb3Blbi1zaGFyZS1saW5rJywgJ3R3aXR0ZXInKTtcbiAgb3BlblNoYXJlLnNldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlJywgJ3R3aXR0ZXInKTtcbiAgb3BlblNoYXJlLnNldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXVybCcsIGRhdGEudXJsKTtcbiAgb3BlblNoYXJlLnNldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXZpYScsIGRhdGEudmlhKTtcbiAgb3BlblNoYXJlLnNldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXRleHQnLCBkYXRhLnRleHQpO1xuICBvcGVuU2hhcmUuc2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtaGFzaHRhZ3MnLCBkYXRhLmhhc2h0YWdzKTtcbiAgb3BlblNoYXJlLmlubmVySFRNTCA9IGA8c3BhbiBjbGFzcz1cImZhIGZhLXR3aXR0ZXJcIj48L3NwYW4+JHtkYXRhLmJ1dHRvbn1gO1xuXG4gIGNvbnN0IG5vZGUgPSBuZXcgT3BlblNoYXJlLnNoYXJlKHsgLy9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgdHlwZTogJ3R3aXR0ZXInLFxuICAgIHVybDogJ2h0dHA6Ly93d3cuZGlnaXRhbHN1cmdlb25zLmNvbScsXG4gICAgdmlhOiAnZGlnaXRhbHN1cmdlb25zJyxcbiAgICBoYXNodGFnczogJ2ZvcndhcmRvYnNlc3NlZCcsXG4gICAgYXBwZW5kVG86IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5vcGVuLXNoYXJlLXdhdGNoJyksXG4gICAgaW5uZXJIVE1MOiAnQ3JlYXRlZCB2aWEgT3BlblNoYXJlQVBJJyxcbiAgICBlbGVtZW50OiAnZGl2JyxcbiAgICBjbGFzc2VzOiBbJ3dvdycsICdzdWNoJywgJ2NsYXNzZXMnXSxcbiAgfSk7XG5cbiAgcmV0dXJuIG9wZW5TaGFyZTtcbn1cblxuZnVuY3Rpb24gYWRkTm9kZSgpIHtcbiAgY29uc3QgZGF0YSA9IGR5bmFtaWNOb2RlRGF0YTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLm9wZW4tc2hhcmUtd2F0Y2gnKVxuICAgIC5hcHBlbmRDaGlsZChjcmVhdGVPcGVuU2hhcmVOb2RlKGRhdGEpKTtcbn1cblxud2luZG93LmFkZE5vZGUgPSBhZGROb2RlO1xuXG5mdW5jdGlvbiBhZGROb2RlV2l0aENvdW50KCkge1xuICBjb25zdCBkYXRhID0gZHluYW1pY05vZGVEYXRhO1xuICBuZXcgT3BlblNoYXJlLmNvdW50KHsgLy9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgdHlwZTogJ2ZhY2Vib29rJyxcbiAgICB1cmw6ICdodHRwczovL3d3dy5kaWdpdGFsc3VyZ2VvbnMuY29tLycsXG4gIH0sIChub2RlKSA9PiB7XG4gICAgY29uc3Qgb3MgPSBuZXcgT3BlblNoYXJlLnNoYXJlKHsgLy9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgICB0eXBlOiAndHdpdHRlcicsXG4gICAgICB1cmw6ICdodHRwOi8vd3d3LmRpZ2l0YWxzdXJnZW9ucy5jb20nLFxuICAgICAgdmlhOiAnZGlnaXRhbHN1cmdlb25zJyxcbiAgICAgIGhhc2h0YWdzOiAnZm9yd2FyZG9ic2Vzc2VkJyxcbiAgICAgIGlubmVySFRNTDogJ0NyZWF0ZWQgdmlhIE9wZW5TaGFyZUFQSScsXG4gICAgICBlbGVtZW50OiAnZGl2JyxcbiAgICAgIGNsYXNzZXM6IFsnd293JywgJ3N1Y2gnLCAnY2xhc3NlcyddLFxuICAgIH0pO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5jcmVhdGUtbm9kZS53LWNvdW50JylcbiAgICAuYXBwZW5kQ2hpbGQob3MpO1xuICAgIG9zLmFwcGVuZENoaWxkKG5vZGUpO1xuICB9KTtcbn1cblxud2luZG93LmFkZE5vZGVXaXRoQ291bnQgPSBhZGROb2RlV2l0aENvdW50O1xuXG5mdW5jdGlvbiBjcmVhdGVDb3VudE5vZGUoKSB7XG4gIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5jcmVhdGUtbm9kZS5jb3VudC1ub2RlcycpO1xuICBjb25zdCB0eXBlID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0LmNvdW50LXR5cGUnKS52YWx1ZTtcbiAgY29uc3QgdXJsID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0LmNvdW50LXVybCcpLnZhbHVlO1xuXG4gIG5ldyBPcGVuU2hhcmUuY291bnQoeyAvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgICB0eXBlOiB0eXBlLCAvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgICB1cmw6IHVybCwgLy9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgYXBwZW5kVG86IGNvbnRhaW5lcixcbiAgICBjbGFzc2VzOiBbJ3Rlc3QnXSxcbiAgfSwgKG5vZGUpID0+IHtcbiAgICBub2RlLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcbiAgfSk7XG5cblxuICBjb250YWluZXIucXVlcnlTZWxlY3RvcignaW5wdXQuY291bnQtdHlwZScpLnZhbHVlID0gJyc7XG4gIGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdpbnB1dC5jb3VudC11cmwnKS52YWx1ZSA9ICcnO1xufVxuXG53aW5kb3cuY3JlYXRlQ291bnROb2RlID0gY3JlYXRlQ291bnROb2RlO1xuXG4vLyB0ZXN0IEpTIE9wZW5TaGFyZSBBUEkgd2l0aCBkYXNoZXNcbm5ldyBPcGVuU2hhcmUuc2hhcmUoeyAvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgdHlwZTogJ2dvb2dsZU1hcHMnLFxuICBjZW50ZXI6ICc0MC43NjU4MTksLTczLjk3NTg2NicsXG4gIHZpZXc6ICd0cmFmZmljJyxcbiAgem9vbTogMTQsXG4gIGFwcGVuZFRvOiBkb2N1bWVudC5ib2R5LFxuICBpbm5lckhUTUw6ICdNYXBzJyxcbn0pO1xuXG5uZXcgT3BlblNoYXJlLnNoYXJlKHsgLy9lc2xpbnQtZGlzYWJsZS1saW5lXG4gIHR5cGU6ICd0d2l0dGVyLWZvbGxvdycsXG4gIHNjcmVlbk5hbWU6ICdkaWdpdGFsc3VyZ2VvbnMnLFxuICB1c2VySWQ6ICcxODE4OTEzMCcsXG4gIGFwcGVuZFRvOiBkb2N1bWVudC5ib2R5LFxuICBpbm5lckhUTUw6ICdGb2xsb3cgVGVzdCcsXG59KTtcblxuLy8gdGVzdCBQYXlQYWxcbm5ldyBPcGVuU2hhcmUuc2hhcmUoeyAvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgdHlwZTogJ3BheXBhbCcsXG4gIGJ1dHRvbklkOiAnMlAzUkpZRUZMN1o2MicsXG4gIHNhbmRib3g6IHRydWUsXG4gIGFwcGVuZFRvOiBkb2N1bWVudC5ib2R5LFxuICBpbm5lckhUTUw6ICdQYXlQYWwgVGVzdCcsXG59KTtcblxuLy8gYmluZCB0byBjb3VudCBsb2FkZWQgZXZlbnRcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ09wZW5TaGFyZS5jb3VudC1sb2FkZWQnLCAoKSA9PiB7XG4gIGNvbnNvbGUubG9nKCdPcGVuU2hhcmUgKGNvdW50KSBsb2FkZWQnKTtcbn0pO1xuXG4vLyBiaW5kIHRvIHNoYXJlIGxvYWRlZCBldmVudFxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignT3BlblNoYXJlLnNoYXJlLWxvYWRlZCcsICgpID0+IHtcbiAgY29uc29sZS5sb2coJ09wZW5TaGFyZSAoc2hhcmUpIGxvYWRlZCcpO1xuXG4gIC8vIGJpbmQgdG8gc2hhcmVkIGV2ZW50IG9uIGVhY2ggaW5kaXZpZHVhbCBub2RlXG4gIFtdLmZvckVhY2guY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1vcGVuLXNoYXJlXScpLCAobm9kZSkgPT4ge1xuICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcignT3BlblNoYXJlLnNoYXJlZCcsIChlKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZygnT3BlbiBTaGFyZSBTaGFyZWQnLCBlKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgY29uc3QgZXhhbXBsZXMgPSB7XG4gICAgdHdpdHRlcjogbmV3IE9wZW5TaGFyZS5zaGFyZSh7IC8vZXNsaW50LWRpc2FibGUtbGluZVxuICAgICAgdHlwZTogJ3R3aXR0ZXInLFxuICAgICAgYmluZENsaWNrOiB0cnVlLFxuICAgICAgdXJsOiAnaHR0cDovL2RpZ2l0YWxzdXJnZW9ucy5jb20nLFxuICAgICAgdmlhOiAnZGlnaXRhbHN1cmdlb25zJyxcbiAgICAgIHRleHQ6ICdEaWdpdGFsIFN1cmdlb25zJyxcbiAgICAgIGhhc2h0YWdzOiAnZm9yd2FyZG9ic2Vzc2VkJyxcbiAgICB9LCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbZGF0YS1hcGktZXhhbXBsZT1cInR3aXR0ZXJcIl0nKSksXG5cbiAgICBmYWNlYm9vazogbmV3IE9wZW5TaGFyZS5zaGFyZSh7IC8vZXNsaW50LWRpc2FibGUtbGluZVxuICAgICAgdHlwZTogJ2ZhY2Vib29rJyxcbiAgICAgIGJpbmRDbGljazogdHJ1ZSxcbiAgICAgIGxpbms6ICdodHRwOi8vZGlnaXRhbHN1cmdlb25zLmNvbScsXG4gICAgICBwaWN0dXJlOiAnaHR0cDovL3d3dy5kaWdpdGFsc3VyZ2VvbnMuY29tL2ltZy9hYm91dC9iZ19vZmZpY2VfdGVhbS5qcGcnLFxuICAgICAgY2FwdGlvbjogJ0RpZ2l0YWwgU3VyZ2VvbnMnLFxuICAgICAgZGVzY3JpcHRpb246ICdmb3J3YXJkb2JzZXNzZWQnLFxuICAgIH0sIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLWFwaS1leGFtcGxlPVwiZmFjZWJvb2tcIl0nKSksXG5cbiAgICBwaW50ZXJlc3Q6IG5ldyBPcGVuU2hhcmUuc2hhcmUoeyAvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgICAgIHR5cGU6ICdwaW50ZXJlc3QnLFxuICAgICAgYmluZENsaWNrOiB0cnVlLFxuICAgICAgdXJsOiAnaHR0cDovL2RpZ2l0YWxzdXJnZW9ucy5jb20nLFxuICAgICAgbWVkaWE6ICdodHRwOi8vd3d3LmRpZ2l0YWxzdXJnZW9ucy5jb20vaW1nL2Fib3V0L2JnX29mZmljZV90ZWFtLmpwZycsXG4gICAgICBkZXNjcmlwdGlvbjogJ0RpZ2l0YWwgU3VyZ2VvbnMnLFxuICAgICAgYXBwZW5kVG86IGRvY3VtZW50LmJvZHksXG4gICAgfSwgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignW2RhdGEtYXBpLWV4YW1wbGU9XCJwaW50ZXJlc3RcIl0nKSksXG5cbiAgICBlbWFpbDogbmV3IE9wZW5TaGFyZS5zaGFyZSh7IC8vZXNsaW50LWRpc2FibGUtbGluZVxuICAgICAgdHlwZTogJ2VtYWlsJyxcbiAgICAgIGJpbmRDbGljazogdHJ1ZSxcbiAgICAgIHRvOiAndGVjaHJvb21AZGlnaXRhbHN1cmdlb25zLmNvbScsXG4gICAgICBzdWJqZWN0OiAnRGlnaXRhbCBTdXJnZW9ucycsXG4gICAgICBib2R5OiAnRm9yd2FyZCBPYnNlc3NlZCcsXG4gICAgfSwgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignW2RhdGEtYXBpLWV4YW1wbGU9XCJlbWFpbFwiXScpKSxcbiAgfTtcbn0pO1xuXG4vLyBFeGFtcGxlIG9mIGxpc3RlbmluZyBmb3IgY291bnRlZCBldmVudHMgb24gaW5kaXZpZHVhbCB1cmxzIG9yIGFycmF5cyBvZiB1cmxzXG5jb25zdCB1cmxzID0gW1xuICAnZmFjZWJvb2snLFxuICAnZ29vZ2xlJyxcbiAgJ2xpbmtlZGluJyxcbiAgJ3JlZGRpdCcsXG4gICdwaW50ZXJlc3QnLFxuICBbXG4gICAgJ2dvb2dsZScsXG4gICAgJ2xpbmtlZGluJyxcbiAgICAncmVkZGl0JyxcbiAgICAncGludGVyZXN0JyxcbiAgXSxcbl07XG5cbnVybHMuZm9yRWFjaCgodXJsKSA9PiB7XG4gIGlmIChBcnJheS5pc0FycmF5KHVybCkpIHtcbiAgICB1cmwgPSB1cmwuam9pbignLCcpO1xuICB9XG4gIGNvbnN0IGNvdW50Tm9kZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYFtkYXRhLW9wZW4tc2hhcmUtY291bnQ9XCIke3VybH1cIl1gKTtcblxuICBbXS5mb3JFYWNoLmNhbGwoY291bnROb2RlLCAobm9kZSkgPT4ge1xuICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihgT3BlblNoYXJlLmNvdW50ZWQtJHt1cmx9YCwgKCkgPT4ge1xuICAgICAgY29uc3QgY291bnRzID0gbm9kZS5pbm5lckhUTUw7XG4gICAgICBpZiAoY291bnRzKSBjb25zb2xlLmxvZyh1cmwsICdzaGFyZXM6ICcsIGNvdW50cyk7XG4gICAgfSk7XG4gIH0pO1xufSk7XG5cbi8vIHRlc3QgdHdpdHRlciBjb3VudCBqcyBhcGlcbm5ldyBPcGVuU2hhcmUuY291bnQoeyAvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgdHlwZTogJ3R3aXR0ZXInLFxuICB1cmw6ICdodHRwczovL3d3dy5kaWdpdGFsc3VyZ2VvbnMuY29tL3Rob3VnaHRzL3RlY2hub2xvZ3kvdGhlLWJsb2NrY2hhaW4tcmV2b2x1dGlvbicsXG4gIGtleTogJ2RzdHdlZXRzJyxcbn0sIChub2RlKSA9PiB7XG4gIGNvbnN0IG9zID0gbmV3IE9wZW5TaGFyZS5zaGFyZSh7IC8vZXNsaW50LWRpc2FibGUtbGluZVxuICAgIHR5cGU6ICd0d2l0dGVyJyxcbiAgICB1cmw6ICdodHRwczovL3d3dy5kaWdpdGFsc3VyZ2VvbnMuY29tL3Rob3VnaHRzL3RlY2hub2xvZ3kvdGhlLWJsb2NrY2hhaW4tcmV2b2x1dGlvbicsXG4gICAgdmlhOiAnZGlnaXRhbHN1cmdlb25zJyxcbiAgICBoYXNodGFnczogJ2ZvcndhcmRvYnNlc3NlZCwgYmxvY2tjaGFpbicsXG4gICAgYXBwZW5kVG86IGRvY3VtZW50LmJvZHksXG4gICAgaW5uZXJIVE1MOiAnQkxPQ0tDSEFJTicsXG4gIH0pO1xuICBvcy5hcHBlbmRDaGlsZChub2RlKTtcbn0pO1xuIl19
