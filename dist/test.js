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

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  document.addEventListener('DOMContentLoaded', require('./lib/init')({
    api: 'count',
    selector: '[data-open-share-count]:not([data-open-share-node])',
    cb: require('./lib/initializeCountNode')
  }));

  return require('./src/modules/count-api')();
};

},{"./lib/init":5,"./lib/initializeCountNode":6,"./src/modules/count-api":14}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = countReduce;
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

Object.defineProperty(exports, "__esModule", {
  value: true
});

// type contains a dash
// transform to camelcase for function reference
// TODO: only supports single dash, should should support multiple
exports.default = function (dash, type) {
  var nextChar = type.substr(dash + 1, 1);
  var group = type.substr(dash, 2);

  type = type.replace(group, nextChar.toUpperCase());
  return type;
};

},{}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = init;

var _initializeNodes = require('./initializeNodes');

var _initializeNodes2 = _interopRequireDefault(_initializeNodes);

var _initializeWatcher = require('./initializeWatcher');

var _initializeWatcher2 = _interopRequireDefault(_initializeWatcher);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function init(opts) {
  return function () {
    var initNodes = (0, _initializeNodes2.default)({
      api: opts.api || null,
      container: opts.container || document,
      selector: opts.selector,
      cb: opts.cb
    });

    initNodes();

    // check for mutation observers before using, IE11 only
    if (window.MutationObserver !== undefined) {
      (0, _initializeWatcher2.default)(document.querySelectorAll('[data-open-share-watch]'), initNodes);
    }
  };
}

},{"./initializeNodes":7,"./initializeWatcher":9}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = initializeCountNode;

var _count = require('../src/modules/count');

var _count2 = _interopRequireDefault(_count);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function initializeCountNode(os) {
  // initialize open share object with type attribute
  var type = os.getAttribute('data-open-share-count');
  var url = os.getAttribute('data-open-share-count-repo') || os.getAttribute('data-open-share-count-shot') || os.getAttribute('data-open-share-count-url');
  var count = new _count2.default(type, url);

  count.count(os);
  os.setAttribute('data-open-share-node', type);
}

},{"../src/modules/count":16}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = initializeNodes;

var _events = require('../src/modules/events');

var _events2 = _interopRequireDefault(_events);

var _analytics = require('../analytics');

var _analytics2 = _interopRequireDefault(_analytics);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function initializeNodes(opts) {
  // loop through open share node collection
  return function () {
    // check for analytics
    checkAnalytics();

    if (opts.api) {
      var nodes = opts.container.querySelectorAll(opts.selector);
      [].forEach.call(nodes, opts.cb);

      // trigger completed event
      _events2.default.trigger(document, opts.api + '-loaded');
    } else {
      // loop through open share node collection
      var shareNodes = opts.container.querySelectorAll(opts.selector.share);
      [].forEach.call(shareNodes, opts.cb.share);

      // trigger completed event
      _events2.default.trigger(document, 'share-loaded');

      // loop through count node collection
      var countNodes = opts.container.querySelectorAll(opts.selector.count);
      [].forEach.call(countNodes, opts.cb.count);

      // trigger completed event
      _events2.default.trigger(document, 'count-loaded');
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
        return (0, _analytics2.default)(p);
      });
    } else (0, _analytics2.default)(provider);
  }
}

},{"../analytics":1,"../src/modules/events":17}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = initializeShareNode;

var _shareTransforms = require('../src/modules/share-transforms');

var _shareTransforms2 = _interopRequireDefault(_shareTransforms);

var _openShare = require('../src/modules/open-share');

var _openShare2 = _interopRequireDefault(_openShare);

var _setData = require('./setData');

var _setData2 = _interopRequireDefault(_setData);

var _share = require('./share');

var _share2 = _interopRequireDefault(_share);

var _dashToCamel = require('./dashToCamel');

var _dashToCamel2 = _interopRequireDefault(_dashToCamel);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function initializeShareNode(os) {
  // initialize open share object with type attribute
  var type = os.getAttribute('data-open-share');
  var dash = type.indexOf('-');

  if (dash > -1) {
    type = (0, _dashToCamel2.default)(dash, type);
  }

  var transform = _shareTransforms2.default[type];

  if (!transform) {
    throw new Error('Open Share: ' + type + ' is an invalid type');
  }

  var openShare = new _openShare2.default(type, transform);

  // specify if this is a dynamic instance
  if (os.getAttribute('data-open-share-dynamic')) {
    openShare.dynamic = true;
  }

  // specify if this is a popup instance
  if (os.getAttribute('data-open-share-popup')) {
    openShare.popup = true;
  }

  // set all optional attributes on open share instance
  (0, _setData2.default)(openShare, os);

  // open share dialog on click
  os.addEventListener('click', function (e) {
    (0, _share2.default)(e, os, openShare);
  });

  os.addEventListener('OpenShare.trigger', function (e) {
    (0, _share2.default)(e, os, openShare);
  });

  os.setAttribute('data-open-share-node', type);
}

},{"../src/modules/open-share":18,"../src/modules/share-transforms":20,"./dashToCamel":4,"./setData":10,"./share":11}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = initializeWatcher;
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

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = setData;
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

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = share;

var _events = require('../src/modules/events');

var _events2 = _interopRequireDefault(_events);

var _setData = require('./setData');

var _setData2 = _interopRequireDefault(_setData);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function share(e, os, openShare) {
  // if dynamic instance then fetch attributes again in case of updates
  if (openShare.dynamic) {
    (0, _setData2.default)(openShare, os);
  }

  openShare.share(e);

  // trigger shared event
  _events2.default.trigger(os, 'shared');
}

},{"../src/modules/events":17,"./setData":10}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

/*
   Sometimes social platforms get confused and drop share counts.
   In this module we check if the returned count is less than the count in
   localstorage.
   If the local count is greater than the returned count,
   we store the local count + the returned count.
   Otherwise, store the returned count.
*/

exports.default = function (t, count) {
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

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  document.addEventListener('DOMContentLoaded', require('./lib/init')({
    api: 'share',
    selector: '[data-open-share]:not([data-open-share-node])',
    cb: require('./lib/initializeShareNode')
  }));

  return require('./src/modules/share-api')();
};

},{"./lib/init":5,"./lib/initializeShareNode":8,"./src/modules/share-api":19}],14:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _count = require('./count');

var _count2 = _interopRequireDefault(_count);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } } /**
                                                                                                                                                           * count API
                                                                                                                                                           */

exports.default = function () {
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
      return new _count2.default(type, url).count(countNode, cb, appendTo);
    }

    return new _count2.default(type, url).count(countNode, cb);
  };

  return Count;
};

},{"./count":16}],15:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _countReduce = require('../../lib/countReduce');

var _countReduce2 = _interopRequireDefault(_countReduce);

var _storeCount = require('../../lib/storeCount');

var _storeCount2 = _interopRequireDefault(_storeCount);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Object of transform functions for each openshare api
 * Transform functions passed into OpenShare instance when instantiated
 * Return object containing URL and key/value args
 */
exports.default = {

  // facebook count data
  facebook: function facebook(url) {
    return {
      type: 'get',
      url: 'https://graph.facebook.com/?id=' + url,
      transform: function transform(xhr) {
        var fb = JSON.parse(xhr.responseText);

        var count = fb.share && fb.share.share_count || 0;

        return (0, _storeCount2.default)(this, count);
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
        return (0, _storeCount2.default)(this, count);
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
        return (0, _storeCount2.default)(this, count);
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

        return (0, _storeCount2.default)(this, ups);
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
        return (0, _storeCount2.default)(this, count);
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
        return (0, _storeCount2.default)(this, count);
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
        return (0, _storeCount2.default)(this, count);
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
        return (0, _storeCount2.default)(this, count);
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
            (0, _countReduce2.default)(_this.os, finalCount, _this.cb);
            Events.trigger(_this.os, 'counted-' + _this.url);
            return (0, _storeCount2.default)(_this, finalCount);
          });
        } else {
          return (0, _storeCount2.default)(this, count);
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
        return (0, _storeCount2.default)(this, count);
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

},{"../../lib/countReduce":3,"../../lib/storeCount":12}],16:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Generate share count instance from one to many networks
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */

var _countTransforms = require('./count-transforms');

var _countTransforms2 = _interopRequireDefault(_countTransforms);

var _events = require('./events');

var _events2 = _interopRequireDefault(_events);

var _countReduce = require('../../lib/countReduce');

var _countReduce2 = _interopRequireDefault(_countReduce);

var _storeCount = require('../../lib/storeCount');

var _storeCount2 = _interopRequireDefault(_storeCount);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// eslint-disable-line no-unused-vars

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

var Count = function () {
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
        if (!_countTransforms2.default[t]) {
          throw new Error('Open Share: ' + type + ' is an invalid count type');
        }

        _this.countData.push(_countTransforms2.default[t](url));
      });

      // throw error if invalid type provided
    } else if (!_countTransforms2.default[type]) {
      throw new Error('Open Share: ' + type + ' is an invalid count type');

      // single count
      // store count URL and transform function
    } else {
      this.type = type;
      this.countData = _countTransforms2.default[type](url);
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
        (0, _countReduce2.default)(this.os, count);
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
        (0, _countReduce2.default)(this.os, count);
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

            (0, _countReduce2.default)(_this2.os, tot);
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
          (0, _countReduce2.default)(_this3.os, count, _this3.cb);
        }

        _events2.default.trigger(_this3.os, 'counted-' + _this3.url);
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
            var count = countData.transform.apply(_this4, [xhr, _events2.default]) || 0;

            if (cb && typeof cb === 'function') {
              cb(count);
            } else {
              if (_this4.appendTo && typeof _this4.appendTo !== 'function') {
                _this4.appendTo.appendChild(_this4.os);
              }
              (0, _countReduce2.default)(_this4.os, count, _this4.cb);
            }

            _events2.default.trigger(_this4.os, 'counted-' + _this4.url);
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
          (0, _countReduce2.default)(_this5.os, count, _this5.cb);
        }
        _events2.default.trigger(_this5.os, 'counted-' + _this5.url);
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

exports.default = Count;

},{"../../lib/countReduce":3,"../../lib/storeCount":12,"./count-transforms":15,"./events":17}],17:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * Trigger custom OpenShare namespaced event
 */
exports.default = {
  trigger: function trigger(element, event) {
    var ev = document.createEvent('Event');
    ev.initEvent('OpenShare.' + event, true, true);
    element.dispatchEvent(ev);
  }
};

},{}],18:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * OpenShare generates a single share link
 */
var OpenShare = function () {
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

exports.default = OpenShare;

},{}],19:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Global OpenShare API to generate instances programmatically
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */


var _openShare = require('./open-share');

var _openShare2 = _interopRequireDefault(_openShare);

var _shareTransforms = require('./share-transforms');

var _shareTransforms2 = _interopRequireDefault(_shareTransforms);

var _events = require('./events');

var _events2 = _interopRequireDefault(_events);

var _dashToCamel = require('../../lib/dashToCamel');

var _dashToCamel2 = _interopRequireDefault(_dashToCamel);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

exports.default = function () {
  // global OpenShare referencing internal class for instance generation
  var OpenShare = function () {
    function OpenShare(data, element) {
      var _this = this;

      _classCallCheck(this, OpenShare);

      if (!data.bindClick) data.bindClick = true;

      var dash = data.type.indexOf('-');

      if (dash > -1) {
        data.type = (0, _dashToCamel2.default)(dash, data.type);
      }

      var node = void 0;
      this.element = element;
      this.data = data;

      this.os = new _openShare2.default(data.type, _shareTransforms2.default[data.type]);
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

        _events2.default.trigger(this.element, 'shared');
      }
    }]);

    return OpenShare;
  }();

  return OpenShare;
};

},{"../../lib/dashToCamel":4,"./events":17,"./open-share":18,"./share-transforms":20}],20:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * Object of transform functions for each openshare api
 * Transform functions passed into OpenShare instance when instantiated
 * Return object containing URL and key/value args
 */
