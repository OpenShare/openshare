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
		key: osElement.getAttribute('data-open-share-key')
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
  //eslint-disable-line
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
  //eslint-disable-line
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
        var posts = JSON.parse(xhr.responseText).data.children;
        var ups = 0;

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
    //eslint-disable-line
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
var storeCount = require('../../lib/storeCount'); // eslint-disable-line no-unused-vars

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
          } else if (countData.url.toLowerCase().indexOf('https://api.openshare.social/job?') === 0) {
            console.error('Please sign up for Twitter counts at https://openshare.social/twitter/auth');
          } else {
            console.error('Failed to get API data from', countData.url, '. Please use the latest version of OpenShare.');
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
      //eslint-disable-line
      if (!window.localStorage || !type) {
        return;
      }

      localStorage.setItem('OpenShare-' + type, count);
    }
  }, {
    key: 'storeGet',
    value: function storeGet(type) {
      //eslint-disable-line
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
  //eslint-disable-line
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
    value: function share() {
      var _this = this;

      // if iOS share URL has been set then use timeout hack
      // test for native app and fall back to web
      if (this.mobileShareUrl) {
        (function () {
          var start = new Date().valueOf();

          setTimeout(function () {
            var end = new Date().valueOf();

            // if the user is still here, fall back to web
            if (end - start > 1600) {
              return;
            }

            window.location = _this.shareUrl;
          }, 1500);

          window.location = _this.mobileShareUrl;

          // open mailto links in same window
        })();
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
      //eslint-disable-line
      var nonURLProps = ['appendTo', 'innerHTML', 'classes'];

      var shareUrl = url,
          i = void 0;

      for (i in data) {
        // only append valid properties
        if (!data[i] || nonURLProps.indexOf(i) > -1) {
          continue; //eslint-disable-line
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
      //eslint-disable-line
      var dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : screen.left,
          dualScreenTop = window.screenTop !== undefined ? window.screenTop : screen.top,
          width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width,
          //eslint-disable-line
      height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height,
          //eslint-disable-line
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
  //eslint-disable-line
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
        element.addEventListener('click', function () {
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
        var action = data.sandbox ? 'https://www.sandbox.paypal.com/cgi-bin/webscr' : 'https://www.paypal.com/cgi-bin/webscr';

        var buyGIF = data.sandbox ? 'https://www.sandbox.paypal.com/en_US/i/btn/btn_buynow_LG.gif' : 'https://www.paypalobjects.com/en_US/i/btn/btn_buynow_LG.gif';

        var pixelGIF = data.sandbox ? 'https://www.sandbox.paypal.com/en_US/i/scr/pixel.gif' : 'https://www.paypalobjects.com/en_US/i/scr/pixel.gif';

        var paypalButton = '<form action=' + action + ' method="post" target="_blank">\n\n        <!-- Saved buttons use the "secure click" command -->\n        <input type="hidden" name="cmd" value="_s-xclick">\n\n        <!-- Saved buttons are identified by their button IDs -->\n        <input type="hidden" name="hosted_button_id" value="' + data.buttonId + '">\n\n        <!-- Saved buttons display an appropriate button image. -->\n        <input type="image" name="submit"\n        src=' + buyGIF + '\n        alt="PayPal - The safer, easier way to pay online">\n        <img alt="" width="1" height="1"\n        src=' + pixelGIF + ' >\n\n        </form>';

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
          //eslint-disable-next-line
          this.os.setData(data); // data is not defined
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
        screen_name: data.screenName
      } : {
        id: data.userId
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
    }

    return {
      url: 'https://www.youtube.com/watch?v=' + data.video + '?',
      popup: {
        width: 1086,
        height: 608
      }
    };
  },


  // set YouTube subcribe URL
  youtubeSubscribe: function youtubeSubscribe(data) {
    var ios = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    // if iOS user
    if (ios && data.ios) {
      return {
        url: 'youtube://www.youtube.com/user/' + data.user + '?'
      };
    }

    return {
      url: 'https://www.youtube.com/user/' + data.user + '?',
      popup: {
        width: 880,
        height: 350
      }
    };
  },


  // set Instagram follow URL
  instagram: function instagram() {
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
    }

    return {
      url: 'http://www.instagram.com/' + data.username + '?',
      popup: {
        width: 980,
        height: 655
      }
    };
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
    }
    return {
      url: 'http://www.flickr.com/photos/' + data.username + '?',
      popup: {
        width: 600,
        height: 650
      }
    };
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
    // eslint-disable-line no-unused-vars
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
    // eslint-disable-line no-unused-vars
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiYW5hbHl0aWNzLmpzIiwibGliL2NvdW50UmVkdWNlLmpzIiwibGliL2Rhc2hUb0NhbWVsLmpzIiwibGliL2luaXQuanMiLCJsaWIvaW5pdGlhbGl6ZUNvdW50Tm9kZS5qcyIsImxpYi9pbml0aWFsaXplTm9kZXMuanMiLCJsaWIvaW5pdGlhbGl6ZVNoYXJlTm9kZS5qcyIsImxpYi9pbml0aWFsaXplV2F0Y2hlci5qcyIsImxpYi9zZXREYXRhLmpzIiwibGliL3NoYXJlLmpzIiwibGliL3N0b3JlQ291bnQuanMiLCJzcmMvYnJvd3Nlci5qcyIsInNyYy9tb2R1bGVzL2NvdW50LWFwaS5qcyIsInNyYy9tb2R1bGVzL2NvdW50LXRyYW5zZm9ybXMuanMiLCJzcmMvbW9kdWxlcy9jb3VudC5qcyIsInNyYy9tb2R1bGVzL2RhdGEtYXR0ci5qcyIsInNyYy9tb2R1bGVzL2V2ZW50cy5qcyIsInNyYy9tb2R1bGVzL29wZW4tc2hhcmUuanMiLCJzcmMvbW9kdWxlcy9zaGFyZS1hcGkuanMiLCJzcmMvbW9kdWxlcy9zaGFyZS10cmFuc2Zvcm1zLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxPQUFPLE9BQVAsR0FBaUIsVUFBVSxJQUFWLEVBQWdCLEVBQWhCLEVBQW9CO0FBQ3BDLEtBQU0sT0FBTyxTQUFTLE9BQVQsSUFBb0IsU0FBUyxRQUExQztBQUNBLEtBQU0sZUFBZSxTQUFTLFlBQTlCOztBQUVBLEtBQUksSUFBSixFQUFVLHVCQUF1QixJQUF2QixFQUE2QixFQUE3QjtBQUNWLEtBQUksWUFBSixFQUFrQixjQUFjLEVBQWQ7QUFDbEIsQ0FORDs7QUFRQSxTQUFTLHNCQUFULENBQWdDLElBQWhDLEVBQXNDLEVBQXRDLEVBQTBDO0FBQ3pDLEtBQUksT0FBTyxFQUFYLEVBQWU7QUFDWixNQUFJLEVBQUosRUFBUTtBQUNSO0FBQ0Es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clhRLEVBcVhXO0FBQUEsUUFBYixHQUFhLHVFQUFQLEtBQU87QUFBRTtBQUMxQixRQUFJLE1BQU0sS0FBSyxJQUFMLDJCQUFrQyxLQUFLLElBQXZDLEdBQWdELEtBQUssR0FBL0Q7O0FBRUEsUUFBSSxLQUFLLEtBQVQsRUFBZ0I7QUFDZCxvQ0FBNEIsS0FBSyxLQUFqQyxjQUErQyxLQUFLLElBQXBEO0FBQ0Q7O0FBRUQsV0FBTztBQUNMLFdBQVEsR0FBUixNQURLO0FBRUwsYUFBTztBQUNMLGVBQU8sSUFERjtBQUVMLGdCQUFRO0FBRkg7QUFGRixLQUFQO0FBT0QsR0FuWWM7OztBQXFZZjtBQUNBLFVBdFllLG9CQXNZTixJQXRZTSxFQXNZYTtBQUFBLFFBQWIsR0FBYSx1RUFBUCxLQUFPO0FBQUU7QUFDNUIsUUFBTSxNQUFNLEtBQUssSUFBTCxtQ0FBMEMsS0FBSyxJQUEvQyxTQUE0RCxLQUFLLEdBQWpFLE1BQVo7QUFDQSxXQUFPO0FBQ0wsY0FESztBQUVMLGFBQU87QUFDTCxlQUFPLEdBREY7QUFFTCxnQkFBUTtBQUZIO0FBRkYsS0FBUDtBQU9ELEdBL1ljO0FBaVpmLFNBalplLG1CQWlaUCxJQWpaTyxFQWlaRDtBQUNaLFFBQU0sTUFBTyxLQUFLLEdBQUwsSUFBWSxLQUFLLFFBQWpCLElBQTZCLEtBQUssSUFBbkMsMkJBQWlFLEtBQUssUUFBdEUsU0FBa0YsS0FBSyxJQUF2RixTQUErRixLQUFLLEdBQXBHLFNBQWdILEtBQUssR0FBckgsTUFBWjtBQUNBLFdBQU87QUFDTCxjQURLO0FBRUwsYUFBTztBQUNMLGVBQU8sSUFERjtBQUVMLGdCQUFRO0FBRkg7QUFGRixLQUFQO0FBT0QsR0ExWmM7QUE0WmYsUUE1WmUsa0JBNFpSLElBNVpRLEVBNFpGO0FBQ1gsV0FBTztBQUNMO0FBREssS0FBUDtBQUdEO0FBaGFjLENBQWpCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHR5cGUsIGNiKSB7XG5cdGNvbnN0IGlzR0EgPSB0eXBlID09PSAnZXZlbnQnIHx8IHR5cGUgPT09ICdzb2NpYWwnO1xuXHRjb25zdCBpc1RhZ01hbmFnZXIgPSB0eXBlID09PSAndGFnTWFuYWdlcic7XG5cblx0aWYgKGlzR0EpIGNoZWNrSWZBbmFseXRpY3NMb2FkZWQodHlwZSwgY2IpO1xuXHRpZiAoaXNUYWdNYW5hZ2VyKSBzZXRUYWdNYW5hZ2VyKGNiKTtcbn07XG5cbmZ1bmN0aW9uIGNoZWNrSWZBbmFseXRpY3NMb2FkZWQodHlwZSwgY2IpIHtcblx0aWYgKHdpbmRvdy5nYSkge1xuXHRcdCAgaWYgKGNiKSBjYigpO1xuXHRcdCAgLy8gYmluZCB0byBzaGFyZWQgZXZlbnQgb24gZWFjaCBpbmRpdmlkdWFsIG5vZGVcblx0XHQgIGxpc3RlbihmdW5jdGlvbiAoZSkge1xuXHRcdFx0Y29uc3QgcGxhdGZvcm0gPSBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZScpO1xuXHRcdFx0Y29uc3QgdGFyZ2V0ID0gZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtbGluaycpIHx8XG5cdFx0XHRcdGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXVybCcpIHx8XG5cdFx0XHRcdGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXVzZXJuYW1lJykgfHxcblx0XHRcdCAgICBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jZW50ZXInKSB8fFxuXHRcdFx0XHRlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1zZWFyY2gnKSB8fFxuXHRcdFx0XHRlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1ib2R5Jyk7XG5cblx0XHRcdGlmICh0eXBlID09PSAnZXZlbnQnKSB7XG5cdFx0XHRcdGdhKCdzZW5kJywgJ2V2ZW50Jywge1xuXHRcdFx0XHRcdGV2ZW50Q2F0ZWdvcnk6ICdPcGVuU2hhcmUgQ2xpY2snLFxuXHRcdFx0XHRcdGV2ZW50QWN0aW9uOiBwbGF0Zm9ybSxcblx0XHRcdFx0XHRldmVudExhYmVsOiB0YXJnZXQsXG5cdFx0XHRcdFx0dHJhbnNwb3J0OiAnYmVhY29uJ1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHR5cGUgPT09ICdzb2NpYWwnKSB7XG5cdFx0XHRcdGdhKCdzZW5kJywge1xuXHRcdFx0XHRcdGhpdFR5cGU6ICdzb2NpYWwnLFxuXHRcdFx0XHRcdHNvY2lhbE5ldHdvcms6IHBsYXRmb3JtLFxuXHRcdFx0XHRcdHNvY2lhbEFjdGlvbjogJ3NoYXJlJyxcblx0XHRcdFx0XHRzb2NpYWxUYXJnZXQ6IHRhcmdldFxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHR9XG5cdGVsc2Uge1xuXHRcdHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXHRcdFx0Y2hlY2tJZkFuYWx5dGljc0xvYWRlZCh0eXBlLCBjYik7XG5cdCAgXHR9LCAxMDAwKTtcblx0fVxufVxuXG5mdW5jdGlvbiBzZXRUYWdNYW5hZ2VyIChjYikge1xuXG5cdGlmICh3aW5kb3cuZGF0YUxheWVyICYmIHdpbmRvdy5kYXRhTGF5ZXJbMF1bJ2d0bS5zdGFydCddKSB7XG5cdFx0aWYgKGNiKSBjYigpO1xuXG5cdFx0bGlzdGVuKG9uU2hhcmVUYWdNYW5nZXIpO1xuXG5cdFx0Z2V0Q291bnRzKGZ1bmN0aW9uKGUpIHtcblx0XHRcdGNvbnN0IGNvdW50ID0gZS50YXJnZXQgP1xuXHRcdFx0ICBlLnRhcmdldC5pbm5lckhUTUwgOlxuXHRcdFx0ICBlLmlubmVySFRNTDtcblxuXHRcdFx0Y29uc3QgcGxhdGZvcm0gPSBlLnRhcmdldCA/XG5cdFx0XHQgICBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudC11cmwnKSA6XG5cdFx0XHQgICBlLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50LXVybCcpO1xuXG5cdFx0XHR3aW5kb3cuZGF0YUxheWVyLnB1c2goe1xuXHRcdFx0XHQnZXZlbnQnIDogJ09wZW5TaGFyZSBDb3VudCcsXG5cdFx0XHRcdCdwbGF0Zm9ybSc6IHBsYXRmb3JtLFxuXHRcdFx0XHQncmVzb3VyY2UnOiBjb3VudCxcblx0XHRcdFx0J2FjdGl2aXR5JzogJ2NvdW50J1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH0gZWxzZSB7XG5cdFx0c2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG5cdFx0XHRzZXRUYWdNYW5hZ2VyKGNiKTtcblx0XHR9LCAxMDAwKTtcblx0fVxufVxuXG5mdW5jdGlvbiBsaXN0ZW4gKGNiKSB7XG5cdC8vIGJpbmQgdG8gc2hhcmVkIGV2ZW50IG9uIGVhY2ggaW5kaXZpZHVhbCBub2RlXG5cdFtdLmZvckVhY2guY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1vcGVuLXNoYXJlXScpLCBmdW5jdGlvbihub2RlKSB7XG5cdFx0bm9kZS5hZGRFdmVudExpc3RlbmVyKCdPcGVuU2hhcmUuc2hhcmVkJywgY2IpO1xuXHR9KTtcbn1cblxuZnVuY3Rpb24gZ2V0Q291bnRzIChjYikge1xuXHR2YXIgY291bnROb2RlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtb3Blbi1zaGFyZS1jb3VudF0nKTtcblxuXHRbXS5mb3JFYWNoLmNhbGwoY291bnROb2RlLCBmdW5jdGlvbihub2RlKSB7XG5cdFx0aWYgKG5vZGUudGV4dENvbnRlbnQpIGNiKG5vZGUpO1xuXHRcdGVsc2Ugbm9kZS5hZGRFdmVudExpc3RlbmVyKCdPcGVuU2hhcmUuY291bnRlZC0nICsgbm9kZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudC11cmwnKSwgY2IpO1xuXHR9KTtcbn1cblxuZnVuY3Rpb24gb25TaGFyZVRhZ01hbmdlciAoZSkge1xuXHRjb25zdCBwbGF0Zm9ybSA9IGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlJyk7XG5cdGNvbnN0IHRhcmdldCA9IGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWxpbmsnKSB8fFxuXHRcdGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXVybCcpIHx8XG5cdFx0ZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdXNlcm5hbWUnKSB8fFxuXHRcdGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNlbnRlcicpIHx8XG5cdFx0ZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtc2VhcmNoJykgfHxcblx0XHRlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1ib2R5Jyk7XG5cblx0d2luZG93LmRhdGFMYXllci5wdXNoKHtcblx0XHQnZXZlbnQnIDogJ09wZW5TaGFyZSBTaGFyZScsXG5cdFx0J3BsYXRmb3JtJzogcGxhdGZvcm0sXG5cdFx0J3Jlc291cmNlJzogdGFyZ2V0LFxuXHRcdCdhY3Rpdml0eSc6ICdzaGFyZSdcblx0fSk7XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGNvdW50UmVkdWNlO1xuXG5mdW5jdGlvbiByb3VuZCh4LCBwcmVjaXNpb24pIHtcblx0aWYgKHR5cGVvZiB4ICE9PSAnbnVtYmVyJykge1xuXHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIHZhbHVlIHRvIGJlIGEgbnVtYmVyJyk7XG5cdH1cblxuXHR2YXIgZXhwb25lbnQgPSBwcmVjaXNpb24gPiAwID8gJ2UnIDogJ2UtJztcblx0dmFyIGV4cG9uZW50TmVnID0gcHJlY2lzaW9uID4gMCA/ICdlLScgOiAnZSc7XG5cdHByZWNpc2lvbiA9IE1hdGguYWJzKHByZWNpc2lvbik7XG5cblx0cmV0dXJuIE51bWJlcihNYXRoLnJvdW5kKHggKyBleHBvbmVudCArIHByZWNpc2lvbikgKyBleHBvbmVudE5lZyArIHByZWNpc2lvbik7XG59XG5cbmZ1bmN0aW9uIHRob3VzYW5kaWZ5IChudW0pIHtcblx0cmV0dXJuIHJvdW5kKG51bS8xMDAwLCAxKSArICdLJztcbn1cblxuZnVuY3Rpb24gbWlsbGlvbmlmeSAobnVtKSB7XG5cdHJldHVybiByb3VuZChudW0vMTAwMDAwMCwgMSkgKyAnTSc7XG59XG5cbmZ1bmN0aW9uIGNvdW50UmVkdWNlIChlbCwgY291bnQsIGNiKSB7XG5cdGlmIChjb3VudCA+IDk5OTk5OSkgIHtcblx0XHRlbC5pbm5lckhUTUwgPSBtaWxsaW9uaWZ5KGNvdW50KTtcblx0XHRpZiAoY2IgICYmIHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykgY2IoZWwpO1xuXHR9IGVsc2UgaWYgKGNvdW50ID4gOTk5KSB7XG5cdFx0ZWwuaW5uZXJIVE1MID0gdGhvdXNhbmRpZnkoY291bnQpO1xuXHRcdGlmIChjYiAgJiYgdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSBjYihlbCk7XG5cdH0gZWxzZSB7XG5cdFx0ZWwuaW5uZXJIVE1MID0gY291bnQ7XG5cdFx0aWYgKGNiICAmJiB0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpIGNiKGVsKTtcblx0fVxufVxuIiwiLy8gdHlwZSBjb250YWlucyBhIGRhc2hcbi8vIHRyYW5zZm9ybSB0byBjYW1lbGNhc2UgZm9yIGZ1bmN0aW9uIHJlZmVyZW5jZVxuLy8gVE9ETzogb25seSBzdXBwb3J0cyBzaW5nbGUgZGFzaCwgc2hvdWxkIHNob3VsZCBzdXBwb3J0IG11bHRpcGxlXG5tb2R1bGUuZXhwb3J0cyA9IChkYXNoLCB0eXBlKSA9PiB7XG5cdGxldCBuZXh0Q2hhciA9IHR5cGUuc3Vic3RyKGRhc2ggKyAxLCAxKSxcblx0XHRncm91cCA9IHR5cGUuc3Vic3RyKGRhc2gsIDIpO1xuXG5cdHR5cGUgPSB0eXBlLnJlcGxhY2UoZ3JvdXAsIG5leHRDaGFyLnRvVXBwZXJDYXNlKCkpO1xuXHRyZXR1cm4gdHlwZTtcbn07XG4iLCJjb25zdCBpbml0aWFsaXplTm9kZXMgPSByZXF1aXJlKCcuL2luaXRpYWxpemVOb2RlcycpO1xuY29uc3QgaW5pdGlhbGl6ZVdhdGNoZXIgPSByZXF1aXJlKCcuL2luaXRpYWxpemVXYXRjaGVyJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gaW5pdDtcblxuZnVuY3Rpb24gaW5pdChvcHRzKSB7XG5cdHJldHVybiAoKSA9PiB7XG5cdFx0Y29uc3QgaW5pdE5vZGVzID0gaW5pdGlhbGl6ZU5vZGVzKHtcblx0XHRcdGFwaTogb3B0cy5hcGkgfHwgbnVsbCxcblx0XHRcdGNvbnRhaW5lcjogb3B0cy5jb250YWluZXIgfHwgZG9jdW1lbnQsXG5cdFx0XHRzZWxlY3Rvcjogb3B0cy5zZWxlY3Rvcixcblx0XHRcdGNiOiBvcHRzLmNiXG5cdFx0fSk7XG5cblx0XHRpbml0Tm9kZXMoKTtcblxuXHRcdC8vIGNoZWNrIGZvciBtdXRhdGlvbiBvYnNlcnZlcnMgYmVmb3JlIHVzaW5nLCBJRTExIG9ubHlcblx0XHRpZiAod2luZG93Lk11dGF0aW9uT2JzZXJ2ZXIgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0aW5pdGlhbGl6ZVdhdGNoZXIoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtb3Blbi1zaGFyZS13YXRjaF0nKSwgaW5pdE5vZGVzKTtcblx0XHR9XG5cdH07XG59XG4iLCJjb25zdCBDb3VudCA9IHJlcXVpcmUoJy4uL3NyYy9tb2R1bGVzL2NvdW50Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gaW5pdGlhbGl6ZUNvdW50Tm9kZTtcblxuZnVuY3Rpb24gaW5pdGlhbGl6ZUNvdW50Tm9kZShvcykge1xuXHQvLyBpbml0aWFsaXplIG9wZW4gc2hhcmUgb2JqZWN0IHdpdGggdHlwZSBhdHRyaWJ1dGVcblx0bGV0IHR5cGUgPSBvcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudCcpLFxuXHRcdHVybCA9IG9zLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50LXJlcG8nKSB8fFxuXHRcdFx0b3MuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY291bnQtc2hvdCcpIHx8XG5cdFx0XHRvcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudC11cmwnKSxcblx0XHRjb3VudCA9IG5ldyBDb3VudCh0eXBlLCB1cmwpO1xuXG5cdGNvdW50LmNvdW50KG9zKTtcblx0b3Muc2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtbm9kZScsIHR5cGUpO1xufVxuIiwiY29uc3QgRXZlbnRzID0gcmVxdWlyZSgnLi4vc3JjL21vZHVsZXMvZXZlbnRzJyk7XG5jb25zdCBhbmFseXRpY3MgPSByZXF1aXJlKCcuLi9hbmFseXRpY3MnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGluaXRpYWxpemVOb2RlcztcblxuZnVuY3Rpb24gaW5pdGlhbGl6ZU5vZGVzKG9wdHMpIHtcblx0Ly8gbG9vcCB0aHJvdWdoIG9wZW4gc2hhcmUgbm9kZSBjb2xsZWN0aW9uXG5cdHJldHVybiAoKSA9PiB7XG5cdFx0Ly8gY2hlY2sgZm9yIGFuYWx5dGljc1xuXHRcdGNoZWNrQW5hbHl0aWNzKCk7XG5cblx0XHRpZiAob3B0cy5hcGkpIHtcblx0XHRcdGxldCBub2RlcyA9IG9wdHMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwob3B0cy5zZWxlY3Rvcik7XG5cdFx0XHRbXS5mb3JFYWNoLmNhbGwobm9kZXMsIG9wdHMuY2IpO1xuXG5cdFx0XHQvLyB0cmlnZ2VyIGNvbXBsZXRlZCBldmVudFxuXHRcdFx0RXZlbnRzLnRyaWdnZXIoZG9jdW1lbnQsIG9wdHMuYXBpICsgJy1sb2FkZWQnKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gbG9vcCB0aHJvdWdoIG9wZW4gc2hhcmUgbm9kZSBjb2xsZWN0aW9uXG5cdFx0XHRsZXQgc2hhcmVOb2RlcyA9IG9wdHMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwob3B0cy5zZWxlY3Rvci5zaGFyZSk7XG5cdFx0XHRbXS5mb3JFYWNoLmNhbGwoc2hhcmVOb2Rlcywgb3B0cy5jYi5zaGFyZSk7XG5cblx0XHRcdC8vIHRyaWdnZXIgY29tcGxldGVkIGV2ZW50XG5cdFx0XHRFdmVudHMudHJpZ2dlcihkb2N1bWVudCwgJ3NoYXJlLWxvYWRlZCcpO1xuXG5cdFx0XHQvLyBsb29wIHRocm91Z2ggY291bnQgbm9kZSBjb2xsZWN0aW9uXG5cdFx0XHRsZXQgY291bnROb2RlcyA9IG9wdHMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwob3B0cy5zZWxlY3Rvci5jb3VudCk7XG5cdFx0XHRbXS5mb3JFYWNoLmNhbGwoY291bnROb2Rlcywgb3B0cy5jYi5jb3VudCk7XG5cblx0XHRcdC8vIHRyaWdnZXIgY29tcGxldGVkIGV2ZW50XG5cdFx0XHRFdmVudHMudHJpZ2dlcihkb2N1bWVudCwgJ2NvdW50LWxvYWRlZCcpO1xuXHRcdH1cblx0fTtcbn1cblxuZnVuY3Rpb24gY2hlY2tBbmFseXRpY3MgKCkge1xuXHQvLyBjaGVjayBmb3IgYW5hbHl0aWNzXG5cdGlmIChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbZGF0YS1vcGVuLXNoYXJlLWFuYWx5dGljc10nKSkge1xuXHRcdGNvbnN0IHByb3ZpZGVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignW2RhdGEtb3Blbi1zaGFyZS1hbmFseXRpY3NdJylcblx0XHRcdC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1hbmFseXRpY3MnKTtcblxuXHRcdGlmIChwcm92aWRlci5pbmRleE9mKCcsJykgPiAtMSkge1xuXHRcdFx0Y29uc3QgcHJvdmlkZXJzID0gcHJvdmlkZXIuc3BsaXQoJywnKTtcblx0XHRcdHByb3ZpZGVycy5mb3JFYWNoKHAgPT4gYW5hbHl0aWNzKHApKTtcblx0XHR9IGVsc2UgYW5hbHl0aWNzKHByb3ZpZGVyKTtcblxuXHR9XG59XG4iLCJjb25zdCBTaGFyZVRyYW5zZm9ybXMgPSByZXF1aXJlKCcuLi9zcmMvbW9kdWxlcy9zaGFyZS10cmFuc2Zvcm1zJyk7XG5jb25zdCBPcGVuU2hhcmUgPSByZXF1aXJlKCcuLi9zcmMvbW9kdWxlcy9vcGVuLXNoYXJlJyk7XG5jb25zdCBzZXREYXRhID0gcmVxdWlyZSgnLi9zZXREYXRhJyk7XG5jb25zdCBzaGFyZSA9IHJlcXVpcmUoJy4vc2hhcmUnKTtcbmNvbnN0IGRhc2hUb0NhbWVsID0gcmVxdWlyZSgnLi9kYXNoVG9DYW1lbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGluaXRpYWxpemVTaGFyZU5vZGU7XG5cbmZ1bmN0aW9uIGluaXRpYWxpemVTaGFyZU5vZGUob3MpIHtcblx0Ly8gaW5pdGlhbGl6ZSBvcGVuIHNoYXJlIG9iamVjdCB3aXRoIHR5cGUgYXR0cmlidXRlXG5cdGxldCB0eXBlID0gb3MuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUnKSxcblx0XHRkYXNoID0gdHlwZS5pbmRleE9mKCctJyksXG5cdFx0b3BlblNoYXJlO1xuXG5cdGlmIChkYXNoID4gLTEpIHtcblx0XHR0eXBlID0gZGFzaFRvQ2FtZWwoZGFzaCwgdHlwZSk7XG5cdH1cblxuXHRsZXQgdHJhbnNmb3JtID0gU2hhcmVUcmFuc2Zvcm1zW3R5cGVdO1xuXG5cdGlmICghdHJhbnNmb3JtKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKGBPcGVuIFNoYXJlOiAke3R5cGV9IGlzIGFuIGludmFsaWQgdHlwZWApO1xuXHR9XG5cblx0b3BlblNoYXJlID0gbmV3IE9wZW5TaGFyZSh0eXBlLCB0cmFuc2Zvcm0pO1xuXG5cdC8vIHNwZWNpZnkgaWYgdGhpcyBpcyBhIGR5bmFtaWMgaW5zdGFuY2Vcblx0aWYgKG9zLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWR5bmFtaWMnKSkge1xuXHRcdG9wZW5TaGFyZS5keW5hbWljID0gdHJ1ZTtcblx0fVxuXG5cdC8vIHNwZWNpZnkgaWYgdGhpcyBpcyBhIHBvcHVwIGluc3RhbmNlXG5cdGlmIChvcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1wb3B1cCcpKSB7XG5cdFx0b3BlblNoYXJlLnBvcHVwID0gdHJ1ZTtcblx0fVxuXG5cdC8vIHNldCBhbGwgb3B0aW9uYWwgYXR0cmlidXRlcyBvbiBvcGVuIHNoYXJlIGluc3RhbmNlXG5cdHNldERhdGEob3BlblNoYXJlLCBvcyk7XG5cblx0Ly8gb3BlbiBzaGFyZSBkaWFsb2cgb24gY2xpY2tcblx0b3MuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuXHRcdHNoYXJlKGUsIG9zLCBvcGVuU2hhcmUpO1xuXHR9KTtcblxuXHRvcy5hZGRFdmVudExpc3RlbmVyKCdPcGVuU2hhcmUudHJpZ2dlcicsIChlKSA9PiB7XG5cdFx0c2hhcmUoZSwgb3MsIG9wZW5TaGFyZSk7XG5cdH0pO1xuXG5cdG9zLnNldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLW5vZGUnLCB0eXBlKTtcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gaW5pdGlhbGl6ZVdhdGNoZXI7XG5cbmZ1bmN0aW9uIGluaXRpYWxpemVXYXRjaGVyKHdhdGNoZXIsIGZuKSB7XG5cdFtdLmZvckVhY2guY2FsbCh3YXRjaGVyLCAodykgPT4ge1xuXHRcdHZhciBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKChtdXRhdGlvbnMpID0+IHtcblx0XHRcdC8vIHRhcmdldCB3aWxsIG1hdGNoIGJldHdlZW4gYWxsIG11dGF0aW9ucyBzbyBqdXN0IHVzZSBmaXJzdFxuXHRcdFx0Zm4obXV0YXRpb25zWzBdLnRhcmdldCk7XG5cdFx0fSk7XG5cblx0XHRvYnNlcnZlci5vYnNlcnZlKHcsIHtcblx0XHRcdGNoaWxkTGlzdDogdHJ1ZVxuXHRcdH0pO1xuXHR9KTtcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gc2V0RGF0YTtcblxuZnVuY3Rpb24gc2V0RGF0YShvc0luc3RhbmNlLCBvc0VsZW1lbnQpIHtcblx0b3NJbnN0YW5jZS5zZXREYXRhKHtcblx0XHR1cmw6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS11cmwnKSxcblx0XHR0ZXh0OiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdGV4dCcpLFxuXHRcdHZpYTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXZpYScpLFxuXHRcdGhhc2h0YWdzOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtaGFzaHRhZ3MnKSxcblx0XHR0d2VldElkOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdHdlZXQtaWQnKSxcblx0XHRyZWxhdGVkOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtcmVsYXRlZCcpLFxuXHRcdHNjcmVlbk5hbWU6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1zY3JlZW4tbmFtZScpLFxuXHRcdHVzZXJJZDogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXVzZXItaWQnKSxcblx0XHRsaW5rOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtbGluaycpLFxuXHRcdHBpY3R1cmU6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1waWN0dXJlJyksXG5cdFx0Y2FwdGlvbjogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNhcHRpb24nKSxcblx0XHRkZXNjcmlwdGlvbjogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWRlc2NyaXB0aW9uJyksXG5cdFx0dXNlcjogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXVzZXInKSxcblx0XHR2aWRlbzogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXZpZGVvJyksXG5cdFx0dXNlcm5hbWU6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS11c2VybmFtZScpLFxuXHRcdHRpdGxlOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdGl0bGUnKSxcblx0XHRtZWRpYTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLW1lZGlhJyksXG5cdFx0dG86IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS10bycpLFxuXHRcdHN1YmplY3Q6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1zdWJqZWN0JyksXG5cdFx0Ym9keTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWJvZHknKSxcblx0XHRpb3M6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1pb3MnKSxcblx0XHR0eXBlOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdHlwZScpLFxuXHRcdGNlbnRlcjogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNlbnRlcicpLFxuXHRcdHZpZXdzOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdmlld3MnKSxcblx0XHR6b29tOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtem9vbScpLFxuXHRcdHNlYXJjaDogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXNlYXJjaCcpLFxuXHRcdHNhZGRyOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtc2FkZHInKSxcblx0XHRkYWRkcjogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWRhZGRyJyksXG5cdFx0ZGlyZWN0aW9uc21vZGU6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1kaXJlY3Rpb25zLW1vZGUnKSxcblx0XHRyZXBvOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtcmVwbycpLFxuXHRcdHNob3Q6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1zaG90JyksXG5cdFx0cGVuOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtcGVuJyksXG5cdFx0dmlldzogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXZpZXcnKSxcblx0XHRpc3N1ZTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWlzc3VlJyksXG5cdFx0YnV0dG9uSWQ6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1idXR0b25JZCcpLFxuXHRcdHBvcFVwOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtcG9wdXAnKSxcblx0XHRrZXk6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1rZXknKVxuXHR9KTtcbn1cbiIsImNvbnN0IEV2ZW50cyA9IHJlcXVpcmUoJy4uL3NyYy9tb2R1bGVzL2V2ZW50cycpO1xuY29uc3Qgc2V0RGF0YSA9IHJlcXVpcmUoJy4vc2V0RGF0YScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNoYXJlO1xuXG5mdW5jdGlvbiBzaGFyZShlLCBvcywgb3BlblNoYXJlKSB7XG5cdC8vIGlmIGR5bmFtaWMgaW5zdGFuY2UgdGhlbiBmZXRjaCBhdHRyaWJ1dGVzIGFnYWluIGluIGNhc2Ugb2YgdXBkYXRlc1xuXHRpZiAob3BlblNoYXJlLmR5bmFtaWMpIHtcblx0XHRzZXREYXRhKG9wZW5TaGFyZSwgb3MpO1xuXHR9XG5cblx0b3BlblNoYXJlLnNoYXJlKGUpO1xuXG5cdC8vIHRyaWdnZXIgc2hhcmVkIGV2ZW50XG5cdEV2ZW50cy50cmlnZ2VyKG9zLCAnc2hhcmVkJyk7XG59XG4iLCIvKlxuICAgU29tZXRpbWVzIHNvY2lhbCBwbGF0Zm9ybXMgZ2V0IGNvbmZ1c2VkIGFuZCBkcm9wIHNoYXJlIGNvdW50cy5cbiAgIEluIHRoaXMgbW9kdWxlIHdlIGNoZWNrIGlmIHRoZSByZXR1cm5lZCBjb3VudCBpcyBsZXNzIHRoYW4gdGhlIGNvdW50IGluXG4gICBsb2NhbHN0b3JhZ2UuXG4gICBJZiB0aGUgbG9jYWwgY291bnQgaXMgZ3JlYXRlciB0aGFuIHRoZSByZXR1cm5lZCBjb3VudCxcbiAgIHdlIHN0b3JlIHRoZSBsb2NhbCBjb3VudCArIHRoZSByZXR1cm5lZCBjb3VudC5cbiAgIE90aGVyd2lzZSwgc3RvcmUgdGhlIHJldHVybmVkIGNvdW50LlxuKi9cblxubW9kdWxlLmV4cG9ydHMgPSAodCwgY291bnQpID0+IHtcblx0Y29uc3QgaXNBcnIgPSB0LnR5cGUuaW5kZXhPZignLCcpID4gLTE7XG5cdGNvbnN0IGxvY2FsID0gTnVtYmVyKHQuc3RvcmVHZXQodC50eXBlICsgJy0nICsgdC5zaGFyZWQpKTtcblxuXHRpZiAobG9jYWwgPiBjb3VudCAmJiAhaXNBcnIpIHtcblx0XHRjb25zdCBsYXRlc3RDb3VudCA9IE51bWJlcih0LnN0b3JlR2V0KHQudHlwZSArICctJyArIHQuc2hhcmVkICsgJy1sYXRlc3RDb3VudCcpKTtcblx0XHR0LnN0b3JlU2V0KHQudHlwZSArICctJyArIHQuc2hhcmVkICsgJy1sYXRlc3RDb3VudCcsIGNvdW50KTtcblxuXHRcdGNvdW50ID0gaXNOdW1lcmljKGxhdGVzdENvdW50KSAmJiBsYXRlc3RDb3VudCA+IDAgP1xuXHRcdFx0Y291bnQgKz0gbG9jYWwgLSBsYXRlc3RDb3VudCA6XG5cdFx0XHRjb3VudCArPSBsb2NhbDtcblxuXHR9XG5cblx0aWYgKCFpc0FycikgdC5zdG9yZVNldCh0LnR5cGUgKyAnLScgKyB0LnNoYXJlZCwgY291bnQpO1xuXHRyZXR1cm4gY291bnQ7XG59O1xuXG5mdW5jdGlvbiBpc051bWVyaWMobikge1xuICByZXR1cm4gIWlzTmFOKHBhcnNlRmxvYXQobikpICYmIGlzRmluaXRlKG4pO1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gKCkgeyAvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgY29uc3QgRGF0YUF0dHIgPSByZXF1aXJlKCcuL21vZHVsZXMvZGF0YS1hdHRyJyksXG4gICAgU2hhcmVBUEkgPSByZXF1aXJlKCcuL21vZHVsZXMvc2hhcmUtYXBpJyksXG4gICAgRXZlbnRzID0gcmVxdWlyZSgnLi9tb2R1bGVzL2V2ZW50cycpLFxuICAgIE9wZW5TaGFyZSA9IHJlcXVpcmUoJy4vbW9kdWxlcy9vcGVuLXNoYXJlJyksXG4gICAgU2hhcmVUcmFuc2Zvcm1zID0gcmVxdWlyZSgnLi9tb2R1bGVzL3NoYXJlLXRyYW5zZm9ybXMnKSxcbiAgICBDb3VudCA9IHJlcXVpcmUoJy4vbW9kdWxlcy9jb3VudCcpLFxuICAgIENvdW50QVBJID0gcmVxdWlyZSgnLi9tb2R1bGVzL2NvdW50LWFwaScpLFxuICAgIGFuYWx5dGljc0FQSSA9IHJlcXVpcmUoJy4uL2FuYWx5dGljcycpO1xuXG4gIERhdGFBdHRyKE9wZW5TaGFyZSwgQ291bnQsIFNoYXJlVHJhbnNmb3JtcywgRXZlbnRzKTtcbiAgd2luZG93Lk9wZW5TaGFyZSA9IHtcbiAgICBzaGFyZTogU2hhcmVBUEkoT3BlblNoYXJlLCBTaGFyZVRyYW5zZm9ybXMsIEV2ZW50cyksXG4gICAgY291bnQ6IENvdW50QVBJKCksXG4gICAgYW5hbHl0aWNzOiBhbmFseXRpY3NBUEksXG4gIH07XG59KCkpO1xuIiwiLyoqXG4gKiBjb3VudCBBUElcbiAqL1xuXG5jb25zdCBjb3VudCA9IHJlcXVpcmUoJy4vY291bnQnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoKSB7IC8vZXNsaW50LWRpc2FibGUtbGluZVxuICAvLyBnbG9iYWwgT3BlblNoYXJlIHJlZmVyZW5jaW5nIGludGVybmFsIGNsYXNzIGZvciBpbnN0YW5jZSBnZW5lcmF0aW9uXG4gIGNsYXNzIENvdW50IHtcblxuICAgIGNvbnN0cnVjdG9yKHtcbiAgICAgIHR5cGUsXG4gICAgICB1cmwsXG4gICAgICBhcHBlbmRUbyA9IGZhbHNlLFxuICAgICAgZWxlbWVudCxcbiAgICAgIGNsYXNzZXMsXG4gICAgICBrZXkgPSBudWxsLFxuICAgIH0sIGNiKSB7XG4gICAgICBjb25zdCBjb3VudE5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGVsZW1lbnQgfHwgJ3NwYW4nKTtcblxuICAgICAgY291bnROb2RlLnNldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50JywgdHlwZSk7XG4gICAgICBjb3VudE5vZGUuc2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY291bnQtdXJsJywgdXJsKTtcbiAgICAgIGlmIChrZXkpIGNvdW50Tm9kZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1rZXknLCBrZXkpO1xuXG4gICAgICBjb3VudE5vZGUuY2xhc3NMaXN0LmFkZCgnb3Blbi1zaGFyZS1jb3VudCcpO1xuXG4gICAgICBpZiAoY2xhc3NlcyAmJiBBcnJheS5pc0FycmF5KGNsYXNzZXMpKSB7XG4gICAgICAgIGNsYXNzZXMuZm9yRWFjaCgoY3NzQ0xhc3MpID0+IHtcbiAgICAgICAgICBjb3VudE5vZGUuY2xhc3NMaXN0LmFkZChjc3NDTGFzcyk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoYXBwZW5kVG8pIHtcbiAgICAgICAgcmV0dXJuIG5ldyBjb3VudCh0eXBlLCB1cmwpLmNvdW50KGNvdW50Tm9kZSwgY2IsIGFwcGVuZFRvKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ldyBjb3VudCh0eXBlLCB1cmwpLmNvdW50KGNvdW50Tm9kZSwgY2IpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBDb3VudDtcbn07XG4iLCJjb25zdCBjb3VudFJlZHVjZSA9IHJlcXVpcmUoJy4uLy4uL2xpYi9jb3VudFJlZHVjZScpO1xuY29uc3Qgc3RvcmVDb3VudCA9IHJlcXVpcmUoJy4uLy4uL2xpYi9zdG9yZUNvdW50Jyk7XG5cbi8qKlxuICogT2JqZWN0IG9mIHRyYW5zZm9ybSBmdW5jdGlvbnMgZm9yIGVhY2ggb3BlbnNoYXJlIGFwaVxuICogVHJhbnNmb3JtIGZ1bmN0aW9ucyBwYXNzZWQgaW50byBPcGVuU2hhcmUgaW5zdGFuY2Ugd2hlbiBpbnN0YW50aWF0ZWRcbiAqIFJldHVybiBvYmplY3QgY29udGFpbmluZyBVUkwgYW5kIGtleS92YWx1ZSBhcmdzXG4gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gIC8vIGZhY2Vib29rIGNvdW50IGRhdGFcbiAgZmFjZWJvb2sodXJsKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6ICdnZXQnLFxuICAgICAgdXJsOiBgaHR0cHM6Ly9ncmFwaC5mYWNlYm9vay5jb20vP2lkPSR7dXJsfWAsXG4gICAgICB0cmFuc2Zvcm0oeGhyKSB7XG4gICAgICAgIGNvbnN0IGZiID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KTtcblxuICAgICAgICBjb25zdCBjb3VudCA9IGZiLnNoYXJlICYmIGZiLnNoYXJlLnNoYXJlX2NvdW50IHx8IDA7XG5cbiAgICAgICAgcmV0dXJuIHN0b3JlQ291bnQodGhpcywgY291bnQpO1xuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4vLyBwaW50ZXJlc3QgY291bnQgZGF0YVxuICBwaW50ZXJlc3QodXJsKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6ICdqc29ucCcsXG4gICAgICB1cmw6IGBodHRwczovL2FwaS5waW50ZXJlc3QuY29tL3YxL3VybHMvY291bnQuanNvbj9jYWxsYmFjaz0/JnVybD0ke3VybH1gLFxuICAgICAgdHJhbnNmb3JtKGRhdGEpIHtcbiAgICAgICAgY29uc3QgY291bnQgPSBkYXRhLmNvdW50O1xuICAgICAgICByZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBjb3VudCk7XG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgLy8gbGlua2VkaW4gY291bnQgZGF0YVxuICBsaW5rZWRpbih1cmwpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ2pzb25wJyxcbiAgICAgIHVybDogYGh0dHBzOi8vd3d3LmxpbmtlZGluLmNvbS9jb3VudHNlcnYvY291bnQvc2hhcmU/dXJsPSR7dXJsfSZmb3JtYXQ9anNvbnAmY2FsbGJhY2s9P2AsXG4gICAgICB0cmFuc2Zvcm0oZGF0YSkge1xuICAgICAgICBjb25zdCBjb3VudCA9IGRhdGEuY291bnQ7XG4gICAgICAgIHJldHVybiBzdG9yZUNvdW50KHRoaXMsIGNvdW50KTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyByZWRkaXQgY291bnQgZGF0YVxuICByZWRkaXQodXJsKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6ICdnZXQnLFxuICAgICAgdXJsOiBgaHR0cHM6Ly93d3cucmVkZGl0LmNvbS9hcGkvaW5mby5qc29uP3VybD0ke3VybH1gLFxuICAgICAgdHJhbnNmb3JtKHhocikge1xuICAgICAgICBjb25zdCBwb3N0cyA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCkuZGF0YS5jaGlsZHJlbjtcbiAgICAgICAgbGV0IHVwcyA9IDA7XG5cbiAgICAgICAgcG9zdHMuZm9yRWFjaCgocG9zdCkgPT4ge1xuICAgICAgICAgIHVwcyArPSBOdW1iZXIocG9zdC5kYXRhLnVwcyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBzdG9yZUNvdW50KHRoaXMsIHVwcyk7XG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbi8vIGdvb2dsZSBjb3VudCBkYXRhXG4gIGdvb2dsZSh1cmwpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ3Bvc3QnLFxuICAgICAgZGF0YToge1xuICAgICAgICBtZXRob2Q6ICdwb3MucGx1c29uZXMuZ2V0JyxcbiAgICAgICAgaWQ6ICdwJyxcbiAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgbm9sb2c6IHRydWUsXG4gICAgICAgICAgaWQ6IHVybCxcbiAgICAgICAgICBzb3VyY2U6ICd3aWRnZXQnLFxuICAgICAgICAgIHVzZXJJZDogJ0B2aWV3ZXInLFxuICAgICAgICAgIGdyb3VwSWQ6ICdAc2VsZicsXG4gICAgICAgIH0sXG4gICAgICAgIGpzb25ycGM6ICcyLjAnLFxuICAgICAgICBrZXk6ICdwJyxcbiAgICAgICAgYXBpVmVyc2lvbjogJ3YxJyxcbiAgICAgIH0sXG4gICAgICB1cmw6ICdodHRwczovL2NsaWVudHM2Lmdvb2dsZS5jb20vcnBjJyxcbiAgICAgIHRyYW5zZm9ybSh4aHIpIHtcbiAgICAgICAgY29uc3QgY291bnQgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpLnJlc3VsdC5tZXRhZGF0YS5nbG9iYWxDb3VudHMuY291bnQ7XG4gICAgICAgIHJldHVybiBzdG9yZUNvdW50KHRoaXMsIGNvdW50KTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBnaXRodWIgc3RhciBjb3VudFxuICBnaXRodWJTdGFycyhyZXBvKSB7XG4gICAgcmVwbyA9IHJlcG8uaW5kZXhPZignZ2l0aHViLmNvbS8nKSA+IC0xID9cbiAgICByZXBvLnNwbGl0KCdnaXRodWIuY29tLycpWzFdIDpcbiAgICByZXBvO1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiAnZ2V0JyxcbiAgICAgIHVybDogYGh0dHBzOi8vYXBpLmdpdGh1Yi5jb20vcmVwb3MvJHtyZXBvfWAsXG4gICAgICB0cmFuc2Zvcm0oeGhyKSB7XG4gICAgICAgIGNvbnN0IGNvdW50ID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KS5zdGFyZ2F6ZXJzX2NvdW50O1xuICAgICAgICByZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBjb3VudCk7XG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgLy8gZ2l0aHViIGZvcmtzIGNvdW50XG4gIGdpdGh1YkZvcmtzKHJlcG8pIHtcbiAgICByZXBvID0gcmVwby5pbmRleE9mKCdnaXRodWIuY29tLycpID4gLTEgP1xuICAgIHJlcG8uc3BsaXQoJ2dpdGh1Yi5jb20vJylbMV0gOlxuICAgIHJlcG87XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6ICdnZXQnLFxuICAgICAgdXJsOiBgaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9yZXBvcy8ke3JlcG99YCxcbiAgICAgIHRyYW5zZm9ybSh4aHIpIHtcbiAgICAgICAgY29uc3QgY291bnQgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpLmZvcmtzX2NvdW50O1xuICAgICAgICByZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBjb3VudCk7XG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgLy8gZ2l0aHViIHdhdGNoZXJzIGNvdW50XG4gIGdpdGh1YldhdGNoZXJzKHJlcG8pIHtcbiAgICByZXBvID0gcmVwby5pbmRleE9mKCdnaXRodWIuY29tLycpID4gLTEgP1xuICAgIHJlcG8uc3BsaXQoJ2dpdGh1Yi5jb20vJylbMV0gOlxuICAgIHJlcG87XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6ICdnZXQnLFxuICAgICAgdXJsOiBgaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9yZXBvcy8ke3JlcG99YCxcbiAgICAgIHRyYW5zZm9ybSh4aHIpIHtcbiAgICAgICAgY29uc3QgY291bnQgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpLndhdGNoZXJzX2NvdW50O1xuICAgICAgICByZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBjb3VudCk7XG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgLy8gZHJpYmJibGUgbGlrZXMgY291bnRcbiAgZHJpYmJibGUoc2hvdCkge1xuICAgIHNob3QgPSBzaG90LmluZGV4T2YoJ2RyaWJiYmxlLmNvbS9zaG90cycpID4gLTEgP1xuICAgIHNob3Quc3BsaXQoJ3Nob3RzLycpWzFdIDpcbiAgICBzaG90O1xuICAgIGNvbnN0IHVybCA9IGBodHRwczovL2FwaS5kcmliYmJsZS5jb20vdjEvc2hvdHMvJHtzaG90fS9saWtlc2A7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6ICdnZXQnLFxuICAgICAgdXJsLFxuICAgICAgdHJhbnNmb3JtKHhociwgRXZlbnRzKSB7XG4gICAgICAgIGNvbnN0IGNvdW50ID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KS5sZW5ndGg7XG5cbiAgICAgICAgLy8gYXQgdGhpcyB0aW1lIGRyaWJiYmxlIGxpbWl0cyBhIHJlc3BvbnNlIG9mIDEyIGxpa2VzIHBlciBwYWdlXG4gICAgICAgIGlmIChjb3VudCA9PT0gMTIpIHtcbiAgICAgICAgICBjb25zdCBwYWdlID0gMjtcbiAgICAgICAgICByZWN1cnNpdmVDb3VudCh1cmwsIHBhZ2UsIGNvdW50LCAoZmluYWxDb3VudCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuYXBwZW5kVG8gJiYgdHlwZW9mIHRoaXMuYXBwZW5kVG8gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgdGhpcy5hcHBlbmRUby5hcHBlbmRDaGlsZCh0aGlzLm9zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvdW50UmVkdWNlKHRoaXMub3MsIGZpbmFsQ291bnQsIHRoaXMuY2IpO1xuICAgICAgICAgICAgRXZlbnRzLnRyaWdnZXIodGhpcy5vcywgYGNvdW50ZWQtJHt0aGlzLnVybH1gKTtcbiAgICAgICAgICAgIHJldHVybiBzdG9yZUNvdW50KHRoaXMsIGZpbmFsQ291bnQpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBzdG9yZUNvdW50KHRoaXMsIGNvdW50KTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIHR3aXR0ZXIodXJsKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6ICdnZXQnLFxuICAgICAgdXJsOiBgaHR0cHM6Ly9hcGkub3BlbnNoYXJlLnNvY2lhbC9qb2I/dXJsPSR7dXJsfSZrZXk9YCxcbiAgICAgIHRyYW5zZm9ybSh4aHIpIHtcbiAgICAgICAgY29uc3QgY291bnQgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpLmNvdW50O1xuICAgICAgICByZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBjb3VudCk7XG4gICAgICB9LFxuICAgIH07XG4gIH0sXG59O1xuXG5mdW5jdGlvbiByZWN1cnNpdmVDb3VudCh1cmwsIHBhZ2UsIGNvdW50LCBjYikge1xuICBjb25zdCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgeGhyLm9wZW4oJ0dFVCcsIGAke3VybH0/cGFnZT0ke3BhZ2V9YCk7XG4gIHhoci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkgeyAvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgICBjb25zdCBsaWtlcyA9IEpTT04ucGFyc2UodGhpcy5yZXNwb25zZSk7XG4gICAgY291bnQgKz0gbGlrZXMubGVuZ3RoO1xuXG4gICAgLy8gZHJpYmJibGUgbGlrZSBwZXIgcGFnZSBpcyAxMlxuICAgIGlmIChsaWtlcy5sZW5ndGggPT09IDEyKSB7XG4gICAgICBwYWdlKys7XG4gICAgICByZWN1cnNpdmVDb3VudCh1cmwsIHBhZ2UsIGNvdW50LCBjYik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNiKGNvdW50KTtcbiAgICB9XG4gIH0pO1xuICB4aHIuc2VuZCgpO1xufVxuIiwiLyoqXG4gKiBHZW5lcmF0ZSBzaGFyZSBjb3VudCBpbnN0YW5jZSBmcm9tIG9uZSB0byBtYW55IG5ldHdvcmtzXG4gKi9cblxuY29uc3QgQ291bnRUcmFuc2Zvcm1zID0gcmVxdWlyZSgnLi9jb3VudC10cmFuc2Zvcm1zJyk7XG5jb25zdCBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xuY29uc3QgY291bnRSZWR1Y2UgPSByZXF1aXJlKCcuLi8uLi9saWIvY291bnRSZWR1Y2UnKTtcbmNvbnN0IHN0b3JlQ291bnQgPSByZXF1aXJlKCcuLi8uLi9saWIvc3RvcmVDb3VudCcpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgQ291bnQge1xuICBjb25zdHJ1Y3Rvcih0eXBlLCB1cmwpIHtcbiAgICAvLyB0aHJvdyBlcnJvciBpZiBubyB1cmwgcHJvdmlkZWRcbiAgICBpZiAoIXVybCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdPcGVuIFNoYXJlOiBubyB1cmwgcHJvdmlkZWQgZm9yIGNvdW50Jyk7XG4gICAgfVxuXG4gICAgLy8gY2hlY2sgZm9yIEdpdGh1YiBjb3VudHNcbiAgICBpZiAodHlwZS5pbmRleE9mKCdnaXRodWInKSA9PT0gMCkge1xuICAgICAgaWYgKHR5cGUgPT09ICdnaXRodWItc3RhcnMnKSB7XG4gICAgICAgIHR5cGUgPSAnZ2l0aHViU3RhcnMnO1xuICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAnZ2l0aHViLWZvcmtzJykge1xuICAgICAgICB0eXBlID0gJ2dpdGh1YkZvcmtzJztcbiAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ2dpdGh1Yi13YXRjaGVycycpIHtcbiAgICAgICAgdHlwZSA9ICdnaXRodWJXYXRjaGVycyc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdJbnZhbGlkIEdpdGh1YiBjb3VudCB0eXBlLiBUcnkgZ2l0aHViLXN0YXJzLCBnaXRodWItZm9ya3MsIG9yIGdpdGh1Yi13YXRjaGVycy4nKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBpZiB0eXBlIGlzIGNvbW1hIHNlcGFyYXRlIGxpc3QgY3JlYXRlIGFycmF5XG4gICAgaWYgKHR5cGUuaW5kZXhPZignLCcpID4gLTEpIHtcbiAgICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgICB0aGlzLnR5cGVBcnIgPSB0aGlzLnR5cGUuc3BsaXQoJywnKTtcbiAgICAgIHRoaXMuY291bnREYXRhID0gW107XG5cbiAgICAgIC8vIGNoZWNrIGVhY2ggdHlwZSBzdXBwbGllZCBpcyB2YWxpZFxuICAgICAgdGhpcy50eXBlQXJyLmZvckVhY2goKHQpID0+IHtcbiAgICAgICAgaWYgKCFDb3VudFRyYW5zZm9ybXNbdF0pIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE9wZW4gU2hhcmU6ICR7dHlwZX0gaXMgYW4gaW52YWxpZCBjb3VudCB0eXBlYCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvdW50RGF0YS5wdXNoKENvdW50VHJhbnNmb3Jtc1t0XSh1cmwpKTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyB0aHJvdyBlcnJvciBpZiBpbnZhbGlkIHR5cGUgcHJvdmlkZWRcbiAgICB9IGVsc2UgaWYgKCFDb3VudFRyYW5zZm9ybXNbdHlwZV0pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgT3BlbiBTaGFyZTogJHt0eXBlfSBpcyBhbiBpbnZhbGlkIGNvdW50IHR5cGVgKTtcblxuICAgICAgICAvLyBzaW5nbGUgY291bnRcbiAgICAgICAgLy8gc3RvcmUgY291bnQgVVJMIGFuZCB0cmFuc2Zvcm0gZnVuY3Rpb25cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICAgIHRoaXMuY291bnREYXRhID0gQ291bnRUcmFuc2Zvcm1zW3R5cGVdKHVybCk7XG4gICAgfVxuICB9XG5cbiAgLy8gaGFuZGxlIGNhbGxpbmcgZ2V0Q291bnQgLyBnZXRDb3VudHNcbiAgLy8gZGVwZW5kaW5nIG9uIG51bWJlciBvZiB0eXBlc1xuICBjb3VudChvcywgY2IsIGFwcGVuZFRvKSB7XG4gICAgdGhpcy5vcyA9IG9zO1xuICAgIHRoaXMuYXBwZW5kVG8gPSBhcHBlbmRUbztcbiAgICB0aGlzLmNiID0gY2I7XG4gICAgdGhpcy51cmwgPSB0aGlzLm9zLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50Jyk7XG4gICAgdGhpcy5zaGFyZWQgPSB0aGlzLm9zLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50LXVybCcpO1xuICAgIHRoaXMua2V5ID0gdGhpcy5vcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1rZXknKTtcblxuICAgIGlmICghQXJyYXkuaXNBcnJheSh0aGlzLmNvdW50RGF0YSkpIHtcbiAgICAgIHRoaXMuZ2V0Q291bnQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5nZXRDb3VudHMoKTtcbiAgICB9XG4gIH1cblxuICAvLyBmZXRjaCBjb3VudCBlaXRoZXIgQUpBWCBvciBKU09OUFxuICBnZXRDb3VudCgpIHtcbiAgICBjb25zdCBjb3VudCA9IHRoaXMuc3RvcmVHZXQoYCR7dGhpcy50eXBlfS0ke3RoaXMuc2hhcmVkfWApO1xuXG4gICAgaWYgKGNvdW50KSB7XG4gICAgICBpZiAodGhpcy5hcHBlbmRUbyAmJiB0eXBlb2YgdGhpcy5hcHBlbmRUbyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzLmFwcGVuZFRvLmFwcGVuZENoaWxkKHRoaXMub3MpO1xuICAgICAgfVxuICAgICAgY291bnRSZWR1Y2UodGhpcy5vcywgY291bnQpO1xuICAgIH1cbiAgICB0aGlzW3RoaXMuY291bnREYXRhLnR5cGVdKHRoaXMuY291bnREYXRhKTtcbiAgfVxuXG4gIC8vIGZldGNoIG11bHRpcGxlIGNvdW50cyBhbmQgYWdncmVnYXRlXG4gIGdldENvdW50cygpIHtcbiAgICB0aGlzLnRvdGFsID0gW107XG5cbiAgICBjb25zdCBjb3VudCA9IHRoaXMuc3RvcmVHZXQoYCR7dGhpcy50eXBlfS0ke3RoaXMuc2hhcmVkfWApO1xuXG4gICAgaWYgKGNvdW50KSB7XG4gICAgICBpZiAodGhpcy5hcHBlbmRUbyAmJiB0eXBlb2YgdGhpcy5hcHBlbmRUbyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzLmFwcGVuZFRvLmFwcGVuZENoaWxkKHRoaXMub3MpO1xuICAgICAgfVxuICAgICAgY291bnRSZWR1Y2UodGhpcy5vcywgY291bnQpO1xuICAgIH1cblxuICAgIHRoaXMuY291bnREYXRhLmZvckVhY2goKGNvdW50RGF0YSkgPT4ge1xuICAgICAgdGhpc1tjb3VudERhdGEudHlwZV0oY291bnREYXRhLCAobnVtKSA9PiB7XG4gICAgICAgIHRoaXMudG90YWwucHVzaChudW0pO1xuXG4gICAgICAgIC8vIHRvdGFsIGNvdW50cyBsZW5ndGggbm93IGVxdWFscyB0eXBlIGFycmF5IGxlbmd0aFxuICAgICAgICAvLyBzbyBhZ2dyZWdhdGUsIHN0b3JlIGFuZCBpbnNlcnQgaW50byBET01cbiAgICAgICAgaWYgKHRoaXMudG90YWwubGVuZ3RoID09PSB0aGlzLnR5cGVBcnIubGVuZ3RoKSB7XG4gICAgICAgICAgbGV0IHRvdCA9IDA7XG5cbiAgICAgICAgICB0aGlzLnRvdGFsLmZvckVhY2goKHQpID0+IHtcbiAgICAgICAgICAgIHRvdCArPSB0O1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgaWYgKHRoaXMuYXBwZW5kVG8gJiYgdHlwZW9mIHRoaXMuYXBwZW5kVG8gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kVG8uYXBwZW5kQ2hpbGQodGhpcy5vcyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgbG9jYWwgPSBOdW1iZXIodGhpcy5zdG9yZUdldChgJHt0aGlzLnR5cGV9LSR7dGhpcy5zaGFyZWR9YCkpO1xuICAgICAgICAgIGlmIChsb2NhbCA+IHRvdCkge1xuICAgICAgICAgICAgY29uc3QgbGF0ZXN0Q291bnQgPSBOdW1iZXIodGhpcy5zdG9yZUdldChgJHt0aGlzLnR5cGV9LSR7dGhpcy5zaGFyZWR9LWxhdGVzdENvdW50YCkpO1xuICAgICAgICAgICAgdGhpcy5zdG9yZVNldChgJHt0aGlzLnR5cGV9LSR7dGhpcy5zaGFyZWR9LWxhdGVzdENvdW50YCwgdG90KTtcblxuICAgICAgICAgICAgdG90ID0gaXNOdW1lcmljKGxhdGVzdENvdW50KSAmJiBsYXRlc3RDb3VudCA+IDAgP1xuICAgICAgICAgICAgdG90ICs9IGxvY2FsIC0gbGF0ZXN0Q291bnQgOlxuICAgICAgICAgICAgdG90ICs9IGxvY2FsO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnN0b3JlU2V0KGAke3RoaXMudHlwZX0tJHt0aGlzLnNoYXJlZH1gLCB0b3QpO1xuXG4gICAgICAgICAgY291bnRSZWR1Y2UodGhpcy5vcywgdG90KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpZiAodGhpcy5hcHBlbmRUbyAmJiB0eXBlb2YgdGhpcy5hcHBlbmRUbyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhpcy5hcHBlbmRUby5hcHBlbmRDaGlsZCh0aGlzLm9zKTtcbiAgICB9XG4gIH1cblxuICAvLyBoYW5kbGUgSlNPTlAgcmVxdWVzdHNcbiAganNvbnAoY291bnREYXRhLCBjYikge1xuICAvLyBkZWZpbmUgcmFuZG9tIGNhbGxiYWNrIGFuZCBhc3NpZ24gdHJhbnNmb3JtIGZ1bmN0aW9uXG4gICAgY29uc3QgY2FsbGJhY2sgPSBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHJpbmcoNykucmVwbGFjZSgvW15hLXpBLVpdL2csICcnKTtcbiAgICB3aW5kb3dbY2FsbGJhY2tdID0gKGRhdGEpID0+IHtcbiAgICAgIGNvbnN0IGNvdW50ID0gY291bnREYXRhLnRyYW5zZm9ybS5hcHBseSh0aGlzLCBbZGF0YV0pIHx8IDA7XG5cbiAgICAgIGlmIChjYiAmJiB0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgY2IoY291bnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRoaXMuYXBwZW5kVG8gJiYgdHlwZW9mIHRoaXMuYXBwZW5kVG8gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICB0aGlzLmFwcGVuZFRvLmFwcGVuZENoaWxkKHRoaXMub3MpO1xuICAgICAgICB9XG4gICAgICAgIGNvdW50UmVkdWNlKHRoaXMub3MsIGNvdW50LCB0aGlzLmNiKTtcbiAgICAgIH1cblxuICAgICAgRXZlbnRzLnRyaWdnZXIodGhpcy5vcywgYGNvdW50ZWQtJHt0aGlzLnVybH1gKTtcbiAgICB9O1xuXG4gICAgLy8gYXBwZW5kIEpTT05QIHNjcmlwdCB0YWcgdG8gcGFnZVxuICAgIGNvbnN0IHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgIHNjcmlwdC5zcmMgPSBjb3VudERhdGEudXJsLnJlcGxhY2UoJ2NhbGxiYWNrPT8nLCBgY2FsbGJhY2s9JHtjYWxsYmFja31gKTtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdLmFwcGVuZENoaWxkKHNjcmlwdCk7XG5cbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBoYW5kbGUgQUpBWCBHRVQgcmVxdWVzdFxuICBnZXQoY291bnREYXRhLCBjYikge1xuICAgIGNvbnN0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgLy8gb24gc3VjY2VzcyBwYXNzIHJlc3BvbnNlIHRvIHRyYW5zZm9ybSBmdW5jdGlvblxuICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSAoKSA9PiB7XG4gICAgICBpZiAoeGhyLnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgICAgaWYgKHhoci5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgIGNvbnN0IGNvdW50ID0gY291bnREYXRhLnRyYW5zZm9ybS5hcHBseSh0aGlzLCBbeGhyLCBFdmVudHNdKSB8fCAwO1xuXG4gICAgICAgICAgaWYgKGNiICYmIHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2IoY291bnQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAodGhpcy5hcHBlbmRUbyAmJiB0eXBlb2YgdGhpcy5hcHBlbmRUbyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICB0aGlzLmFwcGVuZFRvLmFwcGVuZENoaWxkKHRoaXMub3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY291bnRSZWR1Y2UodGhpcy5vcywgY291bnQsIHRoaXMuY2IpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIEV2ZW50cy50cmlnZ2VyKHRoaXMub3MsIGBjb3VudGVkLSR7dGhpcy51cmx9YCk7XG4gICAgICAgIH0gZWxzZSBpZiAoY291bnREYXRhLnVybC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ2h0dHBzOi8vYXBpLm9wZW5zaGFyZS5zb2NpYWwvam9iPycpID09PSAwKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignUGxlYXNlIHNpZ24gdXAgZm9yIFR3aXR0ZXIgY291bnRzIGF0IGh0dHBzOi8vb3BlbnNoYXJlLnNvY2lhbC90d2l0dGVyL2F1dGgnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gZ2V0IEFQSSBkYXRhIGZyb20nLCBjb3VudERhdGEudXJsLCAnLiBQbGVhc2UgdXNlIHRoZSBsYXRlc3QgdmVyc2lvbiBvZiBPcGVuU2hhcmUuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgY291bnREYXRhLnVybCA9IGNvdW50RGF0YS51cmwuc3RhcnRzV2l0aCgnaHR0cHM6Ly9hcGkub3BlbnNoYXJlLnNvY2lhbC9qb2I/JykgJiYgdGhpcy5rZXkgP1xuICAgICAgY291bnREYXRhLnVybCArIHRoaXMua2V5IDpcbiAgICAgIGNvdW50RGF0YS51cmw7XG5cbiAgICB4aHIub3BlbignR0VUJywgY291bnREYXRhLnVybCk7XG4gICAgeGhyLnNlbmQoKTtcbiAgfVxuXG4gIC8vIGhhbmRsZSBBSkFYIFBPU1QgcmVxdWVzdFxuICBwb3N0KGNvdW50RGF0YSwgY2IpIHtcbiAgICBjb25zdCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgIC8vIG9uIHN1Y2Nlc3MgcGFzcyByZXNwb25zZSB0byB0cmFuc2Zvcm0gZnVuY3Rpb25cbiAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gKCkgPT4ge1xuICAgICAgaWYgKHhoci5yZWFkeVN0YXRlICE9PSBYTUxIdHRwUmVxdWVzdC5ET05FIHx8XG4gICAgICAgIHhoci5zdGF0dXMgIT09IDIwMCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNvdW50ID0gY291bnREYXRhLnRyYW5zZm9ybS5hcHBseSh0aGlzLCBbeGhyXSkgfHwgMDtcblxuICAgICAgaWYgKGNiICYmIHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBjYihjb3VudCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodGhpcy5hcHBlbmRUbyAmJiB0eXBlb2YgdGhpcy5hcHBlbmRUbyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIHRoaXMuYXBwZW5kVG8uYXBwZW5kQ2hpbGQodGhpcy5vcyk7XG4gICAgICAgIH1cbiAgICAgICAgY291bnRSZWR1Y2UodGhpcy5vcywgY291bnQsIHRoaXMuY2IpO1xuICAgICAgfVxuICAgICAgRXZlbnRzLnRyaWdnZXIodGhpcy5vcywgYGNvdW50ZWQtJHt0aGlzLnVybH1gKTtcbiAgICB9O1xuXG4gICAgeGhyLm9wZW4oJ1BPU1QnLCBjb3VudERhdGEudXJsKTtcbiAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb247Y2hhcnNldD1VVEYtOCcpO1xuICAgIHhoci5zZW5kKEpTT04uc3RyaW5naWZ5KGNvdW50RGF0YS5kYXRhKSk7XG4gIH1cblxuICBzdG9yZVNldCh0eXBlLCBjb3VudCA9IDApIHsvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgICBpZiAoIXdpbmRvdy5sb2NhbFN0b3JhZ2UgfHwgIXR5cGUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShgT3BlblNoYXJlLSR7dHlwZX1gLCBjb3VudCk7XG4gIH1cblxuICBzdG9yZUdldCh0eXBlKSB7Ly9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgaWYgKCF3aW5kb3cubG9jYWxTdG9yYWdlIHx8ICF0eXBlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcmV0dXJuIGxvY2FsU3RvcmFnZS5nZXRJdGVtKGBPcGVuU2hhcmUtJHt0eXBlfWApO1xuICB9XG5cbn07XG5cbmZ1bmN0aW9uIGlzTnVtZXJpYyhuKSB7XG4gIHJldHVybiAhaXNOYU4ocGFyc2VGbG9hdChuKSkgJiYgaXNGaW5pdGUobik7XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHsvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIHJlcXVpcmUoJy4uLy4uL2xpYi9pbml0Jykoe1xuICAgIHNlbGVjdG9yOiB7XG4gICAgICBzaGFyZTogJ1tkYXRhLW9wZW4tc2hhcmVdOm5vdChbZGF0YS1vcGVuLXNoYXJlLW5vZGVdKScsXG4gICAgICBjb3VudDogJ1tkYXRhLW9wZW4tc2hhcmUtY291bnRdOm5vdChbZGF0YS1vcGVuLXNoYXJlLW5vZGVdKScsXG4gICAgfSxcbiAgICBjYjoge1xuICAgICAgc2hhcmU6IHJlcXVpcmUoJy4uLy4uL2xpYi9pbml0aWFsaXplU2hhcmVOb2RlJyksXG4gICAgICBjb3VudDogcmVxdWlyZSgnLi4vLi4vbGliL2luaXRpYWxpemVDb3VudE5vZGUnKSxcbiAgICB9LFxuICB9KSk7XG59O1xuIiwiLyoqXG4gKiBUcmlnZ2VyIGN1c3RvbSBPcGVuU2hhcmUgbmFtZXNwYWNlZCBldmVudFxuICovXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgdHJpZ2dlcihlbGVtZW50LCBldmVudCkge1xuICAgIGNvbnN0IGV2ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0V2ZW50Jyk7XG4gICAgZXYuaW5pdEV2ZW50KGBPcGVuU2hhcmUuJHtldmVudH1gLCB0cnVlLCB0cnVlKTtcbiAgICBlbGVtZW50LmRpc3BhdGNoRXZlbnQoZXYpO1xuICB9LFxufTtcbiIsIi8qKlxuICogT3BlblNoYXJlIGdlbmVyYXRlcyBhIHNpbmdsZSBzaGFyZSBsaW5rXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgT3BlblNoYXJlIHtcblxuICBjb25zdHJ1Y3Rvcih0eXBlLCB0cmFuc2Zvcm0pIHtcbiAgICB0aGlzLmlvcyA9IC9pUGFkfGlQaG9uZXxpUG9kLy50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpICYmICF3aW5kb3cuTVNTdHJlYW07XG4gICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICB0aGlzLmR5bmFtaWMgPSBmYWxzZTtcbiAgICB0aGlzLnRyYW5zZm9ybSA9IHRyYW5zZm9ybTtcblxuICAgIC8vIGNhcGl0YWxpemVkIHR5cGVcbiAgICB0aGlzLnR5cGVDYXBzID0gdHlwZS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHR5cGUuc2xpY2UoMSk7XG4gIH1cblxuICAvLyByZXR1cm5zIGZ1bmN0aW9uIG5hbWVkIGFzIHR5cGUgc2V0IGluIGNvbnN0cnVjdG9yXG4gIC8vIGUuZyB0d2l0dGVyKClcbiAgc2V0RGF0YShkYXRhKSB7XG4gICAgLy8gaWYgaU9TIHVzZXIgYW5kIGlvcyBkYXRhIGF0dHJpYnV0ZSBkZWZpbmVkXG4gICAgLy8gYnVpbGQgaU9TIFVSTCBzY2hlbWUgYXMgc2luZ2xlIHN0cmluZ1xuICAgIGlmICh0aGlzLmlvcykge1xuICAgICAgdGhpcy50cmFuc2Zvcm1EYXRhID0gdGhpcy50cmFuc2Zvcm0oZGF0YSwgdHJ1ZSk7XG4gICAgICB0aGlzLm1vYmlsZVNoYXJlVXJsID0gdGhpcy50ZW1wbGF0ZSh0aGlzLnRyYW5zZm9ybURhdGEudXJsLCB0aGlzLnRyYW5zZm9ybURhdGEuZGF0YSk7XG4gICAgfVxuXG4gICAgdGhpcy50cmFuc2Zvcm1EYXRhID0gdGhpcy50cmFuc2Zvcm0oZGF0YSk7XG4gICAgdGhpcy5zaGFyZVVybCA9IHRoaXMudGVtcGxhdGUodGhpcy50cmFuc2Zvcm1EYXRhLnVybCwgdGhpcy50cmFuc2Zvcm1EYXRhLmRhdGEpO1xuICB9XG5cbiAgLy8gb3BlbiBzaGFyZSBVUkwgZGVmaW5lZCBpbiBpbmRpdmlkdWFsIHBsYXRmb3JtIGZ1bmN0aW9uc1xuICBzaGFyZSgpIHtcbiAgICAvLyBpZiBpT1Mgc2hhcmUgVVJMIGhhcyBiZWVuIHNldCB0aGVuIHVzZSB0aW1lb3V0IGhhY2tcbiAgICAvLyB0ZXN0IGZvciBuYXRpdmUgYXBwIGFuZCBmYWxsIGJhY2sgdG8gd2ViXG4gICAgaWYgKHRoaXMubW9iaWxlU2hhcmVVcmwpIHtcbiAgICAgIGNvbnN0IHN0YXJ0ID0gKG5ldyBEYXRlKCkpLnZhbHVlT2YoKTtcblxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGNvbnN0IGVuZCA9IChuZXcgRGF0ZSgpKS52YWx1ZU9mKCk7XG5cbiAgICAgICAgLy8gaWYgdGhlIHVzZXIgaXMgc3RpbGwgaGVyZSwgZmFsbCBiYWNrIHRvIHdlYlxuICAgICAgICBpZiAoZW5kIC0gc3RhcnQgPiAxNjAwKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgd2luZG93LmxvY2F0aW9uID0gdGhpcy5zaGFyZVVybDtcbiAgICAgIH0sIDE1MDApO1xuXG4gICAgICB3aW5kb3cubG9jYXRpb24gPSB0aGlzLm1vYmlsZVNoYXJlVXJsO1xuXG4gICAgICAvLyBvcGVuIG1haWx0byBsaW5rcyBpbiBzYW1lIHdpbmRvd1xuICAgIH0gZWxzZSBpZiAodGhpcy50eXBlID09PSAnZW1haWwnKSB7XG4gICAgICB3aW5kb3cubG9jYXRpb24gPSB0aGlzLnNoYXJlVXJsO1xuXG4gICAgICAvLyBvcGVuIHNvY2lhbCBzaGFyZSBVUkxzIGluIG5ldyB3aW5kb3dcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gaWYgcG9wdXAgb2JqZWN0IHByZXNlbnQgdGhlbiBzZXQgd2luZG93IGRpbWVuc2lvbnMgLyBwb3NpdGlvblxuICAgICAgaWYgKHRoaXMucG9wdXAgJiYgdGhpcy50cmFuc2Zvcm1EYXRhLnBvcHVwKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm9wZW5XaW5kb3codGhpcy5zaGFyZVVybCwgdGhpcy50cmFuc2Zvcm1EYXRhLnBvcHVwKTtcbiAgICAgIH1cblxuICAgICAgd2luZG93Lm9wZW4odGhpcy5zaGFyZVVybCk7XG4gICAgfVxuICB9XG5cbiAgLy8gY3JlYXRlIHNoYXJlIFVSTCB3aXRoIEdFVCBwYXJhbXNcbiAgLy8gYXBwZW5kaW5nIHZhbGlkIHByb3BlcnRpZXMgdG8gcXVlcnkgc3RyaW5nXG4gIHRlbXBsYXRlKHVybCwgZGF0YSkgey8vZXNsaW50LWRpc2FibGUtbGluZVxuICAgIGNvbnN0IG5vblVSTFByb3BzID0gW1xuICAgICAgJ2FwcGVuZFRvJyxcbiAgICAgICdpbm5lckhUTUwnLFxuICAgICAgJ2NsYXNzZXMnLFxuICAgIF07XG5cbiAgICBsZXQgc2hhcmVVcmwgPSB1cmwsXG4gICAgICBpO1xuXG4gICAgZm9yIChpIGluIGRhdGEpIHtcbiAgICAgIC8vIG9ubHkgYXBwZW5kIHZhbGlkIHByb3BlcnRpZXNcbiAgICAgIGlmICghZGF0YVtpXSB8fCBub25VUkxQcm9wcy5pbmRleE9mKGkpID4gLTEpIHtcbiAgICAgICAgY29udGludWU7IC8vZXNsaW50LWRpc2FibGUtbGluZVxuICAgICAgfVxuXG4gICAgICAvLyBhcHBlbmQgVVJMIGVuY29kZWQgR0VUIHBhcmFtIHRvIHNoYXJlIFVSTFxuICAgICAgZGF0YVtpXSA9IGVuY29kZVVSSUNvbXBvbmVudChkYXRhW2ldKTtcbiAgICAgIHNoYXJlVXJsICs9IGAke2l9PSR7ZGF0YVtpXX0mYDtcbiAgICB9XG5cbiAgICByZXR1cm4gc2hhcmVVcmwuc3Vic3RyKDAsIHNoYXJlVXJsLmxlbmd0aCAtIDEpO1xuICB9XG5cbiAgLy8gY2VudGVyIHBvcHVwIHdpbmRvdyBzdXBwb3J0aW5nIGR1YWwgc2NyZWVuc1xuICBvcGVuV2luZG93KHVybCwgb3B0aW9ucykgey8vZXNsaW50LWRpc2FibGUtbGluZVxuICAgIGNvbnN0IGR1YWxTY3JlZW5MZWZ0ID0gd2luZG93LnNjcmVlbkxlZnQgIT09IHVuZGVmaW5lZCA/IHdpbmRvdy5zY3JlZW5MZWZ0IDogc2NyZWVuLmxlZnQsXG4gICAgICBkdWFsU2NyZWVuVG9wID0gd2luZG93LnNjcmVlblRvcCAhPT0gdW5kZWZpbmVkID8gd2luZG93LnNjcmVlblRvcCA6IHNjcmVlbi50b3AsXG4gICAgICB3aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoID8gd2luZG93LmlubmVyV2lkdGggOiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGggPyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGggOiBzY3JlZW4ud2lkdGgsLy9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgICBoZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQgPyB3aW5kb3cuaW5uZXJIZWlnaHQgOiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0ID8gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodCA6IHNjcmVlbi5oZWlnaHQsLy9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgICBsZWZ0ID0gKCh3aWR0aCAvIDIpIC0gKG9wdGlvbnMud2lkdGggLyAyKSkgKyBkdWFsU2NyZWVuTGVmdCxcbiAgICAgIHRvcCA9ICgoaGVpZ2h0IC8gMikgLSAob3B0aW9ucy5oZWlnaHQgLyAyKSkgKyBkdWFsU2NyZWVuVG9wLFxuICAgICAgbmV3V2luZG93ID0gd2luZG93Lm9wZW4odXJsLCAnT3BlblNoYXJlJywgYHdpZHRoPSR7b3B0aW9ucy53aWR0aH0sIGhlaWdodD0ke29wdGlvbnMuaGVpZ2h0fSwgdG9wPSR7dG9wfSwgbGVmdD0ke2xlZnR9YCk7XG5cbiAgICAvLyBQdXRzIGZvY3VzIG9uIHRoZSBuZXdXaW5kb3dcbiAgICBpZiAod2luZG93LmZvY3VzKSB7XG4gICAgICBuZXdXaW5kb3cuZm9jdXMoKTtcbiAgICB9XG4gIH1cbn07XG4iLCIvKipcbiAqIEdsb2JhbCBPcGVuU2hhcmUgQVBJIHRvIGdlbmVyYXRlIGluc3RhbmNlcyBwcm9ncmFtbWF0aWNhbGx5XG4gKi9cblxuY29uc3QgT1MgPSByZXF1aXJlKCcuL29wZW4tc2hhcmUnKTtcbmNvbnN0IFNoYXJlVHJhbnNmb3JtcyA9IHJlcXVpcmUoJy4vc2hhcmUtdHJhbnNmb3JtcycpO1xuY29uc3QgRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcbmNvbnN0IGRhc2hUb0NhbWVsID0gcmVxdWlyZSgnLi4vLi4vbGliL2Rhc2hUb0NhbWVsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCkgey8vZXNsaW50LWRpc2FibGUtbGluZVxuICAvLyBnbG9iYWwgT3BlblNoYXJlIHJlZmVyZW5jaW5nIGludGVybmFsIGNsYXNzIGZvciBpbnN0YW5jZSBnZW5lcmF0aW9uXG4gIGNsYXNzIE9wZW5TaGFyZSB7XG5cbiAgICBjb25zdHJ1Y3RvcihkYXRhLCBlbGVtZW50KSB7XG4gICAgICBpZiAoIWRhdGEuYmluZENsaWNrKSBkYXRhLmJpbmRDbGljayA9IHRydWU7XG5cbiAgICAgIGNvbnN0IGRhc2ggPSBkYXRhLnR5cGUuaW5kZXhPZignLScpO1xuXG4gICAgICBpZiAoZGFzaCA+IC0xKSB7XG4gICAgICAgIGRhdGEudHlwZSA9IGRhc2hUb0NhbWVsKGRhc2gsIGRhdGEudHlwZSk7XG4gICAgICB9XG5cbiAgICAgIGxldCBub2RlO1xuICAgICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICAgIHRoaXMuZGF0YSA9IGRhdGE7XG5cbiAgICAgIHRoaXMub3MgPSBuZXcgT1MoZGF0YS50eXBlLCBTaGFyZVRyYW5zZm9ybXNbZGF0YS50eXBlXSk7XG4gICAgICB0aGlzLm9zLnNldERhdGEoZGF0YSk7XG5cbiAgICAgIGlmICghZWxlbWVudCB8fCBkYXRhLmVsZW1lbnQpIHtcbiAgICAgICAgZWxlbWVudCA9IGRhdGEuZWxlbWVudDtcbiAgICAgICAgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoZWxlbWVudCB8fCAnYScpO1xuICAgICAgICBpZiAoZGF0YS50eXBlKSB7XG4gICAgICAgICAgbm9kZS5jbGFzc0xpc3QuYWRkKCdvcGVuLXNoYXJlLWxpbmsnLCBkYXRhLnR5cGUpO1xuICAgICAgICAgIG5vZGUuc2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUnLCBkYXRhLnR5cGUpO1xuICAgICAgICAgIG5vZGUuc2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtbm9kZScsIGRhdGEudHlwZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRhdGEuaW5uZXJIVE1MKSBub2RlLmlubmVySFRNTCA9IGRhdGEuaW5uZXJIVE1MO1xuICAgICAgfVxuICAgICAgaWYgKG5vZGUpIGVsZW1lbnQgPSBub2RlO1xuXG4gICAgICBpZiAoZGF0YS5iaW5kQ2xpY2spIHtcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgICB0aGlzLnNoYXJlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGF0YS5hcHBlbmRUbykge1xuICAgICAgICBkYXRhLmFwcGVuZFRvLmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGF0YS5jbGFzc2VzICYmIEFycmF5LmlzQXJyYXkoZGF0YS5jbGFzc2VzKSkge1xuICAgICAgICBkYXRhLmNsYXNzZXMuZm9yRWFjaCgoY3NzQ2xhc3MpID0+IHtcbiAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoY3NzQ2xhc3MpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKGRhdGEudHlwZS50b0xvd2VyQ2FzZSgpID09PSAncGF5cGFsJykge1xuICAgICAgICBjb25zdCBhY3Rpb24gPSBkYXRhLnNhbmRib3ggP1xuICAgICAgICAnaHR0cHM6Ly93d3cuc2FuZGJveC5wYXlwYWwuY29tL2NnaS1iaW4vd2Vic2NyJyA6XG4gICAgICAgICdodHRwczovL3d3dy5wYXlwYWwuY29tL2NnaS1iaW4vd2Vic2NyJztcblxuICAgICAgICBjb25zdCBidXlHSUYgPSBkYXRhLnNhbmRib3ggP1xuICAgICAgICAnaHR0cHM6Ly93d3cuc2FuZGJveC5wYXlwYWwuY29tL2VuX1VTL2kvYnRuL2J0bl9idXlub3dfTEcuZ2lmJyA6XG4gICAgICAgICdodHRwczovL3d3dy5wYXlwYWxvYmplY3RzLmNvbS9lbl9VUy9pL2J0bi9idG5fYnV5bm93X0xHLmdpZic7XG5cbiAgICAgICAgY29uc3QgcGl4ZWxHSUYgPSBkYXRhLnNhbmRib3ggP1xuICAgICAgICAnaHR0cHM6Ly93d3cuc2FuZGJveC5wYXlwYWwuY29tL2VuX1VTL2kvc2NyL3BpeGVsLmdpZicgOlxuICAgICAgICAnaHR0cHM6Ly93d3cucGF5cGFsb2JqZWN0cy5jb20vZW5fVVMvaS9zY3IvcGl4ZWwuZ2lmJztcblxuXG4gICAgICAgIGNvbnN0IHBheXBhbEJ1dHRvbiA9IGA8Zm9ybSBhY3Rpb249JHthY3Rpb259IG1ldGhvZD1cInBvc3RcIiB0YXJnZXQ9XCJfYmxhbmtcIj5cblxuICAgICAgICA8IS0tIFNhdmVkIGJ1dHRvbnMgdXNlIHRoZSBcInNlY3VyZSBjbGlja1wiIGNvbW1hbmQgLS0+XG4gICAgICAgIDxpbnB1dCB0eXBlPVwiaGlkZGVuXCIgbmFtZT1cImNtZFwiIHZhbHVlPVwiX3MteGNsaWNrXCI+XG5cbiAgICAgICAgPCEtLSBTYXZlZCBidXR0b25zIGFyZSBpZGVudGlmaWVkIGJ5IHRoZWlyIGJ1dHRvbiBJRHMgLS0+XG4gICAgICAgIDxpbnB1dCB0eXBlPVwiaGlkZGVuXCIgbmFtZT1cImhvc3RlZF9idXR0b25faWRcIiB2YWx1ZT1cIiR7ZGF0YS5idXR0b25JZH1cIj5cblxuICAgICAgICA8IS0tIFNhdmVkIGJ1dHRvbnMgZGlzcGxheSBhbiBhcHByb3ByaWF0ZSBidXR0b24gaW1hZ2UuIC0tPlxuICAgICAgICA8aW5wdXQgdHlwZT1cImltYWdlXCIgbmFtZT1cInN1Ym1pdFwiXG4gICAgICAgIHNyYz0ke2J1eUdJRn1cbiAgICAgICAgYWx0PVwiUGF5UGFsIC0gVGhlIHNhZmVyLCBlYXNpZXIgd2F5IHRvIHBheSBvbmxpbmVcIj5cbiAgICAgICAgPGltZyBhbHQ9XCJcIiB3aWR0aD1cIjFcIiBoZWlnaHQ9XCIxXCJcbiAgICAgICAgc3JjPSR7cGl4ZWxHSUZ9ID5cblxuICAgICAgICA8L2Zvcm0+YDtcblxuICAgICAgICBjb25zdCBoaWRkZW5EaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgaGlkZGVuRGl2LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIGhpZGRlbkRpdi5pbm5lckhUTUwgPSBwYXlwYWxCdXR0b247XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoaGlkZGVuRGl2KTtcblxuICAgICAgICB0aGlzLnBheXBhbCA9IGhpZGRlbkRpdi5xdWVyeVNlbGVjdG9yKCdmb3JtJyk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgICByZXR1cm4gZWxlbWVudDtcbiAgICB9XG5cbiAgICAvLyBwdWJsaWMgc2hhcmUgbWV0aG9kIHRvIHRyaWdnZXIgc2hhcmUgcHJvZ3JhbW1hdGljYWxseVxuICAgIHNoYXJlKGUpIHtcbiAgICAgIC8vIGlmIGR5bmFtaWMgaW5zdGFuY2UgdGhlbiBmZXRjaCBhdHRyaWJ1dGVzIGFnYWluIGluIGNhc2Ugb2YgdXBkYXRlc1xuICAgICAgaWYgKHRoaXMuZGF0YS5keW5hbWljKSB7XG4gICAgICAgIC8vZXNsaW50LWRpc2FibGUtbmV4dC1saW5lXG4gICAgICAgIHRoaXMub3Muc2V0RGF0YShkYXRhKTsvLyBkYXRhIGlzIG5vdCBkZWZpbmVkXG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLmRhdGEudHlwZS50b0xvd2VyQ2FzZSgpID09PSAncGF5cGFsJykge1xuICAgICAgICB0aGlzLnBheXBhbC5zdWJtaXQoKTtcbiAgICAgIH0gZWxzZSB0aGlzLm9zLnNoYXJlKGUpO1xuXG4gICAgICBFdmVudHMudHJpZ2dlcih0aGlzLmVsZW1lbnQsICdzaGFyZWQnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gT3BlblNoYXJlO1xufTtcbiIsIi8qKlxuICogT2JqZWN0IG9mIHRyYW5zZm9ybSBmdW5jdGlvbnMgZm9yIGVhY2ggb3BlbnNoYXJlIGFwaVxuICogVHJhbnNmb3JtIGZ1bmN0aW9ucyBwYXNzZWQgaW50byBPcGVuU2hhcmUgaW5zdGFuY2Ugd2hlbiBpbnN0YW50aWF0ZWRcbiAqIFJldHVybiBvYmplY3QgY29udGFpbmluZyBVUkwgYW5kIGtleS92YWx1ZSBhcmdzXG4gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gIC8vIHNldCBUd2l0dGVyIHNoYXJlIFVSTFxuICB0d2l0dGVyKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG4gICAgLy8gaWYgaU9TIHVzZXIgYW5kIGlvcyBkYXRhIGF0dHJpYnV0ZSBkZWZpbmVkXG4gICAgLy8gYnVpbGQgaU9TIFVSTCBzY2hlbWUgYXMgc2luZ2xlIHN0cmluZ1xuICAgIGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcbiAgICAgIGxldCBtZXNzYWdlID0gJyc7XG5cbiAgICAgIGlmIChkYXRhLnRleHQpIHtcbiAgICAgICAgbWVzc2FnZSArPSBkYXRhLnRleHQ7XG4gICAgICB9XG5cbiAgICAgIGlmIChkYXRhLnVybCkge1xuICAgICAgICBtZXNzYWdlICs9IGAgLSAke2RhdGEudXJsfWA7XG4gICAgICB9XG5cbiAgICAgIGlmIChkYXRhLmhhc2h0YWdzKSB7XG4gICAgICAgIGNvbnN0IHRhZ3MgPSBkYXRhLmhhc2h0YWdzLnNwbGl0KCcsJyk7XG4gICAgICAgIHRhZ3MuZm9yRWFjaCgodGFnKSA9PiB7XG4gICAgICAgICAgbWVzc2FnZSArPSBgICMke3RhZ31gO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKGRhdGEudmlhKSB7XG4gICAgICAgIG1lc3NhZ2UgKz0gYCB2aWEgJHtkYXRhLnZpYX1gO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICB1cmw6ICd0d2l0dGVyOi8vcG9zdD8nLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgfSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogJ2h0dHBzOi8vdHdpdHRlci5jb20vc2hhcmU/JyxcbiAgICAgIGRhdGEsXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogNzAwLFxuICAgICAgICBoZWlnaHQ6IDI5NixcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgVHdpdHRlciByZXR3ZWV0IFVSTFxuICB0d2l0dGVyUmV0d2VldChkYXRhLCBpb3MgPSBmYWxzZSkge1xuICAgIC8vIGlmIGlPUyB1c2VyIGFuZCBpb3MgZGF0YSBhdHRyaWJ1dGUgZGVmaW5lZFxuICAgIGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHVybDogJ3R3aXR0ZXI6Ly9zdGF0dXM/JyxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIGlkOiBkYXRhLnR3ZWV0SWQsXG4gICAgICAgIH0sXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB1cmw6ICdodHRwczovL3R3aXR0ZXIuY29tL2ludGVudC9yZXR3ZWV0PycsXG4gICAgICBkYXRhOiB7XG4gICAgICAgIHR3ZWV0X2lkOiBkYXRhLnR3ZWV0SWQsXG4gICAgICAgIHJlbGF0ZWQ6IGRhdGEucmVsYXRlZCxcbiAgICAgIH0sXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogNzAwLFxuICAgICAgICBoZWlnaHQ6IDI5NixcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgVHdpdHRlciBsaWtlIFVSTFxuICB0d2l0dGVyTGlrZShkYXRhLCBpb3MgPSBmYWxzZSkge1xuICAgIC8vIGlmIGlPUyB1c2VyIGFuZCBpb3MgZGF0YSBhdHRyaWJ1dGUgZGVmaW5lZFxuICAgIGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHVybDogJ3R3aXR0ZXI6Ly9zdGF0dXM/JyxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIGlkOiBkYXRhLnR3ZWV0SWQsXG4gICAgICAgIH0sXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB1cmw6ICdodHRwczovL3R3aXR0ZXIuY29tL2ludGVudC9mYXZvcml0ZT8nLFxuICAgICAgZGF0YToge1xuICAgICAgICB0d2VldF9pZDogZGF0YS50d2VldElkLFxuICAgICAgICByZWxhdGVkOiBkYXRhLnJlbGF0ZWQsXG4gICAgICB9LFxuICAgICAgcG9wdXA6IHtcbiAgICAgICAgd2lkdGg6IDcwMCxcbiAgICAgICAgaGVpZ2h0OiAyOTYsXG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgLy8gc2V0IFR3aXR0ZXIgZm9sbG93IFVSTFxuICB0d2l0dGVyRm9sbG93KGRhdGEsIGlvcyA9IGZhbHNlKSB7XG4gICAgLy8gaWYgaU9TIHVzZXIgYW5kIGlvcyBkYXRhIGF0dHJpYnV0ZSBkZWZpbmVkXG4gICAgaWYgKGlvcyAmJiBkYXRhLmlvcykge1xuICAgICAgY29uc3QgaW9zRGF0YSA9IGRhdGEuc2NyZWVuTmFtZSA/IHtcbiAgICAgICAgc2NyZWVuX25hbWU6IGRhdGEuc2NyZWVuTmFtZSxcbiAgICAgIH0gOiB7XG4gICAgICAgIGlkOiBkYXRhLnVzZXJJZCxcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHVybDogJ3R3aXR0ZXI6Ly91c2VyPycsXG4gICAgICAgIGRhdGE6IGlvc0RhdGEsXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB1cmw6ICdodHRwczovL3R3aXR0ZXIuY29tL2ludGVudC91c2VyPycsXG4gICAgICBkYXRhOiB7XG4gICAgICAgIHNjcmVlbl9uYW1lOiBkYXRhLnNjcmVlbk5hbWUsXG4gICAgICAgIHVzZXJfaWQ6IGRhdGEudXNlcklkLFxuICAgICAgfSxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiA3MDAsXG4gICAgICAgIGhlaWdodDogMjk2LFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBGYWNlYm9vayBzaGFyZSBVUkxcbiAgZmFjZWJvb2soZGF0YSkge1xuICAgIHJldHVybiB7XG4gICAgICB1cmw6ICdodHRwczovL3d3dy5mYWNlYm9vay5jb20vZGlhbG9nL2ZlZWQ/YXBwX2lkPTk2MTM0MjU0MzkyMjMyMiZyZWRpcmVjdF91cmk9aHR0cDovL2ZhY2Vib29rLmNvbSYnLFxuICAgICAgZGF0YSxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiA1NjAsXG4gICAgICAgIGhlaWdodDogNTkzLFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gICAgLy8gc2V0IEZhY2Vib29rIHNlbmQgVVJMXG4gIGZhY2Vib29rU2VuZChkYXRhKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogJ2h0dHBzOi8vd3d3LmZhY2Vib29rLmNvbS9kaWFsb2cvc2VuZD9hcHBfaWQ9OTYxMzQyNTQzOTIyMzIyJnJlZGlyZWN0X3VyaT1odHRwOi8vZmFjZWJvb2suY29tJicsXG4gICAgICBkYXRhLFxuICAgICAgcG9wdXA6IHtcbiAgICAgICAgd2lkdGg6IDk4MCxcbiAgICAgICAgaGVpZ2h0OiA1OTYsXG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgLy8gc2V0IFlvdVR1YmUgcGxheSBVUkxcbiAgeW91dHViZShkYXRhLCBpb3MgPSBmYWxzZSkge1xuICAgIC8vIGlmIGlPUyB1c2VyXG4gICAgaWYgKGlvcyAmJiBkYXRhLmlvcykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdXJsOiBgeW91dHViZToke2RhdGEudmlkZW99P2AsXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB1cmw6IGBodHRwczovL3d3dy55b3V0dWJlLmNvbS93YXRjaD92PSR7ZGF0YS52aWRlb30/YCxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiAxMDg2LFxuICAgICAgICBoZWlnaHQ6IDYwOCxcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgWW91VHViZSBzdWJjcmliZSBVUkxcbiAgeW91dHViZVN1YnNjcmliZShkYXRhLCBpb3MgPSBmYWxzZSkge1xuICAgIC8vIGlmIGlPUyB1c2VyXG4gICAgaWYgKGlvcyAmJiBkYXRhLmlvcykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdXJsOiBgeW91dHViZTovL3d3dy55b3V0dWJlLmNvbS91c2VyLyR7ZGF0YS51c2VyfT9gLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgdXJsOiBgaHR0cHM6Ly93d3cueW91dHViZS5jb20vdXNlci8ke2RhdGEudXNlcn0/YCxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiA4ODAsXG4gICAgICAgIGhlaWdodDogMzUwLFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBJbnN0YWdyYW0gZm9sbG93IFVSTFxuICBpbnN0YWdyYW0oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogJ2luc3RhZ3JhbTovL2NhbWVyYT8nLFxuICAgIH07XG4gIH0sXG5cbiAgLy8gc2V0IEluc3RhZ3JhbSBmb2xsb3cgVVJMXG4gIGluc3RhZ3JhbUZvbGxvdyhkYXRhLCBpb3MgPSBmYWxzZSkge1xuICAgIC8vIGlmIGlPUyB1c2VyXG4gICAgaWYgKGlvcyAmJiBkYXRhLmlvcykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdXJsOiAnaW5zdGFncmFtOi8vdXNlcj8nLFxuICAgICAgICBkYXRhLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgdXJsOiBgaHR0cDovL3d3dy5pbnN0YWdyYW0uY29tLyR7ZGF0YS51c2VybmFtZX0/YCxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiA5ODAsXG4gICAgICAgIGhlaWdodDogNjU1LFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBTbmFwY2hhdCBmb2xsb3cgVVJMXG4gIHNuYXBjaGF0KGRhdGEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdXJsOiBgc25hcGNoYXQ6Ly9hZGQvJHtkYXRhLnVzZXJuYW1lfT9gLFxuICAgIH07XG4gIH0sXG5cbiAgLy8gc2V0IEdvb2dsZSBzaGFyZSBVUkxcbiAgZ29vZ2xlKGRhdGEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdXJsOiAnaHR0cHM6Ly9wbHVzLmdvb2dsZS5jb20vc2hhcmU/JyxcbiAgICAgIGRhdGEsXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogNDk1LFxuICAgICAgICBoZWlnaHQ6IDgxNSxcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgR29vZ2xlIG1hcHMgVVJMXG4gIGdvb2dsZU1hcHMoZGF0YSwgaW9zID0gZmFsc2UpIHtcbiAgICBpZiAoZGF0YS5zZWFyY2gpIHtcbiAgICAgIGRhdGEucSA9IGRhdGEuc2VhcmNoO1xuICAgICAgZGVsZXRlIGRhdGEuc2VhcmNoO1xuICAgIH1cblxuICAgIC8vIGlmIGlPUyB1c2VyIGFuZCBpb3MgZGF0YSBhdHRyaWJ1dGUgZGVmaW5lZFxuICAgIGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHVybDogJ2NvbWdvb2dsZW1hcHM6Ly8/JyxcbiAgICAgICAgZGF0YTogaW9zLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAoIWlvcyAmJiBkYXRhLmlvcykge1xuICAgICAgZGVsZXRlIGRhdGEuaW9zO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB1cmw6ICdodHRwczovL21hcHMuZ29vZ2xlLmNvbS8/JyxcbiAgICAgIGRhdGEsXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogODAwLFxuICAgICAgICBoZWlnaHQ6IDYwMCxcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgUGludGVyZXN0IHNoYXJlIFVSTFxuICBwaW50ZXJlc3QoZGF0YSkge1xuICAgIHJldHVybiB7XG4gICAgICB1cmw6ICdodHRwczovL3BpbnRlcmVzdC5jb20vcGluL2NyZWF0ZS9ib29rbWFya2xldC8/JyxcbiAgICAgIGRhdGEsXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogNzQ1LFxuICAgICAgICBoZWlnaHQ6IDYyMCxcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgTGlua2VkSW4gc2hhcmUgVVJMXG4gIGxpbmtlZGluKGRhdGEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdXJsOiAnaHR0cDovL3d3dy5saW5rZWRpbi5jb20vc2hhcmVBcnRpY2xlPycsXG4gICAgICBkYXRhLFxuICAgICAgcG9wdXA6IHtcbiAgICAgICAgd2lkdGg6IDc4MCxcbiAgICAgICAgaGVpZ2h0OiA0OTIsXG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgLy8gc2V0IEJ1ZmZlciBzaGFyZSBVUkxcbiAgYnVmZmVyKGRhdGEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdXJsOiAnaHR0cDovL2J1ZmZlcmFwcC5jb20vYWRkPycsXG4gICAgICBkYXRhLFxuICAgICAgcG9wdXA6IHtcbiAgICAgICAgd2lkdGg6IDc0NSxcbiAgICAgICAgaGVpZ2h0OiAzNDUsXG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgLy8gc2V0IFR1bWJsciBzaGFyZSBVUkxcbiAgdHVtYmxyKGRhdGEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdXJsOiAnaHR0cHM6Ly93d3cudHVtYmxyLmNvbS93aWRnZXRzL3NoYXJlL3Rvb2w/JyxcbiAgICAgIGRhdGEsXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogNTQwLFxuICAgICAgICBoZWlnaHQ6IDk0MCxcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgUmVkZGl0IHNoYXJlIFVSTFxuICByZWRkaXQoZGF0YSkge1xuICAgIHJldHVybiB7XG4gICAgICB1cmw6ICdodHRwOi8vcmVkZGl0LmNvbS9zdWJtaXQ/JyxcbiAgICAgIGRhdGEsXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogODYwLFxuICAgICAgICBoZWlnaHQ6IDg4MCxcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgRmxpY2tyIGZvbGxvdyBVUkxcbiAgZmxpY2tyKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG4gICAgLy8gaWYgaU9TIHVzZXJcbiAgICBpZiAoaW9zICYmIGRhdGEuaW9zKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB1cmw6IGBmbGlja3I6Ly9waG90b3MvJHtkYXRhLnVzZXJuYW1lfT9gLFxuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogYGh0dHA6Ly93d3cuZmxpY2tyLmNvbS9waG90b3MvJHtkYXRhLnVzZXJuYW1lfT9gLFxuICAgICAgcG9wdXA6IHtcbiAgICAgICAgd2lkdGg6IDYwMCxcbiAgICAgICAgaGVpZ2h0OiA2NTAsXG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgLy8gc2V0IFdoYXRzQXBwIHNoYXJlIFVSTFxuICB3aGF0c2FwcChkYXRhKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogJ3doYXRzYXBwOi8vc2VuZD8nLFxuICAgICAgZGF0YSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBzbXMgc2hhcmUgVVJMXG4gIHNtcyhkYXRhLCBpb3MgPSBmYWxzZSkge1xuICAgIHJldHVybiB7XG4gICAgICB1cmw6IGlvcyA/ICdzbXM6JicgOiAnc21zOj8nLFxuICAgICAgZGF0YSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBFbWFpbCBzaGFyZSBVUkxcbiAgZW1haWwoZGF0YSkge1xuICAgIGxldCB1cmwgPSAnbWFpbHRvOic7XG5cbiAgICAvLyBpZiB0byBhZGRyZXNzIHNwZWNpZmllZCB0aGVuIGFkZCB0byBVUkxcbiAgICBpZiAoZGF0YS50byAhPT0gbnVsbCkge1xuICAgICAgdXJsICs9IGAke2RhdGEudG99YDtcbiAgICB9XG5cbiAgICB1cmwgKz0gJz8nO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHVybCxcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgc3ViamVjdDogZGF0YS5zdWJqZWN0LFxuICAgICAgICBib2R5OiBkYXRhLmJvZHksXG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgLy8gc2V0IEdpdGh1YiBmb3JrIFVSTFxuICBnaXRodWIoZGF0YSwgaW9zID0gZmFsc2UpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICAgIGxldCB1cmwgPSBkYXRhLnJlcG8gPyBgaHR0cHM6Ly9naXRodWIuY29tLyR7ZGF0YS5yZXBvfWAgOiBkYXRhLnVybDtcblxuICAgIGlmIChkYXRhLmlzc3VlKSB7XG4gICAgICB1cmwgKz0gYC9pc3N1ZXMvbmV3P3RpdGxlPSR7ZGF0YS5pc3N1ZX0mYm9keT0ke2RhdGEuYm9keX1gO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB1cmw6IGAke3VybH0/YCxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiAxMDIwLFxuICAgICAgICBoZWlnaHQ6IDMyMyxcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgRHJpYmJibGUgc2hhcmUgVVJMXG4gIGRyaWJiYmxlKGRhdGEsIGlvcyA9IGZhbHNlKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgICBjb25zdCB1cmwgPSBkYXRhLnNob3QgPyBgaHR0cHM6Ly9kcmliYmJsZS5jb20vc2hvdHMvJHtkYXRhLnNob3R9P2AgOiBgJHtkYXRhLnVybH0/YDtcbiAgICByZXR1cm4ge1xuICAgICAgdXJsLFxuICAgICAgcG9wdXA6IHtcbiAgICAgICAgd2lkdGg6IDQ0MCxcbiAgICAgICAgaGVpZ2h0OiA2NDAsXG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgY29kZXBlbihkYXRhKSB7XG4gICAgY29uc3QgdXJsID0gKGRhdGEucGVuICYmIGRhdGEudXNlcm5hbWUgJiYgZGF0YS52aWV3KSA/IGBodHRwczovL2NvZGVwZW4uaW8vJHtkYXRhLnVzZXJuYW1lfS8ke2RhdGEudmlld30vJHtkYXRhLnBlbn0/YCA6IGAke2RhdGEudXJsfT9gO1xuICAgIHJldHVybiB7XG4gICAgICB1cmwsXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogMTIwMCxcbiAgICAgICAgaGVpZ2h0OiA4MDAsXG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgcGF5cGFsKGRhdGEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZGF0YSxcbiAgICB9O1xuICB9LFxufTtcbiJdfQ==
