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

},{}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
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

},{"./initializeNodes":6,"./initializeWatcher":8}],5:[function(require,module,exports){
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

},{"../src/modules/count":15}],6:[function(require,module,exports){
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

},{"../analytics":1,"../src/modules/events":17}],7:[function(require,module,exports){
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

},{"../src/modules/open-share":18,"../src/modules/share-transforms":20,"./dashToCamel":3,"./setData":9,"./share":10}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
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

},{"../src/modules/events":17,"./setData":9}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
'use strict';

module.exports = function () {

	var DataAttr = require('./modules/data-attr'),
	    ShareAPI = require('./modules/share-api'),
	    Events = require('./modules/events'),
	    OpenShare = require('./modules/open-share'),
	    ShareTransforms = require('./modules/share-transforms'),
	    Count = require('./modules/count'),
	    CountAPI = require('./modules/count-api'),
	    analyticsAPI = require('../analytics');

	DataAttr(OpenShare, Count, ShareTransforms, Events);
	window.OpenShare = {
		share: ShareAPI(OpenShare, ShareTransforms, Events),
		count: CountAPI(),
		analytics: analyticsAPI
	};
}();

},{"../analytics":1,"./modules/count":15,"./modules/count-api":13,"./modules/data-attr":16,"./modules/events":17,"./modules/open-share":18,"./modules/share-api":19,"./modules/share-transforms":20}],13:[function(require,module,exports){
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

},{"./count":15}],14:[function(require,module,exports){
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

},{"../../lib/countReduce":2,"../../lib/storeCount":11}],15:[function(require,module,exports){
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

},{"../../lib/countReduce":2,"../../lib/storeCount":11,"./count-transforms":14,"./events":17}],16:[function(require,module,exports){
'use strict';

module.exports = function () {
	document.addEventListener('DOMContentLoaded', require('../../lib/init')({
		selector: {
			share: '[data-open-share]:not([data-open-share-node])',
			count: '[data-open-share-count]:not([data-open-share-node])'
		},
		cb: {
			share: require('../../lib/initializeShareNode'),
			count: require('../../lib/initializeCountNode')
		}
	}));
};

},{"../../lib/init":4,"../../lib/initializeCountNode":5,"../../lib/initializeShareNode":7}],17:[function(require,module,exports){
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

},{"../../lib/dashToCamel":3,"./events":17,"./open-share":18,"./share-transforms":20}],20:[function(require,module,exports){
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

},{}]},{},[12])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhbmFseXRpY3MuanMiLCJsaWIvY291bnRSZWR1Y2UuanMiLCJsaWIvZGFzaFRvQ2FtZWwuanMiLCJsaWIvaW5pdC5qcyIsImxpYi9pbml0aWFsaXplQ291bnROb2RlLmpzIiwibGliL2luaXRpYWxpemVOb2Rlcy5qcyIsImxpYi9pbml0aWFsaXplU2hhcmVOb2RlLmpzIiwibGliL2luaXRpYWxpemVXYXRjaGVyLmpzIiwibGliL3NldERhdGEuanMiLCJsaWIvc2hhcmUuanMiLCJsaWIvc3RvcmVDb3VudC5qcyIsInNyYy9icm93c2VyLmpzIiwic3JjL21vZHVsZXMvY291bnQtYXBpLmpzIiwic3JjL21vZHVsZXMvY291bnQtdHJhbnNmb3Jtcy5qcyIsInNyYy9tb2R1bGVzL2NvdW50LmpzIiwic3JjL21vZHVsZXMvZGF0YS1hdHRyLmpzIiwic3JjL21vZHVsZXMvZXZlbnRzLmpzIiwic3JjL21vZHVsZXMvb3Blbi1zaGFyZS5qcyIsInNyYy9tb2R1bGVzL3NoYXJlLWFwaS5qcyIsInNyYy9tb2R1bGVzL3NoYXJlLXRyYW5zZm9ybXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBLE9BQU8sT0FBUCxHQUFpQixVQUFVLElBQVYsRUFBZ0IsRUFBaEIsRUFBb0I7QUFDbEMsS0FBSSxRQUFRLEVBQVo7O0FBRUE7O0FBRUMsS0FBTSxPQUFPLFNBQVMsT0FBVCxJQUFvQixTQUFTLFFBQTFDO0FBQ0EsS0FBTSxlQUFlLFNBQVMsWUFBOUI7O0FBRUEsS0FBSSxJQUFKLEVBQVUsdUJBQXVCLElBQXZCLEVBQTZCLEVBQTdCLEVBQWlDLEtBQWpDO0FBQ1YsS0FBSSxZQUFKLEVBQWtCLGNBQWMsRUFBZDtBQUNuQjtBQUNGLENBWEQ7O0FBYUEsU0FBUyxzQkFBVCxDQUFnQyxJQUFoQyxFQUFzQyxFQUF0QyxFQUEwQyxLQUExQyxFQUFpRDtBQUNoRDtBQUNBLEtBQUksT0FBTyxF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QTVaTyxFQTRaRDtBQUNkLE1BQU0sTUFBTyxLQUFLLEdBQUwsSUFBWSxLQUFLLFFBQWpCLElBQTZCLEtBQUssSUFBbkMsMkJBQ1csS0FBSyxRQURoQixTQUM0QixLQUFLLElBRGpDLFNBQ3lDLEtBQUssR0FEOUMsU0FFWCxLQUFLLEdBQUwsR0FBVyxHQUZaO0FBR0EsU0FBTztBQUNOLFFBQUssR0FEQztBQUVOLFVBQU87QUFDTixXQUFPLElBREQ7QUFFTixZQUFRO0FBRkY7QUFGRCxHQUFQO0FBT0EsRUF2YWU7QUF5YWhCLE9BemFnQixrQkF5YVIsSUF6YVEsRUF5YUY7QUFDYixTQUFPO0FBQ04sU0FBTTtBQURBLEdBQVA7QUFHQTtBQTdhZSxDQUFqQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICh0eXBlLCBjYikge1xuICAgbGV0IGNvdW50ID0gMTA7XG5cbiAgIC8vIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBmdW5jdGlvbiAoKSB7XG5cblx0ICAgY29uc3QgaXNHQSA9IHR5cGUgPT09ICdldmVudCcgfHwgdHlwZSA9PT0gJ3NvY2lhbCc7XG5cdCAgIGNvbnN0IGlzVGFnTWFuYWdlciA9IHR5cGUgPT09ICd0YWdNYW5hZ2VyJztcblxuXHQgICBpZiAoaXNHQSkgY2hlY2tJZkFuYWx5dGljc0xvYWRlZCh0eXBlLCBjYiwgY291bnQpO1xuXHQgICBpZiAoaXNUYWdNYW5hZ2VyKSBzZXRUYWdNYW5hZ2VyKGNiKTtcbiAgIC8vIH0pO1xufTtcblxuZnVuY3Rpb24gY2hlY2tJZkFuYWx5dGljc0xvYWRlZCh0eXBlLCBjYiwgY291bnQpIHtcblx0Y291bnQtLTtcblx0aWYgKHdpbmRvdy5nYSkge1xuXHRcdCAgaWYgKGNiKSBjYigpO1xuXHRcdCAgLy8gYmluZCB0byBzaGFyZWQgZXZlbnQgb24gZWFjaCBpbmRpdmlkdWFsIG5vZGVcblx0XHQgIGxpc3RlbihmdW5jdGlvbiAoZSkge1xuXHRcdFx0Y29uc3QgcGxhdGZvcm0gPSBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZScpO1xuXHRcdFx0Y29uc3QgdGFyZ2V0ID0gZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtbGluaycpIHx8XG5cdFx0XHRcdGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXVybCcpIHx8XG5cdFx0XHRcdGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXVzZXJuYW1lJykgfHxcblx0XHRcdCAgICBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jZW50ZXInKSB8fFxuXHRcdFx0XHRlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1zZWFyY2gnKSB8fFxuXHRcdFx0XHRlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1ib2R5Jyk7XG5cblx0XHRcdGlmICh0eXBlID09PSAnZXZlbnQnKSB7XG5cdFx0XHRcdGdhKCdzZW5kJywgJ2V2ZW50Jywge1xuXHRcdFx0XHRcdGV2ZW50Q2F0ZWdvcnk6ICdPcGVuU2hhcmUgQ2xpY2snLFxuXHRcdFx0XHRcdGV2ZW50QWN0aW9uOiBwbGF0Zm9ybSxcblx0XHRcdFx0XHRldmVudExhYmVsOiB0YXJnZXQsXG5cdFx0XHRcdFx0dHJhbnNwb3J0OiAnYmVhY29uJ1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHR5cGUgPT09ICdzb2NpYWwnKSB7XG5cdFx0XHRcdGdhKCdzZW5kJywge1xuXHRcdFx0XHRcdGhpdFR5cGU6ICdzb2NpYWwnLFxuXHRcdFx0XHRcdHNvY2lhbE5ldHdvcms6IHBsYXRmb3JtLFxuXHRcdFx0XHRcdHNvY2lhbEFjdGlvbjogJ3NoYXJlJyxcblx0XHRcdFx0XHRzb2NpYWxUYXJnZXQ6IHRhcmdldFxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHR9XG5cdGVsc2Uge1xuXHRcdCAgaWYgKGNvdW50KSB7XG5cdFx0XHQgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXHRcdFx0ICBjaGVja0lmQW5hbHl0aWNzTG9hZGVkKHR5cGUsIGNiLCBjb3VudCk7XG5cdFx0ICB9LCAxMDAwKTtcbiAgXHRcdH1cblx0fVxufVxuXG5mdW5jdGlvbiBzZXRUYWdNYW5hZ2VyIChjYikge1xuXHRpZiAoY2IpIGNiKCk7XG5cblx0d2luZG93LmRhdGFMYXllciA9IHdpbmRvdy5kYXRhTGF5ZXIgfHwgW107XG5cblx0bGlzdGVuKG9uU2hhcmVUYWdNYW5nZXIpO1xuXG5cdGdldENvdW50cyhmdW5jdGlvbihlKSB7XG5cdFx0Y29uc3QgY291bnQgPSBlLnRhcmdldCA/XG5cdFx0ICBlLnRhcmdldC5pbm5lckhUTUwgOlxuXHRcdCAgZS5pbm5lckhUTUw7XG5cblx0XHRjb25zdCBwbGF0Zm9ybSA9IGUudGFyZ2V0ID9cblx0XHQgICBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudC11cmwnKSA6XG5cdFx0ICAgZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudC11cmwnKTtcblxuXHRcdHdpbmRvdy5kYXRhTGF5ZXIucHVzaCh7XG5cdFx0XHQnZXZlbnQnIDogJ09wZW5TaGFyZSBDb3VudCcsXG5cdFx0XHQncGxhdGZvcm0nOiBwbGF0Zm9ybSxcblx0XHRcdCdyZXNvdXJjZSc6IGNvdW50LFxuXHRcdFx0J2FjdGl2aXR5JzogJ2NvdW50J1xuXHRcdH0pO1xuXHR9KTtcbn1cblxuZnVuY3Rpb24gbGlzdGVuIChjYikge1xuXHQvLyBiaW5kIHRvIHNoYXJlZCBldmVudCBvbiBlYWNoIGluZGl2aWR1YWwgbm9kZVxuXHRbXS5mb3JFYWNoLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtb3Blbi1zaGFyZV0nKSwgZnVuY3Rpb24obm9kZSkge1xuXHRcdG5vZGUuYWRkRXZlbnRMaXN0ZW5lcignT3BlblNoYXJlLnNoYXJlZCcsIGNiKTtcblx0fSk7XG59XG5cbmZ1bmN0aW9uIGdldENvdW50cyAoY2IpIHtcblx0dmFyIGNvdW50Tm9kZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLW9wZW4tc2hhcmUtY291bnRdJyk7XG5cblx0W10uZm9yRWFjaC5jYWxsKGNvdW50Tm9kZSwgZnVuY3Rpb24obm9kZSkge1xuXHRcdGlmIChub2RlLnRleHRDb250ZW50KSBjYihub2RlKTtcblx0XHRlbHNlIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcignT3BlblNoYXJlLmNvdW50ZWQtJyArIG5vZGUuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY291bnQtdXJsJyksIGNiKTtcblx0fSk7XG59XG5cbmZ1bmN0aW9uIG9uU2hhcmVUYWdNYW5nZXIgKGUpIHtcblx0Y29uc3QgcGxhdGZvcm0gPSBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZScpO1xuXHRjb25zdCB0YXJnZXQgPSBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1saW5rJykgfHxcblx0XHRlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS11cmwnKSB8fFxuXHRcdGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXVzZXJuYW1lJykgfHxcblx0XHRlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jZW50ZXInKSB8fFxuXHRcdGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXNlYXJjaCcpIHx8XG5cdFx0ZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtYm9keScpO1xuXG5cdHdpbmRvdy5kYXRhTGF5ZXIucHVzaCh7XG5cdFx0J2V2ZW50JyA6ICdPcGVuU2hhcmUgU2hhcmUnLFxuXHRcdCdwbGF0Zm9ybSc6IHBsYXRmb3JtLFxuXHRcdCdyZXNvdXJjZSc6IHRhcmdldCxcblx0XHQnYWN0aXZpdHknOiAnc2hhcmUnXG5cdH0pO1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBjb3VudFJlZHVjZTtcblxuZnVuY3Rpb24gcm91bmQoeCwgcHJlY2lzaW9uKSB7XG5cdGlmICh0eXBlb2YgeCAhPT0gJ251bWJlcicpIHtcblx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCdFeHBlY3RlZCB2YWx1ZSB0byBiZSBhIG51bWJlcicpO1xuXHR9XG5cblx0dmFyIGV4cG9uZW50ID0gcHJlY2lzaW9uID4gMCA/ICdlJyA6ICdlLSc7XG5cdHZhciBleHBvbmVudE5lZyA9IHByZWNpc2lvbiA+IDAgPyAnZS0nIDogJ2UnO1xuXHRwcmVjaXNpb24gPSBNYXRoLmFicyhwcmVjaXNpb24pO1xuXG5cdHJldHVybiBOdW1iZXIoTWF0aC5yb3VuZCh4ICsgZXhwb25lbnQgKyBwcmVjaXNpb24pICsgZXhwb25lbnROZWcgKyBwcmVjaXNpb24pO1xufVxuXG5mdW5jdGlvbiB0aG91c2FuZGlmeSAobnVtKSB7XG5cdHJldHVybiByb3VuZChudW0vMTAwMCwgMSkgKyAnSyc7XG59XG5cbmZ1bmN0aW9uIG1pbGxpb25pZnkgKG51bSkge1xuXHRyZXR1cm4gcm91bmQobnVtLzEwMDAwMDAsIDEpICsgJ00nO1xufVxuXG5mdW5jdGlvbiBjb3VudFJlZHVjZSAoZWwsIGNvdW50LCBjYikge1xuXHRpZiAoY291bnQgPiA5OTk5OTkpICB7XG5cdFx0ZWwuaW5uZXJIVE1MID0gbWlsbGlvbmlmeShjb3VudCk7XG5cdFx0aWYgKGNiICAmJiB0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpIGNiKGVsKTtcblx0fSBlbHNlIGlmIChjb3VudCA+IDk5OSkge1xuXHRcdGVsLmlubmVySFRNTCA9IHRob3VzYW5kaWZ5KGNvdW50KTtcblx0XHRpZiAoY2IgICYmIHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykgY2IoZWwpO1xuXHR9IGVsc2Uge1xuXHRcdGVsLmlubmVySFRNTCA9IGNvdW50O1xuXHRcdGlmIChjYiAgJiYgdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSBjYihlbCk7XG5cdH1cbn1cbiIsIi8vIHR5cGUgY29udGFpbnMgYSBkYXNoXG4vLyB0cmFuc2Zvcm0gdG8gY2FtZWxjYXNlIGZvciBmdW5jdGlvbiByZWZlcmVuY2Vcbi8vIFRPRE86IG9ubHkgc3VwcG9ydHMgc2luZ2xlIGRhc2gsIHNob3VsZCBzaG91bGQgc3VwcG9ydCBtdWx0aXBsZVxubW9kdWxlLmV4cG9ydHMgPSAoZGFzaCwgdHlwZSkgPT4ge1xuXHRsZXQgbmV4dENoYXIgPSB0eXBlLnN1YnN0cihkYXNoICsgMSwgMSksXG5cdFx0Z3JvdXAgPSB0eXBlLnN1YnN0cihkYXNoLCAyKTtcblxuXHR0eXBlID0gdHlwZS5yZXBsYWNlKGdyb3VwLCBuZXh0Q2hhci50b1VwcGVyQ2FzZSgpKTtcblx0cmV0dXJuIHR5cGU7XG59O1xuIiwiY29uc3QgaW5pdGlhbGl6ZU5vZGVzID0gcmVxdWlyZSgnLi9pbml0aWFsaXplTm9kZXMnKTtcbmNvbnN0IGluaXRpYWxpemVXYXRjaGVyID0gcmVxdWlyZSgnLi9pbml0aWFsaXplV2F0Y2hlcicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGluaXQ7XG5cbmZ1bmN0aW9uIGluaXQob3B0cykge1xuXHRyZXR1cm4gKCkgPT4ge1xuXHRcdGNvbnN0IGluaXROb2RlcyA9IGluaXRpYWxpemVOb2Rlcyh7XG5cdFx0XHRhcGk6IG9wdHMuYXBpIHx8IG51bGwsXG5cdFx0XHRjb250YWluZXI6IG9wdHMuY29udGFpbmVyIHx8IGRvY3VtZW50LFxuXHRcdFx0c2VsZWN0b3I6IG9wdHMuc2VsZWN0b3IsXG5cdFx0XHRjYjogb3B0cy5jYlxuXHRcdH0pO1xuXG5cdFx0aW5pdE5vZGVzKCk7XG5cblx0XHQvLyBjaGVjayBmb3IgbXV0YXRpb24gb2JzZXJ2ZXJzIGJlZm9yZSB1c2luZywgSUUxMSBvbmx5XG5cdFx0aWYgKHdpbmRvdy5NdXRhdGlvbk9ic2VydmVyICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdGluaXRpYWxpemVXYXRjaGVyKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLW9wZW4tc2hhcmUtd2F0Y2hdJyksIGluaXROb2Rlcyk7XG5cdFx0fVxuXHR9O1xufVxuIiwiY29uc3QgQ291bnQgPSByZXF1aXJlKCcuLi9zcmMvbW9kdWxlcy9jb3VudCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGluaXRpYWxpemVDb3VudE5vZGU7XG5cbmZ1bmN0aW9uIGluaXRpYWxpemVDb3VudE5vZGUob3MpIHtcblx0Ly8gaW5pdGlhbGl6ZSBvcGVuIHNoYXJlIG9iamVjdCB3aXRoIHR5cGUgYXR0cmlidXRlXG5cdGxldCB0eXBlID0gb3MuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY291bnQnKSxcblx0XHR1cmwgPSBvcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudC1yZXBvJykgfHxcblx0XHRcdG9zLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50LXNob3QnKSB8fFxuXHRcdFx0b3MuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY291bnQtdXJsJyksXG5cdFx0Y291bnQgPSBuZXcgQ291bnQodHlwZSwgdXJsKTtcblxuXHRjb3VudC5jb3VudChvcyk7XG5cdG9zLnNldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLW5vZGUnLCB0eXBlKTtcbn1cbiIsImNvbnN0IEV2ZW50cyA9IHJlcXVpcmUoJy4uL3NyYy9tb2R1bGVzL2V2ZW50cycpO1xuY29uc3QgYW5hbHl0aWNzID0gcmVxdWlyZSgnLi4vYW5hbHl0aWNzJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBpbml0aWFsaXplTm9kZXM7XG5cbmZ1bmN0aW9uIGluaXRpYWxpemVOb2RlcyhvcHRzKSB7XG5cdC8vIGxvb3AgdGhyb3VnaCBvcGVuIHNoYXJlIG5vZGUgY29sbGVjdGlvblxuXHRyZXR1cm4gKCkgPT4ge1xuXHRcdC8vIGNoZWNrIGZvciBhbmFseXRpY3Ncblx0XHRjaGVja0FuYWx5dGljcygpO1xuXG5cdFx0aWYgKG9wdHMuYXBpKSB7XG5cdFx0XHRsZXQgbm9kZXMgPSBvcHRzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKG9wdHMuc2VsZWN0b3IpO1xuXHRcdFx0W10uZm9yRWFjaC5jYWxsKG5vZGVzLCBvcHRzLmNiKTtcblxuXHRcdFx0Ly8gdHJpZ2dlciBjb21wbGV0ZWQgZXZlbnRcblx0XHRcdEV2ZW50cy50cmlnZ2VyKGRvY3VtZW50LCBvcHRzLmFwaSArICctbG9hZGVkJyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIGxvb3AgdGhyb3VnaCBvcGVuIHNoYXJlIG5vZGUgY29sbGVjdGlvblxuXHRcdFx0bGV0IHNoYXJlTm9kZXMgPSBvcHRzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKG9wdHMuc2VsZWN0b3Iuc2hhcmUpO1xuXHRcdFx0W10uZm9yRWFjaC5jYWxsKHNoYXJlTm9kZXMsIG9wdHMuY2Iuc2hhcmUpO1xuXG5cdFx0XHQvLyB0cmlnZ2VyIGNvbXBsZXRlZCBldmVudFxuXHRcdFx0RXZlbnRzLnRyaWdnZXIoZG9jdW1lbnQsICdzaGFyZS1sb2FkZWQnKTtcblxuXHRcdFx0Ly8gbG9vcCB0aHJvdWdoIGNvdW50IG5vZGUgY29sbGVjdGlvblxuXHRcdFx0bGV0IGNvdW50Tm9kZXMgPSBvcHRzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKG9wdHMuc2VsZWN0b3IuY291bnQpO1xuXHRcdFx0W10uZm9yRWFjaC5jYWxsKGNvdW50Tm9kZXMsIG9wdHMuY2IuY291bnQpO1xuXG5cdFx0XHQvLyB0cmlnZ2VyIGNvbXBsZXRlZCBldmVudFxuXHRcdFx0RXZlbnRzLnRyaWdnZXIoZG9jdW1lbnQsICdjb3VudC1sb2FkZWQnKTtcblx0XHR9XG5cdH07XG59XG5cbmZ1bmN0aW9uIGNoZWNrQW5hbHl0aWNzICgpIHtcblx0Ly8gY2hlY2sgZm9yIGFuYWx5dGljc1xuXHRpZiAoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignW2RhdGEtb3Blbi1zaGFyZS1hbmFseXRpY3NdJykpIHtcblx0XHRjb25zdCBwcm92aWRlciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLW9wZW4tc2hhcmUtYW5hbHl0aWNzXScpXG5cdFx0XHQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtYW5hbHl0aWNzJyk7XG5cblx0XHRpZiAocHJvdmlkZXIuaW5kZXhPZignLCcpID4gLTEpIHtcblx0XHRcdGNvbnN0IHByb3ZpZGVycyA9IHByb3ZpZGVyLnNwbGl0KCcsJyk7XG5cdFx0XHRwcm92aWRlcnMuZm9yRWFjaChwID0+IGFuYWx5dGljcyhwKSk7XG5cdFx0fSBlbHNlIGFuYWx5dGljcyhwcm92aWRlcik7XG5cblx0fVxufVxuIiwiY29uc3QgU2hhcmVUcmFuc2Zvcm1zID0gcmVxdWlyZSgnLi4vc3JjL21vZHVsZXMvc2hhcmUtdHJhbnNmb3JtcycpO1xuY29uc3QgT3BlblNoYXJlID0gcmVxdWlyZSgnLi4vc3JjL21vZHVsZXMvb3Blbi1zaGFyZScpO1xuY29uc3Qgc2V0RGF0YSA9IHJlcXVpcmUoJy4vc2V0RGF0YScpO1xuY29uc3Qgc2hhcmUgPSByZXF1aXJlKCcuL3NoYXJlJyk7XG5jb25zdCBkYXNoVG9DYW1lbCA9IHJlcXVpcmUoJy4vZGFzaFRvQ2FtZWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBpbml0aWFsaXplU2hhcmVOb2RlO1xuXG5mdW5jdGlvbiBpbml0aWFsaXplU2hhcmVOb2RlKG9zKSB7XG5cdC8vIGluaXRpYWxpemUgb3BlbiBzaGFyZSBvYmplY3Qgd2l0aCB0eXBlIGF0dHJpYnV0ZVxuXHRsZXQgdHlwZSA9IG9zLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlJyksXG5cdFx0ZGFzaCA9IHR5cGUuaW5kZXhPZignLScpLFxuXHRcdG9wZW5TaGFyZTtcblxuXHRpZiAoZGFzaCA+IC0xKSB7XG5cdFx0dHlwZSA9IGRhc2hUb0NhbWVsKGRhc2gsIHR5cGUpO1xuXHR9XG5cblx0bGV0IHRyYW5zZm9ybSA9IFNoYXJlVHJhbnNmb3Jtc1t0eXBlXTtcblxuXHRpZiAoIXRyYW5zZm9ybSkge1xuXHRcdHRocm93IG5ldyBFcnJvcihgT3BlbiBTaGFyZTogJHt0eXBlfSBpcyBhbiBpbnZhbGlkIHR5cGVgKTtcblx0fVxuXG5cdG9wZW5TaGFyZSA9IG5ldyBPcGVuU2hhcmUodHlwZSwgdHJhbnNmb3JtKTtcblxuXHQvLyBzcGVjaWZ5IGlmIHRoaXMgaXMgYSBkeW5hbWljIGluc3RhbmNlXG5cdGlmIChvcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1keW5hbWljJykpIHtcblx0XHRvcGVuU2hhcmUuZHluYW1pYyA9IHRydWU7XG5cdH1cblxuXHQvLyBzcGVjaWZ5IGlmIHRoaXMgaXMgYSBwb3B1cCBpbnN0YW5jZVxuXHRpZiAob3MuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtcG9wdXAnKSkge1xuXHRcdG9wZW5TaGFyZS5wb3B1cCA9IHRydWU7XG5cdH1cblxuXHQvLyBzZXQgYWxsIG9wdGlvbmFsIGF0dHJpYnV0ZXMgb24gb3BlbiBzaGFyZSBpbnN0YW5jZVxuXHRzZXREYXRhKG9wZW5TaGFyZSwgb3MpO1xuXG5cdC8vIG9wZW4gc2hhcmUgZGlhbG9nIG9uIGNsaWNrXG5cdG9zLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcblx0XHRzaGFyZShlLCBvcywgb3BlblNoYXJlKTtcblx0fSk7XG5cblx0b3MuYWRkRXZlbnRMaXN0ZW5lcignT3BlblNoYXJlLnRyaWdnZXInLCAoZSkgPT4ge1xuXHRcdHNoYXJlKGUsIG9zLCBvcGVuU2hhcmUpO1xuXHR9KTtcblxuXHRvcy5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1ub2RlJywgdHlwZSk7XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGluaXRpYWxpemVXYXRjaGVyO1xuXG5mdW5jdGlvbiBpbml0aWFsaXplV2F0Y2hlcih3YXRjaGVyLCBmbikge1xuXHRbXS5mb3JFYWNoLmNhbGwod2F0Y2hlciwgKHcpID0+IHtcblx0XHR2YXIgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcigobXV0YXRpb25zKSA9PiB7XG5cdFx0XHQvLyB0YXJnZXQgd2lsbCBtYXRjaCBiZXR3ZWVuIGFsbCBtdXRhdGlvbnMgc28ganVzdCB1c2UgZmlyc3Rcblx0XHRcdGZuKG11dGF0aW9uc1swXS50YXJnZXQpO1xuXHRcdH0pO1xuXG5cdFx0b2JzZXJ2ZXIub2JzZXJ2ZSh3LCB7XG5cdFx0XHRjaGlsZExpc3Q6IHRydWVcblx0XHR9KTtcblx0fSk7XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHNldERhdGE7XG5cbmZ1bmN0aW9uIHNldERhdGEob3NJbnN0YW5jZSwgb3NFbGVtZW50KSB7XG5cdG9zSW5zdGFuY2Uuc2V0RGF0YSh7XG5cdFx0dXJsOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdXJsJyksXG5cdFx0dGV4dDogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXRleHQnKSxcblx0XHR2aWE6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS12aWEnKSxcblx0XHRoYXNodGFnczogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWhhc2h0YWdzJyksXG5cdFx0dHdlZXRJZDogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXR3ZWV0LWlkJyksXG5cdFx0cmVsYXRlZDogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXJlbGF0ZWQnKSxcblx0XHRzY3JlZW5OYW1lOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtc2NyZWVuLW5hbWUnKSxcblx0XHR1c2VySWQ6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS11c2VyLWlkJyksXG5cdFx0bGluazogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWxpbmsnKSxcblx0XHRwaWN0dXJlOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtcGljdHVyZScpLFxuXHRcdGNhcHRpb246IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jYXB0aW9uJyksXG5cdFx0ZGVzY3JpcHRpb246IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1kZXNjcmlwdGlvbicpLFxuXHRcdHVzZXI6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS11c2VyJyksXG5cdFx0dmlkZW86IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS12aWRlbycpLFxuXHRcdHVzZXJuYW1lOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdXNlcm5hbWUnKSxcblx0XHR0aXRsZTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXRpdGxlJyksXG5cdFx0bWVkaWE6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1tZWRpYScpLFxuXHRcdHRvOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdG8nKSxcblx0XHRzdWJqZWN0OiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtc3ViamVjdCcpLFxuXHRcdGJvZHk6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1ib2R5JyksXG5cdFx0aW9zOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtaW9zJyksXG5cdFx0dHlwZTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXR5cGUnKSxcblx0XHRjZW50ZXI6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jZW50ZXInKSxcblx0XHR2aWV3czogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXZpZXdzJyksXG5cdFx0em9vbTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXpvb20nKSxcblx0XHRzZWFyY2g6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1zZWFyY2gnKSxcblx0XHRzYWRkcjogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXNhZGRyJyksXG5cdFx0ZGFkZHI6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1kYWRkcicpLFxuXHRcdGRpcmVjdGlvbnNtb2RlOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtZGlyZWN0aW9ucy1tb2RlJyksXG5cdFx0cmVwbzogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXJlcG8nKSxcblx0XHRzaG90OiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtc2hvdCcpLFxuXHRcdHBlbjogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXBlbicpLFxuXHRcdHZpZXc6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS12aWV3JyksXG5cdFx0aXNzdWU6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1pc3N1ZScpLFxuXHRcdGJ1dHRvbklkOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtYnV0dG9uSWQnKSxcblx0XHRwb3BVcDogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXBvcHVwJylcblx0fSk7XG59XG4iLCJjb25zdCBFdmVudHMgPSByZXF1aXJlKCcuLi9zcmMvbW9kdWxlcy9ldmVudHMnKTtcbmNvbnN0IHNldERhdGEgPSByZXF1aXJlKCcuL3NldERhdGEnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBzaGFyZTtcblxuZnVuY3Rpb24gc2hhcmUoZSwgb3MsIG9wZW5TaGFyZSkge1xuXHQvLyBpZiBkeW5hbWljIGluc3RhbmNlIHRoZW4gZmV0Y2ggYXR0cmlidXRlcyBhZ2FpbiBpbiBjYXNlIG9mIHVwZGF0ZXNcblx0aWYgKG9wZW5TaGFyZS5keW5hbWljKSB7XG5cdFx0c2V0RGF0YShvcGVuU2hhcmUsIG9zKTtcblx0fVxuXG5cdG9wZW5TaGFyZS5zaGFyZShlKTtcblxuXHQvLyB0cmlnZ2VyIHNoYXJlZCBldmVudFxuXHRFdmVudHMudHJpZ2dlcihvcywgJ3NoYXJlZCcpO1xufVxuIiwiLypcbiAgIFNvbWV0aW1lcyBzb2NpYWwgcGxhdGZvcm1zIGdldCBjb25mdXNlZCBhbmQgZHJvcCBzaGFyZSBjb3VudHMuXG4gICBJbiB0aGlzIG1vZHVsZSB3ZSBjaGVjayBpZiB0aGUgcmV0dXJuZWQgY291bnQgaXMgbGVzcyB0aGFuIHRoZSBjb3VudCBpblxuICAgbG9jYWxzdG9yYWdlLlxuICAgSWYgdGhlIGxvY2FsIGNvdW50IGlzIGdyZWF0ZXIgdGhhbiB0aGUgcmV0dXJuZWQgY291bnQsXG4gICB3ZSBzdG9yZSB0aGUgbG9jYWwgY291bnQgKyB0aGUgcmV0dXJuZWQgY291bnQuXG4gICBPdGhlcndpc2UsIHN0b3JlIHRoZSByZXR1cm5lZCBjb3VudC5cbiovXG5cbm1vZHVsZS5leHBvcnRzID0gKHQsIGNvdW50KSA9PiB7XG5cdGNvbnN0IGlzQXJyID0gdC50eXBlLmluZGV4T2YoJywnKSA+IC0xO1xuXHRjb25zdCBsb2NhbCA9IE51bWJlcih0LnN0b3JlR2V0KHQudHlwZSArICctJyArIHQuc2hhcmVkKSk7XG5cblx0aWYgKGxvY2FsID4gY291bnQgJiYgIWlzQXJyKSB7XG5cdFx0Y29uc3QgbGF0ZXN0Q291bnQgPSBOdW1iZXIodC5zdG9yZUdldCh0LnR5cGUgKyAnLScgKyB0LnNoYXJlZCArICctbGF0ZXN0Q291bnQnKSk7XG5cdFx0dC5zdG9yZVNldCh0LnR5cGUgKyAnLScgKyB0LnNoYXJlZCArICctbGF0ZXN0Q291bnQnLCBjb3VudCk7XG5cblx0XHRjb3VudCA9IGlzTnVtZXJpYyhsYXRlc3RDb3VudCkgJiYgbGF0ZXN0Q291bnQgPiAwID9cblx0XHRcdGNvdW50ICs9IGxvY2FsIC0gbGF0ZXN0Q291bnQgOlxuXHRcdFx0Y291bnQgKz0gbG9jYWw7XG5cblx0fVxuXG5cdGlmICghaXNBcnIpIHQuc3RvcmVTZXQodC50eXBlICsgJy0nICsgdC5zaGFyZWQsIGNvdW50KTtcblx0cmV0dXJuIGNvdW50O1xufTtcblxuZnVuY3Rpb24gaXNOdW1lcmljKG4pIHtcbiAgcmV0dXJuICFpc05hTihwYXJzZUZsb2F0KG4pKSAmJiBpc0Zpbml0ZShuKTtcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkge1xuXG5cdHZhciBEYXRhQXR0ciA9IHJlcXVpcmUoJy4vbW9kdWxlcy9kYXRhLWF0dHInKSxcblx0XHRTaGFyZUFQSSA9IHJlcXVpcmUoJy4vbW9kdWxlcy9zaGFyZS1hcGknKSxcblx0XHRFdmVudHMgPSByZXF1aXJlKCcuL21vZHVsZXMvZXZlbnRzJyksXG5cdFx0T3BlblNoYXJlID0gcmVxdWlyZSgnLi9tb2R1bGVzL29wZW4tc2hhcmUnKSxcblx0XHRTaGFyZVRyYW5zZm9ybXMgPSByZXF1aXJlKCcuL21vZHVsZXMvc2hhcmUtdHJhbnNmb3JtcycpLFxuXHRcdENvdW50ID0gcmVxdWlyZSgnLi9tb2R1bGVzL2NvdW50JyksXG5cdFx0Q291bnRBUEkgPSByZXF1aXJlKCcuL21vZHVsZXMvY291bnQtYXBpJyksXG5cdFx0YW5hbHl0aWNzQVBJID0gcmVxdWlyZSgnLi4vYW5hbHl0aWNzJyk7XG5cblx0RGF0YUF0dHIoT3BlblNoYXJlLCBDb3VudCwgU2hhcmVUcmFuc2Zvcm1zLCBFdmVudHMpO1xuXHR3aW5kb3cuT3BlblNoYXJlID0ge1xuXHRcdHNoYXJlOiBTaGFyZUFQSShPcGVuU2hhcmUsIFNoYXJlVHJhbnNmb3JtcywgRXZlbnRzKSxcblx0XHRjb3VudDogQ291bnRBUEkoKSxcblx0XHRhbmFseXRpY3M6IGFuYWx5dGljc0FQSVxuXHR9O1xufSkoKTtcbiIsIi8qKlxuICogY291bnQgQVBJXG4gKi9cblxudmFyIGNvdW50ID0gcmVxdWlyZSgnLi9jb3VudCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuXG5cdC8vIGdsb2JhbCBPcGVuU2hhcmUgcmVmZXJlbmNpbmcgaW50ZXJuYWwgY2xhc3MgZm9yIGluc3RhbmNlIGdlbmVyYXRpb25cblx0Y2xhc3MgQ291bnQge1xuXG5cdFx0Y29uc3RydWN0b3Ioe1xuXHRcdFx0dHlwZSxcblx0XHRcdHVybCxcblx0XHRcdGFwcGVuZFRvID0gZmFsc2UsXG5cdFx0XHRlbGVtZW50LFxuXHRcdFx0Y2xhc3Nlc30sIGNiKSB7XG5cdFx0XHR2YXIgY291bnROb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChlbGVtZW50IHx8ICdzcGFuJyk7XG5cblx0XHRcdGNvdW50Tm9kZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudCcsIHR5cGUpO1xuXHRcdFx0Y291bnROb2RlLnNldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50LXVybCcsIHVybCk7XG5cblx0XHRcdGNvdW50Tm9kZS5jbGFzc0xpc3QuYWRkKCdvcGVuLXNoYXJlLWNvdW50Jyk7XG5cblx0XHRcdGlmIChjbGFzc2VzICYmIEFycmF5LmlzQXJyYXkoY2xhc3NlcykpIHtcblx0XHRcdFx0Y2xhc3Nlcy5mb3JFYWNoKGNzc0NMYXNzID0+IHtcblx0XHRcdFx0XHRjb3VudE5vZGUuY2xhc3NMaXN0LmFkZChjc3NDTGFzcyk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoYXBwZW5kVG8pIHtcblx0XHRcdFx0cmV0dXJuIG5ldyBjb3VudCh0eXBlLCB1cmwpLmNvdW50KGNvdW50Tm9kZSwgY2IsIGFwcGVuZFRvKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIG5ldyBjb3VudCh0eXBlLCB1cmwpLmNvdW50KGNvdW50Tm9kZSwgY2IpO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBDb3VudDtcbn07XG4iLCJjb25zdCBjb3VudFJlZHVjZSA9IHJlcXVpcmUoJy4uLy4uL2xpYi9jb3VudFJlZHVjZScpO1xuY29uc3Qgc3RvcmVDb3VudCA9IHJlcXVpcmUoJy4uLy4uL2xpYi9zdG9yZUNvdW50Jyk7XG5cbi8qKlxuICogT2JqZWN0IG9mIHRyYW5zZm9ybSBmdW5jdGlvbnMgZm9yIGVhY2ggb3BlbnNoYXJlIGFwaVxuICogVHJhbnNmb3JtIGZ1bmN0aW9ucyBwYXNzZWQgaW50byBPcGVuU2hhcmUgaW5zdGFuY2Ugd2hlbiBpbnN0YW50aWF0ZWRcbiAqIFJldHVybiBvYmplY3QgY29udGFpbmluZyBVUkwgYW5kIGtleS92YWx1ZSBhcmdzXG4gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuXG5cdC8vIGZhY2Vib29rIGNvdW50IGRhdGFcblx0ZmFjZWJvb2sgKHVybCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiAnZ2V0Jyxcblx0XHRcdHVybDogYGh0dHBzOi8vZ3JhcGguZmFjZWJvb2suY29tLz9pZD0ke3VybH1gLFxuXHRcdFx0dHJhbnNmb3JtOiBmdW5jdGlvbih4aHIpIHtcblx0XHRcdFx0bGV0IGNvdW50ID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KS5zaGFyZXM7XG5cdFx0XHRcdHJldHVybiBzdG9yZUNvdW50KHRoaXMsIGNvdW50KTtcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIHBpbnRlcmVzdCBjb3VudCBkYXRhXG5cdHBpbnRlcmVzdCAodXJsKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHR5cGU6ICdqc29ucCcsXG5cdFx0XHR1cmw6IGBodHRwczovL2FwaS5waW50ZXJlc3QuY29tL3YxL3VybHMvY291bnQuanNvbj9jYWxsYmFjaz0/JnVybD0ke3VybH1gLFxuXHRcdFx0dHJhbnNmb3JtOiBmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHRcdGxldCBjb3VudCA9IGRhdGEuY291bnQ7XG5cdFx0XHRcdHJldHVybiBzdG9yZUNvdW50KHRoaXMsIGNvdW50KTtcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIGxpbmtlZGluIGNvdW50IGRhdGFcblx0bGlua2VkaW4gKHVybCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiAnanNvbnAnLFxuXHRcdFx0dXJsOiBgaHR0cHM6Ly93d3cubGlua2VkaW4uY29tL2NvdW50c2Vydi9jb3VudC9zaGFyZT91cmw9JHt1cmx9JmZvcm1hdD1qc29ucCZjYWxsYmFjaz0/YCxcblx0XHRcdHRyYW5zZm9ybTogZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0XHRsZXQgY291bnQgPSBkYXRhLmNvdW50O1xuXHRcdFx0XHRyZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBjb3VudCk7XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyByZWRkaXQgY291bnQgZGF0YVxuXHRyZWRkaXQgKHVybCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiAnZ2V0Jyxcblx0XHRcdHVybDogYGh0dHBzOi8vd3d3LnJlZGRpdC5jb20vYXBpL2luZm8uanNvbj91cmw9JHt1cmx9YCxcblx0XHRcdHRyYW5zZm9ybTogZnVuY3Rpb24oeGhyKSB7XG5cdFx0XHRcdGxldCBwb3N0cyA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCkuZGF0YS5jaGlsZHJlbixcblx0XHRcdFx0XHR1cHMgPSAwO1xuXG5cdFx0XHRcdHBvc3RzLmZvckVhY2goKHBvc3QpID0+IHtcblx0XHRcdFx0XHR1cHMgKz0gTnVtYmVyKHBvc3QuZGF0YS51cHMpO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRyZXR1cm4gc3RvcmVDb3VudCh0aGlzLCB1cHMpO1xuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gZ29vZ2xlIGNvdW50IGRhdGFcblx0Z29vZ2xlICh1cmwpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogJ3Bvc3QnLFxuXHRcdFx0ZGF0YToge1xuXHRcdFx0XHRtZXRob2Q6ICdwb3MucGx1c29uZXMuZ2V0Jyxcblx0XHRcdFx0aWQ6ICdwJyxcblx0XHRcdFx0cGFyYW1zOiB7XG5cdFx0XHRcdFx0bm9sb2c6IHRydWUsXG5cdFx0XHRcdFx0aWQ6IHVybCxcblx0XHRcdFx0XHRzb3VyY2U6ICd3aWRnZXQnLFxuXHRcdFx0XHRcdHVzZXJJZDogJ0B2aWV3ZXInLFxuXHRcdFx0XHRcdGdyb3VwSWQ6ICdAc2VsZidcblx0XHRcdFx0fSxcblx0XHRcdFx0anNvbnJwYzogJzIuMCcsXG5cdFx0XHRcdGtleTogJ3AnLFxuXHRcdFx0XHRhcGlWZXJzaW9uOiAndjEnXG5cdFx0XHR9LFxuXHRcdFx0dXJsOiBgaHR0cHM6Ly9jbGllbnRzNi5nb29nbGUuY29tL3JwY2AsXG5cdFx0XHR0cmFuc2Zvcm06IGZ1bmN0aW9uKHhocikge1xuXHRcdFx0XHRsZXQgY291bnQgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpLnJlc3VsdC5tZXRhZGF0YS5nbG9iYWxDb3VudHMuY291bnQ7XG5cdFx0XHRcdHJldHVybiBzdG9yZUNvdW50KHRoaXMsIGNvdW50KTtcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIGdpdGh1YiBzdGFyIGNvdW50XG5cdGdpdGh1YlN0YXJzIChyZXBvKSB7XG5cdFx0cmVwbyA9IHJlcG8uaW5kZXhPZignZ2l0aHViLmNvbS8nKSA+IC0xID9cblx0XHRcdHJlcG8uc3BsaXQoJ2dpdGh1Yi5jb20vJylbMV0gOlxuXHRcdFx0cmVwbztcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogJ2dldCcsXG5cdFx0XHR1cmw6IGBodHRwczovL2FwaS5naXRodWIuY29tL3JlcG9zLyR7cmVwb31gLFxuXHRcdFx0dHJhbnNmb3JtOiBmdW5jdGlvbih4aHIpIHtcblx0XHRcdFx0bGV0IGNvdW50ID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KS5zdGFyZ2F6ZXJzX2NvdW50O1xuXHRcdFx0XHRyZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBjb3VudCk7XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBnaXRodWIgZm9ya3MgY291bnRcblx0Z2l0aHViRm9ya3MgKHJlcG8pIHtcblx0XHRyZXBvID0gcmVwby5pbmRleE9mKCdnaXRodWIuY29tLycpID4gLTEgP1xuXHRcdFx0cmVwby5zcGxpdCgnZ2l0aHViLmNvbS8nKVsxXSA6XG5cdFx0XHRyZXBvO1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiAnZ2V0Jyxcblx0XHRcdHVybDogYGh0dHBzOi8vYXBpLmdpdGh1Yi5jb20vcmVwb3MvJHtyZXBvfWAsXG5cdFx0XHR0cmFuc2Zvcm06IGZ1bmN0aW9uKHhocikge1xuXHRcdFx0XHRsZXQgY291bnQgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpLmZvcmtzX2NvdW50O1xuXHRcdFx0XHRyZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBjb3VudCk7XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBnaXRodWIgd2F0Y2hlcnMgY291bnRcblx0Z2l0aHViV2F0Y2hlcnMgKHJlcG8pIHtcblx0XHRyZXBvID0gcmVwby5pbmRleE9mKCdnaXRodWIuY29tLycpID4gLTEgP1xuXHRcdFx0cmVwby5zcGxpdCgnZ2l0aHViLmNvbS8nKVsxXSA6XG5cdFx0XHRyZXBvO1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiAnZ2V0Jyxcblx0XHRcdHVybDogYGh0dHBzOi8vYXBpLmdpdGh1Yi5jb20vcmVwb3MvJHtyZXBvfWAsXG5cdFx0XHR0cmFuc2Zvcm06IGZ1bmN0aW9uKHhocikge1xuXHRcdFx0XHRsZXQgY291bnQgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpLndhdGNoZXJzX2NvdW50O1xuXHRcdFx0XHRyZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBjb3VudCk7XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBkcmliYmJsZSBsaWtlcyBjb3VudFxuXHRkcmliYmJsZSAoc2hvdCkge1xuXHRcdHNob3QgPSBzaG90LmluZGV4T2YoJ2RyaWJiYmxlLmNvbS9zaG90cycpID4gLTEgP1xuXHRcdFx0c2hvdC5zcGxpdCgnc2hvdHMvJylbMV0gOlxuXHRcdFx0c2hvdDtcblx0XHRjb25zdCB1cmwgPSBgaHR0cHM6Ly9hcGkuZHJpYmJibGUuY29tL3YxL3Nob3RzLyR7c2hvdH0vbGlrZXNgO1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiAnZ2V0Jyxcblx0XHRcdHVybDogdXJsLFxuXHRcdFx0dHJhbnNmb3JtOiBmdW5jdGlvbih4aHIsIEV2ZW50cykge1xuXHRcdFx0XHRsZXQgY291bnQgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpLmxlbmd0aDtcblxuXHRcdFx0XHQvLyBhdCB0aGlzIHRpbWUgZHJpYmJibGUgbGltaXRzIGEgcmVzcG9uc2Ugb2YgMTIgbGlrZXMgcGVyIHBhZ2Vcblx0XHRcdFx0aWYgKGNvdW50ID09PSAxMikge1xuXHRcdFx0XHRcdGxldCBwYWdlID0gMjtcblx0XHRcdFx0XHRyZWN1cnNpdmVDb3VudCh1cmwsIHBhZ2UsIGNvdW50LCBmaW5hbENvdW50ID0+IHtcblx0XHRcdFx0XHRcdGlmICh0aGlzLmFwcGVuZFRvICYmIHR5cGVvZiB0aGlzLmFwcGVuZFRvICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMuYXBwZW5kVG8uYXBwZW5kQ2hpbGQodGhpcy5vcyk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRjb3VudFJlZHVjZSh0aGlzLm9zLCBmaW5hbENvdW50LCB0aGlzLmNiKTtcblx0XHRcdFx0XHRcdEV2ZW50cy50cmlnZ2VyKHRoaXMub3MsICdjb3VudGVkLScgKyB0aGlzLnVybCk7XG5cdFx0XHRcdFx0XHRyZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBmaW5hbENvdW50KTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBjb3VudCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdHR3aXR0ZXIgKHVybCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiAnZ2V0Jyxcblx0XHRcdHVybDogYGh0dHBzOi8vYXBpLm9wZW5zaGFyZS5zb2NpYWwvam9iP3VybD0ke3VybH1gLFxuXHRcdFx0dHJhbnNmb3JtOiBmdW5jdGlvbih4aHIpIHtcblx0XHRcdFx0bGV0IGNvdW50ID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KS5jb3VudDtcblx0XHRcdFx0cmV0dXJuIHN0b3JlQ291bnQodGhpcywgY291bnQpO1xuXHRcdFx0fVxuXHRcdH07XG5cdH1cbn07XG5cbmZ1bmN0aW9uIHJlY3Vyc2l2ZUNvdW50ICh1cmwsIHBhZ2UsIGNvdW50LCBjYikge1xuXHRjb25zdCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblx0eGhyLm9wZW4oJ0dFVCcsIHVybCArICc/cGFnZT0nICsgcGFnZSk7XG5cdHhoci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuXHRcdGNvbnN0IGxpa2VzID0gSlNPTi5wYXJzZSh0aGlzLnJlc3BvbnNlKTtcblx0XHRjb3VudCArPSBsaWtlcy5sZW5ndGg7XG5cblx0XHQvLyBkcmliYmJsZSBsaWtlIHBlciBwYWdlIGlzIDEyXG5cdFx0aWYgKGxpa2VzLmxlbmd0aCA9PT0gMTIpIHtcblx0XHRcdHBhZ2UrKztcblx0XHRcdHJlY3Vyc2l2ZUNvdW50KHVybCwgcGFnZSwgY291bnQsIGNiKTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRjYihjb3VudCk7XG5cdFx0fVxuXHR9KTtcblx0eGhyLnNlbmQoKTtcbn1cbiIsIi8qKlxuICogR2VuZXJhdGUgc2hhcmUgY291bnQgaW5zdGFuY2UgZnJvbSBvbmUgdG8gbWFueSBuZXR3b3Jrc1xuICovXG5cbmNvbnN0IENvdW50VHJhbnNmb3JtcyA9IHJlcXVpcmUoJy4vY291bnQtdHJhbnNmb3JtcycpO1xuY29uc3QgRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcbmNvbnN0IGNvdW50UmVkdWNlID0gcmVxdWlyZSgnLi4vLi4vbGliL2NvdW50UmVkdWNlJyk7XG5jb25zdCBzdG9yZUNvdW50ID0gcmVxdWlyZSgnLi4vLi4vbGliL3N0b3JlQ291bnQnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBDb3VudCB7XG5cblx0Y29uc3RydWN0b3IodHlwZSwgdXJsKSB7XG5cblx0XHQvLyB0aHJvdyBlcnJvciBpZiBubyB1cmwgcHJvdmlkZWRcblx0XHRpZiAoIXVybCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBPcGVuIFNoYXJlOiBubyB1cmwgcHJvdmlkZWQgZm9yIGNvdW50YCk7XG5cdFx0fVxuXG5cdFx0Ly8gY2hlY2sgZm9yIEdpdGh1YiBjb3VudHNcblx0XHRpZiAodHlwZS5pbmRleE9mKCdnaXRodWInKSA9PT0gMCkge1xuXHRcdFx0aWYgKHR5cGUgPT09ICdnaXRodWItc3RhcnMnKSB7XG5cdFx0XHRcdHR5cGUgPSAnZ2l0aHViU3RhcnMnO1xuXHRcdFx0fSBlbHNlIGlmICh0eXBlID09PSAnZ2l0aHViLWZvcmtzJykge1xuXHRcdFx0XHR0eXBlID0gJ2dpdGh1YkZvcmtzJztcblx0XHRcdH0gZWxzZSBpZiAodHlwZSA9PT0gJ2dpdGh1Yi13YXRjaGVycycpIHtcblx0XHRcdFx0dHlwZSA9ICdnaXRodWJXYXRjaGVycyc7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKCdJbnZhbGlkIEdpdGh1YiBjb3VudCB0eXBlLiBUcnkgZ2l0aHViLXN0YXJzLCBnaXRodWItZm9ya3MsIG9yIGdpdGh1Yi13YXRjaGVycy4nKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBpZiB0eXBlIGlzIGNvbW1hIHNlcGFyYXRlIGxpc3QgY3JlYXRlIGFycmF5XG5cdFx0aWYgKHR5cGUuaW5kZXhPZignLCcpID4gLTEpIHtcblx0XHRcdHRoaXMudHlwZSA9IHR5cGU7XG5cdFx0XHR0aGlzLnR5cGVBcnIgPSB0aGlzLnR5cGUuc3BsaXQoJywnKTtcblx0XHRcdHRoaXMuY291bnREYXRhID0gW107XG5cblx0XHRcdC8vIGNoZWNrIGVhY2ggdHlwZSBzdXBwbGllZCBpcyB2YWxpZFxuXHRcdFx0dGhpcy50eXBlQXJyLmZvckVhY2goKHQpID0+IHtcblx0XHRcdFx0aWYgKCFDb3VudFRyYW5zZm9ybXNbdF0pIHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoYE9wZW4gU2hhcmU6ICR7dHlwZX0gaXMgYW4gaW52YWxpZCBjb3VudCB0eXBlYCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR0aGlzLmNvdW50RGF0YS5wdXNoKENvdW50VHJhbnNmb3Jtc1t0XSh1cmwpKTtcblx0XHRcdH0pO1xuXG5cdFx0Ly8gdGhyb3cgZXJyb3IgaWYgaW52YWxpZCB0eXBlIHByb3ZpZGVkXG5cdFx0fSBlbHNlIGlmICghQ291bnRUcmFuc2Zvcm1zW3R5cGVdKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYE9wZW4gU2hhcmU6ICR7dHlwZX0gaXMgYW4gaW52YWxpZCBjb3VudCB0eXBlYCk7XG5cblx0XHQvLyBzaW5nbGUgY291bnRcblx0XHQvLyBzdG9yZSBjb3VudCBVUkwgYW5kIHRyYW5zZm9ybSBmdW5jdGlvblxuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLnR5cGUgPSB0eXBlO1xuXHRcdFx0dGhpcy5jb3VudERhdGEgPSBDb3VudFRyYW5zZm9ybXNbdHlwZV0odXJsKTtcblx0XHR9XG5cdH1cblxuXHQvLyBoYW5kbGUgY2FsbGluZyBnZXRDb3VudCAvIGdldENvdW50c1xuXHQvLyBkZXBlbmRpbmcgb24gbnVtYmVyIG9mIHR5cGVzXG5cdGNvdW50KG9zLCBjYiwgYXBwZW5kVG8pIHtcblx0XHR0aGlzLm9zID0gb3M7XG5cdFx0dGhpcy5hcHBlbmRUbyA9IGFwcGVuZFRvO1xuXHRcdHRoaXMuY2IgPSBjYjtcbiAgICBcdHRoaXMudXJsID0gdGhpcy5vcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudCcpO1xuXHRcdHRoaXMuc2hhcmVkID0gdGhpcy5vcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudC11cmwnKTtcblxuXHRcdGlmICghQXJyYXkuaXNBcnJheSh0aGlzLmNvdW50RGF0YSkpIHtcblx0XHRcdHRoaXMuZ2V0Q291bnQoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5nZXRDb3VudHMoKTtcblx0XHR9XG5cdH1cblxuXHQvLyBmZXRjaCBjb3VudCBlaXRoZXIgQUpBWCBvciBKU09OUFxuXHRnZXRDb3VudCgpIHtcblx0XHR2YXIgY291bnQgPSB0aGlzLnN0b3JlR2V0KHRoaXMudHlwZSArICctJyArIHRoaXMuc2hhcmVkKTtcblxuXHRcdGlmIChjb3VudCkge1xuXHRcdFx0aWYgKHRoaXMuYXBwZW5kVG8gJiYgdHlwZW9mIHRoaXMuYXBwZW5kVG8gIT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0dGhpcy5hcHBlbmRUby5hcHBlbmRDaGlsZCh0aGlzLm9zKTtcblx0XHRcdH1cblx0XHRcdGNvdW50UmVkdWNlKHRoaXMub3MsIGNvdW50KTtcblx0XHR9XG5cdFx0dGhpc1t0aGlzLmNvdW50RGF0YS50eXBlXSh0aGlzLmNvdW50RGF0YSk7XG5cdH1cblxuXHQvLyBmZXRjaCBtdWx0aXBsZSBjb3VudHMgYW5kIGFnZ3JlZ2F0ZVxuXHRnZXRDb3VudHMoKSB7XG5cdFx0dGhpcy50b3RhbCA9IFtdO1xuXG5cdFx0dmFyIGNvdW50ID0gdGhpcy5zdG9yZUdldCh0aGlzLnR5cGUgKyAnLScgKyB0aGlzLnNoYXJlZCk7XG5cblx0XHRpZiAoY291bnQpIHtcblx0XHRcdGlmICh0aGlzLmFwcGVuZFRvICAmJiB0eXBlb2YgdGhpcy5hcHBlbmRUbyAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHR0aGlzLmFwcGVuZFRvLmFwcGVuZENoaWxkKHRoaXMub3MpO1xuXHRcdFx0fVxuXHRcdFx0Y291bnRSZWR1Y2UodGhpcy5vcywgY291bnQpO1xuXHRcdH1cblxuXHRcdHRoaXMuY291bnREYXRhLmZvckVhY2goY291bnREYXRhID0+IHtcblxuXHRcdFx0dGhpc1tjb3VudERhdGEudHlwZV0oY291bnREYXRhLCAobnVtKSA9PiB7XG5cdFx0XHRcdHRoaXMudG90YWwucHVzaChudW0pO1xuXG5cdFx0XHRcdC8vIHRvdGFsIGNvdW50cyBsZW5ndGggbm93IGVxdWFscyB0eXBlIGFycmF5IGxlbmd0aFxuXHRcdFx0XHQvLyBzbyBhZ2dyZWdhdGUsIHN0b3JlIGFuZCBpbnNlcnQgaW50byBET01cblx0XHRcdFx0aWYgKHRoaXMudG90YWwubGVuZ3RoID09PSB0aGlzLnR5cGVBcnIubGVuZ3RoKSB7XG5cdFx0XHRcdFx0bGV0IHRvdCA9IDA7XG5cblx0XHRcdFx0XHR0aGlzLnRvdGFsLmZvckVhY2goKHQpID0+IHtcblx0XHRcdFx0XHRcdHRvdCArPSB0O1xuXHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0aWYgKHRoaXMuYXBwZW5kVG8gICYmIHR5cGVvZiB0aGlzLmFwcGVuZFRvICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0XHR0aGlzLmFwcGVuZFRvLmFwcGVuZENoaWxkKHRoaXMub3MpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGNvbnN0IGxvY2FsID0gTnVtYmVyKHRoaXMuc3RvcmVHZXQodGhpcy50eXBlICsgJy0nICsgdGhpcy5zaGFyZWQpKTtcblx0XHRcdFx0XHRpZiAobG9jYWwgPiB0b3QpIHtcblx0XHRcdFx0XHRcdGNvbnN0IGxhdGVzdENvdW50ID0gTnVtYmVyKHRoaXMuc3RvcmVHZXQodGhpcy50eXBlICsgJy0nICsgdGhpcy5zaGFyZWQgKyAnLWxhdGVzdENvdW50JykpO1xuXHRcdFx0XHRcdFx0dGhpcy5zdG9yZVNldCh0aGlzLnR5cGUgKyAnLScgKyB0aGlzLnNoYXJlZCArICctbGF0ZXN0Q291bnQnLCB0b3QpO1xuXG5cdFx0XHRcdFx0XHR0b3QgPSBpc051bWVyaWMobGF0ZXN0Q291bnQpICYmIGxhdGVzdENvdW50ID4gMCA/XG5cdFx0XHRcdFx0XHRcdHRvdCArPSBsb2NhbCAtIGxhdGVzdENvdW50IDpcblx0XHRcdFx0XHRcdFx0dG90ICs9IGxvY2FsO1xuXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHRoaXMuc3RvcmVTZXQodGhpcy50eXBlICsgJy0nICsgdGhpcy5zaGFyZWQsIHRvdCk7XG5cblx0XHRcdFx0XHRjb3VudFJlZHVjZSh0aGlzLm9zLCB0b3QpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdGlmICh0aGlzLmFwcGVuZFRvICAmJiB0eXBlb2YgdGhpcy5hcHBlbmRUbyAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0dGhpcy5hcHBlbmRUby5hcHBlbmRDaGlsZCh0aGlzLm9zKTtcblx0XHR9XG5cdH1cblxuXHQvLyBoYW5kbGUgSlNPTlAgcmVxdWVzdHNcblx0anNvbnAoY291bnREYXRhLCBjYikge1xuXHRcdC8vIGRlZmluZSByYW5kb20gY2FsbGJhY2sgYW5kIGFzc2lnbiB0cmFuc2Zvcm0gZnVuY3Rpb25cblx0XHRsZXQgY2FsbGJhY2sgPSBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHJpbmcoNykucmVwbGFjZSgvW15hLXpBLVpdL2csICcnKTtcblx0XHR3aW5kb3dbY2FsbGJhY2tdID0gKGRhdGEpID0+IHtcblx0XHRcdGxldCBjb3VudCA9IGNvdW50RGF0YS50cmFuc2Zvcm0uYXBwbHkodGhpcywgW2RhdGFdKSB8fCAwO1xuXG5cdFx0XHRpZiAoY2IgJiYgdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdGNiKGNvdW50KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGlmICh0aGlzLmFwcGVuZFRvICAmJiB0eXBlb2YgdGhpcy5hcHBlbmRUbyAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdHRoaXMuYXBwZW5kVG8uYXBwZW5kQ2hpbGQodGhpcy5vcyk7XG5cdFx0XHRcdH1cblx0XHRcdFx0Y291bnRSZWR1Y2UodGhpcy5vcywgY291bnQsIHRoaXMuY2IpO1xuXHRcdFx0fVxuXG5cdFx0XHRFdmVudHMudHJpZ2dlcih0aGlzLm9zLCAnY291bnRlZC0nICsgdGhpcy51cmwpO1xuXHRcdH07XG5cblx0XHQvLyBhcHBlbmQgSlNPTlAgc2NyaXB0IHRhZyB0byBwYWdlXG5cdFx0bGV0IHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuXHRcdHNjcmlwdC5zcmMgPSBjb3VudERhdGEudXJsLnJlcGxhY2UoJ2NhbGxiYWNrPT8nLCBgY2FsbGJhY2s9JHtjYWxsYmFja31gKTtcblx0XHRkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdLmFwcGVuZENoaWxkKHNjcmlwdCk7XG5cblx0XHRyZXR1cm47XG5cdH1cblxuXHQvLyBoYW5kbGUgQUpBWCBHRVQgcmVxdWVzdFxuXHRnZXQoY291bnREYXRhLCBjYikge1xuXHRcdGxldCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuXHRcdC8vIG9uIHN1Y2Nlc3MgcGFzcyByZXNwb25zZSB0byB0cmFuc2Zvcm0gZnVuY3Rpb25cblx0XHR4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gKCkgPT4ge1xuXHRcdFx0aWYgKHhoci5yZWFkeVN0YXRlID09PSA0KSB7XG5cdFx0XHRcdGlmICh4aHIuc3RhdHVzID09PSAyMDApIHtcblx0XHRcdFx0XHRsZXQgY291bnQgPSBjb3VudERhdGEudHJhbnNmb3JtLmFwcGx5KHRoaXMsIFt4aHIsIEV2ZW50c10pIHx8IDA7XG5cblx0XHRcdFx0XHRpZiAoY2IgJiYgdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0XHRjYihjb3VudCk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGlmICh0aGlzLmFwcGVuZFRvICYmIHR5cGVvZiB0aGlzLmFwcGVuZFRvICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMuYXBwZW5kVG8uYXBwZW5kQ2hpbGQodGhpcy5vcyk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRjb3VudFJlZHVjZSh0aGlzLm9zLCBjb3VudCwgdGhpcy5jYik7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0RXZlbnRzLnRyaWdnZXIodGhpcy5vcywgJ2NvdW50ZWQtJyArIHRoaXMudXJsKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gZ2V0IEFQSSBkYXRhIGZyb20nLCBjb3VudERhdGEudXJsLCAnLiBQbGVhc2UgdXNlIHRoZSBsYXRlc3QgdmVyc2lvbiBvZiBPcGVuU2hhcmUuJyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0eGhyLm9wZW4oJ0dFVCcsIGNvdW50RGF0YS51cmwpO1xuXHRcdHhoci5zZW5kKCk7XG5cdH1cblxuXHQvLyBoYW5kbGUgQUpBWCBQT1NUIHJlcXVlc3Rcblx0cG9zdChjb3VudERhdGEsIGNiKSB7XG5cdFx0bGV0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG5cdFx0Ly8gb24gc3VjY2VzcyBwYXNzIHJlc3BvbnNlIHRvIHRyYW5zZm9ybSBmdW5jdGlvblxuXHRcdHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSAoKSA9PiB7XG5cdFx0XHRpZiAoeGhyLnJlYWR5U3RhdGUgIT09IFhNTEh0dHBSZXF1ZXN0LkRPTkUgfHxcblx0XHRcdFx0eGhyLnN0YXR1cyAhPT0gMjAwKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0bGV0IGNvdW50ID0gY291bnREYXRhLnRyYW5zZm9ybS5hcHBseSh0aGlzLCBbeGhyXSkgfHwgMDtcblxuXHRcdFx0aWYgKGNiICYmIHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRjYihjb3VudCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAodGhpcy5hcHBlbmRUbyAmJiB0eXBlb2YgdGhpcy5hcHBlbmRUbyAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdHRoaXMuYXBwZW5kVG8uYXBwZW5kQ2hpbGQodGhpcy5vcyk7XG5cdFx0XHRcdH1cblx0XHRcdFx0Y291bnRSZWR1Y2UodGhpcy5vcywgY291bnQsIHRoaXMuY2IpO1xuXHRcdFx0fVxuXHRcdFx0RXZlbnRzLnRyaWdnZXIodGhpcy5vcywgJ2NvdW50ZWQtJyArIHRoaXMudXJsKTtcblx0XHR9O1xuXG5cdFx0eGhyLm9wZW4oJ1BPU1QnLCBjb3VudERhdGEudXJsKTtcblx0XHR4aHIuc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb247Y2hhcnNldD1VVEYtOCcpO1xuXHRcdHhoci5zZW5kKEpTT04uc3RyaW5naWZ5KGNvdW50RGF0YS5kYXRhKSk7XG5cdH1cblxuXHRzdG9yZVNldCh0eXBlLCBjb3VudCA9IDApIHtcblx0XHRpZiAoIXdpbmRvdy5sb2NhbFN0b3JhZ2UgfHwgIXR5cGUpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRsb2NhbFN0b3JhZ2Uuc2V0SXRlbShgT3BlblNoYXJlLSR7dHlwZX1gLCBjb3VudCk7XG5cdH1cblxuXHRzdG9yZUdldCh0eXBlKSB7XG5cdFx0aWYgKCF3aW5kb3cubG9jYWxTdG9yYWdlIHx8ICF0eXBlKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGxvY2FsU3RvcmFnZS5nZXRJdGVtKGBPcGVuU2hhcmUtJHt0eXBlfWApO1xuXHR9XG5cbn07XG5cbmZ1bmN0aW9uIGlzTnVtZXJpYyhuKSB7XG4gIHJldHVybiAhaXNOYU4ocGFyc2VGbG9hdChuKSkgJiYgaXNGaW5pdGUobik7XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuXHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgcmVxdWlyZSgnLi4vLi4vbGliL2luaXQnKSh7XG5cdFx0c2VsZWN0b3I6IHtcblx0XHRcdHNoYXJlOiAnW2RhdGEtb3Blbi1zaGFyZV06bm90KFtkYXRhLW9wZW4tc2hhcmUtbm9kZV0pJyxcblx0XHRcdGNvdW50OiAnW2RhdGEtb3Blbi1zaGFyZS1jb3VudF06bm90KFtkYXRhLW9wZW4tc2hhcmUtbm9kZV0pJ1xuXHRcdH0sXG5cdFx0Y2I6IHtcblx0XHRcdHNoYXJlOiByZXF1aXJlKCcuLi8uLi9saWIvaW5pdGlhbGl6ZVNoYXJlTm9kZScpLFxuXHRcdFx0Y291bnQ6IHJlcXVpcmUoJy4uLy4uL2xpYi9pbml0aWFsaXplQ291bnROb2RlJylcblx0XHR9XG5cdH0pKTtcbn07XG4iLCIvKipcbiAqIFRyaWdnZXIgY3VzdG9tIE9wZW5TaGFyZSBuYW1lc3BhY2VkIGV2ZW50XG4gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuXHR0cmlnZ2VyOiBmdW5jdGlvbihlbGVtZW50LCBldmVudCkge1xuXHRcdGxldCBldiA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdFdmVudCcpO1xuXHRcdGV2LmluaXRFdmVudCgnT3BlblNoYXJlLicgKyBldmVudCwgdHJ1ZSwgdHJ1ZSk7XG5cdFx0ZWxlbWVudC5kaXNwYXRjaEV2ZW50KGV2KTtcblx0fVxufTtcbiIsIi8qKlxuICogT3BlblNoYXJlIGdlbmVyYXRlcyBhIHNpbmdsZSBzaGFyZSBsaW5rXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgT3BlblNoYXJlIHtcblxuXHRjb25zdHJ1Y3Rvcih0eXBlLCB0cmFuc2Zvcm0pIHtcblx0XHR0aGlzLmlvcyA9IC9pUGFkfGlQaG9uZXxpUG9kLy50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpICYmICF3aW5kb3cuTVNTdHJlYW07XG5cdFx0dGhpcy50eXBlID0gdHlwZTtcblx0XHR0aGlzLmR5bmFtaWMgPSBmYWxzZTtcblx0XHR0aGlzLnRyYW5zZm9ybSA9IHRyYW5zZm9ybTtcblxuXHRcdC8vIGNhcGl0YWxpemVkIHR5cGVcblx0XHR0aGlzLnR5cGVDYXBzID0gdHlwZS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHR5cGUuc2xpY2UoMSk7XG5cdH1cblxuXHQvLyByZXR1cm5zIGZ1bmN0aW9uIG5hbWVkIGFzIHR5cGUgc2V0IGluIGNvbnN0cnVjdG9yXG5cdC8vIGUuZyB0d2l0dGVyKClcblx0c2V0RGF0YShkYXRhKSB7XG5cdFx0Ly8gaWYgaU9TIHVzZXIgYW5kIGlvcyBkYXRhIGF0dHJpYnV0ZSBkZWZpbmVkXG5cdFx0Ly8gYnVpbGQgaU9TIFVSTCBzY2hlbWUgYXMgc2luZ2xlIHN0cmluZ1xuXHRcdGlmICh0aGlzLmlvcykge1xuXHRcdFx0dGhpcy50cmFuc2Zvcm1EYXRhID0gdGhpcy50cmFuc2Zvcm0oZGF0YSwgdHJ1ZSk7XG5cdFx0XHR0aGlzLm1vYmlsZVNoYXJlVXJsID0gdGhpcy50ZW1wbGF0ZSh0aGlzLnRyYW5zZm9ybURhdGEudXJsLCB0aGlzLnRyYW5zZm9ybURhdGEuZGF0YSk7XG5cdFx0fVxuXG5cdFx0dGhpcy50cmFuc2Zvcm1EYXRhID0gdGhpcy50cmFuc2Zvcm0oZGF0YSk7XG5cdFx0dGhpcy5zaGFyZVVybCA9IHRoaXMudGVtcGxhdGUodGhpcy50cmFuc2Zvcm1EYXRhLnVybCwgdGhpcy50cmFuc2Zvcm1EYXRhLmRhdGEpO1xuXHR9XG5cblx0Ly8gb3BlbiBzaGFyZSBVUkwgZGVmaW5lZCBpbiBpbmRpdmlkdWFsIHBsYXRmb3JtIGZ1bmN0aW9uc1xuXHRzaGFyZShlKSB7XG5cdFx0Ly8gaWYgaU9TIHNoYXJlIFVSTCBoYXMgYmVlbiBzZXQgdGhlbiB1c2UgdGltZW91dCBoYWNrXG5cdFx0Ly8gdGVzdCBmb3IgbmF0aXZlIGFwcCBhbmQgZmFsbCBiYWNrIHRvIHdlYlxuXHRcdGlmICh0aGlzLm1vYmlsZVNoYXJlVXJsKSB7XG5cdFx0XHR2YXIgc3RhcnQgPSAobmV3IERhdGUoKSkudmFsdWVPZigpO1xuXG5cdFx0XHRzZXRUaW1lb3V0KCgpID0+IHtcblx0XHRcdFx0dmFyIGVuZCA9IChuZXcgRGF0ZSgpKS52YWx1ZU9mKCk7XG5cblx0XHRcdFx0Ly8gaWYgdGhlIHVzZXIgaXMgc3RpbGwgaGVyZSwgZmFsbCBiYWNrIHRvIHdlYlxuXHRcdFx0XHRpZiAoZW5kIC0gc3RhcnQgPiAxNjAwKSB7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0d2luZG93LmxvY2F0aW9uID0gdGhpcy5zaGFyZVVybDtcblx0XHRcdH0sIDE1MDApO1xuXG5cdFx0XHR3aW5kb3cubG9jYXRpb24gPSB0aGlzLm1vYmlsZVNoYXJlVXJsO1xuXG5cdFx0Ly8gb3BlbiBtYWlsdG8gbGlua3MgaW4gc2FtZSB3aW5kb3dcblx0XHR9IGVsc2UgaWYgKHRoaXMudHlwZSA9PT0gJ2VtYWlsJykge1xuXHRcdFx0d2luZG93LmxvY2F0aW9uID0gdGhpcy5zaGFyZVVybDtcblxuXHRcdC8vIG9wZW4gc29jaWFsIHNoYXJlIFVSTHMgaW4gbmV3IHdpbmRvd1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBpZiBwb3B1cCBvYmplY3QgcHJlc2VudCB0aGVuIHNldCB3aW5kb3cgZGltZW5zaW9ucyAvIHBvc2l0aW9uXG5cdFx0XHRpZih0aGlzLnBvcHVwICYmIHRoaXMudHJhbnNmb3JtRGF0YS5wb3B1cCkge1xuXHRcdFx0XHR0aGlzLm9wZW5XaW5kb3codGhpcy5zaGFyZVVybCwgdGhpcy50cmFuc2Zvcm1EYXRhLnBvcHVwKTtcblx0XHRcdH1cblxuXHRcdFx0d2luZG93Lm9wZW4odGhpcy5zaGFyZVVybCk7XG5cdFx0fVxuXHR9XG5cblx0Ly8gY3JlYXRlIHNoYXJlIFVSTCB3aXRoIEdFVCBwYXJhbXNcblx0Ly8gYXBwZW5kaW5nIHZhbGlkIHByb3BlcnRpZXMgdG8gcXVlcnkgc3RyaW5nXG5cdHRlbXBsYXRlKHVybCwgZGF0YSkge1xuXHRcdGxldCBub25VUkxQcm9wcyA9IFtcblx0XHRcdCdhcHBlbmRUbycsXG5cdFx0XHQnaW5uZXJIVE1MJyxcblx0XHRcdCdjbGFzc2VzJ1xuXHRcdF07XG5cblx0XHRsZXQgc2hhcmVVcmwgPSB1cmwsXG5cdFx0XHRpO1xuXG5cdFx0Zm9yIChpIGluIGRhdGEpIHtcblx0XHRcdC8vIG9ubHkgYXBwZW5kIHZhbGlkIHByb3BlcnRpZXNcblx0XHRcdGlmICghZGF0YVtpXSB8fCBub25VUkxQcm9wcy5pbmRleE9mKGkpID4gLTEpIHtcblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHR9XG5cblx0XHRcdC8vIGFwcGVuZCBVUkwgZW5jb2RlZCBHRVQgcGFyYW0gdG8gc2hhcmUgVVJMXG5cdFx0XHRkYXRhW2ldID0gZW5jb2RlVVJJQ29tcG9uZW50KGRhdGFbaV0pO1xuXHRcdFx0c2hhcmVVcmwgKz0gYCR7aX09JHtkYXRhW2ldfSZgO1xuXHRcdH1cblxuXHRcdHJldHVybiBzaGFyZVVybC5zdWJzdHIoMCwgc2hhcmVVcmwubGVuZ3RoIC0gMSk7XG5cdH1cblxuXHQvLyBjZW50ZXIgcG9wdXAgd2luZG93IHN1cHBvcnRpbmcgZHVhbCBzY3JlZW5zXG5cdG9wZW5XaW5kb3codXJsLCBvcHRpb25zKSB7XG5cdFx0bGV0IGR1YWxTY3JlZW5MZWZ0ID0gd2luZG93LnNjcmVlbkxlZnQgIT0gdW5kZWZpbmVkID8gd2luZG93LnNjcmVlbkxlZnQgOiBzY3JlZW4ubGVmdCxcblx0XHRcdGR1YWxTY3JlZW5Ub3AgPSB3aW5kb3cuc2NyZWVuVG9wICE9IHVuZGVmaW5lZCA/IHdpbmRvdy5zY3JlZW5Ub3AgOiBzY3JlZW4udG9wLFxuXHRcdFx0d2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aCA/IHdpbmRvdy5pbm5lcldpZHRoIDogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoID8gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoIDogc2NyZWVuLndpZHRoLFxuXHRcdFx0aGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0ID8gd2luZG93LmlubmVySGVpZ2h0IDogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodCA/IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQgOiBzY3JlZW4uaGVpZ2h0LFxuXHRcdFx0bGVmdCA9ICgod2lkdGggLyAyKSAtIChvcHRpb25zLndpZHRoIC8gMikpICsgZHVhbFNjcmVlbkxlZnQsXG5cdFx0XHR0b3AgPSAoKGhlaWdodCAvIDIpIC0gKG9wdGlvbnMuaGVpZ2h0IC8gMikpICsgZHVhbFNjcmVlblRvcCxcblx0XHRcdG5ld1dpbmRvdyA9IHdpbmRvdy5vcGVuKHVybCwgJ09wZW5TaGFyZScsIGB3aWR0aD0ke29wdGlvbnMud2lkdGh9LCBoZWlnaHQ9JHtvcHRpb25zLmhlaWdodH0sIHRvcD0ke3RvcH0sIGxlZnQ9JHtsZWZ0fWApO1xuXG5cdFx0Ly8gUHV0cyBmb2N1cyBvbiB0aGUgbmV3V2luZG93XG5cdFx0aWYgKHdpbmRvdy5mb2N1cykge1xuXHRcdFx0bmV3V2luZG93LmZvY3VzKCk7XG5cdFx0fVxuXHR9XG59O1xuIiwiLyoqXG4gKiBHbG9iYWwgT3BlblNoYXJlIEFQSSB0byBnZW5lcmF0ZSBpbnN0YW5jZXMgcHJvZ3JhbW1hdGljYWxseVxuICovXG5cbmNvbnN0IE9TID0gcmVxdWlyZSgnLi9vcGVuLXNoYXJlJyk7XG5jb25zdCBTaGFyZVRyYW5zZm9ybXMgPSByZXF1aXJlKCcuL3NoYXJlLXRyYW5zZm9ybXMnKTtcbmNvbnN0IEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG5jb25zdCBkYXNoVG9DYW1lbCA9IHJlcXVpcmUoJy4uLy4uL2xpYi9kYXNoVG9DYW1lbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuXG5cdC8vIGdsb2JhbCBPcGVuU2hhcmUgcmVmZXJlbmNpbmcgaW50ZXJuYWwgY2xhc3MgZm9yIGluc3RhbmNlIGdlbmVyYXRpb25cblx0Y2xhc3MgT3BlblNoYXJlIHtcblxuXHRcdGNvbnN0cnVjdG9yKGRhdGEsIGVsZW1lbnQpIHtcblxuXHRcdFx0aWYgKCFkYXRhLmJpbmRDbGljaykgZGF0YS5iaW5kQ2xpY2sgPSB0cnVlO1xuXG5cdFx0XHRsZXQgZGFzaCA9IGRhdGEudHlwZS5pbmRleE9mKCctJyk7XG5cblx0XHRcdGlmIChkYXNoID4gLTEpIHtcblx0XHRcdFx0ZGF0YS50eXBlID0gZGFzaFRvQ2FtZWwoZGFzaCwgZGF0YS50eXBlKTtcblx0XHRcdH1cblxuXHRcdFx0bGV0IG5vZGU7XG5cdFx0XHR0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuXHRcdFx0dGhpcy5kYXRhID0gZGF0YTtcblxuXHRcdFx0dGhpcy5vcyA9IG5ldyBPUyhkYXRhLnR5cGUsIFNoYXJlVHJhbnNmb3Jtc1tkYXRhLnR5cGVdKTtcblx0XHRcdHRoaXMub3Muc2V0RGF0YShkYXRhKTtcblxuXHRcdFx0aWYgKCFlbGVtZW50IHx8IGRhdGEuZWxlbWVudCkge1xuXHRcdFx0XHRlbGVtZW50ID0gZGF0YS5lbGVtZW50O1xuXHRcdFx0XHRub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChlbGVtZW50IHx8ICdhJyk7XG5cdFx0XHRcdGlmIChkYXRhLnR5cGUpIHtcblx0XHRcdFx0XHRub2RlLmNsYXNzTGlzdC5hZGQoJ29wZW4tc2hhcmUtbGluaycsIGRhdGEudHlwZSk7XG5cdFx0XHRcdFx0bm9kZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZScsIGRhdGEudHlwZSk7XG5cdFx0XHRcdFx0bm9kZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1ub2RlJywgZGF0YS50eXBlKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoZGF0YS5pbm5lckhUTUwpIG5vZGUuaW5uZXJIVE1MID0gZGF0YS5pbm5lckhUTUw7XG5cdFx0XHR9XG5cdFx0XHRpZiAobm9kZSkgZWxlbWVudCA9IG5vZGU7XG5cblx0XHRcdGlmIChkYXRhLmJpbmRDbGljaykge1xuXHRcdFx0XHRlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcblx0XHRcdFx0XHR0aGlzLnNoYXJlKCk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGF0YS5hcHBlbmRUbykge1xuXHRcdFx0XHRkYXRhLmFwcGVuZFRvLmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGF0YS5jbGFzc2VzICYmIEFycmF5LmlzQXJyYXkoZGF0YS5jbGFzc2VzKSkge1xuXHRcdFx0XHRkYXRhLmNsYXNzZXMuZm9yRWFjaChjc3NDbGFzcyA9PiB7XG5cdFx0XHRcdFx0ZWxlbWVudC5jbGFzc0xpc3QuYWRkKGNzc0NsYXNzKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkYXRhLnR5cGUudG9Mb3dlckNhc2UoKSA9PT0gJ3BheXBhbCcpIHtcblx0XHRcdFx0Y29uc3QgYWN0aW9uID0gZGF0YS5zYW5kYm94ID9cblx0XHRcdFx0ICAgXCJodHRwczovL3d3dy5zYW5kYm94LnBheXBhbC5jb20vY2dpLWJpbi93ZWJzY3JcIiA6XG5cdFx0XHRcdCAgIFwiaHR0cHM6Ly93d3cucGF5cGFsLmNvbS9jZ2ktYmluL3dlYnNjclwiO1xuXG5cdFx0XHRcdGNvbnN0IGJ1eUdJRiA9IGRhdGEuc2FuZGJveCA/XG5cdFx0XHRcdFx0XCJodHRwczovL3d3dy5zYW5kYm94LnBheXBhbC5jb20vZW5fVVMvaS9idG4vYnRuX2J1eW5vd19MRy5naWZcIiA6XG5cdFx0XHRcdFx0XCJodHRwczovL3d3dy5wYXlwYWxvYmplY3RzLmNvbS9lbl9VUy9pL2J0bi9idG5fYnV5bm93X0xHLmdpZlwiO1xuXG5cdFx0XHRcdGNvbnN0IHBpeGVsR0lGID0gZGF0YS5zYW5kYm94ID9cblx0XHRcdFx0XHRcImh0dHBzOi8vd3d3LnNhbmRib3gucGF5cGFsLmNvbS9lbl9VUy9pL3Njci9waXhlbC5naWZcIiA6XG5cdFx0XHRcdFx0XCJodHRwczovL3d3dy5wYXlwYWxvYmplY3RzLmNvbS9lbl9VUy9pL3Njci9waXhlbC5naWZcIjtcblxuXG5cdFx0XHRcdGNvbnN0IHBheXBhbEJ1dHRvbiA9IGA8Zm9ybSBhY3Rpb249JHthY3Rpb259IG1ldGhvZD1cInBvc3RcIiB0YXJnZXQ9XCJfYmxhbmtcIj5cblxuXHRcdFx0XHQgIDwhLS0gU2F2ZWQgYnV0dG9ucyB1c2UgdGhlIFwic2VjdXJlIGNsaWNrXCIgY29tbWFuZCAtLT5cblx0XHRcdFx0ICA8aW5wdXQgdHlwZT1cImhpZGRlblwiIG5hbWU9XCJjbWRcIiB2YWx1ZT1cIl9zLXhjbGlja1wiPlxuXG5cdFx0XHRcdCAgPCEtLSBTYXZlZCBidXR0b25zIGFyZSBpZGVudGlmaWVkIGJ5IHRoZWlyIGJ1dHRvbiBJRHMgLS0+XG5cdFx0XHRcdCAgPGlucHV0IHR5cGU9XCJoaWRkZW5cIiBuYW1lPVwiaG9zdGVkX2J1dHRvbl9pZFwiIHZhbHVlPVwiJHtkYXRhLmJ1dHRvbklkfVwiPlxuXG5cdFx0XHRcdCAgPCEtLSBTYXZlZCBidXR0b25zIGRpc3BsYXkgYW4gYXBwcm9wcmlhdGUgYnV0dG9uIGltYWdlLiAtLT5cblx0XHRcdFx0ICA8aW5wdXQgdHlwZT1cImltYWdlXCIgbmFtZT1cInN1Ym1pdFwiXG5cdFx0XHRcdCAgICBzcmM9JHtidXlHSUZ9XG5cdFx0XHRcdCAgICBhbHQ9XCJQYXlQYWwgLSBUaGUgc2FmZXIsIGVhc2llciB3YXkgdG8gcGF5IG9ubGluZVwiPlxuXHRcdFx0XHQgIDxpbWcgYWx0PVwiXCIgd2lkdGg9XCIxXCIgaGVpZ2h0PVwiMVwiXG5cdFx0XHRcdCAgICBzcmM9JHtwaXhlbEdJRn0gPlxuXG5cdFx0XHRcdDwvZm9ybT5gO1xuXG5cdFx0XHRcdGNvbnN0IGhpZGRlbkRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHRcdFx0XHRoaWRkZW5EaXYuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblx0XHRcdFx0aGlkZGVuRGl2LmlubmVySFRNTCA9IHBheXBhbEJ1dHRvbjtcblx0XHRcdFx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChoaWRkZW5EaXYpO1xuXG5cdFx0XHRcdHRoaXMucGF5cGFsID0gaGlkZGVuRGl2LnF1ZXJ5U2VsZWN0b3IoJ2Zvcm0nKTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5lbGVtZW50ID0gZWxlbWVudDtcblx0XHRcdHJldHVybiBlbGVtZW50O1xuXHRcdH1cblxuXHRcdC8vIHB1YmxpYyBzaGFyZSBtZXRob2QgdG8gdHJpZ2dlciBzaGFyZSBwcm9ncmFtbWF0aWNhbGx5XG5cdFx0c2hhcmUoZSkge1xuXHRcdFx0Ly8gaWYgZHluYW1pYyBpbnN0YW5jZSB0aGVuIGZldGNoIGF0dHJpYnV0ZXMgYWdhaW4gaW4gY2FzZSBvZiB1cGRhdGVzXG5cdFx0XHRpZiAodGhpcy5kYXRhLmR5bmFtaWMpIHtcblx0XHRcdFx0dGhpcy5vcy5zZXREYXRhKGRhdGEpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAodGhpcy5kYXRhLnR5cGUudG9Mb3dlckNhc2UoKSA9PT0gJ3BheXBhbCcpIHtcblx0XHRcdFx0dGhpcy5wYXlwYWwuc3VibWl0KCk7XG5cdFx0XHR9IGVsc2UgdGhpcy5vcy5zaGFyZShlKTtcblxuXHRcdFx0RXZlbnRzLnRyaWdnZXIodGhpcy5lbGVtZW50LCAnc2hhcmVkJyk7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIE9wZW5TaGFyZTtcbn07XG4iLCIvKipcbiAqIE9iamVjdCBvZiB0cmFuc2Zvcm0gZnVuY3Rpb25zIGZvciBlYWNoIG9wZW5zaGFyZSBhcGlcbiAqIFRyYW5zZm9ybSBmdW5jdGlvbnMgcGFzc2VkIGludG8gT3BlblNoYXJlIGluc3RhbmNlIHdoZW4gaW5zdGFudGlhdGVkXG4gKiBSZXR1cm4gb2JqZWN0IGNvbnRhaW5pbmcgVVJMIGFuZCBrZXkvdmFsdWUgYXJnc1xuICovXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuXHQvLyBzZXQgVHdpdHRlciBzaGFyZSBVUkxcblx0dHdpdHRlcjogZnVuY3Rpb24oZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHQvLyBpZiBpT1MgdXNlciBhbmQgaW9zIGRhdGEgYXR0cmlidXRlIGRlZmluZWRcblx0XHQvLyBidWlsZCBpT1MgVVJMIHNjaGVtZSBhcyBzaW5nbGUgc3RyaW5nXG5cdFx0aWYgKGlvcyAmJiBkYXRhLmlvcykge1xuXG5cdFx0XHRsZXQgbWVzc2FnZSA9IGBgO1xuXG5cdFx0XHRpZiAoZGF0YS50ZXh0KSB7XG5cdFx0XHRcdG1lc3NhZ2UgKz0gZGF0YS50ZXh0O1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGF0YS51cmwpIHtcblx0XHRcdFx0bWVzc2FnZSArPSBgIC0gJHtkYXRhLnVybH1gO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGF0YS5oYXNodGFncykge1xuXHRcdFx0XHRsZXQgdGFncyA9IGRhdGEuaGFzaHRhZ3Muc3BsaXQoJywnKTtcblx0XHRcdFx0dGFncy5mb3JFYWNoKGZ1bmN0aW9uKHRhZykge1xuXHRcdFx0XHRcdG1lc3NhZ2UgKz0gYCAjJHt0YWd9YDtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkYXRhLnZpYSkge1xuXHRcdFx0XHRtZXNzYWdlICs9IGAgdmlhICR7ZGF0YS52aWF9YDtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0dXJsOiAndHdpdHRlcjovL3Bvc3Q/Jyxcblx0XHRcdFx0ZGF0YToge1xuXHRcdFx0XHRcdG1lc3NhZ2U6IG1lc3NhZ2Vcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiAnaHR0cHM6Ly90d2l0dGVyLmNvbS9zaGFyZT8nLFxuXHRcdFx0ZGF0YTogZGF0YSxcblx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdHdpZHRoOiA3MDAsXG5cdFx0XHRcdGhlaWdodDogMjk2XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBzZXQgVHdpdHRlciByZXR3ZWV0IFVSTFxuXHR0d2l0dGVyUmV0d2VldDogZnVuY3Rpb24oZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHQvLyBpZiBpT1MgdXNlciBhbmQgaW9zIGRhdGEgYXR0cmlidXRlIGRlZmluZWRcblx0XHRpZiAoaW9zICYmIGRhdGEuaW9zKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR1cmw6ICd0d2l0dGVyOi8vc3RhdHVzPycsXG5cdFx0XHRcdGRhdGE6IHtcblx0XHRcdFx0XHRpZDogZGF0YS50d2VldElkXG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybDogJ2h0dHBzOi8vdHdpdHRlci5jb20vaW50ZW50L3JldHdlZXQ/Jyxcblx0XHRcdGRhdGE6IHtcblx0XHRcdFx0dHdlZXRfaWQ6IGRhdGEudHdlZXRJZCxcblx0XHRcdFx0cmVsYXRlZDogZGF0YS5yZWxhdGVkXG5cdFx0XHR9LFxuXHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0d2lkdGg6IDcwMCxcblx0XHRcdFx0aGVpZ2h0OiAyOTZcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBUd2l0dGVyIGxpa2UgVVJMXG5cdHR3aXR0ZXJMaWtlOiBmdW5jdGlvbihkYXRhLCBpb3MgPSBmYWxzZSkge1xuXHRcdC8vIGlmIGlPUyB1c2VyIGFuZCBpb3MgZGF0YSBhdHRyaWJ1dGUgZGVmaW5lZFxuXHRcdGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVybDogJ3R3aXR0ZXI6Ly9zdGF0dXM/Jyxcblx0XHRcdFx0ZGF0YToge1xuXHRcdFx0XHRcdGlkOiBkYXRhLnR3ZWV0SWRcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiAnaHR0cHM6Ly90d2l0dGVyLmNvbS9pbnRlbnQvZmF2b3JpdGU/Jyxcblx0XHRcdGRhdGE6IHtcblx0XHRcdFx0dHdlZXRfaWQ6IGRhdGEudHdlZXRJZCxcblx0XHRcdFx0cmVsYXRlZDogZGF0YS5yZWxhdGVkXG5cdFx0XHR9LFxuXHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0d2lkdGg6IDcwMCxcblx0XHRcdFx0aGVpZ2h0OiAyOTZcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBUd2l0dGVyIGZvbGxvdyBVUkxcblx0dHdpdHRlckZvbGxvdzogZnVuY3Rpb24oZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHQvLyBpZiBpT1MgdXNlciBhbmQgaW9zIGRhdGEgYXR0cmlidXRlIGRlZmluZWRcblx0XHRpZiAoaW9zICYmIGRhdGEuaW9zKSB7XG5cdFx0XHRsZXQgaW9zRGF0YSA9IGRhdGEuc2NyZWVuTmFtZSA/IHtcblx0XHRcdFx0J3NjcmVlbl9uYW1lJzogZGF0YS5zY3JlZW5OYW1lXG5cdFx0XHR9IDoge1xuXHRcdFx0XHQnaWQnOiBkYXRhLnVzZXJJZFxuXHRcdFx0fTtcblxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0dXJsOiAndHdpdHRlcjovL3VzZXI/Jyxcblx0XHRcdFx0ZGF0YTogaW9zRGF0YVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiAnaHR0cHM6Ly90d2l0dGVyLmNvbS9pbnRlbnQvdXNlcj8nLFxuXHRcdFx0ZGF0YToge1xuXHRcdFx0XHRzY3JlZW5fbmFtZTogZGF0YS5zY3JlZW5OYW1lLFxuXHRcdFx0XHR1c2VyX2lkOiBkYXRhLnVzZXJJZFxuXHRcdFx0fSxcblx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdHdpZHRoOiA3MDAsXG5cdFx0XHRcdGhlaWdodDogMjk2XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBzZXQgRmFjZWJvb2sgc2hhcmUgVVJMXG5cdGZhY2Vib29rOiBmdW5jdGlvbihkYXRhKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybDogJ2h0dHBzOi8vd3d3LmZhY2Vib29rLmNvbS9kaWFsb2cvZmVlZD9hcHBfaWQ9OTYxMzQyNTQzOTIyMzIyJnJlZGlyZWN0X3VyaT1odHRwOi8vZmFjZWJvb2suY29tJicsXG5cdFx0XHRkYXRhOiBkYXRhLFxuXHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0d2lkdGg6IDU2MCxcblx0XHRcdFx0aGVpZ2h0OiA1OTNcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBGYWNlYm9vayBzZW5kIFVSTFxuXHRmYWNlYm9va1NlbmQ6IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiAnaHR0cHM6Ly93d3cuZmFjZWJvb2suY29tL2RpYWxvZy9zZW5kP2FwcF9pZD05NjEzNDI1NDM5MjIzMjImcmVkaXJlY3RfdXJpPWh0dHA6Ly9mYWNlYm9vay5jb20mJyxcblx0XHRcdGRhdGE6IGRhdGEsXG5cdFx0XHRwb3B1cDoge1xuXHRcdFx0XHR3aWR0aDogOTgwLFxuXHRcdFx0XHRoZWlnaHQ6IDU5NlxuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gc2V0IFlvdVR1YmUgcGxheSBVUkxcblx0eW91dHViZTogZnVuY3Rpb24oZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHQvLyBpZiBpT1MgdXNlclxuXHRcdGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVybDogYHlvdXR1YmU6JHtkYXRhLnZpZGVvfT9gXG5cdFx0XHR9O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR1cmw6IGBodHRwczovL3d3dy55b3V0dWJlLmNvbS93YXRjaD92PSR7ZGF0YS52aWRlb30/YCxcblx0XHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0XHR3aWR0aDogMTA4Nixcblx0XHRcdFx0XHRoZWlnaHQ6IDYwOFxuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdH1cblx0fSxcblxuXHQvLyBzZXQgWW91VHViZSBzdWJjcmliZSBVUkxcblx0eW91dHViZVN1YnNjcmliZTogZnVuY3Rpb24oZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHQvLyBpZiBpT1MgdXNlclxuXHRcdGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVybDogYHlvdXR1YmU6Ly93d3cueW91dHViZS5jb20vdXNlci8ke2RhdGEudXNlcn0/YFxuXHRcdFx0fTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0dXJsOiBgaHR0cHM6Ly93d3cueW91dHViZS5jb20vdXNlci8ke2RhdGEudXNlcn0/YCxcblx0XHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0XHR3aWR0aDogODgwLFxuXHRcdFx0XHRcdGhlaWdodDogMzUwXG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0fVxuXHR9LFxuXG5cdC8vIHNldCBJbnN0YWdyYW0gZm9sbG93IFVSTFxuXHRpbnN0YWdyYW06IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiBgaW5zdGFncmFtOi8vY2FtZXJhP2Bcblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBJbnN0YWdyYW0gZm9sbG93IFVSTFxuXHRpbnN0YWdyYW1Gb2xsb3c6IGZ1bmN0aW9uKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG5cdFx0Ly8gaWYgaU9TIHVzZXJcblx0XHRpZiAoaW9zICYmIGRhdGEuaW9zKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR1cmw6ICdpbnN0YWdyYW06Ly91c2VyPycsXG5cdFx0XHRcdGRhdGE6IGRhdGFcblx0XHRcdH07XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVybDogYGh0dHA6Ly93d3cuaW5zdGFncmFtLmNvbS8ke2RhdGEudXNlcm5hbWV9P2AsXG5cdFx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdFx0d2lkdGg6IDk4MCxcblx0XHRcdFx0XHRoZWlnaHQ6IDY1NVxuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdH1cblx0fSxcblxuXHQvLyBzZXQgU25hcGNoYXQgZm9sbG93IFVSTFxuXHRzbmFwY2hhdCAoZGF0YSkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6IGBzbmFwY2hhdDovL2FkZC8ke2RhdGEudXNlcm5hbWV9P2Bcblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBHb29nbGUgc2hhcmUgVVJMXG5cdGdvb2dsZSAoZGF0YSkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6ICdodHRwczovL3BsdXMuZ29vZ2xlLmNvbS9zaGFyZT8nLFxuXHRcdFx0ZGF0YTogZGF0YSxcblx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdHdpZHRoOiA0OTUsXG5cdFx0XHRcdGhlaWdodDogODE1XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBzZXQgR29vZ2xlIG1hcHMgVVJMXG5cdGdvb2dsZU1hcHMgKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG5cblx0XHRpZiAoZGF0YS5zZWFyY2gpIHtcblx0XHRcdGRhdGEucSA9IGRhdGEuc2VhcmNoO1xuXHRcdFx0ZGVsZXRlIGRhdGEuc2VhcmNoO1xuXHRcdH1cblxuXHRcdC8vIGlmIGlPUyB1c2VyIGFuZCBpb3MgZGF0YSBhdHRyaWJ1dGUgZGVmaW5lZFxuXHRcdGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVybDogJ2NvbWdvb2dsZW1hcHM6Ly8/Jyxcblx0XHRcdFx0ZGF0YTogaW9zXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdGlmICghaW9zICYmIGRhdGEuaW9zKSB7XG5cdFx0XHRkZWxldGUgZGF0YS5pb3M7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybDogJ2h0dHBzOi8vbWFwcy5nb29nbGUuY29tLz8nLFxuXHRcdFx0ZGF0YTogZGF0YSxcblx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdHdpZHRoOiA4MDAsXG5cdFx0XHRcdGhlaWdodDogNjAwXG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBzZXQgUGludGVyZXN0IHNoYXJlIFVSTFxuXHRwaW50ZXJlc3QgKGRhdGEpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiAnaHR0cHM6Ly9waW50ZXJlc3QuY29tL3Bpbi9jcmVhdGUvYm9va21hcmtsZXQvPycsXG5cdFx0XHRkYXRhOiBkYXRhLFxuXHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0d2lkdGg6IDc0NSxcblx0XHRcdFx0aGVpZ2h0OiA2MjBcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBMaW5rZWRJbiBzaGFyZSBVUkxcblx0bGlua2VkaW4gKGRhdGEpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiAnaHR0cDovL3d3dy5saW5rZWRpbi5jb20vc2hhcmVBcnRpY2xlPycsXG5cdFx0XHRkYXRhOiBkYXRhLFxuXHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0d2lkdGg6IDc4MCxcblx0XHRcdFx0aGVpZ2h0OiA0OTJcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBCdWZmZXIgc2hhcmUgVVJMXG5cdGJ1ZmZlciAoZGF0YSkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6ICdodHRwOi8vYnVmZmVyYXBwLmNvbS9hZGQ/Jyxcblx0XHRcdGRhdGE6IGRhdGEsXG5cdFx0XHRwb3B1cDoge1xuXHRcdFx0XHR3aWR0aDogNzQ1LFxuXHRcdFx0XHRoZWlnaHQ6IDM0NVxuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gc2V0IFR1bWJsciBzaGFyZSBVUkxcblx0dHVtYmxyIChkYXRhKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybDogJ2h0dHBzOi8vd3d3LnR1bWJsci5jb20vd2lkZ2V0cy9zaGFyZS90b29sPycsXG5cdFx0XHRkYXRhOiBkYXRhLFxuXHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0d2lkdGg6IDU0MCxcblx0XHRcdFx0aGVpZ2h0OiA5NDBcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBSZWRkaXQgc2hhcmUgVVJMXG5cdHJlZGRpdCAoZGF0YSkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6ICdodHRwOi8vcmVkZGl0LmNvbS9zdWJtaXQ/Jyxcblx0XHRcdGRhdGE6IGRhdGEsXG5cdFx0XHRwb3B1cDoge1xuXHRcdFx0XHR3aWR0aDogODYwLFxuXHRcdFx0XHRoZWlnaHQ6IDg4MFxuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gc2V0IEZsaWNrciBmb2xsb3cgVVJMXG5cdGZsaWNrciAoZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHQvLyBpZiBpT1MgdXNlclxuXHRcdGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVybDogYGZsaWNrcjovL3Bob3Rvcy8ke2RhdGEudXNlcm5hbWV9P2Bcblx0XHRcdH07XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVybDogYGh0dHA6Ly93d3cuZmxpY2tyLmNvbS9waG90b3MvJHtkYXRhLnVzZXJuYW1lfT9gLFxuXHRcdFx0XHRwb3B1cDoge1xuXHRcdFx0XHRcdHdpZHRoOiA2MDAsXG5cdFx0XHRcdFx0aGVpZ2h0OiA2NTBcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9XG5cdH0sXG5cblx0Ly8gc2V0IFdoYXRzQXBwIHNoYXJlIFVSTFxuXHR3aGF0c2FwcCAoZGF0YSkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6ICd3aGF0c2FwcDovL3NlbmQ/Jyxcblx0XHRcdGRhdGE6IGRhdGFcblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBzbXMgc2hhcmUgVVJMXG5cdHNtcyAoZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiBpb3MgPyAnc21zOiYnIDogJ3Ntczo/Jyxcblx0XHRcdGRhdGE6IGRhdGFcblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBFbWFpbCBzaGFyZSBVUkxcblx0ZW1haWwgKGRhdGEpIHtcblxuXHRcdHZhciB1cmwgPSBgbWFpbHRvOmA7XG5cblx0XHQvLyBpZiB0byBhZGRyZXNzIHNwZWNpZmllZCB0aGVuIGFkZCB0byBVUkxcblx0XHRpZiAoZGF0YS50byAhPT0gbnVsbCkge1xuXHRcdFx0dXJsICs9IGAke2RhdGEudG99YDtcblx0XHR9XG5cblx0XHR1cmwgKz0gYD9gO1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybDogdXJsLFxuXHRcdFx0ZGF0YToge1xuXHRcdFx0XHRzdWJqZWN0OiBkYXRhLnN1YmplY3QsXG5cdFx0XHRcdGJvZHk6IGRhdGEuYm9keVxuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gc2V0IEdpdGh1YiBmb3JrIFVSTFxuXHRnaXRodWIgKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG5cdFx0bGV0IHVybCA9IGRhdGEucmVwbyA/XG5cdFx0XHRgaHR0cHM6Ly9naXRodWIuY29tLyR7ZGF0YS5yZXBvfWAgOlxuXHRcdFx0ZGF0YS51cmw7XG5cblx0XHRpZiAoZGF0YS5pc3N1ZSkge1xuXHRcdFx0dXJsICs9ICcvaXNzdWVzL25ldz90aXRsZT0nICtcblx0XHRcdFx0ZGF0YS5pc3N1ZSArXG5cdFx0XHRcdCcmYm9keT0nICtcblx0XHRcdFx0ZGF0YS5ib2R5O1xuXHRcdH1cblxuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6IHVybCArICc/Jyxcblx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdHdpZHRoOiAxMDIwLFxuXHRcdFx0XHRoZWlnaHQ6IDMyM1xuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gc2V0IERyaWJiYmxlIHNoYXJlIFVSTFxuXHRkcmliYmJsZSAoZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHRjb25zdCB1cmwgPSBkYXRhLnNob3QgP1xuXHRcdFx0YGh0dHBzOi8vZHJpYmJibGUuY29tL3Nob3RzLyR7ZGF0YS5zaG90fT9gIDpcblx0XHRcdGRhdGEudXJsICsgJz8nO1xuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6IHVybCxcblx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdHdpZHRoOiA0NDAsXG5cdFx0XHRcdGhlaWdodDogNjQwXG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHRjb2RlcGVuIChkYXRhKSB7XG5cdFx0Y29uc3QgdXJsID0gKGRhdGEucGVuICYmIGRhdGEudXNlcm5hbWUgJiYgZGF0YS52aWV3KSA/XG5cdFx0XHRgaHR0cHM6Ly9jb2RlcGVuLmlvLyR7ZGF0YS51c2VybmFtZX0vJHtkYXRhLnZpZXd9LyR7ZGF0YS5wZW59P2AgOlxuXHRcdFx0ZGF0YS51cmwgKyAnPyc7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybDogdXJsLFxuXHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0d2lkdGg6IDEyMDAsXG5cdFx0XHRcdGhlaWdodDogODAwXG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHRwYXlwYWwgKGRhdGEpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0ZGF0YTogZGF0YVxuXHRcdH07XG5cdH1cbn07XG4iXX0=
