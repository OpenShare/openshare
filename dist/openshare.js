(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

module.exports = function (type, cb) {
  // eslint-disable-line
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
        ga('send', 'event', { // eslint-disable-line no-undef
          eventCategory: 'OpenShare Click',
          eventAction: platform,
          eventLabel: target,
          transport: 'beacon'
        });
      }

      if (type === 'social') {
        ga('send', { // eslint-disable-line no-undef
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
        event: 'OpenShare Count',
        platform: platform,
        resource: count,
        activity: 'count'
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
    event: 'OpenShare Share',
    platform: platform,
    resource: target,
    activity: 'share'
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiYW5hbHl0aWNzLmpzIiwibGliL2NvdW50UmVkdWNlLmpzIiwibGliL2Rhc2hUb0NhbWVsLmpzIiwibGliL2luaXQuanMiLCJsaWIvaW5pdGlhbGl6ZUNvdW50Tm9kZS5qcyIsImxpYi9pbml0aWFsaXplTm9kZXMuanMiLCJsaWIvaW5pdGlhbGl6ZVNoYXJlTm9kZS5qcyIsImxpYi9pbml0aWFsaXplV2F0Y2hlci5qcyIsImxpYi9zZXREYXRhLmpzIiwibGliL3NoYXJlLmpzIiwibGliL3N0b3JlQ291bnQuanMiLCJzcmMvYnJvd3Nlci5qcyIsInNyYy9tb2R1bGVzL2NvdW50LWFwaS5qcyIsInNyYy9tb2R1bGVzL2NvdW50LXRyYW5zZm9ybXMuanMiLCJzcmMvbW9kdWxlcy9jb3VudC5qcyIsInNyYy9tb2R1bGVzL2RhdGEtYXR0ci5qcyIsInNyYy9tb2R1bGVzL2V2ZW50cy5qcyIsInNyYy9tb2R1bGVzL29wZW4tc2hhcmUuanMiLCJzcmMvbW9kdWxlcy9zaGFyZS1hcGkuanMiLCJzcmMvbW9kdWxlcy9zaGFyZS10cmFuc2Zvcm1zLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxPQUFPLE9BQVAsR0FBaUIsVUFBVSxJQUFWLEVBQWdCLEVBQWhCLEVBQW9CO0FBQUM7QUFDcEMsTUFBTSxPQUFPLFNBQVMsT0FBVCxJQUFvQixTQUFTLFFBQTFDO0FBQ0EsTUFBTSxlQUFlLFNBQVMsWUFBOUI7O0FBRUEsTUFBSSxJQUFKLEVBQVUsdUJBQXVCLElBQXZCLEVBQTZCLEVBQTdCO0FBQ1YsTUFBSSxZQUFKLEVBQWtCLGNBQWMsRUFBZDtBQUNuQixDQU5EOztBQVFBLFNBQVMsc0JBQVQsQ0FBZ0MsSUFBaEMsRUFBc0MsRUFBdEMsRUFBMEM7QUFDeEMsTUFBSSxPQUFPLEVBQVgsRUFBZTtBQUNiLFFBQUksRUFBSixFQUFRO0FBQ1Y7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QXJYUSxFQXFYVztBQUFBLFFBQWIsR0FBYSx1RUFBUCxLQUFPO0FBQUU7QUFDMUIsUUFBSSxNQUFNLEtBQUssSUFBTCwyQkFBa0MsS0FBSyxJQUF2QyxHQUFnRCxLQUFLLEdBQS9EOztBQUVBLFFBQUksS0FBSyxLQUFULEVBQWdCO0FBQ2Qsb0NBQTRCLEtBQUssS0FBakMsY0FBK0MsS0FBSyxJQUFwRDtBQUNEOztBQUVELFdBQU87QUFDTCxXQUFRLEdBQVIsTUFESztBQUVMLGFBQU87QUFDTCxlQUFPLElBREY7QUFFTCxnQkFBUTtBQUZIO0FBRkYsS0FBUDtBQU9ELEdBblljOzs7QUFxWWY7QUFDQSxVQXRZZSxvQkFzWU4sSUF0WU0sRUFzWWE7QUFBQSxRQUFiLEdBQWEsdUVBQVAsS0FBTztBQUFFO0FBQzVCLFFBQU0sTUFBTSxLQUFLLElBQUwsbUNBQTBDLEtBQUssSUFBL0MsU0FBNEQsS0FBSyxHQUFqRSxNQUFaO0FBQ0EsV0FBTztBQUNMLGNBREs7QUFFTCxhQUFPO0FBQ0wsZUFBTyxHQURGO0FBRUwsZ0JBQVE7QUFGSDtBQUZGLEtBQVA7QUFPRCxHQS9ZYztBQWlaZixTQWpaZSxtQkFpWlAsSUFqWk8sRUFpWkQ7QUFDWixRQUFNLE1BQU8sS0FBSyxHQUFMLElBQVksS0FBSyxRQUFqQixJQUE2QixLQUFLLElBQW5DLDJCQUFpRSxLQUFLLFFBQXRFLFNBQWtGLEtBQUssSUFBdkYsU0FBK0YsS0FBSyxHQUFwRyxTQUFnSCxLQUFLLEdBQXJILE1BQVo7QUFDQSxXQUFPO0FBQ0wsY0FESztBQUVMLGFBQU87QUFDTCxlQUFPLElBREY7QUFFTCxnQkFBUTtBQUZIO0FBRkYsS0FBUDtBQU9ELEdBMVpjO0FBNFpmLFFBNVplLGtCQTRaUixJQTVaUSxFQTRaRjtBQUNYLFdBQU87QUFDTDtBQURLLEtBQVA7QUFHRDtBQWhhYyxDQUFqQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICh0eXBlLCBjYikgey8vIGVzbGludC1kaXNhYmxlLWxpbmVcbiAgY29uc3QgaXNHQSA9IHR5cGUgPT09ICdldmVudCcgfHwgdHlwZSA9PT0gJ3NvY2lhbCc7XG4gIGNvbnN0IGlzVGFnTWFuYWdlciA9IHR5cGUgPT09ICd0YWdNYW5hZ2VyJztcblxuICBpZiAoaXNHQSkgY2hlY2tJZkFuYWx5dGljc0xvYWRlZCh0eXBlLCBjYik7XG4gIGlmIChpc1RhZ01hbmFnZXIpIHNldFRhZ01hbmFnZXIoY2IpO1xufTtcblxuZnVuY3Rpb24gY2hlY2tJZkFuYWx5dGljc0xvYWRlZCh0eXBlLCBjYikge1xuICBpZiAod2luZG93LmdhKSB7XG4gICAgaWYgKGNiKSBjYigpO1xuICAvLyBiaW5kIHRvIHNoYXJlZCBldmVudCBvbiBlYWNoIGluZGl2aWR1YWwgbm9kZVxuICAgIGxpc3RlbigoZSkgPT4ge1xuICAgICAgY29uc3QgcGxhdGZvcm0gPSBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZScpO1xuICAgICAgY29uc3QgdGFyZ2V0ID0gZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtbGluaycpIHx8XG4gICAgICBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS11cmwnKSB8fFxuICAgICAgZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdXNlcm5hbWUnKSB8fFxuICAgICAgZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY2VudGVyJykgfHxcbiAgICAgIGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXNlYXJjaCcpIHx8XG4gICAgICBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1ib2R5Jyk7XG5cbiAgICAgIGlmICh0eXBlID09PSAnZXZlbnQnKSB7XG4gICAgICAgIGdhKCdzZW5kJywgJ2V2ZW50JywgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVuZGVmXG4gICAgICAgICAgZXZlbnRDYXRlZ29yeTogJ09wZW5TaGFyZSBDbGljaycsXG4gICAgICAgICAgZXZlbnRBY3Rpb246IHBsYXRmb3JtLFxuICAgICAgICAgIGV2ZW50TGFiZWw6IHRhcmdldCxcbiAgICAgICAgICB0cmFuc3BvcnQ6ICdiZWFjb24nLFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGUgPT09ICdzb2NpYWwnKSB7XG4gICAgICAgIGdhKCdzZW5kJywgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVuZGVmXG4gICAgICAgICAgaGl0VHlwZTogJ3NvY2lhbCcsXG4gICAgICAgICAgc29jaWFsTmV0d29yazogcGxhdGZvcm0sXG4gICAgICAgICAgc29jaWFsQWN0aW9uOiAnc2hhcmUnLFxuICAgICAgICAgIHNvY2lhbFRhcmdldDogdGFyZ2V0LFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGNoZWNrSWZBbmFseXRpY3NMb2FkZWQodHlwZSwgY2IpO1xuICAgIH0sIDEwMDApO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNldFRhZ01hbmFnZXIoY2IpIHtcbiAgaWYgKHdpbmRvdy5kYXRhTGF5ZXIgJiYgd2luZG93LmRhdGFMYXllclswXVsnZ3RtLnN0YXJ0J10pIHtcbiAgICBpZiAoY2IpIGNiKCk7XG5cbiAgICBsaXN0ZW4ob25TaGFyZVRhZ01hbmdlcik7XG5cbiAgICBnZXRDb3VudHMoKGUpID0+IHtcbiAgICAgIGNvbnN0IGNvdW50ID0gZS50YXJnZXQgP1xuICAgICAgZS50YXJnZXQuaW5uZXJIVE1MIDpcbiAgICAgIGUuaW5uZXJIVE1MO1xuXG4gICAgICBjb25zdCBwbGF0Zm9ybSA9IGUudGFyZ2V0ID9cbiAgICAgIGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50LXVybCcpIDpcbiAgICAgIGUuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY291bnQtdXJsJyk7XG5cbiAgICAgIHdpbmRvdy5kYXRhTGF5ZXIucHVzaCh7XG4gICAgICAgIGV2ZW50OiAnT3BlblNoYXJlIENvdW50JyxcbiAgICAgICAgcGxhdGZvcm0sXG4gICAgICAgIHJlc291cmNlOiBjb3VudCxcbiAgICAgICAgYWN0aXZpdHk6ICdjb3VudCcsXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHNldFRhZ01hbmFnZXIoY2IpO1xuICAgIH0sIDEwMDApO1xuICB9XG59XG5cbmZ1bmN0aW9uIGxpc3RlbihjYikge1xuICAvLyBiaW5kIHRvIHNoYXJlZCBldmVudCBvbiBlYWNoIGluZGl2aWR1YWwgbm9kZVxuICBbXS5mb3JFYWNoLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtb3Blbi1zaGFyZV0nKSwgKG5vZGUpID0+IHtcbiAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ09wZW5TaGFyZS5zaGFyZWQnLCBjYik7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRDb3VudHMoY2IpIHtcbiAgY29uc3QgY291bnROb2RlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtb3Blbi1zaGFyZS1jb3VudF0nKTtcblxuICBbXS5mb3JFYWNoLmNhbGwoY291bnROb2RlLCAobm9kZSkgPT4ge1xuICAgIGlmIChub2RlLnRleHRDb250ZW50KSBjYihub2RlKTtcbiAgICBlbHNlIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihgT3BlblNoYXJlLmNvdW50ZWQtJHtub2RlLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50LXVybCcpfWAsIGNiKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIG9uU2hhcmVUYWdNYW5nZXIoZSkge1xuICBjb25zdCBwbGF0Zm9ybSA9IGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlJyk7XG4gIGNvbnN0IHRhcmdldCA9IGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWxpbmsnKSB8fFxuICAgIGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXVybCcpIHx8XG4gICAgZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdXNlcm5hbWUnKSB8fFxuICAgIGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNlbnRlcicpIHx8XG4gICAgZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtc2VhcmNoJykgfHxcbiAgICBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1ib2R5Jyk7XG5cbiAgd2luZG93LmRhdGFMYXllci5wdXNoKHtcbiAgICBldmVudDogJ09wZW5TaGFyZSBTaGFyZScsXG4gICAgcGxhdGZvcm0sXG4gICAgcmVzb3VyY2U6IHRhcmdldCxcbiAgICBhY3Rpdml0eTogJ3NoYXJlJyxcbiAgfSk7XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGNvdW50UmVkdWNlO1xuXG5mdW5jdGlvbiByb3VuZCh4LCBwcmVjaXNpb24pIHtcblx0aWYgKHR5cGVvZiB4ICE9PSAnbnVtYmVyJykge1xuXHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIHZhbHVlIHRvIGJlIGEgbnVtYmVyJyk7XG5cdH1cblxuXHR2YXIgZXhwb25lbnQgPSBwcmVjaXNpb24gPiAwID8gJ2UnIDogJ2UtJztcblx0dmFyIGV4cG9uZW50TmVnID0gcHJlY2lzaW9uID4gMCA/ICdlLScgOiAnZSc7XG5cdHByZWNpc2lvbiA9IE1hdGguYWJzKHByZWNpc2lvbik7XG5cblx0cmV0dXJuIE51bWJlcihNYXRoLnJvdW5kKHggKyBleHBvbmVudCArIHByZWNpc2lvbikgKyBleHBvbmVudE5lZyArIHByZWNpc2lvbik7XG59XG5cbmZ1bmN0aW9uIHRob3VzYW5kaWZ5IChudW0pIHtcblx0cmV0dXJuIHJvdW5kKG51bS8xMDAwLCAxKSArICdLJztcbn1cblxuZnVuY3Rpb24gbWlsbGlvbmlmeSAobnVtKSB7XG5cdHJldHVybiByb3VuZChudW0vMTAwMDAwMCwgMSkgKyAnTSc7XG59XG5cbmZ1bmN0aW9uIGNvdW50UmVkdWNlIChlbCwgY291bnQsIGNiKSB7XG5cdGlmIChjb3VudCA+IDk5OTk5OSkgIHtcblx0XHRlbC5pbm5lckhUTUwgPSBtaWxsaW9uaWZ5KGNvdW50KTtcblx0XHRpZiAoY2IgICYmIHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykgY2IoZWwpO1xuXHR9IGVsc2UgaWYgKGNvdW50ID4gOTk5KSB7XG5cdFx0ZWwuaW5uZXJIVE1MID0gdGhvdXNhbmRpZnkoY291bnQpO1xuXHRcdGlmIChjYiAgJiYgdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSBjYihlbCk7XG5cdH0gZWxzZSB7XG5cdFx0ZWwuaW5uZXJIVE1MID0gY291bnQ7XG5cdFx0aWYgKGNiICAmJiB0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpIGNiKGVsKTtcblx0fVxufVxuIiwiLy8gdHlwZSBjb250YWlucyBhIGRhc2hcbi8vIHRyYW5zZm9ybSB0byBjYW1lbGNhc2UgZm9yIGZ1bmN0aW9uIHJlZmVyZW5jZVxuLy8gVE9ETzogb25seSBzdXBwb3J0cyBzaW5nbGUgZGFzaCwgc2hvdWxkIHNob3VsZCBzdXBwb3J0IG11bHRpcGxlXG5tb2R1bGUuZXhwb3J0cyA9IChkYXNoLCB0eXBlKSA9PiB7XG5cdGxldCBuZXh0Q2hhciA9IHR5cGUuc3Vic3RyKGRhc2ggKyAxLCAxKSxcblx0XHRncm91cCA9IHR5cGUuc3Vic3RyKGRhc2gsIDIpO1xuXG5cdHR5cGUgPSB0eXBlLnJlcGxhY2UoZ3JvdXAsIG5leHRDaGFyLnRvVXBwZXJDYXNlKCkpO1xuXHRyZXR1cm4gdHlwZTtcbn07XG4iLCJjb25zdCBpbml0aWFsaXplTm9kZXMgPSByZXF1aXJlKCcuL2luaXRpYWxpemVOb2RlcycpO1xuY29uc3QgaW5pdGlhbGl6ZVdhdGNoZXIgPSByZXF1aXJlKCcuL2luaXRpYWxpemVXYXRjaGVyJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gaW5pdDtcblxuZnVuY3Rpb24gaW5pdChvcHRzKSB7XG5cdHJldHVybiAoKSA9PiB7XG5cdFx0Y29uc3QgaW5pdE5vZGVzID0gaW5pdGlhbGl6ZU5vZGVzKHtcblx0XHRcdGFwaTogb3B0cy5hcGkgfHwgbnVsbCxcblx0XHRcdGNvbnRhaW5lcjogb3B0cy5jb250YWluZXIgfHwgZG9jdW1lbnQsXG5cdFx0XHRzZWxlY3Rvcjogb3B0cy5zZWxlY3Rvcixcblx0XHRcdGNiOiBvcHRzLmNiXG5cdFx0fSk7XG5cblx0XHRpbml0Tm9kZXMoKTtcblxuXHRcdC8vIGNoZWNrIGZvciBtdXRhdGlvbiBvYnNlcnZlcnMgYmVmb3JlIHVzaW5nLCBJRTExIG9ubHlcblx0XHRpZiAod2luZG93Lk11dGF0aW9uT2JzZXJ2ZXIgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0aW5pdGlhbGl6ZVdhdGNoZXIoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtb3Blbi1zaGFyZS13YXRjaF0nKSwgaW5pdE5vZGVzKTtcblx0XHR9XG5cdH07XG59XG4iLCJjb25zdCBDb3VudCA9IHJlcXVpcmUoJy4uL3NyYy9tb2R1bGVzL2NvdW50Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gaW5pdGlhbGl6ZUNvdW50Tm9kZTtcblxuZnVuY3Rpb24gaW5pdGlhbGl6ZUNvdW50Tm9kZShvcykge1xuXHQvLyBpbml0aWFsaXplIG9wZW4gc2hhcmUgb2JqZWN0IHdpdGggdHlwZSBhdHRyaWJ1dGVcblx0bGV0IHR5cGUgPSBvcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudCcpLFxuXHRcdHVybCA9IG9zLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50LXJlcG8nKSB8fFxuXHRcdFx0b3MuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY291bnQtc2hvdCcpIHx8XG5cdFx0XHRvcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudC11cmwnKSxcblx0XHRjb3VudCA9IG5ldyBDb3VudCh0eXBlLCB1cmwpO1xuXG5cdGNvdW50LmNvdW50KG9zKTtcblx0b3Muc2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtbm9kZScsIHR5cGUpO1xufVxuIiwiY29uc3QgRXZlbnRzID0gcmVxdWlyZSgnLi4vc3JjL21vZHVsZXMvZXZlbnRzJyk7XG5jb25zdCBhbmFseXRpY3MgPSByZXF1aXJlKCcuLi9hbmFseXRpY3MnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGluaXRpYWxpemVOb2RlcztcblxuZnVuY3Rpb24gaW5pdGlhbGl6ZU5vZGVzKG9wdHMpIHtcblx0Ly8gbG9vcCB0aHJvdWdoIG9wZW4gc2hhcmUgbm9kZSBjb2xsZWN0aW9uXG5cdHJldHVybiAoKSA9PiB7XG5cdFx0Ly8gY2hlY2sgZm9yIGFuYWx5dGljc1xuXHRcdGNoZWNrQW5hbHl0aWNzKCk7XG5cblx0XHRpZiAob3B0cy5hcGkpIHtcblx0XHRcdGxldCBub2RlcyA9IG9wdHMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwob3B0cy5zZWxlY3Rvcik7XG5cdFx0XHRbXS5mb3JFYWNoLmNhbGwobm9kZXMsIG9wdHMuY2IpO1xuXG5cdFx0XHQvLyB0cmlnZ2VyIGNvbXBsZXRlZCBldmVudFxuXHRcdFx0RXZlbnRzLnRyaWdnZXIoZG9jdW1lbnQsIG9wdHMuYXBpICsgJy1sb2FkZWQnKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gbG9vcCB0aHJvdWdoIG9wZW4gc2hhcmUgbm9kZSBjb2xsZWN0aW9uXG5cdFx0XHRsZXQgc2hhcmVOb2RlcyA9IG9wdHMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwob3B0cy5zZWxlY3Rvci5zaGFyZSk7XG5cdFx0XHRbXS5mb3JFYWNoLmNhbGwoc2hhcmVOb2Rlcywgb3B0cy5jYi5zaGFyZSk7XG5cblx0XHRcdC8vIHRyaWdnZXIgY29tcGxldGVkIGV2ZW50XG5cdFx0XHRFdmVudHMudHJpZ2dlcihkb2N1bWVudCwgJ3NoYXJlLWxvYWRlZCcpO1xuXG5cdFx0XHQvLyBsb29wIHRocm91Z2ggY291bnQgbm9kZSBjb2xsZWN0aW9uXG5cdFx0XHRsZXQgY291bnROb2RlcyA9IG9wdHMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwob3B0cy5zZWxlY3Rvci5jb3VudCk7XG5cdFx0XHRbXS5mb3JFYWNoLmNhbGwoY291bnROb2Rlcywgb3B0cy5jYi5jb3VudCk7XG5cblx0XHRcdC8vIHRyaWdnZXIgY29tcGxldGVkIGV2ZW50XG5cdFx0XHRFdmVudHMudHJpZ2dlcihkb2N1bWVudCwgJ2NvdW50LWxvYWRlZCcpO1xuXHRcdH1cblx0fTtcbn1cblxuZnVuY3Rpb24gY2hlY2tBbmFseXRpY3MgKCkge1xuXHQvLyBjaGVjayBmb3IgYW5hbHl0aWNzXG5cdGlmIChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbZGF0YS1vcGVuLXNoYXJlLWFuYWx5dGljc10nKSkge1xuXHRcdGNvbnN0IHByb3ZpZGVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignW2RhdGEtb3Blbi1zaGFyZS1hbmFseXRpY3NdJylcblx0XHRcdC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1hbmFseXRpY3MnKTtcblxuXHRcdGlmIChwcm92aWRlci5pbmRleE9mKCcsJykgPiAtMSkge1xuXHRcdFx0Y29uc3QgcHJvdmlkZXJzID0gcHJvdmlkZXIuc3BsaXQoJywnKTtcblx0XHRcdHByb3ZpZGVycy5mb3JFYWNoKHAgPT4gYW5hbHl0aWNzKHApKTtcblx0XHR9IGVsc2UgYW5hbHl0aWNzKHByb3ZpZGVyKTtcblxuXHR9XG59XG4iLCJjb25zdCBTaGFyZVRyYW5zZm9ybXMgPSByZXF1aXJlKCcuLi9zcmMvbW9kdWxlcy9zaGFyZS10cmFuc2Zvcm1zJyk7XG5jb25zdCBPcGVuU2hhcmUgPSByZXF1aXJlKCcuLi9zcmMvbW9kdWxlcy9vcGVuLXNoYXJlJyk7XG5jb25zdCBzZXREYXRhID0gcmVxdWlyZSgnLi9zZXREYXRhJyk7XG5jb25zdCBzaGFyZSA9IHJlcXVpcmUoJy4vc2hhcmUnKTtcbmNvbnN0IGRhc2hUb0NhbWVsID0gcmVxdWlyZSgnLi9kYXNoVG9DYW1lbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGluaXRpYWxpemVTaGFyZU5vZGU7XG5cbmZ1bmN0aW9uIGluaXRpYWxpemVTaGFyZU5vZGUob3MpIHtcblx0Ly8gaW5pdGlhbGl6ZSBvcGVuIHNoYXJlIG9iamVjdCB3aXRoIHR5cGUgYXR0cmlidXRlXG5cdGxldCB0eXBlID0gb3MuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUnKSxcblx0XHRkYXNoID0gdHlwZS5pbmRleE9mKCctJyksXG5cdFx0b3BlblNoYXJlO1xuXG5cdGlmIChkYXNoID4gLTEpIHtcblx0XHR0eXBlID0gZGFzaFRvQ2FtZWwoZGFzaCwgdHlwZSk7XG5cdH1cblxuXHRsZXQgdHJhbnNmb3JtID0gU2hhcmVUcmFuc2Zvcm1zW3R5cGVdO1xuXG5cdGlmICghdHJhbnNmb3JtKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKGBPcGVuIFNoYXJlOiAke3R5cGV9IGlzIGFuIGludmFsaWQgdHlwZWApO1xuXHR9XG5cblx0b3BlblNoYXJlID0gbmV3IE9wZW5TaGFyZSh0eXBlLCB0cmFuc2Zvcm0pO1xuXG5cdC8vIHNwZWNpZnkgaWYgdGhpcyBpcyBhIGR5bmFtaWMgaW5zdGFuY2Vcblx0aWYgKG9zLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWR5bmFtaWMnKSkge1xuXHRcdG9wZW5TaGFyZS5keW5hbWljID0gdHJ1ZTtcblx0fVxuXG5cdC8vIHNwZWNpZnkgaWYgdGhpcyBpcyBhIHBvcHVwIGluc3RhbmNlXG5cdGlmIChvcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1wb3B1cCcpKSB7XG5cdFx0b3BlblNoYXJlLnBvcHVwID0gdHJ1ZTtcblx0fVxuXG5cdC8vIHNldCBhbGwgb3B0aW9uYWwgYXR0cmlidXRlcyBvbiBvcGVuIHNoYXJlIGluc3RhbmNlXG5cdHNldERhdGEob3BlblNoYXJlLCBvcyk7XG5cblx0Ly8gb3BlbiBzaGFyZSBkaWFsb2cgb24gY2xpY2tcblx0b3MuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuXHRcdHNoYXJlKGUsIG9zLCBvcGVuU2hhcmUpO1xuXHR9KTtcblxuXHRvcy5hZGRFdmVudExpc3RlbmVyKCdPcGVuU2hhcmUudHJpZ2dlcicsIChlKSA9PiB7XG5cdFx0c2hhcmUoZSwgb3MsIG9wZW5TaGFyZSk7XG5cdH0pO1xuXG5cdG9zLnNldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLW5vZGUnLCB0eXBlKTtcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gaW5pdGlhbGl6ZVdhdGNoZXI7XG5cbmZ1bmN0aW9uIGluaXRpYWxpemVXYXRjaGVyKHdhdGNoZXIsIGZuKSB7XG5cdFtdLmZvckVhY2guY2FsbCh3YXRjaGVyLCAodykgPT4ge1xuXHRcdHZhciBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKChtdXRhdGlvbnMpID0+IHtcblx0XHRcdC8vIHRhcmdldCB3aWxsIG1hdGNoIGJldHdlZW4gYWxsIG11dGF0aW9ucyBzbyBqdXN0IHVzZSBmaXJzdFxuXHRcdFx0Zm4obXV0YXRpb25zWzBdLnRhcmdldCk7XG5cdFx0fSk7XG5cblx0XHRvYnNlcnZlci5vYnNlcnZlKHcsIHtcblx0XHRcdGNoaWxkTGlzdDogdHJ1ZVxuXHRcdH0pO1xuXHR9KTtcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gc2V0RGF0YTtcblxuZnVuY3Rpb24gc2V0RGF0YShvc0luc3RhbmNlLCBvc0VsZW1lbnQpIHtcblx0b3NJbnN0YW5jZS5zZXREYXRhKHtcblx0XHR1cmw6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS11cmwnKSxcblx0XHR0ZXh0OiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdGV4dCcpLFxuXHRcdHZpYTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXZpYScpLFxuXHRcdGhhc2h0YWdzOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtaGFzaHRhZ3MnKSxcblx0XHR0d2VldElkOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdHdlZXQtaWQnKSxcblx0XHRyZWxhdGVkOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtcmVsYXRlZCcpLFxuXHRcdHNjcmVlbk5hbWU6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1zY3JlZW4tbmFtZScpLFxuXHRcdHVzZXJJZDogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXVzZXItaWQnKSxcblx0XHRsaW5rOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtbGluaycpLFxuXHRcdHBpY3R1cmU6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1waWN0dXJlJyksXG5cdFx0Y2FwdGlvbjogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNhcHRpb24nKSxcblx0XHRkZXNjcmlwdGlvbjogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWRlc2NyaXB0aW9uJyksXG5cdFx0dXNlcjogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXVzZXInKSxcblx0XHR2aWRlbzogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXZpZGVvJyksXG5cdFx0dXNlcm5hbWU6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS11c2VybmFtZScpLFxuXHRcdHRpdGxlOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdGl0bGUnKSxcblx0XHRtZWRpYTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLW1lZGlhJyksXG5cdFx0dG86IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS10bycpLFxuXHRcdHN1YmplY3Q6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1zdWJqZWN0JyksXG5cdFx0Ym9keTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWJvZHknKSxcblx0XHRpb3M6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1pb3MnKSxcblx0XHR0eXBlOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdHlwZScpLFxuXHRcdGNlbnRlcjogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNlbnRlcicpLFxuXHRcdHZpZXdzOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdmlld3MnKSxcblx0XHR6b29tOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtem9vbScpLFxuXHRcdHNlYXJjaDogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXNlYXJjaCcpLFxuXHRcdHNhZGRyOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtc2FkZHInKSxcblx0XHRkYWRkcjogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWRhZGRyJyksXG5cdFx0ZGlyZWN0aW9uc21vZGU6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1kaXJlY3Rpb25zLW1vZGUnKSxcblx0XHRyZXBvOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtcmVwbycpLFxuXHRcdHNob3Q6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1zaG90JyksXG5cdFx0cGVuOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtcGVuJyksXG5cdFx0dmlldzogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXZpZXcnKSxcblx0XHRpc3N1ZTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWlzc3VlJyksXG5cdFx0YnV0dG9uSWQ6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1idXR0b25JZCcpLFxuXHRcdHBvcFVwOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtcG9wdXAnKSxcblx0XHRrZXk6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1rZXknKVxuXHR9KTtcbn1cbiIsImNvbnN0IEV2ZW50cyA9IHJlcXVpcmUoJy4uL3NyYy9tb2R1bGVzL2V2ZW50cycpO1xuY29uc3Qgc2V0RGF0YSA9IHJlcXVpcmUoJy4vc2V0RGF0YScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNoYXJlO1xuXG5mdW5jdGlvbiBzaGFyZShlLCBvcywgb3BlblNoYXJlKSB7XG5cdC8vIGlmIGR5bmFtaWMgaW5zdGFuY2UgdGhlbiBmZXRjaCBhdHRyaWJ1dGVzIGFnYWluIGluIGNhc2Ugb2YgdXBkYXRlc1xuXHRpZiAob3BlblNoYXJlLmR5bmFtaWMpIHtcblx0XHRzZXREYXRhKG9wZW5TaGFyZSwgb3MpO1xuXHR9XG5cblx0b3BlblNoYXJlLnNoYXJlKGUpO1xuXG5cdC8vIHRyaWdnZXIgc2hhcmVkIGV2ZW50XG5cdEV2ZW50cy50cmlnZ2VyKG9zLCAnc2hhcmVkJyk7XG59XG4iLCIvKlxuICAgU29tZXRpbWVzIHNvY2lhbCBwbGF0Zm9ybXMgZ2V0IGNvbmZ1c2VkIGFuZCBkcm9wIHNoYXJlIGNvdW50cy5cbiAgIEluIHRoaXMgbW9kdWxlIHdlIGNoZWNrIGlmIHRoZSByZXR1cm5lZCBjb3VudCBpcyBsZXNzIHRoYW4gdGhlIGNvdW50IGluXG4gICBsb2NhbHN0b3JhZ2UuXG4gICBJZiB0aGUgbG9jYWwgY291bnQgaXMgZ3JlYXRlciB0aGFuIHRoZSByZXR1cm5lZCBjb3VudCxcbiAgIHdlIHN0b3JlIHRoZSBsb2NhbCBjb3VudCArIHRoZSByZXR1cm5lZCBjb3VudC5cbiAgIE90aGVyd2lzZSwgc3RvcmUgdGhlIHJldHVybmVkIGNvdW50LlxuKi9cblxubW9kdWxlLmV4cG9ydHMgPSAodCwgY291bnQpID0+IHtcblx0Y29uc3QgaXNBcnIgPSB0LnR5cGUuaW5kZXhPZignLCcpID4gLTE7XG5cdGNvbnN0IGxvY2FsID0gTnVtYmVyKHQuc3RvcmVHZXQodC50eXBlICsgJy0nICsgdC5zaGFyZWQpKTtcblxuXHRpZiAobG9jYWwgPiBjb3VudCAmJiAhaXNBcnIpIHtcblx0XHRjb25zdCBsYXRlc3RDb3VudCA9IE51bWJlcih0LnN0b3JlR2V0KHQudHlwZSArICctJyArIHQuc2hhcmVkICsgJy1sYXRlc3RDb3VudCcpKTtcblx0XHR0LnN0b3JlU2V0KHQudHlwZSArICctJyArIHQuc2hhcmVkICsgJy1sYXRlc3RDb3VudCcsIGNvdW50KTtcblxuXHRcdGNvdW50ID0gaXNOdW1lcmljKGxhdGVzdENvdW50KSAmJiBsYXRlc3RDb3VudCA+IDAgP1xuXHRcdFx0Y291bnQgKz0gbG9jYWwgLSBsYXRlc3RDb3VudCA6XG5cdFx0XHRjb3VudCArPSBsb2NhbDtcblxuXHR9XG5cblx0aWYgKCFpc0FycikgdC5zdG9yZVNldCh0LnR5cGUgKyAnLScgKyB0LnNoYXJlZCwgY291bnQpO1xuXHRyZXR1cm4gY291bnQ7XG59O1xuXG5mdW5jdGlvbiBpc051bWVyaWMobikge1xuICByZXR1cm4gIWlzTmFOKHBhcnNlRmxvYXQobikpICYmIGlzRmluaXRlKG4pO1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gKCkgeyAvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgY29uc3QgRGF0YUF0dHIgPSByZXF1aXJlKCcuL21vZHVsZXMvZGF0YS1hdHRyJyksXG4gICAgU2hhcmVBUEkgPSByZXF1aXJlKCcuL21vZHVsZXMvc2hhcmUtYXBpJyksXG4gICAgRXZlbnRzID0gcmVxdWlyZSgnLi9tb2R1bGVzL2V2ZW50cycpLFxuICAgIE9wZW5TaGFyZSA9IHJlcXVpcmUoJy4vbW9kdWxlcy9vcGVuLXNoYXJlJyksXG4gICAgU2hhcmVUcmFuc2Zvcm1zID0gcmVxdWlyZSgnLi9tb2R1bGVzL3NoYXJlLXRyYW5zZm9ybXMnKSxcbiAgICBDb3VudCA9IHJlcXVpcmUoJy4vbW9kdWxlcy9jb3VudCcpLFxuICAgIENvdW50QVBJID0gcmVxdWlyZSgnLi9tb2R1bGVzL2NvdW50LWFwaScpLFxuICAgIGFuYWx5dGljc0FQSSA9IHJlcXVpcmUoJy4uL2FuYWx5dGljcycpO1xuXG4gIERhdGFBdHRyKE9wZW5TaGFyZSwgQ291bnQsIFNoYXJlVHJhbnNmb3JtcywgRXZlbnRzKTtcbiAgd2luZG93Lk9wZW5TaGFyZSA9IHtcbiAgICBzaGFyZTogU2hhcmVBUEkoT3BlblNoYXJlLCBTaGFyZVRyYW5zZm9ybXMsIEV2ZW50cyksXG4gICAgY291bnQ6IENvdW50QVBJKCksXG4gICAgYW5hbHl0aWNzOiBhbmFseXRpY3NBUEksXG4gIH07XG59KCkpO1xuIiwiLyoqXG4gKiBjb3VudCBBUElcbiAqL1xuXG5jb25zdCBjb3VudCA9IHJlcXVpcmUoJy4vY291bnQnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoKSB7IC8vZXNsaW50LWRpc2FibGUtbGluZVxuICAvLyBnbG9iYWwgT3BlblNoYXJlIHJlZmVyZW5jaW5nIGludGVybmFsIGNsYXNzIGZvciBpbnN0YW5jZSBnZW5lcmF0aW9uXG4gIGNsYXNzIENvdW50IHtcblxuICAgIGNvbnN0cnVjdG9yKHtcbiAgICAgIHR5cGUsXG4gICAgICB1cmwsXG4gICAgICBhcHBlbmRUbyA9IGZhbHNlLFxuICAgICAgZWxlbWVudCxcbiAgICAgIGNsYXNzZXMsXG4gICAgICBrZXkgPSBudWxsLFxuICAgIH0sIGNiKSB7XG4gICAgICBjb25zdCBjb3VudE5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGVsZW1lbnQgfHwgJ3NwYW4nKTtcblxuICAgICAgY291bnROb2RlLnNldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50JywgdHlwZSk7XG4gICAgICBjb3VudE5vZGUuc2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY291bnQtdXJsJywgdXJsKTtcbiAgICAgIGlmIChrZXkpIGNvdW50Tm9kZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1rZXknLCBrZXkpO1xuXG4gICAgICBjb3VudE5vZGUuY2xhc3NMaXN0LmFkZCgnb3Blbi1zaGFyZS1jb3VudCcpO1xuXG4gICAgICBpZiAoY2xhc3NlcyAmJiBBcnJheS5pc0FycmF5KGNsYXNzZXMpKSB7XG4gICAgICAgIGNsYXNzZXMuZm9yRWFjaCgoY3NzQ0xhc3MpID0+IHtcbiAgICAgICAgICBjb3VudE5vZGUuY2xhc3NMaXN0LmFkZChjc3NDTGFzcyk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoYXBwZW5kVG8pIHtcbiAgICAgICAgcmV0dXJuIG5ldyBjb3VudCh0eXBlLCB1cmwpLmNvdW50KGNvdW50Tm9kZSwgY2IsIGFwcGVuZFRvKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ldyBjb3VudCh0eXBlLCB1cmwpLmNvdW50KGNvdW50Tm9kZSwgY2IpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBDb3VudDtcbn07XG4iLCJjb25zdCBjb3VudFJlZHVjZSA9IHJlcXVpcmUoJy4uLy4uL2xpYi9jb3VudFJlZHVjZScpO1xuY29uc3Qgc3RvcmVDb3VudCA9IHJlcXVpcmUoJy4uLy4uL2xpYi9zdG9yZUNvdW50Jyk7XG5cbi8qKlxuICogT2JqZWN0IG9mIHRyYW5zZm9ybSBmdW5jdGlvbnMgZm9yIGVhY2ggb3BlbnNoYXJlIGFwaVxuICogVHJhbnNmb3JtIGZ1bmN0aW9ucyBwYXNzZWQgaW50byBPcGVuU2hhcmUgaW5zdGFuY2Ugd2hlbiBpbnN0YW50aWF0ZWRcbiAqIFJldHVybiBvYmplY3QgY29udGFpbmluZyBVUkwgYW5kIGtleS92YWx1ZSBhcmdzXG4gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gIC8vIGZhY2Vib29rIGNvdW50IGRhdGFcbiAgZmFjZWJvb2sodXJsKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6ICdnZXQnLFxuICAgICAgdXJsOiBgaHR0cHM6Ly9ncmFwaC5mYWNlYm9vay5jb20vP2lkPSR7dXJsfWAsXG4gICAgICB0cmFuc2Zvcm0oeGhyKSB7XG4gICAgICAgIGNvbnN0IGZiID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KTtcblxuICAgICAgICBjb25zdCBjb3VudCA9IGZiLnNoYXJlICYmIGZiLnNoYXJlLnNoYXJlX2NvdW50IHx8IDA7XG5cbiAgICAgICAgcmV0dXJuIHN0b3JlQ291bnQodGhpcywgY291bnQpO1xuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4vLyBwaW50ZXJlc3QgY291bnQgZGF0YVxuICBwaW50ZXJlc3QodXJsKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6ICdqc29ucCcsXG4gICAgICB1cmw6IGBodHRwczovL2FwaS5waW50ZXJlc3QuY29tL3YxL3VybHMvY291bnQuanNvbj9jYWxsYmFjaz0/JnVybD0ke3VybH1gLFxuICAgICAgdHJhbnNmb3JtKGRhdGEpIHtcbiAgICAgICAgY29uc3QgY291bnQgPSBkYXRhLmNvdW50O1xuICAgICAgICByZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBjb3VudCk7XG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgLy8gbGlua2VkaW4gY291bnQgZGF0YVxuICBsaW5rZWRpbih1cmwpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ2pzb25wJyxcbiAgICAgIHVybDogYGh0dHBzOi8vd3d3LmxpbmtlZGluLmNvbS9jb3VudHNlcnYvY291bnQvc2hhcmU/dXJsPSR7dXJsfSZmb3JtYXQ9anNvbnAmY2FsbGJhY2s9P2AsXG4gICAgICB0cmFuc2Zvcm0oZGF0YSkge1xuICAgICAgICBjb25zdCBjb3VudCA9IGRhdGEuY291bnQ7XG4gICAgICAgIHJldHVybiBzdG9yZUNvdW50KHRoaXMsIGNvdW50KTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyByZWRkaXQgY291bnQgZGF0YVxuICByZWRkaXQodXJsKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6ICdnZXQnLFxuICAgICAgdXJsOiBgaHR0cHM6Ly93d3cucmVkZGl0LmNvbS9hcGkvaW5mby5qc29uP3VybD0ke3VybH1gLFxuICAgICAgdHJhbnNmb3JtKHhocikge1xuICAgICAgICBjb25zdCBwb3N0cyA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCkuZGF0YS5jaGlsZHJlbjtcbiAgICAgICAgbGV0IHVwcyA9IDA7XG5cbiAgICAgICAgcG9zdHMuZm9yRWFjaCgocG9zdCkgPT4ge1xuICAgICAgICAgIHVwcyArPSBOdW1iZXIocG9zdC5kYXRhLnVwcyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBzdG9yZUNvdW50KHRoaXMsIHVwcyk7XG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbi8vIGdvb2dsZSBjb3VudCBkYXRhXG4gIGdvb2dsZSh1cmwpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ3Bvc3QnLFxuICAgICAgZGF0YToge1xuICAgICAgICBtZXRob2Q6ICdwb3MucGx1c29uZXMuZ2V0JyxcbiAgICAgICAgaWQ6ICdwJyxcbiAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgbm9sb2c6IHRydWUsXG4gICAgICAgICAgaWQ6IHVybCxcbiAgICAgICAgICBzb3VyY2U6ICd3aWRnZXQnLFxuICAgICAgICAgIHVzZXJJZDogJ0B2aWV3ZXInLFxuICAgICAgICAgIGdyb3VwSWQ6ICdAc2VsZicsXG4gICAgICAgIH0sXG4gICAgICAgIGpzb25ycGM6ICcyLjAnLFxuICAgICAgICBrZXk6ICdwJyxcbiAgICAgICAgYXBpVmVyc2lvbjogJ3YxJyxcbiAgICAgIH0sXG4gICAgICB1cmw6ICdodHRwczovL2NsaWVudHM2Lmdvb2dsZS5jb20vcnBjJyxcbiAgICAgIHRyYW5zZm9ybSh4aHIpIHtcbiAgICAgICAgY29uc3QgY291bnQgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpLnJlc3VsdC5tZXRhZGF0YS5nbG9iYWxDb3VudHMuY291bnQ7XG4gICAgICAgIHJldHVybiBzdG9yZUNvdW50KHRoaXMsIGNvdW50KTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBnaXRodWIgc3RhciBjb3VudFxuICBnaXRodWJTdGFycyhyZXBvKSB7XG4gICAgcmVwbyA9IHJlcG8uaW5kZXhPZignZ2l0aHViLmNvbS8nKSA+IC0xID9cbiAgICByZXBvLnNwbGl0KCdnaXRodWIuY29tLycpWzFdIDpcbiAgICByZXBvO1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiAnZ2V0JyxcbiAgICAgIHVybDogYGh0dHBzOi8vYXBpLmdpdGh1Yi5jb20vcmVwb3MvJHtyZXBvfWAsXG4gICAgICB0cmFuc2Zvcm0oeGhyKSB7XG4gICAgICAgIGNvbnN0IGNvdW50ID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KS5zdGFyZ2F6ZXJzX2NvdW50O1xuICAgICAgICByZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBjb3VudCk7XG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgLy8gZ2l0aHViIGZvcmtzIGNvdW50XG4gIGdpdGh1YkZvcmtzKHJlcG8pIHtcbiAgICByZXBvID0gcmVwby5pbmRleE9mKCdnaXRodWIuY29tLycpID4gLTEgP1xuICAgIHJlcG8uc3BsaXQoJ2dpdGh1Yi5jb20vJylbMV0gOlxuICAgIHJlcG87XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6ICdnZXQnLFxuICAgICAgdXJsOiBgaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9yZXBvcy8ke3JlcG99YCxcbiAgICAgIHRyYW5zZm9ybSh4aHIpIHtcbiAgICAgICAgY29uc3QgY291bnQgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpLmZvcmtzX2NvdW50O1xuICAgICAgICByZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBjb3VudCk7XG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgLy8gZ2l0aHViIHdhdGNoZXJzIGNvdW50XG4gIGdpdGh1YldhdGNoZXJzKHJlcG8pIHtcbiAgICByZXBvID0gcmVwby5pbmRleE9mKCdnaXRodWIuY29tLycpID4gLTEgP1xuICAgIHJlcG8uc3BsaXQoJ2dpdGh1Yi5jb20vJylbMV0gOlxuICAgIHJlcG87XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6ICdnZXQnLFxuICAgICAgdXJsOiBgaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9yZXBvcy8ke3JlcG99YCxcbiAgICAgIHRyYW5zZm9ybSh4aHIpIHtcbiAgICAgICAgY29uc3QgY291bnQgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpLndhdGNoZXJzX2NvdW50O1xuICAgICAgICByZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBjb3VudCk7XG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgLy8gZHJpYmJibGUgbGlrZXMgY291bnRcbiAgZHJpYmJibGUoc2hvdCkge1xuICAgIHNob3QgPSBzaG90LmluZGV4T2YoJ2RyaWJiYmxlLmNvbS9zaG90cycpID4gLTEgP1xuICAgIHNob3Quc3BsaXQoJ3Nob3RzLycpWzFdIDpcbiAgICBzaG90O1xuICAgIGNvbnN0IHVybCA9IGBodHRwczovL2FwaS5kcmliYmJsZS5jb20vdjEvc2hvdHMvJHtzaG90fS9saWtlc2A7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6ICdnZXQnLFxuICAgICAgdXJsLFxuICAgICAgdHJhbnNmb3JtKHhociwgRXZlbnRzKSB7XG4gICAgICAgIGNvbnN0IGNvdW50ID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KS5sZW5ndGg7XG5cbiAgICAgICAgLy8gYXQgdGhpcyB0aW1lIGRyaWJiYmxlIGxpbWl0cyBhIHJlc3BvbnNlIG9mIDEyIGxpa2VzIHBlciBwYWdlXG4gICAgICAgIGlmIChjb3VudCA9PT0gMTIpIHtcbiAgICAgICAgICBjb25zdCBwYWdlID0gMjtcbiAgICAgICAgICByZWN1cnNpdmVDb3VudCh1cmwsIHBhZ2UsIGNvdW50LCAoZmluYWxDb3VudCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuYXBwZW5kVG8gJiYgdHlwZW9mIHRoaXMuYXBwZW5kVG8gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgdGhpcy5hcHBlbmRUby5hcHBlbmRDaGlsZCh0aGlzLm9zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvdW50UmVkdWNlKHRoaXMub3MsIGZpbmFsQ291bnQsIHRoaXMuY2IpO1xuICAgICAgICAgICAgRXZlbnRzLnRyaWdnZXIodGhpcy5vcywgYGNvdW50ZWQtJHt0aGlzLnVybH1gKTtcbiAgICAgICAgICAgIHJldHVybiBzdG9yZUNvdW50KHRoaXMsIGZpbmFsQ291bnQpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBzdG9yZUNvdW50KHRoaXMsIGNvdW50KTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIHR3aXR0ZXIodXJsKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6ICdnZXQnLFxuICAgICAgdXJsOiBgaHR0cHM6Ly9hcGkub3BlbnNoYXJlLnNvY2lhbC9qb2I/dXJsPSR7dXJsfSZrZXk9YCxcbiAgICAgIHRyYW5zZm9ybSh4aHIpIHtcbiAgICAgICAgY29uc3QgY291bnQgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpLmNvdW50O1xuICAgICAgICByZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBjb3VudCk7XG4gICAgICB9LFxuICAgIH07XG4gIH0sXG59O1xuXG5mdW5jdGlvbiByZWN1cnNpdmVDb3VudCh1cmwsIHBhZ2UsIGNvdW50LCBjYikge1xuICBjb25zdCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgeGhyLm9wZW4oJ0dFVCcsIGAke3VybH0/cGFnZT0ke3BhZ2V9YCk7XG4gIHhoci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkgeyAvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgICBjb25zdCBsaWtlcyA9IEpTT04ucGFyc2UodGhpcy5yZXNwb25zZSk7XG4gICAgY291bnQgKz0gbGlrZXMubGVuZ3RoO1xuXG4gICAgLy8gZHJpYmJibGUgbGlrZSBwZXIgcGFnZSBpcyAxMlxuICAgIGlmIChsaWtlcy5sZW5ndGggPT09IDEyKSB7XG4gICAgICBwYWdlKys7XG4gICAgICByZWN1cnNpdmVDb3VudCh1cmwsIHBhZ2UsIGNvdW50LCBjYik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNiKGNvdW50KTtcbiAgICB9XG4gIH0pO1xuICB4aHIuc2VuZCgpO1xufVxuIiwiLyoqXG4gKiBHZW5lcmF0ZSBzaGFyZSBjb3VudCBpbnN0YW5jZSBmcm9tIG9uZSB0byBtYW55IG5ldHdvcmtzXG4gKi9cblxuY29uc3QgQ291bnRUcmFuc2Zvcm1zID0gcmVxdWlyZSgnLi9jb3VudC10cmFuc2Zvcm1zJyk7XG5jb25zdCBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xuY29uc3QgY291bnRSZWR1Y2UgPSByZXF1aXJlKCcuLi8uLi9saWIvY291bnRSZWR1Y2UnKTtcbmNvbnN0IHN0b3JlQ291bnQgPSByZXF1aXJlKCcuLi8uLi9saWIvc3RvcmVDb3VudCcpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgQ291bnQge1xuICBjb25zdHJ1Y3Rvcih0eXBlLCB1cmwpIHtcbiAgICAvLyB0aHJvdyBlcnJvciBpZiBubyB1cmwgcHJvdmlkZWRcbiAgICBpZiAoIXVybCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdPcGVuIFNoYXJlOiBubyB1cmwgcHJvdmlkZWQgZm9yIGNvdW50Jyk7XG4gICAgfVxuXG4gICAgLy8gY2hlY2sgZm9yIEdpdGh1YiBjb3VudHNcbiAgICBpZiAodHlwZS5pbmRleE9mKCdnaXRodWInKSA9PT0gMCkge1xuICAgICAgaWYgKHR5cGUgPT09ICdnaXRodWItc3RhcnMnKSB7XG4gICAgICAgIHR5cGUgPSAnZ2l0aHViU3RhcnMnO1xuICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAnZ2l0aHViLWZvcmtzJykge1xuICAgICAgICB0eXBlID0gJ2dpdGh1YkZvcmtzJztcbiAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ2dpdGh1Yi13YXRjaGVycycpIHtcbiAgICAgICAgdHlwZSA9ICdnaXRodWJXYXRjaGVycyc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdJbnZhbGlkIEdpdGh1YiBjb3VudCB0eXBlLiBUcnkgZ2l0aHViLXN0YXJzLCBnaXRodWItZm9ya3MsIG9yIGdpdGh1Yi13YXRjaGVycy4nKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBpZiB0eXBlIGlzIGNvbW1hIHNlcGFyYXRlIGxpc3QgY3JlYXRlIGFycmF5XG4gICAgaWYgKHR5cGUuaW5kZXhPZignLCcpID4gLTEpIHtcbiAgICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgICB0aGlzLnR5cGVBcnIgPSB0aGlzLnR5cGUuc3BsaXQoJywnKTtcbiAgICAgIHRoaXMuY291bnREYXRhID0gW107XG5cbiAgICAgIC8vIGNoZWNrIGVhY2ggdHlwZSBzdXBwbGllZCBpcyB2YWxpZFxuICAgICAgdGhpcy50eXBlQXJyLmZvckVhY2goKHQpID0+IHtcbiAgICAgICAgaWYgKCFDb3VudFRyYW5zZm9ybXNbdF0pIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE9wZW4gU2hhcmU6ICR7dHlwZX0gaXMgYW4gaW52YWxpZCBjb3VudCB0eXBlYCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvdW50RGF0YS5wdXNoKENvdW50VHJhbnNmb3Jtc1t0XSh1cmwpKTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyB0aHJvdyBlcnJvciBpZiBpbnZhbGlkIHR5cGUgcHJvdmlkZWRcbiAgICB9IGVsc2UgaWYgKCFDb3VudFRyYW5zZm9ybXNbdHlwZV0pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgT3BlbiBTaGFyZTogJHt0eXBlfSBpcyBhbiBpbnZhbGlkIGNvdW50IHR5cGVgKTtcblxuICAgICAgICAvLyBzaW5nbGUgY291bnRcbiAgICAgICAgLy8gc3RvcmUgY291bnQgVVJMIGFuZCB0cmFuc2Zvcm0gZnVuY3Rpb25cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICAgIHRoaXMuY291bnREYXRhID0gQ291bnRUcmFuc2Zvcm1zW3R5cGVdKHVybCk7XG4gICAgfVxuICB9XG5cbiAgLy8gaGFuZGxlIGNhbGxpbmcgZ2V0Q291bnQgLyBnZXRDb3VudHNcbiAgLy8gZGVwZW5kaW5nIG9uIG51bWJlciBvZiB0eXBlc1xuICBjb3VudChvcywgY2IsIGFwcGVuZFRvKSB7XG4gICAgdGhpcy5vcyA9IG9zO1xuICAgIHRoaXMuYXBwZW5kVG8gPSBhcHBlbmRUbztcbiAgICB0aGlzLmNiID0gY2I7XG4gICAgdGhpcy51cmwgPSB0aGlzLm9zLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50Jyk7XG4gICAgdGhpcy5zaGFyZWQgPSB0aGlzLm9zLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50LXVybCcpO1xuICAgIHRoaXMua2V5ID0gdGhpcy5vcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1rZXknKTtcblxuICAgIGlmICghQXJyYXkuaXNBcnJheSh0aGlzLmNvdW50RGF0YSkpIHtcbiAgICAgIHRoaXMuZ2V0Q291bnQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5nZXRDb3VudHMoKTtcbiAgICB9XG4gIH1cblxuICAvLyBmZXRjaCBjb3VudCBlaXRoZXIgQUpBWCBvciBKU09OUFxuICBnZXRDb3VudCgpIHtcbiAgICBjb25zdCBjb3VudCA9IHRoaXMuc3RvcmVHZXQoYCR7dGhpcy50eXBlfS0ke3RoaXMuc2hhcmVkfWApO1xuXG4gICAgaWYgKGNvdW50KSB7XG4gICAgICBpZiAodGhpcy5hcHBlbmRUbyAmJiB0eXBlb2YgdGhpcy5hcHBlbmRUbyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzLmFwcGVuZFRvLmFwcGVuZENoaWxkKHRoaXMub3MpO1xuICAgICAgfVxuICAgICAgY291bnRSZWR1Y2UodGhpcy5vcywgY291bnQpO1xuICAgIH1cbiAgICB0aGlzW3RoaXMuY291bnREYXRhLnR5cGVdKHRoaXMuY291bnREYXRhKTtcbiAgfVxuXG4gIC8vIGZldGNoIG11bHRpcGxlIGNvdW50cyBhbmQgYWdncmVnYXRlXG4gIGdldENvdW50cygpIHtcbiAgICB0aGlzLnRvdGFsID0gW107XG5cbiAgICBjb25zdCBjb3VudCA9IHRoaXMuc3RvcmVHZXQoYCR7dGhpcy50eXBlfS0ke3RoaXMuc2hhcmVkfWApO1xuXG4gICAgaWYgKGNvdW50KSB7XG4gICAgICBpZiAodGhpcy5hcHBlbmRUbyAmJiB0eXBlb2YgdGhpcy5hcHBlbmRUbyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzLmFwcGVuZFRvLmFwcGVuZENoaWxkKHRoaXMub3MpO1xuICAgICAgfVxuICAgICAgY291bnRSZWR1Y2UodGhpcy5vcywgY291bnQpO1xuICAgIH1cblxuICAgIHRoaXMuY291bnREYXRhLmZvckVhY2goKGNvdW50RGF0YSkgPT4ge1xuICAgICAgdGhpc1tjb3VudERhdGEudHlwZV0oY291bnREYXRhLCAobnVtKSA9PiB7XG4gICAgICAgIHRoaXMudG90YWwucHVzaChudW0pO1xuXG4gICAgICAgIC8vIHRvdGFsIGNvdW50cyBsZW5ndGggbm93IGVxdWFscyB0eXBlIGFycmF5IGxlbmd0aFxuICAgICAgICAvLyBzbyBhZ2dyZWdhdGUsIHN0b3JlIGFuZCBpbnNlcnQgaW50byBET01cbiAgICAgICAgaWYgKHRoaXMudG90YWwubGVuZ3RoID09PSB0aGlzLnR5cGVBcnIubGVuZ3RoKSB7XG4gICAgICAgICAgbGV0IHRvdCA9IDA7XG5cbiAgICAgICAgICB0aGlzLnRvdGFsLmZvckVhY2goKHQpID0+IHtcbiAgICAgICAgICAgIHRvdCArPSB0O1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgaWYgKHRoaXMuYXBwZW5kVG8gJiYgdHlwZW9mIHRoaXMuYXBwZW5kVG8gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kVG8uYXBwZW5kQ2hpbGQodGhpcy5vcyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgbG9jYWwgPSBOdW1iZXIodGhpcy5zdG9yZUdldChgJHt0aGlzLnR5cGV9LSR7dGhpcy5zaGFyZWR9YCkpO1xuICAgICAgICAgIGlmIChsb2NhbCA+IHRvdCkge1xuICAgICAgICAgICAgY29uc3QgbGF0ZXN0Q291bnQgPSBOdW1iZXIodGhpcy5zdG9yZUdldChgJHt0aGlzLnR5cGV9LSR7dGhpcy5zaGFyZWR9LWxhdGVzdENvdW50YCkpO1xuICAgICAgICAgICAgdGhpcy5zdG9yZVNldChgJHt0aGlzLnR5cGV9LSR7dGhpcy5zaGFyZWR9LWxhdGVzdENvdW50YCwgdG90KTtcblxuICAgICAgICAgICAgdG90ID0gaXNOdW1lcmljKGxhdGVzdENvdW50KSAmJiBsYXRlc3RDb3VudCA+IDAgP1xuICAgICAgICAgICAgdG90ICs9IGxvY2FsIC0gbGF0ZXN0Q291bnQgOlxuICAgICAgICAgICAgdG90ICs9IGxvY2FsO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnN0b3JlU2V0KGAke3RoaXMudHlwZX0tJHt0aGlzLnNoYXJlZH1gLCB0b3QpO1xuXG4gICAgICAgICAgY291bnRSZWR1Y2UodGhpcy5vcywgdG90KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpZiAodGhpcy5hcHBlbmRUbyAmJiB0eXBlb2YgdGhpcy5hcHBlbmRUbyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhpcy5hcHBlbmRUby5hcHBlbmRDaGlsZCh0aGlzLm9zKTtcbiAgICB9XG4gIH1cblxuICAvLyBoYW5kbGUgSlNPTlAgcmVxdWVzdHNcbiAganNvbnAoY291bnREYXRhLCBjYikge1xuICAvLyBkZWZpbmUgcmFuZG9tIGNhbGxiYWNrIGFuZCBhc3NpZ24gdHJhbnNmb3JtIGZ1bmN0aW9uXG4gICAgY29uc3QgY2FsbGJhY2sgPSBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHJpbmcoNykucmVwbGFjZSgvW15hLXpBLVpdL2csICcnKTtcbiAgICB3aW5kb3dbY2FsbGJhY2tdID0gKGRhdGEpID0+IHtcbiAgICAgIGNvbnN0IGNvdW50ID0gY291bnREYXRhLnRyYW5zZm9ybS5hcHBseSh0aGlzLCBbZGF0YV0pIHx8IDA7XG5cbiAgICAgIGlmIChjYiAmJiB0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgY2IoY291bnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRoaXMuYXBwZW5kVG8gJiYgdHlwZW9mIHRoaXMuYXBwZW5kVG8gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICB0aGlzLmFwcGVuZFRvLmFwcGVuZENoaWxkKHRoaXMub3MpO1xuICAgICAgICB9XG4gICAgICAgIGNvdW50UmVkdWNlKHRoaXMub3MsIGNvdW50LCB0aGlzLmNiKTtcbiAgICAgIH1cblxuICAgICAgRXZlbnRzLnRyaWdnZXIodGhpcy5vcywgYGNvdW50ZWQtJHt0aGlzLnVybH1gKTtcbiAgICB9O1xuXG4gICAgLy8gYXBwZW5kIEpTT05QIHNjcmlwdCB0YWcgdG8gcGFnZVxuICAgIGNvbnN0IHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgIHNjcmlwdC5zcmMgPSBjb3VudERhdGEudXJsLnJlcGxhY2UoJ2NhbGxiYWNrPT8nLCBgY2FsbGJhY2s9JHtjYWxsYmFja31gKTtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdLmFwcGVuZENoaWxkKHNjcmlwdCk7XG5cbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBoYW5kbGUgQUpBWCBHRVQgcmVxdWVzdFxuICBnZXQoY291bnREYXRhLCBjYikge1xuICAgIGNvbnN0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgLy8gb24gc3VjY2VzcyBwYXNzIHJlc3BvbnNlIHRvIHRyYW5zZm9ybSBmdW5jdGlvblxuICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSAoKSA9PiB7XG4gICAgICBpZiAoeGhyLnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgICAgaWYgKHhoci5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgIGNvbnN0IGNvdW50ID0gY291bnREYXRhLnRyYW5zZm9ybS5hcHBseSh0aGlzLCBbeGhyLCBFdmVudHNdKSB8fCAwO1xuXG4gICAgICAgICAgaWYgKGNiICYmIHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2IoY291bnQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAodGhpcy5hcHBlbmRUbyAmJiB0eXBlb2YgdGhpcy5hcHBlbmRUbyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICB0aGlzLmFwcGVuZFRvLmFwcGVuZENoaWxkKHRoaXMub3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY291bnRSZWR1Y2UodGhpcy5vcywgY291bnQsIHRoaXMuY2IpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIEV2ZW50cy50cmlnZ2VyKHRoaXMub3MsIGBjb3VudGVkLSR7dGhpcy51cmx9YCk7XG4gICAgICAgIH0gZWxzZSBpZiAoY291bnREYXRhLnVybC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ2h0dHBzOi8vYXBpLm9wZW5zaGFyZS5zb2NpYWwvam9iPycpID09PSAwKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignUGxlYXNlIHNpZ24gdXAgZm9yIFR3aXR0ZXIgY291bnRzIGF0IGh0dHBzOi8vb3BlbnNoYXJlLnNvY2lhbC90d2l0dGVyL2F1dGgnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gZ2V0IEFQSSBkYXRhIGZyb20nLCBjb3VudERhdGEudXJsLCAnLiBQbGVhc2UgdXNlIHRoZSBsYXRlc3QgdmVyc2lvbiBvZiBPcGVuU2hhcmUuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgY291bnREYXRhLnVybCA9IGNvdW50RGF0YS51cmwuc3RhcnRzV2l0aCgnaHR0cHM6Ly9hcGkub3BlbnNoYXJlLnNvY2lhbC9qb2I/JykgJiYgdGhpcy5rZXkgP1xuICAgICAgY291bnREYXRhLnVybCArIHRoaXMua2V5IDpcbiAgICAgIGNvdW50RGF0YS51cmw7XG5cbiAgICB4aHIub3BlbignR0VUJywgY291bnREYXRhLnVybCk7XG4gICAgeGhyLnNlbmQoKTtcbiAgfVxuXG4gIC8vIGhhbmRsZSBBSkFYIFBPU1QgcmVxdWVzdFxuICBwb3N0KGNvdW50RGF0YSwgY2IpIHtcbiAgICBjb25zdCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgIC8vIG9uIHN1Y2Nlc3MgcGFzcyByZXNwb25zZSB0byB0cmFuc2Zvcm0gZnVuY3Rpb25cbiAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gKCkgPT4ge1xuICAgICAgaWYgKHhoci5yZWFkeVN0YXRlICE9PSBYTUxIdHRwUmVxdWVzdC5ET05FIHx8XG4gICAgICAgIHhoci5zdGF0dXMgIT09IDIwMCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNvdW50ID0gY291bnREYXRhLnRyYW5zZm9ybS5hcHBseSh0aGlzLCBbeGhyXSkgfHwgMDtcblxuICAgICAgaWYgKGNiICYmIHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBjYihjb3VudCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodGhpcy5hcHBlbmRUbyAmJiB0eXBlb2YgdGhpcy5hcHBlbmRUbyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIHRoaXMuYXBwZW5kVG8uYXBwZW5kQ2hpbGQodGhpcy5vcyk7XG4gICAgICAgIH1cbiAgICAgICAgY291bnRSZWR1Y2UodGhpcy5vcywgY291bnQsIHRoaXMuY2IpO1xuICAgICAgfVxuICAgICAgRXZlbnRzLnRyaWdnZXIodGhpcy5vcywgYGNvdW50ZWQtJHt0aGlzLnVybH1gKTtcbiAgICB9O1xuXG4gICAgeGhyLm9wZW4oJ1BPU1QnLCBjb3VudERhdGEudXJsKTtcbiAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb247Y2hhcnNldD1VVEYtOCcpO1xuICAgIHhoci5zZW5kKEpTT04uc3RyaW5naWZ5KGNvdW50RGF0YS5kYXRhKSk7XG4gIH1cblxuICBzdG9yZVNldCh0eXBlLCBjb3VudCA9IDApIHsvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgICBpZiAoIXdpbmRvdy5sb2NhbFN0b3JhZ2UgfHwgIXR5cGUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShgT3BlblNoYXJlLSR7dHlwZX1gLCBjb3VudCk7XG4gIH1cblxuICBzdG9yZUdldCh0eXBlKSB7Ly9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgaWYgKCF3aW5kb3cubG9jYWxTdG9yYWdlIHx8ICF0eXBlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcmV0dXJuIGxvY2FsU3RvcmFnZS5nZXRJdGVtKGBPcGVuU2hhcmUtJHt0eXBlfWApO1xuICB9XG5cbn07XG5cbmZ1bmN0aW9uIGlzTnVtZXJpYyhuKSB7XG4gIHJldHVybiAhaXNOYU4ocGFyc2VGbG9hdChuKSkgJiYgaXNGaW5pdGUobik7XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHsvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIHJlcXVpcmUoJy4uLy4uL2xpYi9pbml0Jykoe1xuICAgIHNlbGVjdG9yOiB7XG4gICAgICBzaGFyZTogJ1tkYXRhLW9wZW4tc2hhcmVdOm5vdChbZGF0YS1vcGVuLXNoYXJlLW5vZGVdKScsXG4gICAgICBjb3VudDogJ1tkYXRhLW9wZW4tc2hhcmUtY291bnRdOm5vdChbZGF0YS1vcGVuLXNoYXJlLW5vZGVdKScsXG4gICAgfSxcbiAgICBjYjoge1xuICAgICAgc2hhcmU6IHJlcXVpcmUoJy4uLy4uL2xpYi9pbml0aWFsaXplU2hhcmVOb2RlJyksXG4gICAgICBjb3VudDogcmVxdWlyZSgnLi4vLi4vbGliL2luaXRpYWxpemVDb3VudE5vZGUnKSxcbiAgICB9LFxuICB9KSk7XG59O1xuIiwiLyoqXG4gKiBUcmlnZ2VyIGN1c3RvbSBPcGVuU2hhcmUgbmFtZXNwYWNlZCBldmVudFxuICovXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgdHJpZ2dlcihlbGVtZW50LCBldmVudCkge1xuICAgIGNvbnN0IGV2ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0V2ZW50Jyk7XG4gICAgZXYuaW5pdEV2ZW50KGBPcGVuU2hhcmUuJHtldmVudH1gLCB0cnVlLCB0cnVlKTtcbiAgICBlbGVtZW50LmRpc3BhdGNoRXZlbnQoZXYpO1xuICB9LFxufTtcbiIsIi8qKlxuICogT3BlblNoYXJlIGdlbmVyYXRlcyBhIHNpbmdsZSBzaGFyZSBsaW5rXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgT3BlblNoYXJlIHtcblxuICBjb25zdHJ1Y3Rvcih0eXBlLCB0cmFuc2Zvcm0pIHtcbiAgICB0aGlzLmlvcyA9IC9pUGFkfGlQaG9uZXxpUG9kLy50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpICYmICF3aW5kb3cuTVNTdHJlYW07XG4gICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICB0aGlzLmR5bmFtaWMgPSBmYWxzZTtcbiAgICB0aGlzLnRyYW5zZm9ybSA9IHRyYW5zZm9ybTtcblxuICAgIC8vIGNhcGl0YWxpemVkIHR5cGVcbiAgICB0aGlzLnR5cGVDYXBzID0gdHlwZS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHR5cGUuc2xpY2UoMSk7XG4gIH1cblxuICAvLyByZXR1cm5zIGZ1bmN0aW9uIG5hbWVkIGFzIHR5cGUgc2V0IGluIGNvbnN0cnVjdG9yXG4gIC8vIGUuZyB0d2l0dGVyKClcbiAgc2V0RGF0YShkYXRhKSB7XG4gICAgLy8gaWYgaU9TIHVzZXIgYW5kIGlvcyBkYXRhIGF0dHJpYnV0ZSBkZWZpbmVkXG4gICAgLy8gYnVpbGQgaU9TIFVSTCBzY2hlbWUgYXMgc2luZ2xlIHN0cmluZ1xuICAgIGlmICh0aGlzLmlvcykge1xuICAgICAgdGhpcy50cmFuc2Zvcm1EYXRhID0gdGhpcy50cmFuc2Zvcm0oZGF0YSwgdHJ1ZSk7XG4gICAgICB0aGlzLm1vYmlsZVNoYXJlVXJsID0gdGhpcy50ZW1wbGF0ZSh0aGlzLnRyYW5zZm9ybURhdGEudXJsLCB0aGlzLnRyYW5zZm9ybURhdGEuZGF0YSk7XG4gICAgfVxuXG4gICAgdGhpcy50cmFuc2Zvcm1EYXRhID0gdGhpcy50cmFuc2Zvcm0oZGF0YSk7XG4gICAgdGhpcy5zaGFyZVVybCA9IHRoaXMudGVtcGxhdGUodGhpcy50cmFuc2Zvcm1EYXRhLnVybCwgdGhpcy50cmFuc2Zvcm1EYXRhLmRhdGEpO1xuICB9XG5cbiAgLy8gb3BlbiBzaGFyZSBVUkwgZGVmaW5lZCBpbiBpbmRpdmlkdWFsIHBsYXRmb3JtIGZ1bmN0aW9uc1xuICBzaGFyZSgpIHtcbiAgICAvLyBpZiBpT1Mgc2hhcmUgVVJMIGhhcyBiZWVuIHNldCB0aGVuIHVzZSB0aW1lb3V0IGhhY2tcbiAgICAvLyB0ZXN0IGZvciBuYXRpdmUgYXBwIGFuZCBmYWxsIGJhY2sgdG8gd2ViXG4gICAgaWYgKHRoaXMubW9iaWxlU2hhcmVVcmwpIHtcbiAgICAgIGNvbnN0IHN0YXJ0ID0gKG5ldyBEYXRlKCkpLnZhbHVlT2YoKTtcblxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGNvbnN0IGVuZCA9IChuZXcgRGF0ZSgpKS52YWx1ZU9mKCk7XG5cbiAgICAgICAgLy8gaWYgdGhlIHVzZXIgaXMgc3RpbGwgaGVyZSwgZmFsbCBiYWNrIHRvIHdlYlxuICAgICAgICBpZiAoZW5kIC0gc3RhcnQgPiAxNjAwKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgd2luZG93LmxvY2F0aW9uID0gdGhpcy5zaGFyZVVybDtcbiAgICAgIH0sIDE1MDApO1xuXG4gICAgICB3aW5kb3cubG9jYXRpb24gPSB0aGlzLm1vYmlsZVNoYXJlVXJsO1xuXG4gICAgICAvLyBvcGVuIG1haWx0byBsaW5rcyBpbiBzYW1lIHdpbmRvd1xuICAgIH0gZWxzZSBpZiAodGhpcy50eXBlID09PSAnZW1haWwnKSB7XG4gICAgICB3aW5kb3cubG9jYXRpb24gPSB0aGlzLnNoYXJlVXJsO1xuXG4gICAgICAvLyBvcGVuIHNvY2lhbCBzaGFyZSBVUkxzIGluIG5ldyB3aW5kb3dcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gaWYgcG9wdXAgb2JqZWN0IHByZXNlbnQgdGhlbiBzZXQgd2luZG93IGRpbWVuc2lvbnMgLyBwb3NpdGlvblxuICAgICAgaWYgKHRoaXMucG9wdXAgJiYgdGhpcy50cmFuc2Zvcm1EYXRhLnBvcHVwKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm9wZW5XaW5kb3codGhpcy5zaGFyZVVybCwgdGhpcy50cmFuc2Zvcm1EYXRhLnBvcHVwKTtcbiAgICAgIH1cblxuICAgICAgd2luZG93Lm9wZW4odGhpcy5zaGFyZVVybCk7XG4gICAgfVxuICB9XG5cbiAgLy8gY3JlYXRlIHNoYXJlIFVSTCB3aXRoIEdFVCBwYXJhbXNcbiAgLy8gYXBwZW5kaW5nIHZhbGlkIHByb3BlcnRpZXMgdG8gcXVlcnkgc3RyaW5nXG4gIHRlbXBsYXRlKHVybCwgZGF0YSkgey8vZXNsaW50LWRpc2FibGUtbGluZVxuICAgIGNvbnN0IG5vblVSTFByb3BzID0gW1xuICAgICAgJ2FwcGVuZFRvJyxcbiAgICAgICdpbm5lckhUTUwnLFxuICAgICAgJ2NsYXNzZXMnLFxuICAgIF07XG5cbiAgICBsZXQgc2hhcmVVcmwgPSB1cmwsXG4gICAgICBpO1xuXG4gICAgZm9yIChpIGluIGRhdGEpIHtcbiAgICAgIC8vIG9ubHkgYXBwZW5kIHZhbGlkIHByb3BlcnRpZXNcbiAgICAgIGlmICghZGF0YVtpXSB8fCBub25VUkxQcm9wcy5pbmRleE9mKGkpID4gLTEpIHtcbiAgICAgICAgY29udGludWU7IC8vZXNsaW50LWRpc2FibGUtbGluZVxuICAgICAgfVxuXG4gICAgICAvLyBhcHBlbmQgVVJMIGVuY29kZWQgR0VUIHBhcmFtIHRvIHNoYXJlIFVSTFxuICAgICAgZGF0YVtpXSA9IGVuY29kZVVSSUNvbXBvbmVudChkYXRhW2ldKTtcbiAgICAgIHNoYXJlVXJsICs9IGAke2l9PSR7ZGF0YVtpXX0mYDtcbiAgICB9XG5cbiAgICByZXR1cm4gc2hhcmVVcmwuc3Vic3RyKDAsIHNoYXJlVXJsLmxlbmd0aCAtIDEpO1xuICB9XG5cbiAgLy8gY2VudGVyIHBvcHVwIHdpbmRvdyBzdXBwb3J0aW5nIGR1YWwgc2NyZWVuc1xuICBvcGVuV2luZG93KHVybCwgb3B0aW9ucykgey8vZXNsaW50LWRpc2FibGUtbGluZVxuICAgIGNvbnN0IGR1YWxTY3JlZW5MZWZ0ID0gd2luZG93LnNjcmVlbkxlZnQgIT09IHVuZGVmaW5lZCA/IHdpbmRvdy5zY3JlZW5MZWZ0IDogc2NyZWVuLmxlZnQsXG4gICAgICBkdWFsU2NyZWVuVG9wID0gd2luZG93LnNjcmVlblRvcCAhPT0gdW5kZWZpbmVkID8gd2luZG93LnNjcmVlblRvcCA6IHNjcmVlbi50b3AsXG4gICAgICB3aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoID8gd2luZG93LmlubmVyV2lkdGggOiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGggPyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGggOiBzY3JlZW4ud2lkdGgsLy9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgICBoZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQgPyB3aW5kb3cuaW5uZXJIZWlnaHQgOiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0ID8gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodCA6IHNjcmVlbi5oZWlnaHQsLy9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgICBsZWZ0ID0gKCh3aWR0aCAvIDIpIC0gKG9wdGlvbnMud2lkdGggLyAyKSkgKyBkdWFsU2NyZWVuTGVmdCxcbiAgICAgIHRvcCA9ICgoaGVpZ2h0IC8gMikgLSAob3B0aW9ucy5oZWlnaHQgLyAyKSkgKyBkdWFsU2NyZWVuVG9wLFxuICAgICAgbmV3V2luZG93ID0gd2luZG93Lm9wZW4odXJsLCAnT3BlblNoYXJlJywgYHdpZHRoPSR7b3B0aW9ucy53aWR0aH0sIGhlaWdodD0ke29wdGlvbnMuaGVpZ2h0fSwgdG9wPSR7dG9wfSwgbGVmdD0ke2xlZnR9YCk7XG5cbiAgICAvLyBQdXRzIGZvY3VzIG9uIHRoZSBuZXdXaW5kb3dcbiAgICBpZiAod2luZG93LmZvY3VzKSB7XG4gICAgICBuZXdXaW5kb3cuZm9jdXMoKTtcbiAgICB9XG4gIH1cbn07XG4iLCIvKipcbiAqIEdsb2JhbCBPcGVuU2hhcmUgQVBJIHRvIGdlbmVyYXRlIGluc3RhbmNlcyBwcm9ncmFtbWF0aWNhbGx5XG4gKi9cblxuY29uc3QgT1MgPSByZXF1aXJlKCcuL29wZW4tc2hhcmUnKTtcbmNvbnN0IFNoYXJlVHJhbnNmb3JtcyA9IHJlcXVpcmUoJy4vc2hhcmUtdHJhbnNmb3JtcycpO1xuY29uc3QgRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcbmNvbnN0IGRhc2hUb0NhbWVsID0gcmVxdWlyZSgnLi4vLi4vbGliL2Rhc2hUb0NhbWVsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCkgey8vZXNsaW50LWRpc2FibGUtbGluZVxuICAvLyBnbG9iYWwgT3BlblNoYXJlIHJlZmVyZW5jaW5nIGludGVybmFsIGNsYXNzIGZvciBpbnN0YW5jZSBnZW5lcmF0aW9uXG4gIGNsYXNzIE9wZW5TaGFyZSB7XG5cbiAgICBjb25zdHJ1Y3RvcihkYXRhLCBlbGVtZW50KSB7XG4gICAgICBpZiAoIWRhdGEuYmluZENsaWNrKSBkYXRhLmJpbmRDbGljayA9IHRydWU7XG5cbiAgICAgIGNvbnN0IGRhc2ggPSBkYXRhLnR5cGUuaW5kZXhPZignLScpO1xuXG4gICAgICBpZiAoZGFzaCA+IC0xKSB7XG4gICAgICAgIGRhdGEudHlwZSA9IGRhc2hUb0NhbWVsKGRhc2gsIGRhdGEudHlwZSk7XG4gICAgICB9XG5cbiAgICAgIGxldCBub2RlO1xuICAgICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICAgIHRoaXMuZGF0YSA9IGRhdGE7XG5cbiAgICAgIHRoaXMub3MgPSBuZXcgT1MoZGF0YS50eXBlLCBTaGFyZVRyYW5zZm9ybXNbZGF0YS50eXBlXSk7XG4gICAgICB0aGlzLm9zLnNldERhdGEoZGF0YSk7XG5cbiAgICAgIGlmICghZWxlbWVudCB8fCBkYXRhLmVsZW1lbnQpIHtcbiAgICAgICAgZWxlbWVudCA9IGRhdGEuZWxlbWVudDtcbiAgICAgICAgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoZWxlbWVudCB8fCAnYScpO1xuICAgICAgICBpZiAoZGF0YS50eXBlKSB7XG4gICAgICAgICAgbm9kZS5jbGFzc0xpc3QuYWRkKCdvcGVuLXNoYXJlLWxpbmsnLCBkYXRhLnR5cGUpO1xuICAgICAgICAgIG5vZGUuc2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUnLCBkYXRhLnR5cGUpO1xuICAgICAgICAgIG5vZGUuc2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtbm9kZScsIGRhdGEudHlwZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRhdGEuaW5uZXJIVE1MKSBub2RlLmlubmVySFRNTCA9IGRhdGEuaW5uZXJIVE1MO1xuICAgICAgfVxuICAgICAgaWYgKG5vZGUpIGVsZW1lbnQgPSBub2RlO1xuXG4gICAgICBpZiAoZGF0YS5iaW5kQ2xpY2spIHtcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgICB0aGlzLnNoYXJlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGF0YS5hcHBlbmRUbykge1xuICAgICAgICBkYXRhLmFwcGVuZFRvLmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGF0YS5jbGFzc2VzICYmIEFycmF5LmlzQXJyYXkoZGF0YS5jbGFzc2VzKSkge1xuICAgICAgICBkYXRhLmNsYXNzZXMuZm9yRWFjaCgoY3NzQ2xhc3MpID0+IHtcbiAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoY3NzQ2xhc3MpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKGRhdGEudHlwZS50b0xvd2VyQ2FzZSgpID09PSAncGF5cGFsJykge1xuICAgICAgICBjb25zdCBhY3Rpb24gPSBkYXRhLnNhbmRib3ggP1xuICAgICAgICAnaHR0cHM6Ly93d3cuc2FuZGJveC5wYXlwYWwuY29tL2NnaS1iaW4vd2Vic2NyJyA6XG4gICAgICAgICdodHRwczovL3d3dy5wYXlwYWwuY29tL2NnaS1iaW4vd2Vic2NyJztcblxuICAgICAgICBjb25zdCBidXlHSUYgPSBkYXRhLnNhbmRib3ggP1xuICAgICAgICAnaHR0cHM6Ly93d3cuc2FuZGJveC5wYXlwYWwuY29tL2VuX1VTL2kvYnRuL2J0bl9idXlub3dfTEcuZ2lmJyA6XG4gICAgICAgICdodHRwczovL3d3dy5wYXlwYWxvYmplY3RzLmNvbS9lbl9VUy9pL2J0bi9idG5fYnV5bm93X0xHLmdpZic7XG5cbiAgICAgICAgY29uc3QgcGl4ZWxHSUYgPSBkYXRhLnNhbmRib3ggP1xuICAgICAgICAnaHR0cHM6Ly93d3cuc2FuZGJveC5wYXlwYWwuY29tL2VuX1VTL2kvc2NyL3BpeGVsLmdpZicgOlxuICAgICAgICAnaHR0cHM6Ly93d3cucGF5cGFsb2JqZWN0cy5jb20vZW5fVVMvaS9zY3IvcGl4ZWwuZ2lmJztcblxuXG4gICAgICAgIGNvbnN0IHBheXBhbEJ1dHRvbiA9IGA8Zm9ybSBhY3Rpb249JHthY3Rpb259IG1ldGhvZD1cInBvc3RcIiB0YXJnZXQ9XCJfYmxhbmtcIj5cblxuICAgICAgICA8IS0tIFNhdmVkIGJ1dHRvbnMgdXNlIHRoZSBcInNlY3VyZSBjbGlja1wiIGNvbW1hbmQgLS0+XG4gICAgICAgIDxpbnB1dCB0eXBlPVwiaGlkZGVuXCIgbmFtZT1cImNtZFwiIHZhbHVlPVwiX3MteGNsaWNrXCI+XG5cbiAgICAgICAgPCEtLSBTYXZlZCBidXR0b25zIGFyZSBpZGVudGlmaWVkIGJ5IHRoZWlyIGJ1dHRvbiBJRHMgLS0+XG4gICAgICAgIDxpbnB1dCB0eXBlPVwiaGlkZGVuXCIgbmFtZT1cImhvc3RlZF9idXR0b25faWRcIiB2YWx1ZT1cIiR7ZGF0YS5idXR0b25JZH1cIj5cblxuICAgICAgICA8IS0tIFNhdmVkIGJ1dHRvbnMgZGlzcGxheSBhbiBhcHByb3ByaWF0ZSBidXR0b24gaW1hZ2UuIC0tPlxuICAgICAgICA8aW5wdXQgdHlwZT1cImltYWdlXCIgbmFtZT1cInN1Ym1pdFwiXG4gICAgICAgIHNyYz0ke2J1eUdJRn1cbiAgICAgICAgYWx0PVwiUGF5UGFsIC0gVGhlIHNhZmVyLCBlYXNpZXIgd2F5IHRvIHBheSBvbmxpbmVcIj5cbiAgICAgICAgPGltZyBhbHQ9XCJcIiB3aWR0aD1cIjFcIiBoZWlnaHQ9XCIxXCJcbiAgICAgICAgc3JjPSR7cGl4ZWxHSUZ9ID5cblxuICAgICAgICA8L2Zvcm0+YDtcblxuICAgICAgICBjb25zdCBoaWRkZW5EaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgaGlkZGVuRGl2LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIGhpZGRlbkRpdi5pbm5lckhUTUwgPSBwYXlwYWxCdXR0b247XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoaGlkZGVuRGl2KTtcblxuICAgICAgICB0aGlzLnBheXBhbCA9IGhpZGRlbkRpdi5xdWVyeVNlbGVjdG9yKCdmb3JtJyk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgICByZXR1cm4gZWxlbWVudDtcbiAgICB9XG5cbiAgICAvLyBwdWJsaWMgc2hhcmUgbWV0aG9kIHRvIHRyaWdnZXIgc2hhcmUgcHJvZ3JhbW1hdGljYWxseVxuICAgIHNoYXJlKGUpIHtcbiAgICAgIC8vIGlmIGR5bmFtaWMgaW5zdGFuY2UgdGhlbiBmZXRjaCBhdHRyaWJ1dGVzIGFnYWluIGluIGNhc2Ugb2YgdXBkYXRlc1xuICAgICAgaWYgKHRoaXMuZGF0YS5keW5hbWljKSB7XG4gICAgICAgIC8vZXNsaW50LWRpc2FibGUtbmV4dC1saW5lXG4gICAgICAgIHRoaXMub3Muc2V0RGF0YShkYXRhKTsvLyBkYXRhIGlzIG5vdCBkZWZpbmVkXG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLmRhdGEudHlwZS50b0xvd2VyQ2FzZSgpID09PSAncGF5cGFsJykge1xuICAgICAgICB0aGlzLnBheXBhbC5zdWJtaXQoKTtcbiAgICAgIH0gZWxzZSB0aGlzLm9zLnNoYXJlKGUpO1xuXG4gICAgICBFdmVudHMudHJpZ2dlcih0aGlzLmVsZW1lbnQsICdzaGFyZWQnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gT3BlblNoYXJlO1xufTtcbiIsIi8qKlxuICogT2JqZWN0IG9mIHRyYW5zZm9ybSBmdW5jdGlvbnMgZm9yIGVhY2ggb3BlbnNoYXJlIGFwaVxuICogVHJhbnNmb3JtIGZ1bmN0aW9ucyBwYXNzZWQgaW50byBPcGVuU2hhcmUgaW5zdGFuY2Ugd2hlbiBpbnN0YW50aWF0ZWRcbiAqIFJldHVybiBvYmplY3QgY29udGFpbmluZyBVUkwgYW5kIGtleS92YWx1ZSBhcmdzXG4gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gIC8vIHNldCBUd2l0dGVyIHNoYXJlIFVSTFxuICB0d2l0dGVyKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG4gICAgLy8gaWYgaU9TIHVzZXIgYW5kIGlvcyBkYXRhIGF0dHJpYnV0ZSBkZWZpbmVkXG4gICAgLy8gYnVpbGQgaU9TIFVSTCBzY2hlbWUgYXMgc2luZ2xlIHN0cmluZ1xuICAgIGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcbiAgICAgIGxldCBtZXNzYWdlID0gJyc7XG5cbiAgICAgIGlmIChkYXRhLnRleHQpIHtcbiAgICAgICAgbWVzc2FnZSArPSBkYXRhLnRleHQ7XG4gICAgICB9XG5cbiAgICAgIGlmIChkYXRhLnVybCkge1xuICAgICAgICBtZXNzYWdlICs9IGAgLSAke2RhdGEudXJsfWA7XG4gICAgICB9XG5cbiAgICAgIGlmIChkYXRhLmhhc2h0YWdzKSB7XG4gICAgICAgIGNvbnN0IHRhZ3MgPSBkYXRhLmhhc2h0YWdzLnNwbGl0KCcsJyk7XG4gICAgICAgIHRhZ3MuZm9yRWFjaCgodGFnKSA9PiB7XG4gICAgICAgICAgbWVzc2FnZSArPSBgICMke3RhZ31gO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKGRhdGEudmlhKSB7XG4gICAgICAgIG1lc3NhZ2UgKz0gYCB2aWEgJHtkYXRhLnZpYX1gO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICB1cmw6ICd0d2l0dGVyOi8vcG9zdD8nLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgfSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogJ2h0dHBzOi8vdHdpdHRlci5jb20vc2hhcmU/JyxcbiAgICAgIGRhdGEsXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogNzAwLFxuICAgICAgICBoZWlnaHQ6IDI5NixcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgVHdpdHRlciByZXR3ZWV0IFVSTFxuICB0d2l0dGVyUmV0d2VldChkYXRhLCBpb3MgPSBmYWxzZSkge1xuICAgIC8vIGlmIGlPUyB1c2VyIGFuZCBpb3MgZGF0YSBhdHRyaWJ1dGUgZGVmaW5lZFxuICAgIGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHVybDogJ3R3aXR0ZXI6Ly9zdGF0dXM/JyxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIGlkOiBkYXRhLnR3ZWV0SWQsXG4gICAgICAgIH0sXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB1cmw6ICdodHRwczovL3R3aXR0ZXIuY29tL2ludGVudC9yZXR3ZWV0PycsXG4gICAgICBkYXRhOiB7XG4gICAgICAgIHR3ZWV0X2lkOiBkYXRhLnR3ZWV0SWQsXG4gICAgICAgIHJlbGF0ZWQ6IGRhdGEucmVsYXRlZCxcbiAgICAgIH0sXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogNzAwLFxuICAgICAgICBoZWlnaHQ6IDI5NixcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgVHdpdHRlciBsaWtlIFVSTFxuICB0d2l0dGVyTGlrZShkYXRhLCBpb3MgPSBmYWxzZSkge1xuICAgIC8vIGlmIGlPUyB1c2VyIGFuZCBpb3MgZGF0YSBhdHRyaWJ1dGUgZGVmaW5lZFxuICAgIGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHVybDogJ3R3aXR0ZXI6Ly9zdGF0dXM/JyxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIGlkOiBkYXRhLnR3ZWV0SWQsXG4gICAgICAgIH0sXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB1cmw6ICdodHRwczovL3R3aXR0ZXIuY29tL2ludGVudC9mYXZvcml0ZT8nLFxuICAgICAgZGF0YToge1xuICAgICAgICB0d2VldF9pZDogZGF0YS50d2VldElkLFxuICAgICAgICByZWxhdGVkOiBkYXRhLnJlbGF0ZWQsXG4gICAgICB9LFxuICAgICAgcG9wdXA6IHtcbiAgICAgICAgd2lkdGg6IDcwMCxcbiAgICAgICAgaGVpZ2h0OiAyOTYsXG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgLy8gc2V0IFR3aXR0ZXIgZm9sbG93IFVSTFxuICB0d2l0dGVyRm9sbG93KGRhdGEsIGlvcyA9IGZhbHNlKSB7XG4gICAgLy8gaWYgaU9TIHVzZXIgYW5kIGlvcyBkYXRhIGF0dHJpYnV0ZSBkZWZpbmVkXG4gICAgaWYgKGlvcyAmJiBkYXRhLmlvcykge1xuICAgICAgY29uc3QgaW9zRGF0YSA9IGRhdGEuc2NyZWVuTmFtZSA/IHtcbiAgICAgICAgc2NyZWVuX25hbWU6IGRhdGEuc2NyZWVuTmFtZSxcbiAgICAgIH0gOiB7XG4gICAgICAgIGlkOiBkYXRhLnVzZXJJZCxcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHVybDogJ3R3aXR0ZXI6Ly91c2VyPycsXG4gICAgICAgIGRhdGE6IGlvc0RhdGEsXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB1cmw6ICdodHRwczovL3R3aXR0ZXIuY29tL2ludGVudC91c2VyPycsXG4gICAgICBkYXRhOiB7XG4gICAgICAgIHNjcmVlbl9uYW1lOiBkYXRhLnNjcmVlbk5hbWUsXG4gICAgICAgIHVzZXJfaWQ6IGRhdGEudXNlcklkLFxuICAgICAgfSxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiA3MDAsXG4gICAgICAgIGhlaWdodDogMjk2LFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBGYWNlYm9vayBzaGFyZSBVUkxcbiAgZmFjZWJvb2soZGF0YSkge1xuICAgIHJldHVybiB7XG4gICAgICB1cmw6ICdodHRwczovL3d3dy5mYWNlYm9vay5jb20vZGlhbG9nL2ZlZWQ/YXBwX2lkPTk2MTM0MjU0MzkyMjMyMiZyZWRpcmVjdF91cmk9aHR0cDovL2ZhY2Vib29rLmNvbSYnLFxuICAgICAgZGF0YSxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiA1NjAsXG4gICAgICAgIGhlaWdodDogNTkzLFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gICAgLy8gc2V0IEZhY2Vib29rIHNlbmQgVVJMXG4gIGZhY2Vib29rU2VuZChkYXRhKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogJ2h0dHBzOi8vd3d3LmZhY2Vib29rLmNvbS9kaWFsb2cvc2VuZD9hcHBfaWQ9OTYxMzQyNTQzOTIyMzIyJnJlZGlyZWN0X3VyaT1odHRwOi8vZmFjZWJvb2suY29tJicsXG4gICAgICBkYXRhLFxuICAgICAgcG9wdXA6IHtcbiAgICAgICAgd2lkdGg6IDk4MCxcbiAgICAgICAgaGVpZ2h0OiA1OTYsXG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgLy8gc2V0IFlvdVR1YmUgcGxheSBVUkxcbiAgeW91dHViZShkYXRhLCBpb3MgPSBmYWxzZSkge1xuICAgIC8vIGlmIGlPUyB1c2VyXG4gICAgaWYgKGlvcyAmJiBkYXRhLmlvcykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdXJsOiBgeW91dHViZToke2RhdGEudmlkZW99P2AsXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB1cmw6IGBodHRwczovL3d3dy55b3V0dWJlLmNvbS93YXRjaD92PSR7ZGF0YS52aWRlb30/YCxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiAxMDg2LFxuICAgICAgICBoZWlnaHQ6IDYwOCxcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgWW91VHViZSBzdWJjcmliZSBVUkxcbiAgeW91dHViZVN1YnNjcmliZShkYXRhLCBpb3MgPSBmYWxzZSkge1xuICAgIC8vIGlmIGlPUyB1c2VyXG4gICAgaWYgKGlvcyAmJiBkYXRhLmlvcykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdXJsOiBgeW91dHViZTovL3d3dy55b3V0dWJlLmNvbS91c2VyLyR7ZGF0YS51c2VyfT9gLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgdXJsOiBgaHR0cHM6Ly93d3cueW91dHViZS5jb20vdXNlci8ke2RhdGEudXNlcn0/YCxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiA4ODAsXG4gICAgICAgIGhlaWdodDogMzUwLFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBJbnN0YWdyYW0gZm9sbG93IFVSTFxuICBpbnN0YWdyYW0oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogJ2luc3RhZ3JhbTovL2NhbWVyYT8nLFxuICAgIH07XG4gIH0sXG5cbiAgLy8gc2V0IEluc3RhZ3JhbSBmb2xsb3cgVVJMXG4gIGluc3RhZ3JhbUZvbGxvdyhkYXRhLCBpb3MgPSBmYWxzZSkge1xuICAgIC8vIGlmIGlPUyB1c2VyXG4gICAgaWYgKGlvcyAmJiBkYXRhLmlvcykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdXJsOiAnaW5zdGFncmFtOi8vdXNlcj8nLFxuICAgICAgICBkYXRhLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgdXJsOiBgaHR0cDovL3d3dy5pbnN0YWdyYW0uY29tLyR7ZGF0YS51c2VybmFtZX0/YCxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiA5ODAsXG4gICAgICAgIGhlaWdodDogNjU1LFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBTbmFwY2hhdCBmb2xsb3cgVVJMXG4gIHNuYXBjaGF0KGRhdGEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdXJsOiBgc25hcGNoYXQ6Ly9hZGQvJHtkYXRhLnVzZXJuYW1lfT9gLFxuICAgIH07XG4gIH0sXG5cbiAgLy8gc2V0IEdvb2dsZSBzaGFyZSBVUkxcbiAgZ29vZ2xlKGRhdGEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdXJsOiAnaHR0cHM6Ly9wbHVzLmdvb2dsZS5jb20vc2hhcmU/JyxcbiAgICAgIGRhdGEsXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogNDk1LFxuICAgICAgICBoZWlnaHQ6IDgxNSxcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgR29vZ2xlIG1hcHMgVVJMXG4gIGdvb2dsZU1hcHMoZGF0YSwgaW9zID0gZmFsc2UpIHtcbiAgICBpZiAoZGF0YS5zZWFyY2gpIHtcbiAgICAgIGRhdGEucSA9IGRhdGEuc2VhcmNoO1xuICAgICAgZGVsZXRlIGRhdGEuc2VhcmNoO1xuICAgIH1cblxuICAgIC8vIGlmIGlPUyB1c2VyIGFuZCBpb3MgZGF0YSBhdHRyaWJ1dGUgZGVmaW5lZFxuICAgIGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHVybDogJ2NvbWdvb2dsZW1hcHM6Ly8/JyxcbiAgICAgICAgZGF0YTogaW9zLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAoIWlvcyAmJiBkYXRhLmlvcykge1xuICAgICAgZGVsZXRlIGRhdGEuaW9zO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB1cmw6ICdodHRwczovL21hcHMuZ29vZ2xlLmNvbS8/JyxcbiAgICAgIGRhdGEsXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogODAwLFxuICAgICAgICBoZWlnaHQ6IDYwMCxcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgUGludGVyZXN0IHNoYXJlIFVSTFxuICBwaW50ZXJlc3QoZGF0YSkge1xuICAgIHJldHVybiB7XG4gICAgICB1cmw6ICdodHRwczovL3BpbnRlcmVzdC5jb20vcGluL2NyZWF0ZS9ib29rbWFya2xldC8/JyxcbiAgICAgIGRhdGEsXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogNzQ1LFxuICAgICAgICBoZWlnaHQ6IDYyMCxcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgTGlua2VkSW4gc2hhcmUgVVJMXG4gIGxpbmtlZGluKGRhdGEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdXJsOiAnaHR0cDovL3d3dy5saW5rZWRpbi5jb20vc2hhcmVBcnRpY2xlPycsXG4gICAgICBkYXRhLFxuICAgICAgcG9wdXA6IHtcbiAgICAgICAgd2lkdGg6IDc4MCxcbiAgICAgICAgaGVpZ2h0OiA0OTIsXG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgLy8gc2V0IEJ1ZmZlciBzaGFyZSBVUkxcbiAgYnVmZmVyKGRhdGEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdXJsOiAnaHR0cDovL2J1ZmZlcmFwcC5jb20vYWRkPycsXG4gICAgICBkYXRhLFxuICAgICAgcG9wdXA6IHtcbiAgICAgICAgd2lkdGg6IDc0NSxcbiAgICAgICAgaGVpZ2h0OiAzNDUsXG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgLy8gc2V0IFR1bWJsciBzaGFyZSBVUkxcbiAgdHVtYmxyKGRhdGEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdXJsOiAnaHR0cHM6Ly93d3cudHVtYmxyLmNvbS93aWRnZXRzL3NoYXJlL3Rvb2w/JyxcbiAgICAgIGRhdGEsXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogNTQwLFxuICAgICAgICBoZWlnaHQ6IDk0MCxcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgUmVkZGl0IHNoYXJlIFVSTFxuICByZWRkaXQoZGF0YSkge1xuICAgIHJldHVybiB7XG4gICAgICB1cmw6ICdodHRwOi8vcmVkZGl0LmNvbS9zdWJtaXQ/JyxcbiAgICAgIGRhdGEsXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogODYwLFxuICAgICAgICBoZWlnaHQ6IDg4MCxcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgRmxpY2tyIGZvbGxvdyBVUkxcbiAgZmxpY2tyKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG4gICAgLy8gaWYgaU9TIHVzZXJcbiAgICBpZiAoaW9zICYmIGRhdGEuaW9zKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB1cmw6IGBmbGlja3I6Ly9waG90b3MvJHtkYXRhLnVzZXJuYW1lfT9gLFxuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogYGh0dHA6Ly93d3cuZmxpY2tyLmNvbS9waG90b3MvJHtkYXRhLnVzZXJuYW1lfT9gLFxuICAgICAgcG9wdXA6IHtcbiAgICAgICAgd2lkdGg6IDYwMCxcbiAgICAgICAgaGVpZ2h0OiA2NTAsXG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgLy8gc2V0IFdoYXRzQXBwIHNoYXJlIFVSTFxuICB3aGF0c2FwcChkYXRhKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogJ3doYXRzYXBwOi8vc2VuZD8nLFxuICAgICAgZGF0YSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBzbXMgc2hhcmUgVVJMXG4gIHNtcyhkYXRhLCBpb3MgPSBmYWxzZSkge1xuICAgIHJldHVybiB7XG4gICAgICB1cmw6IGlvcyA/ICdzbXM6JicgOiAnc21zOj8nLFxuICAgICAgZGF0YSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBFbWFpbCBzaGFyZSBVUkxcbiAgZW1haWwoZGF0YSkge1xuICAgIGxldCB1cmwgPSAnbWFpbHRvOic7XG5cbiAgICAvLyBpZiB0byBhZGRyZXNzIHNwZWNpZmllZCB0aGVuIGFkZCB0byBVUkxcbiAgICBpZiAoZGF0YS50byAhPT0gbnVsbCkge1xuICAgICAgdXJsICs9IGAke2RhdGEudG99YDtcbiAgICB9XG5cbiAgICB1cmwgKz0gJz8nO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHVybCxcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgc3ViamVjdDogZGF0YS5zdWJqZWN0LFxuICAgICAgICBib2R5OiBkYXRhLmJvZHksXG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgLy8gc2V0IEdpdGh1YiBmb3JrIFVSTFxuICBnaXRodWIoZGF0YSwgaW9zID0gZmFsc2UpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICAgIGxldCB1cmwgPSBkYXRhLnJlcG8gPyBgaHR0cHM6Ly9naXRodWIuY29tLyR7ZGF0YS5yZXBvfWAgOiBkYXRhLnVybDtcblxuICAgIGlmIChkYXRhLmlzc3VlKSB7XG4gICAgICB1cmwgKz0gYC9pc3N1ZXMvbmV3P3RpdGxlPSR7ZGF0YS5pc3N1ZX0mYm9keT0ke2RhdGEuYm9keX1gO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB1cmw6IGAke3VybH0/YCxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiAxMDIwLFxuICAgICAgICBoZWlnaHQ6IDMyMyxcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgRHJpYmJibGUgc2hhcmUgVVJMXG4gIGRyaWJiYmxlKGRhdGEsIGlvcyA9IGZhbHNlKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgICBjb25zdCB1cmwgPSBkYXRhLnNob3QgPyBgaHR0cHM6Ly9kcmliYmJsZS5jb20vc2hvdHMvJHtkYXRhLnNob3R9P2AgOiBgJHtkYXRhLnVybH0/YDtcbiAgICByZXR1cm4ge1xuICAgICAgdXJsLFxuICAgICAgcG9wdXA6IHtcbiAgICAgICAgd2lkdGg6IDQ0MCxcbiAgICAgICAgaGVpZ2h0OiA2NDAsXG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgY29kZXBlbihkYXRhKSB7XG4gICAgY29uc3QgdXJsID0gKGRhdGEucGVuICYmIGRhdGEudXNlcm5hbWUgJiYgZGF0YS52aWV3KSA/IGBodHRwczovL2NvZGVwZW4uaW8vJHtkYXRhLnVzZXJuYW1lfS8ke2RhdGEudmlld30vJHtkYXRhLnBlbn0/YCA6IGAke2RhdGEudXJsfT9gO1xuICAgIHJldHVybiB7XG4gICAgICB1cmwsXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogMTIwMCxcbiAgICAgICAgaGVpZ2h0OiA4MDAsXG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgcGF5cGFsKGRhdGEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZGF0YSxcbiAgICB9O1xuICB9LFxufTtcbiJdfQ==
