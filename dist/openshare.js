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
		popUp: osElement.getAttribute('data-open-share-popup'),
		key: osElement.getAttribute('data-key')
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiYW5hbHl0aWNzLmpzIiwibGliL2NvdW50UmVkdWNlLmpzIiwibGliL2Rhc2hUb0NhbWVsLmpzIiwibGliL2luaXQuanMiLCJsaWIvaW5pdGlhbGl6ZUNvdW50Tm9kZS5qcyIsImxpYi9pbml0aWFsaXplTm9kZXMuanMiLCJsaWIvaW5pdGlhbGl6ZVNoYXJlTm9kZS5qcyIsImxpYi9pbml0aWFsaXplV2F0Y2hlci5qcyIsImxpYi9zZXREYXRhLmpzIiwibGliL3NoYXJlLmpzIiwibGliL3N0b3JlQ291bnQuanMiLCJzcmMvYnJvd3Nlci5qcyIsInNyYy9tb2R1bGVzL2NvdW50LWFwaS5qcyIsInNyYy9tb2R1bGVzL2NvdW50LXRyYW5zZm9ybXMuanMiLCJzcmMvbW9kdWxlcy9jb3VudC5qcyIsInNyYy9tb2R1bGVzL2RhdGEtYXR0ci5qcyIsInNyYy9tb2R1bGVzL2V2ZW50cy5qcyIsInNyYy9tb2R1bGVzL29wZW4tc2hhcmUuanMiLCJzcmMvbW9kdWxlcy9zaGFyZS1hcGkuanMiLCJzcmMvbW9kdWxlcy9zaGFyZS10cmFuc2Zvcm1zLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxPQUFPLE9BQVAsR0FBaUIsVUFBVSxJQUFWLEVBQWdCLEVBQWhCLEVBQW9CO0FBQ3BDLEtBQU0sT0FBTyxTQUFTLE9BQVQsSUFBb0IsU0FBUyxRQUExQztBQUNBLEtBQU0sZUFBZSxTQUFTLFlBQTlCOztBQUVBLEtBQUksSUFBSixFQUFVLHVCQUF1QixJQUF2QixFQUE2QixFQUE3QjtBQUNWLEtBQUksWUFBSixFQUFrQixjQUFjLEVBQWQ7QUFDbEIsQ0FORDs7QUFRQSxTQUFTLHNCQUFULENBQWdDLElBQWhDLEVBQXNDLEVBQXRDLEVBQTBDO0FBQ3pDLEtBQUksT0FBTyxFQUFYLEVBQWU7QUFDWixNQUFJLEVBQUosRUFBUTtBQUNSO0FBQ0Es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QUFLLEdBRk47O0FBSUEsTUFBSSxLQUFLLEtBQVQsRUFBZ0I7QUFDZixVQUFPLHVCQUNOLEtBQUssS0FEQyxHQUVOLFFBRk0sR0FHTixLQUFLLElBSE47QUFJQTs7QUFFRCxTQUFPO0FBQ04sUUFBSyxNQUFNLEdBREw7QUFFTixVQUFPO0FBQ04sV0FBTyxJQUREO0FBRU4sWUFBUTtBQUZGO0FBRkQsR0FBUDtBQU9BLEVBNVllOzs7QUE4WWhCO0FBQ0EsU0EvWWdCLG9CQStZTixJQS9ZTSxFQStZYTtBQUFBLE1BQWIsR0FBYSx5REFBUCxLQUFPOztBQUM1QixNQUFNLE1BQU0sS0FBSyxJQUFMLG1DQUNtQixLQUFLLElBRHhCLFNBRVgsS0FBSyxHQUFMLEdBQVcsR0FGWjtBQUdBLFNBQU87QUFDTixRQUFLLEdBREM7QUFFTixVQUFPO0FBQ04sV0FBTyxHQUREO0FBRU4sWUFBUTtBQUZGO0FBRkQsR0FBUDtBQU9BLEVBMVplO0FBNFpoQixRQTVaZ0IsbUJBNFpQLElBNVpPLEVBNFpEO0FBQ2QsTUFBTSxNQUFPLEtBQUssR0FBTCxJQUFZLEtBQUssUUFBakIsSUFBNkIsS0FBSyxJQUFuQywyQkFDVyxLQUFLLFFBRGhCLFNBQzRCLEtBQUssSUFEakMsU0FDeUMsS0FBSyxHQUQ5QyxTQUVYLEtBQUssR0FBTCxHQUFXLEdBRlo7QUFHQSxTQUFPO0FBQ04sUUFBSyxHQURDO0FBRU4sVUFBTztBQUNOLFdBQU8sSUFERDtBQUVOLFlBQVE7QUFGRjtBQUZELEdBQVA7QUFPQSxFQXZhZTtBQXlhaEIsT0F6YWdCLGtCQXlhUixJQXphUSxFQXlhRjtBQUNiLFNBQU87QUFDTixTQUFNO0FBREEsR0FBUDtBQUdBO0FBN2FlLENBQWpCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHR5cGUsIGNiKSB7XG5cdGNvbnN0IGlzR0EgPSB0eXBlID09PSAnZXZlbnQnIHx8IHR5cGUgPT09ICdzb2NpYWwnO1xuXHRjb25zdCBpc1RhZ01hbmFnZXIgPSB0eXBlID09PSAndGFnTWFuYWdlcic7XG5cblx0aWYgKGlzR0EpIGNoZWNrSWZBbmFseXRpY3NMb2FkZWQodHlwZSwgY2IpO1xuXHRpZiAoaXNUYWdNYW5hZ2VyKSBzZXRUYWdNYW5hZ2VyKGNiKTtcbn07XG5cbmZ1bmN0aW9uIGNoZWNrSWZBbmFseXRpY3NMb2FkZWQodHlwZSwgY2IpIHtcblx0aWYgKHdpbmRvdy5nYSkge1xuXHRcdCAgaWYgKGNiKSBjYigpO1xuXHRcdCAgLy8gYmluZCB0byBzaGFyZWQgZXZlbnQgb24gZWFjaCBpbmRpdmlkdWFsIG5vZGVcblx0XHQgIGxpc3RlbihmdW5jdGlvbiAoZSkge1xuXHRcdFx0Y29uc3QgcGxhdGZvcm0gPSBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZScpO1xuXHRcdFx0Y29uc3QgdGFyZ2V0ID0gZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtbGluaycpIHx8XG5cdFx0XHRcdGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXVybCcpIHx8XG5cdFx0XHRcdGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXVzZXJuYW1lJykgfHxcblx0XHRcdCAgICBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jZW50ZXInKSB8fFxuXHRcdFx0XHRlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1zZWFyY2gnKSB8fFxuXHRcdFx0XHRlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1ib2R5Jyk7XG5cblx0XHRcdGlmICh0eXBlID09PSAnZXZlbnQnKSB7XG5cdFx0XHRcdGdhKCdzZW5kJywgJ2V2ZW50Jywge1xuXHRcdFx0XHRcdGV2ZW50Q2F0ZWdvcnk6ICdPcGVuU2hhcmUgQ2xpY2snLFxuXHRcdFx0XHRcdGV2ZW50QWN0aW9uOiBwbGF0Zm9ybSxcblx0XHRcdFx0XHRldmVudExhYmVsOiB0YXJnZXQsXG5cdFx0XHRcdFx0dHJhbnNwb3J0OiAnYmVhY29uJ1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHR5cGUgPT09ICdzb2NpYWwnKSB7XG5cdFx0XHRcdGdhKCdzZW5kJywge1xuXHRcdFx0XHRcdGhpdFR5cGU6ICdzb2NpYWwnLFxuXHRcdFx0XHRcdHNvY2lhbE5ldHdvcms6IHBsYXRmb3JtLFxuXHRcdFx0XHRcdHNvY2lhbEFjdGlvbjogJ3NoYXJlJyxcblx0XHRcdFx0XHRzb2NpYWxUYXJnZXQ6IHRhcmdldFxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHR9XG5cdGVsc2Uge1xuXHRcdHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXHRcdFx0Y2hlY2tJZkFuYWx5dGljc0xvYWRlZCh0eXBlLCBjYik7XG5cdCAgXHR9LCAxMDAwKTtcblx0fVxufVxuXG5mdW5jdGlvbiBzZXRUYWdNYW5hZ2VyIChjYikge1xuXG5cdGlmICh3aW5kb3cuZGF0YUxheWVyICYmIHdpbmRvdy5kYXRhTGF5ZXJbMF1bJ2d0bS5zdGFydCddKSB7XG5cdFx0aWYgKGNiKSBjYigpO1xuXG5cdFx0bGlzdGVuKG9uU2hhcmVUYWdNYW5nZXIpO1xuXG5cdFx0Z2V0Q291bnRzKGZ1bmN0aW9uKGUpIHtcblx0XHRcdGNvbnN0IGNvdW50ID0gZS50YXJnZXQgP1xuXHRcdFx0ICBlLnRhcmdldC5pbm5lckhUTUwgOlxuXHRcdFx0ICBlLmlubmVySFRNTDtcblxuXHRcdFx0Y29uc3QgcGxhdGZvcm0gPSBlLnRhcmdldCA/XG5cdFx0XHQgICBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudC11cmwnKSA6XG5cdFx0XHQgICBlLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50LXVybCcpO1xuXG5cdFx0XHR3aW5kb3cuZGF0YUxheWVyLnB1c2goe1xuXHRcdFx0XHQnZXZlbnQnIDogJ09wZW5TaGFyZSBDb3VudCcsXG5cdFx0XHRcdCdwbGF0Zm9ybSc6IHBsYXRmb3JtLFxuXHRcdFx0XHQncmVzb3VyY2UnOiBjb3VudCxcblx0XHRcdFx0J2FjdGl2aXR5JzogJ2NvdW50J1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH0gZWxzZSB7XG5cdFx0c2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG5cdFx0XHRzZXRUYWdNYW5hZ2VyKGNiKTtcblx0XHR9LCAxMDAwKTtcblx0fVxufVxuXG5mdW5jdGlvbiBsaXN0ZW4gKGNiKSB7XG5cdC8vIGJpbmQgdG8gc2hhcmVkIGV2ZW50IG9uIGVhY2ggaW5kaXZpZHVhbCBub2RlXG5cdFtdLmZvckVhY2guY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1vcGVuLXNoYXJlXScpLCBmdW5jdGlvbihub2RlKSB7XG5cdFx0bm9kZS5hZGRFdmVudExpc3RlbmVyKCdPcGVuU2hhcmUuc2hhcmVkJywgY2IpO1xuXHR9KTtcbn1cblxuZnVuY3Rpb24gZ2V0Q291bnRzIChjYikge1xuXHR2YXIgY291bnROb2RlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtb3Blbi1zaGFyZS1jb3VudF0nKTtcblxuXHRbXS5mb3JFYWNoLmNhbGwoY291bnROb2RlLCBmdW5jdGlvbihub2RlKSB7XG5cdFx0aWYgKG5vZGUudGV4dENvbnRlbnQpIGNiKG5vZGUpO1xuXHRcdGVsc2Ugbm9kZS5hZGRFdmVudExpc3RlbmVyKCdPcGVuU2hhcmUuY291bnRlZC0nICsgbm9kZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudC11cmwnKSwgY2IpO1xuXHR9KTtcbn1cblxuZnVuY3Rpb24gb25TaGFyZVRhZ01hbmdlciAoZSkge1xuXHRjb25zdCBwbGF0Zm9ybSA9IGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlJyk7XG5cdGNvbnN0IHRhcmdldCA9IGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWxpbmsnKSB8fFxuXHRcdGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXVybCcpIHx8XG5cdFx0ZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdXNlcm5hbWUnKSB8fFxuXHRcdGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNlbnRlcicpIHx8XG5cdFx0ZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtc2VhcmNoJykgfHxcblx0XHRlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1ib2R5Jyk7XG5cblx0d2luZG93LmRhdGFMYXllci5wdXNoKHtcblx0XHQnZXZlbnQnIDogJ09wZW5TaGFyZSBTaGFyZScsXG5cdFx0J3BsYXRmb3JtJzogcGxhdGZvcm0sXG5cdFx0J3Jlc291cmNlJzogdGFyZ2V0LFxuXHRcdCdhY3Rpdml0eSc6ICdzaGFyZSdcblx0fSk7XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGNvdW50UmVkdWNlO1xuXG5mdW5jdGlvbiByb3VuZCh4LCBwcmVjaXNpb24pIHtcblx0aWYgKHR5cGVvZiB4ICE9PSAnbnVtYmVyJykge1xuXHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIHZhbHVlIHRvIGJlIGEgbnVtYmVyJyk7XG5cdH1cblxuXHR2YXIgZXhwb25lbnQgPSBwcmVjaXNpb24gPiAwID8gJ2UnIDogJ2UtJztcblx0dmFyIGV4cG9uZW50TmVnID0gcHJlY2lzaW9uID4gMCA/ICdlLScgOiAnZSc7XG5cdHByZWNpc2lvbiA9IE1hdGguYWJzKHByZWNpc2lvbik7XG5cblx0cmV0dXJuIE51bWJlcihNYXRoLnJvdW5kKHggKyBleHBvbmVudCArIHByZWNpc2lvbikgKyBleHBvbmVudE5lZyArIHByZWNpc2lvbik7XG59XG5cbmZ1bmN0aW9uIHRob3VzYW5kaWZ5IChudW0pIHtcblx0cmV0dXJuIHJvdW5kKG51bS8xMDAwLCAxKSArICdLJztcbn1cblxuZnVuY3Rpb24gbWlsbGlvbmlmeSAobnVtKSB7XG5cdHJldHVybiByb3VuZChudW0vMTAwMDAwMCwgMSkgKyAnTSc7XG59XG5cbmZ1bmN0aW9uIGNvdW50UmVkdWNlIChlbCwgY291bnQsIGNiKSB7XG5cdGlmIChjb3VudCA+IDk5OTk5OSkgIHtcblx0XHRlbC5pbm5lckhUTUwgPSBtaWxsaW9uaWZ5KGNvdW50KTtcblx0XHRpZiAoY2IgICYmIHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykgY2IoZWwpO1xuXHR9IGVsc2UgaWYgKGNvdW50ID4gOTk5KSB7XG5cdFx0ZWwuaW5uZXJIVE1MID0gdGhvdXNhbmRpZnkoY291bnQpO1xuXHRcdGlmIChjYiAgJiYgdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSBjYihlbCk7XG5cdH0gZWxzZSB7XG5cdFx0ZWwuaW5uZXJIVE1MID0gY291bnQ7XG5cdFx0aWYgKGNiICAmJiB0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpIGNiKGVsKTtcblx0fVxufVxuIiwiLy8gdHlwZSBjb250YWlucyBhIGRhc2hcbi8vIHRyYW5zZm9ybSB0byBjYW1lbGNhc2UgZm9yIGZ1bmN0aW9uIHJlZmVyZW5jZVxuLy8gVE9ETzogb25seSBzdXBwb3J0cyBzaW5nbGUgZGFzaCwgc2hvdWxkIHNob3VsZCBzdXBwb3J0IG11bHRpcGxlXG5tb2R1bGUuZXhwb3J0cyA9IChkYXNoLCB0eXBlKSA9PiB7XG5cdGxldCBuZXh0Q2hhciA9IHR5cGUuc3Vic3RyKGRhc2ggKyAxLCAxKSxcblx0XHRncm91cCA9IHR5cGUuc3Vic3RyKGRhc2gsIDIpO1xuXG5cdHR5cGUgPSB0eXBlLnJlcGxhY2UoZ3JvdXAsIG5leHRDaGFyLnRvVXBwZXJDYXNlKCkpO1xuXHRyZXR1cm4gdHlwZTtcbn07XG4iLCJjb25zdCBpbml0aWFsaXplTm9kZXMgPSByZXF1aXJlKCcuL2luaXRpYWxpemVOb2RlcycpO1xuY29uc3QgaW5pdGlhbGl6ZVdhdGNoZXIgPSByZXF1aXJlKCcuL2luaXRpYWxpemVXYXRjaGVyJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gaW5pdDtcblxuZnVuY3Rpb24gaW5pdChvcHRzKSB7XG5cdHJldHVybiAoKSA9PiB7XG5cdFx0Y29uc3QgaW5pdE5vZGVzID0gaW5pdGlhbGl6ZU5vZGVzKHtcblx0XHRcdGFwaTogb3B0cy5hcGkgfHwgbnVsbCxcblx0XHRcdGNvbnRhaW5lcjogb3B0cy5jb250YWluZXIgfHwgZG9jdW1lbnQsXG5cdFx0XHRzZWxlY3Rvcjogb3B0cy5zZWxlY3Rvcixcblx0XHRcdGNiOiBvcHRzLmNiXG5cdFx0fSk7XG5cblx0XHRpbml0Tm9kZXMoKTtcblxuXHRcdC8vIGNoZWNrIGZvciBtdXRhdGlvbiBvYnNlcnZlcnMgYmVmb3JlIHVzaW5nLCBJRTExIG9ubHlcblx0XHRpZiAod2luZG93Lk11dGF0aW9uT2JzZXJ2ZXIgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0aW5pdGlhbGl6ZVdhdGNoZXIoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtb3Blbi1zaGFyZS13YXRjaF0nKSwgaW5pdE5vZGVzKTtcblx0XHR9XG5cdH07XG59XG4iLCJjb25zdCBDb3VudCA9IHJlcXVpcmUoJy4uL3NyYy9tb2R1bGVzL2NvdW50Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gaW5pdGlhbGl6ZUNvdW50Tm9kZTtcblxuZnVuY3Rpb24gaW5pdGlhbGl6ZUNvdW50Tm9kZShvcykge1xuXHQvLyBpbml0aWFsaXplIG9wZW4gc2hhcmUgb2JqZWN0IHdpdGggdHlwZSBhdHRyaWJ1dGVcblx0bGV0IHR5cGUgPSBvcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudCcpLFxuXHRcdHVybCA9IG9zLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50LXJlcG8nKSB8fFxuXHRcdFx0b3MuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY291bnQtc2hvdCcpIHx8XG5cdFx0XHRvcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudC11cmwnKSxcblx0XHRjb3VudCA9IG5ldyBDb3VudCh0eXBlLCB1cmwpO1xuXG5cdGNvdW50LmNvdW50KG9zKTtcblx0b3Muc2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtbm9kZScsIHR5cGUpO1xufVxuIiwiY29uc3QgRXZlbnRzID0gcmVxdWlyZSgnLi4vc3JjL21vZHVsZXMvZXZlbnRzJyk7XG5jb25zdCBhbmFseXRpY3MgPSByZXF1aXJlKCcuLi9hbmFseXRpY3MnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGluaXRpYWxpemVOb2RlcztcblxuZnVuY3Rpb24gaW5pdGlhbGl6ZU5vZGVzKG9wdHMpIHtcblx0Ly8gbG9vcCB0aHJvdWdoIG9wZW4gc2hhcmUgbm9kZSBjb2xsZWN0aW9uXG5cdHJldHVybiAoKSA9PiB7XG5cdFx0Ly8gY2hlY2sgZm9yIGFuYWx5dGljc1xuXHRcdGNoZWNrQW5hbHl0aWNzKCk7XG5cblx0XHRpZiAob3B0cy5hcGkpIHtcblx0XHRcdGxldCBub2RlcyA9IG9wdHMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwob3B0cy5zZWxlY3Rvcik7XG5cdFx0XHRbXS5mb3JFYWNoLmNhbGwobm9kZXMsIG9wdHMuY2IpO1xuXG5cdFx0XHQvLyB0cmlnZ2VyIGNvbXBsZXRlZCBldmVudFxuXHRcdFx0RXZlbnRzLnRyaWdnZXIoZG9jdW1lbnQsIG9wdHMuYXBpICsgJy1sb2FkZWQnKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gbG9vcCB0aHJvdWdoIG9wZW4gc2hhcmUgbm9kZSBjb2xsZWN0aW9uXG5cdFx0XHRsZXQgc2hhcmVOb2RlcyA9IG9wdHMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwob3B0cy5zZWxlY3Rvci5zaGFyZSk7XG5cdFx0XHRbXS5mb3JFYWNoLmNhbGwoc2hhcmVOb2Rlcywgb3B0cy5jYi5zaGFyZSk7XG5cblx0XHRcdC8vIHRyaWdnZXIgY29tcGxldGVkIGV2ZW50XG5cdFx0XHRFdmVudHMudHJpZ2dlcihkb2N1bWVudCwgJ3NoYXJlLWxvYWRlZCcpO1xuXG5cdFx0XHQvLyBsb29wIHRocm91Z2ggY291bnQgbm9kZSBjb2xsZWN0aW9uXG5cdFx0XHRsZXQgY291bnROb2RlcyA9IG9wdHMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwob3B0cy5zZWxlY3Rvci5jb3VudCk7XG5cdFx0XHRbXS5mb3JFYWNoLmNhbGwoY291bnROb2Rlcywgb3B0cy5jYi5jb3VudCk7XG5cblx0XHRcdC8vIHRyaWdnZXIgY29tcGxldGVkIGV2ZW50XG5cdFx0XHRFdmVudHMudHJpZ2dlcihkb2N1bWVudCwgJ2NvdW50LWxvYWRlZCcpO1xuXHRcdH1cblx0fTtcbn1cblxuZnVuY3Rpb24gY2hlY2tBbmFseXRpY3MgKCkge1xuXHQvLyBjaGVjayBmb3IgYW5hbHl0aWNzXG5cdGlmIChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbZGF0YS1vcGVuLXNoYXJlLWFuYWx5dGljc10nKSkge1xuXHRcdGNvbnN0IHByb3ZpZGVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignW2RhdGEtb3Blbi1zaGFyZS1hbmFseXRpY3NdJylcblx0XHRcdC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1hbmFseXRpY3MnKTtcblxuXHRcdGlmIChwcm92aWRlci5pbmRleE9mKCcsJykgPiAtMSkge1xuXHRcdFx0Y29uc3QgcHJvdmlkZXJzID0gcHJvdmlkZXIuc3BsaXQoJywnKTtcblx0XHRcdHByb3ZpZGVycy5mb3JFYWNoKHAgPT4gYW5hbHl0aWNzKHApKTtcblx0XHR9IGVsc2UgYW5hbHl0aWNzKHByb3ZpZGVyKTtcblxuXHR9XG59XG4iLCJjb25zdCBTaGFyZVRyYW5zZm9ybXMgPSByZXF1aXJlKCcuLi9zcmMvbW9kdWxlcy9zaGFyZS10cmFuc2Zvcm1zJyk7XG5jb25zdCBPcGVuU2hhcmUgPSByZXF1aXJlKCcuLi9zcmMvbW9kdWxlcy9vcGVuLXNoYXJlJyk7XG5jb25zdCBzZXREYXRhID0gcmVxdWlyZSgnLi9zZXREYXRhJyk7XG5jb25zdCBzaGFyZSA9IHJlcXVpcmUoJy4vc2hhcmUnKTtcbmNvbnN0IGRhc2hUb0NhbWVsID0gcmVxdWlyZSgnLi9kYXNoVG9DYW1lbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGluaXRpYWxpemVTaGFyZU5vZGU7XG5cbmZ1bmN0aW9uIGluaXRpYWxpemVTaGFyZU5vZGUob3MpIHtcblx0Ly8gaW5pdGlhbGl6ZSBvcGVuIHNoYXJlIG9iamVjdCB3aXRoIHR5cGUgYXR0cmlidXRlXG5cdGxldCB0eXBlID0gb3MuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUnKSxcblx0XHRkYXNoID0gdHlwZS5pbmRleE9mKCctJyksXG5cdFx0b3BlblNoYXJlO1xuXG5cdGlmIChkYXNoID4gLTEpIHtcblx0XHR0eXBlID0gZGFzaFRvQ2FtZWwoZGFzaCwgdHlwZSk7XG5cdH1cblxuXHRsZXQgdHJhbnNmb3JtID0gU2hhcmVUcmFuc2Zvcm1zW3R5cGVdO1xuXG5cdGlmICghdHJhbnNmb3JtKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKGBPcGVuIFNoYXJlOiAke3R5cGV9IGlzIGFuIGludmFsaWQgdHlwZWApO1xuXHR9XG5cblx0b3BlblNoYXJlID0gbmV3IE9wZW5TaGFyZSh0eXBlLCB0cmFuc2Zvcm0pO1xuXG5cdC8vIHNwZWNpZnkgaWYgdGhpcyBpcyBhIGR5bmFtaWMgaW5zdGFuY2Vcblx0aWYgKG9zLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWR5bmFtaWMnKSkge1xuXHRcdG9wZW5TaGFyZS5keW5hbWljID0gdHJ1ZTtcblx0fVxuXG5cdC8vIHNwZWNpZnkgaWYgdGhpcyBpcyBhIHBvcHVwIGluc3RhbmNlXG5cdGlmIChvcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1wb3B1cCcpKSB7XG5cdFx0b3BlblNoYXJlLnBvcHVwID0gdHJ1ZTtcblx0fVxuXG5cdC8vIHNldCBhbGwgb3B0aW9uYWwgYXR0cmlidXRlcyBvbiBvcGVuIHNoYXJlIGluc3RhbmNlXG5cdHNldERhdGEob3BlblNoYXJlLCBvcyk7XG5cblx0Ly8gb3BlbiBzaGFyZSBkaWFsb2cgb24gY2xpY2tcblx0b3MuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuXHRcdHNoYXJlKGUsIG9zLCBvcGVuU2hhcmUpO1xuXHR9KTtcblxuXHRvcy5hZGRFdmVudExpc3RlbmVyKCdPcGVuU2hhcmUudHJpZ2dlcicsIChlKSA9PiB7XG5cdFx0c2hhcmUoZSwgb3MsIG9wZW5TaGFyZSk7XG5cdH0pO1xuXG5cdG9zLnNldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLW5vZGUnLCB0eXBlKTtcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gaW5pdGlhbGl6ZVdhdGNoZXI7XG5cbmZ1bmN0aW9uIGluaXRpYWxpemVXYXRjaGVyKHdhdGNoZXIsIGZuKSB7XG5cdFtdLmZvckVhY2guY2FsbCh3YXRjaGVyLCAodykgPT4ge1xuXHRcdHZhciBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKChtdXRhdGlvbnMpID0+IHtcblx0XHRcdC8vIHRhcmdldCB3aWxsIG1hdGNoIGJldHdlZW4gYWxsIG11dGF0aW9ucyBzbyBqdXN0IHVzZSBmaXJzdFxuXHRcdFx0Zm4obXV0YXRpb25zWzBdLnRhcmdldCk7XG5cdFx0fSk7XG5cblx0XHRvYnNlcnZlci5vYnNlcnZlKHcsIHtcblx0XHRcdGNoaWxkTGlzdDogdHJ1ZVxuXHRcdH0pO1xuXHR9KTtcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gc2V0RGF0YTtcblxuZnVuY3Rpb24gc2V0RGF0YShvc0luc3RhbmNlLCBvc0VsZW1lbnQpIHtcblx0b3NJbnN0YW5jZS5zZXREYXRhKHtcblx0XHR1cmw6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS11cmwnKSxcblx0XHR0ZXh0OiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdGV4dCcpLFxuXHRcdHZpYTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXZpYScpLFxuXHRcdGhhc2h0YWdzOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtaGFzaHRhZ3MnKSxcblx0XHR0d2VldElkOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdHdlZXQtaWQnKSxcblx0XHRyZWxhdGVkOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtcmVsYXRlZCcpLFxuXHRcdHNjcmVlbk5hbWU6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1zY3JlZW4tbmFtZScpLFxuXHRcdHVzZXJJZDogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXVzZXItaWQnKSxcblx0XHRsaW5rOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtbGluaycpLFxuXHRcdHBpY3R1cmU6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1waWN0dXJlJyksXG5cdFx0Y2FwdGlvbjogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNhcHRpb24nKSxcblx0XHRkZXNjcmlwdGlvbjogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWRlc2NyaXB0aW9uJyksXG5cdFx0dXNlcjogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXVzZXInKSxcblx0XHR2aWRlbzogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXZpZGVvJyksXG5cdFx0dXNlcm5hbWU6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS11c2VybmFtZScpLFxuXHRcdHRpdGxlOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdGl0bGUnKSxcblx0XHRtZWRpYTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLW1lZGlhJyksXG5cdFx0dG86IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS10bycpLFxuXHRcdHN1YmplY3Q6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1zdWJqZWN0JyksXG5cdFx0Ym9keTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWJvZHknKSxcblx0XHRpb3M6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1pb3MnKSxcblx0XHR0eXBlOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdHlwZScpLFxuXHRcdGNlbnRlcjogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNlbnRlcicpLFxuXHRcdHZpZXdzOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdmlld3MnKSxcblx0XHR6b29tOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtem9vbScpLFxuXHRcdHNlYXJjaDogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXNlYXJjaCcpLFxuXHRcdHNhZGRyOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtc2FkZHInKSxcblx0XHRkYWRkcjogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWRhZGRyJyksXG5cdFx0ZGlyZWN0aW9uc21vZGU6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1kaXJlY3Rpb25zLW1vZGUnKSxcblx0XHRyZXBvOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtcmVwbycpLFxuXHRcdHNob3Q6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1zaG90JyksXG5cdFx0cGVuOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtcGVuJyksXG5cdFx0dmlldzogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXZpZXcnKSxcblx0XHRpc3N1ZTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWlzc3VlJyksXG5cdFx0YnV0dG9uSWQ6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1idXR0b25JZCcpLFxuXHRcdHBvcFVwOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtcG9wdXAnKSxcblx0XHRrZXk6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEta2V5Jylcblx0fSk7XG59XG4iLCJjb25zdCBFdmVudHMgPSByZXF1aXJlKCcuLi9zcmMvbW9kdWxlcy9ldmVudHMnKTtcbmNvbnN0IHNldERhdGEgPSByZXF1aXJlKCcuL3NldERhdGEnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBzaGFyZTtcblxuZnVuY3Rpb24gc2hhcmUoZSwgb3MsIG9wZW5TaGFyZSkge1xuXHQvLyBpZiBkeW5hbWljIGluc3RhbmNlIHRoZW4gZmV0Y2ggYXR0cmlidXRlcyBhZ2FpbiBpbiBjYXNlIG9mIHVwZGF0ZXNcblx0aWYgKG9wZW5TaGFyZS5keW5hbWljKSB7XG5cdFx0c2V0RGF0YShvcGVuU2hhcmUsIG9zKTtcblx0fVxuXG5cdG9wZW5TaGFyZS5zaGFyZShlKTtcblxuXHQvLyB0cmlnZ2VyIHNoYXJlZCBldmVudFxuXHRFdmVudHMudHJpZ2dlcihvcywgJ3NoYXJlZCcpO1xufVxuIiwiLypcbiAgIFNvbWV0aW1lcyBzb2NpYWwgcGxhdGZvcm1zIGdldCBjb25mdXNlZCBhbmQgZHJvcCBzaGFyZSBjb3VudHMuXG4gICBJbiB0aGlzIG1vZHVsZSB3ZSBjaGVjayBpZiB0aGUgcmV0dXJuZWQgY291bnQgaXMgbGVzcyB0aGFuIHRoZSBjb3VudCBpblxuICAgbG9jYWxzdG9yYWdlLlxuICAgSWYgdGhlIGxvY2FsIGNvdW50IGlzIGdyZWF0ZXIgdGhhbiB0aGUgcmV0dXJuZWQgY291bnQsXG4gICB3ZSBzdG9yZSB0aGUgbG9jYWwgY291bnQgKyB0aGUgcmV0dXJuZWQgY291bnQuXG4gICBPdGhlcndpc2UsIHN0b3JlIHRoZSByZXR1cm5lZCBjb3VudC5cbiovXG5cbm1vZHVsZS5leHBvcnRzID0gKHQsIGNvdW50KSA9PiB7XG5cdGNvbnN0IGlzQXJyID0gdC50eXBlLmluZGV4T2YoJywnKSA+IC0xO1xuXHRjb25zdCBsb2NhbCA9IE51bWJlcih0LnN0b3JlR2V0KHQudHlwZSArICctJyArIHQuc2hhcmVkKSk7XG5cblx0aWYgKGxvY2FsID4gY291bnQgJiYgIWlzQXJyKSB7XG5cdFx0Y29uc3QgbGF0ZXN0Q291bnQgPSBOdW1iZXIodC5zdG9yZUdldCh0LnR5cGUgKyAnLScgKyB0LnNoYXJlZCArICctbGF0ZXN0Q291bnQnKSk7XG5cdFx0dC5zdG9yZVNldCh0LnR5cGUgKyAnLScgKyB0LnNoYXJlZCArICctbGF0ZXN0Q291bnQnLCBjb3VudCk7XG5cblx0XHRjb3VudCA9IGlzTnVtZXJpYyhsYXRlc3RDb3VudCkgJiYgbGF0ZXN0Q291bnQgPiAwID9cblx0XHRcdGNvdW50ICs9IGxvY2FsIC0gbGF0ZXN0Q291bnQgOlxuXHRcdFx0Y291bnQgKz0gbG9jYWw7XG5cblx0fVxuXG5cdGlmICghaXNBcnIpIHQuc3RvcmVTZXQodC50eXBlICsgJy0nICsgdC5zaGFyZWQsIGNvdW50KTtcblx0cmV0dXJuIGNvdW50O1xufTtcblxuZnVuY3Rpb24gaXNOdW1lcmljKG4pIHtcbiAgcmV0dXJuICFpc05hTihwYXJzZUZsb2F0KG4pKSAmJiBpc0Zpbml0ZShuKTtcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkge1xuXG5cdHZhciBEYXRhQXR0ciA9IHJlcXVpcmUoJy4vbW9kdWxlcy9kYXRhLWF0dHInKSxcblx0XHRTaGFyZUFQSSA9IHJlcXVpcmUoJy4vbW9kdWxlcy9zaGFyZS1hcGknKSxcblx0XHRFdmVudHMgPSByZXF1aXJlKCcuL21vZHVsZXMvZXZlbnRzJyksXG5cdFx0T3BlblNoYXJlID0gcmVxdWlyZSgnLi9tb2R1bGVzL29wZW4tc2hhcmUnKSxcblx0XHRTaGFyZVRyYW5zZm9ybXMgPSByZXF1aXJlKCcuL21vZHVsZXMvc2hhcmUtdHJhbnNmb3JtcycpLFxuXHRcdENvdW50ID0gcmVxdWlyZSgnLi9tb2R1bGVzL2NvdW50JyksXG5cdFx0Q291bnRBUEkgPSByZXF1aXJlKCcuL21vZHVsZXMvY291bnQtYXBpJyksXG5cdFx0YW5hbHl0aWNzQVBJID0gcmVxdWlyZSgnLi4vYW5hbHl0aWNzJyk7XG5cblx0RGF0YUF0dHIoT3BlblNoYXJlLCBDb3VudCwgU2hhcmVUcmFuc2Zvcm1zLCBFdmVudHMpO1xuXHR3aW5kb3cuT3BlblNoYXJlID0ge1xuXHRcdHNoYXJlOiBTaGFyZUFQSShPcGVuU2hhcmUsIFNoYXJlVHJhbnNmb3JtcywgRXZlbnRzKSxcblx0XHRjb3VudDogQ291bnRBUEkoKSxcblx0XHRhbmFseXRpY3M6IGFuYWx5dGljc0FQSVxuXHR9O1xufSkoKTtcbiIsIi8qKlxuICogY291bnQgQVBJXG4gKi9cblxudmFyIGNvdW50ID0gcmVxdWlyZSgnLi9jb3VudCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuXG5cdC8vIGdsb2JhbCBPcGVuU2hhcmUgcmVmZXJlbmNpbmcgaW50ZXJuYWwgY2xhc3MgZm9yIGluc3RhbmNlIGdlbmVyYXRpb25cblx0Y2xhc3MgQ291bnQge1xuXG5cdFx0Y29uc3RydWN0b3Ioe1xuXHRcdFx0dHlwZSxcblx0XHRcdHVybCxcblx0XHRcdGFwcGVuZFRvID0gZmFsc2UsXG5cdFx0XHRlbGVtZW50LFxuXHRcdFx0Y2xhc3Nlcyxcblx0XHRcdGtleSA9IG51bGxcblx0XHR9LCBjYikge1xuXHRcdFx0dmFyIGNvdW50Tm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoZWxlbWVudCB8fCAnc3BhbicpO1xuXG5cdFx0XHRjb3VudE5vZGUuc2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY291bnQnLCB0eXBlKTtcblx0XHRcdGNvdW50Tm9kZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudC11cmwnLCB1cmwpO1xuXHRcdFx0aWYgKGtleSkgY291bnROb2RlLnNldEF0dHJpYnV0ZSgnZGF0YS1rZXknLCBrZXkpO1xuXHRcdFx0XG5cdFx0XHRjb3VudE5vZGUuY2xhc3NMaXN0LmFkZCgnb3Blbi1zaGFyZS1jb3VudCcpO1xuXG5cdFx0XHRpZiAoY2xhc3NlcyAmJiBBcnJheS5pc0FycmF5KGNsYXNzZXMpKSB7XG5cdFx0XHRcdGNsYXNzZXMuZm9yRWFjaChjc3NDTGFzcyA9PiB7XG5cdFx0XHRcdFx0Y291bnROb2RlLmNsYXNzTGlzdC5hZGQoY3NzQ0xhc3MpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGFwcGVuZFRvKSB7XG5cdFx0XHRcdHJldHVybiBuZXcgY291bnQodHlwZSwgdXJsKS5jb3VudChjb3VudE5vZGUsIGNiLCBhcHBlbmRUbyk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBuZXcgY291bnQodHlwZSwgdXJsKS5jb3VudChjb3VudE5vZGUsIGNiKTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gQ291bnQ7XG59O1xuIiwiY29uc3QgY291bnRSZWR1Y2UgPSByZXF1aXJlKCcuLi8uLi9saWIvY291bnRSZWR1Y2UnKTtcbmNvbnN0IHN0b3JlQ291bnQgPSByZXF1aXJlKCcuLi8uLi9saWIvc3RvcmVDb3VudCcpO1xuXG4vKipcbiAqIE9iamVjdCBvZiB0cmFuc2Zvcm0gZnVuY3Rpb25zIGZvciBlYWNoIG9wZW5zaGFyZSBhcGlcbiAqIFRyYW5zZm9ybSBmdW5jdGlvbnMgcGFzc2VkIGludG8gT3BlblNoYXJlIGluc3RhbmNlIHdoZW4gaW5zdGFudGlhdGVkXG4gKiBSZXR1cm4gb2JqZWN0IGNvbnRhaW5pbmcgVVJMIGFuZCBrZXkvdmFsdWUgYXJnc1xuICovXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuXHQvLyBmYWNlYm9vayBjb3VudCBkYXRhXG5cdGZhY2Vib29rICh1cmwpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogJ2dldCcsXG5cdFx0XHR1cmw6IGBodHRwczovL2dyYXBoLmZhY2Vib29rLmNvbS8/aWQ9JHt1cmx9YCxcblx0XHRcdHRyYW5zZm9ybTogZnVuY3Rpb24oeGhyKSB7XG5cdFx0XHRcdGxldCBjb3VudCA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCkuc2hhcmVzO1xuXHRcdFx0XHRyZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBjb3VudCk7XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBwaW50ZXJlc3QgY291bnQgZGF0YVxuXHRwaW50ZXJlc3QgKHVybCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiAnanNvbnAnLFxuXHRcdFx0dXJsOiBgaHR0cHM6Ly9hcGkucGludGVyZXN0LmNvbS92MS91cmxzL2NvdW50Lmpzb24/Y2FsbGJhY2s9PyZ1cmw9JHt1cmx9YCxcblx0XHRcdHRyYW5zZm9ybTogZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0XHRsZXQgY291bnQgPSBkYXRhLmNvdW50O1xuXHRcdFx0XHRyZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBjb3VudCk7XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBsaW5rZWRpbiBjb3VudCBkYXRhXG5cdGxpbmtlZGluICh1cmwpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogJ2pzb25wJyxcblx0XHRcdHVybDogYGh0dHBzOi8vd3d3LmxpbmtlZGluLmNvbS9jb3VudHNlcnYvY291bnQvc2hhcmU/dXJsPSR7dXJsfSZmb3JtYXQ9anNvbnAmY2FsbGJhY2s9P2AsXG5cdFx0XHR0cmFuc2Zvcm06IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdFx0bGV0IGNvdW50ID0gZGF0YS5jb3VudDtcblx0XHRcdFx0cmV0dXJuIHN0b3JlQ291bnQodGhpcywgY291bnQpO1xuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gcmVkZGl0IGNvdW50IGRhdGFcblx0cmVkZGl0ICh1cmwpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogJ2dldCcsXG5cdFx0XHR1cmw6IGBodHRwczovL3d3dy5yZWRkaXQuY29tL2FwaS9pbmZvLmpzb24/dXJsPSR7dXJsfWAsXG5cdFx0XHR0cmFuc2Zvcm06IGZ1bmN0aW9uKHhocikge1xuXHRcdFx0XHRsZXQgcG9zdHMgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpLmRhdGEuY2hpbGRyZW4sXG5cdFx0XHRcdFx0dXBzID0gMDtcblxuXHRcdFx0XHRwb3N0cy5mb3JFYWNoKChwb3N0KSA9PiB7XG5cdFx0XHRcdFx0dXBzICs9IE51bWJlcihwb3N0LmRhdGEudXBzKTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0cmV0dXJuIHN0b3JlQ291bnQodGhpcywgdXBzKTtcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIGdvb2dsZSBjb3VudCBkYXRhXG5cdGdvb2dsZSAodXJsKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHR5cGU6ICdwb3N0Jyxcblx0XHRcdGRhdGE6IHtcblx0XHRcdFx0bWV0aG9kOiAncG9zLnBsdXNvbmVzLmdldCcsXG5cdFx0XHRcdGlkOiAncCcsXG5cdFx0XHRcdHBhcmFtczoge1xuXHRcdFx0XHRcdG5vbG9nOiB0cnVlLFxuXHRcdFx0XHRcdGlkOiB1cmwsXG5cdFx0XHRcdFx0c291cmNlOiAnd2lkZ2V0Jyxcblx0XHRcdFx0XHR1c2VySWQ6ICdAdmlld2VyJyxcblx0XHRcdFx0XHRncm91cElkOiAnQHNlbGYnXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGpzb25ycGM6ICcyLjAnLFxuXHRcdFx0XHRrZXk6ICdwJyxcblx0XHRcdFx0YXBpVmVyc2lvbjogJ3YxJ1xuXHRcdFx0fSxcblx0XHRcdHVybDogYGh0dHBzOi8vY2xpZW50czYuZ29vZ2xlLmNvbS9ycGNgLFxuXHRcdFx0dHJhbnNmb3JtOiBmdW5jdGlvbih4aHIpIHtcblx0XHRcdFx0bGV0IGNvdW50ID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KS5yZXN1bHQubWV0YWRhdGEuZ2xvYmFsQ291bnRzLmNvdW50O1xuXHRcdFx0XHRyZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBjb3VudCk7XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBnaXRodWIgc3RhciBjb3VudFxuXHRnaXRodWJTdGFycyAocmVwbykge1xuXHRcdHJlcG8gPSByZXBvLmluZGV4T2YoJ2dpdGh1Yi5jb20vJykgPiAtMSA/XG5cdFx0XHRyZXBvLnNwbGl0KCdnaXRodWIuY29tLycpWzFdIDpcblx0XHRcdHJlcG87XG5cdFx0cmV0dXJuIHtcblx0XHRcdHR5cGU6ICdnZXQnLFxuXHRcdFx0dXJsOiBgaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9yZXBvcy8ke3JlcG99YCxcblx0XHRcdHRyYW5zZm9ybTogZnVuY3Rpb24oeGhyKSB7XG5cdFx0XHRcdGxldCBjb3VudCA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCkuc3RhcmdhemVyc19jb3VudDtcblx0XHRcdFx0cmV0dXJuIHN0b3JlQ291bnQodGhpcywgY291bnQpO1xuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gZ2l0aHViIGZvcmtzIGNvdW50XG5cdGdpdGh1YkZvcmtzIChyZXBvKSB7XG5cdFx0cmVwbyA9IHJlcG8uaW5kZXhPZignZ2l0aHViLmNvbS8nKSA+IC0xID9cblx0XHRcdHJlcG8uc3BsaXQoJ2dpdGh1Yi5jb20vJylbMV0gOlxuXHRcdFx0cmVwbztcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogJ2dldCcsXG5cdFx0XHR1cmw6IGBodHRwczovL2FwaS5naXRodWIuY29tL3JlcG9zLyR7cmVwb31gLFxuXHRcdFx0dHJhbnNmb3JtOiBmdW5jdGlvbih4aHIpIHtcblx0XHRcdFx0bGV0IGNvdW50ID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KS5mb3Jrc19jb3VudDtcblx0XHRcdFx0cmV0dXJuIHN0b3JlQ291bnQodGhpcywgY291bnQpO1xuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gZ2l0aHViIHdhdGNoZXJzIGNvdW50XG5cdGdpdGh1YldhdGNoZXJzIChyZXBvKSB7XG5cdFx0cmVwbyA9IHJlcG8uaW5kZXhPZignZ2l0aHViLmNvbS8nKSA+IC0xID9cblx0XHRcdHJlcG8uc3BsaXQoJ2dpdGh1Yi5jb20vJylbMV0gOlxuXHRcdFx0cmVwbztcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogJ2dldCcsXG5cdFx0XHR1cmw6IGBodHRwczovL2FwaS5naXRodWIuY29tL3JlcG9zLyR7cmVwb31gLFxuXHRcdFx0dHJhbnNmb3JtOiBmdW5jdGlvbih4aHIpIHtcblx0XHRcdFx0bGV0IGNvdW50ID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KS53YXRjaGVyc19jb3VudDtcblx0XHRcdFx0cmV0dXJuIHN0b3JlQ291bnQodGhpcywgY291bnQpO1xuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gZHJpYmJibGUgbGlrZXMgY291bnRcblx0ZHJpYmJibGUgKHNob3QpIHtcblx0XHRzaG90ID0gc2hvdC5pbmRleE9mKCdkcmliYmJsZS5jb20vc2hvdHMnKSA+IC0xID9cblx0XHRcdHNob3Quc3BsaXQoJ3Nob3RzLycpWzFdIDpcblx0XHRcdHNob3Q7XG5cdFx0Y29uc3QgdXJsID0gYGh0dHBzOi8vYXBpLmRyaWJiYmxlLmNvbS92MS9zaG90cy8ke3Nob3R9L2xpa2VzYDtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogJ2dldCcsXG5cdFx0XHR1cmw6IHVybCxcblx0XHRcdHRyYW5zZm9ybTogZnVuY3Rpb24oeGhyLCBFdmVudHMpIHtcblx0XHRcdFx0bGV0IGNvdW50ID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KS5sZW5ndGg7XG5cblx0XHRcdFx0Ly8gYXQgdGhpcyB0aW1lIGRyaWJiYmxlIGxpbWl0cyBhIHJlc3BvbnNlIG9mIDEyIGxpa2VzIHBlciBwYWdlXG5cdFx0XHRcdGlmIChjb3VudCA9PT0gMTIpIHtcblx0XHRcdFx0XHRsZXQgcGFnZSA9IDI7XG5cdFx0XHRcdFx0cmVjdXJzaXZlQ291bnQodXJsLCBwYWdlLCBjb3VudCwgZmluYWxDb3VudCA9PiB7XG5cdFx0XHRcdFx0XHRpZiAodGhpcy5hcHBlbmRUbyAmJiB0eXBlb2YgdGhpcy5hcHBlbmRUbyAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdFx0XHR0aGlzLmFwcGVuZFRvLmFwcGVuZENoaWxkKHRoaXMub3MpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0Y291bnRSZWR1Y2UodGhpcy5vcywgZmluYWxDb3VudCwgdGhpcy5jYik7XG5cdFx0XHRcdFx0XHRFdmVudHMudHJpZ2dlcih0aGlzLm9zLCAnY291bnRlZC0nICsgdGhpcy51cmwpO1xuXHRcdFx0XHRcdFx0cmV0dXJuIHN0b3JlQ291bnQodGhpcywgZmluYWxDb3VudCk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmV0dXJuIHN0b3JlQ291bnQodGhpcywgY291bnQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHR0d2l0dGVyICh1cmwpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogJ2dldCcsXG5cdFx0XHR1cmw6IGBodHRwczovL2FwaS5vcGVuc2hhcmUuc29jaWFsL2pvYj91cmw9JHt1cmx9JmtleT1gLFxuXHRcdFx0dHJhbnNmb3JtOiBmdW5jdGlvbih4aHIpIHtcblx0XHRcdFx0bGV0IGNvdW50ID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KS5jb3VudDtcblx0XHRcdFx0cmV0dXJuIHN0b3JlQ291bnQodGhpcywgY291bnQpO1xuXHRcdFx0fVxuXHRcdH07XG5cdH1cbn07XG5cbmZ1bmN0aW9uIHJlY3Vyc2l2ZUNvdW50ICh1cmwsIHBhZ2UsIGNvdW50LCBjYikge1xuXHRjb25zdCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblx0eGhyLm9wZW4oJ0dFVCcsIHVybCArICc/cGFnZT0nICsgcGFnZSk7XG5cdHhoci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuXHRcdGNvbnN0IGxpa2VzID0gSlNPTi5wYXJzZSh0aGlzLnJlc3BvbnNlKTtcblx0XHRjb3VudCArPSBsaWtlcy5sZW5ndGg7XG5cblx0XHQvLyBkcmliYmJsZSBsaWtlIHBlciBwYWdlIGlzIDEyXG5cdFx0aWYgKGxpa2VzLmxlbmd0aCA9PT0gMTIpIHtcblx0XHRcdHBhZ2UrKztcblx0XHRcdHJlY3Vyc2l2ZUNvdW50KHVybCwgcGFnZSwgY291bnQsIGNiKTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRjYihjb3VudCk7XG5cdFx0fVxuXHR9KTtcblx0eGhyLnNlbmQoKTtcbn1cbiIsIi8qKlxuICogR2VuZXJhdGUgc2hhcmUgY291bnQgaW5zdGFuY2UgZnJvbSBvbmUgdG8gbWFueSBuZXR3b3Jrc1xuICovXG5cbmNvbnN0IENvdW50VHJhbnNmb3JtcyA9IHJlcXVpcmUoJy4vY291bnQtdHJhbnNmb3JtcycpO1xuY29uc3QgRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcbmNvbnN0IGNvdW50UmVkdWNlID0gcmVxdWlyZSgnLi4vLi4vbGliL2NvdW50UmVkdWNlJyk7XG5jb25zdCBzdG9yZUNvdW50ID0gcmVxdWlyZSgnLi4vLi4vbGliL3N0b3JlQ291bnQnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBDb3VudCB7XG5cblx0Y29uc3RydWN0b3IodHlwZSwgdXJsKSB7XG5cblx0XHQvLyB0aHJvdyBlcnJvciBpZiBubyB1cmwgcHJvdmlkZWRcblx0XHRpZiAoIXVybCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBPcGVuIFNoYXJlOiBubyB1cmwgcHJvdmlkZWQgZm9yIGNvdW50YCk7XG5cdFx0fVxuXG5cdFx0Ly8gY2hlY2sgZm9yIEdpdGh1YiBjb3VudHNcblx0XHRpZiAodHlwZS5pbmRleE9mKCdnaXRodWInKSA9PT0gMCkge1xuXHRcdFx0aWYgKHR5cGUgPT09ICdnaXRodWItc3RhcnMnKSB7XG5cdFx0XHRcdHR5cGUgPSAnZ2l0aHViU3RhcnMnO1xuXHRcdFx0fSBlbHNlIGlmICh0eXBlID09PSAnZ2l0aHViLWZvcmtzJykge1xuXHRcdFx0XHR0eXBlID0gJ2dpdGh1YkZvcmtzJztcblx0XHRcdH0gZWxzZSBpZiAodHlwZSA9PT0gJ2dpdGh1Yi13YXRjaGVycycpIHtcblx0XHRcdFx0dHlwZSA9ICdnaXRodWJXYXRjaGVycyc7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKCdJbnZhbGlkIEdpdGh1YiBjb3VudCB0eXBlLiBUcnkgZ2l0aHViLXN0YXJzLCBnaXRodWItZm9ya3MsIG9yIGdpdGh1Yi13YXRjaGVycy4nKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBpZiB0eXBlIGlzIGNvbW1hIHNlcGFyYXRlIGxpc3QgY3JlYXRlIGFycmF5XG5cdFx0aWYgKHR5cGUuaW5kZXhPZignLCcpID4gLTEpIHtcblx0XHRcdHRoaXMudHlwZSA9IHR5cGU7XG5cdFx0XHR0aGlzLnR5cGVBcnIgPSB0aGlzLnR5cGUuc3BsaXQoJywnKTtcblx0XHRcdHRoaXMuY291bnREYXRhID0gW107XG5cblx0XHRcdC8vIGNoZWNrIGVhY2ggdHlwZSBzdXBwbGllZCBpcyB2YWxpZFxuXHRcdFx0dGhpcy50eXBlQXJyLmZvckVhY2goKHQpID0+IHtcblx0XHRcdFx0aWYgKCFDb3VudFRyYW5zZm9ybXNbdF0pIHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoYE9wZW4gU2hhcmU6ICR7dHlwZX0gaXMgYW4gaW52YWxpZCBjb3VudCB0eXBlYCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR0aGlzLmNvdW50RGF0YS5wdXNoKENvdW50VHJhbnNmb3Jtc1t0XSh1cmwpKTtcblx0XHRcdH0pO1xuXG5cdFx0Ly8gdGhyb3cgZXJyb3IgaWYgaW52YWxpZCB0eXBlIHByb3ZpZGVkXG5cdFx0fSBlbHNlIGlmICghQ291bnRUcmFuc2Zvcm1zW3R5cGVdKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYE9wZW4gU2hhcmU6ICR7dHlwZX0gaXMgYW4gaW52YWxpZCBjb3VudCB0eXBlYCk7XG5cblx0XHQvLyBzaW5nbGUgY291bnRcblx0XHQvLyBzdG9yZSBjb3VudCBVUkwgYW5kIHRyYW5zZm9ybSBmdW5jdGlvblxuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLnR5cGUgPSB0eXBlO1xuXHRcdFx0dGhpcy5jb3VudERhdGEgPSBDb3VudFRyYW5zZm9ybXNbdHlwZV0odXJsKTtcblx0XHR9XG5cdH1cblxuXHQvLyBoYW5kbGUgY2FsbGluZyBnZXRDb3VudCAvIGdldENvdW50c1xuXHQvLyBkZXBlbmRpbmcgb24gbnVtYmVyIG9mIHR5cGVzXG5cdGNvdW50KG9zLCBjYiwgYXBwZW5kVG8pIHtcblx0XHR0aGlzLm9zID0gb3M7XG5cdFx0dGhpcy5hcHBlbmRUbyA9IGFwcGVuZFRvO1xuXHRcdHRoaXMuY2IgPSBjYjtcbiAgICBcdHRoaXMudXJsID0gdGhpcy5vcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudCcpO1xuXHRcdHRoaXMuc2hhcmVkID0gdGhpcy5vcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudC11cmwnKTtcblx0XHR0aGlzLmtleSA9IHRoaXMub3MuZ2V0QXR0cmlidXRlKCdkYXRhLWtleScpO1xuXG5cdFx0aWYgKCFBcnJheS5pc0FycmF5KHRoaXMuY291bnREYXRhKSkge1xuXHRcdFx0dGhpcy5nZXRDb3VudCgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLmdldENvdW50cygpO1xuXHRcdH1cblx0fVxuXG5cdC8vIGZldGNoIGNvdW50IGVpdGhlciBBSkFYIG9yIEpTT05QXG5cdGdldENvdW50KCkge1xuXHRcdHZhciBjb3VudCA9IHRoaXMuc3RvcmVHZXQodGhpcy50eXBlICsgJy0nICsgdGhpcy5zaGFyZWQpO1xuXG5cdFx0aWYgKGNvdW50KSB7XG5cdFx0XHRpZiAodGhpcy5hcHBlbmRUbyAmJiB0eXBlb2YgdGhpcy5hcHBlbmRUbyAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHR0aGlzLmFwcGVuZFRvLmFwcGVuZENoaWxkKHRoaXMub3MpO1xuXHRcdFx0fVxuXHRcdFx0Y291bnRSZWR1Y2UodGhpcy5vcywgY291bnQpO1xuXHRcdH1cblx0XHR0aGlzW3RoaXMuY291bnREYXRhLnR5cGVdKHRoaXMuY291bnREYXRhKTtcblx0fVxuXG5cdC8vIGZldGNoIG11bHRpcGxlIGNvdW50cyBhbmQgYWdncmVnYXRlXG5cdGdldENvdW50cygpIHtcblx0XHR0aGlzLnRvdGFsID0gW107XG5cblx0XHR2YXIgY291bnQgPSB0aGlzLnN0b3JlR2V0KHRoaXMudHlwZSArICctJyArIHRoaXMuc2hhcmVkKTtcblxuXHRcdGlmIChjb3VudCkge1xuXHRcdFx0aWYgKHRoaXMuYXBwZW5kVG8gICYmIHR5cGVvZiB0aGlzLmFwcGVuZFRvICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdHRoaXMuYXBwZW5kVG8uYXBwZW5kQ2hpbGQodGhpcy5vcyk7XG5cdFx0XHR9XG5cdFx0XHRjb3VudFJlZHVjZSh0aGlzLm9zLCBjb3VudCk7XG5cdFx0fVxuXG5cdFx0dGhpcy5jb3VudERhdGEuZm9yRWFjaChjb3VudERhdGEgPT4ge1xuXG5cdFx0XHR0aGlzW2NvdW50RGF0YS50eXBlXShjb3VudERhdGEsIChudW0pID0+IHtcblx0XHRcdFx0dGhpcy50b3RhbC5wdXNoKG51bSk7XG5cblx0XHRcdFx0Ly8gdG90YWwgY291bnRzIGxlbmd0aCBub3cgZXF1YWxzIHR5cGUgYXJyYXkgbGVuZ3RoXG5cdFx0XHRcdC8vIHNvIGFnZ3JlZ2F0ZSwgc3RvcmUgYW5kIGluc2VydCBpbnRvIERPTVxuXHRcdFx0XHRpZiAodGhpcy50b3RhbC5sZW5ndGggPT09IHRoaXMudHlwZUFyci5sZW5ndGgpIHtcblx0XHRcdFx0XHRsZXQgdG90ID0gMDtcblxuXHRcdFx0XHRcdHRoaXMudG90YWwuZm9yRWFjaCgodCkgPT4ge1xuXHRcdFx0XHRcdFx0dG90ICs9IHQ7XG5cdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRpZiAodGhpcy5hcHBlbmRUbyAgJiYgdHlwZW9mIHRoaXMuYXBwZW5kVG8gIT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRcdHRoaXMuYXBwZW5kVG8uYXBwZW5kQ2hpbGQodGhpcy5vcyk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Y29uc3QgbG9jYWwgPSBOdW1iZXIodGhpcy5zdG9yZUdldCh0aGlzLnR5cGUgKyAnLScgKyB0aGlzLnNoYXJlZCkpO1xuXHRcdFx0XHRcdGlmIChsb2NhbCA+IHRvdCkge1xuXHRcdFx0XHRcdFx0Y29uc3QgbGF0ZXN0Q291bnQgPSBOdW1iZXIodGhpcy5zdG9yZUdldCh0aGlzLnR5cGUgKyAnLScgKyB0aGlzLnNoYXJlZCArICctbGF0ZXN0Q291bnQnKSk7XG5cdFx0XHRcdFx0XHR0aGlzLnN0b3JlU2V0KHRoaXMudHlwZSArICctJyArIHRoaXMuc2hhcmVkICsgJy1sYXRlc3RDb3VudCcsIHRvdCk7XG5cblx0XHRcdFx0XHRcdHRvdCA9IGlzTnVtZXJpYyhsYXRlc3RDb3VudCkgJiYgbGF0ZXN0Q291bnQgPiAwID9cblx0XHRcdFx0XHRcdFx0dG90ICs9IGxvY2FsIC0gbGF0ZXN0Q291bnQgOlxuXHRcdFx0XHRcdFx0XHR0b3QgKz0gbG9jYWw7XG5cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0dGhpcy5zdG9yZVNldCh0aGlzLnR5cGUgKyAnLScgKyB0aGlzLnNoYXJlZCwgdG90KTtcblxuXHRcdFx0XHRcdGNvdW50UmVkdWNlKHRoaXMub3MsIHRvdCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0aWYgKHRoaXMuYXBwZW5kVG8gICYmIHR5cGVvZiB0aGlzLmFwcGVuZFRvICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHR0aGlzLmFwcGVuZFRvLmFwcGVuZENoaWxkKHRoaXMub3MpO1xuXHRcdH1cblx0fVxuXG5cdC8vIGhhbmRsZSBKU09OUCByZXF1ZXN0c1xuXHRqc29ucChjb3VudERhdGEsIGNiKSB7XG5cdFx0Ly8gZGVmaW5lIHJhbmRvbSBjYWxsYmFjayBhbmQgYXNzaWduIHRyYW5zZm9ybSBmdW5jdGlvblxuXHRcdGxldCBjYWxsYmFjayA9IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZyg3KS5yZXBsYWNlKC9bXmEtekEtWl0vZywgJycpO1xuXHRcdHdpbmRvd1tjYWxsYmFja10gPSAoZGF0YSkgPT4ge1xuXHRcdFx0bGV0IGNvdW50ID0gY291bnREYXRhLnRyYW5zZm9ybS5hcHBseSh0aGlzLCBbZGF0YV0pIHx8IDA7XG5cblx0XHRcdGlmIChjYiAmJiB0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0Y2IoY291bnQpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aWYgKHRoaXMuYXBwZW5kVG8gICYmIHR5cGVvZiB0aGlzLmFwcGVuZFRvICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0dGhpcy5hcHBlbmRUby5hcHBlbmRDaGlsZCh0aGlzLm9zKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRjb3VudFJlZHVjZSh0aGlzLm9zLCBjb3VudCwgdGhpcy5jYik7XG5cdFx0XHR9XG5cblx0XHRcdEV2ZW50cy50cmlnZ2VyKHRoaXMub3MsICdjb3VudGVkLScgKyB0aGlzLnVybCk7XG5cdFx0fTtcblxuXHRcdC8vIGFwcGVuZCBKU09OUCBzY3JpcHQgdGFnIHRvIHBhZ2Vcblx0XHRsZXQgc2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG5cdFx0c2NyaXB0LnNyYyA9IGNvdW50RGF0YS51cmwucmVwbGFjZSgnY2FsbGJhY2s9PycsIGBjYWxsYmFjaz0ke2NhbGxiYWNrfWApO1xuXHRcdGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0uYXBwZW5kQ2hpbGQoc2NyaXB0KTtcblxuXHRcdHJldHVybjtcblx0fVxuXG5cdC8vIGhhbmRsZSBBSkFYIEdFVCByZXF1ZXN0XG5cdGdldChjb3VudERhdGEsIGNiKSB7XG5cdFx0bGV0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG5cdFx0Ly8gb24gc3VjY2VzcyBwYXNzIHJlc3BvbnNlIHRvIHRyYW5zZm9ybSBmdW5jdGlvblxuXHRcdHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSAoKSA9PiB7XG5cdFx0XHRpZiAoeGhyLnJlYWR5U3RhdGUgPT09IDQpIHtcblx0XHRcdFx0aWYgKHhoci5zdGF0dXMgPT09IDIwMCkge1xuXHRcdFx0XHRcdGxldCBjb3VudCA9IGNvdW50RGF0YS50cmFuc2Zvcm0uYXBwbHkodGhpcywgW3hociwgRXZlbnRzXSkgfHwgMDtcblxuXHRcdFx0XHRcdGlmIChjYiAmJiB0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRcdGNiKGNvdW50KTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0aWYgKHRoaXMuYXBwZW5kVG8gJiYgdHlwZW9mIHRoaXMuYXBwZW5kVG8gIT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRcdFx0dGhpcy5hcHBlbmRUby5hcHBlbmRDaGlsZCh0aGlzLm9zKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGNvdW50UmVkdWNlKHRoaXMub3MsIGNvdW50LCB0aGlzLmNiKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRFdmVudHMudHJpZ2dlcih0aGlzLm9zLCAnY291bnRlZC0nICsgdGhpcy51cmwpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGlmIChjb3VudERhdGEudXJsLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignaHR0cHM6Ly9hcGkub3BlbnNoYXJlLnNvY2lhbC9qb2I/JykgPT09IDApIHtcblx0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoJ1BsZWFzZSBzaWduIHVwIGZvciBUd2l0dGVyIGNvdW50cyBhdCBodHRwczovL29wZW5zaGFyZS5zb2NpYWwvdHdpdHRlci9hdXRoJyk7XG5cdFx0XHRcdFx0fSBlbHNlIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBnZXQgQVBJIGRhdGEgZnJvbScsIGNvdW50RGF0YS51cmwsICcuIFBsZWFzZSB1c2UgdGhlIGxhdGVzdCB2ZXJzaW9uIG9mIE9wZW5TaGFyZS4nKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cdFx0Y291bnREYXRhLnVybCA9IHRoaXMua2V5ID8gY291bnREYXRhLnVybCArIHRoaXMua2V5IDogY291bnREYXRhLnVybDtcblx0XHR4aHIub3BlbignR0VUJywgY291bnREYXRhLnVybCk7XG5cdFx0eGhyLnNlbmQoKTtcblx0fVxuXG5cdC8vIGhhbmRsZSBBSkFYIFBPU1QgcmVxdWVzdFxuXHRwb3N0KGNvdW50RGF0YSwgY2IpIHtcblx0XHRsZXQgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cblx0XHQvLyBvbiBzdWNjZXNzIHBhc3MgcmVzcG9uc2UgdG8gdHJhbnNmb3JtIGZ1bmN0aW9uXG5cdFx0eGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9ICgpID0+IHtcblx0XHRcdGlmICh4aHIucmVhZHlTdGF0ZSAhPT0gWE1MSHR0cFJlcXVlc3QuRE9ORSB8fFxuXHRcdFx0XHR4aHIuc3RhdHVzICE9PSAyMDApIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRsZXQgY291bnQgPSBjb3VudERhdGEudHJhbnNmb3JtLmFwcGx5KHRoaXMsIFt4aHJdKSB8fCAwO1xuXG5cdFx0XHRpZiAoY2IgJiYgdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdGNiKGNvdW50KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGlmICh0aGlzLmFwcGVuZFRvICYmIHR5cGVvZiB0aGlzLmFwcGVuZFRvICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0dGhpcy5hcHBlbmRUby5hcHBlbmRDaGlsZCh0aGlzLm9zKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRjb3VudFJlZHVjZSh0aGlzLm9zLCBjb3VudCwgdGhpcy5jYik7XG5cdFx0XHR9XG5cdFx0XHRFdmVudHMudHJpZ2dlcih0aGlzLm9zLCAnY291bnRlZC0nICsgdGhpcy51cmwpO1xuXHRcdH07XG5cblx0XHR4aHIub3BlbignUE9TVCcsIGNvdW50RGF0YS51cmwpO1xuXHRcdHhoci5zZXRSZXF1ZXN0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbjtjaGFyc2V0PVVURi04Jyk7XG5cdFx0eGhyLnNlbmQoSlNPTi5zdHJpbmdpZnkoY291bnREYXRhLmRhdGEpKTtcblx0fVxuXG5cdHN0b3JlU2V0KHR5cGUsIGNvdW50ID0gMCkge1xuXHRcdGlmICghd2luZG93LmxvY2FsU3RvcmFnZSB8fCAhdHlwZSkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGxvY2FsU3RvcmFnZS5zZXRJdGVtKGBPcGVuU2hhcmUtJHt0eXBlfWAsIGNvdW50KTtcblx0fVxuXG5cdHN0b3JlR2V0KHR5cGUpIHtcblx0XHRpZiAoIXdpbmRvdy5sb2NhbFN0b3JhZ2UgfHwgIXR5cGUpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRyZXR1cm4gbG9jYWxTdG9yYWdlLmdldEl0ZW0oYE9wZW5TaGFyZS0ke3R5cGV9YCk7XG5cdH1cblxufTtcblxuZnVuY3Rpb24gaXNOdW1lcmljKG4pIHtcbiAgcmV0dXJuICFpc05hTihwYXJzZUZsb2F0KG4pKSAmJiBpc0Zpbml0ZShuKTtcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG5cdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCByZXF1aXJlKCcuLi8uLi9saWIvaW5pdCcpKHtcblx0XHRzZWxlY3Rvcjoge1xuXHRcdFx0c2hhcmU6ICdbZGF0YS1vcGVuLXNoYXJlXTpub3QoW2RhdGEtb3Blbi1zaGFyZS1ub2RlXSknLFxuXHRcdFx0Y291bnQ6ICdbZGF0YS1vcGVuLXNoYXJlLWNvdW50XTpub3QoW2RhdGEtb3Blbi1zaGFyZS1ub2RlXSknXG5cdFx0fSxcblx0XHRjYjoge1xuXHRcdFx0c2hhcmU6IHJlcXVpcmUoJy4uLy4uL2xpYi9pbml0aWFsaXplU2hhcmVOb2RlJyksXG5cdFx0XHRjb3VudDogcmVxdWlyZSgnLi4vLi4vbGliL2luaXRpYWxpemVDb3VudE5vZGUnKVxuXHRcdH1cblx0fSkpO1xufTtcbiIsIi8qKlxuICogVHJpZ2dlciBjdXN0b20gT3BlblNoYXJlIG5hbWVzcGFjZWQgZXZlbnRcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSB7XG5cdHRyaWdnZXI6IGZ1bmN0aW9uKGVsZW1lbnQsIGV2ZW50KSB7XG5cdFx0bGV0IGV2ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0V2ZW50Jyk7XG5cdFx0ZXYuaW5pdEV2ZW50KCdPcGVuU2hhcmUuJyArIGV2ZW50LCB0cnVlLCB0cnVlKTtcblx0XHRlbGVtZW50LmRpc3BhdGNoRXZlbnQoZXYpO1xuXHR9XG59O1xuIiwiLyoqXG4gKiBPcGVuU2hhcmUgZ2VuZXJhdGVzIGEgc2luZ2xlIHNoYXJlIGxpbmtcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBPcGVuU2hhcmUge1xuXG5cdGNvbnN0cnVjdG9yKHR5cGUsIHRyYW5zZm9ybSkge1xuXHRcdHRoaXMuaW9zID0gL2lQYWR8aVBob25lfGlQb2QvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkgJiYgIXdpbmRvdy5NU1N0cmVhbTtcblx0XHR0aGlzLnR5cGUgPSB0eXBlO1xuXHRcdHRoaXMuZHluYW1pYyA9IGZhbHNlO1xuXHRcdHRoaXMudHJhbnNmb3JtID0gdHJhbnNmb3JtO1xuXG5cdFx0Ly8gY2FwaXRhbGl6ZWQgdHlwZVxuXHRcdHRoaXMudHlwZUNhcHMgPSB0eXBlLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgdHlwZS5zbGljZSgxKTtcblx0fVxuXG5cdC8vIHJldHVybnMgZnVuY3Rpb24gbmFtZWQgYXMgdHlwZSBzZXQgaW4gY29uc3RydWN0b3Jcblx0Ly8gZS5nIHR3aXR0ZXIoKVxuXHRzZXREYXRhKGRhdGEpIHtcblx0XHQvLyBpZiBpT1MgdXNlciBhbmQgaW9zIGRhdGEgYXR0cmlidXRlIGRlZmluZWRcblx0XHQvLyBidWlsZCBpT1MgVVJMIHNjaGVtZSBhcyBzaW5nbGUgc3RyaW5nXG5cdFx0aWYgKHRoaXMuaW9zKSB7XG5cdFx0XHR0aGlzLnRyYW5zZm9ybURhdGEgPSB0aGlzLnRyYW5zZm9ybShkYXRhLCB0cnVlKTtcblx0XHRcdHRoaXMubW9iaWxlU2hhcmVVcmwgPSB0aGlzLnRlbXBsYXRlKHRoaXMudHJhbnNmb3JtRGF0YS51cmwsIHRoaXMudHJhbnNmb3JtRGF0YS5kYXRhKTtcblx0XHR9XG5cblx0XHR0aGlzLnRyYW5zZm9ybURhdGEgPSB0aGlzLnRyYW5zZm9ybShkYXRhKTtcblx0XHR0aGlzLnNoYXJlVXJsID0gdGhpcy50ZW1wbGF0ZSh0aGlzLnRyYW5zZm9ybURhdGEudXJsLCB0aGlzLnRyYW5zZm9ybURhdGEuZGF0YSk7XG5cdH1cblxuXHQvLyBvcGVuIHNoYXJlIFVSTCBkZWZpbmVkIGluIGluZGl2aWR1YWwgcGxhdGZvcm0gZnVuY3Rpb25zXG5cdHNoYXJlKGUpIHtcblx0XHQvLyBpZiBpT1Mgc2hhcmUgVVJMIGhhcyBiZWVuIHNldCB0aGVuIHVzZSB0aW1lb3V0IGhhY2tcblx0XHQvLyB0ZXN0IGZvciBuYXRpdmUgYXBwIGFuZCBmYWxsIGJhY2sgdG8gd2ViXG5cdFx0aWYgKHRoaXMubW9iaWxlU2hhcmVVcmwpIHtcblx0XHRcdHZhciBzdGFydCA9IChuZXcgRGF0ZSgpKS52YWx1ZU9mKCk7XG5cblx0XHRcdHNldFRpbWVvdXQoKCkgPT4ge1xuXHRcdFx0XHR2YXIgZW5kID0gKG5ldyBEYXRlKCkpLnZhbHVlT2YoKTtcblxuXHRcdFx0XHQvLyBpZiB0aGUgdXNlciBpcyBzdGlsbCBoZXJlLCBmYWxsIGJhY2sgdG8gd2ViXG5cdFx0XHRcdGlmIChlbmQgLSBzdGFydCA+IDE2MDApIHtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR3aW5kb3cubG9jYXRpb24gPSB0aGlzLnNoYXJlVXJsO1xuXHRcdFx0fSwgMTUwMCk7XG5cblx0XHRcdHdpbmRvdy5sb2NhdGlvbiA9IHRoaXMubW9iaWxlU2hhcmVVcmw7XG5cblx0XHQvLyBvcGVuIG1haWx0byBsaW5rcyBpbiBzYW1lIHdpbmRvd1xuXHRcdH0gZWxzZSBpZiAodGhpcy50eXBlID09PSAnZW1haWwnKSB7XG5cdFx0XHR3aW5kb3cubG9jYXRpb24gPSB0aGlzLnNoYXJlVXJsO1xuXG5cdFx0Ly8gb3BlbiBzb2NpYWwgc2hhcmUgVVJMcyBpbiBuZXcgd2luZG93XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIGlmIHBvcHVwIG9iamVjdCBwcmVzZW50IHRoZW4gc2V0IHdpbmRvdyBkaW1lbnNpb25zIC8gcG9zaXRpb25cblx0XHRcdGlmKHRoaXMucG9wdXAgJiYgdGhpcy50cmFuc2Zvcm1EYXRhLnBvcHVwKSB7XG5cdFx0XHRcdHJldHVybiB0aGlzLm9wZW5XaW5kb3codGhpcy5zaGFyZVVybCwgdGhpcy50cmFuc2Zvcm1EYXRhLnBvcHVwKTtcblx0XHRcdH1cblxuXHRcdFx0d2luZG93Lm9wZW4odGhpcy5zaGFyZVVybCk7XG5cdFx0fVxuXHR9XG5cblx0Ly8gY3JlYXRlIHNoYXJlIFVSTCB3aXRoIEdFVCBwYXJhbXNcblx0Ly8gYXBwZW5kaW5nIHZhbGlkIHByb3BlcnRpZXMgdG8gcXVlcnkgc3RyaW5nXG5cdHRlbXBsYXRlKHVybCwgZGF0YSkge1xuXHRcdGxldCBub25VUkxQcm9wcyA9IFtcblx0XHRcdCdhcHBlbmRUbycsXG5cdFx0XHQnaW5uZXJIVE1MJyxcblx0XHRcdCdjbGFzc2VzJ1xuXHRcdF07XG5cblx0XHRsZXQgc2hhcmVVcmwgPSB1cmwsXG5cdFx0XHRpO1xuXG5cdFx0Zm9yIChpIGluIGRhdGEpIHtcblx0XHRcdC8vIG9ubHkgYXBwZW5kIHZhbGlkIHByb3BlcnRpZXNcblx0XHRcdGlmICghZGF0YVtpXSB8fCBub25VUkxQcm9wcy5pbmRleE9mKGkpID4gLTEpIHtcblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHR9XG5cblx0XHRcdC8vIGFwcGVuZCBVUkwgZW5jb2RlZCBHRVQgcGFyYW0gdG8gc2hhcmUgVVJMXG5cdFx0XHRkYXRhW2ldID0gZW5jb2RlVVJJQ29tcG9uZW50KGRhdGFbaV0pO1xuXHRcdFx0c2hhcmVVcmwgKz0gYCR7aX09JHtkYXRhW2ldfSZgO1xuXHRcdH1cblxuXHRcdHJldHVybiBzaGFyZVVybC5zdWJzdHIoMCwgc2hhcmVVcmwubGVuZ3RoIC0gMSk7XG5cdH1cblxuXHQvLyBjZW50ZXIgcG9wdXAgd2luZG93IHN1cHBvcnRpbmcgZHVhbCBzY3JlZW5zXG5cdG9wZW5XaW5kb3codXJsLCBvcHRpb25zKSB7XG5cdFx0bGV0IGR1YWxTY3JlZW5MZWZ0ID0gd2luZG93LnNjcmVlbkxlZnQgIT0gdW5kZWZpbmVkID8gd2luZG93LnNjcmVlbkxlZnQgOiBzY3JlZW4ubGVmdCxcblx0XHRcdGR1YWxTY3JlZW5Ub3AgPSB3aW5kb3cuc2NyZWVuVG9wICE9IHVuZGVmaW5lZCA/IHdpbmRvdy5zY3JlZW5Ub3AgOiBzY3JlZW4udG9wLFxuXHRcdFx0d2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aCA/IHdpbmRvdy5pbm5lcldpZHRoIDogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoID8gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoIDogc2NyZWVuLndpZHRoLFxuXHRcdFx0aGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0ID8gd2luZG93LmlubmVySGVpZ2h0IDogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodCA/IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQgOiBzY3JlZW4uaGVpZ2h0LFxuXHRcdFx0bGVmdCA9ICgod2lkdGggLyAyKSAtIChvcHRpb25zLndpZHRoIC8gMikpICsgZHVhbFNjcmVlbkxlZnQsXG5cdFx0XHR0b3AgPSAoKGhlaWdodCAvIDIpIC0gKG9wdGlvbnMuaGVpZ2h0IC8gMikpICsgZHVhbFNjcmVlblRvcCxcblx0XHRcdG5ld1dpbmRvdyA9IHdpbmRvdy5vcGVuKHVybCwgJ09wZW5TaGFyZScsIGB3aWR0aD0ke29wdGlvbnMud2lkdGh9LCBoZWlnaHQ9JHtvcHRpb25zLmhlaWdodH0sIHRvcD0ke3RvcH0sIGxlZnQ9JHtsZWZ0fWApO1xuXG5cdFx0Ly8gUHV0cyBmb2N1cyBvbiB0aGUgbmV3V2luZG93XG5cdFx0aWYgKHdpbmRvdy5mb2N1cykge1xuXHRcdFx0bmV3V2luZG93LmZvY3VzKCk7XG5cdFx0fVxuXHR9XG59O1xuIiwiLyoqXG4gKiBHbG9iYWwgT3BlblNoYXJlIEFQSSB0byBnZW5lcmF0ZSBpbnN0YW5jZXMgcHJvZ3JhbW1hdGljYWxseVxuICovXG5cbmNvbnN0IE9TID0gcmVxdWlyZSgnLi9vcGVuLXNoYXJlJyk7XG5jb25zdCBTaGFyZVRyYW5zZm9ybXMgPSByZXF1aXJlKCcuL3NoYXJlLXRyYW5zZm9ybXMnKTtcbmNvbnN0IEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG5jb25zdCBkYXNoVG9DYW1lbCA9IHJlcXVpcmUoJy4uLy4uL2xpYi9kYXNoVG9DYW1lbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuXG5cdC8vIGdsb2JhbCBPcGVuU2hhcmUgcmVmZXJlbmNpbmcgaW50ZXJuYWwgY2xhc3MgZm9yIGluc3RhbmNlIGdlbmVyYXRpb25cblx0Y2xhc3MgT3BlblNoYXJlIHtcblxuXHRcdGNvbnN0cnVjdG9yKGRhdGEsIGVsZW1lbnQpIHtcblxuXHRcdFx0aWYgKCFkYXRhLmJpbmRDbGljaykgZGF0YS5iaW5kQ2xpY2sgPSB0cnVlO1xuXG5cdFx0XHRsZXQgZGFzaCA9IGRhdGEudHlwZS5pbmRleE9mKCctJyk7XG5cblx0XHRcdGlmIChkYXNoID4gLTEpIHtcblx0XHRcdFx0ZGF0YS50eXBlID0gZGFzaFRvQ2FtZWwoZGFzaCwgZGF0YS50eXBlKTtcblx0XHRcdH1cblxuXHRcdFx0bGV0IG5vZGU7XG5cdFx0XHR0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuXHRcdFx0dGhpcy5kYXRhID0gZGF0YTtcblxuXHRcdFx0dGhpcy5vcyA9IG5ldyBPUyhkYXRhLnR5cGUsIFNoYXJlVHJhbnNmb3Jtc1tkYXRhLnR5cGVdKTtcblx0XHRcdHRoaXMub3Muc2V0RGF0YShkYXRhKTtcblxuXHRcdFx0aWYgKCFlbGVtZW50IHx8IGRhdGEuZWxlbWVudCkge1xuXHRcdFx0XHRlbGVtZW50ID0gZGF0YS5lbGVtZW50O1xuXHRcdFx0XHRub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChlbGVtZW50IHx8ICdhJyk7XG5cdFx0XHRcdGlmIChkYXRhLnR5cGUpIHtcblx0XHRcdFx0XHRub2RlLmNsYXNzTGlzdC5hZGQoJ29wZW4tc2hhcmUtbGluaycsIGRhdGEudHlwZSk7XG5cdFx0XHRcdFx0bm9kZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZScsIGRhdGEudHlwZSk7XG5cdFx0XHRcdFx0bm9kZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1ub2RlJywgZGF0YS50eXBlKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoZGF0YS5pbm5lckhUTUwpIG5vZGUuaW5uZXJIVE1MID0gZGF0YS5pbm5lckhUTUw7XG5cdFx0XHR9XG5cdFx0XHRpZiAobm9kZSkgZWxlbWVudCA9IG5vZGU7XG5cblx0XHRcdGlmIChkYXRhLmJpbmRDbGljaykge1xuXHRcdFx0XHRlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcblx0XHRcdFx0XHR0aGlzLnNoYXJlKCk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGF0YS5hcHBlbmRUbykge1xuXHRcdFx0XHRkYXRhLmFwcGVuZFRvLmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGF0YS5jbGFzc2VzICYmIEFycmF5LmlzQXJyYXkoZGF0YS5jbGFzc2VzKSkge1xuXHRcdFx0XHRkYXRhLmNsYXNzZXMuZm9yRWFjaChjc3NDbGFzcyA9PiB7XG5cdFx0XHRcdFx0ZWxlbWVudC5jbGFzc0xpc3QuYWRkKGNzc0NsYXNzKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkYXRhLnR5cGUudG9Mb3dlckNhc2UoKSA9PT0gJ3BheXBhbCcpIHtcblx0XHRcdFx0Y29uc3QgYWN0aW9uID0gZGF0YS5zYW5kYm94ID9cblx0XHRcdFx0ICAgXCJodHRwczovL3d3dy5zYW5kYm94LnBheXBhbC5jb20vY2dpLWJpbi93ZWJzY3JcIiA6XG5cdFx0XHRcdCAgIFwiaHR0cHM6Ly93d3cucGF5cGFsLmNvbS9jZ2ktYmluL3dlYnNjclwiO1xuXG5cdFx0XHRcdGNvbnN0IGJ1eUdJRiA9IGRhdGEuc2FuZGJveCA/XG5cdFx0XHRcdFx0XCJodHRwczovL3d3dy5zYW5kYm94LnBheXBhbC5jb20vZW5fVVMvaS9idG4vYnRuX2J1eW5vd19MRy5naWZcIiA6XG5cdFx0XHRcdFx0XCJodHRwczovL3d3dy5wYXlwYWxvYmplY3RzLmNvbS9lbl9VUy9pL2J0bi9idG5fYnV5bm93X0xHLmdpZlwiO1xuXG5cdFx0XHRcdGNvbnN0IHBpeGVsR0lGID0gZGF0YS5zYW5kYm94ID9cblx0XHRcdFx0XHRcImh0dHBzOi8vd3d3LnNhbmRib3gucGF5cGFsLmNvbS9lbl9VUy9pL3Njci9waXhlbC5naWZcIiA6XG5cdFx0XHRcdFx0XCJodHRwczovL3d3dy5wYXlwYWxvYmplY3RzLmNvbS9lbl9VUy9pL3Njci9waXhlbC5naWZcIjtcblxuXG5cdFx0XHRcdGNvbnN0IHBheXBhbEJ1dHRvbiA9IGA8Zm9ybSBhY3Rpb249JHthY3Rpb259IG1ldGhvZD1cInBvc3RcIiB0YXJnZXQ9XCJfYmxhbmtcIj5cblxuXHRcdFx0XHQgIDwhLS0gU2F2ZWQgYnV0dG9ucyB1c2UgdGhlIFwic2VjdXJlIGNsaWNrXCIgY29tbWFuZCAtLT5cblx0XHRcdFx0ICA8aW5wdXQgdHlwZT1cImhpZGRlblwiIG5hbWU9XCJjbWRcIiB2YWx1ZT1cIl9zLXhjbGlja1wiPlxuXG5cdFx0XHRcdCAgPCEtLSBTYXZlZCBidXR0b25zIGFyZSBpZGVudGlmaWVkIGJ5IHRoZWlyIGJ1dHRvbiBJRHMgLS0+XG5cdFx0XHRcdCAgPGlucHV0IHR5cGU9XCJoaWRkZW5cIiBuYW1lPVwiaG9zdGVkX2J1dHRvbl9pZFwiIHZhbHVlPVwiJHtkYXRhLmJ1dHRvbklkfVwiPlxuXG5cdFx0XHRcdCAgPCEtLSBTYXZlZCBidXR0b25zIGRpc3BsYXkgYW4gYXBwcm9wcmlhdGUgYnV0dG9uIGltYWdlLiAtLT5cblx0XHRcdFx0ICA8aW5wdXQgdHlwZT1cImltYWdlXCIgbmFtZT1cInN1Ym1pdFwiXG5cdFx0XHRcdCAgICBzcmM9JHtidXlHSUZ9XG5cdFx0XHRcdCAgICBhbHQ9XCJQYXlQYWwgLSBUaGUgc2FmZXIsIGVhc2llciB3YXkgdG8gcGF5IG9ubGluZVwiPlxuXHRcdFx0XHQgIDxpbWcgYWx0PVwiXCIgd2lkdGg9XCIxXCIgaGVpZ2h0PVwiMVwiXG5cdFx0XHRcdCAgICBzcmM9JHtwaXhlbEdJRn0gPlxuXG5cdFx0XHRcdDwvZm9ybT5gO1xuXG5cdFx0XHRcdGNvbnN0IGhpZGRlbkRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHRcdFx0XHRoaWRkZW5EaXYuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblx0XHRcdFx0aGlkZGVuRGl2LmlubmVySFRNTCA9IHBheXBhbEJ1dHRvbjtcblx0XHRcdFx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChoaWRkZW5EaXYpO1xuXG5cdFx0XHRcdHRoaXMucGF5cGFsID0gaGlkZGVuRGl2LnF1ZXJ5U2VsZWN0b3IoJ2Zvcm0nKTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5lbGVtZW50ID0gZWxlbWVudDtcblx0XHRcdHJldHVybiBlbGVtZW50O1xuXHRcdH1cblxuXHRcdC8vIHB1YmxpYyBzaGFyZSBtZXRob2QgdG8gdHJpZ2dlciBzaGFyZSBwcm9ncmFtbWF0aWNhbGx5XG5cdFx0c2hhcmUoZSkge1xuXHRcdFx0Ly8gaWYgZHluYW1pYyBpbnN0YW5jZSB0aGVuIGZldGNoIGF0dHJpYnV0ZXMgYWdhaW4gaW4gY2FzZSBvZiB1cGRhdGVzXG5cdFx0XHRpZiAodGhpcy5kYXRhLmR5bmFtaWMpIHtcblx0XHRcdFx0dGhpcy5vcy5zZXREYXRhKGRhdGEpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAodGhpcy5kYXRhLnR5cGUudG9Mb3dlckNhc2UoKSA9PT0gJ3BheXBhbCcpIHtcblx0XHRcdFx0dGhpcy5wYXlwYWwuc3VibWl0KCk7XG5cdFx0XHR9IGVsc2UgdGhpcy5vcy5zaGFyZShlKTtcblxuXHRcdFx0RXZlbnRzLnRyaWdnZXIodGhpcy5lbGVtZW50LCAnc2hhcmVkJyk7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIE9wZW5TaGFyZTtcbn07XG4iLCIvKipcbiAqIE9iamVjdCBvZiB0cmFuc2Zvcm0gZnVuY3Rpb25zIGZvciBlYWNoIG9wZW5zaGFyZSBhcGlcbiAqIFRyYW5zZm9ybSBmdW5jdGlvbnMgcGFzc2VkIGludG8gT3BlblNoYXJlIGluc3RhbmNlIHdoZW4gaW5zdGFudGlhdGVkXG4gKiBSZXR1cm4gb2JqZWN0IGNvbnRhaW5pbmcgVVJMIGFuZCBrZXkvdmFsdWUgYXJnc1xuICovXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuXHQvLyBzZXQgVHdpdHRlciBzaGFyZSBVUkxcblx0dHdpdHRlcjogZnVuY3Rpb24oZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHQvLyBpZiBpT1MgdXNlciBhbmQgaW9zIGRhdGEgYXR0cmlidXRlIGRlZmluZWRcblx0XHQvLyBidWlsZCBpT1MgVVJMIHNjaGVtZSBhcyBzaW5nbGUgc3RyaW5nXG5cdFx0aWYgKGlvcyAmJiBkYXRhLmlvcykge1xuXG5cdFx0XHRsZXQgbWVzc2FnZSA9IGBgO1xuXG5cdFx0XHRpZiAoZGF0YS50ZXh0KSB7XG5cdFx0XHRcdG1lc3NhZ2UgKz0gZGF0YS50ZXh0O1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGF0YS51cmwpIHtcblx0XHRcdFx0bWVzc2FnZSArPSBgIC0gJHtkYXRhLnVybH1gO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGF0YS5oYXNodGFncykge1xuXHRcdFx0XHRsZXQgdGFncyA9IGRhdGEuaGFzaHRhZ3Muc3BsaXQoJywnKTtcblx0XHRcdFx0dGFncy5mb3JFYWNoKGZ1bmN0aW9uKHRhZykge1xuXHRcdFx0XHRcdG1lc3NhZ2UgKz0gYCAjJHt0YWd9YDtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkYXRhLnZpYSkge1xuXHRcdFx0XHRtZXNzYWdlICs9IGAgdmlhICR7ZGF0YS52aWF9YDtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0dXJsOiAndHdpdHRlcjovL3Bvc3Q/Jyxcblx0XHRcdFx0ZGF0YToge1xuXHRcdFx0XHRcdG1lc3NhZ2U6IG1lc3NhZ2Vcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiAnaHR0cHM6Ly90d2l0dGVyLmNvbS9zaGFyZT8nLFxuXHRcdFx0ZGF0YTogZGF0YSxcblx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdHdpZHRoOiA3MDAsXG5cdFx0XHRcdGhlaWdodDogMjk2XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBzZXQgVHdpdHRlciByZXR3ZWV0IFVSTFxuXHR0d2l0dGVyUmV0d2VldDogZnVuY3Rpb24oZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHQvLyBpZiBpT1MgdXNlciBhbmQgaW9zIGRhdGEgYXR0cmlidXRlIGRlZmluZWRcblx0XHRpZiAoaW9zICYmIGRhdGEuaW9zKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR1cmw6ICd0d2l0dGVyOi8vc3RhdHVzPycsXG5cdFx0XHRcdGRhdGE6IHtcblx0XHRcdFx0XHRpZDogZGF0YS50d2VldElkXG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybDogJ2h0dHBzOi8vdHdpdHRlci5jb20vaW50ZW50L3JldHdlZXQ/Jyxcblx0XHRcdGRhdGE6IHtcblx0XHRcdFx0dHdlZXRfaWQ6IGRhdGEudHdlZXRJZCxcblx0XHRcdFx0cmVsYXRlZDogZGF0YS5yZWxhdGVkXG5cdFx0XHR9LFxuXHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0d2lkdGg6IDcwMCxcblx0XHRcdFx0aGVpZ2h0OiAyOTZcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBUd2l0dGVyIGxpa2UgVVJMXG5cdHR3aXR0ZXJMaWtlOiBmdW5jdGlvbihkYXRhLCBpb3MgPSBmYWxzZSkge1xuXHRcdC8vIGlmIGlPUyB1c2VyIGFuZCBpb3MgZGF0YSBhdHRyaWJ1dGUgZGVmaW5lZFxuXHRcdGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVybDogJ3R3aXR0ZXI6Ly9zdGF0dXM/Jyxcblx0XHRcdFx0ZGF0YToge1xuXHRcdFx0XHRcdGlkOiBkYXRhLnR3ZWV0SWRcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiAnaHR0cHM6Ly90d2l0dGVyLmNvbS9pbnRlbnQvZmF2b3JpdGU/Jyxcblx0XHRcdGRhdGE6IHtcblx0XHRcdFx0dHdlZXRfaWQ6IGRhdGEudHdlZXRJZCxcblx0XHRcdFx0cmVsYXRlZDogZGF0YS5yZWxhdGVkXG5cdFx0XHR9LFxuXHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0d2lkdGg6IDcwMCxcblx0XHRcdFx0aGVpZ2h0OiAyOTZcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBUd2l0dGVyIGZvbGxvdyBVUkxcblx0dHdpdHRlckZvbGxvdzogZnVuY3Rpb24oZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHQvLyBpZiBpT1MgdXNlciBhbmQgaW9zIGRhdGEgYXR0cmlidXRlIGRlZmluZWRcblx0XHRpZiAoaW9zICYmIGRhdGEuaW9zKSB7XG5cdFx0XHRsZXQgaW9zRGF0YSA9IGRhdGEuc2NyZWVuTmFtZSA/IHtcblx0XHRcdFx0J3NjcmVlbl9uYW1lJzogZGF0YS5zY3JlZW5OYW1lXG5cdFx0XHR9IDoge1xuXHRcdFx0XHQnaWQnOiBkYXRhLnVzZXJJZFxuXHRcdFx0fTtcblxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0dXJsOiAndHdpdHRlcjovL3VzZXI/Jyxcblx0XHRcdFx0ZGF0YTogaW9zRGF0YVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiAnaHR0cHM6Ly90d2l0dGVyLmNvbS9pbnRlbnQvdXNlcj8nLFxuXHRcdFx0ZGF0YToge1xuXHRcdFx0XHRzY3JlZW5fbmFtZTogZGF0YS5zY3JlZW5OYW1lLFxuXHRcdFx0XHR1c2VyX2lkOiBkYXRhLnVzZXJJZFxuXHRcdFx0fSxcblx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdHdpZHRoOiA3MDAsXG5cdFx0XHRcdGhlaWdodDogMjk2XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBzZXQgRmFjZWJvb2sgc2hhcmUgVVJMXG5cdGZhY2Vib29rOiBmdW5jdGlvbihkYXRhKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybDogJ2h0dHBzOi8vd3d3LmZhY2Vib29rLmNvbS9kaWFsb2cvZmVlZD9hcHBfaWQ9OTYxMzQyNTQzOTIyMzIyJnJlZGlyZWN0X3VyaT1odHRwOi8vZmFjZWJvb2suY29tJicsXG5cdFx0XHRkYXRhOiBkYXRhLFxuXHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0d2lkdGg6IDU2MCxcblx0XHRcdFx0aGVpZ2h0OiA1OTNcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBGYWNlYm9vayBzZW5kIFVSTFxuXHRmYWNlYm9va1NlbmQ6IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiAnaHR0cHM6Ly93d3cuZmFjZWJvb2suY29tL2RpYWxvZy9zZW5kP2FwcF9pZD05NjEzNDI1NDM5MjIzMjImcmVkaXJlY3RfdXJpPWh0dHA6Ly9mYWNlYm9vay5jb20mJyxcblx0XHRcdGRhdGE6IGRhdGEsXG5cdFx0XHRwb3B1cDoge1xuXHRcdFx0XHR3aWR0aDogOTgwLFxuXHRcdFx0XHRoZWlnaHQ6IDU5NlxuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gc2V0IFlvdVR1YmUgcGxheSBVUkxcblx0eW91dHViZTogZnVuY3Rpb24oZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHQvLyBpZiBpT1MgdXNlclxuXHRcdGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVybDogYHlvdXR1YmU6JHtkYXRhLnZpZGVvfT9gXG5cdFx0XHR9O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR1cmw6IGBodHRwczovL3d3dy55b3V0dWJlLmNvbS93YXRjaD92PSR7ZGF0YS52aWRlb30/YCxcblx0XHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0XHR3aWR0aDogMTA4Nixcblx0XHRcdFx0XHRoZWlnaHQ6IDYwOFxuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdH1cblx0fSxcblxuXHQvLyBzZXQgWW91VHViZSBzdWJjcmliZSBVUkxcblx0eW91dHViZVN1YnNjcmliZTogZnVuY3Rpb24oZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHQvLyBpZiBpT1MgdXNlclxuXHRcdGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVybDogYHlvdXR1YmU6Ly93d3cueW91dHViZS5jb20vdXNlci8ke2RhdGEudXNlcn0/YFxuXHRcdFx0fTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0dXJsOiBgaHR0cHM6Ly93d3cueW91dHViZS5jb20vdXNlci8ke2RhdGEudXNlcn0/YCxcblx0XHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0XHR3aWR0aDogODgwLFxuXHRcdFx0XHRcdGhlaWdodDogMzUwXG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0fVxuXHR9LFxuXG5cdC8vIHNldCBJbnN0YWdyYW0gZm9sbG93IFVSTFxuXHRpbnN0YWdyYW06IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiBgaW5zdGFncmFtOi8vY2FtZXJhP2Bcblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBJbnN0YWdyYW0gZm9sbG93IFVSTFxuXHRpbnN0YWdyYW1Gb2xsb3c6IGZ1bmN0aW9uKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG5cdFx0Ly8gaWYgaU9TIHVzZXJcblx0XHRpZiAoaW9zICYmIGRhdGEuaW9zKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR1cmw6ICdpbnN0YWdyYW06Ly91c2VyPycsXG5cdFx0XHRcdGRhdGE6IGRhdGFcblx0XHRcdH07XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVybDogYGh0dHA6Ly93d3cuaW5zdGFncmFtLmNvbS8ke2RhdGEudXNlcm5hbWV9P2AsXG5cdFx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdFx0d2lkdGg6IDk4MCxcblx0XHRcdFx0XHRoZWlnaHQ6IDY1NVxuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdH1cblx0fSxcblxuXHQvLyBzZXQgU25hcGNoYXQgZm9sbG93IFVSTFxuXHRzbmFwY2hhdCAoZGF0YSkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6IGBzbmFwY2hhdDovL2FkZC8ke2RhdGEudXNlcm5hbWV9P2Bcblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBHb29nbGUgc2hhcmUgVVJMXG5cdGdvb2dsZSAoZGF0YSkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6ICdodHRwczovL3BsdXMuZ29vZ2xlLmNvbS9zaGFyZT8nLFxuXHRcdFx0ZGF0YTogZGF0YSxcblx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdHdpZHRoOiA0OTUsXG5cdFx0XHRcdGhlaWdodDogODE1XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBzZXQgR29vZ2xlIG1hcHMgVVJMXG5cdGdvb2dsZU1hcHMgKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG5cblx0XHRpZiAoZGF0YS5zZWFyY2gpIHtcblx0XHRcdGRhdGEucSA9IGRhdGEuc2VhcmNoO1xuXHRcdFx0ZGVsZXRlIGRhdGEuc2VhcmNoO1xuXHRcdH1cblxuXHRcdC8vIGlmIGlPUyB1c2VyIGFuZCBpb3MgZGF0YSBhdHRyaWJ1dGUgZGVmaW5lZFxuXHRcdGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVybDogJ2NvbWdvb2dsZW1hcHM6Ly8/Jyxcblx0XHRcdFx0ZGF0YTogaW9zXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdGlmICghaW9zICYmIGRhdGEuaW9zKSB7XG5cdFx0XHRkZWxldGUgZGF0YS5pb3M7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybDogJ2h0dHBzOi8vbWFwcy5nb29nbGUuY29tLz8nLFxuXHRcdFx0ZGF0YTogZGF0YSxcblx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdHdpZHRoOiA4MDAsXG5cdFx0XHRcdGhlaWdodDogNjAwXG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHQvLyBzZXQgUGludGVyZXN0IHNoYXJlIFVSTFxuXHRwaW50ZXJlc3QgKGRhdGEpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiAnaHR0cHM6Ly9waW50ZXJlc3QuY29tL3Bpbi9jcmVhdGUvYm9va21hcmtsZXQvPycsXG5cdFx0XHRkYXRhOiBkYXRhLFxuXHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0d2lkdGg6IDc0NSxcblx0XHRcdFx0aGVpZ2h0OiA2MjBcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBMaW5rZWRJbiBzaGFyZSBVUkxcblx0bGlua2VkaW4gKGRhdGEpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiAnaHR0cDovL3d3dy5saW5rZWRpbi5jb20vc2hhcmVBcnRpY2xlPycsXG5cdFx0XHRkYXRhOiBkYXRhLFxuXHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0d2lkdGg6IDc4MCxcblx0XHRcdFx0aGVpZ2h0OiA0OTJcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBCdWZmZXIgc2hhcmUgVVJMXG5cdGJ1ZmZlciAoZGF0YSkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6ICdodHRwOi8vYnVmZmVyYXBwLmNvbS9hZGQ/Jyxcblx0XHRcdGRhdGE6IGRhdGEsXG5cdFx0XHRwb3B1cDoge1xuXHRcdFx0XHR3aWR0aDogNzQ1LFxuXHRcdFx0XHRoZWlnaHQ6IDM0NVxuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gc2V0IFR1bWJsciBzaGFyZSBVUkxcblx0dHVtYmxyIChkYXRhKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybDogJ2h0dHBzOi8vd3d3LnR1bWJsci5jb20vd2lkZ2V0cy9zaGFyZS90b29sPycsXG5cdFx0XHRkYXRhOiBkYXRhLFxuXHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0d2lkdGg6IDU0MCxcblx0XHRcdFx0aGVpZ2h0OiA5NDBcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBSZWRkaXQgc2hhcmUgVVJMXG5cdHJlZGRpdCAoZGF0YSkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6ICdodHRwOi8vcmVkZGl0LmNvbS9zdWJtaXQ/Jyxcblx0XHRcdGRhdGE6IGRhdGEsXG5cdFx0XHRwb3B1cDoge1xuXHRcdFx0XHR3aWR0aDogODYwLFxuXHRcdFx0XHRoZWlnaHQ6IDg4MFxuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gc2V0IEZsaWNrciBmb2xsb3cgVVJMXG5cdGZsaWNrciAoZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHQvLyBpZiBpT1MgdXNlclxuXHRcdGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVybDogYGZsaWNrcjovL3Bob3Rvcy8ke2RhdGEudXNlcm5hbWV9P2Bcblx0XHRcdH07XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVybDogYGh0dHA6Ly93d3cuZmxpY2tyLmNvbS9waG90b3MvJHtkYXRhLnVzZXJuYW1lfT9gLFxuXHRcdFx0XHRwb3B1cDoge1xuXHRcdFx0XHRcdHdpZHRoOiA2MDAsXG5cdFx0XHRcdFx0aGVpZ2h0OiA2NTBcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9XG5cdH0sXG5cblx0Ly8gc2V0IFdoYXRzQXBwIHNoYXJlIFVSTFxuXHR3aGF0c2FwcCAoZGF0YSkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6ICd3aGF0c2FwcDovL3NlbmQ/Jyxcblx0XHRcdGRhdGE6IGRhdGFcblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBzbXMgc2hhcmUgVVJMXG5cdHNtcyAoZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsOiBpb3MgPyAnc21zOiYnIDogJ3Ntczo/Jyxcblx0XHRcdGRhdGE6IGRhdGFcblx0XHR9O1xuXHR9LFxuXG5cdC8vIHNldCBFbWFpbCBzaGFyZSBVUkxcblx0ZW1haWwgKGRhdGEpIHtcblxuXHRcdHZhciB1cmwgPSBgbWFpbHRvOmA7XG5cblx0XHQvLyBpZiB0byBhZGRyZXNzIHNwZWNpZmllZCB0aGVuIGFkZCB0byBVUkxcblx0XHRpZiAoZGF0YS50byAhPT0gbnVsbCkge1xuXHRcdFx0dXJsICs9IGAke2RhdGEudG99YDtcblx0XHR9XG5cblx0XHR1cmwgKz0gYD9gO1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybDogdXJsLFxuXHRcdFx0ZGF0YToge1xuXHRcdFx0XHRzdWJqZWN0OiBkYXRhLnN1YmplY3QsXG5cdFx0XHRcdGJvZHk6IGRhdGEuYm9keVxuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gc2V0IEdpdGh1YiBmb3JrIFVSTFxuXHRnaXRodWIgKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG5cdFx0bGV0IHVybCA9IGRhdGEucmVwbyA/XG5cdFx0XHRgaHR0cHM6Ly9naXRodWIuY29tLyR7ZGF0YS5yZXBvfWAgOlxuXHRcdFx0ZGF0YS51cmw7XG5cblx0XHRpZiAoZGF0YS5pc3N1ZSkge1xuXHRcdFx0dXJsICs9ICcvaXNzdWVzL25ldz90aXRsZT0nICtcblx0XHRcdFx0ZGF0YS5pc3N1ZSArXG5cdFx0XHRcdCcmYm9keT0nICtcblx0XHRcdFx0ZGF0YS5ib2R5O1xuXHRcdH1cblxuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6IHVybCArICc/Jyxcblx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdHdpZHRoOiAxMDIwLFxuXHRcdFx0XHRoZWlnaHQ6IDMyM1xuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Ly8gc2V0IERyaWJiYmxlIHNoYXJlIFVSTFxuXHRkcmliYmJsZSAoZGF0YSwgaW9zID0gZmFsc2UpIHtcblx0XHRjb25zdCB1cmwgPSBkYXRhLnNob3QgP1xuXHRcdFx0YGh0dHBzOi8vZHJpYmJibGUuY29tL3Nob3RzLyR7ZGF0YS5zaG90fT9gIDpcblx0XHRcdGRhdGEudXJsICsgJz8nO1xuXHRcdHJldHVybiB7XG5cdFx0XHR1cmw6IHVybCxcblx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdHdpZHRoOiA0NDAsXG5cdFx0XHRcdGhlaWdodDogNjQwXG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHRjb2RlcGVuIChkYXRhKSB7XG5cdFx0Y29uc3QgdXJsID0gKGRhdGEucGVuICYmIGRhdGEudXNlcm5hbWUgJiYgZGF0YS52aWV3KSA/XG5cdFx0XHRgaHR0cHM6Ly9jb2RlcGVuLmlvLyR7ZGF0YS51c2VybmFtZX0vJHtkYXRhLnZpZXd9LyR7ZGF0YS5wZW59P2AgOlxuXHRcdFx0ZGF0YS51cmwgKyAnPyc7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybDogdXJsLFxuXHRcdFx0cG9wdXA6IHtcblx0XHRcdFx0d2lkdGg6IDEyMDAsXG5cdFx0XHRcdGhlaWdodDogODAwXG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHRwYXlwYWwgKGRhdGEpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0ZGF0YTogZGF0YVxuXHRcdH07XG5cdH1cbn07XG4iXX0=
