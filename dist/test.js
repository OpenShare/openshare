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

var _init = require('./lib/init');

var _init2 = _interopRequireDefault(_init);

var _initializeCountNode = require('./lib/initializeCountNode');

var _initializeCountNode2 = _interopRequireDefault(_initializeCountNode);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function init() {
  (0, _init2.default)({
    api: 'count',
    selector: '[data-open-share-count]:not([data-open-share-node])',
    cb: _initializeCountNode2.default
  })();
}

exports.default = function () {
  if (document.readyState === 'complete') {
    init();
  }
  document.addEventListener('readystatechange', function () {
    if (document.readyState === 'complete') {
      init();
    }
  }, false);
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

},{"../src/modules/open-share":18,"../src/modules/share-transforms":19,"./dashToCamel":4,"./setData":10,"./share":11}],9:[function(require,module,exports){
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

var _init = require('./lib/init');

var _init2 = _interopRequireDefault(_init);

var _initializeShareNode = require('./lib/initializeShareNode');

var _initializeShareNode2 = _interopRequireDefault(_initializeShareNode);

var _countApi = require('./src/modules/count-api');

var _countApi2 = _interopRequireDefault(_countApi);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function init() {
  (0, _init2.default)({
    api: 'share',
    selector: '[data-open-share]:not([data-open-share-node])',
    cb: _initializeShareNode2.default
  })();
}

exports.default = function () {
  if (document.readyState === 'complete') {
    init();
  }
  document.addEventListener('readystatechange', function () {
    if (document.readyState === 'complete') {
      init();
    }
  }, false);
  return (0, _countApi2.default)();
};

},{"./lib/init":5,"./lib/initializeShareNode":8,"./src/modules/count-api":14}],14:[function(require,module,exports){
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

},{}],20:[function(require,module,exports){
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

},{"../analytics.js":1,"../count.js":2,"../share.js":13}]},{},[20])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiYW5hbHl0aWNzLmpzIiwiY291bnQuanMiLCJsaWIvY291bnRSZWR1Y2UuanMiLCJsaWIvZGFzaFRvQ2FtZWwuanMiLCJsaWIvaW5pdC5qcyIsImxpYi9pbml0aWFsaXplQ291bnROb2RlLmpzIiwibGliL2luaXRpYWxpemVOb2Rlcy5qcyIsImxpYi9pbml0aWFsaXplU2hhcmVOb2RlLmpzIiwibGliL2luaXRpYWxpemVXYXRjaGVyLmpzIiwibGliL3NldERhdGEuanMiLCJsaWIvc2hhcmUuanMiLCJsaWIvc3RvcmVDb3VudC5qcyIsInNoYXJlLmpzIiwic3JjL21vZHVsZXMvY291bnQtYXBpLmpzIiwic3JjL21vZHVsZXMvY291bnQtdHJhbnNmb3Jtcy5qcyIsInNyYy9tb2R1bGVzL2NvdW50LmpzIiwic3JjL21vZHVsZXMvZXZlbnRzLmpzIiwic3JjL21vZHVsZXMvb3Blbi1zaGFyZS5qcyIsInNyYy9tb2R1bGVzL3NoYXJlLXRyYW5zZm9ybXMuanMiLCJzcmMvdGVzdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsT0FBTyxPQUFQLEdBQWlCLFVBQVUsSUFBVixFQUFnQixFQUFoQixFQUFvQjtBQUFDO0FBQ3BDLE1BQU0sT0FBTyxTQUFTLE9BQVQsSUFBb0IsU0FBUyxRQUExQztBQUNBLE1BQU0sZUFBZSxTQUFTLFlBQTlCOztBQUVBLE1BQUksSUFBSixFQUFVLHVCQUF1QixJQUF2QixFQUE2QixFQUE3QjtBQUNWLE1BQUksWUFBSixFQUFrQixjQUFjLEVBQWQ7QUFDbkIsQ0FORDs7QUFRQSxTQUFTLHNCQUFULENBQWdDLElBQWhDLEVBQXNDLEVBQXRDLEVBQTBDO0FBQ3hDLE1BQUksT0FBTyxFQUFYLEVBQWU7QUFDYixRQUFJLEVBQUosRUFBUTtBQUNWO0FBQ0UsV0FBTyxVQUFDLENBQUQsRUFBTztBQUNaLFVBQU0s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QUssSUFBSSxVQUFVLEtBQWQsQ0FBb0IsRUFBRTtBQUMvQixVQUFNLFNBRHVCO0FBRTdCLFNBQUssK0VBRndCO0FBRzdCLFNBQUssaUJBSHdCO0FBSTdCLGNBQVUsNkJBSm1CO0FBSzdCLGNBQVUsU0FBUyxJQUxVO0FBTTdCLGVBQVc7QUFOa0IsR0FBcEIsQ0FBWDtBQVFBLEtBQUcsV0FBSCxDQUFlLElBQWY7QUFDRCxDQWREIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHR5cGUsIGNiKSB7Ly8gZXNsaW50LWRpc2FibGUtbGluZVxuICBjb25zdCBpc0dBID0gdHlwZSA9PT0gJ2V2ZW50JyB8fCB0eXBlID09PSAnc29jaWFsJztcbiAgY29uc3QgaXNUYWdNYW5hZ2VyID0gdHlwZSA9PT0gJ3RhZ01hbmFnZXInO1xuXG4gIGlmIChpc0dBKSBjaGVja0lmQW5hbHl0aWNzTG9hZGVkKHR5cGUsIGNiKTtcbiAgaWYgKGlzVGFnTWFuYWdlcikgc2V0VGFnTWFuYWdlcihjYik7XG59O1xuXG5mdW5jdGlvbiBjaGVja0lmQW5hbHl0aWNzTG9hZGVkKHR5cGUsIGNiKSB7XG4gIGlmICh3aW5kb3cuZ2EpIHtcbiAgICBpZiAoY2IpIGNiKCk7XG4gIC8vIGJpbmQgdG8gc2hhcmVkIGV2ZW50IG9uIGVhY2ggaW5kaXZpZHVhbCBub2RlXG4gICAgbGlzdGVuKChlKSA9PiB7XG4gICAgICBjb25zdCBwbGF0Zm9ybSA9IGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlJyk7XG4gICAgICBjb25zdCB0YXJnZXQgPSBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1saW5rJykgfHxcbiAgICAgIGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXVybCcpIHx8XG4gICAgICBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS11c2VybmFtZScpIHx8XG4gICAgICBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jZW50ZXInKSB8fFxuICAgICAgZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtc2VhcmNoJykgfHxcbiAgICAgIGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWJvZHknKTtcblxuICAgICAgaWYgKHR5cGUgPT09ICdldmVudCcpIHtcbiAgICAgICAgZ2EoJ3NlbmQnLCAnZXZlbnQnLCB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW5kZWZcbiAgICAgICAgICBldmVudENhdGVnb3J5OiAnT3BlblNoYXJlIENsaWNrJyxcbiAgICAgICAgICBldmVudEFjdGlvbjogcGxhdGZvcm0sXG4gICAgICAgICAgZXZlbnRMYWJlbDogdGFyZ2V0LFxuICAgICAgICAgIHRyYW5zcG9ydDogJ2JlYWNvbicsXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZSA9PT0gJ3NvY2lhbCcpIHtcbiAgICAgICAgZ2EoJ3NlbmQnLCB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW5kZWZcbiAgICAgICAgICBoaXRUeXBlOiAnc29jaWFsJyxcbiAgICAgICAgICBzb2NpYWxOZXR3b3JrOiBwbGF0Zm9ybSxcbiAgICAgICAgICBzb2NpYWxBY3Rpb246ICdzaGFyZScsXG4gICAgICAgICAgc29jaWFsVGFyZ2V0OiB0YXJnZXQsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgY2hlY2tJZkFuYWx5dGljc0xvYWRlZCh0eXBlLCBjYik7XG4gICAgfSwgMTAwMCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2V0VGFnTWFuYWdlcihjYikge1xuICBpZiAod2luZG93LmRhdGFMYXllciAmJiB3aW5kb3cuZGF0YUxheWVyWzBdWydndG0uc3RhcnQnXSkge1xuICAgIGlmIChjYikgY2IoKTtcblxuICAgIGxpc3RlbihvblNoYXJlVGFnTWFuZ2VyKTtcblxuICAgIGdldENvdW50cygoZSkgPT4ge1xuICAgICAgY29uc3QgY291bnQgPSBlLnRhcmdldCA/XG4gICAgICBlLnRhcmdldC5pbm5lckhUTUwgOlxuICAgICAgZS5pbm5lckhUTUw7XG5cbiAgICAgIGNvbnN0IHBsYXRmb3JtID0gZS50YXJnZXQgP1xuICAgICAgZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY291bnQtdXJsJykgOlxuICAgICAgZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudC11cmwnKTtcblxuICAgICAgd2luZG93LmRhdGFMYXllci5wdXNoKHtcbiAgICAgICAgZXZlbnQ6ICdPcGVuU2hhcmUgQ291bnQnLFxuICAgICAgICBwbGF0Zm9ybSxcbiAgICAgICAgcmVzb3VyY2U6IGNvdW50LFxuICAgICAgICBhY3Rpdml0eTogJ2NvdW50JyxcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgc2V0VGFnTWFuYWdlcihjYik7XG4gICAgfSwgMTAwMCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gbGlzdGVuKGNiKSB7XG4gIC8vIGJpbmQgdG8gc2hhcmVkIGV2ZW50IG9uIGVhY2ggaW5kaXZpZHVhbCBub2RlXG4gIFtdLmZvckVhY2guY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1vcGVuLXNoYXJlXScpLCAobm9kZSkgPT4ge1xuICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcignT3BlblNoYXJlLnNoYXJlZCcsIGNiKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGdldENvdW50cyhjYikge1xuICBjb25zdCBjb3VudE5vZGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1vcGVuLXNoYXJlLWNvdW50XScpO1xuXG4gIFtdLmZvckVhY2guY2FsbChjb3VudE5vZGUsIChub2RlKSA9PiB7XG4gICAgaWYgKG5vZGUudGV4dENvbnRlbnQpIGNiKG5vZGUpO1xuICAgIGVsc2Ugbm9kZS5hZGRFdmVudExpc3RlbmVyKGBPcGVuU2hhcmUuY291bnRlZC0ke25vZGUuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY291bnQtdXJsJyl9YCwgY2IpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gb25TaGFyZVRhZ01hbmdlcihlKSB7XG4gIGNvbnN0IHBsYXRmb3JtID0gZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUnKTtcbiAgY29uc3QgdGFyZ2V0ID0gZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtbGluaycpIHx8XG4gICAgZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdXJsJykgfHxcbiAgICBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS11c2VybmFtZScpIHx8XG4gICAgZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY2VudGVyJykgfHxcbiAgICBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1zZWFyY2gnKSB8fFxuICAgIGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWJvZHknKTtcblxuICB3aW5kb3cuZGF0YUxheWVyLnB1c2goe1xuICAgIGV2ZW50OiAnT3BlblNoYXJlIFNoYXJlJyxcbiAgICBwbGF0Zm9ybSxcbiAgICByZXNvdXJjZTogdGFyZ2V0LFxuICAgIGFjdGl2aXR5OiAnc2hhcmUnLFxuICB9KTtcbn1cbiIsImltcG9ydCBJbml0IGZyb20gJy4vbGliL2luaXQnO1xuaW1wb3J0IGNiIGZyb20gJy4vbGliL2luaXRpYWxpemVDb3VudE5vZGUnO1xuXG5mdW5jdGlvbiBpbml0KCkge1xuICBJbml0KHtcbiAgICBhcGk6ICdjb3VudCcsXG4gICAgc2VsZWN0b3I6ICdbZGF0YS1vcGVuLXNoYXJlLWNvdW50XTpub3QoW2RhdGEtb3Blbi1zaGFyZS1ub2RlXSknLFxuICAgIGNiLFxuICB9KSgpO1xufVxuZXhwb3J0IGRlZmF1bHQgKCkgPT4ge1xuICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2NvbXBsZXRlJykge1xuICAgIGluaXQoKTtcbiAgfVxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdyZWFkeXN0YXRlY2hhbmdlJywgKCkgPT4ge1xuICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnY29tcGxldGUnKSB7XG4gICAgICBpbml0KCk7XG4gICAgfVxuICB9LCBmYWxzZSk7XG4gIHJldHVybiByZXF1aXJlKCcuL3NyYy9tb2R1bGVzL2NvdW50LWFwaScpKCk7XG59O1xuIiwiZnVuY3Rpb24gcm91bmQoeCwgcHJlY2lzaW9uKSB7XG4gIGlmICh0eXBlb2YgeCAhPT0gJ251bWJlcicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFeHBlY3RlZCB2YWx1ZSB0byBiZSBhIG51bWJlcicpO1xuICB9XG5cbiAgY29uc3QgZXhwb25lbnQgPSBwcmVjaXNpb24gPiAwID8gJ2UnIDogJ2UtJztcbiAgY29uc3QgZXhwb25lbnROZWcgPSBwcmVjaXNpb24gPiAwID8gJ2UtJyA6ICdlJztcbiAgcHJlY2lzaW9uID0gTWF0aC5hYnMocHJlY2lzaW9uKTtcblxuICByZXR1cm4gTnVtYmVyKE1hdGgucm91bmQoeCArIGV4cG9uZW50ICsgcHJlY2lzaW9uKSArIGV4cG9uZW50TmVnICsgcHJlY2lzaW9uKTtcbn1cblxuZnVuY3Rpb24gdGhvdXNhbmRpZnkobnVtKSB7XG4gIHJldHVybiBgJHtyb3VuZChudW0gLyAxMDAwLCAxKX1LYDtcbn1cblxuZnVuY3Rpb24gbWlsbGlvbmlmeShudW0pIHtcbiAgcmV0dXJuIGAke3JvdW5kKG51bSAvIDEwMDAwMDAsIDEpfU1gO1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjb3VudFJlZHVjZShlbCwgY291bnQsIGNiKSB7XG4gIGlmIChjb3VudCA+IDk5OTk5OSkge1xuICAgIGVsLmlubmVySFRNTCA9IG1pbGxpb25pZnkoY291bnQpO1xuICAgIGlmIChjYiAmJiB0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpIGNiKGVsKTtcbiAgfSBlbHNlIGlmIChjb3VudCA+IDk5OSkge1xuICAgIGVsLmlubmVySFRNTCA9IHRob3VzYW5kaWZ5KGNvdW50KTtcbiAgICBpZiAoY2IgJiYgdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSBjYihlbCk7XG4gIH0gZWxzZSB7XG4gICAgZWwuaW5uZXJIVE1MID0gY291bnQ7XG4gICAgaWYgKGNiICYmIHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykgY2IoZWwpO1xuICB9XG59XG4iLCIvLyB0eXBlIGNvbnRhaW5zIGEgZGFzaFxuLy8gdHJhbnNmb3JtIHRvIGNhbWVsY2FzZSBmb3IgZnVuY3Rpb24gcmVmZXJlbmNlXG4vLyBUT0RPOiBvbmx5IHN1cHBvcnRzIHNpbmdsZSBkYXNoLCBzaG91bGQgc2hvdWxkIHN1cHBvcnQgbXVsdGlwbGVcbmV4cG9ydCBkZWZhdWx0IChkYXNoLCB0eXBlKSA9PiB7XG4gIGNvbnN0IG5leHRDaGFyID0gdHlwZS5zdWJzdHIoZGFzaCArIDEsIDEpO1xuICBjb25zdCBncm91cCA9IHR5cGUuc3Vic3RyKGRhc2gsIDIpO1xuXG4gIHR5cGUgPSB0eXBlLnJlcGxhY2UoZ3JvdXAsIG5leHRDaGFyLnRvVXBwZXJDYXNlKCkpO1xuICByZXR1cm4gdHlwZTtcbn07XG4iLCJpbXBvcnQgaW5pdGlhbGl6ZU5vZGVzIGZyb20gJy4vaW5pdGlhbGl6ZU5vZGVzJztcbmltcG9ydCBpbml0aWFsaXplV2F0Y2hlciBmcm9tICcuL2luaXRpYWxpemVXYXRjaGVyJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gaW5pdChvcHRzKSB7XG4gIHJldHVybiAoKSA9PiB7XG4gICAgY29uc3QgaW5pdE5vZGVzID0gaW5pdGlhbGl6ZU5vZGVzKHtcbiAgICAgIGFwaTogb3B0cy5hcGkgfHwgbnVsbCxcbiAgICAgIGNvbnRhaW5lcjogb3B0cy5jb250YWluZXIgfHwgZG9jdW1lbnQsXG4gICAgICBzZWxlY3Rvcjogb3B0cy5zZWxlY3RvcixcbiAgICAgIGNiOiBvcHRzLmNiLFxuICAgIH0pO1xuXG4gICAgaW5pdE5vZGVzKCk7XG5cbiAgICAvLyBjaGVjayBmb3IgbXV0YXRpb24gb2JzZXJ2ZXJzIGJlZm9yZSB1c2luZywgSUUxMSBvbmx5XG4gICAgaWYgKHdpbmRvdy5NdXRhdGlvbk9ic2VydmVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGluaXRpYWxpemVXYXRjaGVyKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLW9wZW4tc2hhcmUtd2F0Y2hdJyksIGluaXROb2Rlcyk7XG4gICAgfVxuICB9O1xufVxuIiwiaW1wb3J0IENvdW50IGZyb20gJy4uL3NyYy9tb2R1bGVzL2NvdW50JztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gaW5pdGlhbGl6ZUNvdW50Tm9kZShvcykge1xuICAvLyBpbml0aWFsaXplIG9wZW4gc2hhcmUgb2JqZWN0IHdpdGggdHlwZSBhdHRyaWJ1dGVcbiAgY29uc3QgdHlwZSA9IG9zLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50Jyk7XG4gIGNvbnN0IHVybCA9IG9zLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50LXJlcG8nKSB8fFxuICAgICAgb3MuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY291bnQtc2hvdCcpIHx8XG4gICAgICBvcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudC11cmwnKTtcbiAgY29uc3QgY291bnQgPSBuZXcgQ291bnQodHlwZSwgdXJsKTtcblxuICBjb3VudC5jb3VudChvcyk7XG4gIG9zLnNldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLW5vZGUnLCB0eXBlKTtcbn1cbiIsImltcG9ydCBFdmVudHMgZnJvbSAnLi4vc3JjL21vZHVsZXMvZXZlbnRzJztcbmltcG9ydCBhbmFseXRpY3MgZnJvbSAnLi4vYW5hbHl0aWNzJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gaW5pdGlhbGl6ZU5vZGVzKG9wdHMpIHtcbiAgLy8gbG9vcCB0aHJvdWdoIG9wZW4gc2hhcmUgbm9kZSBjb2xsZWN0aW9uXG4gIHJldHVybiAoKSA9PiB7XG4gICAgLy8gY2hlY2sgZm9yIGFuYWx5dGljc1xuICAgIGNoZWNrQW5hbHl0aWNzKCk7XG5cbiAgICBpZiAob3B0cy5hcGkpIHtcbiAgICAgIGNvbnN0IG5vZGVzID0gb3B0cy5jb250YWluZXIucXVlcnlTZWxlY3RvckFsbChvcHRzLnNlbGVjdG9yKTtcbiAgICAgIFtdLmZvckVhY2guY2FsbChub2Rlcywgb3B0cy5jYik7XG5cbiAgICAgIC8vIHRyaWdnZXIgY29tcGxldGVkIGV2ZW50XG4gICAgICBFdmVudHMudHJpZ2dlcihkb2N1bWVudCwgYCR7b3B0cy5hcGl9LWxvYWRlZGApO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBsb29wIHRocm91Z2ggb3BlbiBzaGFyZSBub2RlIGNvbGxlY3Rpb25cbiAgICAgIGNvbnN0IHNoYXJlTm9kZXMgPSBvcHRzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKG9wdHMuc2VsZWN0b3Iuc2hhcmUpO1xuICAgICAgW10uZm9yRWFjaC5jYWxsKHNoYXJlTm9kZXMsIG9wdHMuY2Iuc2hhcmUpO1xuXG4gICAgICAvLyB0cmlnZ2VyIGNvbXBsZXRlZCBldmVudFxuICAgICAgRXZlbnRzLnRyaWdnZXIoZG9jdW1lbnQsICdzaGFyZS1sb2FkZWQnKTtcblxuICAgICAgLy8gbG9vcCB0aHJvdWdoIGNvdW50IG5vZGUgY29sbGVjdGlvblxuICAgICAgY29uc3QgY291bnROb2RlcyA9IG9wdHMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwob3B0cy5zZWxlY3Rvci5jb3VudCk7XG4gICAgICBbXS5mb3JFYWNoLmNhbGwoY291bnROb2Rlcywgb3B0cy5jYi5jb3VudCk7XG5cbiAgICAgIC8vIHRyaWdnZXIgY29tcGxldGVkIGV2ZW50XG4gICAgICBFdmVudHMudHJpZ2dlcihkb2N1bWVudCwgJ2NvdW50LWxvYWRlZCcpO1xuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gY2hlY2tBbmFseXRpY3MoKSB7XG4gIC8vIGNoZWNrIGZvciBhbmFseXRpY3NcbiAgaWYgKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLW9wZW4tc2hhcmUtYW5hbHl0aWNzXScpKSB7XG4gICAgY29uc3QgcHJvdmlkZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbZGF0YS1vcGVuLXNoYXJlLWFuYWx5dGljc10nKVxuICAgICAgLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWFuYWx5dGljcycpO1xuXG4gICAgaWYgKHByb3ZpZGVyLmluZGV4T2YoJywnKSA+IC0xKSB7XG4gICAgICBjb25zdCBwcm92aWRlcnMgPSBwcm92aWRlci5zcGxpdCgnLCcpO1xuICAgICAgcHJvdmlkZXJzLmZvckVhY2gocCA9PiBhbmFseXRpY3MocCkpO1xuICAgIH0gZWxzZSBhbmFseXRpY3MocHJvdmlkZXIpO1xuICB9XG59XG4iLCJpbXBvcnQgU2hhcmVUcmFuc2Zvcm1zIGZyb20gJy4uL3NyYy9tb2R1bGVzL3NoYXJlLXRyYW5zZm9ybXMnO1xuaW1wb3J0IE9wZW5TaGFyZSBmcm9tICcuLi9zcmMvbW9kdWxlcy9vcGVuLXNoYXJlJztcbmltcG9ydCBzZXREYXRhIGZyb20gJy4vc2V0RGF0YSc7XG5pbXBvcnQgc2hhcmUgZnJvbSAnLi9zaGFyZSc7XG5pbXBvcnQgZGFzaFRvQ2FtZWwgZnJvbSAnLi9kYXNoVG9DYW1lbCc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGluaXRpYWxpemVTaGFyZU5vZGUob3MpIHtcbiAgLy8gaW5pdGlhbGl6ZSBvcGVuIHNoYXJlIG9iamVjdCB3aXRoIHR5cGUgYXR0cmlidXRlXG4gIGxldCB0eXBlID0gb3MuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUnKTtcbiAgY29uc3QgZGFzaCA9IHR5cGUuaW5kZXhPZignLScpO1xuXG4gIGlmIChkYXNoID4gLTEpIHtcbiAgICB0eXBlID0gZGFzaFRvQ2FtZWwoZGFzaCwgdHlwZSk7XG4gIH1cblxuICBjb25zdCB0cmFuc2Zvcm0gPSBTaGFyZVRyYW5zZm9ybXNbdHlwZV07XG5cbiAgaWYgKCF0cmFuc2Zvcm0pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYE9wZW4gU2hhcmU6ICR7dHlwZX0gaXMgYW4gaW52YWxpZCB0eXBlYCk7XG4gIH1cblxuICBjb25zdCBvcGVuU2hhcmUgPSBuZXcgT3BlblNoYXJlKHR5cGUsIHRyYW5zZm9ybSk7XG5cbiAgLy8gc3BlY2lmeSBpZiB0aGlzIGlzIGEgZHluYW1pYyBpbnN0YW5jZVxuICBpZiAob3MuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtZHluYW1pYycpKSB7XG4gICAgb3BlblNoYXJlLmR5bmFtaWMgPSB0cnVlO1xuICB9XG5cbiAgLy8gc3BlY2lmeSBpZiB0aGlzIGlzIGEgcG9wdXAgaW5zdGFuY2VcbiAgaWYgKG9zLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXBvcHVwJykpIHtcbiAgICBvcGVuU2hhcmUucG9wdXAgPSB0cnVlO1xuICB9XG5cbiAgLy8gc2V0IGFsbCBvcHRpb25hbCBhdHRyaWJ1dGVzIG9uIG9wZW4gc2hhcmUgaW5zdGFuY2VcbiAgc2V0RGF0YShvcGVuU2hhcmUsIG9zKTtcblxuICAvLyBvcGVuIHNoYXJlIGRpYWxvZyBvbiBjbGlja1xuICBvcy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XG4gICAgc2hhcmUoZSwgb3MsIG9wZW5TaGFyZSk7XG4gIH0pO1xuXG4gIG9zLmFkZEV2ZW50TGlzdGVuZXIoJ09wZW5TaGFyZS50cmlnZ2VyJywgKGUpID0+IHtcbiAgICBzaGFyZShlLCBvcywgb3BlblNoYXJlKTtcbiAgfSk7XG5cbiAgb3Muc2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtbm9kZScsIHR5cGUpO1xufVxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gaW5pdGlhbGl6ZVdhdGNoZXIod2F0Y2hlciwgZm4pIHtcbiAgW10uZm9yRWFjaC5jYWxsKHdhdGNoZXIsICh3KSA9PiB7XG4gICAgY29uc3Qgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcigobXV0YXRpb25zKSA9PiB7XG4gICAgICAvLyB0YXJnZXQgd2lsbCBtYXRjaCBiZXR3ZWVuIGFsbCBtdXRhdGlvbnMgc28ganVzdCB1c2UgZmlyc3RcbiAgICAgIGZuKG11dGF0aW9uc1swXS50YXJnZXQpO1xuICAgIH0pO1xuXG4gICAgb2JzZXJ2ZXIub2JzZXJ2ZSh3LCB7XG4gICAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgfSk7XG4gIH0pO1xufVxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gc2V0RGF0YShvc0luc3RhbmNlLCBvc0VsZW1lbnQpIHtcbiAgb3NJbnN0YW5jZS5zZXREYXRhKHtcbiAgICB1cmw6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS11cmwnKSxcbiAgICB0ZXh0OiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdGV4dCcpLFxuICAgIHZpYTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXZpYScpLFxuICAgIGhhc2h0YWdzOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtaGFzaHRhZ3MnKSxcbiAgICB0d2VldElkOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdHdlZXQtaWQnKSxcbiAgICByZWxhdGVkOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtcmVsYXRlZCcpLFxuICAgIHNjcmVlbk5hbWU6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1zY3JlZW4tbmFtZScpLFxuICAgIHVzZXJJZDogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXVzZXItaWQnKSxcbiAgICBsaW5rOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtbGluaycpLFxuICAgIHBpY3R1cmU6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1waWN0dXJlJyksXG4gICAgY2FwdGlvbjogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNhcHRpb24nKSxcbiAgICBkZXNjcmlwdGlvbjogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWRlc2NyaXB0aW9uJyksXG4gICAgdXNlcjogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXVzZXInKSxcbiAgICB2aWRlbzogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXZpZGVvJyksXG4gICAgdXNlcm5hbWU6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS11c2VybmFtZScpLFxuICAgIHRpdGxlOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdGl0bGUnKSxcbiAgICBtZWRpYTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLW1lZGlhJyksXG4gICAgdG86IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS10bycpLFxuICAgIHN1YmplY3Q6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1zdWJqZWN0JyksXG4gICAgYm9keTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWJvZHknKSxcbiAgICBpb3M6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1pb3MnKSxcbiAgICB0eXBlOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdHlwZScpLFxuICAgIGNlbnRlcjogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNlbnRlcicpLFxuICAgIHZpZXdzOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdmlld3MnKSxcbiAgICB6b29tOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtem9vbScpLFxuICAgIHNlYXJjaDogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXNlYXJjaCcpLFxuICAgIHNhZGRyOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtc2FkZHInKSxcbiAgICBkYWRkcjogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWRhZGRyJyksXG4gICAgZGlyZWN0aW9uc21vZGU6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1kaXJlY3Rpb25zLW1vZGUnKSxcbiAgICByZXBvOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtcmVwbycpLFxuICAgIHNob3Q6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1zaG90JyksXG4gICAgcGVuOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtcGVuJyksXG4gICAgdmlldzogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXZpZXcnKSxcbiAgICBpc3N1ZTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWlzc3VlJyksXG4gICAgYnV0dG9uSWQ6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1idXR0b25JZCcpLFxuICAgIHBvcFVwOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtcG9wdXAnKSxcbiAgICBrZXk6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1rZXknKSxcbiAgfSk7XG59XG4iLCJpbXBvcnQgRXZlbnRzIGZyb20gJy4uL3NyYy9tb2R1bGVzL2V2ZW50cyc7XG5pbXBvcnQgc2V0RGF0YSBmcm9tICcuL3NldERhdGEnO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBzaGFyZShlLCBvcywgb3BlblNoYXJlKSB7XG4gIC8vIGlmIGR5bmFtaWMgaW5zdGFuY2UgdGhlbiBmZXRjaCBhdHRyaWJ1dGVzIGFnYWluIGluIGNhc2Ugb2YgdXBkYXRlc1xuICBpZiAob3BlblNoYXJlLmR5bmFtaWMpIHtcbiAgICBzZXREYXRhKG9wZW5TaGFyZSwgb3MpO1xuICB9XG5cbiAgb3BlblNoYXJlLnNoYXJlKGUpO1xuXG4gIC8vIHRyaWdnZXIgc2hhcmVkIGV2ZW50XG4gIEV2ZW50cy50cmlnZ2VyKG9zLCAnc2hhcmVkJyk7XG59XG4iLCIvKlxuICAgU29tZXRpbWVzIHNvY2lhbCBwbGF0Zm9ybXMgZ2V0IGNvbmZ1c2VkIGFuZCBkcm9wIHNoYXJlIGNvdW50cy5cbiAgIEluIHRoaXMgbW9kdWxlIHdlIGNoZWNrIGlmIHRoZSByZXR1cm5lZCBjb3VudCBpcyBsZXNzIHRoYW4gdGhlIGNvdW50IGluXG4gICBsb2NhbHN0b3JhZ2UuXG4gICBJZiB0aGUgbG9jYWwgY291bnQgaXMgZ3JlYXRlciB0aGFuIHRoZSByZXR1cm5lZCBjb3VudCxcbiAgIHdlIHN0b3JlIHRoZSBsb2NhbCBjb3VudCArIHRoZSByZXR1cm5lZCBjb3VudC5cbiAgIE90aGVyd2lzZSwgc3RvcmUgdGhlIHJldHVybmVkIGNvdW50LlxuKi9cblxuZXhwb3J0IGRlZmF1bHQgKHQsIGNvdW50KSA9PiB7XG4gIGNvbnN0IGlzQXJyID0gdC50eXBlLmluZGV4T2YoJywnKSA+IC0xO1xuICBjb25zdCBsb2NhbCA9IE51bWJlcih0LnN0b3JlR2V0KGAke3QudHlwZX0tJHt0LnNoYXJlZH1gKSk7XG5cbiAgaWYgKGxvY2FsID4gY291bnQgJiYgIWlzQXJyKSB7XG4gICAgY29uc3QgbGF0ZXN0Q291bnQgPSBOdW1iZXIodC5zdG9yZUdldChgJHt0LnR5cGV9LSR7dC5zaGFyZWR9LWxhdGVzdENvdW50YCkpO1xuICAgIHQuc3RvcmVTZXQoYCR7dC50eXBlfS0ke3Quc2hhcmVkfS1sYXRlc3RDb3VudGAsIGNvdW50KTtcblxuICAgIGNvdW50ID0gaXNOdW1lcmljKGxhdGVzdENvdW50KSAmJiBsYXRlc3RDb3VudCA+IDAgP1xuICAgICAgY291bnQgKz0gbG9jYWwgLSBsYXRlc3RDb3VudCA6XG4gICAgICBjb3VudCArPSBsb2NhbDtcbiAgfVxuXG4gIGlmICghaXNBcnIpIHQuc3RvcmVTZXQoYCR7dC50eXBlfS0ke3Quc2hhcmVkfWAsIGNvdW50KTtcbiAgcmV0dXJuIGNvdW50O1xufTtcblxuZnVuY3Rpb24gaXNOdW1lcmljKG4pIHtcbiAgcmV0dXJuICFpc05hTihwYXJzZUZsb2F0KG4pKSAmJiBpc0Zpbml0ZShuKTtcbn1cbiIsImltcG9ydCBJbml0IGZyb20gJy4vbGliL2luaXQnO1xuaW1wb3J0IGNiIGZyb20gJy4vbGliL2luaXRpYWxpemVTaGFyZU5vZGUnO1xuaW1wb3J0IGNvdW50QVBJIGZyb20gJy4vc3JjL21vZHVsZXMvY291bnQtYXBpJztcblxuZnVuY3Rpb24gaW5pdCgpIHtcbiAgSW5pdCh7XG4gICAgYXBpOiAnc2hhcmUnLFxuICAgIHNlbGVjdG9yOiAnW2RhdGEtb3Blbi1zaGFyZV06bm90KFtkYXRhLW9wZW4tc2hhcmUtbm9kZV0pJyxcbiAgICBjYixcbiAgfSkoKTtcbn1cbmV4cG9ydCBkZWZhdWx0ICgpID0+IHtcbiAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdjb21wbGV0ZScpIHtcbiAgICBpbml0KCk7XG4gIH1cbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncmVhZHlzdGF0ZWNoYW5nZScsICgpID0+IHtcbiAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2NvbXBsZXRlJykge1xuICAgICAgaW5pdCgpO1xuICAgIH1cbiAgfSwgZmFsc2UpO1xuICByZXR1cm4gY291bnRBUEkoKTtcbn07XG4iLCIvKipcbiAqIGNvdW50IEFQSVxuICovXG5cbmltcG9ydCBjb3VudCBmcm9tICcuL2NvdW50JztcblxuZXhwb3J0IGRlZmF1bHQgKCkgPT4geyAvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgLy8gZ2xvYmFsIE9wZW5TaGFyZSByZWZlcmVuY2luZyBpbnRlcm5hbCBjbGFzcyBmb3IgaW5zdGFuY2UgZ2VuZXJhdGlvblxuICBjbGFzcyBDb3VudCB7XG5cbiAgICBjb25zdHJ1Y3Rvcih7XG4gICAgICB0eXBlLFxuICAgICAgdXJsLFxuICAgICAgYXBwZW5kVG8gPSBmYWxzZSxcbiAgICAgIGVsZW1lbnQsXG4gICAgICBjbGFzc2VzLFxuICAgICAga2V5ID0gbnVsbCxcbiAgICB9LCBjYikge1xuICAgICAgY29uc3QgY291bnROb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChlbGVtZW50IHx8ICdzcGFuJyk7XG5cbiAgICAgIGNvdW50Tm9kZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudCcsIHR5cGUpO1xuICAgICAgY291bnROb2RlLnNldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50LXVybCcsIHVybCk7XG4gICAgICBpZiAoa2V5KSBjb3VudE5vZGUuc2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUta2V5Jywga2V5KTtcblxuICAgICAgY291bnROb2RlLmNsYXNzTGlzdC5hZGQoJ29wZW4tc2hhcmUtY291bnQnKTtcblxuICAgICAgaWYgKGNsYXNzZXMgJiYgQXJyYXkuaXNBcnJheShjbGFzc2VzKSkge1xuICAgICAgICBjbGFzc2VzLmZvckVhY2goKGNzc0NMYXNzKSA9PiB7XG4gICAgICAgICAgY291bnROb2RlLmNsYXNzTGlzdC5hZGQoY3NzQ0xhc3MpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKGFwcGVuZFRvKSB7XG4gICAgICAgIHJldHVybiBuZXcgY291bnQodHlwZSwgdXJsKS5jb3VudChjb3VudE5vZGUsIGNiLCBhcHBlbmRUbyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXcgY291bnQodHlwZSwgdXJsKS5jb3VudChjb3VudE5vZGUsIGNiKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gQ291bnQ7XG59O1xuIiwiaW1wb3J0IGNvdW50UmVkdWNlIGZyb20gJy4uLy4uL2xpYi9jb3VudFJlZHVjZSc7XG5pbXBvcnQgc3RvcmVDb3VudCBmcm9tICcuLi8uLi9saWIvc3RvcmVDb3VudCc7XG4vKipcbiAqIE9iamVjdCBvZiB0cmFuc2Zvcm0gZnVuY3Rpb25zIGZvciBlYWNoIG9wZW5zaGFyZSBhcGlcbiAqIFRyYW5zZm9ybSBmdW5jdGlvbnMgcGFzc2VkIGludG8gT3BlblNoYXJlIGluc3RhbmNlIHdoZW4gaW5zdGFudGlhdGVkXG4gKiBSZXR1cm4gb2JqZWN0IGNvbnRhaW5pbmcgVVJMIGFuZCBrZXkvdmFsdWUgYXJnc1xuICovXG5leHBvcnQgZGVmYXVsdCB7XG5cbiAgLy8gZmFjZWJvb2sgY291bnQgZGF0YVxuICBmYWNlYm9vayh1cmwpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ2dldCcsXG4gICAgICB1cmw6IGBodHRwczovL2dyYXBoLmZhY2Vib29rLmNvbS8/aWQ9JHt1cmx9YCxcbiAgICAgIHRyYW5zZm9ybSh4aHIpIHtcbiAgICAgICAgY29uc3QgZmIgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpO1xuXG4gICAgICAgIGNvbnN0IGNvdW50ID0gZmIuc2hhcmUgJiYgZmIuc2hhcmUuc2hhcmVfY291bnQgfHwgMDtcblxuICAgICAgICByZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBjb3VudCk7XG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbi8vIHBpbnRlcmVzdCBjb3VudCBkYXRhXG4gIHBpbnRlcmVzdCh1cmwpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ2pzb25wJyxcbiAgICAgIHVybDogYGh0dHBzOi8vYXBpLnBpbnRlcmVzdC5jb20vdjEvdXJscy9jb3VudC5qc29uP2NhbGxiYWNrPT8mdXJsPSR7dXJsfWAsXG4gICAgICB0cmFuc2Zvcm0oZGF0YSkge1xuICAgICAgICBjb25zdCBjb3VudCA9IGRhdGEuY291bnQ7XG4gICAgICAgIHJldHVybiBzdG9yZUNvdW50KHRoaXMsIGNvdW50KTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBsaW5rZWRpbiBjb3VudCBkYXRhXG4gIGxpbmtlZGluKHVybCkge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiAnanNvbnAnLFxuICAgICAgdXJsOiBgaHR0cHM6Ly93d3cubGlua2VkaW4uY29tL2NvdW50c2Vydi9jb3VudC9zaGFyZT91cmw9JHt1cmx9JmZvcm1hdD1qc29ucCZjYWxsYmFjaz0/YCxcbiAgICAgIHRyYW5zZm9ybShkYXRhKSB7XG4gICAgICAgIGNvbnN0IGNvdW50ID0gZGF0YS5jb3VudDtcbiAgICAgICAgcmV0dXJuIHN0b3JlQ291bnQodGhpcywgY291bnQpO1xuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHJlZGRpdCBjb3VudCBkYXRhXG4gIHJlZGRpdCh1cmwpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ2dldCcsXG4gICAgICB1cmw6IGBodHRwczovL3d3dy5yZWRkaXQuY29tL2FwaS9pbmZvLmpzb24/dXJsPSR7dXJsfWAsXG4gICAgICB0cmFuc2Zvcm0oeGhyKSB7XG4gICAgICAgIGNvbnN0IHBvc3RzID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KS5kYXRhLmNoaWxkcmVuO1xuICAgICAgICBsZXQgdXBzID0gMDtcblxuICAgICAgICBwb3N0cy5mb3JFYWNoKChwb3N0KSA9PiB7XG4gICAgICAgICAgdXBzICs9IE51bWJlcihwb3N0LmRhdGEudXBzKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHN0b3JlQ291bnQodGhpcywgdXBzKTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuLy8gZ29vZ2xlIGNvdW50IGRhdGFcbiAgZ29vZ2xlKHVybCkge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiAncG9zdCcsXG4gICAgICBkYXRhOiB7XG4gICAgICAgIG1ldGhvZDogJ3Bvcy5wbHVzb25lcy5nZXQnLFxuICAgICAgICBpZDogJ3AnLFxuICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICBub2xvZzogdHJ1ZSxcbiAgICAgICAgICBpZDogdXJsLFxuICAgICAgICAgIHNvdXJjZTogJ3dpZGdldCcsXG4gICAgICAgICAgdXNlcklkOiAnQHZpZXdlcicsXG4gICAgICAgICAgZ3JvdXBJZDogJ0BzZWxmJyxcbiAgICAgICAgfSxcbiAgICAgICAganNvbnJwYzogJzIuMCcsXG4gICAgICAgIGtleTogJ3AnLFxuICAgICAgICBhcGlWZXJzaW9uOiAndjEnLFxuICAgICAgfSxcbiAgICAgIHVybDogJ2h0dHBzOi8vY2xpZW50czYuZ29vZ2xlLmNvbS9ycGMnLFxuICAgICAgdHJhbnNmb3JtKHhocikge1xuICAgICAgICBjb25zdCBjb3VudCA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCkucmVzdWx0Lm1ldGFkYXRhLmdsb2JhbENvdW50cy5jb3VudDtcbiAgICAgICAgcmV0dXJuIHN0b3JlQ291bnQodGhpcywgY291bnQpO1xuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIGdpdGh1YiBzdGFyIGNvdW50XG4gIGdpdGh1YlN0YXJzKHJlcG8pIHtcbiAgICByZXBvID0gcmVwby5pbmRleE9mKCdnaXRodWIuY29tLycpID4gLTEgP1xuICAgIHJlcG8uc3BsaXQoJ2dpdGh1Yi5jb20vJylbMV0gOlxuICAgIHJlcG87XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6ICdnZXQnLFxuICAgICAgdXJsOiBgaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9yZXBvcy8ke3JlcG99YCxcbiAgICAgIHRyYW5zZm9ybSh4aHIpIHtcbiAgICAgICAgY29uc3QgY291bnQgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpLnN0YXJnYXplcnNfY291bnQ7XG4gICAgICAgIHJldHVybiBzdG9yZUNvdW50KHRoaXMsIGNvdW50KTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBnaXRodWIgZm9ya3MgY291bnRcbiAgZ2l0aHViRm9ya3MocmVwbykge1xuICAgIHJlcG8gPSByZXBvLmluZGV4T2YoJ2dpdGh1Yi5jb20vJykgPiAtMSA/XG4gICAgcmVwby5zcGxpdCgnZ2l0aHViLmNvbS8nKVsxXSA6XG4gICAgcmVwbztcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ2dldCcsXG4gICAgICB1cmw6IGBodHRwczovL2FwaS5naXRodWIuY29tL3JlcG9zLyR7cmVwb31gLFxuICAgICAgdHJhbnNmb3JtKHhocikge1xuICAgICAgICBjb25zdCBjb3VudCA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCkuZm9ya3NfY291bnQ7XG4gICAgICAgIHJldHVybiBzdG9yZUNvdW50KHRoaXMsIGNvdW50KTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBnaXRodWIgd2F0Y2hlcnMgY291bnRcbiAgZ2l0aHViV2F0Y2hlcnMocmVwbykge1xuICAgIHJlcG8gPSByZXBvLmluZGV4T2YoJ2dpdGh1Yi5jb20vJykgPiAtMSA/XG4gICAgcmVwby5zcGxpdCgnZ2l0aHViLmNvbS8nKVsxXSA6XG4gICAgcmVwbztcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ2dldCcsXG4gICAgICB1cmw6IGBodHRwczovL2FwaS5naXRodWIuY29tL3JlcG9zLyR7cmVwb31gLFxuICAgICAgdHJhbnNmb3JtKHhocikge1xuICAgICAgICBjb25zdCBjb3VudCA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCkud2F0Y2hlcnNfY291bnQ7XG4gICAgICAgIHJldHVybiBzdG9yZUNvdW50KHRoaXMsIGNvdW50KTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBkcmliYmJsZSBsaWtlcyBjb3VudFxuICBkcmliYmJsZShzaG90KSB7XG4gICAgc2hvdCA9IHNob3QuaW5kZXhPZignZHJpYmJibGUuY29tL3Nob3RzJykgPiAtMSA/XG4gICAgc2hvdC5zcGxpdCgnc2hvdHMvJylbMV0gOlxuICAgIHNob3Q7XG4gICAgY29uc3QgdXJsID0gYGh0dHBzOi8vYXBpLmRyaWJiYmxlLmNvbS92MS9zaG90cy8ke3Nob3R9L2xpa2VzYDtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ2dldCcsXG4gICAgICB1cmwsXG4gICAgICB0cmFuc2Zvcm0oeGhyLCBFdmVudHMpIHtcbiAgICAgICAgY29uc3QgY291bnQgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpLmxlbmd0aDtcblxuICAgICAgICAvLyBhdCB0aGlzIHRpbWUgZHJpYmJibGUgbGltaXRzIGEgcmVzcG9uc2Ugb2YgMTIgbGlrZXMgcGVyIHBhZ2VcbiAgICAgICAgaWYgKGNvdW50ID09PSAxMikge1xuICAgICAgICAgIGNvbnN0IHBhZ2UgPSAyO1xuICAgICAgICAgIHJlY3Vyc2l2ZUNvdW50KHVybCwgcGFnZSwgY291bnQsIChmaW5hbENvdW50KSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5hcHBlbmRUbyAmJiB0eXBlb2YgdGhpcy5hcHBlbmRUbyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICB0aGlzLmFwcGVuZFRvLmFwcGVuZENoaWxkKHRoaXMub3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY291bnRSZWR1Y2UodGhpcy5vcywgZmluYWxDb3VudCwgdGhpcy5jYik7XG4gICAgICAgICAgICBFdmVudHMudHJpZ2dlcih0aGlzLm9zLCBgY291bnRlZC0ke3RoaXMudXJsfWApO1xuICAgICAgICAgICAgcmV0dXJuIHN0b3JlQ291bnQodGhpcywgZmluYWxDb3VudCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHN0b3JlQ291bnQodGhpcywgY291bnQpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgdHdpdHRlcih1cmwpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ2dldCcsXG4gICAgICB1cmw6IGBodHRwczovL2FwaS5vcGVuc2hhcmUuc29jaWFsL2pvYj91cmw9JHt1cmx9JmtleT1gLFxuICAgICAgdHJhbnNmb3JtKHhocikge1xuICAgICAgICBjb25zdCBjb3VudCA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCkuY291bnQ7XG4gICAgICAgIHJldHVybiBzdG9yZUNvdW50KHRoaXMsIGNvdW50KTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcbn07XG5cbmZ1bmN0aW9uIHJlY3Vyc2l2ZUNvdW50KHVybCwgcGFnZSwgY291bnQsIGNiKSB7XG4gIGNvbnN0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICB4aHIub3BlbignR0VUJywgYCR7dXJsfT9wYWdlPSR7cGFnZX1gKTtcbiAgeGhyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7IC8vZXNsaW50LWRpc2FibGUtbGluZVxuICAgIGNvbnN0IGxpa2VzID0gSlNPTi5wYXJzZSh0aGlzLnJlc3BvbnNlKTtcbiAgICBjb3VudCArPSBsaWtlcy5sZW5ndGg7XG5cbiAgICAvLyBkcmliYmJsZSBsaWtlIHBlciBwYWdlIGlzIDEyXG4gICAgaWYgKGxpa2VzLmxlbmd0aCA9PT0gMTIpIHtcbiAgICAgIHBhZ2UrKztcbiAgICAgIHJlY3Vyc2l2ZUNvdW50KHVybCwgcGFnZSwgY291bnQsIGNiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2IoY291bnQpO1xuICAgIH1cbiAgfSk7XG4gIHhoci5zZW5kKCk7XG59XG4iLCIvKipcbiAqIEdlbmVyYXRlIHNoYXJlIGNvdW50IGluc3RhbmNlIGZyb20gb25lIHRvIG1hbnkgbmV0d29ya3NcbiAqL1xuXG5pbXBvcnQgQ291bnRUcmFuc2Zvcm1zIGZyb20gJy4vY291bnQtdHJhbnNmb3Jtcyc7XG5pbXBvcnQgRXZlbnRzIGZyb20gJy4vZXZlbnRzJztcbmltcG9ydCBjb3VudFJlZHVjZSBmcm9tICcuLi8uLi9saWIvY291bnRSZWR1Y2UnO1xuaW1wb3J0IHN0b3JlQ291bnQgZnJvbSAnLi4vLi4vbGliL3N0b3JlQ291bnQnOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG5cbmZ1bmN0aW9uIGlzTnVtZXJpYyhuKSB7XG4gIHJldHVybiAhaXNOYU4ocGFyc2VGbG9hdChuKSkgJiYgaXNGaW5pdGUobik7XG59XG5cbmNsYXNzIENvdW50IHtcbiAgY29uc3RydWN0b3IodHlwZSwgdXJsKSB7XG4gICAgLy8gdGhyb3cgZXJyb3IgaWYgbm8gdXJsIHByb3ZpZGVkXG4gICAgaWYgKCF1cmwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignT3BlbiBTaGFyZTogbm8gdXJsIHByb3ZpZGVkIGZvciBjb3VudCcpO1xuICAgIH1cblxuICAgIC8vIGNoZWNrIGZvciBHaXRodWIgY291bnRzXG4gICAgaWYgKHR5cGUuaW5kZXhPZignZ2l0aHViJykgPT09IDApIHtcbiAgICAgIGlmICh0eXBlID09PSAnZ2l0aHViLXN0YXJzJykge1xuICAgICAgICB0eXBlID0gJ2dpdGh1YlN0YXJzJztcbiAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ2dpdGh1Yi1mb3JrcycpIHtcbiAgICAgICAgdHlwZSA9ICdnaXRodWJGb3Jrcyc7XG4gICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdnaXRodWItd2F0Y2hlcnMnKSB7XG4gICAgICAgIHR5cGUgPSAnZ2l0aHViV2F0Y2hlcnMnO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignSW52YWxpZCBHaXRodWIgY291bnQgdHlwZS4gVHJ5IGdpdGh1Yi1zdGFycywgZ2l0aHViLWZvcmtzLCBvciBnaXRodWItd2F0Y2hlcnMuJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gaWYgdHlwZSBpcyBjb21tYSBzZXBhcmF0ZSBsaXN0IGNyZWF0ZSBhcnJheVxuICAgIGlmICh0eXBlLmluZGV4T2YoJywnKSA+IC0xKSB7XG4gICAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgICAgdGhpcy50eXBlQXJyID0gdGhpcy50eXBlLnNwbGl0KCcsJyk7XG4gICAgICB0aGlzLmNvdW50RGF0YSA9IFtdO1xuXG4gICAgICAvLyBjaGVjayBlYWNoIHR5cGUgc3VwcGxpZWQgaXMgdmFsaWRcbiAgICAgIHRoaXMudHlwZUFyci5mb3JFYWNoKCh0KSA9PiB7XG4gICAgICAgIGlmICghQ291bnRUcmFuc2Zvcm1zW3RdKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBPcGVuIFNoYXJlOiAke3R5cGV9IGlzIGFuIGludmFsaWQgY291bnQgdHlwZWApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb3VudERhdGEucHVzaChDb3VudFRyYW5zZm9ybXNbdF0odXJsKSk7XG4gICAgICB9KTtcblxuICAgICAgLy8gdGhyb3cgZXJyb3IgaWYgaW52YWxpZCB0eXBlIHByb3ZpZGVkXG4gICAgfSBlbHNlIGlmICghQ291bnRUcmFuc2Zvcm1zW3R5cGVdKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYE9wZW4gU2hhcmU6ICR7dHlwZX0gaXMgYW4gaW52YWxpZCBjb3VudCB0eXBlYCk7XG5cbiAgICAgICAgLy8gc2luZ2xlIGNvdW50XG4gICAgICAgIC8vIHN0b3JlIGNvdW50IFVSTCBhbmQgdHJhbnNmb3JtIGZ1bmN0aW9uXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgICB0aGlzLmNvdW50RGF0YSA9IENvdW50VHJhbnNmb3Jtc1t0eXBlXSh1cmwpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGhhbmRsZSBjYWxsaW5nIGdldENvdW50IC8gZ2V0Q291bnRzXG4gIC8vIGRlcGVuZGluZyBvbiBudW1iZXIgb2YgdHlwZXNcbiAgY291bnQob3MsIGNiLCBhcHBlbmRUbykge1xuICAgIHRoaXMub3MgPSBvcztcbiAgICB0aGlzLmFwcGVuZFRvID0gYXBwZW5kVG87XG4gICAgdGhpcy5jYiA9IGNiO1xuICAgIHRoaXMudXJsID0gdGhpcy5vcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudCcpO1xuICAgIHRoaXMuc2hhcmVkID0gdGhpcy5vcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudC11cmwnKTtcbiAgICB0aGlzLmtleSA9IHRoaXMub3MuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUta2V5Jyk7XG5cbiAgICBpZiAoIUFycmF5LmlzQXJyYXkodGhpcy5jb3VudERhdGEpKSB7XG4gICAgICB0aGlzLmdldENvdW50KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZ2V0Q291bnRzKCk7XG4gICAgfVxuICB9XG5cbiAgLy8gZmV0Y2ggY291bnQgZWl0aGVyIEFKQVggb3IgSlNPTlBcbiAgZ2V0Q291bnQoKSB7XG4gICAgY29uc3QgY291bnQgPSB0aGlzLnN0b3JlR2V0KGAke3RoaXMudHlwZX0tJHt0aGlzLnNoYXJlZH1gKTtcblxuICAgIGlmIChjb3VudCkge1xuICAgICAgaWYgKHRoaXMuYXBwZW5kVG8gJiYgdHlwZW9mIHRoaXMuYXBwZW5kVG8gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhpcy5hcHBlbmRUby5hcHBlbmRDaGlsZCh0aGlzLm9zKTtcbiAgICAgIH1cbiAgICAgIGNvdW50UmVkdWNlKHRoaXMub3MsIGNvdW50KTtcbiAgICB9XG4gICAgdGhpc1t0aGlzLmNvdW50RGF0YS50eXBlXSh0aGlzLmNvdW50RGF0YSk7XG4gIH1cblxuICAvLyBmZXRjaCBtdWx0aXBsZSBjb3VudHMgYW5kIGFnZ3JlZ2F0ZVxuICBnZXRDb3VudHMoKSB7XG4gICAgdGhpcy50b3RhbCA9IFtdO1xuXG4gICAgY29uc3QgY291bnQgPSB0aGlzLnN0b3JlR2V0KGAke3RoaXMudHlwZX0tJHt0aGlzLnNoYXJlZH1gKTtcblxuICAgIGlmIChjb3VudCkge1xuICAgICAgaWYgKHRoaXMuYXBwZW5kVG8gJiYgdHlwZW9mIHRoaXMuYXBwZW5kVG8gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhpcy5hcHBlbmRUby5hcHBlbmRDaGlsZCh0aGlzLm9zKTtcbiAgICAgIH1cbiAgICAgIGNvdW50UmVkdWNlKHRoaXMub3MsIGNvdW50KTtcbiAgICB9XG5cbiAgICB0aGlzLmNvdW50RGF0YS5mb3JFYWNoKChjb3VudERhdGEpID0+IHtcbiAgICAgIHRoaXNbY291bnREYXRhLnR5cGVdKGNvdW50RGF0YSwgKG51bSkgPT4ge1xuICAgICAgICB0aGlzLnRvdGFsLnB1c2gobnVtKTtcblxuICAgICAgICAvLyB0b3RhbCBjb3VudHMgbGVuZ3RoIG5vdyBlcXVhbHMgdHlwZSBhcnJheSBsZW5ndGhcbiAgICAgICAgLy8gc28gYWdncmVnYXRlLCBzdG9yZSBhbmQgaW5zZXJ0IGludG8gRE9NXG4gICAgICAgIGlmICh0aGlzLnRvdGFsLmxlbmd0aCA9PT0gdGhpcy50eXBlQXJyLmxlbmd0aCkge1xuICAgICAgICAgIGxldCB0b3QgPSAwO1xuXG4gICAgICAgICAgdGhpcy50b3RhbC5mb3JFYWNoKCh0KSA9PiB7XG4gICAgICAgICAgICB0b3QgKz0gdDtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGlmICh0aGlzLmFwcGVuZFRvICYmIHR5cGVvZiB0aGlzLmFwcGVuZFRvICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aGlzLmFwcGVuZFRvLmFwcGVuZENoaWxkKHRoaXMub3MpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IGxvY2FsID0gTnVtYmVyKHRoaXMuc3RvcmVHZXQoYCR7dGhpcy50eXBlfS0ke3RoaXMuc2hhcmVkfWApKTtcbiAgICAgICAgICBpZiAobG9jYWwgPiB0b3QpIHtcbiAgICAgICAgICAgIGNvbnN0IGxhdGVzdENvdW50ID0gTnVtYmVyKHRoaXMuc3RvcmVHZXQoYCR7dGhpcy50eXBlfS0ke3RoaXMuc2hhcmVkfS1sYXRlc3RDb3VudGApKTtcbiAgICAgICAgICAgIHRoaXMuc3RvcmVTZXQoYCR7dGhpcy50eXBlfS0ke3RoaXMuc2hhcmVkfS1sYXRlc3RDb3VudGAsIHRvdCk7XG5cbiAgICAgICAgICAgIHRvdCA9IGlzTnVtZXJpYyhsYXRlc3RDb3VudCkgJiYgbGF0ZXN0Q291bnQgPiAwID9cbiAgICAgICAgICAgIHRvdCArPSBsb2NhbCAtIGxhdGVzdENvdW50IDpcbiAgICAgICAgICAgIHRvdCArPSBsb2NhbDtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5zdG9yZVNldChgJHt0aGlzLnR5cGV9LSR7dGhpcy5zaGFyZWR9YCwgdG90KTtcblxuICAgICAgICAgIGNvdW50UmVkdWNlKHRoaXMub3MsIHRvdCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaWYgKHRoaXMuYXBwZW5kVG8gJiYgdHlwZW9mIHRoaXMuYXBwZW5kVG8gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRoaXMuYXBwZW5kVG8uYXBwZW5kQ2hpbGQodGhpcy5vcyk7XG4gICAgfVxuICB9XG5cbiAgLy8gaGFuZGxlIEpTT05QIHJlcXVlc3RzXG4gIGpzb25wKGNvdW50RGF0YSwgY2IpIHtcbiAgLy8gZGVmaW5lIHJhbmRvbSBjYWxsYmFjayBhbmQgYXNzaWduIHRyYW5zZm9ybSBmdW5jdGlvblxuICAgIGNvbnN0IGNhbGxiYWNrID0gTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyaW5nKDcpLnJlcGxhY2UoL1teYS16QS1aXS9nLCAnJyk7XG4gICAgd2luZG93W2NhbGxiYWNrXSA9IChkYXRhKSA9PiB7XG4gICAgICBjb25zdCBjb3VudCA9IGNvdW50RGF0YS50cmFuc2Zvcm0uYXBwbHkodGhpcywgW2RhdGFdKSB8fCAwO1xuXG4gICAgICBpZiAoY2IgJiYgdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGNiKGNvdW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0aGlzLmFwcGVuZFRvICYmIHR5cGVvZiB0aGlzLmFwcGVuZFRvICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgdGhpcy5hcHBlbmRUby5hcHBlbmRDaGlsZCh0aGlzLm9zKTtcbiAgICAgICAgfVxuICAgICAgICBjb3VudFJlZHVjZSh0aGlzLm9zLCBjb3VudCwgdGhpcy5jYik7XG4gICAgICB9XG5cbiAgICAgIEV2ZW50cy50cmlnZ2VyKHRoaXMub3MsIGBjb3VudGVkLSR7dGhpcy51cmx9YCk7XG4gICAgfTtcblxuICAgIC8vIGFwcGVuZCBKU09OUCBzY3JpcHQgdGFnIHRvIHBhZ2VcbiAgICBjb25zdCBzY3JpcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICBzY3JpcHQuc3JjID0gY291bnREYXRhLnVybC5yZXBsYWNlKCdjYWxsYmFjaz0/JywgYGNhbGxiYWNrPSR7Y2FsbGJhY2t9YCk7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXS5hcHBlbmRDaGlsZChzY3JpcHQpO1xuXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gaGFuZGxlIEFKQVggR0VUIHJlcXVlc3RcbiAgZ2V0KGNvdW50RGF0YSwgY2IpIHtcbiAgICBjb25zdCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgIC8vIG9uIHN1Y2Nlc3MgcGFzcyByZXNwb25zZSB0byB0cmFuc2Zvcm0gZnVuY3Rpb25cbiAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gKCkgPT4ge1xuICAgICAgaWYgKHhoci5yZWFkeVN0YXRlID09PSA0KSB7XG4gICAgICAgIGlmICh4aHIuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICBjb25zdCBjb3VudCA9IGNvdW50RGF0YS50cmFuc2Zvcm0uYXBwbHkodGhpcywgW3hociwgRXZlbnRzXSkgfHwgMDtcblxuICAgICAgICAgIGlmIChjYiAmJiB0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNiKGNvdW50KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHRoaXMuYXBwZW5kVG8gJiYgdHlwZW9mIHRoaXMuYXBwZW5kVG8gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgdGhpcy5hcHBlbmRUby5hcHBlbmRDaGlsZCh0aGlzLm9zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvdW50UmVkdWNlKHRoaXMub3MsIGNvdW50LCB0aGlzLmNiKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBFdmVudHMudHJpZ2dlcih0aGlzLm9zLCBgY291bnRlZC0ke3RoaXMudXJsfWApO1xuICAgICAgICB9IGVsc2UgaWYgKGNvdW50RGF0YS51cmwudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdodHRwczovL2FwaS5vcGVuc2hhcmUuc29jaWFsL2pvYj8nKSA9PT0gMCkge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1BsZWFzZSBzaWduIHVwIGZvciBUd2l0dGVyIGNvdW50cyBhdCBodHRwczovL29wZW5zaGFyZS5zb2NpYWwvdHdpdHRlci9hdXRoJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIGdldCBBUEkgZGF0YSBmcm9tJywgY291bnREYXRhLnVybCwgJy4gUGxlYXNlIHVzZSB0aGUgbGF0ZXN0IHZlcnNpb24gb2YgT3BlblNoYXJlLicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuICAgIGNvdW50RGF0YS51cmwgPSBjb3VudERhdGEudXJsLnN0YXJ0c1dpdGgoJ2h0dHBzOi8vYXBpLm9wZW5zaGFyZS5zb2NpYWwvam9iPycpICYmIHRoaXMua2V5ID9cbiAgICAgIGNvdW50RGF0YS51cmwgKyB0aGlzLmtleSA6XG4gICAgICBjb3VudERhdGEudXJsO1xuXG4gICAgeGhyLm9wZW4oJ0dFVCcsIGNvdW50RGF0YS51cmwpO1xuICAgIHhoci5zZW5kKCk7XG4gIH1cblxuICAvLyBoYW5kbGUgQUpBWCBQT1NUIHJlcXVlc3RcbiAgcG9zdChjb3VudERhdGEsIGNiKSB7XG4gICAgY29uc3QgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICAvLyBvbiBzdWNjZXNzIHBhc3MgcmVzcG9uc2UgdG8gdHJhbnNmb3JtIGZ1bmN0aW9uXG4gICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9ICgpID0+IHtcbiAgICAgIGlmICh4aHIucmVhZHlTdGF0ZSAhPT0gWE1MSHR0cFJlcXVlc3QuRE9ORSB8fFxuICAgICAgICB4aHIuc3RhdHVzICE9PSAyMDApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBjb3VudCA9IGNvdW50RGF0YS50cmFuc2Zvcm0uYXBwbHkodGhpcywgW3hocl0pIHx8IDA7XG5cbiAgICAgIGlmIChjYiAmJiB0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgY2IoY291bnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRoaXMuYXBwZW5kVG8gJiYgdHlwZW9mIHRoaXMuYXBwZW5kVG8gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICB0aGlzLmFwcGVuZFRvLmFwcGVuZENoaWxkKHRoaXMub3MpO1xuICAgICAgICB9XG4gICAgICAgIGNvdW50UmVkdWNlKHRoaXMub3MsIGNvdW50LCB0aGlzLmNiKTtcbiAgICAgIH1cbiAgICAgIEV2ZW50cy50cmlnZ2VyKHRoaXMub3MsIGBjb3VudGVkLSR7dGhpcy51cmx9YCk7XG4gICAgfTtcblxuICAgIHhoci5vcGVuKCdQT1NUJywgY291bnREYXRhLnVybCk7XG4gICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ9VVRGLTgnKTtcbiAgICB4aHIuc2VuZChKU09OLnN0cmluZ2lmeShjb3VudERhdGEuZGF0YSkpO1xuICB9XG5cbiAgc3RvcmVTZXQodHlwZSwgY291bnQgPSAwKSB7Ly9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgaWYgKCF3aW5kb3cubG9jYWxTdG9yYWdlIHx8ICF0eXBlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oYE9wZW5TaGFyZS0ke3R5cGV9YCwgY291bnQpO1xuICB9XG5cbiAgc3RvcmVHZXQodHlwZSkgey8vZXNsaW50LWRpc2FibGUtbGluZVxuICAgIGlmICghd2luZG93LmxvY2FsU3RvcmFnZSB8fCAhdHlwZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHJldHVybiBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShgT3BlblNoYXJlLSR7dHlwZX1gKTtcbiAgfVxuXG59XG5cbmV4cG9ydCBkZWZhdWx0IENvdW50O1xuIiwiLyoqXG4gKiBUcmlnZ2VyIGN1c3RvbSBPcGVuU2hhcmUgbmFtZXNwYWNlZCBldmVudFxuICovXG5leHBvcnQgZGVmYXVsdCB7XG4gIHRyaWdnZXIoZWxlbWVudCwgZXZlbnQpIHtcbiAgICBjb25zdCBldiA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdFdmVudCcpO1xuICAgIGV2LmluaXRFdmVudChgT3BlblNoYXJlLiR7ZXZlbnR9YCwgdHJ1ZSwgdHJ1ZSk7XG4gICAgZWxlbWVudC5kaXNwYXRjaEV2ZW50KGV2KTtcbiAgfSxcbn07XG4iLCIvKipcbiAqIE9wZW5TaGFyZSBnZW5lcmF0ZXMgYSBzaW5nbGUgc2hhcmUgbGlua1xuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBPcGVuU2hhcmUge1xuXG4gIGNvbnN0cnVjdG9yKHR5cGUsIHRyYW5zZm9ybSkge1xuICAgIHRoaXMuaW9zID0gL2lQYWR8aVBob25lfGlQb2QvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkgJiYgIXdpbmRvdy5NU1N0cmVhbTtcbiAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgIHRoaXMuZHluYW1pYyA9IGZhbHNlO1xuICAgIHRoaXMudHJhbnNmb3JtID0gdHJhbnNmb3JtO1xuXG4gICAgLy8gY2FwaXRhbGl6ZWQgdHlwZVxuICAgIHRoaXMudHlwZUNhcHMgPSB0eXBlLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgdHlwZS5zbGljZSgxKTtcbiAgfVxuXG4gIC8vIHJldHVybnMgZnVuY3Rpb24gbmFtZWQgYXMgdHlwZSBzZXQgaW4gY29uc3RydWN0b3JcbiAgLy8gZS5nIHR3aXR0ZXIoKVxuICBzZXREYXRhKGRhdGEpIHtcbiAgICAvLyBpZiBpT1MgdXNlciBhbmQgaW9zIGRhdGEgYXR0cmlidXRlIGRlZmluZWRcbiAgICAvLyBidWlsZCBpT1MgVVJMIHNjaGVtZSBhcyBzaW5nbGUgc3RyaW5nXG4gICAgaWYgKHRoaXMuaW9zKSB7XG4gICAgICB0aGlzLnRyYW5zZm9ybURhdGEgPSB0aGlzLnRyYW5zZm9ybShkYXRhLCB0cnVlKTtcbiAgICAgIHRoaXMubW9iaWxlU2hhcmVVcmwgPSB0aGlzLnRlbXBsYXRlKHRoaXMudHJhbnNmb3JtRGF0YS51cmwsIHRoaXMudHJhbnNmb3JtRGF0YS5kYXRhKTtcbiAgICB9XG5cbiAgICB0aGlzLnRyYW5zZm9ybURhdGEgPSB0aGlzLnRyYW5zZm9ybShkYXRhKTtcbiAgICB0aGlzLnNoYXJlVXJsID0gdGhpcy50ZW1wbGF0ZSh0aGlzLnRyYW5zZm9ybURhdGEudXJsLCB0aGlzLnRyYW5zZm9ybURhdGEuZGF0YSk7XG4gIH1cblxuICAvLyBvcGVuIHNoYXJlIFVSTCBkZWZpbmVkIGluIGluZGl2aWR1YWwgcGxhdGZvcm0gZnVuY3Rpb25zXG4gIHNoYXJlKCkge1xuICAgIC8vIGlmIGlPUyBzaGFyZSBVUkwgaGFzIGJlZW4gc2V0IHRoZW4gdXNlIHRpbWVvdXQgaGFja1xuICAgIC8vIHRlc3QgZm9yIG5hdGl2ZSBhcHAgYW5kIGZhbGwgYmFjayB0byB3ZWJcbiAgICBpZiAodGhpcy5tb2JpbGVTaGFyZVVybCkge1xuICAgICAgY29uc3Qgc3RhcnQgPSAobmV3IERhdGUoKSkudmFsdWVPZigpO1xuXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgY29uc3QgZW5kID0gKG5ldyBEYXRlKCkpLnZhbHVlT2YoKTtcblxuICAgICAgICAvLyBpZiB0aGUgdXNlciBpcyBzdGlsbCBoZXJlLCBmYWxsIGJhY2sgdG8gd2ViXG4gICAgICAgIGlmIChlbmQgLSBzdGFydCA+IDE2MDApIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB3aW5kb3cubG9jYXRpb24gPSB0aGlzLnNoYXJlVXJsO1xuICAgICAgfSwgMTUwMCk7XG5cbiAgICAgIHdpbmRvdy5sb2NhdGlvbiA9IHRoaXMubW9iaWxlU2hhcmVVcmw7XG5cbiAgICAgIC8vIG9wZW4gbWFpbHRvIGxpbmtzIGluIHNhbWUgd2luZG93XG4gICAgfSBlbHNlIGlmICh0aGlzLnR5cGUgPT09ICdlbWFpbCcpIHtcbiAgICAgIHdpbmRvdy5sb2NhdGlvbiA9IHRoaXMuc2hhcmVVcmw7XG5cbiAgICAgIC8vIG9wZW4gc29jaWFsIHNoYXJlIFVSTHMgaW4gbmV3IHdpbmRvd1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBpZiBwb3B1cCBvYmplY3QgcHJlc2VudCB0aGVuIHNldCB3aW5kb3cgZGltZW5zaW9ucyAvIHBvc2l0aW9uXG4gICAgICBpZiAodGhpcy5wb3B1cCAmJiB0aGlzLnRyYW5zZm9ybURhdGEucG9wdXApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3BlbldpbmRvdyh0aGlzLnNoYXJlVXJsLCB0aGlzLnRyYW5zZm9ybURhdGEucG9wdXApO1xuICAgICAgfVxuXG4gICAgICB3aW5kb3cub3Blbih0aGlzLnNoYXJlVXJsKTtcbiAgICB9XG4gIH1cblxuICAvLyBjcmVhdGUgc2hhcmUgVVJMIHdpdGggR0VUIHBhcmFtc1xuICAvLyBhcHBlbmRpbmcgdmFsaWQgcHJvcGVydGllcyB0byBxdWVyeSBzdHJpbmdcbiAgdGVtcGxhdGUodXJsLCBkYXRhKSB7Ly9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgY29uc3Qgbm9uVVJMUHJvcHMgPSBbXG4gICAgICAnYXBwZW5kVG8nLFxuICAgICAgJ2lubmVySFRNTCcsXG4gICAgICAnY2xhc3NlcycsXG4gICAgXTtcblxuICAgIGxldCBzaGFyZVVybCA9IHVybCxcbiAgICAgIGk7XG5cbiAgICBmb3IgKGkgaW4gZGF0YSkge1xuICAgICAgLy8gb25seSBhcHBlbmQgdmFsaWQgcHJvcGVydGllc1xuICAgICAgaWYgKCFkYXRhW2ldIHx8IG5vblVSTFByb3BzLmluZGV4T2YoaSkgPiAtMSkge1xuICAgICAgICBjb250aW51ZTsgLy9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgICB9XG5cbiAgICAgIC8vIGFwcGVuZCBVUkwgZW5jb2RlZCBHRVQgcGFyYW0gdG8gc2hhcmUgVVJMXG4gICAgICBkYXRhW2ldID0gZW5jb2RlVVJJQ29tcG9uZW50KGRhdGFbaV0pO1xuICAgICAgc2hhcmVVcmwgKz0gYCR7aX09JHtkYXRhW2ldfSZgO1xuICAgIH1cblxuICAgIHJldHVybiBzaGFyZVVybC5zdWJzdHIoMCwgc2hhcmVVcmwubGVuZ3RoIC0gMSk7XG4gIH1cblxuICAvLyBjZW50ZXIgcG9wdXAgd2luZG93IHN1cHBvcnRpbmcgZHVhbCBzY3JlZW5zXG4gIG9wZW5XaW5kb3codXJsLCBvcHRpb25zKSB7Ly9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgY29uc3QgZHVhbFNjcmVlbkxlZnQgPSB3aW5kb3cuc2NyZWVuTGVmdCAhPT0gdW5kZWZpbmVkID8gd2luZG93LnNjcmVlbkxlZnQgOiBzY3JlZW4ubGVmdCxcbiAgICAgIGR1YWxTY3JlZW5Ub3AgPSB3aW5kb3cuc2NyZWVuVG9wICE9PSB1bmRlZmluZWQgPyB3aW5kb3cuc2NyZWVuVG9wIDogc2NyZWVuLnRvcCxcbiAgICAgIHdpZHRoID0gd2luZG93LmlubmVyV2lkdGggPyB3aW5kb3cuaW5uZXJXaWR0aCA6IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aCA/IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aCA6IHNjcmVlbi53aWR0aCwvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgICAgIGhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodCA/IHdpbmRvdy5pbm5lckhlaWdodCA6IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQgPyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0IDogc2NyZWVuLmhlaWdodCwvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgICAgIGxlZnQgPSAoKHdpZHRoIC8gMikgLSAob3B0aW9ucy53aWR0aCAvIDIpKSArIGR1YWxTY3JlZW5MZWZ0LFxuICAgICAgdG9wID0gKChoZWlnaHQgLyAyKSAtIChvcHRpb25zLmhlaWdodCAvIDIpKSArIGR1YWxTY3JlZW5Ub3AsXG4gICAgICBuZXdXaW5kb3cgPSB3aW5kb3cub3Blbih1cmwsICdPcGVuU2hhcmUnLCBgd2lkdGg9JHtvcHRpb25zLndpZHRofSwgaGVpZ2h0PSR7b3B0aW9ucy5oZWlnaHR9LCB0b3A9JHt0b3B9LCBsZWZ0PSR7bGVmdH1gKTtcblxuICAgIC8vIFB1dHMgZm9jdXMgb24gdGhlIG5ld1dpbmRvd1xuICAgIGlmICh3aW5kb3cuZm9jdXMpIHtcbiAgICAgIG5ld1dpbmRvdy5mb2N1cygpO1xuICAgIH1cbiAgfVxufVxuIiwiLyoqXG4gKiBPYmplY3Qgb2YgdHJhbnNmb3JtIGZ1bmN0aW9ucyBmb3IgZWFjaCBvcGVuc2hhcmUgYXBpXG4gKiBUcmFuc2Zvcm0gZnVuY3Rpb25zIHBhc3NlZCBpbnRvIE9wZW5TaGFyZSBpbnN0YW5jZSB3aGVuIGluc3RhbnRpYXRlZFxuICogUmV0dXJuIG9iamVjdCBjb250YWluaW5nIFVSTCBhbmQga2V5L3ZhbHVlIGFyZ3NcbiAqL1xuZXhwb3J0IGRlZmF1bHQge1xuXG4gIC8vIHNldCBUd2l0dGVyIHNoYXJlIFVSTFxuICB0d2l0dGVyKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG4gICAgLy8gaWYgaU9TIHVzZXIgYW5kIGlvcyBkYXRhIGF0dHJpYnV0ZSBkZWZpbmVkXG4gICAgLy8gYnVpbGQgaU9TIFVSTCBzY2hlbWUgYXMgc2luZ2xlIHN0cmluZ1xuICAgIGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcbiAgICAgIGxldCBtZXNzYWdlID0gJyc7XG5cbiAgICAgIGlmIChkYXRhLnRleHQpIHtcbiAgICAgICAgbWVzc2FnZSArPSBkYXRhLnRleHQ7XG4gICAgICB9XG5cbiAgICAgIGlmIChkYXRhLnVybCkge1xuICAgICAgICBtZXNzYWdlICs9IGAgLSAke2RhdGEudXJsfWA7XG4gICAgICB9XG5cbiAgICAgIGlmIChkYXRhLmhhc2h0YWdzKSB7XG4gICAgICAgIGNvbnN0IHRhZ3MgPSBkYXRhLmhhc2h0YWdzLnNwbGl0KCcsJyk7XG4gICAgICAgIHRhZ3MuZm9yRWFjaCgodGFnKSA9PiB7XG4gICAgICAgICAgbWVzc2FnZSArPSBgICMke3RhZ31gO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKGRhdGEudmlhKSB7XG4gICAgICAgIG1lc3NhZ2UgKz0gYCB2aWEgJHtkYXRhLnZpYX1gO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICB1cmw6ICd0d2l0dGVyOi8vcG9zdD8nLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgfSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogJ2h0dHBzOi8vdHdpdHRlci5jb20vc2hhcmU/JyxcbiAgICAgIGRhdGEsXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogNzAwLFxuICAgICAgICBoZWlnaHQ6IDI5NixcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgVHdpdHRlciByZXR3ZWV0IFVSTFxuICB0d2l0dGVyUmV0d2VldChkYXRhLCBpb3MgPSBmYWxzZSkge1xuICAgIC8vIGlmIGlPUyB1c2VyIGFuZCBpb3MgZGF0YSBhdHRyaWJ1dGUgZGVmaW5lZFxuICAgIGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHVybDogJ3R3aXR0ZXI6Ly9zdGF0dXM/JyxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIGlkOiBkYXRhLnR3ZWV0SWQsXG4gICAgICAgIH0sXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB1cmw6ICdodHRwczovL3R3aXR0ZXIuY29tL2ludGVudC9yZXR3ZWV0PycsXG4gICAgICBkYXRhOiB7XG4gICAgICAgIHR3ZWV0X2lkOiBkYXRhLnR3ZWV0SWQsXG4gICAgICAgIHJlbGF0ZWQ6IGRhdGEucmVsYXRlZCxcbiAgICAgIH0sXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogNzAwLFxuICAgICAgICBoZWlnaHQ6IDI5NixcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgVHdpdHRlciBsaWtlIFVSTFxuICB0d2l0dGVyTGlrZShkYXRhLCBpb3MgPSBmYWxzZSkge1xuICAgIC8vIGlmIGlPUyB1c2VyIGFuZCBpb3MgZGF0YSBhdHRyaWJ1dGUgZGVmaW5lZFxuICAgIGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHVybDogJ3R3aXR0ZXI6Ly9zdGF0dXM/JyxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIGlkOiBkYXRhLnR3ZWV0SWQsXG4gICAgICAgIH0sXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB1cmw6ICdodHRwczovL3R3aXR0ZXIuY29tL2ludGVudC9mYXZvcml0ZT8nLFxuICAgICAgZGF0YToge1xuICAgICAgICB0d2VldF9pZDogZGF0YS50d2VldElkLFxuICAgICAgICByZWxhdGVkOiBkYXRhLnJlbGF0ZWQsXG4gICAgICB9LFxuICAgICAgcG9wdXA6IHtcbiAgICAgICAgd2lkdGg6IDcwMCxcbiAgICAgICAgaGVpZ2h0OiAyOTYsXG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgLy8gc2V0IFR3aXR0ZXIgZm9sbG93IFVSTFxuICB0d2l0dGVyRm9sbG93KGRhdGEsIGlvcyA9IGZhbHNlKSB7XG4gICAgLy8gaWYgaU9TIHVzZXIgYW5kIGlvcyBkYXRhIGF0dHJpYnV0ZSBkZWZpbmVkXG4gICAgaWYgKGlvcyAmJiBkYXRhLmlvcykge1xuICAgICAgY29uc3QgaW9zRGF0YSA9IGRhdGEuc2NyZWVuTmFtZSA/IHtcbiAgICAgICAgc2NyZWVuX25hbWU6IGRhdGEuc2NyZWVuTmFtZSxcbiAgICAgIH0gOiB7XG4gICAgICAgIGlkOiBkYXRhLnVzZXJJZCxcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHVybDogJ3R3aXR0ZXI6Ly91c2VyPycsXG4gICAgICAgIGRhdGE6IGlvc0RhdGEsXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB1cmw6ICdodHRwczovL3R3aXR0ZXIuY29tL2ludGVudC91c2VyPycsXG4gICAgICBkYXRhOiB7XG4gICAgICAgIHNjcmVlbl9uYW1lOiBkYXRhLnNjcmVlbk5hbWUsXG4gICAgICAgIHVzZXJfaWQ6IGRhdGEudXNlcklkLFxuICAgICAgfSxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiA3MDAsXG4gICAgICAgIGhlaWdodDogMjk2LFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBGYWNlYm9vayBzaGFyZSBVUkxcbiAgZmFjZWJvb2soZGF0YSkge1xuICAgIHJldHVybiB7XG4gICAgICB1cmw6ICdodHRwczovL3d3dy5mYWNlYm9vay5jb20vZGlhbG9nL2ZlZWQ/YXBwX2lkPTk2MTM0MjU0MzkyMjMyMiZyZWRpcmVjdF91cmk9aHR0cDovL2ZhY2Vib29rLmNvbSYnLFxuICAgICAgZGF0YSxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiA1NjAsXG4gICAgICAgIGhlaWdodDogNTkzLFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gICAgLy8gc2V0IEZhY2Vib29rIHNlbmQgVVJMXG4gIGZhY2Vib29rU2VuZChkYXRhKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogJ2h0dHBzOi8vd3d3LmZhY2Vib29rLmNvbS9kaWFsb2cvc2VuZD9hcHBfaWQ9OTYxMzQyNTQzOTIyMzIyJnJlZGlyZWN0X3VyaT1odHRwOi8vZmFjZWJvb2suY29tJicsXG4gICAgICBkYXRhLFxuICAgICAgcG9wdXA6IHtcbiAgICAgICAgd2lkdGg6IDk4MCxcbiAgICAgICAgaGVpZ2h0OiA1OTYsXG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgLy8gc2V0IFlvdVR1YmUgcGxheSBVUkxcbiAgeW91dHViZShkYXRhLCBpb3MgPSBmYWxzZSkge1xuICAgIC8vIGlmIGlPUyB1c2VyXG4gICAgaWYgKGlvcyAmJiBkYXRhLmlvcykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdXJsOiBgeW91dHViZToke2RhdGEudmlkZW99P2AsXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB1cmw6IGBodHRwczovL3d3dy55b3V0dWJlLmNvbS93YXRjaD92PSR7ZGF0YS52aWRlb30/YCxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiAxMDg2LFxuICAgICAgICBoZWlnaHQ6IDYwOCxcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgWW91VHViZSBzdWJjcmliZSBVUkxcbiAgeW91dHViZVN1YnNjcmliZShkYXRhLCBpb3MgPSBmYWxzZSkge1xuICAgIC8vIGlmIGlPUyB1c2VyXG4gICAgaWYgKGlvcyAmJiBkYXRhLmlvcykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdXJsOiBgeW91dHViZTovL3d3dy55b3V0dWJlLmNvbS91c2VyLyR7ZGF0YS51c2VyfT9gLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgdXJsOiBgaHR0cHM6Ly93d3cueW91dHViZS5jb20vdXNlci8ke2RhdGEudXNlcn0/YCxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiA4ODAsXG4gICAgICAgIGhlaWdodDogMzUwLFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBJbnN0YWdyYW0gZm9sbG93IFVSTFxuICBpbnN0YWdyYW0oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogJ2luc3RhZ3JhbTovL2NhbWVyYT8nLFxuICAgIH07XG4gIH0sXG5cbiAgLy8gc2V0IEluc3RhZ3JhbSBmb2xsb3cgVVJMXG4gIGluc3RhZ3JhbUZvbGxvdyhkYXRhLCBpb3MgPSBmYWxzZSkge1xuICAgIC8vIGlmIGlPUyB1c2VyXG4gICAgaWYgKGlvcyAmJiBkYXRhLmlvcykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdXJsOiAnaW5zdGFncmFtOi8vdXNlcj8nLFxuICAgICAgICBkYXRhLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgdXJsOiBgaHR0cDovL3d3dy5pbnN0YWdyYW0uY29tLyR7ZGF0YS51c2VybmFtZX0/YCxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiA5ODAsXG4gICAgICAgIGhlaWdodDogNjU1LFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBTbmFwY2hhdCBmb2xsb3cgVVJMXG4gIHNuYXBjaGF0KGRhdGEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdXJsOiBgc25hcGNoYXQ6Ly9hZGQvJHtkYXRhLnVzZXJuYW1lfT9gLFxuICAgIH07XG4gIH0sXG5cbiAgLy8gc2V0IEdvb2dsZSBzaGFyZSBVUkxcbiAgZ29vZ2xlKGRhdGEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdXJsOiAnaHR0cHM6Ly9wbHVzLmdvb2dsZS5jb20vc2hhcmU/JyxcbiAgICAgIGRhdGEsXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogNDk1LFxuICAgICAgICBoZWlnaHQ6IDgxNSxcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgR29vZ2xlIG1hcHMgVVJMXG4gIGdvb2dsZU1hcHMoZGF0YSwgaW9zID0gZmFsc2UpIHtcbiAgICBpZiAoZGF0YS5zZWFyY2gpIHtcbiAgICAgIGRhdGEucSA9IGRhdGEuc2VhcmNoO1xuICAgICAgZGVsZXRlIGRhdGEuc2VhcmNoO1xuICAgIH1cblxuICAgIC8vIGlmIGlPUyB1c2VyIGFuZCBpb3MgZGF0YSBhdHRyaWJ1dGUgZGVmaW5lZFxuICAgIGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHVybDogJ2NvbWdvb2dsZW1hcHM6Ly8/JyxcbiAgICAgICAgZGF0YTogaW9zLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAoIWlvcyAmJiBkYXRhLmlvcykge1xuICAgICAgZGVsZXRlIGRhdGEuaW9zO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB1cmw6ICdodHRwczovL21hcHMuZ29vZ2xlLmNvbS8/JyxcbiAgICAgIGRhdGEsXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogODAwLFxuICAgICAgICBoZWlnaHQ6IDYwMCxcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgUGludGVyZXN0IHNoYXJlIFVSTFxuICBwaW50ZXJlc3QoZGF0YSkge1xuICAgIHJldHVybiB7XG4gICAgICB1cmw6ICdodHRwczovL3BpbnRlcmVzdC5jb20vcGluL2NyZWF0ZS9ib29rbWFya2xldC8/JyxcbiAgICAgIGRhdGEsXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogNzQ1LFxuICAgICAgICBoZWlnaHQ6IDYyMCxcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgTGlua2VkSW4gc2hhcmUgVVJMXG4gIGxpbmtlZGluKGRhdGEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdXJsOiAnaHR0cDovL3d3dy5saW5rZWRpbi5jb20vc2hhcmVBcnRpY2xlPycsXG4gICAgICBkYXRhLFxuICAgICAgcG9wdXA6IHtcbiAgICAgICAgd2lkdGg6IDc4MCxcbiAgICAgICAgaGVpZ2h0OiA0OTIsXG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgLy8gc2V0IEJ1ZmZlciBzaGFyZSBVUkxcbiAgYnVmZmVyKGRhdGEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdXJsOiAnaHR0cDovL2J1ZmZlcmFwcC5jb20vYWRkPycsXG4gICAgICBkYXRhLFxuICAgICAgcG9wdXA6IHtcbiAgICAgICAgd2lkdGg6IDc0NSxcbiAgICAgICAgaGVpZ2h0OiAzNDUsXG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgLy8gc2V0IFR1bWJsciBzaGFyZSBVUkxcbiAgdHVtYmxyKGRhdGEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdXJsOiAnaHR0cHM6Ly93d3cudHVtYmxyLmNvbS93aWRnZXRzL3NoYXJlL3Rvb2w/JyxcbiAgICAgIGRhdGEsXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogNTQwLFxuICAgICAgICBoZWlnaHQ6IDk0MCxcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgUmVkZGl0IHNoYXJlIFVSTFxuICByZWRkaXQoZGF0YSkge1xuICAgIHJldHVybiB7XG4gICAgICB1cmw6ICdodHRwOi8vcmVkZGl0LmNvbS9zdWJtaXQ/JyxcbiAgICAgIGRhdGEsXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogODYwLFxuICAgICAgICBoZWlnaHQ6IDg4MCxcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgRmxpY2tyIGZvbGxvdyBVUkxcbiAgZmxpY2tyKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG4gICAgLy8gaWYgaU9TIHVzZXJcbiAgICBpZiAoaW9zICYmIGRhdGEuaW9zKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB1cmw6IGBmbGlja3I6Ly9waG90b3MvJHtkYXRhLnVzZXJuYW1lfT9gLFxuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogYGh0dHA6Ly93d3cuZmxpY2tyLmNvbS9waG90b3MvJHtkYXRhLnVzZXJuYW1lfT9gLFxuICAgICAgcG9wdXA6IHtcbiAgICAgICAgd2lkdGg6IDYwMCxcbiAgICAgICAgaGVpZ2h0OiA2NTAsXG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgLy8gc2V0IFdoYXRzQXBwIHNoYXJlIFVSTFxuICB3aGF0c2FwcChkYXRhKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogJ3doYXRzYXBwOi8vc2VuZD8nLFxuICAgICAgZGF0YSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBzbXMgc2hhcmUgVVJMXG4gIHNtcyhkYXRhLCBpb3MgPSBmYWxzZSkge1xuICAgIHJldHVybiB7XG4gICAgICB1cmw6IGlvcyA/ICdzbXM6JicgOiAnc21zOj8nLFxuICAgICAgZGF0YSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBFbWFpbCBzaGFyZSBVUkxcbiAgZW1haWwoZGF0YSkge1xuICAgIGxldCB1cmwgPSAnbWFpbHRvOic7XG5cbiAgICAvLyBpZiB0byBhZGRyZXNzIHNwZWNpZmllZCB0aGVuIGFkZCB0byBVUkxcbiAgICBpZiAoZGF0YS50byAhPT0gbnVsbCkge1xuICAgICAgdXJsICs9IGAke2RhdGEudG99YDtcbiAgICB9XG5cbiAgICB1cmwgKz0gJz8nO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHVybCxcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgc3ViamVjdDogZGF0YS5zdWJqZWN0LFxuICAgICAgICBib2R5OiBkYXRhLmJvZHksXG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgLy8gc2V0IEdpdGh1YiBmb3JrIFVSTFxuICBnaXRodWIoZGF0YSwgaW9zID0gZmFsc2UpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICAgIGxldCB1cmwgPSBkYXRhLnJlcG8gPyBgaHR0cHM6Ly9naXRodWIuY29tLyR7ZGF0YS5yZXBvfWAgOiBkYXRhLnVybDtcblxuICAgIGlmIChkYXRhLmlzc3VlKSB7XG4gICAgICB1cmwgKz0gYC9pc3N1ZXMvbmV3P3RpdGxlPSR7ZGF0YS5pc3N1ZX0mYm9keT0ke2RhdGEuYm9keX1gO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB1cmw6IGAke3VybH0/YCxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiAxMDIwLFxuICAgICAgICBoZWlnaHQ6IDMyMyxcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgRHJpYmJibGUgc2hhcmUgVVJMXG4gIGRyaWJiYmxlKGRhdGEsIGlvcyA9IGZhbHNlKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgICBjb25zdCB1cmwgPSBkYXRhLnNob3QgPyBgaHR0cHM6Ly9kcmliYmJsZS5jb20vc2hvdHMvJHtkYXRhLnNob3R9P2AgOiBgJHtkYXRhLnVybH0/YDtcbiAgICByZXR1cm4ge1xuICAgICAgdXJsLFxuICAgICAgcG9wdXA6IHtcbiAgICAgICAgd2lkdGg6IDQ0MCxcbiAgICAgICAgaGVpZ2h0OiA2NDAsXG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgY29kZXBlbihkYXRhKSB7XG4gICAgY29uc3QgdXJsID0gKGRhdGEucGVuICYmIGRhdGEudXNlcm5hbWUgJiYgZGF0YS52aWV3KSA/IGBodHRwczovL2NvZGVwZW4uaW8vJHtkYXRhLnVzZXJuYW1lfS8ke2RhdGEudmlld30vJHtkYXRhLnBlbn0/YCA6IGAke2RhdGEudXJsfT9gO1xuICAgIHJldHVybiB7XG4gICAgICB1cmwsXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogMTIwMCxcbiAgICAgICAgaGVpZ2h0OiA4MDAsXG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgcGF5cGFsKGRhdGEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZGF0YSxcbiAgICB9O1xuICB9LFxufTtcbiIsImNvbnN0IE9wZW5TaGFyZSA9IHtcbiAgc2hhcmU6IHJlcXVpcmUoJy4uL3NoYXJlLmpzJyksXG4gIGNvdW50OiByZXF1aXJlKCcuLi9jb3VudC5qcycpLFxuICBhbmFseXRpY3M6IHJlcXVpcmUoJy4uL2FuYWx5dGljcy5qcycpLFxufTtcblxuT3BlblNoYXJlLmFuYWx5dGljcygndGFnTWFuYWdlcicsICgpID0+IHtcbiAgY29uc29sZS5sb2coJ3RhZyBtYW5hZ2VyIGxvYWRlZCcpO1xufSk7XG5cbk9wZW5TaGFyZS5hbmFseXRpY3MoJ2V2ZW50JywgKCkgPT4ge1xuICBjb25zb2xlLmxvZygnZ29vZ2xlIGFuYWx5dGljcyBldmVudHMgbG9hZGVkJyk7XG59KTtcblxuT3BlblNoYXJlLmFuYWx5dGljcygnc29jaWFsJywgKCkgPT4ge1xuICBjb25zb2xlLmxvZygnZ29vZ2xlIGFuYWx5dGljcyBzb2NpYWwgbG9hZGVkJyk7XG59KTtcblxuY29uc3QgZHluYW1pY05vZGVEYXRhID0ge1xuICB1cmw6ICdodHRwOi8vd3d3LmRpZ2l0YWxzdXJnZW9ucy5jb20nLFxuICB2aWE6ICdkaWdpdGFsc3VyZ2VvbnMnLFxuICB0ZXh0OiAnRm9yd2FyZCBPYnNlc3NlZCcsXG4gIGhhc2h0YWdzOiAnZm9yd2FyZG9ic2Vzc2VkJyxcbiAgYnV0dG9uOiAnT3BlbiBTaGFyZSBXYXRjaGVyIScsXG59O1xuXG5mdW5jdGlvbiBjcmVhdGVPcGVuU2hhcmVOb2RlKGRhdGEpIHtcbiAgY29uc3Qgb3BlblNoYXJlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuXG4gIG9wZW5TaGFyZS5jbGFzc0xpc3QuYWRkKCdvcGVuLXNoYXJlLWxpbmsnLCAndHdpdHRlcicpO1xuICBvcGVuU2hhcmUuc2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUnLCAndHdpdHRlcicpO1xuICBvcGVuU2hhcmUuc2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdXJsJywgZGF0YS51cmwpO1xuICBvcGVuU2hhcmUuc2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdmlhJywgZGF0YS52aWEpO1xuICBvcGVuU2hhcmUuc2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdGV4dCcsIGRhdGEudGV4dCk7XG4gIG9wZW5TaGFyZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1oYXNodGFncycsIGRhdGEuaGFzaHRhZ3MpO1xuICBvcGVuU2hhcmUuaW5uZXJIVE1MID0gYDxzcGFuIGNsYXNzPVwiZmEgZmEtdHdpdHRlclwiPjwvc3Bhbj4ke2RhdGEuYnV0dG9ufWA7XG5cbiAgY29uc3Qgbm9kZSA9IG5ldyBPcGVuU2hhcmUuc2hhcmUoeyAvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgICB0eXBlOiAndHdpdHRlcicsXG4gICAgdXJsOiAnaHR0cDovL3d3dy5kaWdpdGFsc3VyZ2VvbnMuY29tJyxcbiAgICB2aWE6ICdkaWdpdGFsc3VyZ2VvbnMnLFxuICAgIGhhc2h0YWdzOiAnZm9yd2FyZG9ic2Vzc2VkJyxcbiAgICBhcHBlbmRUbzogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLm9wZW4tc2hhcmUtd2F0Y2gnKSxcbiAgICBpbm5lckhUTUw6ICdDcmVhdGVkIHZpYSBPcGVuU2hhcmVBUEknLFxuICAgIGVsZW1lbnQ6ICdkaXYnLFxuICAgIGNsYXNzZXM6IFsnd293JywgJ3N1Y2gnLCAnY2xhc3NlcyddLFxuICB9KTtcblxuICByZXR1cm4gb3BlblNoYXJlO1xufVxuXG5mdW5jdGlvbiBhZGROb2RlKCkge1xuICBjb25zdCBkYXRhID0gZHluYW1pY05vZGVEYXRhO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcub3Blbi1zaGFyZS13YXRjaCcpXG4gICAgLmFwcGVuZENoaWxkKGNyZWF0ZU9wZW5TaGFyZU5vZGUoZGF0YSkpO1xufVxuXG53aW5kb3cuYWRkTm9kZSA9IGFkZE5vZGU7XG5cbmZ1bmN0aW9uIGFkZE5vZGVXaXRoQ291bnQoKSB7XG4gIGNvbnN0IGRhdGEgPSBkeW5hbWljTm9kZURhdGE7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgbmV3IE9wZW5TaGFyZS5jb3VudCh7IC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbiAgICB0eXBlOiAnZmFjZWJvb2snLFxuICAgIHVybDogJ2h0dHBzOi8vd3d3LmRpZ2l0YWxzdXJnZW9ucy5jb20vJyxcbiAgfSwgKG5vZGUpID0+IHtcbiAgICBjb25zdCBvcyA9IG5ldyBPcGVuU2hhcmUuc2hhcmUoeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgICB0eXBlOiAndHdpdHRlcicsXG4gICAgICB1cmw6ICdodHRwOi8vd3d3LmRpZ2l0YWxzdXJnZW9ucy5jb20nLFxuICAgICAgdmlhOiAnZGlnaXRhbHN1cmdlb25zJyxcbiAgICAgIGhhc2h0YWdzOiAnZm9yd2FyZG9ic2Vzc2VkJyxcbiAgICAgIGlubmVySFRNTDogJ0NyZWF0ZWQgdmlhIE9wZW5TaGFyZUFQSScsXG4gICAgICBlbGVtZW50OiAnZGl2JyxcbiAgICAgIGNsYXNzZXM6IFsnd293JywgJ3N1Y2gnLCAnY2xhc3NlcyddLFxuICAgIH0pO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5jcmVhdGUtbm9kZS53LWNvdW50JylcbiAgICAuYXBwZW5kQ2hpbGQob3MpO1xuICAgIG9zLmFwcGVuZENoaWxkKG5vZGUpO1xuICB9KTtcbn1cblxud2luZG93LmFkZE5vZGVXaXRoQ291bnQgPSBhZGROb2RlV2l0aENvdW50O1xuXG5mdW5jdGlvbiBjcmVhdGVDb3VudE5vZGUoKSB7XG4gIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5jcmVhdGUtbm9kZS5jb3VudC1ub2RlcycpO1xuICBjb25zdCB0eXBlID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0LmNvdW50LXR5cGUnKS52YWx1ZTtcbiAgY29uc3QgdXJsID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0LmNvdW50LXVybCcpLnZhbHVlO1xuXG4gIG5ldyBPcGVuU2hhcmUuY291bnQoeyAvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgICB0eXBlOiB0eXBlLCAvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgICB1cmw6IHVybCwgLy9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgYXBwZW5kVG86IGNvbnRhaW5lcixcbiAgICBjbGFzc2VzOiBbJ3Rlc3QnXSxcbiAgfSwgKG5vZGUpID0+IHtcbiAgICBub2RlLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcbiAgfSk7XG5cblxuICBjb250YWluZXIucXVlcnlTZWxlY3RvcignaW5wdXQuY291bnQtdHlwZScpLnZhbHVlID0gJyc7XG4gIGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdpbnB1dC5jb3VudC11cmwnKS52YWx1ZSA9ICcnO1xufVxuXG53aW5kb3cuY3JlYXRlQ291bnROb2RlID0gY3JlYXRlQ291bnROb2RlO1xuXG4vLyB0ZXN0IEpTIE9wZW5TaGFyZSBBUEkgd2l0aCBkYXNoZXNcbm5ldyBPcGVuU2hhcmUuc2hhcmUoeyAvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgdHlwZTogJ2dvb2dsZU1hcHMnLFxuICBjZW50ZXI6ICc0MC43NjU4MTksLTczLjk3NTg2NicsXG4gIHZpZXc6ICd0cmFmZmljJyxcbiAgem9vbTogMTQsXG4gIGFwcGVuZFRvOiBkb2N1bWVudC5ib2R5LFxuICBpbm5lckhUTUw6ICdNYXBzJyxcbn0pO1xuXG5uZXcgT3BlblNoYXJlLnNoYXJlKHsgLy9lc2xpbnQtZGlzYWJsZS1saW5lXG4gIHR5cGU6ICd0d2l0dGVyLWZvbGxvdycsXG4gIHNjcmVlbk5hbWU6ICdkaWdpdGFsc3VyZ2VvbnMnLFxuICB1c2VySWQ6ICcxODE4OTEzMCcsXG4gIGFwcGVuZFRvOiBkb2N1bWVudC5ib2R5LFxuICBpbm5lckhUTUw6ICdGb2xsb3cgVGVzdCcsXG59KTtcblxuLy8gdGVzdCBQYXlQYWxcbm5ldyBPcGVuU2hhcmUuc2hhcmUoeyAvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgdHlwZTogJ3BheXBhbCcsXG4gIGJ1dHRvbklkOiAnMlAzUkpZRUZMN1o2MicsXG4gIHNhbmRib3g6IHRydWUsXG4gIGFwcGVuZFRvOiBkb2N1bWVudC5ib2R5LFxuICBpbm5lckhUTUw6ICdQYXlQYWwgVGVzdCcsXG59KTtcblxuLy8gYmluZCB0byBjb3VudCBsb2FkZWQgZXZlbnRcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ09wZW5TaGFyZS5jb3VudC1sb2FkZWQnLCAoKSA9PiB7XG4gIGNvbnNvbGUubG9nKCdPcGVuU2hhcmUgKGNvdW50KSBsb2FkZWQnKTtcbn0pO1xuXG4vLyBiaW5kIHRvIHNoYXJlIGxvYWRlZCBldmVudFxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignT3BlblNoYXJlLnNoYXJlLWxvYWRlZCcsICgpID0+IHtcbiAgY29uc29sZS5sb2coJ09wZW5TaGFyZSAoc2hhcmUpIGxvYWRlZCcpO1xuXG4gIC8vIGJpbmQgdG8gc2hhcmVkIGV2ZW50IG9uIGVhY2ggaW5kaXZpZHVhbCBub2RlXG4gIFtdLmZvckVhY2guY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1vcGVuLXNoYXJlXScpLCAobm9kZSkgPT4ge1xuICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcignT3BlblNoYXJlLnNoYXJlZCcsIChlKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZygnT3BlbiBTaGFyZSBTaGFyZWQnLCBlKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgY29uc3QgZXhhbXBsZXMgPSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgICB0d2l0dGVyOiBuZXcgT3BlblNoYXJlLnNoYXJlKHsgLy9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgICB0eXBlOiAndHdpdHRlcicsXG4gICAgICBiaW5kQ2xpY2s6IHRydWUsXG4gICAgICB1cmw6ICdodHRwOi8vZGlnaXRhbHN1cmdlb25zLmNvbScsXG4gICAgICB2aWE6ICdkaWdpdGFsc3VyZ2VvbnMnLFxuICAgICAgdGV4dDogJ0RpZ2l0YWwgU3VyZ2VvbnMnLFxuICAgICAgaGFzaHRhZ3M6ICdmb3J3YXJkb2JzZXNzZWQnLFxuICAgIH0sIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLWFwaS1leGFtcGxlPVwidHdpdHRlclwiXScpKSxcblxuICAgIGZhY2Vib29rOiBuZXcgT3BlblNoYXJlLnNoYXJlKHsgLy9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgICB0eXBlOiAnZmFjZWJvb2snLFxuICAgICAgYmluZENsaWNrOiB0cnVlLFxuICAgICAgbGluazogJ2h0dHA6Ly9kaWdpdGFsc3VyZ2VvbnMuY29tJyxcbiAgICAgIHBpY3R1cmU6ICdodHRwOi8vd3d3LmRpZ2l0YWxzdXJnZW9ucy5jb20vaW1nL2Fib3V0L2JnX29mZmljZV90ZWFtLmpwZycsXG4gICAgICBjYXB0aW9uOiAnRGlnaXRhbCBTdXJnZW9ucycsXG4gICAgICBkZXNjcmlwdGlvbjogJ2ZvcndhcmRvYnNlc3NlZCcsXG4gICAgfSwgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignW2RhdGEtYXBpLWV4YW1wbGU9XCJmYWNlYm9va1wiXScpKSxcblxuICAgIHBpbnRlcmVzdDogbmV3IE9wZW5TaGFyZS5zaGFyZSh7IC8vZXNsaW50LWRpc2FibGUtbGluZVxuICAgICAgdHlwZTogJ3BpbnRlcmVzdCcsXG4gICAgICBiaW5kQ2xpY2s6IHRydWUsXG4gICAgICB1cmw6ICdodHRwOi8vZGlnaXRhbHN1cmdlb25zLmNvbScsXG4gICAgICBtZWRpYTogJ2h0dHA6Ly93d3cuZGlnaXRhbHN1cmdlb25zLmNvbS9pbWcvYWJvdXQvYmdfb2ZmaWNlX3RlYW0uanBnJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnRGlnaXRhbCBTdXJnZW9ucycsXG4gICAgICBhcHBlbmRUbzogZG9jdW1lbnQuYm9keSxcbiAgICB9LCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbZGF0YS1hcGktZXhhbXBsZT1cInBpbnRlcmVzdFwiXScpKSxcblxuICAgIGVtYWlsOiBuZXcgT3BlblNoYXJlLnNoYXJlKHsgLy9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgICB0eXBlOiAnZW1haWwnLFxuICAgICAgYmluZENsaWNrOiB0cnVlLFxuICAgICAgdG86ICd0ZWNocm9vbUBkaWdpdGFsc3VyZ2VvbnMuY29tJyxcbiAgICAgIHN1YmplY3Q6ICdEaWdpdGFsIFN1cmdlb25zJyxcbiAgICAgIGJvZHk6ICdGb3J3YXJkIE9ic2Vzc2VkJyxcbiAgICB9LCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbZGF0YS1hcGktZXhhbXBsZT1cImVtYWlsXCJdJykpLFxuICB9O1xufSk7XG5cbi8vIEV4YW1wbGUgb2YgbGlzdGVuaW5nIGZvciBjb3VudGVkIGV2ZW50cyBvbiBpbmRpdmlkdWFsIHVybHMgb3IgYXJyYXlzIG9mIHVybHNcbmNvbnN0IHVybHMgPSBbXG4gICdmYWNlYm9vaycsXG4gICdnb29nbGUnLFxuICAnbGlua2VkaW4nLFxuICAncmVkZGl0JyxcbiAgJ3BpbnRlcmVzdCcsXG4gIFtcbiAgICAnZ29vZ2xlJyxcbiAgICAnbGlua2VkaW4nLFxuICAgICdyZWRkaXQnLFxuICAgICdwaW50ZXJlc3QnLFxuICBdLFxuXTtcblxudXJscy5mb3JFYWNoKCh1cmwpID0+IHtcbiAgaWYgKEFycmF5LmlzQXJyYXkodXJsKSkge1xuICAgIHVybCA9IHVybC5qb2luKCcsJyk7XG4gIH1cbiAgY29uc3QgY291bnROb2RlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChgW2RhdGEtb3Blbi1zaGFyZS1jb3VudD1cIiR7dXJsfVwiXWApO1xuXG4gIFtdLmZvckVhY2guY2FsbChjb3VudE5vZGUsIChub2RlKSA9PiB7XG4gICAgbm9kZS5hZGRFdmVudExpc3RlbmVyKGBPcGVuU2hhcmUuY291bnRlZC0ke3VybH1gLCAoKSA9PiB7XG4gICAgICBjb25zdCBjb3VudHMgPSBub2RlLmlubmVySFRNTDtcbiAgICAgIGlmIChjb3VudHMpIGNvbnNvbGUubG9nKHVybCwgJ3NoYXJlczogJywgY291bnRzKTtcbiAgICB9KTtcbiAgfSk7XG59KTtcblxuLy8gdGVzdCB0d2l0dGVyIGNvdW50IGpzIGFwaVxubmV3IE9wZW5TaGFyZS5jb3VudCh7IC8vZXNsaW50LWRpc2FibGUtbGluZVxuICB0eXBlOiAndHdpdHRlcicsXG4gIHVybDogJ2h0dHBzOi8vd3d3LmRpZ2l0YWxzdXJnZW9ucy5jb20vdGhvdWdodHMvdGVjaG5vbG9neS90aGUtYmxvY2tjaGFpbi1yZXZvbHV0aW9uJyxcbiAga2V5OiAnZHN0d2VldHMnLFxufSwgKG5vZGUpID0+IHtcbiAgY29uc3Qgb3MgPSBuZXcgT3BlblNoYXJlLnNoYXJlKHsgLy9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgdHlwZTogJ3R3aXR0ZXInLFxuICAgIHVybDogJ2h0dHBzOi8vd3d3LmRpZ2l0YWxzdXJnZW9ucy5jb20vdGhvdWdodHMvdGVjaG5vbG9neS90aGUtYmxvY2tjaGFpbi1yZXZvbHV0aW9uJyxcbiAgICB2aWE6ICdkaWdpdGFsc3VyZ2VvbnMnLFxuICAgIGhhc2h0YWdzOiAnZm9yd2FyZG9ic2Vzc2VkLCBibG9ja2NoYWluJyxcbiAgICBhcHBlbmRUbzogZG9jdW1lbnQuYm9keSxcbiAgICBpbm5lckhUTUw6ICdCTE9DS0NIQUlOJyxcbiAgfSk7XG4gIG9zLmFwcGVuZENoaWxkKG5vZGUpO1xufSk7XG4iXX0=
