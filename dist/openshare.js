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

},{}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
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

},{"./initializeNodes":6,"./initializeWatcher":8}],5:[function(require,module,exports){
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

},{"../src/modules/count":15}],6:[function(require,module,exports){
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

},{"../analytics":1,"../src/modules/events":17}],7:[function(require,module,exports){
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

},{"../src/modules/open-share":18,"../src/modules/share-transforms":20,"./dashToCamel":3,"./setData":9,"./share":10}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
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

},{"../src/modules/events":17,"./setData":9}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _dataAttr = require('./modules/data-attr');

var _dataAttr2 = _interopRequireDefault(_dataAttr);

var _shareApi = require('./modules/share-api');

var _shareApi2 = _interopRequireDefault(_shareApi);

var _events = require('./modules/events');

var _events2 = _interopRequireDefault(_events);

var _openShare = require('./modules/open-share');

var _openShare2 = _interopRequireDefault(_openShare);

var _shareTransforms = require('./modules/share-transforms');

var _shareTransforms2 = _interopRequireDefault(_shareTransforms);

var _count = require('./modules/count');

var _count2 = _interopRequireDefault(_count);

var _countApi = require('./modules/count-api');

var _countApi2 = _interopRequireDefault(_countApi);

var _analytics = require('../analytics');

var _analytics2 = _interopRequireDefault(_analytics);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var browser = function browser() {
  (0, _dataAttr2.default)(_openShare2.default, _count2.default, _shareTransforms2.default, _events2.default);
  window.OpenShare = {
    share: (0, _shareApi2.default)(_openShare2.default, _shareTransforms2.default, _events2.default),
    count: (0, _countApi2.default)(),
    analytics: _analytics2.default
  };
};
exports.default = browser();

},{"../analytics":1,"./modules/count":15,"./modules/count-api":13,"./modules/data-attr":16,"./modules/events":17,"./modules/open-share":18,"./modules/share-api":19,"./modules/share-transforms":20}],13:[function(require,module,exports){
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

},{"./count":15}],14:[function(require,module,exports){
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

},{"../../lib/countReduce":2,"../../lib/storeCount":11}],15:[function(require,module,exports){
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

},{"../../lib/countReduce":2,"../../lib/storeCount":11,"./count-transforms":14,"./events":17}],16:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _init = require('../../lib/init');

var _init2 = _interopRequireDefault(_init);

var _initializeShareNode = require('../../lib/initializeShareNode');

var _initializeShareNode2 = _interopRequireDefault(_initializeShareNode);

var _initializeCountNode = require('../../lib/initializeCountNode');