exports.default = {

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
  var data = dynamicNodeData; // eslint-disable-line no-unused-vars
  new OpenShare.count({ // eslint-disable-line
    type: 'facebook',
    url: 'https://www.digitalsurgeons.com/'
  }, function (node) {
    var os = new OpenShare.share({ // eslint-disable-line
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

  var examples = { // eslint-disable-line no-unused-vars
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiYW5hbHl0aWNzLmpzIiwiY291bnQuanMiLCJsaWIvY291bnRSZWR1Y2UuanMiLCJsaWIvZGFzaFRvQ2FtZWwuanMiLCJsaWIvaW5pdC5qcyIsImxpYi9pbml0aWFsaXplQ291bnROb2RlLmpzIiwibGliL2luaXRpYWxpemVOb2Rlcy5qcyIsImxpYi9pbml0aWFsaXplU2hhcmVOb2RlLmpzIiwibGliL2luaXRpYWxpemVXYXRjaGVyLmpzIiwibGliL3NldERhdGEuanMiLCJsaWIvc2hhcmUuanMiLCJsaWIvc3RvcmVDb3VudC5qcyIsInNoYXJlLmpzIiwic3JjL21vZHVsZXMvY291bnQtYXBpLmpzIiwic3JjL21vZHVsZXMvY291bnQtdHJhbnNmb3Jtcy5qcyIsInNyYy9tb2R1bGVzL2NvdW50LmpzIiwic3JjL21vZHVsZXMvZXZlbnRzLmpzIiwic3JjL21vZHVsZXMvb3Blbi1zaGFyZS5qcyIsInNyYy9tb2R1bGVzL3NoYXJlLWFwaS5qcyIsInNyYy9tb2R1bGVzL3NoYXJlLXRyYW5zZm9ybXMuanMiLCJzcmMvdGVzdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsT0FBTyxPQUFQLEdBQWlCLFVBQVUsSUFBVixFQUFnQixFQUFoQixFQUFvQjtBQUFDO0FBQ3BDLE1BQU0sT0FBTyxTQUFTLE9BQVQsSUFBb0IsU0FBUyxRQUExQztBQUNBLE1BQU0sZUFBZSxTQUFTLFlBQTlCOztBQUVBLE1BQUksSUFBSixFQUFVLHVCQUF1QixJQUF2QixFQUE2QixFQUE3QjtBQUNWLE1BQUksWUFBSixFQUFrQixjQUFjLEVBQWQ7QUFDbkIsQ0FORDs7QUFRQSxTQUFTLHNCQUFULENBQWdDLElBQWhDLEVBQXNDLEVBQXRDLEVBQTBDO0FBQ3hDLE1BQUksT0FBTyxFQUFYLEVBQWU7QUFDYixRQUFJLEVBQUosRUFBUTtBQUNWO0FBQ0UsV0FB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LCtFQUZhO0FBR2xCLE9BQUs7QUFIYSxDQUFwQixFQUlHLFVBQUMsSUFBRCxFQUFVO0FBQ1gsTUFBTSxLQUFLLElBQUksVUFBVSxLQUFkLENBQW9CLEVBQUU7QUFDL0IsVUFBTSxTQUR1QjtBQUU3QixTQUFLLCtFQUZ3QjtBQUc3QixTQUFLLGlCQUh3QjtBQUk3QixjQUFVLDZCQUptQjtBQUs3QixjQUFVLFNBQVMsSUFMVTtBQU03QixlQUFXO0FBTmtCLEdBQXBCLENBQVg7QUFRQSxLQUFHLFdBQUgsQ0FBZSxJQUFmO0FBQ0QsQ0FkRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICh0eXBlLCBjYikgey8vIGVzbGludC1kaXNhYmxlLWxpbmVcbiAgY29uc3QgaXNHQSA9IHR5cGUgPT09ICdldmVudCcgfHwgdHlwZSA9PT0gJ3NvY2lhbCc7XG4gIGNvbnN0IGlzVGFnTWFuYWdlciA9IHR5cGUgPT09ICd0YWdNYW5hZ2VyJztcblxuICBpZiAoaXNHQSkgY2hlY2tJZkFuYWx5dGljc0xvYWRlZCh0eXBlLCBjYik7XG4gIGlmIChpc1RhZ01hbmFnZXIpIHNldFRhZ01hbmFnZXIoY2IpO1xufTtcblxuZnVuY3Rpb24gY2hlY2tJZkFuYWx5dGljc0xvYWRlZCh0eXBlLCBjYikge1xuICBpZiAod2luZG93LmdhKSB7XG4gICAgaWYgKGNiKSBjYigpO1xuICAvLyBiaW5kIHRvIHNoYXJlZCBldmVudCBvbiBlYWNoIGluZGl2aWR1YWwgbm9kZVxuICAgIGxpc3RlbigoZSkgPT4ge1xuICAgICAgY29uc3QgcGxhdGZvcm0gPSBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZScpO1xuICAgICAgY29uc3QgdGFyZ2V0ID0gZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtbGluaycpIHx8XG4gICAgICBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS11cmwnKSB8fFxuICAgICAgZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdXNlcm5hbWUnKSB8fFxuICAgICAgZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY2VudGVyJykgfHxcbiAgICAgIGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXNlYXJjaCcpIHx8XG4gICAgICBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1ib2R5Jyk7XG5cbiAgICAgIGlmICh0eXBlID09PSAnZXZlbnQnKSB7XG4gICAgICAgIGdhKCdzZW5kJywgJ2V2ZW50JywgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVuZGVmXG4gICAgICAgICAgZXZlbnRDYXRlZ29yeTogJ09wZW5TaGFyZSBDbGljaycsXG4gICAgICAgICAgZXZlbnRBY3Rpb246IHBsYXRmb3JtLFxuICAgICAgICAgIGV2ZW50TGFiZWw6IHRhcmdldCxcbiAgICAgICAgICB0cmFuc3BvcnQ6ICdiZWFjb24nLFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGUgPT09ICdzb2NpYWwnKSB7XG4gICAgICAgIGdhKCdzZW5kJywgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVuZGVmXG4gICAgICAgICAgaGl0VHlwZTogJ3NvY2lhbCcsXG4gICAgICAgICAgc29jaWFsTmV0d29yazogcGxhdGZvcm0sXG4gICAgICAgICAgc29jaWFsQWN0aW9uOiAnc2hhcmUnLFxuICAgICAgICAgIHNvY2lhbFRhcmdldDogdGFyZ2V0LFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGNoZWNrSWZBbmFseXRpY3NMb2FkZWQodHlwZSwgY2IpO1xuICAgIH0sIDEwMDApO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNldFRhZ01hbmFnZXIoY2IpIHtcbiAgaWYgKHdpbmRvdy5kYXRhTGF5ZXIgJiYgd2luZG93LmRhdGFMYXllclswXVsnZ3RtLnN0YXJ0J10pIHtcbiAgICBpZiAoY2IpIGNiKCk7XG5cbiAgICBsaXN0ZW4ob25TaGFyZVRhZ01hbmdlcik7XG5cbiAgICBnZXRDb3VudHMoKGUpID0+IHtcbiAgICAgIGNvbnN0IGNvdW50ID0gZS50YXJnZXQgP1xuICAgICAgZS50YXJnZXQuaW5uZXJIVE1MIDpcbiAgICAgIGUuaW5uZXJIVE1MO1xuXG4gICAgICBjb25zdCBwbGF0Zm9ybSA9IGUudGFyZ2V0ID9cbiAgICAgIGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50LXVybCcpIDpcbiAgICAgIGUuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY291bnQtdXJsJyk7XG5cbiAgICAgIHdpbmRvdy5kYXRhTGF5ZXIucHVzaCh7XG4gICAgICAgIGV2ZW50OiAnT3BlblNoYXJlIENvdW50JyxcbiAgICAgICAgcGxhdGZvcm0sXG4gICAgICAgIHJlc291cmNlOiBjb3VudCxcbiAgICAgICAgYWN0aXZpdHk6ICdjb3VudCcsXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHNldFRhZ01hbmFnZXIoY2IpO1xuICAgIH0sIDEwMDApO1xuICB9XG59XG5cbmZ1bmN0aW9uIGxpc3RlbihjYikge1xuICAvLyBiaW5kIHRvIHNoYXJlZCBldmVudCBvbiBlYWNoIGluZGl2aWR1YWwgbm9kZVxuICBbXS5mb3JFYWNoLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtb3Blbi1zaGFyZV0nKSwgKG5vZGUpID0+IHtcbiAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ09wZW5TaGFyZS5zaGFyZWQnLCBjYik7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRDb3VudHMoY2IpIHtcbiAgY29uc3QgY291bnROb2RlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtb3Blbi1zaGFyZS1jb3VudF0nKTtcblxuICBbXS5mb3JFYWNoLmNhbGwoY291bnROb2RlLCAobm9kZSkgPT4ge1xuICAgIGlmIChub2RlLnRleHRDb250ZW50KSBjYihub2RlKTtcbiAgICBlbHNlIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihgT3BlblNoYXJlLmNvdW50ZWQtJHtub2RlLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50LXVybCcpfWAsIGNiKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIG9uU2hhcmVUYWdNYW5nZXIoZSkge1xuICBjb25zdCBwbGF0Zm9ybSA9IGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlJyk7XG4gIGNvbnN0IHRhcmdldCA9IGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWxpbmsnKSB8fFxuICAgIGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXVybCcpIHx8XG4gICAgZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdXNlcm5hbWUnKSB8fFxuICAgIGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNlbnRlcicpIHx8XG4gICAgZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtc2VhcmNoJykgfHxcbiAgICBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1ib2R5Jyk7XG5cbiAgd2luZG93LmRhdGFMYXllci5wdXNoKHtcbiAgICBldmVudDogJ09wZW5TaGFyZSBTaGFyZScsXG4gICAgcGxhdGZvcm0sXG4gICAgcmVzb3VyY2U6IHRhcmdldCxcbiAgICBhY3Rpdml0eTogJ3NoYXJlJyxcbiAgfSk7XG59XG4iLCJleHBvcnQgZGVmYXVsdCAoKSA9PiB7XG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCByZXF1aXJlKCcuL2xpYi9pbml0Jykoe1xuICAgIGFwaTogJ2NvdW50JyxcbiAgICBzZWxlY3RvcjogJ1tkYXRhLW9wZW4tc2hhcmUtY291bnRdOm5vdChbZGF0YS1vcGVuLXNoYXJlLW5vZGVdKScsXG4gICAgY2I6IHJlcXVpcmUoJy4vbGliL2luaXRpYWxpemVDb3VudE5vZGUnKSxcbiAgfSkpO1xuXG4gIHJldHVybiByZXF1aXJlKCcuL3NyYy9tb2R1bGVzL2NvdW50LWFwaScpKCk7XG59O1xuIiwiZnVuY3Rpb24gcm91bmQoeCwgcHJlY2lzaW9uKSB7XG4gIGlmICh0eXBlb2YgeCAhPT0gJ251bWJlcicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFeHBlY3RlZCB2YWx1ZSB0byBiZSBhIG51bWJlcicpO1xuICB9XG5cbiAgY29uc3QgZXhwb25lbnQgPSBwcmVjaXNpb24gPiAwID8gJ2UnIDogJ2UtJztcbiAgY29uc3QgZXhwb25lbnROZWcgPSBwcmVjaXNpb24gPiAwID8gJ2UtJyA6ICdlJztcbiAgcHJlY2lzaW9uID0gTWF0aC5hYnMocHJlY2lzaW9uKTtcblxuICByZXR1cm4gTnVtYmVyKE1hdGgucm91bmQoeCArIGV4cG9uZW50ICsgcHJlY2lzaW9uKSArIGV4cG9uZW50TmVnICsgcHJlY2lzaW9uKTtcbn1cblxuZnVuY3Rpb24gdGhvdXNhbmRpZnkobnVtKSB7XG4gIHJldHVybiBgJHtyb3VuZChudW0gLyAxMDAwLCAxKX1LYDtcbn1cblxuZnVuY3Rpb24gbWlsbGlvbmlmeShudW0pIHtcbiAgcmV0dXJuIGAke3JvdW5kKG51bSAvIDEwMDAwMDAsIDEpfU1gO1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjb3VudFJlZHVjZShlbCwgY291bnQsIGNiKSB7XG4gIGlmIChjb3VudCA+IDk5OTk5OSkge1xuICAgIGVsLmlubmVySFRNTCA9IG1pbGxpb25pZnkoY291bnQpO1xuICAgIGlmIChjYiAmJiB0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpIGNiKGVsKTtcbiAgfSBlbHNlIGlmIChjb3VudCA+IDk5OSkge1xuICAgIGVsLmlubmVySFRNTCA9IHRob3VzYW5kaWZ5KGNvdW50KTtcbiAgICBpZiAoY2IgJiYgdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSBjYihlbCk7XG4gIH0gZWxzZSB7XG4gICAgZWwuaW5uZXJIVE1MID0gY291bnQ7XG4gICAgaWYgKGNiICYmIHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykgY2IoZWwpO1xuICB9XG59XG4iLCIvLyB0eXBlIGNvbnRhaW5zIGEgZGFzaFxuLy8gdHJhbnNmb3JtIHRvIGNhbWVsY2FzZSBmb3IgZnVuY3Rpb24gcmVmZXJlbmNlXG4vLyBUT0RPOiBvbmx5IHN1cHBvcnRzIHNpbmdsZSBkYXNoLCBzaG91bGQgc2hvdWxkIHN1cHBvcnQgbXVsdGlwbGVcbmV4cG9ydCBkZWZhdWx0IChkYXNoLCB0eXBlKSA9PiB7XG4gIGNvbnN0IG5leHRDaGFyID0gdHlwZS5zdWJzdHIoZGFzaCArIDEsIDEpO1xuICBjb25zdCBncm91cCA9IHR5cGUuc3Vic3RyKGRhc2gsIDIpO1xuXG4gIHR5cGUgPSB0eXBlLnJlcGxhY2UoZ3JvdXAsIG5leHRDaGFyLnRvVXBwZXJDYXNlKCkpO1xuICByZXR1cm4gdHlwZTtcbn07XG4iLCJpbXBvcnQgaW5pdGlhbGl6ZU5vZGVzIGZyb20gJy4vaW5pdGlhbGl6ZU5vZGVzJztcbmltcG9ydCBpbml0aWFsaXplV2F0Y2hlciBmcm9tICcuL2luaXRpYWxpemVXYXRjaGVyJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gaW5pdChvcHRzKSB7XG4gIHJldHVybiAoKSA9PiB7XG4gICAgY29uc3QgaW5pdE5vZGVzID0gaW5pdGlhbGl6ZU5vZGVzKHtcbiAgICAgIGFwaTogb3B0cy5hcGkgfHwgbnVsbCxcbiAgICAgIGNvbnRhaW5lcjogb3B0cy5jb250YWluZXIgfHwgZG9jdW1lbnQsXG4gICAgICBzZWxlY3Rvcjogb3B0cy5zZWxlY3RvcixcbiAgICAgIGNiOiBvcHRzLmNiLFxuICAgIH0pO1xuXG4gICAgaW5pdE5vZGVzKCk7XG5cbiAgICAvLyBjaGVjayBmb3IgbXV0YXRpb24gb2JzZXJ2ZXJzIGJlZm9yZSB1c2luZywgSUUxMSBvbmx5XG4gICAgaWYgKHdpbmRvdy5NdXRhdGlvbk9ic2VydmVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGluaXRpYWxpemVXYXRjaGVyKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLW9wZW4tc2hhcmUtd2F0Y2hdJyksIGluaXROb2Rlcyk7XG4gICAgfVxuICB9O1xufVxuIiwiaW1wb3J0IENvdW50IGZyb20gJy4uL3NyYy9tb2R1bGVzL2NvdW50JztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gaW5pdGlhbGl6ZUNvdW50Tm9kZShvcykge1xuICAvLyBpbml0aWFsaXplIG9wZW4gc2hhcmUgb2JqZWN0IHdpdGggdHlwZSBhdHRyaWJ1dGVcbiAgY29uc3QgdHlwZSA9IG9zLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50Jyk7XG4gIGNvbnN0IHVybCA9IG9zLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50LXJlcG8nKSB8fFxuICAgICAgb3MuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY291bnQtc2hvdCcpIHx8XG4gICAgICBvcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudC11cmwnKTtcbiAgY29uc3QgY291bnQgPSBuZXcgQ291bnQodHlwZSwgdXJsKTtcblxuICBjb3VudC5jb3VudChvcyk7XG4gIG9zLnNldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLW5vZGUnLCB0eXBlKTtcbn1cbiIsImltcG9ydCBFdmVudHMgZnJvbSAnLi4vc3JjL21vZHVsZXMvZXZlbnRzJztcbmltcG9ydCBhbmFseXRpY3MgZnJvbSAnLi4vYW5hbHl0aWNzJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gaW5pdGlhbGl6ZU5vZGVzKG9wdHMpIHtcbiAgLy8gbG9vcCB0aHJvdWdoIG9wZW4gc2hhcmUgbm9kZSBjb2xsZWN0aW9uXG4gIHJldHVybiAoKSA9PiB7XG4gICAgLy8gY2hlY2sgZm9yIGFuYWx5dGljc1xuICAgIGNoZWNrQW5hbHl0aWNzKCk7XG5cbiAgICBpZiAob3B0cy5hcGkpIHtcbiAgICAgIGNvbnN0IG5vZGVzID0gb3B0cy5jb250YWluZXIucXVlcnlTZWxlY3RvckFsbChvcHRzLnNlbGVjdG9yKTtcbiAgICAgIFtdLmZvckVhY2guY2FsbChub2Rlcywgb3B0cy5jYik7XG5cbiAgICAgIC8vIHRyaWdnZXIgY29tcGxldGVkIGV2ZW50XG4gICAgICBFdmVudHMudHJpZ2dlcihkb2N1bWVudCwgYCR7b3B0cy5hcGl9LWxvYWRlZGApO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBsb29wIHRocm91Z2ggb3BlbiBzaGFyZSBub2RlIGNvbGxlY3Rpb25cbiAgICAgIGNvbnN0IHNoYXJlTm9kZXMgPSBvcHRzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKG9wdHMuc2VsZWN0b3Iuc2hhcmUpO1xuICAgICAgW10uZm9yRWFjaC5jYWxsKHNoYXJlTm9kZXMsIG9wdHMuY2Iuc2hhcmUpO1xuXG4gICAgICAvLyB0cmlnZ2VyIGNvbXBsZXRlZCBldmVudFxuICAgICAgRXZlbnRzLnRyaWdnZXIoZG9jdW1lbnQsICdzaGFyZS1sb2FkZWQnKTtcblxuICAgICAgLy8gbG9vcCB0aHJvdWdoIGNvdW50IG5vZGUgY29sbGVjdGlvblxuICAgICAgY29uc3QgY291bnROb2RlcyA9IG9wdHMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwob3B0cy5zZWxlY3Rvci5jb3VudCk7XG4gICAgICBbXS5mb3JFYWNoLmNhbGwoY291bnROb2Rlcywgb3B0cy5jYi5jb3VudCk7XG5cbiAgICAgIC8vIHRyaWdnZXIgY29tcGxldGVkIGV2ZW50XG4gICAgICBFdmVudHMudHJpZ2dlcihkb2N1bWVudCwgJ2NvdW50LWxvYWRlZCcpO1xuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gY2hlY2tBbmFseXRpY3MoKSB7XG4gIC8vIGNoZWNrIGZvciBhbmFseXRpY3NcbiAgaWYgKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLW9wZW4tc2hhcmUtYW5hbHl0aWNzXScpKSB7XG4gICAgY29uc3QgcHJvdmlkZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbZGF0YS1vcGVuLXNoYXJlLWFuYWx5dGljc10nKVxuICAgICAgLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWFuYWx5dGljcycpO1xuXG4gICAgaWYgKHByb3ZpZGVyLmluZGV4T2YoJywnKSA+IC0xKSB7XG4gICAgICBjb25zdCBwcm92aWRlcnMgPSBwcm92aWRlci5zcGxpdCgnLCcpO1xuICAgICAgcHJvdmlkZXJzLmZvckVhY2gocCA9PiBhbmFseXRpY3MocCkpO1xuICAgIH0gZWxzZSBhbmFseXRpY3MocHJvdmlkZXIpO1xuICB9XG59XG4iLCJpbXBvcnQgU2hhcmVUcmFuc2Zvcm1zIGZyb20gJy4uL3NyYy9tb2R1bGVzL3NoYXJlLXRyYW5zZm9ybXMnO1xuaW1wb3J0IE9wZW5TaGFyZSBmcm9tICcuLi9zcmMvbW9kdWxlcy9vcGVuLXNoYXJlJztcbmltcG9ydCBzZXREYXRhIGZyb20gJy4vc2V0RGF0YSc7XG5pbXBvcnQgc2hhcmUgZnJvbSAnLi9zaGFyZSc7XG5pbXBvcnQgZGFzaFRvQ2FtZWwgZnJvbSAnLi9kYXNoVG9DYW1lbCc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGluaXRpYWxpemVTaGFyZU5vZGUob3MpIHtcbiAgLy8gaW5pdGlhbGl6ZSBvcGVuIHNoYXJlIG9iamVjdCB3aXRoIHR5cGUgYXR0cmlidXRlXG4gIGxldCB0eXBlID0gb3MuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUnKTtcbiAgY29uc3QgZGFzaCA9IHR5cGUuaW5kZXhPZignLScpO1xuXG4gIGlmIChkYXNoID4gLTEpIHtcbiAgICB0eXBlID0gZGFzaFRvQ2FtZWwoZGFzaCwgdHlwZSk7XG4gIH1cblxuICBjb25zdCB0cmFuc2Zvcm0gPSBTaGFyZVRyYW5zZm9ybXNbdHlwZV07XG5cbiAgaWYgKCF0cmFuc2Zvcm0pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYE9wZW4gU2hhcmU6ICR7dHlwZX0gaXMgYW4gaW52YWxpZCB0eXBlYCk7XG4gIH1cblxuICBjb25zdCBvcGVuU2hhcmUgPSBuZXcgT3BlblNoYXJlKHR5cGUsIHRyYW5zZm9ybSk7XG5cbiAgLy8gc3BlY2lmeSBpZiB0aGlzIGlzIGEgZHluYW1pYyBpbnN0YW5jZVxuICBpZiAob3MuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtZHluYW1pYycpKSB7XG4gICAgb3BlblNoYXJlLmR5bmFtaWMgPSB0cnVlO1xuICB9XG5cbiAgLy8gc3BlY2lmeSBpZiB0aGlzIGlzIGEgcG9wdXAgaW5zdGFuY2VcbiAgaWYgKG9zLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXBvcHVwJykpIHtcbiAgICBvcGVuU2hhcmUucG9wdXAgPSB0cnVlO1xuICB9XG5cbiAgLy8gc2V0IGFsbCBvcHRpb25hbCBhdHRyaWJ1dGVzIG9uIG9wZW4gc2hhcmUgaW5zdGFuY2VcbiAgc2V0RGF0YShvcGVuU2hhcmUsIG9zKTtcblxuICAvLyBvcGVuIHNoYXJlIGRpYWxvZyBvbiBjbGlja1xuICBvcy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XG4gICAgc2hhcmUoZSwgb3MsIG9wZW5TaGFyZSk7XG4gIH0pO1xuXG4gIG9zLmFkZEV2ZW50TGlzdGVuZXIoJ09wZW5TaGFyZS50cmlnZ2VyJywgKGUpID0+IHtcbiAgICBzaGFyZShlLCBvcywgb3BlblNoYXJlKTtcbiAgfSk7XG5cbiAgb3Muc2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtbm9kZScsIHR5cGUpO1xufVxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gaW5pdGlhbGl6ZVdhdGNoZXIod2F0Y2hlciwgZm4pIHtcbiAgW10uZm9yRWFjaC5jYWxsKHdhdGNoZXIsICh3KSA9PiB7XG4gICAgY29uc3Qgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcigobXV0YXRpb25zKSA9PiB7XG4gICAgICAvLyB0YXJnZXQgd2lsbCBtYXRjaCBiZXR3ZWVuIGFsbCBtdXRhdGlvbnMgc28ganVzdCB1c2UgZmlyc3RcbiAgICAgIGZuKG11dGF0aW9uc1swXS50YXJnZXQpO1xuICAgIH0pO1xuXG4gICAgb2JzZXJ2ZXIub2JzZXJ2ZSh3LCB7XG4gICAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgfSk7XG4gIH0pO1xufVxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gc2V0RGF0YShvc0luc3RhbmNlLCBvc0VsZW1lbnQpIHtcbiAgb3NJbnN0YW5jZS5zZXREYXRhKHtcbiAgICB1cmw6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS11cmwnKSxcbiAgICB0ZXh0OiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdGV4dCcpLFxuICAgIHZpYTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXZpYScpLFxuICAgIGhhc2h0YWdzOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtaGFzaHRhZ3MnKSxcbiAgICB0d2VldElkOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdHdlZXQtaWQnKSxcbiAgICByZWxhdGVkOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtcmVsYXRlZCcpLFxuICAgIHNjcmVlbk5hbWU6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1zY3JlZW4tbmFtZScpLFxuICAgIHVzZXJJZDogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXVzZXItaWQnKSxcbiAgICBsaW5rOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtbGluaycpLFxuICAgIHBpY3R1cmU6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1waWN0dXJlJyksXG4gICAgY2FwdGlvbjogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNhcHRpb24nKSxcbiAgICBkZXNjcmlwdGlvbjogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWRlc2NyaXB0aW9uJyksXG4gICAgdXNlcjogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXVzZXInKSxcbiAgICB2aWRlbzogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXZpZGVvJyksXG4gICAgdXNlcm5hbWU6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS11c2VybmFtZScpLFxuICAgIHRpdGxlOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdGl0bGUnKSxcbiAgICBtZWRpYTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLW1lZGlhJyksXG4gICAgdG86IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS10bycpLFxuICAgIHN1YmplY3Q6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1zdWJqZWN0JyksXG4gICAgYm9keTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWJvZHknKSxcbiAgICBpb3M6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1pb3MnKSxcbiAgICB0eXBlOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdHlwZScpLFxuICAgIGNlbnRlcjogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNlbnRlcicpLFxuICAgIHZpZXdzOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdmlld3MnKSxcbiAgICB6b29tOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtem9vbScpLFxuICAgIHNlYXJjaDogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXNlYXJjaCcpLFxuICAgIHNhZGRyOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtc2FkZHInKSxcbiAgICBkYWRkcjogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWRhZGRyJyksXG4gICAgZGlyZWN0aW9uc21vZGU6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1kaXJlY3Rpb25zLW1vZGUnKSxcbiAgICByZXBvOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtcmVwbycpLFxuICAgIHNob3Q6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1zaG90JyksXG4gICAgcGVuOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtcGVuJyksXG4gICAgdmlldzogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXZpZXcnKSxcbiAgICBpc3N1ZTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWlzc3VlJyksXG4gICAgYnV0dG9uSWQ6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1idXR0b25JZCcpLFxuICAgIHBvcFVwOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtcG9wdXAnKSxcbiAgICBrZXk6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1rZXknKSxcbiAgfSk7XG59XG4iLCJpbXBvcnQgRXZlbnRzIGZyb20gJy4uL3NyYy9tb2R1bGVzL2V2ZW50cyc7XG5pbXBvcnQgc2V0RGF0YSBmcm9tICcuL3NldERhdGEnO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBzaGFyZShlLCBvcywgb3BlblNoYXJlKSB7XG4gIC8vIGlmIGR5bmFtaWMgaW5zdGFuY2UgdGhlbiBmZXRjaCBhdHRyaWJ1dGVzIGFnYWluIGluIGNhc2Ugb2YgdXBkYXRlc1xuICBpZiAob3BlblNoYXJlLmR5bmFtaWMpIHtcbiAgICBzZXREYXRhKG9wZW5TaGFyZSwgb3MpO1xuICB9XG5cbiAgb3BlblNoYXJlLnNoYXJlKGUpO1xuXG4gIC8vIHRyaWdnZXIgc2hhcmVkIGV2ZW50XG4gIEV2ZW50cy50cmlnZ2VyKG9zLCAnc2hhcmVkJyk7XG59XG4iLCIvKlxuICAgU29tZXRpbWVzIHNvY2lhbCBwbGF0Zm9ybXMgZ2V0IGNvbmZ1c2VkIGFuZCBkcm9wIHNoYXJlIGNvdW50cy5cbiAgIEluIHRoaXMgbW9kdWxlIHdlIGNoZWNrIGlmIHRoZSByZXR1cm5lZCBjb3VudCBpcyBsZXNzIHRoYW4gdGhlIGNvdW50IGluXG4gICBsb2NhbHN0b3JhZ2UuXG4gICBJZiB0aGUgbG9jYWwgY291bnQgaXMgZ3JlYXRlciB0aGFuIHRoZSByZXR1cm5lZCBjb3VudCxcbiAgIHdlIHN0b3JlIHRoZSBsb2NhbCBjb3VudCArIHRoZSByZXR1cm5lZCBjb3VudC5cbiAgIE90aGVyd2lzZSwgc3RvcmUgdGhlIHJldHVybmVkIGNvdW50LlxuKi9cblxuZXhwb3J0IGRlZmF1bHQgKHQsIGNvdW50KSA9PiB7XG4gIGNvbnN0IGlzQXJyID0gdC50eXBlLmluZGV4T2YoJywnKSA+IC0xO1xuICBjb25zdCBsb2NhbCA9IE51bWJlcih0LnN0b3JlR2V0KGAke3QudHlwZX0tJHt0LnNoYXJlZH1gKSk7XG5cbiAgaWYgKGxvY2FsID4gY291bnQgJiYgIWlzQXJyKSB7XG4gICAgY29uc3QgbGF0ZXN0Q291bnQgPSBOdW1iZXIodC5zdG9yZUdldChgJHt0LnR5cGV9LSR7dC5zaGFyZWR9LWxhdGVzdENvdW50YCkpO1xuICAgIHQuc3RvcmVTZXQoYCR7dC50eXBlfS0ke3Quc2hhcmVkfS1sYXRlc3RDb3VudGAsIGNvdW50KTtcblxuICAgIGNvdW50ID0gaXNOdW1lcmljKGxhdGVzdENvdW50KSAmJiBsYXRlc3RDb3VudCA+IDAgP1xuICAgICAgY291bnQgKz0gbG9jYWwgLSBsYXRlc3RDb3VudCA6XG4gICAgICBjb3VudCArPSBsb2NhbDtcbiAgfVxuXG4gIGlmICghaXNBcnIpIHQuc3RvcmVTZXQoYCR7dC50eXBlfS0ke3Quc2hhcmVkfWAsIGNvdW50KTtcbiAgcmV0dXJuIGNvdW50O1xufTtcblxuZnVuY3Rpb24gaXNOdW1lcmljKG4pIHtcbiAgcmV0dXJuICFpc05hTihwYXJzZUZsb2F0KG4pKSAmJiBpc0Zpbml0ZShuKTtcbn1cbiIsImV4cG9ydCBkZWZhdWx0ICgpID0+IHtcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIHJlcXVpcmUoJy4vbGliL2luaXQnKSh7XG4gICAgYXBpOiAnc2hhcmUnLFxuICAgIHNlbGVjdG9yOiAnW2RhdGEtb3Blbi1zaGFyZV06bm90KFtkYXRhLW9wZW4tc2hhcmUtbm9kZV0pJyxcbiAgICBjYjogcmVxdWlyZSgnLi9saWIvaW5pdGlhbGl6ZVNoYXJlTm9kZScpLFxuICB9KSk7XG5cbiAgcmV0dXJuIHJlcXVpcmUoJy4vc3JjL21vZHVsZXMvc2hhcmUtYXBpJykoKTtcbn07XG4iLCIvKipcbiAqIGNvdW50IEFQSVxuICovXG5cbmltcG9ydCBjb3VudCBmcm9tICcuL2NvdW50JztcblxuZXhwb3J0IGRlZmF1bHQgKCkgPT4geyAvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgLy8gZ2xvYmFsIE9wZW5TaGFyZSByZWZlcmVuY2luZyBpbnRlcm5hbCBjbGFzcyBmb3IgaW5zdGFuY2UgZ2VuZXJhdGlvblxuICBjbGFzcyBDb3VudCB7XG5cbiAgICBjb25zdHJ1Y3Rvcih7XG4gICAgICB0eXBlLFxuICAgICAgdXJsLFxuICAgICAgYXBwZW5kVG8gPSBmYWxzZSxcbiAgICAgIGVsZW1lbnQsXG4gICAgICBjbGFzc2VzLFxuICAgICAga2V5ID0gbnVsbCxcbiAgICB9LCBjYikge1xuICAgICAgY29uc3QgY291bnROb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChlbGVtZW50IHx8ICdzcGFuJyk7XG5cbiAgICAgIGNvdW50Tm9kZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudCcsIHR5cGUpO1xuICAgICAgY291bnROb2RlLnNldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50LXVybCcsIHVybCk7XG4gICAgICBpZiAoa2V5KSBjb3VudE5vZGUuc2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUta2V5Jywga2V5KTtcblxuICAgICAgY291bnROb2RlLmNsYXNzTGlzdC5hZGQoJ29wZW4tc2hhcmUtY291bnQnKTtcblxuICAgICAgaWYgKGNsYXNzZXMgJiYgQXJyYXkuaXNBcnJheShjbGFzc2VzKSkge1xuICAgICAgICBjbGFzc2VzLmZvckVhY2goKGNzc0NMYXNzKSA9PiB7XG4gICAgICAgICAgY291bnROb2RlLmNsYXNzTGlzdC5hZGQoY3NzQ0xhc3MpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKGFwcGVuZFRvKSB7XG4gICAgICAgIHJldHVybiBuZXcgY291bnQodHlwZSwgdXJsKS5jb3VudChjb3VudE5vZGUsIGNiLCBhcHBlbmRUbyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXcgY291bnQodHlwZSwgdXJsKS5jb3VudChjb3VudE5vZGUsIGNiKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gQ291bnQ7XG59O1xuIiwiaW1wb3J0IGNvdW50UmVkdWNlIGZyb20gJy4uLy4uL2xpYi9jb3VudFJlZHVjZSc7XG5pbXBvcnQgc3RvcmVDb3VudCBmcm9tICcuLi8uLi9saWIvc3RvcmVDb3VudCc7XG4vKipcbiAqIE9iamVjdCBvZiB0cmFuc2Zvcm0gZnVuY3Rpb25zIGZvciBlYWNoIG9wZW5zaGFyZSBhcGlcbiAqIFRyYW5zZm9ybSBmdW5jdGlvbnMgcGFzc2VkIGludG8gT3BlblNoYXJlIGluc3RhbmNlIHdoZW4gaW5zdGFudGlhdGVkXG4gKiBSZXR1cm4gb2JqZWN0IGNvbnRhaW5pbmcgVVJMIGFuZCBrZXkvdmFsdWUgYXJnc1xuICovXG5leHBvcnQgZGVmYXVsdCB7XG5cbiAgLy8gZmFjZWJvb2sgY291bnQgZGF0YVxuICBmYWNlYm9vayh1cmwpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ2dldCcsXG4gICAgICB1cmw6IGBodHRwczovL2dyYXBoLmZhY2Vib29rLmNvbS8/aWQ9JHt1cmx9YCxcbiAgICAgIHRyYW5zZm9ybSh4aHIpIHtcbiAgICAgICAgY29uc3QgZmIgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpO1xuXG4gICAgICAgIGNvbnN0IGNvdW50ID0gZmIuc2hhcmUgJiYgZmIuc2hhcmUuc2hhcmVfY291bnQgfHwgMDtcblxuICAgICAgICByZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBjb3VudCk7XG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbi8vIHBpbnRlcmVzdCBjb3VudCBkYXRhXG4gIHBpbnRlcmVzdCh1cmwpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ2pzb25wJyxcbiAgICAgIHVybDogYGh0dHBzOi8vYXBpLnBpbnRlcmVzdC5jb20vdjEvdXJscy9jb3VudC5qc29uP2NhbGxiYWNrPT8mdXJsPSR7dXJsfWAsXG4gICAgICB0cmFuc2Zvcm0oZGF0YSkge1xuICAgICAgICBjb25zdCBjb3VudCA9IGRhdGEuY291bnQ7XG4gICAgICAgIHJldHVybiBzdG9yZUNvdW50KHRoaXMsIGNvdW50KTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBsaW5rZWRpbiBjb3VudCBkYXRhXG4gIGxpbmtlZGluKHVybCkge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiAnanNvbnAnLFxuICAgICAgdXJsOiBgaHR0cHM6Ly93d3cubGlua2VkaW4uY29tL2NvdW50c2Vydi9jb3VudC9zaGFyZT91cmw9JHt1cmx9JmZvcm1hdD1qc29ucCZjYWxsYmFjaz0/YCxcbiAgICAgIHRyYW5zZm9ybShkYXRhKSB7XG4gICAgICAgIGNvbnN0IGNvdW50ID0gZGF0YS5jb3VudDtcbiAgICAgICAgcmV0dXJuIHN0b3JlQ291bnQodGhpcywgY291bnQpO1xuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHJlZGRpdCBjb3VudCBkYXRhXG4gIHJlZGRpdCh1cmwpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ2dldCcsXG4gICAgICB1cmw6IGBodHRwczovL3d3dy5yZWRkaXQuY29tL2FwaS9pbmZvLmpzb24/dXJsPSR7dXJsfWAsXG4gICAgICB0cmFuc2Zvcm0oeGhyKSB7XG4gICAgICAgIGNvbnN0IHBvc3RzID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KS5kYXRhLmNoaWxkcmVuO1xuICAgICAgICBsZXQgdXBzID0gMDtcblxuICAgICAgICBwb3N0cy5mb3JFYWNoKChwb3N0KSA9PiB7XG4gICAgICAgICAgdXBzICs9IE51bWJlcihwb3N0LmRhdGEudXBzKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHN0b3JlQ291bnQodGhpcywgdXBzKTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuLy8gZ29vZ2xlIGNvdW50IGRhdGFcbiAgZ29vZ2xlKHVybCkge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiAncG9zdCcsXG4gICAgICBkYXRhOiB7XG4gICAgICAgIG1ldGhvZDogJ3Bvcy5wbHVzb25lcy5nZXQnLFxuICAgICAgICBpZDogJ3AnLFxuICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICBub2xvZzogdHJ1ZSxcbiAgICAgICAgICBpZDogdXJsLFxuICAgICAgICAgIHNvdXJjZTogJ3dpZGdldCcsXG4gICAgICAgICAgdXNlcklkOiAnQHZpZXdlcicsXG4gICAgICAgICAgZ3JvdXBJZDogJ0BzZWxmJyxcbiAgICAgICAgfSxcbiAgICAgICAganNvbnJwYzogJzIuMCcsXG4gICAgICAgIGtleTogJ3AnLFxuICAgICAgICBhcGlWZXJzaW9uOiAndjEnLFxuICAgICAgfSxcbiAgICAgIHVybDogJ2h0dHBzOi8vY2xpZW50czYuZ29vZ2xlLmNvbS9ycGMnLFxuICAgICAgdHJhbnNmb3JtKHhocikge1xuICAgICAgICBjb25zdCBjb3VudCA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCkucmVzdWx0Lm1ldGFkYXRhLmdsb2JhbENvdW50cy5jb3VudDtcbiAgICAgICAgcmV0dXJuIHN0b3JlQ291bnQodGhpcywgY291bnQpO1xuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIGdpdGh1YiBzdGFyIGNvdW50XG4gIGdpdGh1YlN0YXJzKHJlcG8pIHtcbiAgICByZXBvID0gcmVwby5pbmRleE9mKCdnaXRodWIuY29tLycpID4gLTEgP1xuICAgIHJlcG8uc3BsaXQoJ2dpdGh1Yi5jb20vJylbMV0gOlxuICAgIHJlcG87XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6ICdnZXQnLFxuICAgICAgdXJsOiBgaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9yZXBvcy8ke3JlcG99YCxcbiAgICAgIHRyYW5zZm9ybSh4aHIpIHtcbiAgICAgICAgY29uc3QgY291bnQgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpLnN0YXJnYXplcnNfY291bnQ7XG4gICAgICAgIHJldHVybiBzdG9yZUNvdW50KHRoaXMsIGNvdW50KTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBnaXRodWIgZm9ya3MgY291bnRcbiAgZ2l0aHViRm9ya3MocmVwbykge1xuICAgIHJlcG8gPSByZXBvLmluZGV4T2YoJ2dpdGh1Yi5jb20vJykgPiAtMSA/XG4gICAgcmVwby5zcGxpdCgnZ2l0aHViLmNvbS8nKVsxXSA6XG4gICAgcmVwbztcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ2dldCcsXG4gICAgICB1cmw6IGBodHRwczovL2FwaS5naXRodWIuY29tL3JlcG9zLyR7cmVwb31gLFxuICAgICAgdHJhbnNmb3JtKHhocikge1xuICAgICAgICBjb25zdCBjb3VudCA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCkuZm9ya3NfY291bnQ7XG4gICAgICAgIHJldHVybiBzdG9yZUNvdW50KHRoaXMsIGNvdW50KTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBnaXRodWIgd2F0Y2hlcnMgY291bnRcbiAgZ2l0aHViV2F0Y2hlcnMocmVwbykge1xuICAgIHJlcG8gPSByZXBvLmluZGV4T2YoJ2dpdGh1Yi5jb20vJykgPiAtMSA/XG4gICAgcmVwby5zcGxpdCgnZ2l0aHViLmNvbS8nKVsxXSA6XG4gICAgcmVwbztcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ2dldCcsXG4gICAgICB1cmw6IGBodHRwczovL2FwaS5naXRodWIuY29tL3JlcG9zLyR7cmVwb31gLFxuICAgICAgdHJhbnNmb3JtKHhocikge1xuICAgICAgICBjb25zdCBjb3VudCA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCkud2F0Y2hlcnNfY291bnQ7XG4gICAgICAgIHJldHVybiBzdG9yZUNvdW50KHRoaXMsIGNvdW50KTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBkcmliYmJsZSBsaWtlcyBjb3VudFxuICBkcmliYmJsZShzaG90KSB7XG4gICAgc2hvdCA9IHNob3QuaW5kZXhPZignZHJpYmJibGUuY29tL3Nob3RzJykgPiAtMSA/XG4gICAgc2hvdC5zcGxpdCgnc2hvdHMvJylbMV0gOlxuICAgIHNob3Q7XG4gICAgY29uc3QgdXJsID0gYGh0dHBzOi8vYXBpLmRyaWJiYmxlLmNvbS92MS9zaG90cy8ke3Nob3R9L2xpa2VzYDtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ2dldCcsXG4gICAgICB1cmwsXG4gICAgICB0cmFuc2Zvcm0oeGhyLCBFdmVudHMpIHtcbiAgICAgICAgY29uc3QgY291bnQgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpLmxlbmd0aDtcblxuICAgICAgICAvLyBhdCB0aGlzIHRpbWUgZHJpYmJibGUgbGltaXRzIGEgcmVzcG9uc2Ugb2YgMTIgbGlrZXMgcGVyIHBhZ2VcbiAgICAgICAgaWYgKGNvdW50ID09PSAxMikge1xuICAgICAgICAgIGNvbnN0IHBhZ2UgPSAyO1xuICAgICAgICAgIHJlY3Vyc2l2ZUNvdW50KHVybCwgcGFnZSwgY291bnQsIChmaW5hbENvdW50KSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5hcHBlbmRUbyAmJiB0eXBlb2YgdGhpcy5hcHBlbmRUbyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICB0aGlzLmFwcGVuZFRvLmFwcGVuZENoaWxkKHRoaXMub3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY291bnRSZWR1Y2UodGhpcy5vcywgZmluYWxDb3VudCwgdGhpcy5jYik7XG4gICAgICAgICAgICBFdmVudHMudHJpZ2dlcih0aGlzLm9zLCBgY291bnRlZC0ke3RoaXMudXJsfWApO1xuICAgICAgICAgICAgcmV0dXJuIHN0b3JlQ291bnQodGhpcywgZmluYWxDb3VudCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHN0b3JlQ291bnQodGhpcywgY291bnQpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgdHdpdHRlcih1cmwpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ2dldCcsXG4gICAgICB1cmw6IGBodHRwczovL2FwaS5vcGVuc2hhcmUuc29jaWFsL2pvYj91cmw9JHt1cmx9JmtleT1gLFxuICAgICAgdHJhbnNmb3JtKHhocikge1xuICAgICAgICBjb25zdCBjb3VudCA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCkuY291bnQ7XG4gICAgICAgIHJldHVybiBzdG9yZUNvdW50KHRoaXMsIGNvdW50KTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcbn07XG5cbmZ1bmN0aW9uIHJlY3Vyc2l2ZUNvdW50KHVybCwgcGFnZSwgY291bnQsIGNiKSB7XG4gIGNvbnN0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICB4aHIub3BlbignR0VUJywgYCR7dXJsfT9wYWdlPSR7cGFnZX1gKTtcbiAgeGhyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7IC8vZXNsaW50LWRpc2FibGUtbGluZVxuICAgIGNvbnN0IGxpa2VzID0gSlNPTi5wYXJzZSh0aGlzLnJlc3BvbnNlKTtcbiAgICBjb3VudCArPSBsaWtlcy5sZW5ndGg7XG5cbiAgICAvLyBkcmliYmJsZSBsaWtlIHBlciBwYWdlIGlzIDEyXG4gICAgaWYgKGxpa2VzLmxlbmd0aCA9PT0gMTIpIHtcbiAgICAgIHBhZ2UrKztcbiAgICAgIHJlY3Vyc2l2ZUNvdW50KHVybCwgcGFnZSwgY291bnQsIGNiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2IoY291bnQpO1xuICAgIH1cbiAgfSk7XG4gIHhoci5zZW5kKCk7XG59XG4iLCIvKipcbiAqIEdlbmVyYXRlIHNoYXJlIGNvdW50IGluc3RhbmNlIGZyb20gb25lIHRvIG1hbnkgbmV0d29ya3NcbiAqL1xuXG5pbXBvcnQgQ291bnRUcmFuc2Zvcm1zIGZyb20gJy4vY291bnQtdHJhbnNmb3Jtcyc7XG5pbXBvcnQgRXZlbnRzIGZyb20gJy4vZXZlbnRzJztcbmltcG9ydCBjb3VudFJlZHVjZSBmcm9tICcuLi8uLi9saWIvY291bnRSZWR1Y2UnO1xuaW1wb3J0IHN0b3JlQ291bnQgZnJvbSAnLi4vLi4vbGliL3N0b3JlQ291bnQnOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG5cbmZ1bmN0aW9uIGlzTnVtZXJpYyhuKSB7XG4gIHJldHVybiAhaXNOYU4ocGFyc2VGbG9hdChuKSkgJiYgaXNGaW5pdGUobik7XG59XG5cbmNsYXNzIENvdW50IHtcbiAgY29uc3RydWN0b3IodHlwZSwgdXJsKSB7XG4gICAgLy8gdGhyb3cgZXJyb3IgaWYgbm8gdXJsIHByb3ZpZGVkXG4gICAgaWYgKCF1cmwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignT3BlbiBTaGFyZTogbm8gdXJsIHByb3ZpZGVkIGZvciBjb3VudCcpO1xuICAgIH1cblxuICAgIC8vIGNoZWNrIGZvciBHaXRodWIgY291bnRzXG4gICAgaWYgKHR5cGUuaW5kZXhPZignZ2l0aHViJykgPT09IDApIHtcbiAgICAgIGlmICh0eXBlID09PSAnZ2l0aHViLXN0YXJzJykge1xuICAgICAgICB0eXBlID0gJ2dpdGh1YlN0YXJzJztcbiAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ2dpdGh1Yi1mb3JrcycpIHtcbiAgICAgICAgdHlwZSA9ICdnaXRodWJGb3Jrcyc7XG4gICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdnaXRodWItd2F0Y2hlcnMnKSB7XG4gICAgICAgIHR5cGUgPSAnZ2l0aHViV2F0Y2hlcnMnO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignSW52YWxpZCBHaXRodWIgY291bnQgdHlwZS4gVHJ5IGdpdGh1Yi1zdGFycywgZ2l0aHViLWZvcmtzLCBvciBnaXRodWItd2F0Y2hlcnMuJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gaWYgdHlwZSBpcyBjb21tYSBzZXBhcmF0ZSBsaXN0IGNyZWF0ZSBhcnJheVxuICAgIGlmICh0eXBlLmluZGV4T2YoJywnKSA+IC0xKSB7XG4gICAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgICAgdGhpcy50eXBlQXJyID0gdGhpcy50eXBlLnNwbGl0KCcsJyk7XG4gICAgICB0aGlzLmNvdW50RGF0YSA9IFtdO1xuXG4gICAgICAvLyBjaGVjayBlYWNoIHR5cGUgc3VwcGxpZWQgaXMgdmFsaWRcbiAgICAgIHRoaXMudHlwZUFyci5mb3JFYWNoKCh0KSA9PiB7XG4gICAgICAgIGlmICghQ291bnRUcmFuc2Zvcm1zW3RdKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBPcGVuIFNoYXJlOiAke3R5cGV9IGlzIGFuIGludmFsaWQgY291bnQgdHlwZWApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb3VudERhdGEucHVzaChDb3VudFRyYW5zZm9ybXNbdF0odXJsKSk7XG4gICAgICB9KTtcblxuICAgICAgLy8gdGhyb3cgZXJyb3IgaWYgaW52YWxpZCB0eXBlIHByb3ZpZGVkXG4gICAgfSBlbHNlIGlmICghQ291bnRUcmFuc2Zvcm1zW3R5cGVdKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYE9wZW4gU2hhcmU6ICR7dHlwZX0gaXMgYW4gaW52YWxpZCBjb3VudCB0eXBlYCk7XG5cbiAgICAgICAgLy8gc2luZ2xlIGNvdW50XG4gICAgICAgIC8vIHN0b3JlIGNvdW50IFVSTCBhbmQgdHJhbnNmb3JtIGZ1bmN0aW9uXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgICB0aGlzLmNvdW50RGF0YSA9IENvdW50VHJhbnNmb3Jtc1t0eXBlXSh1cmwpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGhhbmRsZSBjYWxsaW5nIGdldENvdW50IC8gZ2V0Q291bnRzXG4gIC8vIGRlcGVuZGluZyBvbiBudW1iZXIgb2YgdHlwZXNcbiAgY291bnQob3MsIGNiLCBhcHBlbmRUbykge1xuICAgIHRoaXMub3MgPSBvcztcbiAgICB0aGlzLmFwcGVuZFRvID0gYXBwZW5kVG87XG4gICAgdGhpcy5jYiA9IGNiO1xuICAgIHRoaXMudXJsID0gdGhpcy5vcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudCcpO1xuICAgIHRoaXMuc2hhcmVkID0gdGhpcy5vcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudC11cmwnKTtcbiAgICB0aGlzLmtleSA9IHRoaXMub3MuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUta2V5Jyk7XG5cbiAgICBpZiAoIUFycmF5LmlzQXJyYXkodGhpcy5jb3VudERhdGEpKSB7XG4gICAgICB0aGlzLmdldENvdW50KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZ2V0Q291bnRzKCk7XG4gICAgfVxuICB9XG5cbiAgLy8gZmV0Y2ggY291bnQgZWl0aGVyIEFKQVggb3IgSlNPTlBcbiAgZ2V0Q291bnQoKSB7XG4gICAgY29uc3QgY291bnQgPSB0aGlzLnN0b3JlR2V0KGAke3RoaXMudHlwZX0tJHt0aGlzLnNoYXJlZH1gKTtcblxuICAgIGlmIChjb3VudCkge1xuICAgICAgaWYgKHRoaXMuYXBwZW5kVG8gJiYgdHlwZW9mIHRoaXMuYXBwZW5kVG8gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhpcy5hcHBlbmRUby5hcHBlbmRDaGlsZCh0aGlzLm9zKTtcbiAgICAgIH1cbiAgICAgIGNvdW50UmVkdWNlKHRoaXMub3MsIGNvdW50KTtcbiAgICB9XG4gICAgdGhpc1t0aGlzLmNvdW50RGF0YS50eXBlXSh0aGlzLmNvdW50RGF0YSk7XG4gIH1cblxuICAvLyBmZXRjaCBtdWx0aXBsZSBjb3VudHMgYW5kIGFnZ3JlZ2F0ZVxuICBnZXRDb3VudHMoKSB7XG4gICAgdGhpcy50b3RhbCA9IFtdO1xuXG4gICAgY29uc3QgY291bnQgPSB0aGlzLnN0b3JlR2V0KGAke3RoaXMudHlwZX0tJHt0aGlzLnNoYXJlZH1gKTtcblxuICAgIGlmIChjb3VudCkge1xuICAgICAgaWYgKHRoaXMuYXBwZW5kVG8gJiYgdHlwZW9mIHRoaXMuYXBwZW5kVG8gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhpcy5hcHBlbmRUby5hcHBlbmRDaGlsZCh0aGlzLm9zKTtcbiAgICAgIH1cbiAgICAgIGNvdW50UmVkdWNlKHRoaXMub3MsIGNvdW50KTtcbiAgICB9XG5cbiAgICB0aGlzLmNvdW50RGF0YS5mb3JFYWNoKChjb3VudERhdGEpID0+IHtcbiAgICAgIHRoaXNbY291bnREYXRhLnR5cGVdKGNvdW50RGF0YSwgKG51bSkgPT4ge1xuICAgICAgICB0aGlzLnRvdGFsLnB1c2gobnVtKTtcblxuICAgICAgICAvLyB0b3RhbCBjb3VudHMgbGVuZ3RoIG5vdyBlcXVhbHMgdHlwZSBhcnJheSBsZW5ndGhcbiAgICAgICAgLy8gc28gYWdncmVnYXRlLCBzdG9yZSBhbmQgaW5zZXJ0IGludG8gRE9NXG4gICAgICAgIGlmICh0aGlzLnRvdGFsLmxlbmd0aCA9PT0gdGhpcy50eXBlQXJyLmxlbmd0aCkge1xuICAgICAgICAgIGxldCB0b3QgPSAwO1xuXG4gICAgICAgICAgdGhpcy50b3RhbC5mb3JFYWNoKCh0KSA9PiB7XG4gICAgICAgICAgICB0b3QgKz0gdDtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGlmICh0aGlzLmFwcGVuZFRvICYmIHR5cGVvZiB0aGlzLmFwcGVuZFRvICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aGlzLmFwcGVuZFRvLmFwcGVuZENoaWxkKHRoaXMub3MpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IGxvY2FsID0gTnVtYmVyKHRoaXMuc3RvcmVHZXQoYCR7dGhpcy50eXBlfS0ke3RoaXMuc2hhcmVkfWApKTtcbiAgICAgICAgICBpZiAobG9jYWwgPiB0b3QpIHtcbiAgICAgICAgICAgIGNvbnN0IGxhdGVzdENvdW50ID0gTnVtYmVyKHRoaXMuc3RvcmVHZXQoYCR7dGhpcy50eXBlfS0ke3RoaXMuc2hhcmVkfS1sYXRlc3RDb3VudGApKTtcbiAgICAgICAgICAgIHRoaXMuc3RvcmVTZXQoYCR7dGhpcy50eXBlfS0ke3RoaXMuc2hhcmVkfS1sYXRlc3RDb3VudGAsIHRvdCk7XG5cbiAgICAgICAgICAgIHRvdCA9IGlzTnVtZXJpYyhsYXRlc3RDb3VudCkgJiYgbGF0ZXN0Q291bnQgPiAwID9cbiAgICAgICAgICAgIHRvdCArPSBsb2NhbCAtIGxhdGVzdENvdW50IDpcbiAgICAgICAgICAgIHRvdCArPSBsb2NhbDtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5zdG9yZVNldChgJHt0aGlzLnR5cGV9LSR7dGhpcy5zaGFyZWR9YCwgdG90KTtcblxuICAgICAgICAgIGNvdW50UmVkdWNlKHRoaXMub3MsIHRvdCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaWYgKHRoaXMuYXBwZW5kVG8gJiYgdHlwZW9mIHRoaXMuYXBwZW5kVG8gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRoaXMuYXBwZW5kVG8uYXBwZW5kQ2hpbGQodGhpcy5vcyk7XG4gICAgfVxuICB9XG5cbiAgLy8gaGFuZGxlIEpTT05QIHJlcXVlc3RzXG4gIGpzb25wKGNvdW50RGF0YSwgY2IpIHtcbiAgLy8gZGVmaW5lIHJhbmRvbSBjYWxsYmFjayBhbmQgYXNzaWduIHRyYW5zZm9ybSBmdW5jdGlvblxuICAgIGNvbnN0IGNhbGxiYWNrID0gTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyaW5nKDcpLnJlcGxhY2UoL1teYS16QS1aXS9nLCAnJyk7XG4gICAgd2luZG93W2NhbGxiYWNrXSA9IChkYXRhKSA9PiB7XG4gICAgICBjb25zdCBjb3VudCA9IGNvdW50RGF0YS50cmFuc2Zvcm0uYXBwbHkodGhpcywgW2RhdGFdKSB8fCAwO1xuXG4gICAgICBpZiAoY2IgJiYgdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGNiKGNvdW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0aGlzLmFwcGVuZFRvICYmIHR5cGVvZiB0aGlzLmFwcGVuZFRvICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgdGhpcy5hcHBlbmRUby5hcHBlbmRDaGlsZCh0aGlzLm9zKTtcbiAgICAgICAgfVxuICAgICAgICBjb3VudFJlZHVjZSh0aGlzLm9zLCBjb3VudCwgdGhpcy5jYik7XG4gICAgICB9XG5cbiAgICAgIEV2ZW50cy50cmlnZ2VyKHRoaXMub3MsIGBjb3VudGVkLSR7dGhpcy51cmx9YCk7XG4gICAgfTtcblxuICAgIC8vIGFwcGVuZCBKU09OUCBzY3JpcHQgdGFnIHRvIHBhZ2VcbiAgICBjb25zdCBzY3JpcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICBzY3JpcHQuc3JjID0gY291bnREYXRhLnVybC5yZXBsYWNlKCdjYWxsYmFjaz0/JywgYGNhbGxiYWNrPSR7Y2FsbGJhY2t9YCk7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXS5hcHBlbmRDaGlsZChzY3JpcHQpO1xuXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gaGFuZGxlIEFKQVggR0VUIHJlcXVlc3RcbiAgZ2V0KGNvdW50RGF0YSwgY2IpIHtcbiAgICBjb25zdCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgIC8vIG9uIHN1Y2Nlc3MgcGFzcyByZXNwb25zZSB0byB0cmFuc2Zvcm0gZnVuY3Rpb25cbiAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gKCkgPT4ge1xuICAgICAgaWYgKHhoci5yZWFkeVN0YXRlID09PSA0KSB7XG4gICAgICAgIGlmICh4aHIuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICBjb25zdCBjb3VudCA9IGNvdW50RGF0YS50cmFuc2Zvcm0uYXBwbHkodGhpcywgW3hociwgRXZlbnRzXSkgfHwgMDtcblxuICAgICAgICAgIGlmIChjYiAmJiB0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNiKGNvdW50KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHRoaXMuYXBwZW5kVG8gJiYgdHlwZW9mIHRoaXMuYXBwZW5kVG8gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgdGhpcy5hcHBlbmRUby5hcHBlbmRDaGlsZCh0aGlzLm9zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvdW50UmVkdWNlKHRoaXMub3MsIGNvdW50LCB0aGlzLmNiKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBFdmVudHMudHJpZ2dlcih0aGlzLm9zLCBgY291bnRlZC0ke3RoaXMudXJsfWApO1xuICAgICAgICB9IGVsc2UgaWYgKGNvdW50RGF0YS51cmwudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdodHRwczovL2FwaS5vcGVuc2hhcmUuc29jaWFsL2pvYj8nKSA9PT0gMCkge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1BsZWFzZSBzaWduIHVwIGZvciBUd2l0dGVyIGNvdW50cyBhdCBodHRwczovL29wZW5zaGFyZS5zb2NpYWwvdHdpdHRlci9hdXRoJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIGdldCBBUEkgZGF0YSBmcm9tJywgY291bnREYXRhLnVybCwgJy4gUGxlYXNlIHVzZSB0aGUgbGF0ZXN0IHZlcnNpb24gb2YgT3BlblNoYXJlLicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuICAgIGNvdW50RGF0YS51cmwgPSBjb3VudERhdGEudXJsLnN0YXJ0c1dpdGgoJ2h0dHBzOi8vYXBpLm9wZW5zaGFyZS5zb2NpYWwvam9iPycpICYmIHRoaXMua2V5ID9cbiAgICAgIGNvdW50RGF0YS51cmwgKyB0aGlzLmtleSA6XG4gICAgICBjb3VudERhdGEudXJsO1xuXG4gICAgeGhyLm9wZW4oJ0dFVCcsIGNvdW50RGF0YS51cmwpO1xuICAgIHhoci5zZW5kKCk7XG4gIH1cblxuICAvLyBoYW5kbGUgQUpBWCBQT1NUIHJlcXVlc3RcbiAgcG9zdChjb3VudERhdGEsIGNiKSB7XG4gICAgY29uc3QgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICAvLyBvbiBzdWNjZXNzIHBhc3MgcmVzcG9uc2UgdG8gdHJhbnNmb3JtIGZ1bmN0aW9uXG4gICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9ICgpID0+IHtcbiAgICAgIGlmICh4aHIucmVhZHlTdGF0ZSAhPT0gWE1MSHR0cFJlcXVlc3QuRE9ORSB8fFxuICAgICAgICB4aHIuc3RhdHVzICE9PSAyMDApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBjb3VudCA9IGNvdW50RGF0YS50cmFuc2Zvcm0uYXBwbHkodGhpcywgW3hocl0pIHx8IDA7XG5cbiAgICAgIGlmIChjYiAmJiB0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgY2IoY291bnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRoaXMuYXBwZW5kVG8gJiYgdHlwZW9mIHRoaXMuYXBwZW5kVG8gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICB0aGlzLmFwcGVuZFRvLmFwcGVuZENoaWxkKHRoaXMub3MpO1xuICAgICAgICB9XG4gICAgICAgIGNvdW50UmVkdWNlKHRoaXMub3MsIGNvdW50LCB0aGlzLmNiKTtcbiAgICAgIH1cbiAgICAgIEV2ZW50cy50cmlnZ2VyKHRoaXMub3MsIGBjb3VudGVkLSR7dGhpcy51cmx9YCk7XG4gICAgfTtcblxuICAgIHhoci5vcGVuKCdQT1NUJywgY291bnREYXRhLnVybCk7XG4gICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ9VVRGLTgnKTtcbiAgICB4aHIuc2VuZChKU09OLnN0cmluZ2lmeShjb3VudERhdGEuZGF0YSkpO1xuICB9XG5cbiAgc3RvcmVTZXQodHlwZSwgY291bnQgPSAwKSB7Ly9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgaWYgKCF3aW5kb3cubG9jYWxTdG9yYWdlIHx8ICF0eXBlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oYE9wZW5TaGFyZS0ke3R5cGV9YCwgY291bnQpO1xuICB9XG5cbiAgc3RvcmVHZXQodHlwZSkgey8vZXNsaW50LWRpc2FibGUtbGluZVxuICAgIGlmICghd2luZG93LmxvY2FsU3RvcmFnZSB8fCAhdHlwZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHJldHVybiBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShgT3BlblNoYXJlLSR7dHlwZX1gKTtcbiAgfVxuXG59XG5cbmV4cG9ydCBkZWZhdWx0IENvdW50O1xuIiwiLyoqXG4gKiBUcmlnZ2VyIGN1c3RvbSBPcGVuU2hhcmUgbmFtZXNwYWNlZCBldmVudFxuICovXG5leHBvcnQgZGVmYXVsdCB7XG4gIHRyaWdnZXIoZWxlbWVudCwgZXZlbnQpIHtcbiAgICBjb25zdCBldiA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdFdmVudCcpO1xuICAgIGV2LmluaXRFdmVudChgT3BlblNoYXJlLiR7ZXZlbnR9YCwgdHJ1ZSwgdHJ1ZSk7XG4gICAgZWxlbWVudC5kaXNwYXRjaEV2ZW50KGV2KTtcbiAgfSxcbn07XG4iLCIvKipcbiAqIE9wZW5TaGFyZSBnZW5lcmF0ZXMgYSBzaW5nbGUgc2hhcmUgbGlua1xuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBPcGVuU2hhcmUge1xuXG4gIGNvbnN0cnVjdG9yKHR5cGUsIHRyYW5zZm9ybSkge1xuICAgIHRoaXMuaW9zID0gL2lQYWR8aVBob25lfGlQb2QvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkgJiYgIXdpbmRvdy5NU1N0cmVhbTtcbiAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgIHRoaXMuZHluYW1pYyA9IGZhbHNlO1xuICAgIHRoaXMudHJhbnNmb3JtID0gdHJhbnNmb3JtO1xuXG4gICAgLy8gY2FwaXRhbGl6ZWQgdHlwZVxuICAgIHRoaXMudHlwZUNhcHMgPSB0eXBlLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgdHlwZS5zbGljZSgxKTtcbiAgfVxuXG4gIC8vIHJldHVybnMgZnVuY3Rpb24gbmFtZWQgYXMgdHlwZSBzZXQgaW4gY29uc3RydWN0b3JcbiAgLy8gZS5nIHR3aXR0ZXIoKVxuICBzZXREYXRhKGRhdGEpIHtcbiAgICAvLyBpZiBpT1MgdXNlciBhbmQgaW9zIGRhdGEgYXR0cmlidXRlIGRlZmluZWRcbiAgICAvLyBidWlsZCBpT1MgVVJMIHNjaGVtZSBhcyBzaW5nbGUgc3RyaW5nXG4gICAgaWYgKHRoaXMuaW9zKSB7XG4gICAgICB0aGlzLnRyYW5zZm9ybURhdGEgPSB0aGlzLnRyYW5zZm9ybShkYXRhLCB0cnVlKTtcbiAgICAgIHRoaXMubW9iaWxlU2hhcmVVcmwgPSB0aGlzLnRlbXBsYXRlKHRoaXMudHJhbnNmb3JtRGF0YS51cmwsIHRoaXMudHJhbnNmb3JtRGF0YS5kYXRhKTtcbiAgICB9XG5cbiAgICB0aGlzLnRyYW5zZm9ybURhdGEgPSB0aGlzLnRyYW5zZm9ybShkYXRhKTtcbiAgICB0aGlzLnNoYXJlVXJsID0gdGhpcy50ZW1wbGF0ZSh0aGlzLnRyYW5zZm9ybURhdGEudXJsLCB0aGlzLnRyYW5zZm9ybURhdGEuZGF0YSk7XG4gIH1cblxuICAvLyBvcGVuIHNoYXJlIFVSTCBkZWZpbmVkIGluIGluZGl2aWR1YWwgcGxhdGZvcm0gZnVuY3Rpb25zXG4gIHNoYXJlKCkge1xuICAgIC8vIGlmIGlPUyBzaGFyZSBVUkwgaGFzIGJlZW4gc2V0IHRoZW4gdXNlIHRpbWVvdXQgaGFja1xuICAgIC8vIHRlc3QgZm9yIG5hdGl2ZSBhcHAgYW5kIGZhbGwgYmFjayB0byB3ZWJcbiAgICBpZiAodGhpcy5tb2JpbGVTaGFyZVVybCkge1xuICAgICAgY29uc3Qgc3RhcnQgPSAobmV3IERhdGUoKSkudmFsdWVPZigpO1xuXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgY29uc3QgZW5kID0gKG5ldyBEYXRlKCkpLnZhbHVlT2YoKTtcblxuICAgICAgICAvLyBpZiB0aGUgdXNlciBpcyBzdGlsbCBoZXJlLCBmYWxsIGJhY2sgdG8gd2ViXG4gICAgICAgIGlmIChlbmQgLSBzdGFydCA+IDE2MDApIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB3aW5kb3cubG9jYXRpb24gPSB0aGlzLnNoYXJlVXJsO1xuICAgICAgfSwgMTUwMCk7XG5cbiAgICAgIHdpbmRvdy5sb2NhdGlvbiA9IHRoaXMubW9iaWxlU2hhcmVVcmw7XG5cbiAgICAgIC8vIG9wZW4gbWFpbHRvIGxpbmtzIGluIHNhbWUgd2luZG93XG4gICAgfSBlbHNlIGlmICh0aGlzLnR5cGUgPT09ICdlbWFpbCcpIHtcbiAgICAgIHdpbmRvdy5sb2NhdGlvbiA9IHRoaXMuc2hhcmVVcmw7XG5cbiAgICAgIC8vIG9wZW4gc29jaWFsIHNoYXJlIFVSTHMgaW4gbmV3IHdpbmRvd1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBpZiBwb3B1cCBvYmplY3QgcHJlc2VudCB0aGVuIHNldCB3aW5kb3cgZGltZW5zaW9ucyAvIHBvc2l0aW9uXG4gICAgICBpZiAodGhpcy5wb3B1cCAmJiB0aGlzLnRyYW5zZm9ybURhdGEucG9wdXApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3BlbldpbmRvdyh0aGlzLnNoYXJlVXJsLCB0aGlzLnRyYW5zZm9ybURhdGEucG9wdXApO1xuICAgICAgfVxuXG4gICAgICB3aW5kb3cub3Blbih0aGlzLnNoYXJlVXJsKTtcbiAgICB9XG4gIH1cblxuICAvLyBjcmVhdGUgc2hhcmUgVVJMIHdpdGggR0VUIHBhcmFtc1xuICAvLyBhcHBlbmRpbmcgdmFsaWQgcHJvcGVydGllcyB0byBxdWVyeSBzdHJpbmdcbiAgdGVtcGxhdGUodXJsLCBkYXRhKSB7Ly9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgY29uc3Qgbm9uVVJMUHJvcHMgPSBbXG4gICAgICAnYXBwZW5kVG8nLFxuICAgICAgJ2lubmVySFRNTCcsXG4gICAgICAnY2xhc3NlcycsXG4gICAgXTtcblxuICAgIGxldCBzaGFyZVVybCA9IHVybCxcbiAgICAgIGk7XG5cbiAgICBmb3IgKGkgaW4gZGF0YSkge1xuICAgICAgLy8gb25seSBhcHBlbmQgdmFsaWQgcHJvcGVydGllc1xuICAgICAgaWYgKCFkYXRhW2ldIHx8IG5vblVSTFByb3BzLmluZGV4T2YoaSkgPiAtMSkge1xuICAgICAgICBjb250aW51ZTsgLy9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgICB9XG5cbiAgICAgIC8vIGFwcGVuZCBVUkwgZW5jb2RlZCBHRVQgcGFyYW0gdG8gc2hhcmUgVVJMXG4gICAgICBkYXRhW2ldID0gZW5jb2RlVVJJQ29tcG9uZW50KGRhdGFbaV0pO1xuICAgICAgc2hhcmVVcmwgKz0gYCR7aX09JHtkYXRhW2ldfSZgO1xuICAgIH1cblxuICAgIHJldHVybiBzaGFyZVVybC5zdWJzdHIoMCwgc2hhcmVVcmwubGVuZ3RoIC0gMSk7XG4gIH1cblxuICAvLyBjZW50ZXIgcG9wdXAgd2luZG93IHN1cHBvcnRpbmcgZHVhbCBzY3JlZW5zXG4gIG9wZW5XaW5kb3codXJsLCBvcHRpb25zKSB7Ly9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgY29uc3QgZHVhbFNjcmVlbkxlZnQgPSB3aW5kb3cuc2NyZWVuTGVmdCAhPT0gdW5kZWZpbmVkID8gd2luZG93LnNjcmVlbkxlZnQgOiBzY3JlZW4ubGVmdCxcbiAgICAgIGR1YWxTY3JlZW5Ub3AgPSB3aW5kb3cuc2NyZWVuVG9wICE9PSB1bmRlZmluZWQgPyB3aW5kb3cuc2NyZWVuVG9wIDogc2NyZWVuLnRvcCxcbiAgICAgIHdpZHRoID0gd2luZG93LmlubmVyV2lkdGggPyB3aW5kb3cuaW5uZXJXaWR0aCA6IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aCA/IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aCA6IHNjcmVlbi53aWR0aCwvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgICAgIGhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodCA/IHdpbmRvdy5pbm5lckhlaWdodCA6IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQgPyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0IDogc2NyZWVuLmhlaWdodCwvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgICAgIGxlZnQgPSAoKHdpZHRoIC8gMikgLSAob3B0aW9ucy53aWR0aCAvIDIpKSArIGR1YWxTY3JlZW5MZWZ0LFxuICAgICAgdG9wID0gKChoZWlnaHQgLyAyKSAtIChvcHRpb25zLmhlaWdodCAvIDIpKSArIGR1YWxTY3JlZW5Ub3AsXG4gICAgICBuZXdXaW5kb3cgPSB3aW5kb3cub3Blbih1cmwsICdPcGVuU2hhcmUnLCBgd2lkdGg9JHtvcHRpb25zLndpZHRofSwgaGVpZ2h0PSR7b3B0aW9ucy5oZWlnaHR9LCB0b3A9JHt0b3B9LCBsZWZ0PSR7bGVmdH1gKTtcblxuICAgIC8vIFB1dHMgZm9jdXMgb24gdGhlIG5ld1dpbmRvd1xuICAgIGlmICh3aW5kb3cuZm9jdXMpIHtcbiAgICAgIG5ld1dpbmRvdy5mb2N1cygpO1xuICAgIH1cbiAgfVxufVxuIiwiLyoqXG4gKiBHbG9iYWwgT3BlblNoYXJlIEFQSSB0byBnZW5lcmF0ZSBpbnN0YW5jZXMgcHJvZ3JhbW1hdGljYWxseVxuICovXG5pbXBvcnQgT1MgZnJvbSAnLi9vcGVuLXNoYXJlJztcbmltcG9ydCBTaGFyZVRyYW5zZm9ybXMgZnJvbSAnLi9zaGFyZS10cmFuc2Zvcm1zJztcbmltcG9ydCBFdmVudHMgZnJvbSAnLi9ldmVudHMnO1xuaW1wb3J0IGRhc2hUb0NhbWVsIGZyb20gJy4uLy4uL2xpYi9kYXNoVG9DYW1lbCc7XG5cbmV4cG9ydCBkZWZhdWx0ICgpID0+IHtcbiAgLy8gZ2xvYmFsIE9wZW5TaGFyZSByZWZlcmVuY2luZyBpbnRlcm5hbCBjbGFzcyBmb3IgaW5zdGFuY2UgZ2VuZXJhdGlvblxuICBjbGFzcyBPcGVuU2hhcmUge1xuXG4gICAgY29uc3RydWN0b3IoZGF0YSwgZWxlbWVudCkge1xuICAgICAgaWYgKCFkYXRhLmJpbmRDbGljaykgZGF0YS5iaW5kQ2xpY2sgPSB0cnVlO1xuXG4gICAgICBjb25zdCBkYXNoID0gZGF0YS50eXBlLmluZGV4T2YoJy0nKTtcblxuICAgICAgaWYgKGRhc2ggPiAtMSkge1xuICAgICAgICBkYXRhLnR5cGUgPSBkYXNoVG9DYW1lbChkYXNoLCBkYXRhLnR5cGUpO1xuICAgICAgfVxuXG4gICAgICBsZXQgbm9kZTtcbiAgICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgICB0aGlzLmRhdGEgPSBkYXRhO1xuXG4gICAgICB0aGlzLm9zID0gbmV3IE9TKGRhdGEudHlwZSwgU2hhcmVUcmFuc2Zvcm1zW2RhdGEudHlwZV0pO1xuICAgICAgdGhpcy5vcy5zZXREYXRhKGRhdGEpO1xuXG4gICAgICBpZiAoIWVsZW1lbnQgfHwgZGF0YS5lbGVtZW50KSB7XG4gICAgICAgIGVsZW1lbnQgPSBkYXRhLmVsZW1lbnQ7XG4gICAgICAgIG5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGVsZW1lbnQgfHwgJ2EnKTtcbiAgICAgICAgaWYgKGRhdGEudHlwZSkge1xuICAgICAgICAgIG5vZGUuY2xhc3NMaXN0LmFkZCgnb3Blbi1zaGFyZS1saW5rJywgZGF0YS50eXBlKTtcbiAgICAgICAgICBub2RlLnNldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlJywgZGF0YS50eXBlKTtcbiAgICAgICAgICBub2RlLnNldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLW5vZGUnLCBkYXRhLnR5cGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkYXRhLmlubmVySFRNTCkgbm9kZS5pbm5lckhUTUwgPSBkYXRhLmlubmVySFRNTDtcbiAgICAgIH1cbiAgICAgIGlmIChub2RlKSBlbGVtZW50ID0gbm9kZTtcblxuICAgICAgaWYgKGRhdGEuYmluZENsaWNrKSB7XG4gICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5zaGFyZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKGRhdGEuYXBwZW5kVG8pIHtcbiAgICAgICAgZGF0YS5hcHBlbmRUby5hcHBlbmRDaGlsZChlbGVtZW50KTtcbiAgICAgIH1cblxuICAgICAgaWYgKGRhdGEuY2xhc3NlcyAmJiBBcnJheS5pc0FycmF5KGRhdGEuY2xhc3NlcykpIHtcbiAgICAgICAgZGF0YS5jbGFzc2VzLmZvckVhY2goKGNzc0NsYXNzKSA9PiB7XG4gICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKGNzc0NsYXNzKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChkYXRhLnR5cGUudG9Mb3dlckNhc2UoKSA9PT0gJ3BheXBhbCcpIHtcbiAgICAgICAgY29uc3QgYWN0aW9uID0gZGF0YS5zYW5kYm94ID9cbiAgICAgICAgJ2h0dHBzOi8vd3d3LnNhbmRib3gucGF5cGFsLmNvbS9jZ2ktYmluL3dlYnNjcicgOlxuICAgICAgICAnaHR0cHM6Ly93d3cucGF5cGFsLmNvbS9jZ2ktYmluL3dlYnNjcic7XG5cbiAgICAgICAgY29uc3QgYnV5R0lGID0gZGF0YS5zYW5kYm94ID9cbiAgICAgICAgJ2h0dHBzOi8vd3d3LnNhbmRib3gucGF5cGFsLmNvbS9lbl9VUy9pL2J0bi9idG5fYnV5bm93X0xHLmdpZicgOlxuICAgICAgICAnaHR0cHM6Ly93d3cucGF5cGFsb2JqZWN0cy5jb20vZW5fVVMvaS9idG4vYnRuX2J1eW5vd19MRy5naWYnO1xuXG4gICAgICAgIGNvbnN0IHBpeGVsR0lGID0gZGF0YS5zYW5kYm94ID9cbiAgICAgICAgJ2h0dHBzOi8vd3d3LnNhbmRib3gucGF5cGFsLmNvbS9lbl9VUy9pL3Njci9waXhlbC5naWYnIDpcbiAgICAgICAgJ2h0dHBzOi8vd3d3LnBheXBhbG9iamVjdHMuY29tL2VuX1VTL2kvc2NyL3BpeGVsLmdpZic7XG5cblxuICAgICAgICBjb25zdCBwYXlwYWxCdXR0b24gPSBgPGZvcm0gYWN0aW9uPSR7YWN0aW9ufSBtZXRob2Q9XCJwb3N0XCIgdGFyZ2V0PVwiX2JsYW5rXCI+XG5cbiAgICAgICAgPCEtLSBTYXZlZCBidXR0b25zIHVzZSB0aGUgXCJzZWN1cmUgY2xpY2tcIiBjb21tYW5kIC0tPlxuICAgICAgICA8aW5wdXQgdHlwZT1cImhpZGRlblwiIG5hbWU9XCJjbWRcIiB2YWx1ZT1cIl9zLXhjbGlja1wiPlxuXG4gICAgICAgIDwhLS0gU2F2ZWQgYnV0dG9ucyBhcmUgaWRlbnRpZmllZCBieSB0aGVpciBidXR0b24gSURzIC0tPlxuICAgICAgICA8aW5wdXQgdHlwZT1cImhpZGRlblwiIG5hbWU9XCJob3N0ZWRfYnV0dG9uX2lkXCIgdmFsdWU9XCIke2RhdGEuYnV0dG9uSWR9XCI+XG5cbiAgICAgICAgPCEtLSBTYXZlZCBidXR0b25zIGRpc3BsYXkgYW4gYXBwcm9wcmlhdGUgYnV0dG9uIGltYWdlLiAtLT5cbiAgICAgICAgPGlucHV0IHR5cGU9XCJpbWFnZVwiIG5hbWU9XCJzdWJtaXRcIlxuICAgICAgICBzcmM9JHtidXlHSUZ9XG4gICAgICAgIGFsdD1cIlBheVBhbCAtIFRoZSBzYWZlciwgZWFzaWVyIHdheSB0byBwYXkgb25saW5lXCI+XG4gICAgICAgIDxpbWcgYWx0PVwiXCIgd2lkdGg9XCIxXCIgaGVpZ2h0PVwiMVwiXG4gICAgICAgIHNyYz0ke3BpeGVsR0lGfSA+XG5cbiAgICAgICAgPC9mb3JtPmA7XG5cbiAgICAgICAgY29uc3QgaGlkZGVuRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGhpZGRlbkRpdi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICBoaWRkZW5EaXYuaW5uZXJIVE1MID0gcGF5cGFsQnV0dG9uO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGhpZGRlbkRpdik7XG5cbiAgICAgICAgdGhpcy5wYXlwYWwgPSBoaWRkZW5EaXYucXVlcnlTZWxlY3RvcignZm9ybScpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgfVxuXG4gICAgLy8gcHVibGljIHNoYXJlIG1ldGhvZCB0byB0cmlnZ2VyIHNoYXJlIHByb2dyYW1tYXRpY2FsbHlcbiAgICBzaGFyZShlKSB7XG4gICAgICAvLyBpZiBkeW5hbWljIGluc3RhbmNlIHRoZW4gZmV0Y2ggYXR0cmlidXRlcyBhZ2FpbiBpbiBjYXNlIG9mIHVwZGF0ZXNcbiAgICAgIGlmICh0aGlzLmRhdGEuZHluYW1pYykge1xuICAgICAgICAvL2VzbGludC1kaXNhYmxlLW5leHQtbGluZVxuICAgICAgICB0aGlzLm9zLnNldERhdGEoZGF0YSk7Ly8gZGF0YSBpcyBub3QgZGVmaW5lZFxuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5kYXRhLnR5cGUudG9Mb3dlckNhc2UoKSA9PT0gJ3BheXBhbCcpIHtcbiAgICAgICAgdGhpcy5wYXlwYWwuc3VibWl0KCk7XG4gICAgICB9IGVsc2UgdGhpcy5vcy5zaGFyZShlKTtcblxuICAgICAgRXZlbnRzLnRyaWdnZXIodGhpcy5lbGVtZW50LCAnc2hhcmVkJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIE9wZW5TaGFyZTtcbn07XG4iLCIvKipcbiAqIE9iamVjdCBvZiB0cmFuc2Zvcm0gZnVuY3Rpb25zIGZvciBlYWNoIG9wZW5zaGFyZSBhcGlcbiAqIFRyYW5zZm9ybSBmdW5jdGlvbnMgcGFzc2VkIGludG8gT3BlblNoYXJlIGluc3RhbmNlIHdoZW4gaW5zdGFudGlhdGVkXG4gKiBSZXR1cm4gb2JqZWN0IGNvbnRhaW5pbmcgVVJMIGFuZCBrZXkvdmFsdWUgYXJnc1xuICovXG5leHBvcnQgZGVmYXVsdCB7XG5cbiAgLy8gc2V0IFR3aXR0ZXIgc2hhcmUgVVJMXG4gIHR3aXR0ZXIoZGF0YSwgaW9zID0gZmFsc2UpIHtcbiAgICAvLyBpZiBpT1MgdXNlciBhbmQgaW9zIGRhdGEgYXR0cmlidXRlIGRlZmluZWRcbiAgICAvLyBidWlsZCBpT1MgVVJMIHNjaGVtZSBhcyBzaW5nbGUgc3RyaW5nXG4gICAgaWYgKGlvcyAmJiBkYXRhLmlvcykge1xuICAgICAgbGV0IG1lc3NhZ2UgPSAnJztcblxuICAgICAgaWYgKGRhdGEudGV4dCkge1xuICAgICAgICBtZXNzYWdlICs9IGRhdGEudGV4dDtcbiAgICAgIH1cblxuICAgICAgaWYgKGRhdGEudXJsKSB7XG4gICAgICAgIG1lc3NhZ2UgKz0gYCAtICR7ZGF0YS51cmx9YDtcbiAgICAgIH1cblxuICAgICAgaWYgKGRhdGEuaGFzaHRhZ3MpIHtcbiAgICAgICAgY29uc3QgdGFncyA9IGRhdGEuaGFzaHRhZ3Muc3BsaXQoJywnKTtcbiAgICAgICAgdGFncy5mb3JFYWNoKCh0YWcpID0+IHtcbiAgICAgICAgICBtZXNzYWdlICs9IGAgIyR7dGFnfWA7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGF0YS52aWEpIHtcbiAgICAgICAgbWVzc2FnZSArPSBgIHZpYSAke2RhdGEudmlhfWA7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHVybDogJ3R3aXR0ZXI6Ly9wb3N0PycsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICB9LFxuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgdXJsOiAnaHR0cHM6Ly90d2l0dGVyLmNvbS9zaGFyZT8nLFxuICAgICAgZGF0YSxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiA3MDAsXG4gICAgICAgIGhlaWdodDogMjk2LFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBUd2l0dGVyIHJldHdlZXQgVVJMXG4gIHR3aXR0ZXJSZXR3ZWV0KGRhdGEsIGlvcyA9IGZhbHNlKSB7XG4gICAgLy8gaWYgaU9TIHVzZXIgYW5kIGlvcyBkYXRhIGF0dHJpYnV0ZSBkZWZpbmVkXG4gICAgaWYgKGlvcyAmJiBkYXRhLmlvcykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdXJsOiAndHdpdHRlcjovL3N0YXR1cz8nLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgaWQ6IGRhdGEudHdlZXRJZCxcbiAgICAgICAgfSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogJ2h0dHBzOi8vdHdpdHRlci5jb20vaW50ZW50L3JldHdlZXQ/JyxcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgdHdlZXRfaWQ6IGRhdGEudHdlZXRJZCxcbiAgICAgICAgcmVsYXRlZDogZGF0YS5yZWxhdGVkLFxuICAgICAgfSxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiA3MDAsXG4gICAgICAgIGhlaWdodDogMjk2LFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBUd2l0dGVyIGxpa2UgVVJMXG4gIHR3aXR0ZXJMaWtlKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG4gICAgLy8gaWYgaU9TIHVzZXIgYW5kIGlvcyBkYXRhIGF0dHJpYnV0ZSBkZWZpbmVkXG4gICAgaWYgKGlvcyAmJiBkYXRhLmlvcykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdXJsOiAndHdpdHRlcjovL3N0YXR1cz8nLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgaWQ6IGRhdGEudHdlZXRJZCxcbiAgICAgICAgfSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogJ2h0dHBzOi8vdHdpdHRlci5jb20vaW50ZW50L2Zhdm9yaXRlPycsXG4gICAgICBkYXRhOiB7XG4gICAgICAgIHR3ZWV0X2lkOiBkYXRhLnR3ZWV0SWQsXG4gICAgICAgIHJlbGF0ZWQ6IGRhdGEucmVsYXRlZCxcbiAgICAgIH0sXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogNzAwLFxuICAgICAgICBoZWlnaHQ6IDI5NixcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgVHdpdHRlciBmb2xsb3cgVVJMXG4gIHR3aXR0ZXJGb2xsb3coZGF0YSwgaW9zID0gZmFsc2UpIHtcbiAgICAvLyBpZiBpT1MgdXNlciBhbmQgaW9zIGRhdGEgYXR0cmlidXRlIGRlZmluZWRcbiAgICBpZiAoaW9zICYmIGRhdGEuaW9zKSB7XG4gICAgICBjb25zdCBpb3NEYXRhID0gZGF0YS5zY3JlZW5OYW1lID8ge1xuICAgICAgICBzY3JlZW5fbmFtZTogZGF0YS5zY3JlZW5OYW1lLFxuICAgICAgfSA6IHtcbiAgICAgICAgaWQ6IGRhdGEudXNlcklkLFxuICAgICAgfTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdXJsOiAndHdpdHRlcjovL3VzZXI/JyxcbiAgICAgICAgZGF0YTogaW9zRGF0YSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogJ2h0dHBzOi8vdHdpdHRlci5jb20vaW50ZW50L3VzZXI/JyxcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgc2NyZWVuX25hbWU6IGRhdGEuc2NyZWVuTmFtZSxcbiAgICAgICAgdXNlcl9pZDogZGF0YS51c2VySWQsXG4gICAgICB9LFxuICAgICAgcG9wdXA6IHtcbiAgICAgICAgd2lkdGg6IDcwMCxcbiAgICAgICAgaGVpZ2h0OiAyOTYsXG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgLy8gc2V0IEZhY2Vib29rIHNoYXJlIFVSTFxuICBmYWNlYm9vayhkYXRhKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogJ2h0dHBzOi8vd3d3LmZhY2Vib29rLmNvbS9kaWFsb2cvZmVlZD9hcHBfaWQ9OTYxMzQyNTQzOTIyMzIyJnJlZGlyZWN0X3VyaT1odHRwOi8vZmFjZWJvb2suY29tJicsXG4gICAgICBkYXRhLFxuICAgICAgcG9wdXA6IHtcbiAgICAgICAgd2lkdGg6IDU2MCxcbiAgICAgICAgaGVpZ2h0OiA1OTMsXG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgICAvLyBzZXQgRmFjZWJvb2sgc2VuZCBVUkxcbiAgZmFjZWJvb2tTZW5kKGRhdGEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdXJsOiAnaHR0cHM6Ly93d3cuZmFjZWJvb2suY29tL2RpYWxvZy9zZW5kP2FwcF9pZD05NjEzNDI1NDM5MjIzMjImcmVkaXJlY3RfdXJpPWh0dHA6Ly9mYWNlYm9vay5jb20mJyxcbiAgICAgIGRhdGEsXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogOTgwLFxuICAgICAgICBoZWlnaHQ6IDU5NixcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgWW91VHViZSBwbGF5IFVSTFxuICB5b3V0dWJlKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG4gICAgLy8gaWYgaU9TIHVzZXJcbiAgICBpZiAoaW9zICYmIGRhdGEuaW9zKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB1cmw6IGB5b3V0dWJlOiR7ZGF0YS52aWRlb30/YCxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogYGh0dHBzOi8vd3d3LnlvdXR1YmUuY29tL3dhdGNoP3Y9JHtkYXRhLnZpZGVvfT9gLFxuICAgICAgcG9wdXA6IHtcbiAgICAgICAgd2lkdGg6IDEwODYsXG4gICAgICAgIGhlaWdodDogNjA4LFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBZb3VUdWJlIHN1YmNyaWJlIFVSTFxuICB5b3V0dWJlU3Vic2NyaWJlKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG4gICAgLy8gaWYgaU9TIHVzZXJcbiAgICBpZiAoaW9zICYmIGRhdGEuaW9zKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB1cmw6IGB5b3V0dWJlOi8vd3d3LnlvdXR1YmUuY29tL3VzZXIvJHtkYXRhLnVzZXJ9P2AsXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB1cmw6IGBodHRwczovL3d3dy55b3V0dWJlLmNvbS91c2VyLyR7ZGF0YS51c2VyfT9gLFxuICAgICAgcG9wdXA6IHtcbiAgICAgICAgd2lkdGg6IDg4MCxcbiAgICAgICAgaGVpZ2h0OiAzNTAsXG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgLy8gc2V0IEluc3RhZ3JhbSBmb2xsb3cgVVJMXG4gIGluc3RhZ3JhbSgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdXJsOiAnaW5zdGFncmFtOi8vY2FtZXJhPycsXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgSW5zdGFncmFtIGZvbGxvdyBVUkxcbiAgaW5zdGFncmFtRm9sbG93KGRhdGEsIGlvcyA9IGZhbHNlKSB7XG4gICAgLy8gaWYgaU9TIHVzZXJcbiAgICBpZiAoaW9zICYmIGRhdGEuaW9zKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB1cmw6ICdpbnN0YWdyYW06Ly91c2VyPycsXG4gICAgICAgIGRhdGEsXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB1cmw6IGBodHRwOi8vd3d3Lmluc3RhZ3JhbS5jb20vJHtkYXRhLnVzZXJuYW1lfT9gLFxuICAgICAgcG9wdXA6IHtcbiAgICAgICAgd2lkdGg6IDk4MCxcbiAgICAgICAgaGVpZ2h0OiA2NTUsXG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgLy8gc2V0IFNuYXBjaGF0IGZvbGxvdyBVUkxcbiAgc25hcGNoYXQoZGF0YSkge1xuICAgIHJldHVybiB7XG4gICAgICB1cmw6IGBzbmFwY2hhdDovL2FkZC8ke2RhdGEudXNlcm5hbWV9P2AsXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgR29vZ2xlIHNoYXJlIFVSTFxuICBnb29nbGUoZGF0YSkge1xuICAgIHJldHVybiB7XG4gICAgICB1cmw6ICdodHRwczovL3BsdXMuZ29vZ2xlLmNvbS9zaGFyZT8nLFxuICAgICAgZGF0YSxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiA0OTUsXG4gICAgICAgIGhlaWdodDogODE1LFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBHb29nbGUgbWFwcyBVUkxcbiAgZ29vZ2xlTWFwcyhkYXRhLCBpb3MgPSBmYWxzZSkge1xuICAgIGlmIChkYXRhLnNlYXJjaCkge1xuICAgICAgZGF0YS5xID0gZGF0YS5zZWFyY2g7XG4gICAgICBkZWxldGUgZGF0YS5zZWFyY2g7XG4gICAgfVxuXG4gICAgLy8gaWYgaU9TIHVzZXIgYW5kIGlvcyBkYXRhIGF0dHJpYnV0ZSBkZWZpbmVkXG4gICAgaWYgKGlvcyAmJiBkYXRhLmlvcykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdXJsOiAnY29tZ29vZ2xlbWFwczovLz8nLFxuICAgICAgICBkYXRhOiBpb3MsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmICghaW9zICYmIGRhdGEuaW9zKSB7XG4gICAgICBkZWxldGUgZGF0YS5pb3M7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogJ2h0dHBzOi8vbWFwcy5nb29nbGUuY29tLz8nLFxuICAgICAgZGF0YSxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiA4MDAsXG4gICAgICAgIGhlaWdodDogNjAwLFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBQaW50ZXJlc3Qgc2hhcmUgVVJMXG4gIHBpbnRlcmVzdChkYXRhKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogJ2h0dHBzOi8vcGludGVyZXN0LmNvbS9waW4vY3JlYXRlL2Jvb2ttYXJrbGV0Lz8nLFxuICAgICAgZGF0YSxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiA3NDUsXG4gICAgICAgIGhlaWdodDogNjIwLFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBMaW5rZWRJbiBzaGFyZSBVUkxcbiAgbGlua2VkaW4oZGF0YSkge1xuICAgIHJldHVybiB7XG4gICAgICB1cmw6ICdodHRwOi8vd3d3LmxpbmtlZGluLmNvbS9zaGFyZUFydGljbGU/JyxcbiAgICAgIGRhdGEsXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogNzgwLFxuICAgICAgICBoZWlnaHQ6IDQ5MixcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgQnVmZmVyIHNoYXJlIFVSTFxuICBidWZmZXIoZGF0YSkge1xuICAgIHJldHVybiB7XG4gICAgICB1cmw6ICdodHRwOi8vYnVmZmVyYXBwLmNvbS9hZGQ/JyxcbiAgICAgIGRhdGEsXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogNzQ1LFxuICAgICAgICBoZWlnaHQ6IDM0NSxcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgVHVtYmxyIHNoYXJlIFVSTFxuICB0dW1ibHIoZGF0YSkge1xuICAgIHJldHVybiB7XG4gICAgICB1cmw6ICdodHRwczovL3d3dy50dW1ibHIuY29tL3dpZGdldHMvc2hhcmUvdG9vbD8nLFxuICAgICAgZGF0YSxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiA1NDAsXG4gICAgICAgIGhlaWdodDogOTQwLFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBSZWRkaXQgc2hhcmUgVVJMXG4gIHJlZGRpdChkYXRhKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogJ2h0dHA6Ly9yZWRkaXQuY29tL3N1Ym1pdD8nLFxuICAgICAgZGF0YSxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiA4NjAsXG4gICAgICAgIGhlaWdodDogODgwLFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBGbGlja3IgZm9sbG93IFVSTFxuICBmbGlja3IoZGF0YSwgaW9zID0gZmFsc2UpIHtcbiAgICAvLyBpZiBpT1MgdXNlclxuICAgIGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHVybDogYGZsaWNrcjovL3Bob3Rvcy8ke2RhdGEudXNlcm5hbWV9P2AsXG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgdXJsOiBgaHR0cDovL3d3dy5mbGlja3IuY29tL3Bob3Rvcy8ke2RhdGEudXNlcm5hbWV9P2AsXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogNjAwLFxuICAgICAgICBoZWlnaHQ6IDY1MCxcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgV2hhdHNBcHAgc2hhcmUgVVJMXG4gIHdoYXRzYXBwKGRhdGEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdXJsOiAnd2hhdHNhcHA6Ly9zZW5kPycsXG4gICAgICBkYXRhLFxuICAgIH07XG4gIH0sXG5cbiAgLy8gc2V0IHNtcyBzaGFyZSBVUkxcbiAgc21zKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogaW9zID8gJ3NtczomJyA6ICdzbXM6PycsXG4gICAgICBkYXRhLFxuICAgIH07XG4gIH0sXG5cbiAgLy8gc2V0IEVtYWlsIHNoYXJlIFVSTFxuICBlbWFpbChkYXRhKSB7XG4gICAgbGV0IHVybCA9ICdtYWlsdG86JztcblxuICAgIC8vIGlmIHRvIGFkZHJlc3Mgc3BlY2lmaWVkIHRoZW4gYWRkIHRvIFVSTFxuICAgIGlmIChkYXRhLnRvICE9PSBudWxsKSB7XG4gICAgICB1cmwgKz0gYCR7ZGF0YS50b31gO1xuICAgIH1cblxuICAgIHVybCArPSAnPyc7XG5cbiAgICByZXR1cm4ge1xuICAgICAgdXJsLFxuICAgICAgZGF0YToge1xuICAgICAgICBzdWJqZWN0OiBkYXRhLnN1YmplY3QsXG4gICAgICAgIGJvZHk6IGRhdGEuYm9keSxcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgR2l0aHViIGZvcmsgVVJMXG4gIGdpdGh1YihkYXRhLCBpb3MgPSBmYWxzZSkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gICAgbGV0IHVybCA9IGRhdGEucmVwbyA/IGBodHRwczovL2dpdGh1Yi5jb20vJHtkYXRhLnJlcG99YCA6IGRhdGEudXJsO1xuXG4gICAgaWYgKGRhdGEuaXNzdWUpIHtcbiAgICAgIHVybCArPSBgL2lzc3Vlcy9uZXc/dGl0bGU9JHtkYXRhLmlzc3VlfSZib2R5PSR7ZGF0YS5ib2R5fWA7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogYCR7dXJsfT9gLFxuICAgICAgcG9wdXA6IHtcbiAgICAgICAgd2lkdGg6IDEwMjAsXG4gICAgICAgIGhlaWdodDogMzIzLFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBEcmliYmJsZSBzaGFyZSBVUkxcbiAgZHJpYmJibGUoZGF0YSwgaW9zID0gZmFsc2UpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICAgIGNvbnN0IHVybCA9IGRhdGEuc2hvdCA/IGBodHRwczovL2RyaWJiYmxlLmNvbS9zaG90cy8ke2RhdGEuc2hvdH0/YCA6IGAke2RhdGEudXJsfT9gO1xuICAgIHJldHVybiB7XG4gICAgICB1cmwsXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogNDQwLFxuICAgICAgICBoZWlnaHQ6IDY0MCxcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICBjb2RlcGVuKGRhdGEpIHtcbiAgICBjb25zdCB1cmwgPSAoZGF0YS5wZW4gJiYgZGF0YS51c2VybmFtZSAmJiBkYXRhLnZpZXcpID8gYGh0dHBzOi8vY29kZXBlbi5pby8ke2RhdGEudXNlcm5hbWV9LyR7ZGF0YS52aWV3fS8ke2RhdGEucGVufT9gIDogYCR7ZGF0YS51cmx9P2A7XG4gICAgcmV0dXJuIHtcbiAgICAgIHVybCxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiAxMjAwLFxuICAgICAgICBoZWlnaHQ6IDgwMCxcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICBwYXlwYWwoZGF0YSkge1xuICAgIHJldHVybiB7XG4gICAgICBkYXRhLFxuICAgIH07XG4gIH0sXG59O1xuIiwiY29uc3QgT3BlblNoYXJlID0ge1xuICBzaGFyZTogcmVxdWlyZSgnLi4vc2hhcmUuanMnKSxcbiAgY291bnQ6IHJlcXVpcmUoJy4uL2NvdW50LmpzJyksXG4gIGFuYWx5dGljczogcmVxdWlyZSgnLi4vYW5hbHl0aWNzLmpzJyksXG59O1xuXG5PcGVuU2hhcmUuYW5hbHl0aWNzKCd0YWdNYW5hZ2VyJywgKCkgPT4ge1xuICBjb25zb2xlLmxvZygndGFnIG1hbmFnZXIgbG9hZGVkJyk7XG59KTtcblxuT3BlblNoYXJlLmFuYWx5dGljcygnZXZlbnQnLCAoKSA9PiB7XG4gIGNvbnNvbGUubG9nKCdnb29nbGUgYW5hbHl0aWNzIGV2ZW50cyBsb2FkZWQnKTtcbn0pO1xuXG5PcGVuU2hhcmUuYW5hbHl0aWNzKCdzb2NpYWwnLCAoKSA9PiB7XG4gIGNvbnNvbGUubG9nKCdnb29nbGUgYW5hbHl0aWNzIHNvY2lhbCBsb2FkZWQnKTtcbn0pO1xuXG5jb25zdCBkeW5hbWljTm9kZURhdGEgPSB7XG4gIHVybDogJ2h0dHA6Ly93d3cuZGlnaXRhbHN1cmdlb25zLmNvbScsXG4gIHZpYTogJ2RpZ2l0YWxzdXJnZW9ucycsXG4gIHRleHQ6ICdGb3J3YXJkIE9ic2Vzc2VkJyxcbiAgaGFzaHRhZ3M6ICdmb3J3YXJkb2JzZXNzZWQnLFxuICBidXR0b246ICdPcGVuIFNoYXJlIFdhdGNoZXIhJyxcbn07XG5cbmZ1bmN0aW9uIGNyZWF0ZU9wZW5TaGFyZU5vZGUoZGF0YSkge1xuICBjb25zdCBvcGVuU2hhcmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG5cbiAgb3BlblNoYXJlLmNsYXNzTGlzdC5hZGQoJ29wZW4tc2hhcmUtbGluaycsICd0d2l0dGVyJyk7XG4gIG9wZW5TaGFyZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZScsICd0d2l0dGVyJyk7XG4gIG9wZW5TaGFyZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS11cmwnLCBkYXRhLnVybCk7XG4gIG9wZW5TaGFyZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS12aWEnLCBkYXRhLnZpYSk7XG4gIG9wZW5TaGFyZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS10ZXh0JywgZGF0YS50ZXh0KTtcbiAgb3BlblNoYXJlLnNldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWhhc2h0YWdzJywgZGF0YS5oYXNodGFncyk7XG4gIG9wZW5TaGFyZS5pbm5lckhUTUwgPSBgPHNwYW4gY2xhc3M9XCJmYSBmYS10d2l0dGVyXCI+PC9zcGFuPiR7ZGF0YS5idXR0b259YDtcblxuICBjb25zdCBub2RlID0gbmV3IE9wZW5TaGFyZS5zaGFyZSh7IC8vZXNsaW50LWRpc2FibGUtbGluZVxuICAgIHR5cGU6ICd0d2l0dGVyJyxcbiAgICB1cmw6ICdodHRwOi8vd3d3LmRpZ2l0YWxzdXJnZW9ucy5jb20nLFxuICAgIHZpYTogJ2RpZ2l0YWxzdXJnZW9ucycsXG4gICAgaGFzaHRhZ3M6ICdmb3J3YXJkb2JzZXNzZWQnLFxuICAgIGFwcGVuZFRvOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcub3Blbi1zaGFyZS13YXRjaCcpLFxuICAgIGlubmVySFRNTDogJ0NyZWF0ZWQgdmlhIE9wZW5TaGFyZUFQSScsXG4gICAgZWxlbWVudDogJ2RpdicsXG4gICAgY2xhc3NlczogWyd3b3cnLCAnc3VjaCcsICdjbGFzc2VzJ10sXG4gIH0pO1xuXG4gIHJldHVybiBvcGVuU2hhcmU7XG59XG5cbmZ1bmN0aW9uIGFkZE5vZGUoKSB7XG4gIGNvbnN0IGRhdGEgPSBkeW5hbWljTm9kZURhdGE7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5vcGVuLXNoYXJlLXdhdGNoJylcbiAgICAuYXBwZW5kQ2hpbGQoY3JlYXRlT3BlblNoYXJlTm9kZShkYXRhKSk7XG59XG5cbndpbmRvdy5hZGROb2RlID0gYWRkTm9kZTtcblxuZnVuY3Rpb24gYWRkTm9kZVdpdGhDb3VudCgpIHtcbiAgY29uc3QgZGF0YSA9IGR5bmFtaWNOb2RlRGF0YTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBuZXcgT3BlblNoYXJlLmNvdW50KHsgLy8gZXNsaW50LWRpc2FibGUtbGluZVxuICAgIHR5cGU6ICdmYWNlYm9vaycsXG4gICAgdXJsOiAnaHR0cHM6Ly93d3cuZGlnaXRhbHN1cmdlb25zLmNvbS8nLFxuICB9LCAobm9kZSkgPT4ge1xuICAgIGNvbnN0IG9zID0gbmV3IE9wZW5TaGFyZS5zaGFyZSh7IC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbiAgICAgIHR5cGU6ICd0d2l0dGVyJyxcbiAgICAgIHVybDogJ2h0dHA6Ly93d3cuZGlnaXRhbHN1cmdlb25zLmNvbScsXG4gICAgICB2aWE6ICdkaWdpdGFsc3VyZ2VvbnMnLFxuICAgICAgaGFzaHRhZ3M6ICdmb3J3YXJkb2JzZXNzZWQnLFxuICAgICAgaW5uZXJIVE1MOiAnQ3JlYXRlZCB2aWEgT3BlblNoYXJlQVBJJyxcbiAgICAgIGVsZW1lbnQ6ICdkaXYnLFxuICAgICAgY2xhc3NlczogWyd3b3cnLCAnc3VjaCcsICdjbGFzc2VzJ10sXG4gICAgfSk7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmNyZWF0ZS1ub2RlLnctY291bnQnKVxuICAgIC5hcHBlbmRDaGlsZChvcyk7XG4gICAgb3MuYXBwZW5kQ2hpbGQobm9kZSk7XG4gIH0pO1xufVxuXG53aW5kb3cuYWRkTm9kZVdpdGhDb3VudCA9IGFkZE5vZGVXaXRoQ291bnQ7XG5cbmZ1bmN0aW9uIGNyZWF0ZUNvdW50Tm9kZSgpIHtcbiAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmNyZWF0ZS1ub2RlLmNvdW50LW5vZGVzJyk7XG4gIGNvbnN0IHR5cGUgPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignaW5wdXQuY291bnQtdHlwZScpLnZhbHVlO1xuICBjb25zdCB1cmwgPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignaW5wdXQuY291bnQtdXJsJykudmFsdWU7XG5cbiAgbmV3IE9wZW5TaGFyZS5jb3VudCh7IC8vZXNsaW50LWRpc2FibGUtbGluZVxuICAgIHR5cGU6IHR5cGUsIC8vZXNsaW50LWRpc2FibGUtbGluZVxuICAgIHVybDogdXJsLCAvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgICBhcHBlbmRUbzogY29udGFpbmVyLFxuICAgIGNsYXNzZXM6IFsndGVzdCddLFxuICB9LCAobm9kZSkgPT4ge1xuICAgIG5vZGUuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuICB9KTtcblxuXG4gIGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdpbnB1dC5jb3VudC10eXBlJykudmFsdWUgPSAnJztcbiAgY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0LmNvdW50LXVybCcpLnZhbHVlID0gJyc7XG59XG5cbndpbmRvdy5jcmVhdGVDb3VudE5vZGUgPSBjcmVhdGVDb3VudE5vZGU7XG5cbi8vIHRlc3QgSlMgT3BlblNoYXJlIEFQSSB3aXRoIGRhc2hlc1xubmV3IE9wZW5TaGFyZS5zaGFyZSh7IC8vZXNsaW50LWRpc2FibGUtbGluZVxuICB0eXBlOiAnZ29vZ2xlTWFwcycsXG4gIGNlbnRlcjogJzQwLjc2NTgxOSwtNzMuOTc1ODY2JyxcbiAgdmlldzogJ3RyYWZmaWMnLFxuICB6b29tOiAxNCxcbiAgYXBwZW5kVG86IGRvY3VtZW50LmJvZHksXG4gIGlubmVySFRNTDogJ01hcHMnLFxufSk7XG5cbm5ldyBPcGVuU2hhcmUuc2hhcmUoeyAvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgdHlwZTogJ3R3aXR0ZXItZm9sbG93JyxcbiAgc2NyZWVuTmFtZTogJ2RpZ2l0YWxzdXJnZW9ucycsXG4gIHVzZXJJZDogJzE4MTg5MTMwJyxcbiAgYXBwZW5kVG86IGRvY3VtZW50LmJvZHksXG4gIGlubmVySFRNTDogJ0ZvbGxvdyBUZXN0Jyxcbn0pO1xuXG4vLyB0ZXN0IFBheVBhbFxubmV3IE9wZW5TaGFyZS5zaGFyZSh7IC8vZXNsaW50LWRpc2FibGUtbGluZVxuICB0eXBlOiAncGF5cGFsJyxcbiAgYnV0dG9uSWQ6ICcyUDNSSllFRkw3WjYyJyxcbiAgc2FuZGJveDogdHJ1ZSxcbiAgYXBwZW5kVG86IGRvY3VtZW50LmJvZHksXG4gIGlubmVySFRNTDogJ1BheVBhbCBUZXN0Jyxcbn0pO1xuXG4vLyBiaW5kIHRvIGNvdW50IGxvYWRlZCBldmVudFxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignT3BlblNoYXJlLmNvdW50LWxvYWRlZCcsICgpID0+IHtcbiAgY29uc29sZS5sb2coJ09wZW5TaGFyZSAoY291bnQpIGxvYWRlZCcpO1xufSk7XG5cbi8vIGJpbmQgdG8gc2hhcmUgbG9hZGVkIGV2ZW50XG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdPcGVuU2hhcmUuc2hhcmUtbG9hZGVkJywgKCkgPT4ge1xuICBjb25zb2xlLmxvZygnT3BlblNoYXJlIChzaGFyZSkgbG9hZGVkJyk7XG5cbiAgLy8gYmluZCB0byBzaGFyZWQgZXZlbnQgb24gZWFjaCBpbmRpdmlkdWFsIG5vZGVcbiAgW10uZm9yRWFjaC5jYWxsKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLW9wZW4tc2hhcmVdJyksIChub2RlKSA9PiB7XG4gICAgbm9kZS5hZGRFdmVudExpc3RlbmVyKCdPcGVuU2hhcmUuc2hhcmVkJywgKGUpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKCdPcGVuIFNoYXJlIFNoYXJlZCcsIGUpO1xuICAgIH0pO1xuICB9KTtcblxuICBjb25zdCBleGFtcGxlcyA9IHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICAgIHR3aXR0ZXI6IG5ldyBPcGVuU2hhcmUuc2hhcmUoeyAvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgICAgIHR5cGU6ICd0d2l0dGVyJyxcbiAgICAgIGJpbmRDbGljazogdHJ1ZSxcbiAgICAgIHVybDogJ2h0dHA6Ly9kaWdpdGFsc3VyZ2VvbnMuY29tJyxcbiAgICAgIHZpYTogJ2RpZ2l0YWxzdXJnZW9ucycsXG4gICAgICB0ZXh0OiAnRGlnaXRhbCBTdXJnZW9ucycsXG4gICAgICBoYXNodGFnczogJ2ZvcndhcmRvYnNlc3NlZCcsXG4gICAgfSwgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignW2RhdGEtYXBpLWV4YW1wbGU9XCJ0d2l0dGVyXCJdJykpLFxuXG4gICAgZmFjZWJvb2s6IG5ldyBPcGVuU2hhcmUuc2hhcmUoeyAvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgICAgIHR5cGU6ICdmYWNlYm9vaycsXG4gICAgICBiaW5kQ2xpY2s6IHRydWUsXG4gICAgICBsaW5rOiAnaHR0cDovL2RpZ2l0YWxzdXJnZW9ucy5jb20nLFxuICAgICAgcGljdHVyZTogJ2h0dHA6Ly93d3cuZGlnaXRhbHN1cmdlb25zLmNvbS9pbWcvYWJvdXQvYmdfb2ZmaWNlX3RlYW0uanBnJyxcbiAgICAgIGNhcHRpb246ICdEaWdpdGFsIFN1cmdlb25zJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnZm9yd2FyZG9ic2Vzc2VkJyxcbiAgICB9LCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbZGF0YS1hcGktZXhhbXBsZT1cImZhY2Vib29rXCJdJykpLFxuXG4gICAgcGludGVyZXN0OiBuZXcgT3BlblNoYXJlLnNoYXJlKHsgLy9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgICB0eXBlOiAncGludGVyZXN0JyxcbiAgICAgIGJpbmRDbGljazogdHJ1ZSxcbiAgICAgIHVybDogJ2h0dHA6Ly9kaWdpdGFsc3VyZ2VvbnMuY29tJyxcbiAgICAgIG1lZGlhOiAnaHR0cDovL3d3dy5kaWdpdGFsc3VyZ2VvbnMuY29tL2ltZy9hYm91dC9iZ19vZmZpY2VfdGVhbS5qcGcnLFxuICAgICAgZGVzY3JpcHRpb246ICdEaWdpdGFsIFN1cmdlb25zJyxcbiAgICAgIGFwcGVuZFRvOiBkb2N1bWVudC5ib2R5LFxuICAgIH0sIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLWFwaS1leGFtcGxlPVwicGludGVyZXN0XCJdJykpLFxuXG4gICAgZW1haWw6IG5ldyBPcGVuU2hhcmUuc2hhcmUoeyAvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgICAgIHR5cGU6ICdlbWFpbCcsXG4gICAgICBiaW5kQ2xpY2s6IHRydWUsXG4gICAgICB0bzogJ3RlY2hyb29tQGRpZ2l0YWxzdXJnZW9ucy5jb20nLFxuICAgICAgc3ViamVjdDogJ0RpZ2l0YWwgU3VyZ2VvbnMnLFxuICAgICAgYm9keTogJ0ZvcndhcmQgT2JzZXNzZWQnLFxuICAgIH0sIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLWFwaS1leGFtcGxlPVwiZW1haWxcIl0nKSksXG4gIH07XG59KTtcblxuLy8gRXhhbXBsZSBvZiBsaXN0ZW5pbmcgZm9yIGNvdW50ZWQgZXZlbnRzIG9uIGluZGl2aWR1YWwgdXJscyBvciBhcnJheXMgb2YgdXJsc1xuY29uc3QgdXJscyA9IFtcbiAgJ2ZhY2Vib29rJyxcbiAgJ2dvb2dsZScsXG4gICdsaW5rZWRpbicsXG4gICdyZWRkaXQnLFxuICAncGludGVyZXN0JyxcbiAgW1xuICAgICdnb29nbGUnLFxuICAgICdsaW5rZWRpbicsXG4gICAgJ3JlZGRpdCcsXG4gICAgJ3BpbnRlcmVzdCcsXG4gIF0sXG5dO1xuXG51cmxzLmZvckVhY2goKHVybCkgPT4ge1xuICBpZiAoQXJyYXkuaXNBcnJheSh1cmwpKSB7XG4gICAgdXJsID0gdXJsLmpvaW4oJywnKTtcbiAgfVxuICBjb25zdCBjb3VudE5vZGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGBbZGF0YS1vcGVuLXNoYXJlLWNvdW50PVwiJHt1cmx9XCJdYCk7XG5cbiAgW10uZm9yRWFjaC5jYWxsKGNvdW50Tm9kZSwgKG5vZGUpID0+IHtcbiAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoYE9wZW5TaGFyZS5jb3VudGVkLSR7dXJsfWAsICgpID0+IHtcbiAgICAgIGNvbnN0IGNvdW50cyA9IG5vZGUuaW5uZXJIVE1MO1xuICAgICAgaWYgKGNvdW50cykgY29uc29sZS5sb2codXJsLCAnc2hhcmVzOiAnLCBjb3VudHMpO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuXG4vLyB0ZXN0IHR3aXR0ZXIgY291bnQganMgYXBpXG5uZXcgT3BlblNoYXJlLmNvdW50KHsgLy9lc2xpbnQtZGlzYWJsZS1saW5lXG4gIHR5cGU6ICd0d2l0dGVyJyxcbiAgdXJsOiAnaHR0cHM6Ly93d3cuZGlnaXRhbHN1cmdlb25zLmNvbS90aG91Z2h0cy90ZWNobm9sb2d5L3RoZS1ibG9ja2NoYWluLXJldm9sdXRpb24nLFxuICBrZXk6ICdkc3R3ZWV0cycsXG59LCAobm9kZSkgPT4ge1xuICBjb25zdCBvcyA9IG5ldyBPcGVuU2hhcmUuc2hhcmUoeyAvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgICB0eXBlOiAndHdpdHRlcicsXG4gICAgdXJsOiAnaHR0cHM6Ly93d3cuZGlnaXRhbHN1cmdlb25zLmNvbS90aG91Z2h0cy90ZWNobm9sb2d5L3RoZS1ibG9ja2NoYWluLXJldm9sdXRpb24nLFxuICAgIHZpYTogJ2RpZ2l0YWxzdXJnZW9ucycsXG4gICAgaGFzaHRhZ3M6ICdmb3J3YXJkb2JzZXNzZWQsIGJsb2NrY2hhaW4nLFxuICAgIGFwcGVuZFRvOiBkb2N1bWVudC5ib2R5LFxuICAgIGlubmVySFRNTDogJ0JMT0NLQ0hBSU4nLFxuICB9KTtcbiAgb3MuYXBwZW5kQ2hpbGQobm9kZSk7XG59KTtcbiJdfQ==