var _initializeCountNode2 = _interopRequireDefault(_initializeCountNode);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function () {
  //eslint-disable-line
  document.addEventListener('DOMContentLoaded', (0, _init2.default)({
    selector: {
      share: '[data-open-share]:not([data-open-share-node])',
      count: '[data-open-share-count]:not([data-open-share-node])'
    },
    cb: {
      share: _initializeShareNode2.default,
      count: _initializeCountNode2.default
    }
  }));
};

},{"../../lib/init":4,"../../lib/initializeCountNode":5,"../../lib/initializeShareNode":7}],17:[function(require,module,exports){
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

},{"../../lib/dashToCamel":3,"./events":17,"./open-share":18,"./share-transforms":20}],20:[function(require,module,exports){
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

},{}]},{},[12])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiYW5hbHl0aWNzLmpzIiwibGliL2NvdW50UmVkdWNlLmpzIiwibGliL2Rhc2hUb0NhbWVsLmpzIiwibGliL2luaXQuanMiLCJsaWIvaW5pdGlhbGl6ZUNvdW50Tm9kZS5qcyIsImxpYi9pbml0aWFsaXplTm9kZXMuanMiLCJsaWIvaW5pdGlhbGl6ZVNoYXJlTm9kZS5qcyIsImxpYi9pbml0aWFsaXplV2F0Y2hlci5qcyIsImxpYi9zZXREYXRhLmpzIiwibGliL3NoYXJlLmpzIiwibGliL3N0b3JlQ291bnQuanMiLCJzcmMvYnJvd3Nlci5qcyIsInNyYy9tb2R1bGVzL2NvdW50LWFwaS5qcyIsInNyYy9tb2R1bGVzL2NvdW50LXRyYW5zZm9ybXMuanMiLCJzcmMvbW9kdWxlcy9jb3VudC5qcyIsInNyYy9tb2R1bGVzL2RhdGEtYXR0ci5qcyIsInNyYy9tb2R1bGVzL2V2ZW50cy5qcyIsInNyYy9tb2R1bGVzL29wZW4tc2hhcmUuanMiLCJzcmMvbW9kdWxlcy9zaGFyZS1hcGkuanMiLCJzcmMvbW9kdWxlcy9zaGFyZS10cmFuc2Zvcm1zLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxPQUFPLE9BQVAsR0FBaUIsVUFBVSxJQUFWLEVBQWdCLEVBQWhCLEVBQW9CO0FBQUM7QUFDcEMsTUFBTSxPQUFPLFNBQVMsT0FBVCxJQUFvQixTQUFTLFFBQTFDO0FBQ0EsTUFBTSxlQUFlLFNBQVMsWUFBOUI7O0FBRUEsTUFBSSxJQUFKLEVBQVUsdUJBQXVCLElBQXZCLEVBQTZCLEVBQTdCO0FBQ1YsTUFBSSxZQUFKLEVBQWtCLGNBQWMsRUFBZDtBQUNuQixDQU5EOztBQVFBLFNBQVMsc0JBQVQsQ0FBZ0MsSUFBaEMsRUFBc0MsRUFBdEMsRUFBMEM7QUFDeEMsTUFBSSxPQUFPLEVBQVgsRUFBZTtBQUNiLFFBQUksRUFBSixFQUFRO0FBQ1Y7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NkIsS0FBSyxJQUFuQywyQkFBaUUsS0FBSyxRQUF0RSxTQUFrRixLQUFLLElBQXZGLFNBQStGLEtBQUssR0FBcEcsU0FBZ0gsS0FBSyxHQUFySCxNQUFaO0FBQ0EsV0FBTztBQUNMLGNBREs7QUFFTCxhQUFPO0FBQ0wsZUFBTyxJQURGO0FBRUwsZ0JBQVE7QUFGSDtBQUZGLEtBQVA7QUFPRCxHQTFaWTtBQTRaYixRQTVaYSxrQkE0Wk4sSUE1Wk0sRUE0WkE7QUFDWCxXQUFPO0FBQ0w7QUFESyxLQUFQO0FBR0Q7QUFoYVksQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICh0eXBlLCBjYikgey8vIGVzbGludC1kaXNhYmxlLWxpbmVcbiAgY29uc3QgaXNHQSA9IHR5cGUgPT09ICdldmVudCcgfHwgdHlwZSA9PT0gJ3NvY2lhbCc7XG4gIGNvbnN0IGlzVGFnTWFuYWdlciA9IHR5cGUgPT09ICd0YWdNYW5hZ2VyJztcblxuICBpZiAoaXNHQSkgY2hlY2tJZkFuYWx5dGljc0xvYWRlZCh0eXBlLCBjYik7XG4gIGlmIChpc1RhZ01hbmFnZXIpIHNldFRhZ01hbmFnZXIoY2IpO1xufTtcblxuZnVuY3Rpb24gY2hlY2tJZkFuYWx5dGljc0xvYWRlZCh0eXBlLCBjYikge1xuICBpZiAod2luZG93LmdhKSB7XG4gICAgaWYgKGNiKSBjYigpO1xuICAvLyBiaW5kIHRvIHNoYXJlZCBldmVudCBvbiBlYWNoIGluZGl2aWR1YWwgbm9kZVxuICAgIGxpc3RlbigoZSkgPT4ge1xuICAgICAgY29uc3QgcGxhdGZvcm0gPSBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZScpO1xuICAgICAgY29uc3QgdGFyZ2V0ID0gZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtbGluaycpIHx8XG4gICAgICBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS11cmwnKSB8fFxuICAgICAgZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdXNlcm5hbWUnKSB8fFxuICAgICAgZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY2VudGVyJykgfHxcbiAgICAgIGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXNlYXJjaCcpIHx8XG4gICAgICBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1ib2R5Jyk7XG5cbiAgICAgIGlmICh0eXBlID09PSAnZXZlbnQnKSB7XG4gICAgICAgIGdhKCdzZW5kJywgJ2V2ZW50JywgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVuZGVmXG4gICAgICAgICAgZXZlbnRDYXRlZ29yeTogJ09wZW5TaGFyZSBDbGljaycsXG4gICAgICAgICAgZXZlbnRBY3Rpb246IHBsYXRmb3JtLFxuICAgICAgICAgIGV2ZW50TGFiZWw6IHRhcmdldCxcbiAgICAgICAgICB0cmFuc3BvcnQ6ICdiZWFjb24nLFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGUgPT09ICdzb2NpYWwnKSB7XG4gICAgICAgIGdhKCdzZW5kJywgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVuZGVmXG4gICAgICAgICAgaGl0VHlwZTogJ3NvY2lhbCcsXG4gICAgICAgICAgc29jaWFsTmV0d29yazogcGxhdGZvcm0sXG4gICAgICAgICAgc29jaWFsQWN0aW9uOiAnc2hhcmUnLFxuICAgICAgICAgIHNvY2lhbFRhcmdldDogdGFyZ2V0LFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGNoZWNrSWZBbmFseXRpY3NMb2FkZWQodHlwZSwgY2IpO1xuICAgIH0sIDEwMDApO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNldFRhZ01hbmFnZXIoY2IpIHtcbiAgaWYgKHdpbmRvdy5kYXRhTGF5ZXIgJiYgd2luZG93LmRhdGFMYXllclswXVsnZ3RtLnN0YXJ0J10pIHtcbiAgICBpZiAoY2IpIGNiKCk7XG5cbiAgICBsaXN0ZW4ob25TaGFyZVRhZ01hbmdlcik7XG5cbiAgICBnZXRDb3VudHMoKGUpID0+IHtcbiAgICAgIGNvbnN0IGNvdW50ID0gZS50YXJnZXQgP1xuICAgICAgZS50YXJnZXQuaW5uZXJIVE1MIDpcbiAgICAgIGUuaW5uZXJIVE1MO1xuXG4gICAgICBjb25zdCBwbGF0Zm9ybSA9IGUudGFyZ2V0ID9cbiAgICAgIGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50LXVybCcpIDpcbiAgICAgIGUuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY291bnQtdXJsJyk7XG5cbiAgICAgIHdpbmRvdy5kYXRhTGF5ZXIucHVzaCh7XG4gICAgICAgIGV2ZW50OiAnT3BlblNoYXJlIENvdW50JyxcbiAgICAgICAgcGxhdGZvcm0sXG4gICAgICAgIHJlc291cmNlOiBjb3VudCxcbiAgICAgICAgYWN0aXZpdHk6ICdjb3VudCcsXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHNldFRhZ01hbmFnZXIoY2IpO1xuICAgIH0sIDEwMDApO1xuICB9XG59XG5cbmZ1bmN0aW9uIGxpc3RlbihjYikge1xuICAvLyBiaW5kIHRvIHNoYXJlZCBldmVudCBvbiBlYWNoIGluZGl2aWR1YWwgbm9kZVxuICBbXS5mb3JFYWNoLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtb3Blbi1zaGFyZV0nKSwgKG5vZGUpID0+IHtcbiAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ09wZW5TaGFyZS5zaGFyZWQnLCBjYik7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRDb3VudHMoY2IpIHtcbiAgY29uc3QgY291bnROb2RlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtb3Blbi1zaGFyZS1jb3VudF0nKTtcblxuICBbXS5mb3JFYWNoLmNhbGwoY291bnROb2RlLCAobm9kZSkgPT4ge1xuICAgIGlmIChub2RlLnRleHRDb250ZW50KSBjYihub2RlKTtcbiAgICBlbHNlIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihgT3BlblNoYXJlLmNvdW50ZWQtJHtub2RlLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50LXVybCcpfWAsIGNiKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIG9uU2hhcmVUYWdNYW5nZXIoZSkge1xuICBjb25zdCBwbGF0Zm9ybSA9IGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlJyk7XG4gIGNvbnN0IHRhcmdldCA9IGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWxpbmsnKSB8fFxuICAgIGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXVybCcpIHx8XG4gICAgZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdXNlcm5hbWUnKSB8fFxuICAgIGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNlbnRlcicpIHx8XG4gICAgZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtc2VhcmNoJykgfHxcbiAgICBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1ib2R5Jyk7XG5cbiAgd2luZG93LmRhdGFMYXllci5wdXNoKHtcbiAgICBldmVudDogJ09wZW5TaGFyZSBTaGFyZScsXG4gICAgcGxhdGZvcm0sXG4gICAgcmVzb3VyY2U6IHRhcmdldCxcbiAgICBhY3Rpdml0eTogJ3NoYXJlJyxcbiAgfSk7XG59XG4iLCJmdW5jdGlvbiByb3VuZCh4LCBwcmVjaXNpb24pIHtcbiAgaWYgKHR5cGVvZiB4ICE9PSAnbnVtYmVyJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIHZhbHVlIHRvIGJlIGEgbnVtYmVyJyk7XG4gIH1cblxuICBjb25zdCBleHBvbmVudCA9IHByZWNpc2lvbiA+IDAgPyAnZScgOiAnZS0nO1xuICBjb25zdCBleHBvbmVudE5lZyA9IHByZWNpc2lvbiA+IDAgPyAnZS0nIDogJ2UnO1xuICBwcmVjaXNpb24gPSBNYXRoLmFicyhwcmVjaXNpb24pO1xuXG4gIHJldHVybiBOdW1iZXIoTWF0aC5yb3VuZCh4ICsgZXhwb25lbnQgKyBwcmVjaXNpb24pICsgZXhwb25lbnROZWcgKyBwcmVjaXNpb24pO1xufVxuXG5mdW5jdGlvbiB0aG91c2FuZGlmeShudW0pIHtcbiAgcmV0dXJuIGAke3JvdW5kKG51bSAvIDEwMDAsIDEpfUtgO1xufVxuXG5mdW5jdGlvbiBtaWxsaW9uaWZ5KG51bSkge1xuICByZXR1cm4gYCR7cm91bmQobnVtIC8gMTAwMDAwMCwgMSl9TWA7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNvdW50UmVkdWNlKGVsLCBjb3VudCwgY2IpIHtcbiAgaWYgKGNvdW50ID4gOTk5OTk5KSB7XG4gICAgZWwuaW5uZXJIVE1MID0gbWlsbGlvbmlmeShjb3VudCk7XG4gICAgaWYgKGNiICYmIHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykgY2IoZWwpO1xuICB9IGVsc2UgaWYgKGNvdW50ID4gOTk5KSB7XG4gICAgZWwuaW5uZXJIVE1MID0gdGhvdXNhbmRpZnkoY291bnQpO1xuICAgIGlmIChjYiAmJiB0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpIGNiKGVsKTtcbiAgfSBlbHNlIHtcbiAgICBlbC5pbm5lckhUTUwgPSBjb3VudDtcbiAgICBpZiAoY2IgJiYgdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSBjYihlbCk7XG4gIH1cbn1cbiIsIi8vIHR5cGUgY29udGFpbnMgYSBkYXNoXG4vLyB0cmFuc2Zvcm0gdG8gY2FtZWxjYXNlIGZvciBmdW5jdGlvbiByZWZlcmVuY2Vcbi8vIFRPRE86IG9ubHkgc3VwcG9ydHMgc2luZ2xlIGRhc2gsIHNob3VsZCBzaG91bGQgc3VwcG9ydCBtdWx0aXBsZVxuZXhwb3J0IGRlZmF1bHQgKGRhc2gsIHR5cGUpID0+IHtcbiAgY29uc3QgbmV4dENoYXIgPSB0eXBlLnN1YnN0cihkYXNoICsgMSwgMSk7XG4gIGNvbnN0IGdyb3VwID0gdHlwZS5zdWJzdHIoZGFzaCwgMik7XG5cbiAgdHlwZSA9IHR5cGUucmVwbGFjZShncm91cCwgbmV4dENoYXIudG9VcHBlckNhc2UoKSk7XG4gIHJldHVybiB0eXBlO1xufTtcbiIsImltcG9ydCBpbml0aWFsaXplTm9kZXMgZnJvbSAnLi9pbml0aWFsaXplTm9kZXMnO1xuaW1wb3J0IGluaXRpYWxpemVXYXRjaGVyIGZyb20gJy4vaW5pdGlhbGl6ZVdhdGNoZXInO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBpbml0KG9wdHMpIHtcbiAgcmV0dXJuICgpID0+IHtcbiAgICBjb25zdCBpbml0Tm9kZXMgPSBpbml0aWFsaXplTm9kZXMoe1xuICAgICAgYXBpOiBvcHRzLmFwaSB8fCBudWxsLFxuICAgICAgY29udGFpbmVyOiBvcHRzLmNvbnRhaW5lciB8fCBkb2N1bWVudCxcbiAgICAgIHNlbGVjdG9yOiBvcHRzLnNlbGVjdG9yLFxuICAgICAgY2I6IG9wdHMuY2IsXG4gICAgfSk7XG5cbiAgICBpbml0Tm9kZXMoKTtcblxuICAgIC8vIGNoZWNrIGZvciBtdXRhdGlvbiBvYnNlcnZlcnMgYmVmb3JlIHVzaW5nLCBJRTExIG9ubHlcbiAgICBpZiAod2luZG93Lk11dGF0aW9uT2JzZXJ2ZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaW5pdGlhbGl6ZVdhdGNoZXIoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtb3Blbi1zaGFyZS13YXRjaF0nKSwgaW5pdE5vZGVzKTtcbiAgICB9XG4gIH07XG59XG4iLCJpbXBvcnQgQ291bnQgZnJvbSAnLi4vc3JjL21vZHVsZXMvY291bnQnO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBpbml0aWFsaXplQ291bnROb2RlKG9zKSB7XG4gIC8vIGluaXRpYWxpemUgb3BlbiBzaGFyZSBvYmplY3Qgd2l0aCB0eXBlIGF0dHJpYnV0ZVxuICBjb25zdCB0eXBlID0gb3MuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY291bnQnKTtcbiAgY29uc3QgdXJsID0gb3MuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY291bnQtcmVwbycpIHx8XG4gICAgICBvcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudC1zaG90JykgfHxcbiAgICAgIG9zLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50LXVybCcpO1xuICBjb25zdCBjb3VudCA9IG5ldyBDb3VudCh0eXBlLCB1cmwpO1xuXG4gIGNvdW50LmNvdW50KG9zKTtcbiAgb3Muc2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtbm9kZScsIHR5cGUpO1xufVxuIiwiaW1wb3J0IEV2ZW50cyBmcm9tICcuLi9zcmMvbW9kdWxlcy9ldmVudHMnO1xuaW1wb3J0IGFuYWx5dGljcyBmcm9tICcuLi9hbmFseXRpY3MnO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBpbml0aWFsaXplTm9kZXMob3B0cykge1xuICAvLyBsb29wIHRocm91Z2ggb3BlbiBzaGFyZSBub2RlIGNvbGxlY3Rpb25cbiAgcmV0dXJuICgpID0+IHtcbiAgICAvLyBjaGVjayBmb3IgYW5hbHl0aWNzXG4gICAgY2hlY2tBbmFseXRpY3MoKTtcblxuICAgIGlmIChvcHRzLmFwaSkge1xuICAgICAgY29uc3Qgbm9kZXMgPSBvcHRzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKG9wdHMuc2VsZWN0b3IpO1xuICAgICAgW10uZm9yRWFjaC5jYWxsKG5vZGVzLCBvcHRzLmNiKTtcblxuICAgICAgLy8gdHJpZ2dlciBjb21wbGV0ZWQgZXZlbnRcbiAgICAgIEV2ZW50cy50cmlnZ2VyKGRvY3VtZW50LCBgJHtvcHRzLmFwaX0tbG9hZGVkYCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGxvb3AgdGhyb3VnaCBvcGVuIHNoYXJlIG5vZGUgY29sbGVjdGlvblxuICAgICAgY29uc3Qgc2hhcmVOb2RlcyA9IG9wdHMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwob3B0cy5zZWxlY3Rvci5zaGFyZSk7XG4gICAgICBbXS5mb3JFYWNoLmNhbGwoc2hhcmVOb2Rlcywgb3B0cy5jYi5zaGFyZSk7XG5cbiAgICAgIC8vIHRyaWdnZXIgY29tcGxldGVkIGV2ZW50XG4gICAgICBFdmVudHMudHJpZ2dlcihkb2N1bWVudCwgJ3NoYXJlLWxvYWRlZCcpO1xuXG4gICAgICAvLyBsb29wIHRocm91Z2ggY291bnQgbm9kZSBjb2xsZWN0aW9uXG4gICAgICBjb25zdCBjb3VudE5vZGVzID0gb3B0cy5jb250YWluZXIucXVlcnlTZWxlY3RvckFsbChvcHRzLnNlbGVjdG9yLmNvdW50KTtcbiAgICAgIFtdLmZvckVhY2guY2FsbChjb3VudE5vZGVzLCBvcHRzLmNiLmNvdW50KTtcblxuICAgICAgLy8gdHJpZ2dlciBjb21wbGV0ZWQgZXZlbnRcbiAgICAgIEV2ZW50cy50cmlnZ2VyKGRvY3VtZW50LCAnY291bnQtbG9hZGVkJyk7XG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiBjaGVja0FuYWx5dGljcygpIHtcbiAgLy8gY2hlY2sgZm9yIGFuYWx5dGljc1xuICBpZiAoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignW2RhdGEtb3Blbi1zaGFyZS1hbmFseXRpY3NdJykpIHtcbiAgICBjb25zdCBwcm92aWRlciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLW9wZW4tc2hhcmUtYW5hbHl0aWNzXScpXG4gICAgICAuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtYW5hbHl0aWNzJyk7XG5cbiAgICBpZiAocHJvdmlkZXIuaW5kZXhPZignLCcpID4gLTEpIHtcbiAgICAgIGNvbnN0IHByb3ZpZGVycyA9IHByb3ZpZGVyLnNwbGl0KCcsJyk7XG4gICAgICBwcm92aWRlcnMuZm9yRWFjaChwID0+IGFuYWx5dGljcyhwKSk7XG4gICAgfSBlbHNlIGFuYWx5dGljcyhwcm92aWRlcik7XG4gIH1cbn1cbiIsImltcG9ydCBTaGFyZVRyYW5zZm9ybXMgZnJvbSAnLi4vc3JjL21vZHVsZXMvc2hhcmUtdHJhbnNmb3Jtcyc7XG5pbXBvcnQgT3BlblNoYXJlIGZyb20gJy4uL3NyYy9tb2R1bGVzL29wZW4tc2hhcmUnO1xuaW1wb3J0IHNldERhdGEgZnJvbSAnLi9zZXREYXRhJztcbmltcG9ydCBzaGFyZSBmcm9tICcuL3NoYXJlJztcbmltcG9ydCBkYXNoVG9DYW1lbCBmcm9tICcuL2Rhc2hUb0NhbWVsJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gaW5pdGlhbGl6ZVNoYXJlTm9kZShvcykge1xuICAvLyBpbml0aWFsaXplIG9wZW4gc2hhcmUgb2JqZWN0IHdpdGggdHlwZSBhdHRyaWJ1dGVcbiAgbGV0IHR5cGUgPSBvcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZScpO1xuICBjb25zdCBkYXNoID0gdHlwZS5pbmRleE9mKCctJyk7XG5cbiAgaWYgKGRhc2ggPiAtMSkge1xuICAgIHR5cGUgPSBkYXNoVG9DYW1lbChkYXNoLCB0eXBlKTtcbiAgfVxuXG4gIGNvbnN0IHRyYW5zZm9ybSA9IFNoYXJlVHJhbnNmb3Jtc1t0eXBlXTtcblxuICBpZiAoIXRyYW5zZm9ybSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgT3BlbiBTaGFyZTogJHt0eXBlfSBpcyBhbiBpbnZhbGlkIHR5cGVgKTtcbiAgfVxuXG4gIGNvbnN0IG9wZW5TaGFyZSA9IG5ldyBPcGVuU2hhcmUodHlwZSwgdHJhbnNmb3JtKTtcblxuICAvLyBzcGVjaWZ5IGlmIHRoaXMgaXMgYSBkeW5hbWljIGluc3RhbmNlXG4gIGlmIChvcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1keW5hbWljJykpIHtcbiAgICBvcGVuU2hhcmUuZHluYW1pYyA9IHRydWU7XG4gIH1cblxuICAvLyBzcGVjaWZ5IGlmIHRoaXMgaXMgYSBwb3B1cCBpbnN0YW5jZVxuICBpZiAob3MuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtcG9wdXAnKSkge1xuICAgIG9wZW5TaGFyZS5wb3B1cCA9IHRydWU7XG4gIH1cblxuICAvLyBzZXQgYWxsIG9wdGlvbmFsIGF0dHJpYnV0ZXMgb24gb3BlbiBzaGFyZSBpbnN0YW5jZVxuICBzZXREYXRhKG9wZW5TaGFyZSwgb3MpO1xuXG4gIC8vIG9wZW4gc2hhcmUgZGlhbG9nIG9uIGNsaWNrXG4gIG9zLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcbiAgICBzaGFyZShlLCBvcywgb3BlblNoYXJlKTtcbiAgfSk7XG5cbiAgb3MuYWRkRXZlbnRMaXN0ZW5lcignT3BlblNoYXJlLnRyaWdnZXInLCAoZSkgPT4ge1xuICAgIHNoYXJlKGUsIG9zLCBvcGVuU2hhcmUpO1xuICB9KTtcblxuICBvcy5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1ub2RlJywgdHlwZSk7XG59XG4iLCJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBpbml0aWFsaXplV2F0Y2hlcih3YXRjaGVyLCBmbikge1xuICBbXS5mb3JFYWNoLmNhbGwod2F0Y2hlciwgKHcpID0+IHtcbiAgICBjb25zdCBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKChtdXRhdGlvbnMpID0+IHtcbiAgICAgIC8vIHRhcmdldCB3aWxsIG1hdGNoIGJldHdlZW4gYWxsIG11dGF0aW9ucyBzbyBqdXN0IHVzZSBmaXJzdFxuICAgICAgZm4obXV0YXRpb25zWzBdLnRhcmdldCk7XG4gICAgfSk7XG5cbiAgICBvYnNlcnZlci5vYnNlcnZlKHcsIHtcbiAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICB9KTtcbiAgfSk7XG59XG4iLCJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBzZXREYXRhKG9zSW5zdGFuY2UsIG9zRWxlbWVudCkge1xuICBvc0luc3RhbmNlLnNldERhdGEoe1xuICAgIHVybDogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXVybCcpLFxuICAgIHRleHQ6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS10ZXh0JyksXG4gICAgdmlhOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdmlhJyksXG4gICAgaGFzaHRhZ3M6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1oYXNodGFncycpLFxuICAgIHR3ZWV0SWQ6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS10d2VldC1pZCcpLFxuICAgIHJlbGF0ZWQ6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1yZWxhdGVkJyksXG4gICAgc2NyZWVuTmFtZTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXNjcmVlbi1uYW1lJyksXG4gICAgdXNlcklkOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdXNlci1pZCcpLFxuICAgIGxpbms6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1saW5rJyksXG4gICAgcGljdHVyZTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXBpY3R1cmUnKSxcbiAgICBjYXB0aW9uOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY2FwdGlvbicpLFxuICAgIGRlc2NyaXB0aW9uOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtZGVzY3JpcHRpb24nKSxcbiAgICB1c2VyOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdXNlcicpLFxuICAgIHZpZGVvOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdmlkZW8nKSxcbiAgICB1c2VybmFtZTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXVzZXJuYW1lJyksXG4gICAgdGl0bGU6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS10aXRsZScpLFxuICAgIG1lZGlhOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtbWVkaWEnKSxcbiAgICB0bzogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXRvJyksXG4gICAgc3ViamVjdDogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXN1YmplY3QnKSxcbiAgICBib2R5OiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtYm9keScpLFxuICAgIGlvczogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWlvcycpLFxuICAgIHR5cGU6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS10eXBlJyksXG4gICAgY2VudGVyOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY2VudGVyJyksXG4gICAgdmlld3M6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS12aWV3cycpLFxuICAgIHpvb206IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS16b29tJyksXG4gICAgc2VhcmNoOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtc2VhcmNoJyksXG4gICAgc2FkZHI6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1zYWRkcicpLFxuICAgIGRhZGRyOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtZGFkZHInKSxcbiAgICBkaXJlY3Rpb25zbW9kZTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWRpcmVjdGlvbnMtbW9kZScpLFxuICAgIHJlcG86IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1yZXBvJyksXG4gICAgc2hvdDogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXNob3QnKSxcbiAgICBwZW46IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1wZW4nKSxcbiAgICB2aWV3OiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdmlldycpLFxuICAgIGlzc3VlOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtaXNzdWUnKSxcbiAgICBidXR0b25JZDogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWJ1dHRvbklkJyksXG4gICAgcG9wVXA6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1wb3B1cCcpLFxuICAgIGtleTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWtleScpLFxuICB9KTtcbn1cbiIsImltcG9ydCBFdmVudHMgZnJvbSAnLi4vc3JjL21vZHVsZXMvZXZlbnRzJztcbmltcG9ydCBzZXREYXRhIGZyb20gJy4vc2V0RGF0YSc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHNoYXJlKGUsIG9zLCBvcGVuU2hhcmUpIHtcbiAgLy8gaWYgZHluYW1pYyBpbnN0YW5jZSB0aGVuIGZldGNoIGF0dHJpYnV0ZXMgYWdhaW4gaW4gY2FzZSBvZiB1cGRhdGVzXG4gIGlmIChvcGVuU2hhcmUuZHluYW1pYykge1xuICAgIHNldERhdGEob3BlblNoYXJlLCBvcyk7XG4gIH1cblxuICBvcGVuU2hhcmUuc2hhcmUoZSk7XG5cbiAgLy8gdHJpZ2dlciBzaGFyZWQgZXZlbnRcbiAgRXZlbnRzLnRyaWdnZXIob3MsICdzaGFyZWQnKTtcbn1cbiIsIi8qXG4gICBTb21ldGltZXMgc29jaWFsIHBsYXRmb3JtcyBnZXQgY29uZnVzZWQgYW5kIGRyb3Agc2hhcmUgY291bnRzLlxuICAgSW4gdGhpcyBtb2R1bGUgd2UgY2hlY2sgaWYgdGhlIHJldHVybmVkIGNvdW50IGlzIGxlc3MgdGhhbiB0aGUgY291bnQgaW5cbiAgIGxvY2Fsc3RvcmFnZS5cbiAgIElmIHRoZSBsb2NhbCBjb3VudCBpcyBncmVhdGVyIHRoYW4gdGhlIHJldHVybmVkIGNvdW50LFxuICAgd2Ugc3RvcmUgdGhlIGxvY2FsIGNvdW50ICsgdGhlIHJldHVybmVkIGNvdW50LlxuICAgT3RoZXJ3aXNlLCBzdG9yZSB0aGUgcmV0dXJuZWQgY291bnQuXG4qL1xuXG5leHBvcnQgZGVmYXVsdCAodCwgY291bnQpID0+IHtcbiAgY29uc3QgaXNBcnIgPSB0LnR5cGUuaW5kZXhPZignLCcpID4gLTE7XG4gIGNvbnN0IGxvY2FsID0gTnVtYmVyKHQuc3RvcmVHZXQoYCR7dC50eXBlfS0ke3Quc2hhcmVkfWApKTtcblxuICBpZiAobG9jYWwgPiBjb3VudCAmJiAhaXNBcnIpIHtcbiAgICBjb25zdCBsYXRlc3RDb3VudCA9IE51bWJlcih0LnN0b3JlR2V0KGAke3QudHlwZX0tJHt0LnNoYXJlZH0tbGF0ZXN0Q291bnRgKSk7XG4gICAgdC5zdG9yZVNldChgJHt0LnR5cGV9LSR7dC5zaGFyZWR9LWxhdGVzdENvdW50YCwgY291bnQpO1xuXG4gICAgY291bnQgPSBpc051bWVyaWMobGF0ZXN0Q291bnQpICYmIGxhdGVzdENvdW50ID4gMCA/XG4gICAgICBjb3VudCArPSBsb2NhbCAtIGxhdGVzdENvdW50IDpcbiAgICAgIGNvdW50ICs9IGxvY2FsO1xuICB9XG5cbiAgaWYgKCFpc0FycikgdC5zdG9yZVNldChgJHt0LnR5cGV9LSR7dC5zaGFyZWR9YCwgY291bnQpO1xuICByZXR1cm4gY291bnQ7XG59O1xuXG5mdW5jdGlvbiBpc051bWVyaWMobikge1xuICByZXR1cm4gIWlzTmFOKHBhcnNlRmxvYXQobikpICYmIGlzRmluaXRlKG4pO1xufVxuIiwiaW1wb3J0IERhdGFBdHRyIGZyb20gJy4vbW9kdWxlcy9kYXRhLWF0dHInO1xuaW1wb3J0IFNoYXJlQVBJIGZyb20gJy4vbW9kdWxlcy9zaGFyZS1hcGknO1xuaW1wb3J0IEV2ZW50cyBmcm9tICcuL21vZHVsZXMvZXZlbnRzJztcbmltcG9ydCBPcGVuU2hhcmUgZnJvbSAnLi9tb2R1bGVzL29wZW4tc2hhcmUnO1xuaW1wb3J0IFNoYXJlVHJhbnNmb3JtcyBmcm9tICcuL21vZHVsZXMvc2hhcmUtdHJhbnNmb3Jtcyc7XG5pbXBvcnQgQ291bnQgZnJvbSAnLi9tb2R1bGVzL2NvdW50JztcbmltcG9ydCBDb3VudEFQSSBmcm9tICcuL21vZHVsZXMvY291bnQtYXBpJztcbmltcG9ydCBhbmFseXRpY3NBUEkgZnJvbSAnLi4vYW5hbHl0aWNzJztcblxuY29uc3QgYnJvd3NlciA9ICgpID0+IHtcbiAgRGF0YUF0dHIoT3BlblNoYXJlLCBDb3VudCwgU2hhcmVUcmFuc2Zvcm1zLCBFdmVudHMpO1xuICB3aW5kb3cuT3BlblNoYXJlID0ge1xuICAgIHNoYXJlOiBTaGFyZUFQSShPcGVuU2hhcmUsIFNoYXJlVHJhbnNmb3JtcywgRXZlbnRzKSxcbiAgICBjb3VudDogQ291bnRBUEkoKSxcbiAgICBhbmFseXRpY3M6IGFuYWx5dGljc0FQSSxcbiAgfTtcbn07XG5leHBvcnQgZGVmYXVsdCBicm93c2VyKCk7XG4iLCIvKipcbiAqIGNvdW50IEFQSVxuICovXG5cbmltcG9ydCBjb3VudCBmcm9tICcuL2NvdW50JztcblxuZXhwb3J0IGRlZmF1bHQgKCkgPT4geyAvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgLy8gZ2xvYmFsIE9wZW5TaGFyZSByZWZlcmVuY2luZyBpbnRlcm5hbCBjbGFzcyBmb3IgaW5zdGFuY2UgZ2VuZXJhdGlvblxuICBjbGFzcyBDb3VudCB7XG5cbiAgICBjb25zdHJ1Y3Rvcih7XG4gICAgICB0eXBlLFxuICAgICAgdXJsLFxuICAgICAgYXBwZW5kVG8gPSBmYWxzZSxcbiAgICAgIGVsZW1lbnQsXG4gICAgICBjbGFzc2VzLFxuICAgICAga2V5ID0gbnVsbCxcbiAgICB9LCBjYikge1xuICAgICAgY29uc3QgY291bnROb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChlbGVtZW50IHx8ICdzcGFuJyk7XG5cbiAgICAgIGNvdW50Tm9kZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudCcsIHR5cGUpO1xuICAgICAgY291bnROb2RlLnNldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50LXVybCcsIHVybCk7XG4gICAgICBpZiAoa2V5KSBjb3VudE5vZGUuc2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUta2V5Jywga2V5KTtcblxuICAgICAgY291bnROb2RlLmNsYXNzTGlzdC5hZGQoJ29wZW4tc2hhcmUtY291bnQnKTtcblxuICAgICAgaWYgKGNsYXNzZXMgJiYgQXJyYXkuaXNBcnJheShjbGFzc2VzKSkge1xuICAgICAgICBjbGFzc2VzLmZvckVhY2goKGNzc0NMYXNzKSA9PiB7XG4gICAgICAgICAgY291bnROb2RlLmNsYXNzTGlzdC5hZGQoY3NzQ0xhc3MpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKGFwcGVuZFRvKSB7XG4gICAgICAgIHJldHVybiBuZXcgY291bnQodHlwZSwgdXJsKS5jb3VudChjb3VudE5vZGUsIGNiLCBhcHBlbmRUbyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXcgY291bnQodHlwZSwgdXJsKS5jb3VudChjb3VudE5vZGUsIGNiKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gQ291bnQ7XG59O1xuIiwiaW1wb3J0IGNvdW50UmVkdWNlIGZyb20gJy4uLy4uL2xpYi9jb3VudFJlZHVjZSc7XG5pbXBvcnQgc3RvcmVDb3VudCBmcm9tICcuLi8uLi9saWIvc3RvcmVDb3VudCc7XG4vKipcbiAqIE9iamVjdCBvZiB0cmFuc2Zvcm0gZnVuY3Rpb25zIGZvciBlYWNoIG9wZW5zaGFyZSBhcGlcbiAqIFRyYW5zZm9ybSBmdW5jdGlvbnMgcGFzc2VkIGludG8gT3BlblNoYXJlIGluc3RhbmNlIHdoZW4gaW5zdGFudGlhdGVkXG4gKiBSZXR1cm4gb2JqZWN0IGNvbnRhaW5pbmcgVVJMIGFuZCBrZXkvdmFsdWUgYXJnc1xuICovXG5leHBvcnQgZGVmYXVsdCB7XG5cbiAgLy8gZmFjZWJvb2sgY291bnQgZGF0YVxuICBmYWNlYm9vayh1cmwpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ2dldCcsXG4gICAgICB1cmw6IGBodHRwczovL2dyYXBoLmZhY2Vib29rLmNvbS8/aWQ9JHt1cmx9YCxcbiAgICAgIHRyYW5zZm9ybSh4aHIpIHtcbiAgICAgICAgY29uc3QgZmIgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpO1xuXG4gICAgICAgIGNvbnN0IGNvdW50ID0gZmIuc2hhcmUgJiYgZmIuc2hhcmUuc2hhcmVfY291bnQgfHwgMDtcblxuICAgICAgICByZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBjb3VudCk7XG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbi8vIHBpbnRlcmVzdCBjb3VudCBkYXRhXG4gIHBpbnRlcmVzdCh1cmwpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ2pzb25wJyxcbiAgICAgIHVybDogYGh0dHBzOi8vYXBpLnBpbnRlcmVzdC5jb20vdjEvdXJscy9jb3VudC5qc29uP2NhbGxiYWNrPT8mdXJsPSR7dXJsfWAsXG4gICAgICB0cmFuc2Zvcm0oZGF0YSkge1xuICAgICAgICBjb25zdCBjb3VudCA9IGRhdGEuY291bnQ7XG4gICAgICAgIHJldHVybiBzdG9yZUNvdW50KHRoaXMsIGNvdW50KTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBsaW5rZWRpbiBjb3VudCBkYXRhXG4gIGxpbmtlZGluKHVybCkge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiAnanNvbnAnLFxuICAgICAgdXJsOiBgaHR0cHM6Ly93d3cubGlua2VkaW4uY29tL2NvdW50c2Vydi9jb3VudC9zaGFyZT91cmw9JHt1cmx9JmZvcm1hdD1qc29ucCZjYWxsYmFjaz0/YCxcbiAgICAgIHRyYW5zZm9ybShkYXRhKSB7XG4gICAgICAgIGNvbnN0IGNvdW50ID0gZGF0YS5jb3VudDtcbiAgICAgICAgcmV0dXJuIHN0b3JlQ291bnQodGhpcywgY291bnQpO1xuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHJlZGRpdCBjb3VudCBkYXRhXG4gIHJlZGRpdCh1cmwpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ2dldCcsXG4gICAgICB1cmw6IGBodHRwczovL3d3dy5yZWRkaXQuY29tL2FwaS9pbmZvLmpzb24/dXJsPSR7dXJsfWAsXG4gICAgICB0cmFuc2Zvcm0oeGhyKSB7XG4gICAgICAgIGNvbnN0IHBvc3RzID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KS5kYXRhLmNoaWxkcmVuO1xuICAgICAgICBsZXQgdXBzID0gMDtcblxuICAgICAgICBwb3N0cy5mb3JFYWNoKChwb3N0KSA9PiB7XG4gICAgICAgICAgdXBzICs9IE51bWJlcihwb3N0LmRhdGEudXBzKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHN0b3JlQ291bnQodGhpcywgdXBzKTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuLy8gZ29vZ2xlIGNvdW50IGRhdGFcbiAgZ29vZ2xlKHVybCkge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiAncG9zdCcsXG4gICAgICBkYXRhOiB7XG4gICAgICAgIG1ldGhvZDogJ3Bvcy5wbHVzb25lcy5nZXQnLFxuICAgICAgICBpZDogJ3AnLFxuICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICBub2xvZzogdHJ1ZSxcbiAgICAgICAgICBpZDogdXJsLFxuICAgICAgICAgIHNvdXJjZTogJ3dpZGdldCcsXG4gICAgICAgICAgdXNlcklkOiAnQHZpZXdlcicsXG4gICAgICAgICAgZ3JvdXBJZDogJ0BzZWxmJyxcbiAgICAgICAgfSxcbiAgICAgICAganNvbnJwYzogJzIuMCcsXG4gICAgICAgIGtleTogJ3AnLFxuICAgICAgICBhcGlWZXJzaW9uOiAndjEnLFxuICAgICAgfSxcbiAgICAgIHVybDogJ2h0dHBzOi8vY2xpZW50czYuZ29vZ2xlLmNvbS9ycGMnLFxuICAgICAgdHJhbnNmb3JtKHhocikge1xuICAgICAgICBjb25zdCBjb3VudCA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCkucmVzdWx0Lm1ldGFkYXRhLmdsb2JhbENvdW50cy5jb3VudDtcbiAgICAgICAgcmV0dXJuIHN0b3JlQ291bnQodGhpcywgY291bnQpO1xuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIGdpdGh1YiBzdGFyIGNvdW50XG4gIGdpdGh1YlN0YXJzKHJlcG8pIHtcbiAgICByZXBvID0gcmVwby5pbmRleE9mKCdnaXRodWIuY29tLycpID4gLTEgP1xuICAgIHJlcG8uc3BsaXQoJ2dpdGh1Yi5jb20vJylbMV0gOlxuICAgIHJlcG87XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6ICdnZXQnLFxuICAgICAgdXJsOiBgaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9yZXBvcy8ke3JlcG99YCxcbiAgICAgIHRyYW5zZm9ybSh4aHIpIHtcbiAgICAgICAgY29uc3QgY291bnQgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpLnN0YXJnYXplcnNfY291bnQ7XG4gICAgICAgIHJldHVybiBzdG9yZUNvdW50KHRoaXMsIGNvdW50KTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBnaXRodWIgZm9ya3MgY291bnRcbiAgZ2l0aHViRm9ya3MocmVwbykge1xuICAgIHJlcG8gPSByZXBvLmluZGV4T2YoJ2dpdGh1Yi5jb20vJykgPiAtMSA/XG4gICAgcmVwby5zcGxpdCgnZ2l0aHViLmNvbS8nKVsxXSA6XG4gICAgcmVwbztcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ2dldCcsXG4gICAgICB1cmw6IGBodHRwczovL2FwaS5naXRodWIuY29tL3JlcG9zLyR7cmVwb31gLFxuICAgICAgdHJhbnNmb3JtKHhocikge1xuICAgICAgICBjb25zdCBjb3VudCA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCkuZm9ya3NfY291bnQ7XG4gICAgICAgIHJldHVybiBzdG9yZUNvdW50KHRoaXMsIGNvdW50KTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBnaXRodWIgd2F0Y2hlcnMgY291bnRcbiAgZ2l0aHViV2F0Y2hlcnMocmVwbykge1xuICAgIHJlcG8gPSByZXBvLmluZGV4T2YoJ2dpdGh1Yi5jb20vJykgPiAtMSA/XG4gICAgcmVwby5zcGxpdCgnZ2l0aHViLmNvbS8nKVsxXSA6XG4gICAgcmVwbztcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ2dldCcsXG4gICAgICB1cmw6IGBodHRwczovL2FwaS5naXRodWIuY29tL3JlcG9zLyR7cmVwb31gLFxuICAgICAgdHJhbnNmb3JtKHhocikge1xuICAgICAgICBjb25zdCBjb3VudCA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCkud2F0Y2hlcnNfY291bnQ7XG4gICAgICAgIHJldHVybiBzdG9yZUNvdW50KHRoaXMsIGNvdW50KTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBkcmliYmJsZSBsaWtlcyBjb3VudFxuICBkcmliYmJsZShzaG90KSB7XG4gICAgc2hvdCA9IHNob3QuaW5kZXhPZignZHJpYmJibGUuY29tL3Nob3RzJykgPiAtMSA/XG4gICAgc2hvdC5zcGxpdCgnc2hvdHMvJylbMV0gOlxuICAgIHNob3Q7XG4gICAgY29uc3QgdXJsID0gYGh0dHBzOi8vYXBpLmRyaWJiYmxlLmNvbS92MS9zaG90cy8ke3Nob3R9L2xpa2VzYDtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ2dldCcsXG4gICAgICB1cmwsXG4gICAgICB0cmFuc2Zvcm0oeGhyLCBFdmVudHMpIHtcbiAgICAgICAgY29uc3QgY291bnQgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpLmxlbmd0aDtcblxuICAgICAgICAvLyBhdCB0aGlzIHRpbWUgZHJpYmJibGUgbGltaXRzIGEgcmVzcG9uc2Ugb2YgMTIgbGlrZXMgcGVyIHBhZ2VcbiAgICAgICAgaWYgKGNvdW50ID09PSAxMikge1xuICAgICAgICAgIGNvbnN0IHBhZ2UgPSAyO1xuICAgICAgICAgIHJlY3Vyc2l2ZUNvdW50KHVybCwgcGFnZSwgY291bnQsIChmaW5hbENvdW50KSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5hcHBlbmRUbyAmJiB0eXBlb2YgdGhpcy5hcHBlbmRUbyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICB0aGlzLmFwcGVuZFRvLmFwcGVuZENoaWxkKHRoaXMub3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY291bnRSZWR1Y2UodGhpcy5vcywgZmluYWxDb3VudCwgdGhpcy5jYik7XG4gICAgICAgICAgICBFdmVudHMudHJpZ2dlcih0aGlzLm9zLCBgY291bnRlZC0ke3RoaXMudXJsfWApO1xuICAgICAgICAgICAgcmV0dXJuIHN0b3JlQ291bnQodGhpcywgZmluYWxDb3VudCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHN0b3JlQ291bnQodGhpcywgY291bnQpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgdHdpdHRlcih1cmwpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ2dldCcsXG4gICAgICB1cmw6IGBodHRwczovL2FwaS5vcGVuc2hhcmUuc29jaWFsL2pvYj91cmw9JHt1cmx9JmtleT1gLFxuICAgICAgdHJhbnNmb3JtKHhocikge1xuICAgICAgICBjb25zdCBjb3VudCA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCkuY291bnQ7XG4gICAgICAgIHJldHVybiBzdG9yZUNvdW50KHRoaXMsIGNvdW50KTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcbn07XG5cbmZ1bmN0aW9uIHJlY3Vyc2l2ZUNvdW50KHVybCwgcGFnZSwgY291bnQsIGNiKSB7XG4gIGNvbnN0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICB4aHIub3BlbignR0VUJywgYCR7dXJsfT9wYWdlPSR7cGFnZX1gKTtcbiAgeGhyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7IC8vZXNsaW50LWRpc2FibGUtbGluZVxuICAgIGNvbnN0IGxpa2VzID0gSlNPTi5wYXJzZSh0aGlzLnJlc3BvbnNlKTtcbiAgICBjb3VudCArPSBsaWtlcy5sZW5ndGg7XG5cbiAgICAvLyBkcmliYmJsZSBsaWtlIHBlciBwYWdlIGlzIDEyXG4gICAgaWYgKGxpa2VzLmxlbmd0aCA9PT0gMTIpIHtcbiAgICAgIHBhZ2UrKztcbiAgICAgIHJlY3Vyc2l2ZUNvdW50KHVybCwgcGFnZSwgY291bnQsIGNiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2IoY291bnQpO1xuICAgIH1cbiAgfSk7XG4gIHhoci5zZW5kKCk7XG59XG4iLCIvKipcbiAqIEdlbmVyYXRlIHNoYXJlIGNvdW50IGluc3RhbmNlIGZyb20gb25lIHRvIG1hbnkgbmV0d29ya3NcbiAqL1xuXG5pbXBvcnQgQ291bnRUcmFuc2Zvcm1zIGZyb20gJy4vY291bnQtdHJhbnNmb3Jtcyc7XG5pbXBvcnQgRXZlbnRzIGZyb20gJy4vZXZlbnRzJztcbmltcG9ydCBjb3VudFJlZHVjZSBmcm9tICcuLi8uLi9saWIvY291bnRSZWR1Y2UnO1xuaW1wb3J0IHN0b3JlQ291bnQgZnJvbSAnLi4vLi4vbGliL3N0b3JlQ291bnQnOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG5cbmZ1bmN0aW9uIGlzTnVtZXJpYyhuKSB7XG4gIHJldHVybiAhaXNOYU4ocGFyc2VGbG9hdChuKSkgJiYgaXNGaW5pdGUobik7XG59XG5cbmNsYXNzIENvdW50IHtcbiAgY29uc3RydWN0b3IodHlwZSwgdXJsKSB7XG4gICAgLy8gdGhyb3cgZXJyb3IgaWYgbm8gdXJsIHByb3ZpZGVkXG4gICAgaWYgKCF1cmwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignT3BlbiBTaGFyZTogbm8gdXJsIHByb3ZpZGVkIGZvciBjb3VudCcpO1xuICAgIH1cblxuICAgIC8vIGNoZWNrIGZvciBHaXRodWIgY291bnRzXG4gICAgaWYgKHR5cGUuaW5kZXhPZignZ2l0aHViJykgPT09IDApIHtcbiAgICAgIGlmICh0eXBlID09PSAnZ2l0aHViLXN0YXJzJykge1xuICAgICAgICB0eXBlID0gJ2dpdGh1YlN0YXJzJztcbiAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ2dpdGh1Yi1mb3JrcycpIHtcbiAgICAgICAgdHlwZSA9ICdnaXRodWJGb3Jrcyc7XG4gICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdnaXRodWItd2F0Y2hlcnMnKSB7XG4gICAgICAgIHR5cGUgPSAnZ2l0aHViV2F0Y2hlcnMnO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignSW52YWxpZCBHaXRodWIgY291bnQgdHlwZS4gVHJ5IGdpdGh1Yi1zdGFycywgZ2l0aHViLWZvcmtzLCBvciBnaXRodWItd2F0Y2hlcnMuJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gaWYgdHlwZSBpcyBjb21tYSBzZXBhcmF0ZSBsaXN0IGNyZWF0ZSBhcnJheVxuICAgIGlmICh0eXBlLmluZGV4T2YoJywnKSA+IC0xKSB7XG4gICAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgICAgdGhpcy50eXBlQXJyID0gdGhpcy50eXBlLnNwbGl0KCcsJyk7XG4gICAgICB0aGlzLmNvdW50RGF0YSA9IFtdO1xuXG4gICAgICAvLyBjaGVjayBlYWNoIHR5cGUgc3VwcGxpZWQgaXMgdmFsaWRcbiAgICAgIHRoaXMudHlwZUFyci5mb3JFYWNoKCh0KSA9PiB7XG4gICAgICAgIGlmICghQ291bnRUcmFuc2Zvcm1zW3RdKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBPcGVuIFNoYXJlOiAke3R5cGV9IGlzIGFuIGludmFsaWQgY291bnQgdHlwZWApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb3VudERhdGEucHVzaChDb3VudFRyYW5zZm9ybXNbdF0odXJsKSk7XG4gICAgICB9KTtcblxuICAgICAgLy8gdGhyb3cgZXJyb3IgaWYgaW52YWxpZCB0eXBlIHByb3ZpZGVkXG4gICAgfSBlbHNlIGlmICghQ291bnRUcmFuc2Zvcm1zW3R5cGVdKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYE9wZW4gU2hhcmU6ICR7dHlwZX0gaXMgYW4gaW52YWxpZCBjb3VudCB0eXBlYCk7XG5cbiAgICAgICAgLy8gc2luZ2xlIGNvdW50XG4gICAgICAgIC8vIHN0b3JlIGNvdW50IFVSTCBhbmQgdHJhbnNmb3JtIGZ1bmN0aW9uXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgICB0aGlzLmNvdW50RGF0YSA9IENvdW50VHJhbnNmb3Jtc1t0eXBlXSh1cmwpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGhhbmRsZSBjYWxsaW5nIGdldENvdW50IC8gZ2V0Q291bnRzXG4gIC8vIGRlcGVuZGluZyBvbiBudW1iZXIgb2YgdHlwZXNcbiAgY291bnQob3MsIGNiLCBhcHBlbmRUbykge1xuICAgIHRoaXMub3MgPSBvcztcbiAgICB0aGlzLmFwcGVuZFRvID0gYXBwZW5kVG87XG4gICAgdGhpcy5jYiA9IGNiO1xuICAgIHRoaXMudXJsID0gdGhpcy5vcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudCcpO1xuICAgIHRoaXMuc2hhcmVkID0gdGhpcy5vcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudC11cmwnKTtcbiAgICB0aGlzLmtleSA9IHRoaXMub3MuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUta2V5Jyk7XG5cbiAgICBpZiAoIUFycmF5LmlzQXJyYXkodGhpcy5jb3VudERhdGEpKSB7XG4gICAgICB0aGlzLmdldENvdW50KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZ2V0Q291bnRzKCk7XG4gICAgfVxuICB9XG5cbiAgLy8gZmV0Y2ggY291bnQgZWl0aGVyIEFKQVggb3IgSlNPTlBcbiAgZ2V0Q291bnQoKSB7XG4gICAgY29uc3QgY291bnQgPSB0aGlzLnN0b3JlR2V0KGAke3RoaXMudHlwZX0tJHt0aGlzLnNoYXJlZH1gKTtcblxuICAgIGlmIChjb3VudCkge1xuICAgICAgaWYgKHRoaXMuYXBwZW5kVG8gJiYgdHlwZW9mIHRoaXMuYXBwZW5kVG8gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhpcy5hcHBlbmRUby5hcHBlbmRDaGlsZCh0aGlzLm9zKTtcbiAgICAgIH1cbiAgICAgIGNvdW50UmVkdWNlKHRoaXMub3MsIGNvdW50KTtcbiAgICB9XG4gICAgdGhpc1t0aGlzLmNvdW50RGF0YS50eXBlXSh0aGlzLmNvdW50RGF0YSk7XG4gIH1cblxuICAvLyBmZXRjaCBtdWx0aXBsZSBjb3VudHMgYW5kIGFnZ3JlZ2F0ZVxuICBnZXRDb3VudHMoKSB7XG4gICAgdGhpcy50b3RhbCA9IFtdO1xuXG4gICAgY29uc3QgY291bnQgPSB0aGlzLnN0b3JlR2V0KGAke3RoaXMudHlwZX0tJHt0aGlzLnNoYXJlZH1gKTtcblxuICAgIGlmIChjb3VudCkge1xuICAgICAgaWYgKHRoaXMuYXBwZW5kVG8gJiYgdHlwZW9mIHRoaXMuYXBwZW5kVG8gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhpcy5hcHBlbmRUby5hcHBlbmRDaGlsZCh0aGlzLm9zKTtcbiAgICAgIH1cbiAgICAgIGNvdW50UmVkdWNlKHRoaXMub3MsIGNvdW50KTtcbiAgICB9XG5cbiAgICB0aGlzLmNvdW50RGF0YS5mb3JFYWNoKChjb3VudERhdGEpID0+IHtcbiAgICAgIHRoaXNbY291bnREYXRhLnR5cGVdKGNvdW50RGF0YSwgKG51bSkgPT4ge1xuICAgICAgICB0aGlzLnRvdGFsLnB1c2gobnVtKTtcblxuICAgICAgICAvLyB0b3RhbCBjb3VudHMgbGVuZ3RoIG5vdyBlcXVhbHMgdHlwZSBhcnJheSBsZW5ndGhcbiAgICAgICAgLy8gc28gYWdncmVnYXRlLCBzdG9yZSBhbmQgaW5zZXJ0IGludG8gRE9NXG4gICAgICAgIGlmICh0aGlzLnRvdGFsLmxlbmd0aCA9PT0gdGhpcy50eXBlQXJyLmxlbmd0aCkge1xuICAgICAgICAgIGxldCB0b3QgPSAwO1xuXG4gICAgICAgICAgdGhpcy50b3RhbC5mb3JFYWNoKCh0KSA9PiB7XG4gICAgICAgICAgICB0b3QgKz0gdDtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGlmICh0aGlzLmFwcGVuZFRvICYmIHR5cGVvZiB0aGlzLmFwcGVuZFRvICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aGlzLmFwcGVuZFRvLmFwcGVuZENoaWxkKHRoaXMub3MpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IGxvY2FsID0gTnVtYmVyKHRoaXMuc3RvcmVHZXQoYCR7dGhpcy50eXBlfS0ke3RoaXMuc2hhcmVkfWApKTtcbiAgICAgICAgICBpZiAobG9jYWwgPiB0b3QpIHtcbiAgICAgICAgICAgIGNvbnN0IGxhdGVzdENvdW50ID0gTnVtYmVyKHRoaXMuc3RvcmVHZXQoYCR7dGhpcy50eXBlfS0ke3RoaXMuc2hhcmVkfS1sYXRlc3RDb3VudGApKTtcbiAgICAgICAgICAgIHRoaXMuc3RvcmVTZXQoYCR7dGhpcy50eXBlfS0ke3RoaXMuc2hhcmVkfS1sYXRlc3RDb3VudGAsIHRvdCk7XG5cbiAgICAgICAgICAgIHRvdCA9IGlzTnVtZXJpYyhsYXRlc3RDb3VudCkgJiYgbGF0ZXN0Q291bnQgPiAwID9cbiAgICAgICAgICAgIHRvdCArPSBsb2NhbCAtIGxhdGVzdENvdW50IDpcbiAgICAgICAgICAgIHRvdCArPSBsb2NhbDtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5zdG9yZVNldChgJHt0aGlzLnR5cGV9LSR7dGhpcy5zaGFyZWR9YCwgdG90KTtcblxuICAgICAgICAgIGNvdW50UmVkdWNlKHRoaXMub3MsIHRvdCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaWYgKHRoaXMuYXBwZW5kVG8gJiYgdHlwZW9mIHRoaXMuYXBwZW5kVG8gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRoaXMuYXBwZW5kVG8uYXBwZW5kQ2hpbGQodGhpcy5vcyk7XG4gICAgfVxuICB9XG5cbiAgLy8gaGFuZGxlIEpTT05QIHJlcXVlc3RzXG4gIGpzb25wKGNvdW50RGF0YSwgY2IpIHtcbiAgLy8gZGVmaW5lIHJhbmRvbSBjYWxsYmFjayBhbmQgYXNzaWduIHRyYW5zZm9ybSBmdW5jdGlvblxuICAgIGNvbnN0IGNhbGxiYWNrID0gTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyaW5nKDcpLnJlcGxhY2UoL1teYS16QS1aXS9nLCAnJyk7XG4gICAgd2luZG93W2NhbGxiYWNrXSA9IChkYXRhKSA9PiB7XG4gICAgICBjb25zdCBjb3VudCA9IGNvdW50RGF0YS50cmFuc2Zvcm0uYXBwbHkodGhpcywgW2RhdGFdKSB8fCAwO1xuXG4gICAgICBpZiAoY2IgJiYgdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGNiKGNvdW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0aGlzLmFwcGVuZFRvICYmIHR5cGVvZiB0aGlzLmFwcGVuZFRvICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgdGhpcy5hcHBlbmRUby5hcHBlbmRDaGlsZCh0aGlzLm9zKTtcbiAgICAgICAgfVxuICAgICAgICBjb3VudFJlZHVjZSh0aGlzLm9zLCBjb3VudCwgdGhpcy5jYik7XG4gICAgICB9XG5cbiAgICAgIEV2ZW50cy50cmlnZ2VyKHRoaXMub3MsIGBjb3VudGVkLSR7dGhpcy51cmx9YCk7XG4gICAgfTtcblxuICAgIC8vIGFwcGVuZCBKU09OUCBzY3JpcHQgdGFnIHRvIHBhZ2VcbiAgICBjb25zdCBzY3JpcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICBzY3JpcHQuc3JjID0gY291bnREYXRhLnVybC5yZXBsYWNlKCdjYWxsYmFjaz0/JywgYGNhbGxiYWNrPSR7Y2FsbGJhY2t9YCk7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXS5hcHBlbmRDaGlsZChzY3JpcHQpO1xuXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gaGFuZGxlIEFKQVggR0VUIHJlcXVlc3RcbiAgZ2V0KGNvdW50RGF0YSwgY2IpIHtcbiAgICBjb25zdCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgIC8vIG9uIHN1Y2Nlc3MgcGFzcyByZXNwb25zZSB0byB0cmFuc2Zvcm0gZnVuY3Rpb25cbiAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gKCkgPT4ge1xuICAgICAgaWYgKHhoci5yZWFkeVN0YXRlID09PSA0KSB7XG4gICAgICAgIGlmICh4aHIuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICBjb25zdCBjb3VudCA9IGNvdW50RGF0YS50cmFuc2Zvcm0uYXBwbHkodGhpcywgW3hociwgRXZlbnRzXSkgfHwgMDtcblxuICAgICAgICAgIGlmIChjYiAmJiB0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNiKGNvdW50KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHRoaXMuYXBwZW5kVG8gJiYgdHlwZW9mIHRoaXMuYXBwZW5kVG8gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgdGhpcy5hcHBlbmRUby5hcHBlbmRDaGlsZCh0aGlzLm9zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvdW50UmVkdWNlKHRoaXMub3MsIGNvdW50LCB0aGlzLmNiKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBFdmVudHMudHJpZ2dlcih0aGlzLm9zLCBgY291bnRlZC0ke3RoaXMudXJsfWApO1xuICAgICAgICB9IGVsc2UgaWYgKGNvdW50RGF0YS51cmwudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdodHRwczovL2FwaS5vcGVuc2hhcmUuc29jaWFsL2pvYj8nKSA9PT0gMCkge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1BsZWFzZSBzaWduIHVwIGZvciBUd2l0dGVyIGNvdW50cyBhdCBodHRwczovL29wZW5zaGFyZS5zb2NpYWwvdHdpdHRlci9hdXRoJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIGdldCBBUEkgZGF0YSBmcm9tJywgY291bnREYXRhLnVybCwgJy4gUGxlYXNlIHVzZSB0aGUgbGF0ZXN0IHZlcnNpb24gb2YgT3BlblNoYXJlLicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuICAgIGNvdW50RGF0YS51cmwgPSBjb3VudERhdGEudXJsLnN0YXJ0c1dpdGgoJ2h0dHBzOi8vYXBpLm9wZW5zaGFyZS5zb2NpYWwvam9iPycpICYmIHRoaXMua2V5ID9cbiAgICAgIGNvdW50RGF0YS51cmwgKyB0aGlzLmtleSA6XG4gICAgICBjb3VudERhdGEudXJsO1xuXG4gICAgeGhyLm9wZW4oJ0dFVCcsIGNvdW50RGF0YS51cmwpO1xuICAgIHhoci5zZW5kKCk7XG4gIH1cblxuICAvLyBoYW5kbGUgQUpBWCBQT1NUIHJlcXVlc3RcbiAgcG9zdChjb3VudERhdGEsIGNiKSB7XG4gICAgY29uc3QgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICAvLyBvbiBzdWNjZXNzIHBhc3MgcmVzcG9uc2UgdG8gdHJhbnNmb3JtIGZ1bmN0aW9uXG4gICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9ICgpID0+IHtcbiAgICAgIGlmICh4aHIucmVhZHlTdGF0ZSAhPT0gWE1MSHR0cFJlcXVlc3QuRE9ORSB8fFxuICAgICAgICB4aHIuc3RhdHVzICE9PSAyMDApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBjb3VudCA9IGNvdW50RGF0YS50cmFuc2Zvcm0uYXBwbHkodGhpcywgW3hocl0pIHx8IDA7XG5cbiAgICAgIGlmIChjYiAmJiB0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgY2IoY291bnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRoaXMuYXBwZW5kVG8gJiYgdHlwZW9mIHRoaXMuYXBwZW5kVG8gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICB0aGlzLmFwcGVuZFRvLmFwcGVuZENoaWxkKHRoaXMub3MpO1xuICAgICAgICB9XG4gICAgICAgIGNvdW50UmVkdWNlKHRoaXMub3MsIGNvdW50LCB0aGlzLmNiKTtcbiAgICAgIH1cbiAgICAgIEV2ZW50cy50cmlnZ2VyKHRoaXMub3MsIGBjb3VudGVkLSR7dGhpcy51cmx9YCk7XG4gICAgfTtcblxuICAgIHhoci5vcGVuKCdQT1NUJywgY291bnREYXRhLnVybCk7XG4gICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ9VVRGLTgnKTtcbiAgICB4aHIuc2VuZChKU09OLnN0cmluZ2lmeShjb3VudERhdGEuZGF0YSkpO1xuICB9XG5cbiAgc3RvcmVTZXQodHlwZSwgY291bnQgPSAwKSB7Ly9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgaWYgKCF3aW5kb3cubG9jYWxTdG9yYWdlIHx8ICF0eXBlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oYE9wZW5TaGFyZS0ke3R5cGV9YCwgY291bnQpO1xuICB9XG5cbiAgc3RvcmVHZXQodHlwZSkgey8vZXNsaW50LWRpc2FibGUtbGluZVxuICAgIGlmICghd2luZG93LmxvY2FsU3RvcmFnZSB8fCAhdHlwZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHJldHVybiBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShgT3BlblNoYXJlLSR7dHlwZX1gKTtcbiAgfVxuXG59XG5cbmV4cG9ydCBkZWZhdWx0IENvdW50O1xuIiwiaW1wb3J0IGluaXQgZnJvbSAnLi4vLi4vbGliL2luaXQnO1xuaW1wb3J0IHNoYXJlIGZyb20gJy4uLy4uL2xpYi9pbml0aWFsaXplU2hhcmVOb2RlJztcbmltcG9ydCBjb3VudCBmcm9tICcuLi8uLi9saWIvaW5pdGlhbGl6ZUNvdW50Tm9kZSc7XG5cbmV4cG9ydCBkZWZhdWx0ICgpID0+IHsvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGluaXQoe1xuICAgIHNlbGVjdG9yOiB7XG4gICAgICBzaGFyZTogJ1tkYXRhLW9wZW4tc2hhcmVdOm5vdChbZGF0YS1vcGVuLXNoYXJlLW5vZGVdKScsXG4gICAgICBjb3VudDogJ1tkYXRhLW9wZW4tc2hhcmUtY291bnRdOm5vdChbZGF0YS1vcGVuLXNoYXJlLW5vZGVdKScsXG4gICAgfSxcbiAgICBjYjoge1xuICAgICAgc2hhcmUsXG4gICAgICBjb3VudCxcbiAgICB9LFxuICB9KSk7XG59O1xuIiwiLyoqXG4gKiBUcmlnZ2VyIGN1c3RvbSBPcGVuU2hhcmUgbmFtZXNwYWNlZCBldmVudFxuICovXG5leHBvcnQgZGVmYXVsdCB7XG4gIHRyaWdnZXIoZWxlbWVudCwgZXZlbnQpIHtcbiAgICBjb25zdCBldiA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdFdmVudCcpO1xuICAgIGV2LmluaXRFdmVudChgT3BlblNoYXJlLiR7ZXZlbnR9YCwgdHJ1ZSwgdHJ1ZSk7XG4gICAgZWxlbWVudC5kaXNwYXRjaEV2ZW50KGV2KTtcbiAgfSxcbn07XG4iLCIvKipcbiAqIE9wZW5TaGFyZSBnZW5lcmF0ZXMgYSBzaW5nbGUgc2hhcmUgbGlua1xuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBPcGVuU2hhcmUge1xuXG4gIGNvbnN0cnVjdG9yKHR5cGUsIHRyYW5zZm9ybSkge1xuICAgIHRoaXMuaW9zID0gL2lQYWR8aVBob25lfGlQb2QvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkgJiYgIXdpbmRvdy5NU1N0cmVhbTtcbiAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgIHRoaXMuZHluYW1pYyA9IGZhbHNlO1xuICAgIHRoaXMudHJhbnNmb3JtID0gdHJhbnNmb3JtO1xuXG4gICAgLy8gY2FwaXRhbGl6ZWQgdHlwZVxuICAgIHRoaXMudHlwZUNhcHMgPSB0eXBlLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgdHlwZS5zbGljZSgxKTtcbiAgfVxuXG4gIC8vIHJldHVybnMgZnVuY3Rpb24gbmFtZWQgYXMgdHlwZSBzZXQgaW4gY29uc3RydWN0b3JcbiAgLy8gZS5nIHR3aXR0ZXIoKVxuICBzZXREYXRhKGRhdGEpIHtcbiAgICAvLyBpZiBpT1MgdXNlciBhbmQgaW9zIGRhdGEgYXR0cmlidXRlIGRlZmluZWRcbiAgICAvLyBidWlsZCBpT1MgVVJMIHNjaGVtZSBhcyBzaW5nbGUgc3RyaW5nXG4gICAgaWYgKHRoaXMuaW9zKSB7XG4gICAgICB0aGlzLnRyYW5zZm9ybURhdGEgPSB0aGlzLnRyYW5zZm9ybShkYXRhLCB0cnVlKTtcbiAgICAgIHRoaXMubW9iaWxlU2hhcmVVcmwgPSB0aGlzLnRlbXBsYXRlKHRoaXMudHJhbnNmb3JtRGF0YS51cmwsIHRoaXMudHJhbnNmb3JtRGF0YS5kYXRhKTtcbiAgICB9XG5cbiAgICB0aGlzLnRyYW5zZm9ybURhdGEgPSB0aGlzLnRyYW5zZm9ybShkYXRhKTtcbiAgICB0aGlzLnNoYXJlVXJsID0gdGhpcy50ZW1wbGF0ZSh0aGlzLnRyYW5zZm9ybURhdGEudXJsLCB0aGlzLnRyYW5zZm9ybURhdGEuZGF0YSk7XG4gIH1cblxuICAvLyBvcGVuIHNoYXJlIFVSTCBkZWZpbmVkIGluIGluZGl2aWR1YWwgcGxhdGZvcm0gZnVuY3Rpb25zXG4gIHNoYXJlKCkge1xuICAgIC8vIGlmIGlPUyBzaGFyZSBVUkwgaGFzIGJlZW4gc2V0IHRoZW4gdXNlIHRpbWVvdXQgaGFja1xuICAgIC8vIHRlc3QgZm9yIG5hdGl2ZSBhcHAgYW5kIGZhbGwgYmFjayB0byB3ZWJcbiAgICBpZiAodGhpcy5tb2JpbGVTaGFyZVVybCkge1xuICAgICAgY29uc3Qgc3RhcnQgPSAobmV3IERhdGUoKSkudmFsdWVPZigpO1xuXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgY29uc3QgZW5kID0gKG5ldyBEYXRlKCkpLnZhbHVlT2YoKTtcblxuICAgICAgICAvLyBpZiB0aGUgdXNlciBpcyBzdGlsbCBoZXJlLCBmYWxsIGJhY2sgdG8gd2ViXG4gICAgICAgIGlmIChlbmQgLSBzdGFydCA+IDE2MDApIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB3aW5kb3cubG9jYXRpb24gPSB0aGlzLnNoYXJlVXJsO1xuICAgICAgfSwgMTUwMCk7XG5cbiAgICAgIHdpbmRvdy5sb2NhdGlvbiA9IHRoaXMubW9iaWxlU2hhcmVVcmw7XG5cbiAgICAgIC8vIG9wZW4gbWFpbHRvIGxpbmtzIGluIHNhbWUgd2luZG93XG4gICAgfSBlbHNlIGlmICh0aGlzLnR5cGUgPT09ICdlbWFpbCcpIHtcbiAgICAgIHdpbmRvdy5sb2NhdGlvbiA9IHRoaXMuc2hhcmVVcmw7XG5cbiAgICAgIC8vIG9wZW4gc29jaWFsIHNoYXJlIFVSTHMgaW4gbmV3IHdpbmRvd1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBpZiBwb3B1cCBvYmplY3QgcHJlc2VudCB0aGVuIHNldCB3aW5kb3cgZGltZW5zaW9ucyAvIHBvc2l0aW9uXG4gICAgICBpZiAodGhpcy5wb3B1cCAmJiB0aGlzLnRyYW5zZm9ybURhdGEucG9wdXApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3BlbldpbmRvdyh0aGlzLnNoYXJlVXJsLCB0aGlzLnRyYW5zZm9ybURhdGEucG9wdXApO1xuICAgICAgfVxuXG4gICAgICB3aW5kb3cub3Blbih0aGlzLnNoYXJlVXJsKTtcbiAgICB9XG4gIH1cblxuICAvLyBjcmVhdGUgc2hhcmUgVVJMIHdpdGggR0VUIHBhcmFtc1xuICAvLyBhcHBlbmRpbmcgdmFsaWQgcHJvcGVydGllcyB0byBxdWVyeSBzdHJpbmdcbiAgdGVtcGxhdGUodXJsLCBkYXRhKSB7Ly9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgY29uc3Qgbm9uVVJMUHJvcHMgPSBbXG4gICAgICAnYXBwZW5kVG8nLFxuICAgICAgJ2lubmVySFRNTCcsXG4gICAgICAnY2xhc3NlcycsXG4gICAgXTtcblxuICAgIGxldCBzaGFyZVVybCA9IHVybCxcbiAgICAgIGk7XG5cbiAgICBmb3IgKGkgaW4gZGF0YSkge1xuICAgICAgLy8gb25seSBhcHBlbmQgdmFsaWQgcHJvcGVydGllc1xuICAgICAgaWYgKCFkYXRhW2ldIHx8IG5vblVSTFByb3BzLmluZGV4T2YoaSkgPiAtMSkge1xuICAgICAgICBjb250aW51ZTsgLy9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgICB9XG5cbiAgICAgIC8vIGFwcGVuZCBVUkwgZW5jb2RlZCBHRVQgcGFyYW0gdG8gc2hhcmUgVVJMXG4gICAgICBkYXRhW2ldID0gZW5jb2RlVVJJQ29tcG9uZW50KGRhdGFbaV0pO1xuICAgICAgc2hhcmVVcmwgKz0gYCR7aX09JHtkYXRhW2ldfSZgO1xuICAgIH1cblxuICAgIHJldHVybiBzaGFyZVVybC5zdWJzdHIoMCwgc2hhcmVVcmwubGVuZ3RoIC0gMSk7XG4gIH1cblxuICAvLyBjZW50ZXIgcG9wdXAgd2luZG93IHN1cHBvcnRpbmcgZHVhbCBzY3JlZW5zXG4gIG9wZW5XaW5kb3codXJsLCBvcHRpb25zKSB7Ly9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgY29uc3QgZHVhbFNjcmVlbkxlZnQgPSB3aW5kb3cuc2NyZWVuTGVmdCAhPT0gdW5kZWZpbmVkID8gd2luZG93LnNjcmVlbkxlZnQgOiBzY3JlZW4ubGVmdCxcbiAgICAgIGR1YWxTY3JlZW5Ub3AgPSB3aW5kb3cuc2NyZWVuVG9wICE9PSB1bmRlZmluZWQgPyB3aW5kb3cuc2NyZWVuVG9wIDogc2NyZWVuLnRvcCxcbiAgICAgIHdpZHRoID0gd2luZG93LmlubmVyV2lkdGggPyB3aW5kb3cuaW5uZXJXaWR0aCA6IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aCA/IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aCA6IHNjcmVlbi53aWR0aCwvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgICAgIGhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodCA/IHdpbmRvdy5pbm5lckhlaWdodCA6IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQgPyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0IDogc2NyZWVuLmhlaWdodCwvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgICAgIGxlZnQgPSAoKHdpZHRoIC8gMikgLSAob3B0aW9ucy53aWR0aCAvIDIpKSArIGR1YWxTY3JlZW5MZWZ0LFxuICAgICAgdG9wID0gKChoZWlnaHQgLyAyKSAtIChvcHRpb25zLmhlaWdodCAvIDIpKSArIGR1YWxTY3JlZW5Ub3AsXG4gICAgICBuZXdXaW5kb3cgPSB3aW5kb3cub3Blbih1cmwsICdPcGVuU2hhcmUnLCBgd2lkdGg9JHtvcHRpb25zLndpZHRofSwgaGVpZ2h0PSR7b3B0aW9ucy5oZWlnaHR9LCB0b3A9JHt0b3B9LCBsZWZ0PSR7bGVmdH1gKTtcblxuICAgIC8vIFB1dHMgZm9jdXMgb24gdGhlIG5ld1dpbmRvd1xuICAgIGlmICh3aW5kb3cuZm9jdXMpIHtcbiAgICAgIG5ld1dpbmRvdy5mb2N1cygpO1xuICAgIH1cbiAgfVxufVxuIiwiLyoqXG4gKiBHbG9iYWwgT3BlblNoYXJlIEFQSSB0byBnZW5lcmF0ZSBpbnN0YW5jZXMgcHJvZ3JhbW1hdGljYWxseVxuICovXG5pbXBvcnQgT1MgZnJvbSAnLi9vcGVuLXNoYXJlJztcbmltcG9ydCBTaGFyZVRyYW5zZm9ybXMgZnJvbSAnLi9zaGFyZS10cmFuc2Zvcm1zJztcbmltcG9ydCBFdmVudHMgZnJvbSAnLi9ldmVudHMnO1xuaW1wb3J0IGRhc2hUb0NhbWVsIGZyb20gJy4uLy4uL2xpYi9kYXNoVG9DYW1lbCc7XG5cbmV4cG9ydCBkZWZhdWx0ICgpID0+IHtcbiAgLy8gZ2xvYmFsIE9wZW5TaGFyZSByZWZlcmVuY2luZyBpbnRlcm5hbCBjbGFzcyBmb3IgaW5zdGFuY2UgZ2VuZXJhdGlvblxuICBjbGFzcyBPcGVuU2hhcmUge1xuXG4gICAgY29uc3RydWN0b3IoZGF0YSwgZWxlbWVudCkge1xuICAgICAgaWYgKCFkYXRhLmJpbmRDbGljaykgZGF0YS5iaW5kQ2xpY2sgPSB0cnVlO1xuXG4gICAgICBjb25zdCBkYXNoID0gZGF0YS50eXBlLmluZGV4T2YoJy0nKTtcblxuICAgICAgaWYgKGRhc2ggPiAtMSkge1xuICAgICAgICBkYXRhLnR5cGUgPSBkYXNoVG9DYW1lbChkYXNoLCBkYXRhLnR5cGUpO1xuICAgICAgfVxuXG4gICAgICBsZXQgbm9kZTtcbiAgICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgICB0aGlzLmRhdGEgPSBkYXRhO1xuXG4gICAgICB0aGlzLm9zID0gbmV3IE9TKGRhdGEudHlwZSwgU2hhcmVUcmFuc2Zvcm1zW2RhdGEudHlwZV0pO1xuICAgICAgdGhpcy5vcy5zZXREYXRhKGRhdGEpO1xuXG4gICAgICBpZiAoIWVsZW1lbnQgfHwgZGF0YS5lbGVtZW50KSB7XG4gICAgICAgIGVsZW1lbnQgPSBkYXRhLmVsZW1lbnQ7XG4gICAgICAgIG5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGVsZW1lbnQgfHwgJ2EnKTtcbiAgICAgICAgaWYgKGRhdGEudHlwZSkge1xuICAgICAgICAgIG5vZGUuY2xhc3NMaXN0LmFkZCgnb3Blbi1zaGFyZS1saW5rJywgZGF0YS50eXBlKTtcbiAgICAgICAgICBub2RlLnNldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlJywgZGF0YS50eXBlKTtcbiAgICAgICAgICBub2RlLnNldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLW5vZGUnLCBkYXRhLnR5cGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkYXRhLmlubmVySFRNTCkgbm9kZS5pbm5lckhUTUwgPSBkYXRhLmlubmVySFRNTDtcbiAgICAgIH1cbiAgICAgIGlmIChub2RlKSBlbGVtZW50ID0gbm9kZTtcblxuICAgICAgaWYgKGRhdGEuYmluZENsaWNrKSB7XG4gICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5zaGFyZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKGRhdGEuYXBwZW5kVG8pIHtcbiAgICAgICAgZGF0YS5hcHBlbmRUby5hcHBlbmRDaGlsZChlbGVtZW50KTtcbiAgICAgIH1cblxuICAgICAgaWYgKGRhdGEuY2xhc3NlcyAmJiBBcnJheS5pc0FycmF5KGRhdGEuY2xhc3NlcykpIHtcbiAgICAgICAgZGF0YS5jbGFzc2VzLmZvckVhY2goKGNzc0NsYXNzKSA9PiB7XG4gICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKGNzc0NsYXNzKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChkYXRhLnR5cGUudG9Mb3dlckNhc2UoKSA9PT0gJ3BheXBhbCcpIHtcbiAgICAgICAgY29uc3QgYWN0aW9uID0gZGF0YS5zYW5kYm94ID9cbiAgICAgICAgJ2h0dHBzOi8vd3d3LnNhbmRib3gucGF5cGFsLmNvbS9jZ2ktYmluL3dlYnNjcicgOlxuICAgICAgICAnaHR0cHM6Ly93d3cucGF5cGFsLmNvbS9jZ2ktYmluL3dlYnNjcic7XG5cbiAgICAgICAgY29uc3QgYnV5R0lGID0gZGF0YS5zYW5kYm94ID9cbiAgICAgICAgJ2h0dHBzOi8vd3d3LnNhbmRib3gucGF5cGFsLmNvbS9lbl9VUy9pL2J0bi9idG5fYnV5bm93X0xHLmdpZicgOlxuICAgICAgICAnaHR0cHM6Ly93d3cucGF5cGFsb2JqZWN0cy5jb20vZW5fVVMvaS9idG4vYnRuX2J1eW5vd19MRy5naWYnO1xuXG4gICAgICAgIGNvbnN0IHBpeGVsR0lGID0gZGF0YS5zYW5kYm94ID9cbiAgICAgICAgJ2h0dHBzOi8vd3d3LnNhbmRib3gucGF5cGFsLmNvbS9lbl9VUy9pL3Njci9waXhlbC5naWYnIDpcbiAgICAgICAgJ2h0dHBzOi8vd3d3LnBheXBhbG9iamVjdHMuY29tL2VuX1VTL2kvc2NyL3BpeGVsLmdpZic7XG5cblxuICAgICAgICBjb25zdCBwYXlwYWxCdXR0b24gPSBgPGZvcm0gYWN0aW9uPSR7YWN0aW9ufSBtZXRob2Q9XCJwb3N0XCIgdGFyZ2V0PVwiX2JsYW5rXCI+XG5cbiAgICAgICAgPCEtLSBTYXZlZCBidXR0b25zIHVzZSB0aGUgXCJzZWN1cmUgY2xpY2tcIiBjb21tYW5kIC0tPlxuICAgICAgICA8aW5wdXQgdHlwZT1cImhpZGRlblwiIG5hbWU9XCJjbWRcIiB2YWx1ZT1cIl9zLXhjbGlja1wiPlxuXG4gICAgICAgIDwhLS0gU2F2ZWQgYnV0dG9ucyBhcmUgaWRlbnRpZmllZCBieSB0aGVpciBidXR0b24gSURzIC0tPlxuICAgICAgICA8aW5wdXQgdHlwZT1cImhpZGRlblwiIG5hbWU9XCJob3N0ZWRfYnV0dG9uX2lkXCIgdmFsdWU9XCIke2RhdGEuYnV0dG9uSWR9XCI+XG5cbiAgICAgICAgPCEtLSBTYXZlZCBidXR0b25zIGRpc3BsYXkgYW4gYXBwcm9wcmlhdGUgYnV0dG9uIGltYWdlLiAtLT5cbiAgICAgICAgPGlucHV0IHR5cGU9XCJpbWFnZVwiIG5hbWU9XCJzdWJtaXRcIlxuICAgICAgICBzcmM9JHtidXlHSUZ9XG4gICAgICAgIGFsdD1cIlBheVBhbCAtIFRoZSBzYWZlciwgZWFzaWVyIHdheSB0byBwYXkgb25saW5lXCI+XG4gICAgICAgIDxpbWcgYWx0PVwiXCIgd2lkdGg9XCIxXCIgaGVpZ2h0PVwiMVwiXG4gICAgICAgIHNyYz0ke3BpeGVsR0lGfSA+XG5cbiAgICAgICAgPC9mb3JtPmA7XG5cbiAgICAgICAgY29uc3QgaGlkZGVuRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGhpZGRlbkRpdi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICBoaWRkZW5EaXYuaW5uZXJIVE1MID0gcGF5cGFsQnV0dG9uO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGhpZGRlbkRpdik7XG5cbiAgICAgICAgdGhpcy5wYXlwYWwgPSBoaWRkZW5EaXYucXVlcnlTZWxlY3RvcignZm9ybScpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgfVxuXG4gICAgLy8gcHVibGljIHNoYXJlIG1ldGhvZCB0byB0cmlnZ2VyIHNoYXJlIHByb2dyYW1tYXRpY2FsbHlcbiAgICBzaGFyZShlKSB7XG4gICAgICAvLyBpZiBkeW5hbWljIGluc3RhbmNlIHRoZW4gZmV0Y2ggYXR0cmlidXRlcyBhZ2FpbiBpbiBjYXNlIG9mIHVwZGF0ZXNcbiAgICAgIGlmICh0aGlzLmRhdGEuZHluYW1pYykge1xuICAgICAgICAvL2VzbGludC1kaXNhYmxlLW5leHQtbGluZVxuICAgICAgICB0aGlzLm9zLnNldERhdGEoZGF0YSk7Ly8gZGF0YSBpcyBub3QgZGVmaW5lZFxuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5kYXRhLnR5cGUudG9Mb3dlckNhc2UoKSA9PT0gJ3BheXBhbCcpIHtcbiAgICAgICAgdGhpcy5wYXlwYWwuc3VibWl0KCk7XG4gICAgICB9IGVsc2UgdGhpcy5vcy5zaGFyZShlKTtcblxuICAgICAgRXZlbnRzLnRyaWdnZXIodGhpcy5lbGVtZW50LCAnc2hhcmVkJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIE9wZW5TaGFyZTtcbn07XG4iLCIvKipcbiAqIE9iamVjdCBvZiB0cmFuc2Zvcm0gZnVuY3Rpb25zIGZvciBlYWNoIG9wZW5zaGFyZSBhcGlcbiAqIFRyYW5zZm9ybSBmdW5jdGlvbnMgcGFzc2VkIGludG8gT3BlblNoYXJlIGluc3RhbmNlIHdoZW4gaW5zdGFudGlhdGVkXG4gKiBSZXR1cm4gb2JqZWN0IGNvbnRhaW5pbmcgVVJMIGFuZCBrZXkvdmFsdWUgYXJnc1xuICovXG5leHBvcnQgZGVmYXVsdCB7XG5cbiAgLy8gc2V0IFR3aXR0ZXIgc2hhcmUgVVJMXG4gIHR3aXR0ZXIoZGF0YSwgaW9zID0gZmFsc2UpIHtcbiAgICAvLyBpZiBpT1MgdXNlciBhbmQgaW9zIGRhdGEgYXR0cmlidXRlIGRlZmluZWRcbiAgICAvLyBidWlsZCBpT1MgVVJMIHNjaGVtZSBhcyBzaW5nbGUgc3RyaW5nXG4gICAgaWYgKGlvcyAmJiBkYXRhLmlvcykge1xuICAgICAgbGV0IG1lc3NhZ2UgPSAnJztcblxuICAgICAgaWYgKGRhdGEudGV4dCkge1xuICAgICAgICBtZXNzYWdlICs9IGRhdGEudGV4dDtcbiAgICAgIH1cblxuICAgICAgaWYgKGRhdGEudXJsKSB7XG4gICAgICAgIG1lc3NhZ2UgKz0gYCAtICR7ZGF0YS51cmx9YDtcbiAgICAgIH1cblxuICAgICAgaWYgKGRhdGEuaGFzaHRhZ3MpIHtcbiAgICAgICAgY29uc3QgdGFncyA9IGRhdGEuaGFzaHRhZ3Muc3BsaXQoJywnKTtcbiAgICAgICAgdGFncy5mb3JFYWNoKCh0YWcpID0+IHtcbiAgICAgICAgICBtZXNzYWdlICs9IGAgIyR7dGFnfWA7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGF0YS52aWEpIHtcbiAgICAgICAgbWVzc2FnZSArPSBgIHZpYSAke2RhdGEudmlhfWA7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHVybDogJ3R3aXR0ZXI6Ly9wb3N0PycsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICB9LFxuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgdXJsOiAnaHR0cHM6Ly90d2l0dGVyLmNvbS9zaGFyZT8nLFxuICAgICAgZGF0YSxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiA3MDAsXG4gICAgICAgIGhlaWdodDogMjk2LFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBUd2l0dGVyIHJldHdlZXQgVVJMXG4gIHR3aXR0ZXJSZXR3ZWV0KGRhdGEsIGlvcyA9IGZhbHNlKSB7XG4gICAgLy8gaWYgaU9TIHVzZXIgYW5kIGlvcyBkYXRhIGF0dHJpYnV0ZSBkZWZpbmVkXG4gICAgaWYgKGlvcyAmJiBkYXRhLmlvcykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdXJsOiAndHdpdHRlcjovL3N0YXR1cz8nLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgaWQ6IGRhdGEudHdlZXRJZCxcbiAgICAgICAgfSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogJ2h0dHBzOi8vdHdpdHRlci5jb20vaW50ZW50L3JldHdlZXQ/JyxcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgdHdlZXRfaWQ6IGRhdGEudHdlZXRJZCxcbiAgICAgICAgcmVsYXRlZDogZGF0YS5yZWxhdGVkLFxuICAgICAgfSxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiA3MDAsXG4gICAgICAgIGhlaWdodDogMjk2LFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBUd2l0dGVyIGxpa2UgVVJMXG4gIHR3aXR0ZXJMaWtlKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG4gICAgLy8gaWYgaU9TIHVzZXIgYW5kIGlvcyBkYXRhIGF0dHJpYnV0ZSBkZWZpbmVkXG4gICAgaWYgKGlvcyAmJiBkYXRhLmlvcykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdXJsOiAndHdpdHRlcjovL3N0YXR1cz8nLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgaWQ6IGRhdGEudHdlZXRJZCxcbiAgICAgICAgfSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogJ2h0dHBzOi8vdHdpdHRlci5jb20vaW50ZW50L2Zhdm9yaXRlPycsXG4gICAgICBkYXRhOiB7XG4gICAgICAgIHR3ZWV0X2lkOiBkYXRhLnR3ZWV0SWQsXG4gICAgICAgIHJlbGF0ZWQ6IGRhdGEucmVsYXRlZCxcbiAgICAgIH0sXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogNzAwLFxuICAgICAgICBoZWlnaHQ6IDI5NixcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgVHdpdHRlciBmb2xsb3cgVVJMXG4gIHR3aXR0ZXJGb2xsb3coZGF0YSwgaW9zID0gZmFsc2UpIHtcbiAgICAvLyBpZiBpT1MgdXNlciBhbmQgaW9zIGRhdGEgYXR0cmlidXRlIGRlZmluZWRcbiAgICBpZiAoaW9zICYmIGRhdGEuaW9zKSB7XG4gICAgICBjb25zdCBpb3NEYXRhID0gZGF0YS5zY3JlZW5OYW1lID8ge1xuICAgICAgICBzY3JlZW5fbmFtZTogZGF0YS5zY3JlZW5OYW1lLFxuICAgICAgfSA6IHtcbiAgICAgICAgaWQ6IGRhdGEudXNlcklkLFxuICAgICAgfTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdXJsOiAndHdpdHRlcjovL3VzZXI/JyxcbiAgICAgICAgZGF0YTogaW9zRGF0YSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogJ2h0dHBzOi8vdHdpdHRlci5jb20vaW50ZW50L3VzZXI/JyxcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgc2NyZWVuX25hbWU6IGRhdGEuc2NyZWVuTmFtZSxcbiAgICAgICAgdXNlcl9pZDogZGF0YS51c2VySWQsXG4gICAgICB9LFxuICAgICAgcG9wdXA6IHtcbiAgICAgICAgd2lkdGg6IDcwMCxcbiAgICAgICAgaGVpZ2h0OiAyOTYsXG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgLy8gc2V0IEZhY2Vib29rIHNoYXJlIFVSTFxuICBmYWNlYm9vayhkYXRhKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogJ2h0dHBzOi8vd3d3LmZhY2Vib29rLmNvbS9kaWFsb2cvZmVlZD9hcHBfaWQ9OTYxMzQyNTQzOTIyMzIyJnJlZGlyZWN0X3VyaT1odHRwOi8vZmFjZWJvb2suY29tJicsXG4gICAgICBkYXRhLFxuICAgICAgcG9wdXA6IHtcbiAgICAgICAgd2lkdGg6IDU2MCxcbiAgICAgICAgaGVpZ2h0OiA1OTMsXG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgICAvLyBzZXQgRmFjZWJvb2sgc2VuZCBVUkxcbiAgZmFjZWJvb2tTZW5kKGRhdGEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdXJsOiAnaHR0cHM6Ly93d3cuZmFjZWJvb2suY29tL2RpYWxvZy9zZW5kP2FwcF9pZD05NjEzNDI1NDM5MjIzMjImcmVkaXJlY3RfdXJpPWh0dHA6Ly9mYWNlYm9vay5jb20mJyxcbiAgICAgIGRhdGEsXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogOTgwLFxuICAgICAgICBoZWlnaHQ6IDU5NixcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgWW91VHViZSBwbGF5IFVSTFxuICB5b3V0dWJlKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG4gICAgLy8gaWYgaU9TIHVzZXJcbiAgICBpZiAoaW9zICYmIGRhdGEuaW9zKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB1cmw6IGB5b3V0dWJlOiR7ZGF0YS52aWRlb30/YCxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogYGh0dHBzOi8vd3d3LnlvdXR1YmUuY29tL3dhdGNoP3Y9JHtkYXRhLnZpZGVvfT9gLFxuICAgICAgcG9wdXA6IHtcbiAgICAgICAgd2lkdGg6IDEwODYsXG4gICAgICAgIGhlaWdodDogNjA4LFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBZb3VUdWJlIHN1YmNyaWJlIFVSTFxuICB5b3V0dWJlU3Vic2NyaWJlKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG4gICAgLy8gaWYgaU9TIHVzZXJcbiAgICBpZiAoaW9zICYmIGRhdGEuaW9zKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB1cmw6IGB5b3V0dWJlOi8vd3d3LnlvdXR1YmUuY29tL3VzZXIvJHtkYXRhLnVzZXJ9P2AsXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB1cmw6IGBodHRwczovL3d3dy55b3V0dWJlLmNvbS91c2VyLyR7ZGF0YS51c2VyfT9gLFxuICAgICAgcG9wdXA6IHtcbiAgICAgICAgd2lkdGg6IDg4MCxcbiAgICAgICAgaGVpZ2h0OiAzNTAsXG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgLy8gc2V0IEluc3RhZ3JhbSBmb2xsb3cgVVJMXG4gIGluc3RhZ3JhbSgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdXJsOiAnaW5zdGFncmFtOi8vY2FtZXJhPycsXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgSW5zdGFncmFtIGZvbGxvdyBVUkxcbiAgaW5zdGFncmFtRm9sbG93KGRhdGEsIGlvcyA9IGZhbHNlKSB7XG4gICAgLy8gaWYgaU9TIHVzZXJcbiAgICBpZiAoaW9zICYmIGRhdGEuaW9zKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB1cmw6ICdpbnN0YWdyYW06Ly91c2VyPycsXG4gICAgICAgIGRhdGEsXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB1cmw6IGBodHRwOi8vd3d3Lmluc3RhZ3JhbS5jb20vJHtkYXRhLnVzZXJuYW1lfT9gLFxuICAgICAgcG9wdXA6IHtcbiAgICAgICAgd2lkdGg6IDk4MCxcbiAgICAgICAgaGVpZ2h0OiA2NTUsXG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgLy8gc2V0IFNuYXBjaGF0IGZvbGxvdyBVUkxcbiAgc25hcGNoYXQoZGF0YSkge1xuICAgIHJldHVybiB7XG4gICAgICB1cmw6IGBzbmFwY2hhdDovL2FkZC8ke2RhdGEudXNlcm5hbWV9P2AsXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgR29vZ2xlIHNoYXJlIFVSTFxuICBnb29nbGUoZGF0YSkge1xuICAgIHJldHVybiB7XG4gICAgICB1cmw6ICdodHRwczovL3BsdXMuZ29vZ2xlLmNvbS9zaGFyZT8nLFxuICAgICAgZGF0YSxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiA0OTUsXG4gICAgICAgIGhlaWdodDogODE1LFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBHb29nbGUgbWFwcyBVUkxcbiAgZ29vZ2xlTWFwcyhkYXRhLCBpb3MgPSBmYWxzZSkge1xuICAgIGlmIChkYXRhLnNlYXJjaCkge1xuICAgICAgZGF0YS5xID0gZGF0YS5zZWFyY2g7XG4gICAgICBkZWxldGUgZGF0YS5zZWFyY2g7XG4gICAgfVxuXG4gICAgLy8gaWYgaU9TIHVzZXIgYW5kIGlvcyBkYXRhIGF0dHJpYnV0ZSBkZWZpbmVkXG4gICAgaWYgKGlvcyAmJiBkYXRhLmlvcykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdXJsOiAnY29tZ29vZ2xlbWFwczovLz8nLFxuICAgICAgICBkYXRhOiBpb3MsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmICghaW9zICYmIGRhdGEuaW9zKSB7XG4gICAgICBkZWxldGUgZGF0YS5pb3M7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogJ2h0dHBzOi8vbWFwcy5nb29nbGUuY29tLz8nLFxuICAgICAgZGF0YSxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiA4MDAsXG4gICAgICAgIGhlaWdodDogNjAwLFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBQaW50ZXJlc3Qgc2hhcmUgVVJMXG4gIHBpbnRlcmVzdChkYXRhKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogJ2h0dHBzOi8vcGludGVyZXN0LmNvbS9waW4vY3JlYXRlL2Jvb2ttYXJrbGV0Lz8nLFxuICAgICAgZGF0YSxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiA3NDUsXG4gICAgICAgIGhlaWdodDogNjIwLFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBMaW5rZWRJbiBzaGFyZSBVUkxcbiAgbGlua2VkaW4oZGF0YSkge1xuICAgIHJldHVybiB7XG4gICAgICB1cmw6ICdodHRwOi8vd3d3LmxpbmtlZGluLmNvbS9zaGFyZUFydGljbGU/JyxcbiAgICAgIGRhdGEsXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogNzgwLFxuICAgICAgICBoZWlnaHQ6IDQ5MixcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgQnVmZmVyIHNoYXJlIFVSTFxuICBidWZmZXIoZGF0YSkge1xuICAgIHJldHVybiB7XG4gICAgICB1cmw6ICdodHRwOi8vYnVmZmVyYXBwLmNvbS9hZGQ/JyxcbiAgICAgIGRhdGEsXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogNzQ1LFxuICAgICAgICBoZWlnaHQ6IDM0NSxcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgVHVtYmxyIHNoYXJlIFVSTFxuICB0dW1ibHIoZGF0YSkge1xuICAgIHJldHVybiB7XG4gICAgICB1cmw6ICdodHRwczovL3d3dy50dW1ibHIuY29tL3dpZGdldHMvc2hhcmUvdG9vbD8nLFxuICAgICAgZGF0YSxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiA1NDAsXG4gICAgICAgIGhlaWdodDogOTQwLFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBSZWRkaXQgc2hhcmUgVVJMXG4gIHJlZGRpdChkYXRhKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogJ2h0dHA6Ly9yZWRkaXQuY29tL3N1Ym1pdD8nLFxuICAgICAgZGF0YSxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiA4NjAsXG4gICAgICAgIGhlaWdodDogODgwLFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBGbGlja3IgZm9sbG93IFVSTFxuICBmbGlja3IoZGF0YSwgaW9zID0gZmFsc2UpIHtcbiAgICAvLyBpZiBpT1MgdXNlclxuICAgIGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHVybDogYGZsaWNrcjovL3Bob3Rvcy8ke2RhdGEudXNlcm5hbWV9P2AsXG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgdXJsOiBgaHR0cDovL3d3dy5mbGlja3IuY29tL3Bob3Rvcy8ke2RhdGEudXNlcm5hbWV9P2AsXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogNjAwLFxuICAgICAgICBoZWlnaHQ6IDY1MCxcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgV2hhdHNBcHAgc2hhcmUgVVJMXG4gIHdoYXRzYXBwKGRhdGEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdXJsOiAnd2hhdHNhcHA6Ly9zZW5kPycsXG4gICAgICBkYXRhLFxuICAgIH07XG4gIH0sXG5cbiAgLy8gc2V0IHNtcyBzaGFyZSBVUkxcbiAgc21zKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogaW9zID8gJ3NtczomJyA6ICdzbXM6PycsXG4gICAgICBkYXRhLFxuICAgIH07XG4gIH0sXG5cbiAgLy8gc2V0IEVtYWlsIHNoYXJlIFVSTFxuICBlbWFpbChkYXRhKSB7XG4gICAgbGV0IHVybCA9ICdtYWlsdG86JztcblxuICAgIC8vIGlmIHRvIGFkZHJlc3Mgc3BlY2lmaWVkIHRoZW4gYWRkIHRvIFVSTFxuICAgIGlmIChkYXRhLnRvICE9PSBudWxsKSB7XG4gICAgICB1cmwgKz0gYCR7ZGF0YS50b31gO1xuICAgIH1cblxuICAgIHVybCArPSAnPyc7XG5cbiAgICByZXR1cm4ge1xuICAgICAgdXJsLFxuICAgICAgZGF0YToge1xuICAgICAgICBzdWJqZWN0OiBkYXRhLnN1YmplY3QsXG4gICAgICAgIGJvZHk6IGRhdGEuYm9keSxcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgR2l0aHViIGZvcmsgVVJMXG4gIGdpdGh1YihkYXRhLCBpb3MgPSBmYWxzZSkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gICAgbGV0IHVybCA9IGRhdGEucmVwbyA/IGBodHRwczovL2dpdGh1Yi5jb20vJHtkYXRhLnJlcG99YCA6IGRhdGEudXJsO1xuXG4gICAgaWYgKGRhdGEuaXNzdWUpIHtcbiAgICAgIHVybCArPSBgL2lzc3Vlcy9uZXc/dGl0bGU9JHtkYXRhLmlzc3VlfSZib2R5PSR7ZGF0YS5ib2R5fWA7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogYCR7dXJsfT9gLFxuICAgICAgcG9wdXA6IHtcbiAgICAgICAgd2lkdGg6IDEwMjAsXG4gICAgICAgIGhlaWdodDogMzIzLFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBEcmliYmJsZSBzaGFyZSBVUkxcbiAgZHJpYmJibGUoZGF0YSwgaW9zID0gZmFsc2UpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICAgIGNvbnN0IHVybCA9IGRhdGEuc2hvdCA/IGBodHRwczovL2RyaWJiYmxlLmNvbS9zaG90cy8ke2RhdGEuc2hvdH0/YCA6IGAke2RhdGEudXJsfT9gO1xuICAgIHJldHVybiB7XG4gICAgICB1cmwsXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogNDQwLFxuICAgICAgICBoZWlnaHQ6IDY0MCxcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICBjb2RlcGVuKGRhdGEpIHtcbiAgICBjb25zdCB1cmwgPSAoZGF0YS5wZW4gJiYgZGF0YS51c2VybmFtZSAmJiBkYXRhLnZpZXcpID8gYGh0dHBzOi8vY29kZXBlbi5pby8ke2RhdGEudXNlcm5hbWV9LyR7ZGF0YS52aWV3fS8ke2RhdGEucGVufT9gIDogYCR7ZGF0YS51cmx9P2A7XG4gICAgcmV0dXJuIHtcbiAgICAgIHVybCxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiAxMjAwLFxuICAgICAgICBoZWlnaHQ6IDgwMCxcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICBwYXlwYWwoZGF0YSkge1xuICAgIHJldHVybiB7XG4gICAgICBkYXRhLFxuICAgIH07XG4gIH0sXG59O1xuIl19
