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

function init() {
  (0, _init2.default)({
    selector: {
      share: '[data-open-share]:not([data-open-share-node])',
      count: '[data-open-share-count]:not([data-open-share-node])'
    },
    cb: {
      share: _initializeShareNode2.default,
      count: _initializeCountNode2.default
    }
  })();
}

exports.default = function () {
  if (document.readyState === 'complete') {
    return init();
  }
  document.addEventListener('readystatechange', function () {
    if (document.readyState === 'complete') {
      init();
    }
  }, false);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiYW5hbHl0aWNzLmpzIiwibGliL2NvdW50UmVkdWNlLmpzIiwibGliL2Rhc2hUb0NhbWVsLmpzIiwibGliL2luaXQuanMiLCJsaWIvaW5pdGlhbGl6ZUNvdW50Tm9kZS5qcyIsImxpYi9pbml0aWFsaXplTm9kZXMuanMiLCJsaWIvaW5pdGlhbGl6ZVNoYXJlTm9kZS5qcyIsImxpYi9pbml0aWFsaXplV2F0Y2hlci5qcyIsImxpYi9zZXREYXRhLmpzIiwibGliL3NoYXJlLmpzIiwibGliL3N0b3JlQ291bnQuanMiLCJzcmMvYnJvd3Nlci5qcyIsInNyYy9tb2R1bGVzL2NvdW50LWFwaS5qcyIsInNyYy9tb2R1bGVzL2NvdW50LXRyYW5zZm9ybXMuanMiLCJzcmMvbW9kdWxlcy9jb3VudC5qcyIsInNyYy9tb2R1bGVzL2RhdGEtYXR0ci5qcyIsInNyYy9tb2R1bGVzL2V2ZW50cy5qcyIsInNyYy9tb2R1bGVzL29wZW4tc2hhcmUuanMiLCJzcmMvbW9kdWxlcy9zaGFyZS1hcGkuanMiLCJzcmMvbW9kdWxlcy9zaGFyZS10cmFuc2Zvcm1zLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxPQUFPLE9BQVAsR0FBaUIsVUFBVSxJQUFWLEVBQWdCLEVBQWhCLEVBQW9CO0FBQUM7QUFDcEMsTUFBTSxPQUFPLFNBQVMsT0FBVCxJQUFvQixTQUFTLFFBQTFDO0FBQ0EsTUFBTSxlQUFlLFNBQVMsWUFBOUI7O0FBRUEsTUFBSSxJQUFKLEVBQVUsdUJBQXVCLElBQXZCLEVBQTZCLEVBQTdCO0FBQ1YsTUFBSSxZQUFKLEVBQWtCLGNBQWMsRUFBZDtBQUNuQixDQU5EOztBQVFBLFNBQVMsc0JBQVQsQ0FBZ0MsSUFBaEMsRUFBc0MsRUFBdEMsRUFBMEM7QUFDeEMsTUFBSSxPQUFPLEVBQVgsRUFBZTtBQUNiLFFBQUksRUFBSixFQUFRO0FBQ1Y7QUFDRSxXQUFPLFVBQUMsQ0FBRCxFQUFPO0FBQ1osVUFBTSxXQUFXLEVBQUUsTUFBRixDQUFTLFlBQVQsQ0FBc0IsaUJBQXRCLENBQWpCO0FBQ0EsVUFBTSxTQUFTLEVBQUUsTUFBRixDQUFTLFlBQVQsQ0FBc0Isc0JBQXRCLEtBQ2YsRUFBRSxNQUFGLENBQVMsWUFBVCxDQUFzQixxQkFBdEIsQ0FEZSxJQUVmLEVBQUUsTUFBRixDQUFTLFlBQVQsQ0FBc0IsMEJBQXRCLENBRmUsSUFHZixFQUFFLE1BQUYsQ0FBUyxZQUFULENBQXNCLHdCQUF0QixDQUhlLElBSWYsRUFBRSxNQUFGLENBQVMsWUFBVCxDQUFzQix3QkFBdEIsQ0FKZSxJQUtmLEVBQUUsTUFBRixDQUFTLFlBQVQsQ0FBc0Isc0JBQXRCLENBTEE7O0FBT0EsVUFBSSxTQUFTLE9BQWIsRUFBc0I7QUFDcEIsV0FBRyxNQUFILEVBQVcsT0FBWCxFQUFvQixFQUFFO0FBQ3BCLHlCQUFlLGlCQURHO0FBRWxCLHVCQUFhLFFBRks7QUFHbEIsc0JBQVksTUFITTtBQUlsQixxQkFBVztBQUpPLFNBQXBCO0FBTUQ7O0FBRUQsVUFBSSxTQUFTLFFBQWIsRUFBdUI7QUFDckIsV0FBRyxNQUFILEVBQVcsRUFBRTtBQUNYLG1CQUFTLFFBREE7QUFFVCx5QkFBZSxRQUZOO0FBR1Qsd0JBQWMsT0FITDtBQUlULHdCQUFjO0FBSkwsU0FBWDtBQU1EO0FBQ0YsS0ExQkQ7QUEyQkQsR0E5QkQsTUE4Qk87QUFDTCxlQUFXLFlBQU07QUFDZiw2QkFBdUIsSUFBdkIsRUFBNkIsRUFBN0I7QUFDRCxLQUZELEVBRUcsSUFGSDtBQUdEO0FBQ0Y7O0FBRUQsU0FBUyxhQUFULENBQXVCLEVBQXZCLEVBQTJCO0FBQ3pCLE1BQUksT0FBTyxTQUFQLElBQW9CLE9BQU8sU0FBUCxDQUFpQixDQUFqQixFQUFvQixXQUFwQixDQUF4QixFQUEwRDtBQUN4RCxRQUFJLEVBQUosRUFBUTs7QUFFUixXQUFPLGdCQUFQOztBQUVBLGNBQVUsVUFBQyxDQUFELEVBQU87QUFDZixVQUFNLFFBQVEsRUFBRSxNQUFGLEdBQ2QsRUFBRSxNQUFGLENBQVMsU0FESyxHQUVkLEVBQUUsU0FGRjs7QUFJQSxVQUFNLFdBQVcsRUFBRSxNQUFGLEdBQ2pCLEVBQUUsTUFBRixDQUFTLFlBQVQsQ0FBc0IsMkJBQXRCLENBRGlCLEdBRWpCLEVBQUUsWUFBRixDQUFlLDJCQUFmLENBRkE7O0FBSUEsYUFBTyxTQUFQLENBQWlCLElBQWpCLENBQXNCO0FBQ3BCLGVBQU8saUJBRGE7QUFFcEIsMEJBRm9CO0FBR3BCLGtCQUFVLEtBSFU7QUFJcEIsa0JBQVU7QUFKVSxPQUF0QjtBQU1ELEtBZkQ7QUFnQkQsR0FyQkQsTUFxQk87QUFDTCxlQUFXLFlBQU07QUFDZixvQkFBYyxFQUFkO0FBQ0QsS0FGRCxFQUVHLElBRkg7QUFHRDtBQUNGOztBQUVELFNBQVMsTUFBVCxDQUFnQixFQUFoQixFQUFvQjtBQUNsQjtBQUNBLEtBQUcsT0FBSCxDQUFXLElBQVgsQ0FBZ0IsU0FBUyxnQkFBVCxDQUEwQixtQkFBMUIsQ0FBaEIsRUFBZ0UsVUFBQyxJQUFELEVBQVU7QUFDeEUsU0FBSyxnQkFBTCxDQUFzQixrQkFBdEIsRUFBMEMsRUFBMUM7QUFDRCxHQUZEO0FBR0Q7O0FBRUQsU0FBUyxTQUFULENBQW1CLEVBQW5CLEVBQXVCO0FBQ3JCLE1BQU0sWUFBWSxTQUFTLGdCQUFULENBQTBCLHlCQUExQixDQUFsQjs7QUFFQSxLQUFHLE9BQUgsQ0FBVyxJQUFYLENBQWdCLFNBQWhCLEVBQTJCLFVBQUMsSUFBRCxFQUFVO0FBQ25DLFFBQUksS0FBSyxXQUFULEVBQXNCLEdBQUcsSUFBSCxFQUF0QixLQUNLLEtBQUssZ0JBQUwsd0JBQTJDLEtBQUssWUFBTCxDQUFrQiwyQkFBbEIsQ0FBM0MsRUFBNkYsRUFBN0Y7QUFDTixHQUhEO0FBSUQ7O0FBRUQsU0FBUyxnQkFBVCxDQUEwQixDQUExQixFQUE2QjtBQUMzQixNQUFNLFdBQVcsRUFBRSxNQUFGLENBQVMsWUFBVCxDQUFzQixpQkFBdEIsQ0FBakI7QUFDQSxNQUFNLFNBQVMsRUFBRSxNQUFGLENBQVMsWUFBVCxDQUFzQixzQkFBdEIsS0FDYixFQUFFLE1BQUYsQ0FBUyxZQUFULENBQXNCLHFCQUF0QixDQURhLElBRWIsRUFBRSxNQUFGLENBQVMsWUFBVCxDQUFzQiwwQkFBdEIsQ0FGYSxJQUdiLEVBQUUsTUFBRixDQUFTLFlBQVQsQ0FBc0Isd0JBQXRCLENBSGEsSUFJYixFQUFFLE1BQUYsQ0FBUyxZQUFULENBQXNCLHdCQUF0QixDQUphLElBS2IsRUFBRSxNQUFGLENBQVMsWUFBVCxDQUFzQixzQkFBdEIsQ0FMRjs7QUFPQSxTQUFPLFNBQVAsQ0FBaUIsSUFBakIsQ0FBc0I7QUFDcEIsV0FBTyxpQkFEYTtBQUVwQixzQkFGb0I7QUFHcEIsY0FBVSxNQUhVO0FBSXBCLGNBQVU7QUFKVSxHQUF0QjtBQU1EOzs7Ozs7OztrQkN0RnVCLFc7QUFwQnhCLFNBQVMsS0FBVCxDQUFlLENBQWYsRUFBa0IsU0FBbEIsRUFBNkI7QUFDM0IsTUFBSSxPQUFPLENBQVAsS0FBYSxRQUFqQixFQUEyQjtBQUN6QixVQUFNLElBQUksU0FBSixDQUFjLCtCQUFkLENBQU47QUFDRDs7QUFFRCxNQUFNLFdBQVcsWUFBWSxDQUFaLEdBQWdCLEdBQWhCLEdBQXNCLElBQXZDO0FBQ0EsTUFBTSxjQUFjLFlBQVksQ0FBWixHQUFnQixJQUFoQixHQUF1QixHQUEzQztBQUNBLGNBQVksS0FBSyxHQUFMLENBQVMsU0FBVCxDQUFaOztBQUVBLFNBQU8sT0FBTyxLQUFLLEtBQUwsQ0FBVyxJQUFJLFFBQUosR0FBZSxTQUExQixJQUF1QyxXQUF2QyxHQUFxRCxTQUE1RCxDQUFQO0FBQ0Q7O0FBRUQsU0FBUyxXQUFULENBQXFCLEdBQXJCLEVBQTBCO0FBQ3hCLFNBQVUsTUFBTSxNQUFNLElBQVosRUFBa0IsQ0FBbEIsQ0FBVjtBQUNEOztBQUVELFNBQVMsVUFBVCxDQUFvQixHQUFwQixFQUF5QjtBQUN2QixTQUFVLE1BQU0sTUFBTSxPQUFaLEVBQXFCLENBQXJCLENBQVY7QUFDRDs7QUFFYyxTQUFTLFdBQVQsQ0FBcUIsRUFBckIsRUFBeUIsS0FBekIsRUFBZ0MsRUFBaEMsRUFBb0M7QUFDakQsTUFBSSxRQUFRLE1BQVosRUFBb0I7QUFDbEIsT0FBRyxTQUFILEdBQWUsV0FBVyxLQUFYLENBQWY7QUFDQSxRQUFJLE1BQU0sT0FBTyxFQUFQLEtBQWMsVUFBeEIsRUFBb0MsR0FBRyxFQUFIO0FBQ3JDLEdBSEQsTUFHTyxJQUFJLFFBQVEsR0FBWixFQUFpQjtBQUN0QixPQUFHLFNBQUgsR0FBZSxZQUFZLEtBQVosQ0FBZjtBQUNBLFFBQUksTUFBTSxPQUFPLEVBQVAsS0FBYyxVQUF4QixFQUFvQyxHQUFHLEVBQUg7QUFDckMsR0FITSxNQUdBO0FBQ0wsT0FBRyxTQUFILEdBQWUsS0FBZjtBQUNBLFFBQUksTUFBTSxPQUFPLEVBQVAsS0FBYyxVQUF4QixFQUFvQyxHQUFHLEVBQUg7QUFDckM7QUFDRjs7Ozs7Ozs7O0FDL0JEO0FBQ0E7QUFDQTtrQkFDZSxVQUFDLElBQUQsRUFBTyxJQUFQLEVBQWdCO0FBQzdCLE1BQU0sV0FBVyxLQUFLLE1BQUwsQ0FBWSxPQUFPLENBQW5CLEVBQXNCLENBQXRCLENBQWpCO0FBQ0EsTUFBTSxRQUFRLEtBQUssTUFBTCxDQUFZLElBQVosRUFBa0IsQ0FBbEIsQ0FBZDs7QUFFQSxTQUFPLEtBQUssT0FBTCxDQUFhLEtBQWIsRUFBb0IsU0FBUyxXQUFULEVBQXBCLENBQVA7QUFDQSxTQUFPLElBQVA7QUFDRCxDOzs7Ozs7OztrQkNOdUIsSTs7QUFIeEI7Ozs7QUFDQTs7Ozs7O0FBRWUsU0FBUyxJQUFULENBQWMsSUFBZCxFQUFvQjtBQUNqQyxTQUFPLFlBQU07QUFDWCxRQUFNLFlBQVksK0JBQWdCO0FBQ2hDLFdBQUssS0FBSyxHQUFMLElBQVksSUFEZTtBQUVoQyxpQkFBVyxLQUFLLFNBQUwsSUFBa0IsUUFGRztBQUdoQyxnQkFBVSxLQUFLLFFBSGlCO0FBSWhDLFVBQUksS0FBSztBQUp1QixLQUFoQixDQUFsQjs7QUFPQTs7QUFFQTtBQUNBLFFBQUksT0FBTyxnQkFBUCxLQUE0QixTQUFoQyxFQUEyQztBQUN6Qyx1Q0FBa0IsU0FBUyxnQkFBVCxDQUEwQix5QkFBMUIsQ0FBbEIsRUFBd0UsU0FBeEU7QUFDRDtBQUNGLEdBZEQ7QUFlRDs7Ozs7Ozs7a0JDakJ1QixtQjs7QUFGeEI7Ozs7OztBQUVlLFNBQVMsbUJBQVQsQ0FBNkIsRUFBN0IsRUFBaUM7QUFDOUM7QUFDQSxNQUFNLE9BQU8sR0FBRyxZQUFILENBQWdCLHVCQUFoQixDQUFiO0FBQ0EsTUFBTSxNQUFNLEdBQUcsWUFBSCxDQUFnQiw0QkFBaEIsS0FDUixHQUFHLFlBQUgsQ0FBZ0IsNEJBQWhCLENBRFEsSUFFUixHQUFHLFlBQUgsQ0FBZ0IsMkJBQWhCLENBRko7QUFHQSxNQUFNLFFBQVEsb0JBQVUsSUFBVixFQUFnQixHQUFoQixDQUFkOztBQUVBLFFBQU0sS0FBTixDQUFZLEVBQVo7QUFDQSxLQUFHLFlBQUgsQ0FBZ0Isc0JBQWhCLEVBQXdDLElBQXhDO0FBQ0Q7Ozs7Ozs7O2tCQ1R1QixlOztBQUh4Qjs7OztBQUNBOzs7Ozs7QUFFZSxTQUFTLGVBQVQsQ0FBeUIsSUFBekIsRUFBK0I7QUFDNUM7QUFDQSxTQUFPLFlBQU07QUFDWDtBQUNBOztBQUVBLFFBQUksS0FBSyxHQUFULEVBQWM7QUFDWixVQUFNLFFBQVEsS0FBSyxTQUFMLENBQWUsZ0JBQWYsQ0FBZ0MsS0FBSyxRQUFyQyxDQUFkO0FBQ0EsU0FBRyxPQUFILENBQVcsSUFBWCxDQUFnQixLQUFoQixFQUF1QixLQUFLLEVBQTVCOztBQUVBO0FBQ0EsdUJBQU8sT0FBUCxDQUFlLFFBQWYsRUFBNEIsS0FBSyxHQUFqQztBQUNELEtBTkQsTUFNTztBQUNMO0FBQ0EsVUFBTSxhQUFhLEtBQUssU0FBTCxDQUFlLGdCQUFmLENBQWdDLEtBQUssUUFBTCxDQUFjLEtBQTlDLENBQW5CO0FBQ0EsU0FBRyxPQUFILENBQVcsSUFBWCxDQUFnQixVQUFoQixFQUE0QixLQUFLLEVBQUwsQ0FBUSxLQUFwQzs7QUFFQTtBQUNBLHVCQUFPLE9BQVAsQ0FBZSxRQUFmLEVBQXlCLGNBQXpCOztBQUVBO0FBQ0EsVUFBTSxhQUFhLEtBQUssU0FBTCxDQUFlLGdCQUFmLENBQWdDLEtBQUssUUFBTCxDQUFjLEtBQTlDLENBQW5CO0FBQ0EsU0FBRyxPQUFILENBQVcsSUFBWCxDQUFnQixVQUFoQixFQUE0QixLQUFLLEVBQUwsQ0FBUSxLQUFwQzs7QUFFQTtBQUNBLHVCQUFPLE9BQVAsQ0FBZSxRQUFmLEVBQXlCLGNBQXpCO0FBQ0Q7QUFDRixHQXpCRDtBQTBCRDs7QUFFRCxTQUFTLGNBQVQsR0FBMEI7QUFDeEI7QUFDQSxNQUFJLFNBQVMsYUFBVCxDQUF1Qiw2QkFBdkIsQ0FBSixFQUEyRDtBQUN6RCxRQUFNLFdBQVcsU0FBUyxhQUFULENBQXVCLDZCQUF2QixFQUNkLFlBRGMsQ0FDRCwyQkFEQyxDQUFqQjs7QUFHQSxRQUFJLFNBQVMsT0FBVCxDQUFpQixHQUFqQixJQUF3QixDQUFDLENBQTdCLEVBQWdDO0FBQzlCLFVBQU0sWUFBWSxTQUFTLEtBQVQsQ0FBZSxHQUFmLENBQWxCO0FBQ0EsZ0JBQVUsT0FBVixDQUFrQjtBQUFBLGVBQUsseUJBQVUsQ0FBVixDQUFMO0FBQUEsT0FBbEI7QUFDRCxLQUhELE1BR08seUJBQVUsUUFBVjtBQUNSO0FBQ0Y7Ozs7Ozs7O2tCQ3RDdUIsbUI7O0FBTnhCOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7OztBQUVlLFNBQVMsbUJBQVQsQ0FBNkIsRUFBN0IsRUFBaUM7QUFDOUM7QUFDQSxNQUFJLE9BQU8sR0FBRyxZQUFILENBQWdCLGlCQUFoQixDQUFYO0FBQ0EsTUFBTSxPQUFPLEtBQUssT0FBTCxDQUFhLEdBQWIsQ0FBYjs7QUFFQSxNQUFJLE9BQU8sQ0FBQyxDQUFaLEVBQWU7QUFDYixXQUFPLDJCQUFZLElBQVosRUFBa0IsSUFBbEIsQ0FBUDtBQUNEOztBQUVELE1BQU0sWUFBWSwwQkFBZ0IsSUFBaEIsQ0FBbEI7O0FBRUEsTUFBSSxDQUFDLFNBQUwsRUFBZ0I7QUFDZCxVQUFNLElBQUksS0FBSixrQkFBeUIsSUFBekIseUJBQU47QUFDRDs7QUFFRCxNQUFNLFlBQVksd0JBQWMsSUFBZCxFQUFvQixTQUFwQixDQUFsQjs7QUFFQTtBQUNBLE1BQUksR0FBRyxZQUFILENBQWdCLHlCQUFoQixDQUFKLEVBQWdEO0FBQzlDLGNBQVUsT0FBVixHQUFvQixJQUFwQjtBQUNEOztBQUVEO0FBQ0EsTUFBSSxHQUFHLFlBQUgsQ0FBZ0IsdUJBQWhCLENBQUosRUFBOEM7QUFDNUMsY0FBVSxLQUFWLEdBQWtCLElBQWxCO0FBQ0Q7O0FBRUQ7QUFDQSx5QkFBUSxTQUFSLEVBQW1CLEVBQW5COztBQUVBO0FBQ0EsS0FBRyxnQkFBSCxDQUFvQixPQUFwQixFQUE2QixVQUFDLENBQUQsRUFBTztBQUNsQyx5QkFBTSxDQUFOLEVBQVMsRUFBVCxFQUFhLFNBQWI7QUFDRCxHQUZEOztBQUlBLEtBQUcsZ0JBQUgsQ0FBb0IsbUJBQXBCLEVBQXlDLFVBQUMsQ0FBRCxFQUFPO0FBQzlDLHlCQUFNLENBQU4sRUFBUyxFQUFULEVBQWEsU0FBYjtBQUNELEdBRkQ7O0FBSUEsS0FBRyxZQUFILENBQWdCLHNCQUFoQixFQUF3QyxJQUF4QztBQUNEOzs7Ozs7OztrQkM5Q3VCLGlCO0FBQVQsU0FBUyxpQkFBVCxDQUEyQixPQUEzQixFQUFvQyxFQUFwQyxFQUF3QztBQUNyRCxLQUFHLE9BQUgsQ0FBVyxJQUFYLENBQWdCLE9BQWhCLEVBQXlCLFVBQUMsQ0FBRCxFQUFPO0FBQzlCLFFBQU0sV0FBVyxJQUFJLGdCQUFKLENBQXFCLFVBQUMsU0FBRCxFQUFlO0FBQ25EO0FBQ0EsU0FBRyxVQUFVLENBQVYsRUFBYSxNQUFoQjtBQUNELEtBSGdCLENBQWpCOztBQUtBLGFBQVMsT0FBVCxDQUFpQixDQUFqQixFQUFvQjtBQUNsQixpQkFBVztBQURPLEtBQXBCO0FBR0QsR0FURDtBQVVEOzs7Ozs7OztrQkNYdUIsTztBQUFULFNBQVMsT0FBVCxDQUFpQixVQUFqQixFQUE2QixTQUE3QixFQUF3QztBQUNyRCxhQUFXLE9BQVgsQ0FBbUI7QUFDakIsU0FBSyxVQUFVLFlBQVYsQ0FBdUIscUJBQXZCLENBRFk7QUFFakIsVUFBTSxVQUFVLFlBQVYsQ0FBdUIsc0JBQXZCLENBRlc7QUFHakIsU0FBSyxVQUFVLFlBQVYsQ0FBdUIscUJBQXZCLENBSFk7QUFJakIsY0FBVSxVQUFVLFlBQVYsQ0FBdUIsMEJBQXZCLENBSk87QUFLakIsYUFBUyxVQUFVLFlBQVYsQ0FBdUIsMEJBQXZCLENBTFE7QUFNakIsYUFBUyxVQUFVLFlBQVYsQ0FBdUIseUJBQXZCLENBTlE7QUFPakIsZ0JBQVksVUFBVSxZQUFWLENBQXVCLDZCQUF2QixDQVBLO0FBUWpCLFlBQVEsVUFBVSxZQUFWLENBQXVCLHlCQUF2QixDQVJTO0FBU2pCLFVBQU0sVUFBVSxZQUFWLENBQXVCLHNCQUF2QixDQVRXO0FBVWpCLGFBQVMsVUFBVSxZQUFWLENBQXVCLHlCQUF2QixDQVZRO0FBV2pCLGFBQVMsVUFBVSxZQUFWLENBQXVCLHlCQUF2QixDQVhRO0FBWWpCLGlCQUFhLFVBQVUsWUFBVixDQUF1Qiw2QkFBdkIsQ0FaSTtBQWFqQixVQUFNLFVBQVUsWUFBVixDQUF1QixzQkFBdkIsQ0FiVztBQWNqQixXQUFPLFVBQVUsWUFBVixDQUF1Qix1QkFBdkIsQ0FkVTtBQWVqQixjQUFVLFVBQVUsWUFBVixDQUF1QiwwQkFBdkIsQ0FmTztBQWdCakIsV0FBTyxVQUFVLFlBQVYsQ0FBdUIsdUJBQXZCLENBaEJVO0FBaUJqQixXQUFPLFVBQVUsWUFBVixDQUF1Qix1QkFBdkIsQ0FqQlU7QUFrQmpCLFFBQUksVUFBVSxZQUFWLENBQXVCLG9CQUF2QixDQWxCYTtBQW1CakIsYUFBUyxVQUFVLFlBQVYsQ0FBdUIseUJBQXZCLENBbkJRO0FBb0JqQixVQUFNLFVBQVUsWUFBVixDQUF1QixzQkFBdkIsQ0FwQlc7QUFxQmpCLFNBQUssVUFBVSxZQUFWLENBQXVCLHFCQUF2QixDQXJCWTtBQXNCakIsVUFBTSxVQUFVLFlBQVYsQ0FBdUIsc0JBQXZCLENBdEJXO0FBdUJqQixZQUFRLFVBQVUsWUFBVixDQUF1Qix3QkFBdkIsQ0F2QlM7QUF3QmpCLFdBQU8sVUFBVSxZQUFWLENBQXVCLHVCQUF2QixDQXhCVTtBQXlCakIsVUFBTSxVQUFVLFlBQVYsQ0FBdUIsc0JBQXZCLENBekJXO0FBMEJqQixZQUFRLFVBQVUsWUFBVixDQUF1Qix3QkFBdkIsQ0ExQlM7QUEyQmpCLFdBQU8sVUFBVSxZQUFWLENBQXVCLHVCQUF2QixDQTNCVTtBQTRCakIsV0FBTyxVQUFVLFlBQVYsQ0FBdUIsdUJBQXZCLENBNUJVO0FBNkJqQixvQkFBZ0IsVUFBVSxZQUFWLENBQXVCLGlDQUF2QixDQTdCQztBQThCakIsVUFBTSxVQUFVLFlBQVYsQ0FBdUIsc0JBQXZCLENBOUJXO0FBK0JqQixVQUFNLFVBQVUsWUFBVixDQUF1QixzQkFBdkIsQ0EvQlc7QUFnQ2pCLFNBQUssVUFBVSxZQUFWLENBQXVCLHFCQUF2QixDQWhDWTtBQWlDakIsVUFBTSxVQUFVLFlBQVYsQ0FBdUIsc0JBQXZCLENBakNXO0FBa0NqQixXQUFPLFVBQVUsWUFBVixDQUF1Qix1QkFBdkIsQ0FsQ1U7QUFtQ2pCLGNBQVUsVUFBVSxZQUFWLENBQXVCLDBCQUF2QixDQW5DTztBQW9DakIsV0FBTyxVQUFVLFlBQVYsQ0FBdUIsdUJBQXZCLENBcENVO0FBcUNqQixTQUFLLFVBQVUsWUFBVixDQUF1QixxQkFBdkI7QUFyQ1ksR0FBbkI7QUF1Q0Q7Ozs7Ozs7O2tCQ3JDdUIsSzs7QUFIeEI7Ozs7QUFDQTs7Ozs7O0FBRWUsU0FBUyxLQUFULENBQWUsQ0FBZixFQUFrQixFQUFsQixFQUFzQixTQUF0QixFQUFpQztBQUM5QztBQUNBLE1BQUksVUFBVSxPQUFkLEVBQXVCO0FBQ3JCLDJCQUFRLFNBQVIsRUFBbUIsRUFBbkI7QUFDRDs7QUFFRCxZQUFVLEtBQVYsQ0FBZ0IsQ0FBaEI7O0FBRUE7QUFDQSxtQkFBTyxPQUFQLENBQWUsRUFBZixFQUFtQixRQUFuQjtBQUNEOzs7Ozs7Ozs7QUNiRDs7Ozs7Ozs7O2tCQVNlLFVBQUMsQ0FBRCxFQUFJLEtBQUosRUFBYztBQUMzQixNQUFNLFFBQVEsRUFBRSxJQUFGLENBQU8sT0FBUCxDQUFlLEdBQWYsSUFBc0IsQ0FBQyxDQUFyQztBQUNBLE1BQU0sUUFBUSxPQUFPLEVBQUUsUUFBRixDQUFjLEVBQUUsSUFBaEIsU0FBd0IsRUFBRSxNQUExQixDQUFQLENBQWQ7O0FBRUEsTUFBSSxRQUFRLEtBQVIsSUFBaUIsQ0FBQyxLQUF0QixFQUE2QjtBQUMzQixRQUFNLGNBQWMsT0FBTyxFQUFFLFFBQUYsQ0FBYyxFQUFFLElBQWhCLFNBQXdCLEVBQUUsTUFBMUIsa0JBQVAsQ0FBcEI7QUFDQSxNQUFFLFFBQUYsQ0FBYyxFQUFFLElBQWhCLFNBQXdCLEVBQUUsTUFBMUIsbUJBQWdELEtBQWhEOztBQUVBLFlBQVEsVUFBVSxXQUFWLEtBQTBCLGNBQWMsQ0FBeEMsR0FDTixTQUFTLFFBQVEsV0FEWCxHQUVOLFNBQVMsS0FGWDtBQUdEOztBQUVELE1BQUksQ0FBQyxLQUFMLEVBQVksRUFBRSxRQUFGLENBQWMsRUFBRSxJQUFoQixTQUF3QixFQUFFLE1BQTFCLEVBQW9DLEtBQXBDO0FBQ1osU0FBTyxLQUFQO0FBQ0QsQzs7QUFFRCxTQUFTLFNBQVQsQ0FBbUIsQ0FBbkIsRUFBc0I7QUFDcEIsU0FBTyxDQUFDLE1BQU0sV0FBVyxDQUFYLENBQU4sQ0FBRCxJQUF5QixTQUFTLENBQVQsQ0FBaEM7QUFDRDs7Ozs7Ozs7O0FDNUJEOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7OztBQUVBLElBQU0sVUFBVSxTQUFWLE9BQVUsR0FBTTtBQUNwQjtBQUNBLFNBQU8sU0FBUCxHQUFtQjtBQUNqQixXQUFPLHlGQURVO0FBRWpCLFdBQU8seUJBRlU7QUFHakI7QUFIaUIsR0FBbkI7QUFLRCxDQVBEO2tCQVFlLFM7Ozs7Ozs7OztBQ2JmOzs7Ozs7MEpBSkE7Ozs7a0JBTWUsWUFBTTtBQUFFO0FBQ3JCO0FBRG1CLE1BRWIsS0FGYSxHQUlqQixxQkFPRyxFQVBILEVBT087QUFBQSxRQU5MLElBTUssUUFOTCxJQU1LO0FBQUEsUUFMTCxHQUtLLFFBTEwsR0FLSztBQUFBLDZCQUpMLFFBSUs7QUFBQSxRQUpMLFFBSUssaUNBSk0sS0FJTjtBQUFBLFFBSEwsT0FHSyxRQUhMLE9BR0s7QUFBQSxRQUZMLE9BRUssUUFGTCxPQUVLO0FBQUEsd0JBREwsR0FDSztBQUFBLFFBREwsR0FDSyw0QkFEQyxJQUNEOztBQUFBOztBQUNMLFFBQU0sWUFBWSxTQUFTLGFBQVQsQ0FBdUIsV0FBVyxNQUFsQyxDQUFsQjs7QUFFQSxjQUFVLFlBQVYsQ0FBdUIsdUJBQXZCLEVBQWdELElBQWhEO0FBQ0EsY0FBVSxZQUFWLENBQXVCLDJCQUF2QixFQUFvRCxHQUFwRDtBQUNBLFFBQUksR0FBSixFQUFTLFVBQVUsWUFBVixDQUF1QixxQkFBdkIsRUFBOEMsR0FBOUM7O0FBRVQsY0FBVSxTQUFWLENBQW9CLEdBQXBCLENBQXdCLGtCQUF4Qjs7QUFFQSxRQUFJLFdBQVcsTUFBTSxPQUFOLENBQWMsT0FBZCxDQUFmLEVBQXVDO0FBQ3JDLGNBQVEsT0FBUixDQUFnQixVQUFDLFFBQUQsRUFBYztBQUM1QixrQkFBVSxTQUFWLENBQW9CLEdBQXBCLENBQXdCLFFBQXhCO0FBQ0QsT0FGRDtBQUdEOztBQUVELFFBQUksUUFBSixFQUFjO0FBQ1osYUFBTyxvQkFBVSxJQUFWLEVBQWdCLEdBQWhCLEVBQXFCLEtBQXJCLENBQTJCLFNBQTNCLEVBQXNDLEVBQXRDLEVBQTBDLFFBQTFDLENBQVA7QUFDRDs7QUFFRCxXQUFPLG9CQUFVLElBQVYsRUFBZ0IsR0FBaEIsRUFBcUIsS0FBckIsQ0FBMkIsU0FBM0IsRUFBc0MsRUFBdEMsQ0FBUDtBQUNELEdBL0JnQjs7QUFrQ25CLFNBQU8sS0FBUDtBQUNELEM7Ozs7Ozs7OztBQ3pDRDs7OztBQUNBOzs7Ozs7QUFDQTs7Ozs7a0JBS2U7O0FBRWI7QUFDQSxVQUhhLG9CQUdKLEdBSEksRUFHQztBQUNaLFdBQU87QUFDTCxZQUFNLEtBREQ7QUFFTCwrQ0FBdUMsR0FGbEM7QUFHTCxlQUhLLHFCQUdLLEdBSEwsRUFHVTtBQUNiLFlBQU0sS0FBSyxLQUFLLEtBQUwsQ0FBVyxJQUFJLFlBQWYsQ0FBWDs7QUFFQSxZQUFNLFFBQVEsR0FBRyxLQUFILElBQVksR0FBRyxLQUFILENBQVMsV0FBckIsSUFBb0MsQ0FBbEQ7O0FBRUEsZUFBTywwQkFBVyxJQUFYLEVBQWlCLEtBQWpCLENBQVA7QUFDRDtBQVRJLEtBQVA7QUFXRCxHQWZZOzs7QUFpQmY7QUFDRSxXQWxCYSxxQkFrQkgsR0FsQkcsRUFrQkU7QUFDYixXQUFPO0FBQ0wsWUFBTSxPQUREO0FBRUwsNEVBQW9FLEdBRi9EO0FBR0wsZUFISyxxQkFHSyxJQUhMLEVBR1c7QUFDZCxZQUFNLFFBQVEsS0FBSyxLQUFuQjtBQUNBLGVBQU8sMEJBQVcsSUFBWCxFQUFpQixLQUFqQixDQUFQO0FBQ0Q7QUFOSSxLQUFQO0FBUUQsR0EzQlk7OztBQTZCYjtBQUNBLFVBOUJhLG9CQThCSixHQTlCSSxFQThCQztBQUNaLFdBQU87QUFDTCxZQUFNLE9BREQ7QUFFTCxtRUFBMkQsR0FBM0QsNkJBRks7QUFHTCxlQUhLLHFCQUdLLElBSEwsRUFHVztBQUNkLFlBQU0sUUFBUSxLQUFLLEtBQW5CO0FBQ0EsZUFBTywwQkFBVyxJQUFYLEVBQWlCLEtBQWpCLENBQVA7QUFDRDtBQU5JLEtBQVA7QUFRRCxHQXZDWTs7O0FBeUNiO0FBQ0EsUUExQ2Esa0JBMENOLEdBMUNNLEVBMENEO0FBQ1YsV0FBTztBQUNMLFlBQU0sS0FERDtBQUVMLHlEQUFpRCxHQUY1QztBQUdMLGVBSEsscUJBR0ssR0FITCxFQUdVO0FBQ2IsWUFBTSxRQUFRLEtBQUssS0FBTCxDQUFXLElBQUksWUFBZixFQUE2QixJQUE3QixDQUFrQyxRQUFoRDtBQUNBLFlBQUksTUFBTSxDQUFWOztBQUVBLGNBQU0sT0FBTixDQUFjLFVBQUMsSUFBRCxFQUFVO0FBQ3RCLGlCQUFPLE9BQU8sS0FBSyxJQUFMLENBQVUsR0FBakIsQ0FBUDtBQUNELFNBRkQ7O0FBSUEsZUFBTywwQkFBVyxJQUFYLEVBQWlCLEdBQWpCLENBQVA7QUFDRDtBQVpJLEtBQVA7QUFjRCxHQXpEWTs7O0FBMkRmO0FBQ0UsUUE1RGEsa0JBNEROLEdBNURNLEVBNEREO0FBQ1YsV0FBTztBQUNMLFlBQU0sTUFERDtBQUVMLFlBQU07QUFDSixnQkFBUSxrQkFESjtBQUVKLFlBQUksR0FGQTtBQUdKLGdCQUFRO0FBQ04saUJBQU8sSUFERDtBQUVOLGNBQUksR0FGRTtBQUdOLGtCQUFRLFFBSEY7QUFJTixrQkFBUSxTQUpGO0FBS04sbUJBQVM7QUFMSCxTQUhKO0FBVUosaUJBQVMsS0FWTDtBQVdKLGFBQUssR0FYRDtBQVlKLG9CQUFZO0FBWlIsT0FGRDtBQWdCTCxXQUFLLGlDQWhCQTtBQWlCTCxlQWpCSyxxQkFpQkssR0FqQkwsRUFpQlU7QUFDYixZQUFNLFFBQVEsS0FBSyxLQUFMLENBQVcsSUFBSSxZQUFmLEVBQTZCLE1BQTdCLENBQW9DLFFBQXBDLENBQTZDLFlBQTdDLENBQTBELEtBQXhFO0FBQ0EsZUFBTywwQkFBVyxJQUFYLEVBQWlCLEtBQWpCLENBQVA7QUFDRDtBQXBCSSxLQUFQO0FBc0JELEdBbkZZOzs7QUFxRmI7QUFDQSxhQXRGYSx1QkFzRkQsSUF0RkMsRUFzRks7QUFDaEIsV0FBTyxLQUFLLE9BQUwsQ0FBYSxhQUFiLElBQThCLENBQUMsQ0FBL0IsR0FDUCxLQUFLLEtBQUwsQ0FBVyxhQUFYLEVBQTBCLENBQTFCLENBRE8sR0FFUCxJQUZBO0FBR0EsV0FBTztBQUNMLFlBQU0sS0FERDtBQUVMLDZDQUFxQyxJQUZoQztBQUdMLGVBSEsscUJBR0ssR0FITCxFQUdVO0FBQ2IsWUFBTSxRQUFRLEtBQUssS0FBTCxDQUFXLElBQUksWUFBZixFQUE2QixnQkFBM0M7QUFDQSxlQUFPLDBCQUFXLElBQVgsRUFBaUIsS0FBakIsQ0FBUDtBQUNEO0FBTkksS0FBUDtBQVFELEdBbEdZOzs7QUFvR2I7QUFDQSxhQXJHYSx1QkFxR0QsSUFyR0MsRUFxR0s7QUFDaEIsV0FBTyxLQUFLLE9BQUwsQ0FBYSxhQUFiLElBQThCLENBQUMsQ0FBL0IsR0FDUCxLQUFLLEtBQUwsQ0FBVyxhQUFYLEVBQTBCLENBQTFCLENBRE8sR0FFUCxJQUZBO0FBR0EsV0FBTztBQUNMLFlBQU0sS0FERDtBQUVMLDZDQUFxQyxJQUZoQztBQUdMLGVBSEsscUJBR0ssR0FITCxFQUdVO0FBQ2IsWUFBTSxRQUFRLEtBQUssS0FBTCxDQUFXLElBQUksWUFBZixFQUE2QixXQUEzQztBQUNBLGVBQU8sMEJBQVcsSUFBWCxFQUFpQixLQUFqQixDQUFQO0FBQ0Q7QUFOSSxLQUFQO0FBUUQsR0FqSFk7OztBQW1IYjtBQUNBLGdCQXBIYSwwQkFvSEUsSUFwSEYsRUFvSFE7QUFDbkIsV0FBTyxLQUFLLE9BQUwsQ0FBYSxhQUFiLElBQThCLENBQUMsQ0FBL0IsR0FDUCxLQUFLLEtBQUwsQ0FBVyxhQUFYLEVBQTBCLENBQTFCLENBRE8sR0FFUCxJQUZBO0FBR0EsV0FBTztBQUNMLFlBQU0sS0FERDtBQUVMLDZDQUFxQyxJQUZoQztBQUdMLGVBSEsscUJBR0ssR0FITCxFQUdVO0FBQ2IsWUFBTSxRQUFRLEtBQUssS0FBTCxDQUFXLElBQUksWUFBZixFQUE2QixjQUEzQztBQUNBLGVBQU8sMEJBQVcsSUFBWCxFQUFpQixLQUFqQixDQUFQO0FBQ0Q7QUFOSSxLQUFQO0FBUUQsR0FoSVk7OztBQWtJYjtBQUNBLFVBbklhLG9CQW1JSixJQW5JSSxFQW1JRTtBQUNiLFdBQU8sS0FBSyxPQUFMLENBQWEsb0JBQWIsSUFBcUMsQ0FBQyxDQUF0QyxHQUNQLEtBQUssS0FBTCxDQUFXLFFBQVgsRUFBcUIsQ0FBckIsQ0FETyxHQUVQLElBRkE7QUFHQSxRQUFNLDZDQUEyQyxJQUEzQyxXQUFOO0FBQ0EsV0FBTztBQUNMLFlBQU0sS0FERDtBQUVMLGNBRks7QUFHTCxlQUhLLHFCQUdLLEdBSEwsRUFHVSxNQUhWLEVBR2tCO0FBQUE7O0FBQ3JCLFlBQU0sUUFBUSxLQUFLLEtBQUwsQ0FBVyxJQUFJLFlBQWYsRUFBNkIsTUFBM0M7O0FBRUE7QUFDQSxZQUFJLFVBQVUsRUFBZCxFQUFrQjtBQUNoQixjQUFNLE9BQU8sQ0FBYjtBQUNBLHlCQUFlLEdBQWYsRUFBb0IsSUFBcEIsRUFBMEIsS0FBMUIsRUFBaUMsVUFBQyxVQUFELEVBQWdCO0FBQy9DLGdCQUFJLE1BQUssUUFBTCxJQUFpQixPQUFPLE1BQUssUUFBWixLQUF5QixVQUE5QyxFQUEwRDtBQUN4RCxvQkFBSyxRQUFMLENBQWMsV0FBZCxDQUEwQixNQUFLLEVBQS9CO0FBQ0Q7QUFDRCx1Q0FBWSxNQUFLLEVBQWpCLEVBQXFCLFVBQXJCLEVBQWlDLE1BQUssRUFBdEM7QUFDQSxtQkFBTyxPQUFQLENBQWUsTUFBSyxFQUFwQixlQUFtQyxNQUFLLEdBQXhDO0FBQ0EsbUJBQU8saUNBQWlCLFVBQWpCLENBQVA7QUFDRCxXQVBEO0FBUUQsU0FWRCxNQVVPO0FBQ0wsaUJBQU8sMEJBQVcsSUFBWCxFQUFpQixLQUFqQixDQUFQO0FBQ0Q7QUFDRjtBQXBCSSxLQUFQO0FBc0JELEdBOUpZO0FBZ0tiLFNBaEthLG1CQWdLTCxHQWhLSyxFQWdLQTtBQUNYLFdBQU87QUFDTCxZQUFNLEtBREQ7QUFFTCxxREFBNkMsR0FBN0MsVUFGSztBQUdMLGVBSEsscUJBR0ssR0FITCxFQUdVO0FBQ2IsWUFBTSxRQUFRLEtBQUssS0FBTCxDQUFXLElBQUksWUFBZixFQUE2QixLQUEzQztBQUNBLGVBQU8sMEJBQVcsSUFBWCxFQUFpQixLQUFqQixDQUFQO0FBQ0Q7QUFOSSxLQUFQO0FBUUQ7QUF6S1ksQzs7O0FBNEtmLFNBQVMsY0FBVCxDQUF3QixHQUF4QixFQUE2QixJQUE3QixFQUFtQyxLQUFuQyxFQUEwQyxFQUExQyxFQUE4QztBQUM1QyxNQUFNLE1BQU0sSUFBSSxjQUFKLEVBQVo7QUFDQSxNQUFJLElBQUosQ0FBUyxLQUFULEVBQW1CLEdBQW5CLGNBQStCLElBQS9CO0FBQ0EsTUFBSSxnQkFBSixDQUFxQixNQUFyQixFQUE2QixZQUFZO0FBQUU7QUFDekMsUUFBTSxRQUFRLEtBQUssS0FBTCxDQUFXLEtBQUssUUFBaEIsQ0FBZDtBQUNBLGFBQVMsTUFBTSxNQUFmOztBQUVBO0FBQ0EsUUFBSSxNQUFNLE1BQU4sS0FBaUIsRUFBckIsRUFBeUI7QUFDdkI7QUFDQSxxQkFBZSxHQUFmLEVBQW9CLElBQXBCLEVBQTBCLEtBQTFCLEVBQWlDLEVBQWpDO0FBQ0QsS0FIRCxNQUdPO0FBQ0wsU0FBRyxLQUFIO0FBQ0Q7QUFDRixHQVhEO0FBWUEsTUFBSSxJQUFKO0FBQ0Q7Ozs7Ozs7OztxakJDbk1EOzs7O0FBSUE7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7Ozs7O0FBQStDOztBQUUvQyxTQUFTLFNBQVQsQ0FBbUIsQ0FBbkIsRUFBc0I7QUFDcEIsU0FBTyxDQUFDLE1BQU0sV0FBVyxDQUFYLENBQU4sQ0FBRCxJQUF5QixTQUFTLENBQVQsQ0FBaEM7QUFDRDs7SUFFSyxLO0FBQ0osaUJBQVksSUFBWixFQUFrQixHQUFsQixFQUF1QjtBQUFBOztBQUFBOztBQUNyQjtBQUNBLFFBQUksQ0FBQyxHQUFMLEVBQVU7QUFDUixZQUFNLElBQUksS0FBSixDQUFVLHVDQUFWLENBQU47QUFDRDs7QUFFRDtBQUNBLFFBQUksS0FBSyxPQUFMLENBQWEsUUFBYixNQUEyQixDQUEvQixFQUFrQztBQUNoQyxVQUFJLFNBQVMsY0FBYixFQUE2QjtBQUMzQixlQUFPLGFBQVA7QUFDRCxPQUZELE1BRU8sSUFBSSxTQUFTLGNBQWIsRUFBNkI7QUFDbEMsZUFBTyxhQUFQO0FBQ0QsT0FGTSxNQUVBLElBQUksU0FBUyxpQkFBYixFQUFnQztBQUNyQyxlQUFPLGdCQUFQO0FBQ0QsT0FGTSxNQUVBO0FBQ0wsZ0JBQVEsS0FBUixDQUFjLGdGQUFkO0FBQ0Q7QUFDRjs7QUFFRDtBQUNBLFFBQUksS0FBSyxPQUFMLENBQWEsR0FBYixJQUFvQixDQUFDLENBQXpCLEVBQTRCO0FBQzFCLFdBQUssSUFBTCxHQUFZLElBQVo7QUFDQSxXQUFLLE9BQUwsR0FBZSxLQUFLLElBQUwsQ0FBVSxLQUFWLENBQWdCLEdBQWhCLENBQWY7QUFDQSxXQUFLLFNBQUwsR0FBaUIsRUFBakI7O0FBRUE7QUFDQSxXQUFLLE9BQUwsQ0FBYSxPQUFiLENBQXFCLFVBQUMsQ0FBRCxFQUFPO0FBQzFCLFlBQUksQ0FBQywwQkFBZ0IsQ0FBaEIsQ0FBTCxFQUF5QjtBQUN2QixnQkFBTSxJQUFJLEtBQUosa0JBQXlCLElBQXpCLCtCQUFOO0FBQ0Q7O0FBRUQsY0FBSyxTQUFMLENBQWUsSUFBZixDQUFvQiwwQkFBZ0IsQ0FBaEIsRUFBbUIsR0FBbkIsQ0FBcEI7QUFDRCxPQU5EOztBQVFBO0FBQ0QsS0FmRCxNQWVPLElBQUksQ0FBQywwQkFBZ0IsSUFBaEIsQ0FBTCxFQUE0QjtBQUNqQyxZQUFNLElBQUksS0FBSixrQkFBeUIsSUFBekIsK0JBQU47O0FBRUU7QUFDQTtBQUNILEtBTE0sTUFLQTtBQUNMLFdBQUssSUFBTCxHQUFZLElBQVo7QUFDQSxXQUFLLFNBQUwsR0FBaUIsMEJBQWdCLElBQWhCLEVBQXNCLEdBQXRCLENBQWpCO0FBQ0Q7QUFDRjs7QUFFRDtBQUNBOzs7OzswQkFDTSxFLEVBQUksRSxFQUFJLFEsRUFBVTtBQUN0QixXQUFLLEVBQUwsR0FBVSxFQUFWO0FBQ0EsV0FBSyxRQUFMLEdBQWdCLFFBQWhCO0FBQ0EsV0FBSyxFQUFMLEdBQVUsRUFBVjtBQUNBLFdBQUssR0FBTCxHQUFXLEtBQUssRUFBTCxDQUFRLFlBQVIsQ0FBcUIsdUJBQXJCLENBQVg7QUFDQSxXQUFLLE1BQUwsR0FBYyxLQUFLLEVBQUwsQ0FBUSxZQUFSLENBQXFCLDJCQUFyQixDQUFkO0FBQ0EsV0FBSyxHQUFMLEdBQVcsS0FBSyxFQUFMLENBQVEsWUFBUixDQUFxQixxQkFBckIsQ0FBWDs7QUFFQSxVQUFJLENBQUMsTUFBTSxPQUFOLENBQWMsS0FBSyxTQUFuQixDQUFMLEVBQW9DO0FBQ2xDLGFBQUssUUFBTDtBQUNELE9BRkQsTUFFTztBQUNMLGFBQUssU0FBTDtBQUNEO0FBQ0Y7O0FBRUQ7Ozs7K0JBQ1c7QUFDVCxVQUFNLFFBQVEsS0FBSyxRQUFMLENBQWlCLEtBQUssSUFBdEIsU0FBOEIsS0FBSyxNQUFuQyxDQUFkOztBQUVBLFVBQUksS0FBSixFQUFXO0FBQ1QsWUFBSSxLQUFLLFFBQUwsSUFBaUIsT0FBTyxLQUFLLFFBQVosS0FBeUIsVUFBOUMsRUFBMEQ7QUFDeEQsZUFBSyxRQUFMLENBQWMsV0FBZCxDQUEwQixLQUFLLEVBQS9CO0FBQ0Q7QUFDRCxtQ0FBWSxLQUFLLEVBQWpCLEVBQXFCLEtBQXJCO0FBQ0Q7QUFDRCxXQUFLLEtBQUssU0FBTCxDQUFlLElBQXBCLEVBQTBCLEtBQUssU0FBL0I7QUFDRDs7QUFFRDs7OztnQ0FDWTtBQUFBOztBQUNWLFdBQUssS0FBTCxHQUFhLEVBQWI7O0FBRUEsVUFBTSxRQUFRLEtBQUssUUFBTCxDQUFpQixLQUFLLElBQXRCLFNBQThCLEtBQUssTUFBbkMsQ0FBZDs7QUFFQSxVQUFJLEtBQUosRUFBVztBQUNULFlBQUksS0FBSyxRQUFMLElBQWlCLE9BQU8sS0FBSyxRQUFaLEtBQXlCLFVBQTlDLEVBQTBEO0FBQ3hELGVBQUssUUFBTCxDQUFjLFdBQWQsQ0FBMEIsS0FBSyxFQUEvQjtBQUNEO0FBQ0QsbUNBQVksS0FBSyxFQUFqQixFQUFxQixLQUFyQjtBQUNEOztBQUVELFdBQUssU0FBTCxDQUFlLE9BQWYsQ0FBdUIsVUFBQyxTQUFELEVBQWU7QUFDcEMsZUFBSyxVQUFVLElBQWYsRUFBcUIsU0FBckIsRUFBZ0MsVUFBQyxHQUFELEVBQVM7QUFDdkMsaUJBQUssS0FBTCxDQUFXLElBQVgsQ0FBZ0IsR0FBaEI7O0FBRUE7QUFDQTtBQUNBLGNBQUksT0FBSyxLQUFMLENBQVcsTUFBWCxLQUFzQixPQUFLLE9BQUwsQ0FBYSxNQUF2QyxFQUErQztBQUM3QyxnQkFBSSxNQUFNLENBQVY7O0FBRUEsbUJBQUssS0FBTCxDQUFXLE9BQVgsQ0FBbUIsVUFBQyxDQUFELEVBQU87QUFDeEIscUJBQU8sQ0FBUDtBQUNELGFBRkQ7O0FBSUEsZ0JBQUksT0FBSyxRQUFMLElBQWlCLE9BQU8sT0FBSyxRQUFaLEtBQXlCLFVBQTlDLEVBQTBEO0FBQ3hELHFCQUFLLFFBQUwsQ0FBYyxXQUFkLENBQTBCLE9BQUssRUFBL0I7QUFDRDs7QUFFRCxnQkFBTSxRQUFRLE9BQU8sT0FBSyxRQUFMLENBQWlCLE9BQUssSUFBdEIsU0FBOEIsT0FBSyxNQUFuQyxDQUFQLENBQWQ7QUFDQSxnQkFBSSxRQUFRLEdBQVosRUFBaUI7QUFDZixrQkFBTSxjQUFjLE9BQU8sT0FBSyxRQUFMLENBQWlCLE9BQUssSUFBdEIsU0FBOEIsT0FBSyxNQUFuQyxrQkFBUCxDQUFwQjtBQUNBLHFCQUFLLFFBQUwsQ0FBaUIsT0FBSyxJQUF0QixTQUE4QixPQUFLLE1BQW5DLG1CQUF5RCxHQUF6RDs7QUFFQSxvQkFBTSxVQUFVLFdBQVYsS0FBMEIsY0FBYyxDQUF4QyxHQUNOLE9BQU8sUUFBUSxXQURULEdBRU4sT0FBTyxLQUZQO0FBR0Q7QUFDRCxtQkFBSyxRQUFMLENBQWlCLE9BQUssSUFBdEIsU0FBOEIsT0FBSyxNQUFuQyxFQUE2QyxHQUE3Qzs7QUFFQSx1Q0FBWSxPQUFLLEVBQWpCLEVBQXFCLEdBQXJCO0FBQ0Q7QUFDRixTQTdCRDtBQThCRCxPQS9CRDs7QUFpQ0EsVUFBSSxLQUFLLFFBQUwsSUFBaUIsT0FBTyxLQUFLLFFBQVosS0FBeUIsVUFBOUMsRUFBMEQ7QUFDeEQsYUFBSyxRQUFMLENBQWMsV0FBZCxDQUEwQixLQUFLLEVBQS9CO0FBQ0Q7QUFDRjs7QUFFRDs7OzswQkFDTSxTLEVBQVcsRSxFQUFJO0FBQUE7O0FBQ3JCO0FBQ0UsVUFBTSxXQUFXLEtBQUssTUFBTCxHQUFjLFFBQWQsQ0FBdUIsRUFBdkIsRUFBMkIsU0FBM0IsQ0FBcUMsQ0FBckMsRUFBd0MsT0FBeEMsQ0FBZ0QsWUFBaEQsRUFBOEQsRUFBOUQsQ0FBakI7QUFDQSxhQUFPLFFBQVAsSUFBbUIsVUFBQyxJQUFELEVBQVU7QUFDM0IsWUFBTSxRQUFRLFVBQVUsU0FBVixDQUFvQixLQUFwQixTQUFnQyxDQUFDLElBQUQsQ0FBaEMsS0FBMkMsQ0FBekQ7O0FBRUEsWUFBSSxNQUFNLE9BQU8sRUFBUCxLQUFjLFVBQXhCLEVBQW9DO0FBQ2xDLGFBQUcsS0FBSDtBQUNELFNBRkQsTUFFTztBQUNMLGNBQUksT0FBSyxRQUFMLElBQWlCLE9BQU8sT0FBSyxRQUFaLEtBQXlCLFVBQTlDLEVBQTBEO0FBQ3hELG1CQUFLLFFBQUwsQ0FBYyxXQUFkLENBQTBCLE9BQUssRUFBL0I7QUFDRDtBQUNELHFDQUFZLE9BQUssRUFBakIsRUFBcUIsS0FBckIsRUFBNEIsT0FBSyxFQUFqQztBQUNEOztBQUVELHlCQUFPLE9BQVAsQ0FBZSxPQUFLLEVBQXBCLGVBQW1DLE9BQUssR0FBeEM7QUFDRCxPQWJEOztBQWVBO0FBQ0EsVUFBTSxTQUFTLFNBQVMsYUFBVCxDQUF1QixRQUF2QixDQUFmO0FBQ0EsYUFBTyxHQUFQLEdBQWEsVUFBVSxHQUFWLENBQWMsT0FBZCxDQUFzQixZQUF0QixnQkFBZ0QsUUFBaEQsQ0FBYjtBQUNBLGVBQVMsb0JBQVQsQ0FBOEIsTUFBOUIsRUFBc0MsQ0FBdEMsRUFBeUMsV0FBekMsQ0FBcUQsTUFBckQ7O0FBRUE7QUFDRDs7QUFFRDs7Ozt3QkFDSSxTLEVBQVcsRSxFQUFJO0FBQUE7O0FBQ2pCLFVBQU0sTUFBTSxJQUFJLGNBQUosRUFBWjs7QUFFQTtBQUNBLFVBQUksa0JBQUosR0FBeUIsWUFBTTtBQUM3QixZQUFJLElBQUksVUFBSixLQUFtQixDQUF2QixFQUEwQjtBQUN4QixjQUFJLElBQUksTUFBSixLQUFlLEdBQW5CLEVBQXdCO0FBQ3RCLGdCQUFNLFFBQVEsVUFBVSxTQUFWLENBQW9CLEtBQXBCLFNBQWdDLENBQUMsR0FBRCxtQkFBaEMsS0FBa0QsQ0FBaEU7O0FBRUEsZ0JBQUksTUFBTSxPQUFPLEVBQVAsS0FBYyxVQUF4QixFQUFvQztBQUNsQyxpQkFBRyxLQUFIO0FBQ0QsYUFGRCxNQUVPO0FBQ0wsa0JBQUksT0FBSyxRQUFMLElBQWlCLE9BQU8sT0FBSyxRQUFaLEtBQXlCLFVBQTlDLEVBQTBEO0FBQ3hELHVCQUFLLFFBQUwsQ0FBYyxXQUFkLENBQTBCLE9BQUssRUFBL0I7QUFDRDtBQUNELHlDQUFZLE9BQUssRUFBakIsRUFBcUIsS0FBckIsRUFBNEIsT0FBSyxFQUFqQztBQUNEOztBQUVELDZCQUFPLE9BQVAsQ0FBZSxPQUFLLEVBQXBCLGVBQW1DLE9BQUssR0FBeEM7QUFDRCxXQWJELE1BYU8sSUFBSSxVQUFVLEdBQVYsQ0FBYyxXQUFkLEdBQTRCLE9BQTVCLENBQW9DLG1DQUFwQyxNQUE2RSxDQUFqRixFQUFvRjtBQUN6RixvQkFBUSxLQUFSLENBQWMsNEVBQWQ7QUFDRCxXQUZNLE1BRUE7QUFDTCxvQkFBUSxLQUFSLENBQWMsNkJBQWQsRUFBNkMsVUFBVSxHQUF2RCxFQUE0RCwrQ0FBNUQ7QUFDRDtBQUNGO0FBQ0YsT0FyQkQ7O0FBdUJBLGdCQUFVLEdBQVYsR0FBZ0IsVUFBVSxHQUFWLENBQWMsVUFBZCxDQUF5QixtQ0FBekIsS0FBaUUsS0FBSyxHQUF0RSxHQUNkLFVBQVUsR0FBVixHQUFnQixLQUFLLEdBRFAsR0FFZCxVQUFVLEdBRlo7O0FBSUEsVUFBSSxJQUFKLENBQVMsS0FBVCxFQUFnQixVQUFVLEdBQTFCO0FBQ0EsVUFBSSxJQUFKO0FBQ0Q7O0FBRUQ7Ozs7eUJBQ0ssUyxFQUFXLEUsRUFBSTtBQUFBOztBQUNsQixVQUFNLE1BQU0sSUFBSSxjQUFKLEVBQVo7O0FBRUE7QUFDQSxVQUFJLGtCQUFKLEdBQXlCLFlBQU07QUFDN0IsWUFBSSxJQUFJLFVBQUosS0FBbUIsZUFBZSxJQUFsQyxJQUNGLElBQUksTUFBSixLQUFlLEdBRGpCLEVBQ3NCO0FBQ3BCO0FBQ0Q7O0FBRUQsWUFBTSxRQUFRLFVBQVUsU0FBVixDQUFvQixLQUFwQixTQUFnQyxDQUFDLEdBQUQsQ0FBaEMsS0FBMEMsQ0FBeEQ7O0FBRUEsWUFBSSxNQUFNLE9BQU8sRUFBUCxLQUFjLFVBQXhCLEVBQW9DO0FBQ2xDLGFBQUcsS0FBSDtBQUNELFNBRkQsTUFFTztBQUNMLGNBQUksT0FBSyxRQUFMLElBQWlCLE9BQU8sT0FBSyxRQUFaLEtBQXlCLFVBQTlDLEVBQTBEO0FBQ3hELG1CQUFLLFFBQUwsQ0FBYyxXQUFkLENBQTBCLE9BQUssRUFBL0I7QUFDRDtBQUNELHFDQUFZLE9BQUssRUFBakIsRUFBcUIsS0FBckIsRUFBNEIsT0FBSyxFQUFqQztBQUNEO0FBQ0QseUJBQU8sT0FBUCxDQUFlLE9BQUssRUFBcEIsZUFBbUMsT0FBSyxHQUF4QztBQUNELE9BakJEOztBQW1CQSxVQUFJLElBQUosQ0FBUyxNQUFULEVBQWlCLFVBQVUsR0FBM0I7QUFDQSxVQUFJLGdCQUFKLENBQXFCLGNBQXJCLEVBQXFDLGdDQUFyQztBQUNBLFVBQUksSUFBSixDQUFTLEtBQUssU0FBTCxDQUFlLFVBQVUsSUFBekIsQ0FBVDtBQUNEOzs7NkJBRVEsSSxFQUFpQjtBQUFBLFVBQVgsS0FBVyx1RUFBSCxDQUFHO0FBQUM7QUFDekIsVUFBSSxDQUFDLE9BQU8sWUFBUixJQUF3QixDQUFDLElBQTdCLEVBQW1DO0FBQ2pDO0FBQ0Q7O0FBRUQsbUJBQWEsT0FBYixnQkFBa0MsSUFBbEMsRUFBMEMsS0FBMUM7QUFDRDs7OzZCQUVRLEksRUFBTTtBQUFDO0FBQ2QsVUFBSSxDQUFDLE9BQU8sWUFBUixJQUF3QixDQUFDLElBQTdCLEVBQW1DO0FBQ2pDO0FBQ0Q7O0FBRUQsYUFBTyxhQUFhLE9BQWIsZ0JBQWtDLElBQWxDLENBQVA7QUFDRDs7Ozs7O2tCQUlZLEs7Ozs7Ozs7OztBQzNQZjs7OztBQUNBOzs7O0FBQ0E7Ozs7OztBQUVBLFNBQVMsSUFBVCxHQUFnQjtBQUNkLHNCQUFLO0FBQ0gsY0FBVTtBQUNSLGFBQU8sK0NBREM7QUFFUixhQUFPO0FBRkMsS0FEUDtBQUtILFFBQUk7QUFDRiwwQ0FERTtBQUVGO0FBRkU7QUFMRCxHQUFMO0FBVUQ7O2tCQUNjLFlBQU07QUFDbkIsTUFBSSxTQUFTLFVBQVQsS0FBd0IsVUFBNUIsRUFBd0M7QUFDdEMsV0FBTyxNQUFQO0FBQ0Q7QUFDRCxXQUFTLGdCQUFULENBQTBCLGtCQUExQixFQUE4QyxZQUFNO0FBQ2xELFFBQUksU0FBUyxVQUFULEtBQXdCLFVBQTVCLEVBQXdDO0FBQ3RDO0FBQ0Q7QUFDRixHQUpELEVBSUcsS0FKSDtBQUtELEM7Ozs7Ozs7O0FDekJEOzs7a0JBR2U7QUFDYixTQURhLG1CQUNMLE9BREssRUFDSSxLQURKLEVBQ1c7QUFDdEIsUUFBTSxLQUFLLFNBQVMsV0FBVCxDQUFxQixPQUFyQixDQUFYO0FBQ0EsT0FBRyxTQUFILGdCQUEwQixLQUExQixFQUFtQyxJQUFuQyxFQUF5QyxJQUF6QztBQUNBLFlBQVEsYUFBUixDQUFzQixFQUF0QjtBQUNEO0FBTFksQzs7Ozs7Ozs7Ozs7OztBQ0hmOzs7SUFHcUIsUztBQUVuQixxQkFBWSxJQUFaLEVBQWtCLFNBQWxCLEVBQTZCO0FBQUE7O0FBQzNCLFNBQUssR0FBTCxHQUFXLG1CQUFtQixJQUFuQixDQUF3QixVQUFVLFNBQWxDLEtBQWdELENBQUMsT0FBTyxRQUFuRTtBQUNBLFNBQUssSUFBTCxHQUFZLElBQVo7QUFDQSxTQUFLLE9BQUwsR0FBZSxLQUFmO0FBQ0EsU0FBSyxTQUFMLEdBQWlCLFNBQWpCOztBQUVBO0FBQ0EsU0FBSyxRQUFMLEdBQWdCLEtBQUssTUFBTCxDQUFZLENBQVosRUFBZSxXQUFmLEtBQStCLEtBQUssS0FBTCxDQUFXLENBQVgsQ0FBL0M7QUFDRDs7QUFFRDtBQUNBOzs7Ozs0QkFDUSxJLEVBQU07QUFDWjtBQUNBO0FBQ0EsVUFBSSxLQUFLLEdBQVQsRUFBYztBQUNaLGFBQUssYUFBTCxHQUFxQixLQUFLLFNBQUwsQ0FBZSxJQUFmLEVBQXFCLElBQXJCLENBQXJCO0FBQ0EsYUFBSyxjQUFMLEdBQXNCLEtBQUssUUFBTCxDQUFjLEtBQUssYUFBTCxDQUFtQixHQUFqQyxFQUFzQyxLQUFLLGFBQUwsQ0FBbUIsSUFBekQsQ0FBdEI7QUFDRDs7QUFFRCxXQUFLLGFBQUwsR0FBcUIsS0FBSyxTQUFMLENBQWUsSUFBZixDQUFyQjtBQUNBLFdBQUssUUFBTCxHQUFnQixLQUFLLFFBQUwsQ0FBYyxLQUFLLGFBQUwsQ0FBbUIsR0FBakMsRUFBc0MsS0FBSyxhQUFMLENBQW1CLElBQXpELENBQWhCO0FBQ0Q7O0FBRUQ7Ozs7NEJBQ1E7QUFBQTs7QUFDTjtBQUNBO0FBQ0EsVUFBSSxLQUFLLGNBQVQsRUFBeUI7QUFBQTtBQUN2QixjQUFNLFFBQVMsSUFBSSxJQUFKLEVBQUQsQ0FBYSxPQUFiLEVBQWQ7O0FBRUEscUJBQVcsWUFBTTtBQUNmLGdCQUFNLE1BQU8sSUFBSSxJQUFKLEVBQUQsQ0FBYSxPQUFiLEVBQVo7O0FBRUE7QUFDQSxnQkFBSSxNQUFNLEtBQU4sR0FBYyxJQUFsQixFQUF3QjtBQUN0QjtBQUNEOztBQUVELG1CQUFPLFFBQVAsR0FBa0IsTUFBSyxRQUF2QjtBQUNELFdBVEQsRUFTRyxJQVRIOztBQVdBLGlCQUFPLFFBQVAsR0FBa0IsTUFBSyxjQUF2Qjs7QUFFQTtBQWhCdUI7QUFpQnhCLE9BakJELE1BaUJPLElBQUksS0FBSyxJQUFMLEtBQWMsT0FBbEIsRUFBMkI7QUFDaEMsZUFBTyxRQUFQLEdBQWtCLEtBQUssUUFBdkI7O0FBRUE7QUFDRCxPQUpNLE1BSUE7QUFDTDtBQUNBLFlBQUksS0FBSyxLQUFMLElBQWMsS0FBSyxhQUFMLENBQW1CLEtBQXJDLEVBQTRDO0FBQzFDLGlCQUFPLEtBQUssVUFBTCxDQUFnQixLQUFLLFFBQXJCLEVBQStCLEtBQUssYUFBTCxDQUFtQixLQUFsRCxDQUFQO0FBQ0Q7O0FBRUQsZUFBTyxJQUFQLENBQVksS0FBSyxRQUFqQjtBQUNEO0FBQ0Y7O0FBRUQ7QUFDQTs7Ozs2QkFDUyxHLEVBQUssSSxFQUFNO0FBQUM7QUFDbkIsVUFBTSxjQUFjLENBQ2xCLFVBRGtCLEVBRWxCLFdBRmtCLEVBR2xCLFNBSGtCLENBQXBCOztBQU1BLFVBQUksV0FBVyxHQUFmO0FBQUEsVUFDRSxVQURGOztBQUdBLFdBQUssQ0FBTCxJQUFVLElBQVYsRUFBZ0I7QUFDZDtBQUNBLFlBQUksQ0FBQyxLQUFLLENBQUwsQ0FBRCxJQUFZLFlBQVksT0FBWixDQUFvQixDQUFwQixJQUF5QixDQUFDLENBQTFDLEVBQTZDO0FBQzNDLG1CQUQyQyxDQUNqQztBQUNYOztBQUVEO0FBQ0EsYUFBSyxDQUFMLElBQVUsbUJBQW1CLEtBQUssQ0FBTCxDQUFuQixDQUFWO0FBQ0Esb0JBQWUsQ0FBZixTQUFvQixLQUFLLENBQUwsQ0FBcEI7QUFDRDs7QUFFRCxhQUFPLFNBQVMsTUFBVCxDQUFnQixDQUFoQixFQUFtQixTQUFTLE1BQVQsR0FBa0IsQ0FBckMsQ0FBUDtBQUNEOztBQUVEOzs7OytCQUNXLEcsRUFBSyxPLEVBQVM7QUFBQztBQUN4QixVQUFNLGlCQUFpQixPQUFPLFVBQVAsS0FBc0IsU0FBdEIsR0FBa0MsT0FBTyxVQUF6QyxHQUFzRCxPQUFPLElBQXBGO0FBQUEsVUFDRSxnQkFBZ0IsT0FBTyxTQUFQLEtBQXFCLFNBQXJCLEdBQWlDLE9BQU8sU0FBeEMsR0FBb0QsT0FBTyxHQUQ3RTtBQUFBLFVBRUUsUUFBUSxPQUFPLFVBQVAsR0FBb0IsT0FBTyxVQUEzQixHQUF3QyxTQUFTLGVBQVQsQ0FBeUIsV0FBekIsR0FBdUMsU0FBUyxlQUFULENBQXlCLFdBQWhFLEdBQThFLE9BQU8sS0FGdkk7QUFBQSxVQUU2STtBQUMzSSxlQUFTLE9BQU8sV0FBUCxHQUFxQixPQUFPLFdBQTVCLEdBQTBDLFNBQVMsZUFBVCxDQUF5QixZQUF6QixHQUF3QyxTQUFTLGVBQVQsQ0FBeUIsWUFBakUsR0FBZ0YsT0FBTyxNQUg1STtBQUFBLFVBR21KO0FBQ2pKLGFBQVMsUUFBUSxDQUFULEdBQWUsUUFBUSxLQUFSLEdBQWdCLENBQWhDLEdBQXNDLGNBSi9DO0FBQUEsVUFLRSxNQUFRLFNBQVMsQ0FBVixHQUFnQixRQUFRLE1BQVIsR0FBaUIsQ0FBbEMsR0FBd0MsYUFMaEQ7QUFBQSxVQU1FLFlBQVksT0FBTyxJQUFQLENBQVksR0FBWixFQUFpQixXQUFqQixhQUF1QyxRQUFRLEtBQS9DLGlCQUFnRSxRQUFRLE1BQXhFLGNBQXVGLEdBQXZGLGVBQW9HLElBQXBHLENBTmQ7O0FBUUE7QUFDQSxVQUFJLE9BQU8sS0FBWCxFQUFrQjtBQUNoQixrQkFBVSxLQUFWO0FBQ0Q7QUFDRjs7Ozs7O2tCQXJHa0IsUzs7Ozs7Ozs7O3FqQkNIckI7Ozs7O0FBR0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7Ozs7O2tCQUVlLFlBQU07QUFDbkI7QUFEbUIsTUFFYixTQUZhO0FBSWpCLHVCQUFZLElBQVosRUFBa0IsT0FBbEIsRUFBMkI7QUFBQTs7QUFBQTs7QUFDekIsVUFBSSxDQUFDLEtBQUssU0FBVixFQUFxQixLQUFLLFNBQUwsR0FBaUIsSUFBakI7O0FBRXJCLFVBQU0sT0FBTyxLQUFLLElBQUwsQ0FBVSxPQUFWLENBQWtCLEdBQWxCLENBQWI7O0FBRUEsVUFBSSxPQUFPLENBQUMsQ0FBWixFQUFlO0FBQ2IsYUFBSyxJQUFMLEdBQVksMkJBQVksSUFBWixFQUFrQixLQUFLLElBQXZCLENBQVo7QUFDRDs7QUFFRCxVQUFJLGFBQUo7QUFDQSxXQUFLLE9BQUwsR0FBZSxPQUFmO0FBQ0EsV0FBSyxJQUFMLEdBQVksSUFBWjs7QUFFQSxXQUFLLEVBQUwsR0FBVSx3QkFBTyxLQUFLLElBQVosRUFBa0IsMEJBQWdCLEtBQUssSUFBckIsQ0FBbEIsQ0FBVjtBQUNBLFdBQUssRUFBTCxDQUFRLE9BQVIsQ0FBZ0IsSUFBaEI7O0FBRUEsVUFBSSxDQUFDLE9BQUQsSUFBWSxLQUFLLE9BQXJCLEVBQThCO0FBQzVCLGtCQUFVLEtBQUssT0FBZjtBQUNBLGVBQU8sU0FBUyxhQUFULENBQXVCLFdBQVcsR0FBbEMsQ0FBUDtBQUNBLFlBQUksS0FBSyxJQUFULEVBQWU7QUFDYixlQUFLLFNBQUwsQ0FBZSxHQUFmLENBQW1CLGlCQUFuQixFQUFzQyxLQUFLLElBQTNDO0FBQ0EsZUFBSyxZQUFMLENBQWtCLGlCQUFsQixFQUFxQyxLQUFLLElBQTFDO0FBQ0EsZUFBSyxZQUFMLENBQWtCLHNCQUFsQixFQUEwQyxLQUFLLElBQS9DO0FBQ0Q7QUFDRCxZQUFJLEtBQUssU0FBVCxFQUFvQixLQUFLLFNBQUwsR0FBaUIsS0FBSyxTQUF0QjtBQUNyQjtBQUNELFVBQUksSUFBSixFQUFVLFVBQVUsSUFBVjs7QUFFVixVQUFJLEtBQUssU0FBVCxFQUFvQjtBQUNsQixnQkFBUSxnQkFBUixDQUF5QixPQUF6QixFQUFrQyxZQUFNO0FBQ3RDLGdCQUFLLEtBQUw7QUFDRCxTQUZEO0FBR0Q7O0FBRUQsVUFBSSxLQUFLLFFBQVQsRUFBbUI7QUFDakIsYUFBSyxRQUFMLENBQWMsV0FBZCxDQUEwQixPQUExQjtBQUNEOztBQUVELFVBQUksS0FBSyxPQUFMLElBQWdCLE1BQU0sT0FBTixDQUFjLEtBQUssT0FBbkIsQ0FBcEIsRUFBaUQ7QUFDL0MsYUFBSyxPQUFMLENBQWEsT0FBYixDQUFxQixVQUFDLFFBQUQsRUFBYztBQUNqQyxrQkFBUSxTQUFSLENBQWtCLEdBQWxCLENBQXNCLFFBQXRCO0FBQ0QsU0FGRDtBQUdEOztBQUVELFVBQUksS0FBSyxJQUFMLENBQVUsV0FBVixPQUE0QixRQUFoQyxFQUEwQztBQUN4QyxZQUFNLFNBQVMsS0FBSyxPQUFMLEdBQ2YsK0NBRGUsR0FFZix1Q0FGQTs7QUFJQSxZQUFNLFNBQVMsS0FBSyxPQUFMLEdBQ2YsOERBRGUsR0FFZiw2REFGQTs7QUFJQSxZQUFNLFdBQVcsS0FBSyxPQUFMLEdBQ2pCLHNEQURpQixHQUVqQixxREFGQTs7QUFLQSxZQUFNLGlDQUErQixNQUEvQix1U0FNZ0QsS0FBSyxRQU5yRCwwSUFVQSxNQVZBLDZIQWFBLFFBYkEsMEJBQU47O0FBaUJBLFlBQU0sWUFBWSxTQUFTLGFBQVQsQ0FBdUIsS0FBdkIsQ0FBbEI7QUFDQSxrQkFBVSxLQUFWLENBQWdCLE9BQWhCLEdBQTBCLE1BQTFCO0FBQ0Esa0JBQVUsU0FBVixHQUFzQixZQUF0QjtBQUNBLGlCQUFTLElBQVQsQ0FBYyxXQUFkLENBQTBCLFNBQTFCOztBQUVBLGFBQUssTUFBTCxHQUFjLFVBQVUsYUFBVixDQUF3QixNQUF4QixDQUFkO0FBQ0Q7O0FBRUQsV0FBSyxPQUFMLEdBQWUsT0FBZjtBQUNBLGFBQU8sT0FBUDtBQUNEOztBQUVEOzs7QUEzRmlCO0FBQUE7QUFBQSw0QkE0RlgsQ0E1RlcsRUE0RlI7QUFDUDtBQUNBLFlBQUksS0FBSyxJQUFMLENBQVUsT0FBZCxFQUF1QjtBQUNyQjtBQUNBLGVBQUssRUFBTCxDQUFRLE9BQVIsQ0FBZ0IsSUFBaEIsRUFGcUIsQ0FFQztBQUN2Qjs7QUFFRCxZQUFJLEtBQUssSUFBTCxDQUFVLElBQVYsQ0FBZSxXQUFmLE9BQWlDLFFBQXJDLEVBQStDO0FBQzdDLGVBQUssTUFBTCxDQUFZLE1BQVo7QUFDRCxTQUZELE1BRU8sS0FBSyxFQUFMLENBQVEsS0FBUixDQUFjLENBQWQ7O0FBRVAseUJBQU8sT0FBUCxDQUFlLEtBQUssT0FBcEIsRUFBNkIsUUFBN0I7QUFDRDtBQXhHZ0I7O0FBQUE7QUFBQTs7QUEyR25CLFNBQU8sU0FBUDtBQUNELEM7Ozs7Ozs7O0FDcEhEOzs7OztrQkFLZTs7QUFFYjtBQUNBLFNBSGEsbUJBR0wsSUFISyxFQUdjO0FBQUEsUUFBYixHQUFhLHVFQUFQLEtBQU87O0FBQ3pCO0FBQ0E7QUFDQSxRQUFJLE9BQU8sS0FBSyxHQUFoQixFQUFxQjtBQUNuQixVQUFJLFVBQVUsRUFBZDs7QUFFQSxVQUFJLEtBQUssSUFBVCxFQUFlO0FBQ2IsbUJBQVcsS0FBSyxJQUFoQjtBQUNEOztBQUVELFVBQUksS0FBSyxHQUFULEVBQWM7QUFDWiwyQkFBaUIsS0FBSyxHQUF0QjtBQUNEOztBQUVELFVBQUksS0FBSyxRQUFULEVBQW1CO0FBQ2pCLFlBQU0sT0FBTyxLQUFLLFFBQUwsQ0FBYyxLQUFkLENBQW9CLEdBQXBCLENBQWI7QUFDQSxhQUFLLE9BQUwsQ0FBYSxVQUFDLEdBQUQsRUFBUztBQUNwQiw0QkFBZ0IsR0FBaEI7QUFDRCxTQUZEO0FBR0Q7O0FBRUQsVUFBSSxLQUFLLEdBQVQsRUFBYztBQUNaLDZCQUFtQixLQUFLLEdBQXhCO0FBQ0Q7O0FBRUQsYUFBTztBQUNMLGFBQUssaUJBREE7QUFFTCxjQUFNO0FBQ0o7QUFESTtBQUZELE9BQVA7QUFNRDs7QUFFRCxXQUFPO0FBQ0wsV0FBSyw0QkFEQTtBQUVMLGdCQUZLO0FBR0wsYUFBTztBQUNMLGVBQU8sR0FERjtBQUVMLGdCQUFRO0FBRkg7QUFIRixLQUFQO0FBUUQsR0E1Q1k7OztBQThDYjtBQUNBLGdCQS9DYSwwQkErQ0UsSUEvQ0YsRUErQ3FCO0FBQUEsUUFBYixHQUFhLHVFQUFQLEtBQU87O0FBQ2hDO0FBQ0EsUUFBSSxPQUFPLEtBQUssR0FBaEIsRUFBcUI7QUFDbkIsYUFBTztBQUNMLGFBQUssbUJBREE7QUFFTCxjQUFNO0FBQ0osY0FBSSxLQUFLO0FBREw7QUFGRCxPQUFQO0FBTUQ7O0FBRUQsV0FBTztBQUNMLFdBQUsscUNBREE7QUFFTCxZQUFNO0FBQ0osa0JBQVUsS0FBSyxPQURYO0FBRUosaUJBQVMsS0FBSztBQUZWLE9BRkQ7QUFNTCxhQUFPO0FBQ0wsZUFBTyxHQURGO0FBRUwsZ0JBQVE7QUFGSDtBQU5GLEtBQVA7QUFXRCxHQXJFWTs7O0FBdUViO0FBQ0EsYUF4RWEsdUJBd0VELElBeEVDLEVBd0VrQjtBQUFBLFFBQWIsR0FBYSx1RUFBUCxLQUFPOztBQUM3QjtBQUNBLFFBQUksT0FBTyxLQUFLLEdBQWhCLEVBQXFCO0FBQ25CLGFBQU87QUFDTCxhQUFLLG1CQURBO0FBRUwsY0FBTTtBQUNKLGNBQUksS0FBSztBQURMO0FBRkQsT0FBUDtBQU1EOztBQUVELFdBQU87QUFDTCxXQUFLLHNDQURBO0FBRUwsWUFBTTtBQUNKLGtCQUFVLEtBQUssT0FEWDtBQUVKLGlCQUFTLEtBQUs7QUFGVixPQUZEO0FBTUwsYUFBTztBQUNMLGVBQU8sR0FERjtBQUVMLGdCQUFRO0FBRkg7QUFORixLQUFQO0FBV0QsR0E5Rlk7OztBQWdHYjtBQUNBLGVBakdhLHlCQWlHQyxJQWpHRCxFQWlHb0I7QUFBQSxRQUFiLEdBQWEsdUVBQVAsS0FBTzs7QUFDL0I7QUFDQSxRQUFJLE9BQU8sS0FBSyxHQUFoQixFQUFxQjtBQUNuQixVQUFNLFVBQVUsS0FBSyxVQUFMLEdBQWtCO0FBQ2hDLHFCQUFhLEtBQUs7QUFEYyxPQUFsQixHQUVaO0FBQ0YsWUFBSSxLQUFLO0FBRFAsT0FGSjs7QUFNQSxhQUFPO0FBQ0wsYUFBSyxpQkFEQTtBQUVMLGNBQU07QUFGRCxPQUFQO0FBSUQ7O0FBRUQsV0FBTztBQUNMLFdBQUssa0NBREE7QUFFTCxZQUFNO0FBQ0oscUJBQWEsS0FBSyxVQURkO0FBRUosaUJBQVMsS0FBSztBQUZWLE9BRkQ7QUFNTCxhQUFPO0FBQ0wsZUFBTyxHQURGO0FBRUwsZ0JBQVE7QUFGSDtBQU5GLEtBQVA7QUFXRCxHQTNIWTs7O0FBNkhiO0FBQ0EsVUE5SGEsb0JBOEhKLElBOUhJLEVBOEhFO0FBQ2IsV0FBTztBQUNMLFdBQUssK0ZBREE7QUFFTCxnQkFGSztBQUdMLGFBQU87QUFDTCxlQUFPLEdBREY7QUFFTCxnQkFBUTtBQUZIO0FBSEYsS0FBUDtBQVFELEdBdklZOzs7QUF5SVg7QUFDRixjQTFJYSx3QkEwSUEsSUExSUEsRUEwSU07QUFDakIsV0FBTztBQUNMLFdBQUssK0ZBREE7QUFFTCxnQkFGSztBQUdMLGFBQU87QUFDTCxlQUFPLEdBREY7QUFFTCxnQkFBUTtBQUZIO0FBSEYsS0FBUDtBQVFELEdBbkpZOzs7QUFxSmI7QUFDQSxTQXRKYSxtQkFzSkwsSUF0SkssRUFzSmM7QUFBQSxRQUFiLEdBQWEsdUVBQVAsS0FBTzs7QUFDekI7QUFDQSxRQUFJLE9BQU8sS0FBSyxHQUFoQixFQUFxQjtBQUNuQixhQUFPO0FBQ0wsMEJBQWdCLEtBQUssS0FBckI7QUFESyxPQUFQO0FBR0Q7O0FBRUQsV0FBTztBQUNMLGdEQUF3QyxLQUFLLEtBQTdDLE1BREs7QUFFTCxhQUFPO0FBQ0wsZUFBTyxJQURGO0FBRUwsZ0JBQVE7QUFGSDtBQUZGLEtBQVA7QUFPRCxHQXJLWTs7O0FBdUtiO0FBQ0Esa0JBeEthLDRCQXdLSSxJQXhLSixFQXdLdUI7QUFBQSxRQUFiLEdBQWEsdUVBQVAsS0FBTzs7QUFDbEM7QUFDQSxRQUFJLE9BQU8sS0FBSyxHQUFoQixFQUFxQjtBQUNuQixhQUFPO0FBQ0wsaURBQXVDLEtBQUssSUFBNUM7QUFESyxPQUFQO0FBR0Q7O0FBRUQsV0FBTztBQUNMLDZDQUFxQyxLQUFLLElBQTFDLE1BREs7QUFFTCxhQUFPO0FBQ0wsZUFBTyxHQURGO0FBRUwsZ0JBQVE7QUFGSDtBQUZGLEtBQVA7QUFPRCxHQXZMWTs7O0FBeUxiO0FBQ0EsV0ExTGEsdUJBMExEO0FBQ1YsV0FBTztBQUNMLFdBQUs7QUFEQSxLQUFQO0FBR0QsR0E5TFk7OztBQWdNYjtBQUNBLGlCQWpNYSwyQkFpTUcsSUFqTUgsRUFpTXNCO0FBQUEsUUFBYixHQUFhLHVFQUFQLEtBQU87O0FBQ2pDO0FBQ0EsUUFBSSxPQUFPLEtBQUssR0FBaEIsRUFBcUI7QUFDbkIsYUFBTztBQUNMLGFBQUssbUJBREE7QUFFTDtBQUZLLE9BQVA7QUFJRDs7QUFFRCxXQUFPO0FBQ0wseUNBQWlDLEtBQUssUUFBdEMsTUFESztBQUVMLGFBQU87QUFDTCxlQUFPLEdBREY7QUFFTCxnQkFBUTtBQUZIO0FBRkYsS0FBUDtBQU9ELEdBak5ZOzs7QUFtTmI7QUFDQSxVQXBOYSxvQkFvTkosSUFwTkksRUFvTkU7QUFDYixXQUFPO0FBQ0wsK0JBQXVCLEtBQUssUUFBNUI7QUFESyxLQUFQO0FBR0QsR0F4Tlk7OztBQTBOYjtBQUNBLFFBM05hLGtCQTJOTixJQTNOTSxFQTJOQTtBQUNYLFdBQU87QUFDTCxXQUFLLGdDQURBO0FBRUwsZ0JBRks7QUFHTCxhQUFPO0FBQ0wsZUFBTyxHQURGO0FBRUwsZ0JBQVE7QUFGSDtBQUhGLEtBQVA7QUFRRCxHQXBPWTs7O0FBc09iO0FBQ0EsWUF2T2Esc0JBdU9GLElBdk9FLEVBdU9pQjtBQUFBLFFBQWIsR0FBYSx1RUFBUCxLQUFPOztBQUM1QixRQUFJLEtBQUssTUFBVCxFQUFpQjtBQUNmLFdBQUssQ0FBTCxHQUFTLEtBQUssTUFBZDtBQUNBLGFBQU8sS0FBSyxNQUFaO0FBQ0Q7O0FBRUQ7QUFDQSxRQUFJLE9BQU8sS0FBSyxHQUFoQixFQUFxQjtBQUNuQixhQUFPO0FBQ0wsYUFBSyxtQkFEQTtBQUVMLGNBQU07QUFGRCxPQUFQO0FBSUQ7O0FBRUQsUUFBSSxDQUFDLEdBQUQsSUFBUSxLQUFLLEdBQWpCLEVBQXNCO0FBQ3BCLGFBQU8sS0FBSyxHQUFaO0FBQ0Q7O0FBRUQsV0FBTztBQUNMLFdBQUssMkJBREE7QUFFTCxnQkFGSztBQUdMLGFBQU87QUFDTCxlQUFPLEdBREY7QUFFTCxnQkFBUTtBQUZIO0FBSEYsS0FBUDtBQVFELEdBalFZOzs7QUFtUWI7QUFDQSxXQXBRYSxxQkFvUUgsSUFwUUcsRUFvUUc7QUFDZCxXQUFPO0FBQ0wsV0FBSyxnREFEQTtBQUVMLGdCQUZLO0FBR0wsYUFBTztBQUNMLGVBQU8sR0FERjtBQUVMLGdCQUFRO0FBRkg7QUFIRixLQUFQO0FBUUQsR0E3UVk7OztBQStRYjtBQUNBLFVBaFJhLG9CQWdSSixJQWhSSSxFQWdSRTtBQUNiLFdBQU87QUFDTCxXQUFLLHVDQURBO0FBRUwsZ0JBRks7QUFHTCxhQUFPO0FBQ0wsZUFBTyxHQURGO0FBRUwsZ0JBQVE7QUFGSDtBQUhGLEtBQVA7QUFRRCxHQXpSWTs7O0FBMlJiO0FBQ0EsUUE1UmEsa0JBNFJOLElBNVJNLEVBNFJBO0FBQ1gsV0FBTztBQUNMLFdBQUssMkJBREE7QUFFTCxnQkFGSztBQUdMLGFBQU87QUFDTCxlQUFPLEdBREY7QUFFTCxnQkFBUTtBQUZIO0FBSEYsS0FBUDtBQVFELEdBclNZOzs7QUF1U2I7QUFDQSxRQXhTYSxrQkF3U04sSUF4U00sRUF3U0E7QUFDWCxXQUFPO0FBQ0wsV0FBSyw0Q0FEQTtBQUVMLGdCQUZLO0FBR0wsYUFBTztBQUNMLGVBQU8sR0FERjtBQUVMLGdCQUFRO0FBRkg7QUFIRixLQUFQO0FBUUQsR0FqVFk7OztBQW1UYjtBQUNBLFFBcFRhLGtCQW9UTixJQXBUTSxFQW9UQTtBQUNYLFdBQU87QUFDTCxXQUFLLDJCQURBO0FBRUwsZ0JBRks7QUFHTCxhQUFPO0FBQ0wsZUFBTyxHQURGO0FBRUwsZ0JBQVE7QUFGSDtBQUhGLEtBQVA7QUFRRCxHQTdUWTs7O0FBK1RiO0FBQ0EsUUFoVWEsa0JBZ1VOLElBaFVNLEVBZ1VhO0FBQUEsUUFBYixHQUFhLHVFQUFQLEtBQU87O0FBQ3hCO0FBQ0EsUUFBSSxPQUFPLEtBQUssR0FBaEIsRUFBcUI7QUFDbkIsYUFBTztBQUNMLGtDQUF3QixLQUFLLFFBQTdCO0FBREssT0FBUDtBQUdEO0FBQ0QsV0FBTztBQUNMLDZDQUFxQyxLQUFLLFFBQTFDLE1BREs7QUFFTCxhQUFPO0FBQ0wsZUFBTyxHQURGO0FBRUwsZ0JBQVE7QUFGSDtBQUZGLEtBQVA7QUFPRCxHQTlVWTs7O0FBZ1ZiO0FBQ0EsVUFqVmEsb0JBaVZKLElBalZJLEVBaVZFO0FBQ2IsV0FBTztBQUNMLFdBQUssa0JBREE7QUFFTDtBQUZLLEtBQVA7QUFJRCxHQXRWWTs7O0FBd1ZiO0FBQ0EsS0F6VmEsZUF5VlQsSUF6VlMsRUF5VlU7QUFBQSxRQUFiLEdBQWEsdUVBQVAsS0FBTzs7QUFDckIsV0FBTztBQUNMLFdBQUssTUFBTSxPQUFOLEdBQWdCLE9BRGhCO0FBRUw7QUFGSyxLQUFQO0FBSUQsR0E5Vlk7OztBQWdXYjtBQUNBLE9BaldhLGlCQWlXUCxJQWpXTyxFQWlXRDtBQUNWLFFBQUksTUFBTSxTQUFWOztBQUVBO0FBQ0EsUUFBSSxLQUFLLEVBQUwsS0FBWSxJQUFoQixFQUFzQjtBQUNwQixrQkFBVSxLQUFLLEVBQWY7QUFDRDs7QUFFRCxXQUFPLEdBQVA7O0FBRUEsV0FBTztBQUNMLGNBREs7QUFFTCxZQUFNO0FBQ0osaUJBQVMsS0FBSyxPQURWO0FBRUosY0FBTSxLQUFLO0FBRlA7QUFGRCxLQUFQO0FBT0QsR0FsWFk7OztBQW9YYjtBQUNBLFFBclhhLGtCQXFYTixJQXJYTSxFQXFYYTtBQUFBLFFBQWIsR0FBYSx1RUFBUCxLQUFPO0FBQUU7QUFDMUIsUUFBSSxNQUFNLEtBQUssSUFBTCwyQkFBa0MsS0FBSyxJQUF2QyxHQUFnRCxLQUFLLEdBQS9EOztBQUVBLFFBQUksS0FBSyxLQUFULEVBQWdCO0FBQ2Qsb0NBQTRCLEtBQUssS0FBakMsY0FBK0MsS0FBSyxJQUFwRDtBQUNEOztBQUVELFdBQU87QUFDTCxXQUFRLEdBQVIsTUFESztBQUVMLGFBQU87QUFDTCxlQUFPLElBREY7QUFFTCxnQkFBUTtBQUZIO0FBRkYsS0FBUDtBQU9ELEdBbllZOzs7QUFxWWI7QUFDQSxVQXRZYSxvQkFzWUosSUF0WUksRUFzWWU7QUFBQSxRQUFiLEdBQWEsdUVBQVAsS0FBTztBQUFFO0FBQzVCLFFBQU0sTUFBTSxLQUFLLElBQUwsbUNBQTBDLEtBQUssSUFBL0MsU0FBNEQsS0FBSyxHQUFqRSxNQUFaO0FBQ0EsV0FBTztBQUNMLGNBREs7QUFFTCxhQUFPO0FBQ0wsZUFBTyxHQURGO0FBRUwsZ0JBQVE7QUFGSDtBQUZGLEtBQVA7QUFPRCxHQS9ZWTtBQWlaYixTQWpaYSxtQkFpWkwsSUFqWkssRUFpWkM7QUFDWixRQUFNLE1BQU8sS0FBSyxHQUFMLElBQVksS0FBSyxRQUFqQixJQUE2QixLQUFLLElBQW5DLDJCQUFpRSxLQUFLLFFBQXRFLFNBQWtGLEtBQUssSUFBdkYsU0FBK0YsS0FBSyxHQUFwRyxTQUFnSCxLQUFLLEdBQXJILE1BQVo7QUFDQSxXQUFPO0FBQ0wsY0FESztBQUVMLGFBQU87QUFDTCxlQUFPLElBREY7QUFFTCxnQkFBUTtBQUZIO0FBRkYsS0FBUDtBQU9ELEdBMVpZO0FBNFpiLFFBNVphLGtCQTRaTixJQTVaTSxFQTRaQTtBQUNYLFdBQU87QUFDTDtBQURLLEtBQVA7QUFHRDtBQWhhWSxDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHR5cGUsIGNiKSB7Ly8gZXNsaW50LWRpc2FibGUtbGluZVxuICBjb25zdCBpc0dBID0gdHlwZSA9PT0gJ2V2ZW50JyB8fCB0eXBlID09PSAnc29jaWFsJztcbiAgY29uc3QgaXNUYWdNYW5hZ2VyID0gdHlwZSA9PT0gJ3RhZ01hbmFnZXInO1xuXG4gIGlmIChpc0dBKSBjaGVja0lmQW5hbHl0aWNzTG9hZGVkKHR5cGUsIGNiKTtcbiAgaWYgKGlzVGFnTWFuYWdlcikgc2V0VGFnTWFuYWdlcihjYik7XG59O1xuXG5mdW5jdGlvbiBjaGVja0lmQW5hbHl0aWNzTG9hZGVkKHR5cGUsIGNiKSB7XG4gIGlmICh3aW5kb3cuZ2EpIHtcbiAgICBpZiAoY2IpIGNiKCk7XG4gIC8vIGJpbmQgdG8gc2hhcmVkIGV2ZW50IG9uIGVhY2ggaW5kaXZpZHVhbCBub2RlXG4gICAgbGlzdGVuKChlKSA9PiB7XG4gICAgICBjb25zdCBwbGF0Zm9ybSA9IGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlJyk7XG4gICAgICBjb25zdCB0YXJnZXQgPSBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1saW5rJykgfHxcbiAgICAgIGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXVybCcpIHx8XG4gICAgICBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS11c2VybmFtZScpIHx8XG4gICAgICBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jZW50ZXInKSB8fFxuICAgICAgZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtc2VhcmNoJykgfHxcbiAgICAgIGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWJvZHknKTtcblxuICAgICAgaWYgKHR5cGUgPT09ICdldmVudCcpIHtcbiAgICAgICAgZ2EoJ3NlbmQnLCAnZXZlbnQnLCB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW5kZWZcbiAgICAgICAgICBldmVudENhdGVnb3J5OiAnT3BlblNoYXJlIENsaWNrJyxcbiAgICAgICAgICBldmVudEFjdGlvbjogcGxhdGZvcm0sXG4gICAgICAgICAgZXZlbnRMYWJlbDogdGFyZ2V0LFxuICAgICAgICAgIHRyYW5zcG9ydDogJ2JlYWNvbicsXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZSA9PT0gJ3NvY2lhbCcpIHtcbiAgICAgICAgZ2EoJ3NlbmQnLCB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW5kZWZcbiAgICAgICAgICBoaXRUeXBlOiAnc29jaWFsJyxcbiAgICAgICAgICBzb2NpYWxOZXR3b3JrOiBwbGF0Zm9ybSxcbiAgICAgICAgICBzb2NpYWxBY3Rpb246ICdzaGFyZScsXG4gICAgICAgICAgc29jaWFsVGFyZ2V0OiB0YXJnZXQsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgY2hlY2tJZkFuYWx5dGljc0xvYWRlZCh0eXBlLCBjYik7XG4gICAgfSwgMTAwMCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2V0VGFnTWFuYWdlcihjYikge1xuICBpZiAod2luZG93LmRhdGFMYXllciAmJiB3aW5kb3cuZGF0YUxheWVyWzBdWydndG0uc3RhcnQnXSkge1xuICAgIGlmIChjYikgY2IoKTtcblxuICAgIGxpc3RlbihvblNoYXJlVGFnTWFuZ2VyKTtcblxuICAgIGdldENvdW50cygoZSkgPT4ge1xuICAgICAgY29uc3QgY291bnQgPSBlLnRhcmdldCA/XG4gICAgICBlLnRhcmdldC5pbm5lckhUTUwgOlxuICAgICAgZS5pbm5lckhUTUw7XG5cbiAgICAgIGNvbnN0IHBsYXRmb3JtID0gZS50YXJnZXQgP1xuICAgICAgZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY291bnQtdXJsJykgOlxuICAgICAgZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudC11cmwnKTtcblxuICAgICAgd2luZG93LmRhdGFMYXllci5wdXNoKHtcbiAgICAgICAgZXZlbnQ6ICdPcGVuU2hhcmUgQ291bnQnLFxuICAgICAgICBwbGF0Zm9ybSxcbiAgICAgICAgcmVzb3VyY2U6IGNvdW50LFxuICAgICAgICBhY3Rpdml0eTogJ2NvdW50JyxcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgc2V0VGFnTWFuYWdlcihjYik7XG4gICAgfSwgMTAwMCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gbGlzdGVuKGNiKSB7XG4gIC8vIGJpbmQgdG8gc2hhcmVkIGV2ZW50IG9uIGVhY2ggaW5kaXZpZHVhbCBub2RlXG4gIFtdLmZvckVhY2guY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1vcGVuLXNoYXJlXScpLCAobm9kZSkgPT4ge1xuICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcignT3BlblNoYXJlLnNoYXJlZCcsIGNiKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGdldENvdW50cyhjYikge1xuICBjb25zdCBjb3VudE5vZGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1vcGVuLXNoYXJlLWNvdW50XScpO1xuXG4gIFtdLmZvckVhY2guY2FsbChjb3VudE5vZGUsIChub2RlKSA9PiB7XG4gICAgaWYgKG5vZGUudGV4dENvbnRlbnQpIGNiKG5vZGUpO1xuICAgIGVsc2Ugbm9kZS5hZGRFdmVudExpc3RlbmVyKGBPcGVuU2hhcmUuY291bnRlZC0ke25vZGUuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY291bnQtdXJsJyl9YCwgY2IpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gb25TaGFyZVRhZ01hbmdlcihlKSB7XG4gIGNvbnN0IHBsYXRmb3JtID0gZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUnKTtcbiAgY29uc3QgdGFyZ2V0ID0gZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtbGluaycpIHx8XG4gICAgZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdXJsJykgfHxcbiAgICBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS11c2VybmFtZScpIHx8XG4gICAgZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY2VudGVyJykgfHxcbiAgICBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1zZWFyY2gnKSB8fFxuICAgIGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWJvZHknKTtcblxuICB3aW5kb3cuZGF0YUxheWVyLnB1c2goe1xuICAgIGV2ZW50OiAnT3BlblNoYXJlIFNoYXJlJyxcbiAgICBwbGF0Zm9ybSxcbiAgICByZXNvdXJjZTogdGFyZ2V0LFxuICAgIGFjdGl2aXR5OiAnc2hhcmUnLFxuICB9KTtcbn1cbiIsImZ1bmN0aW9uIHJvdW5kKHgsIHByZWNpc2lvbikge1xuICBpZiAodHlwZW9mIHggIT09ICdudW1iZXInKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgdmFsdWUgdG8gYmUgYSBudW1iZXInKTtcbiAgfVxuXG4gIGNvbnN0IGV4cG9uZW50ID0gcHJlY2lzaW9uID4gMCA/ICdlJyA6ICdlLSc7XG4gIGNvbnN0IGV4cG9uZW50TmVnID0gcHJlY2lzaW9uID4gMCA/ICdlLScgOiAnZSc7XG4gIHByZWNpc2lvbiA9IE1hdGguYWJzKHByZWNpc2lvbik7XG5cbiAgcmV0dXJuIE51bWJlcihNYXRoLnJvdW5kKHggKyBleHBvbmVudCArIHByZWNpc2lvbikgKyBleHBvbmVudE5lZyArIHByZWNpc2lvbik7XG59XG5cbmZ1bmN0aW9uIHRob3VzYW5kaWZ5KG51bSkge1xuICByZXR1cm4gYCR7cm91bmQobnVtIC8gMTAwMCwgMSl9S2A7XG59XG5cbmZ1bmN0aW9uIG1pbGxpb25pZnkobnVtKSB7XG4gIHJldHVybiBgJHtyb3VuZChudW0gLyAxMDAwMDAwLCAxKX1NYDtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY291bnRSZWR1Y2UoZWwsIGNvdW50LCBjYikge1xuICBpZiAoY291bnQgPiA5OTk5OTkpIHtcbiAgICBlbC5pbm5lckhUTUwgPSBtaWxsaW9uaWZ5KGNvdW50KTtcbiAgICBpZiAoY2IgJiYgdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSBjYihlbCk7XG4gIH0gZWxzZSBpZiAoY291bnQgPiA5OTkpIHtcbiAgICBlbC5pbm5lckhUTUwgPSB0aG91c2FuZGlmeShjb3VudCk7XG4gICAgaWYgKGNiICYmIHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykgY2IoZWwpO1xuICB9IGVsc2Uge1xuICAgIGVsLmlubmVySFRNTCA9IGNvdW50O1xuICAgIGlmIChjYiAmJiB0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpIGNiKGVsKTtcbiAgfVxufVxuIiwiLy8gdHlwZSBjb250YWlucyBhIGRhc2hcbi8vIHRyYW5zZm9ybSB0byBjYW1lbGNhc2UgZm9yIGZ1bmN0aW9uIHJlZmVyZW5jZVxuLy8gVE9ETzogb25seSBzdXBwb3J0cyBzaW5nbGUgZGFzaCwgc2hvdWxkIHNob3VsZCBzdXBwb3J0IG11bHRpcGxlXG5leHBvcnQgZGVmYXVsdCAoZGFzaCwgdHlwZSkgPT4ge1xuICBjb25zdCBuZXh0Q2hhciA9IHR5cGUuc3Vic3RyKGRhc2ggKyAxLCAxKTtcbiAgY29uc3QgZ3JvdXAgPSB0eXBlLnN1YnN0cihkYXNoLCAyKTtcblxuICB0eXBlID0gdHlwZS5yZXBsYWNlKGdyb3VwLCBuZXh0Q2hhci50b1VwcGVyQ2FzZSgpKTtcbiAgcmV0dXJuIHR5cGU7XG59O1xuIiwiaW1wb3J0IGluaXRpYWxpemVOb2RlcyBmcm9tICcuL2luaXRpYWxpemVOb2Rlcyc7XG5pbXBvcnQgaW5pdGlhbGl6ZVdhdGNoZXIgZnJvbSAnLi9pbml0aWFsaXplV2F0Y2hlcic7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGluaXQob3B0cykge1xuICByZXR1cm4gKCkgPT4ge1xuICAgIGNvbnN0IGluaXROb2RlcyA9IGluaXRpYWxpemVOb2Rlcyh7XG4gICAgICBhcGk6IG9wdHMuYXBpIHx8IG51bGwsXG4gICAgICBjb250YWluZXI6IG9wdHMuY29udGFpbmVyIHx8IGRvY3VtZW50LFxuICAgICAgc2VsZWN0b3I6IG9wdHMuc2VsZWN0b3IsXG4gICAgICBjYjogb3B0cy5jYixcbiAgICB9KTtcblxuICAgIGluaXROb2RlcygpO1xuXG4gICAgLy8gY2hlY2sgZm9yIG11dGF0aW9uIG9ic2VydmVycyBiZWZvcmUgdXNpbmcsIElFMTEgb25seVxuICAgIGlmICh3aW5kb3cuTXV0YXRpb25PYnNlcnZlciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpbml0aWFsaXplV2F0Y2hlcihkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1vcGVuLXNoYXJlLXdhdGNoXScpLCBpbml0Tm9kZXMpO1xuICAgIH1cbiAgfTtcbn1cbiIsImltcG9ydCBDb3VudCBmcm9tICcuLi9zcmMvbW9kdWxlcy9jb3VudCc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGluaXRpYWxpemVDb3VudE5vZGUob3MpIHtcbiAgLy8gaW5pdGlhbGl6ZSBvcGVuIHNoYXJlIG9iamVjdCB3aXRoIHR5cGUgYXR0cmlidXRlXG4gIGNvbnN0IHR5cGUgPSBvcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudCcpO1xuICBjb25zdCB1cmwgPSBvcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jb3VudC1yZXBvJykgfHxcbiAgICAgIG9zLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50LXNob3QnKSB8fFxuICAgICAgb3MuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY291bnQtdXJsJyk7XG4gIGNvbnN0IGNvdW50ID0gbmV3IENvdW50KHR5cGUsIHVybCk7XG5cbiAgY291bnQuY291bnQob3MpO1xuICBvcy5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1ub2RlJywgdHlwZSk7XG59XG4iLCJpbXBvcnQgRXZlbnRzIGZyb20gJy4uL3NyYy9tb2R1bGVzL2V2ZW50cyc7XG5pbXBvcnQgYW5hbHl0aWNzIGZyb20gJy4uL2FuYWx5dGljcyc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGluaXRpYWxpemVOb2RlcyhvcHRzKSB7XG4gIC8vIGxvb3AgdGhyb3VnaCBvcGVuIHNoYXJlIG5vZGUgY29sbGVjdGlvblxuICByZXR1cm4gKCkgPT4ge1xuICAgIC8vIGNoZWNrIGZvciBhbmFseXRpY3NcbiAgICBjaGVja0FuYWx5dGljcygpO1xuXG4gICAgaWYgKG9wdHMuYXBpKSB7XG4gICAgICBjb25zdCBub2RlcyA9IG9wdHMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwob3B0cy5zZWxlY3Rvcik7XG4gICAgICBbXS5mb3JFYWNoLmNhbGwobm9kZXMsIG9wdHMuY2IpO1xuXG4gICAgICAvLyB0cmlnZ2VyIGNvbXBsZXRlZCBldmVudFxuICAgICAgRXZlbnRzLnRyaWdnZXIoZG9jdW1lbnQsIGAke29wdHMuYXBpfS1sb2FkZWRgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gbG9vcCB0aHJvdWdoIG9wZW4gc2hhcmUgbm9kZSBjb2xsZWN0aW9uXG4gICAgICBjb25zdCBzaGFyZU5vZGVzID0gb3B0cy5jb250YWluZXIucXVlcnlTZWxlY3RvckFsbChvcHRzLnNlbGVjdG9yLnNoYXJlKTtcbiAgICAgIFtdLmZvckVhY2guY2FsbChzaGFyZU5vZGVzLCBvcHRzLmNiLnNoYXJlKTtcblxuICAgICAgLy8gdHJpZ2dlciBjb21wbGV0ZWQgZXZlbnRcbiAgICAgIEV2ZW50cy50cmlnZ2VyKGRvY3VtZW50LCAnc2hhcmUtbG9hZGVkJyk7XG5cbiAgICAgIC8vIGxvb3AgdGhyb3VnaCBjb3VudCBub2RlIGNvbGxlY3Rpb25cbiAgICAgIGNvbnN0IGNvdW50Tm9kZXMgPSBvcHRzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKG9wdHMuc2VsZWN0b3IuY291bnQpO1xuICAgICAgW10uZm9yRWFjaC5jYWxsKGNvdW50Tm9kZXMsIG9wdHMuY2IuY291bnQpO1xuXG4gICAgICAvLyB0cmlnZ2VyIGNvbXBsZXRlZCBldmVudFxuICAgICAgRXZlbnRzLnRyaWdnZXIoZG9jdW1lbnQsICdjb3VudC1sb2FkZWQnKTtcbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIGNoZWNrQW5hbHl0aWNzKCkge1xuICAvLyBjaGVjayBmb3IgYW5hbHl0aWNzXG4gIGlmIChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbZGF0YS1vcGVuLXNoYXJlLWFuYWx5dGljc10nKSkge1xuICAgIGNvbnN0IHByb3ZpZGVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignW2RhdGEtb3Blbi1zaGFyZS1hbmFseXRpY3NdJylcbiAgICAgIC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1hbmFseXRpY3MnKTtcblxuICAgIGlmIChwcm92aWRlci5pbmRleE9mKCcsJykgPiAtMSkge1xuICAgICAgY29uc3QgcHJvdmlkZXJzID0gcHJvdmlkZXIuc3BsaXQoJywnKTtcbiAgICAgIHByb3ZpZGVycy5mb3JFYWNoKHAgPT4gYW5hbHl0aWNzKHApKTtcbiAgICB9IGVsc2UgYW5hbHl0aWNzKHByb3ZpZGVyKTtcbiAgfVxufVxuIiwiaW1wb3J0IFNoYXJlVHJhbnNmb3JtcyBmcm9tICcuLi9zcmMvbW9kdWxlcy9zaGFyZS10cmFuc2Zvcm1zJztcbmltcG9ydCBPcGVuU2hhcmUgZnJvbSAnLi4vc3JjL21vZHVsZXMvb3Blbi1zaGFyZSc7XG5pbXBvcnQgc2V0RGF0YSBmcm9tICcuL3NldERhdGEnO1xuaW1wb3J0IHNoYXJlIGZyb20gJy4vc2hhcmUnO1xuaW1wb3J0IGRhc2hUb0NhbWVsIGZyb20gJy4vZGFzaFRvQ2FtZWwnO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBpbml0aWFsaXplU2hhcmVOb2RlKG9zKSB7XG4gIC8vIGluaXRpYWxpemUgb3BlbiBzaGFyZSBvYmplY3Qgd2l0aCB0eXBlIGF0dHJpYnV0ZVxuICBsZXQgdHlwZSA9IG9zLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlJyk7XG4gIGNvbnN0IGRhc2ggPSB0eXBlLmluZGV4T2YoJy0nKTtcblxuICBpZiAoZGFzaCA+IC0xKSB7XG4gICAgdHlwZSA9IGRhc2hUb0NhbWVsKGRhc2gsIHR5cGUpO1xuICB9XG5cbiAgY29uc3QgdHJhbnNmb3JtID0gU2hhcmVUcmFuc2Zvcm1zW3R5cGVdO1xuXG4gIGlmICghdHJhbnNmb3JtKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBPcGVuIFNoYXJlOiAke3R5cGV9IGlzIGFuIGludmFsaWQgdHlwZWApO1xuICB9XG5cbiAgY29uc3Qgb3BlblNoYXJlID0gbmV3IE9wZW5TaGFyZSh0eXBlLCB0cmFuc2Zvcm0pO1xuXG4gIC8vIHNwZWNpZnkgaWYgdGhpcyBpcyBhIGR5bmFtaWMgaW5zdGFuY2VcbiAgaWYgKG9zLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWR5bmFtaWMnKSkge1xuICAgIG9wZW5TaGFyZS5keW5hbWljID0gdHJ1ZTtcbiAgfVxuXG4gIC8vIHNwZWNpZnkgaWYgdGhpcyBpcyBhIHBvcHVwIGluc3RhbmNlXG4gIGlmIChvcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1wb3B1cCcpKSB7XG4gICAgb3BlblNoYXJlLnBvcHVwID0gdHJ1ZTtcbiAgfVxuXG4gIC8vIHNldCBhbGwgb3B0aW9uYWwgYXR0cmlidXRlcyBvbiBvcGVuIHNoYXJlIGluc3RhbmNlXG4gIHNldERhdGEob3BlblNoYXJlLCBvcyk7XG5cbiAgLy8gb3BlbiBzaGFyZSBkaWFsb2cgb24gY2xpY2tcbiAgb3MuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgIHNoYXJlKGUsIG9zLCBvcGVuU2hhcmUpO1xuICB9KTtcblxuICBvcy5hZGRFdmVudExpc3RlbmVyKCdPcGVuU2hhcmUudHJpZ2dlcicsIChlKSA9PiB7XG4gICAgc2hhcmUoZSwgb3MsIG9wZW5TaGFyZSk7XG4gIH0pO1xuXG4gIG9zLnNldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLW5vZGUnLCB0eXBlKTtcbn1cbiIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGluaXRpYWxpemVXYXRjaGVyKHdhdGNoZXIsIGZuKSB7XG4gIFtdLmZvckVhY2guY2FsbCh3YXRjaGVyLCAodykgPT4ge1xuICAgIGNvbnN0IG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoKG11dGF0aW9ucykgPT4ge1xuICAgICAgLy8gdGFyZ2V0IHdpbGwgbWF0Y2ggYmV0d2VlbiBhbGwgbXV0YXRpb25zIHNvIGp1c3QgdXNlIGZpcnN0XG4gICAgICBmbihtdXRhdGlvbnNbMF0udGFyZ2V0KTtcbiAgICB9KTtcblxuICAgIG9ic2VydmVyLm9ic2VydmUodywge1xuICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgIH0pO1xuICB9KTtcbn1cbiIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHNldERhdGEob3NJbnN0YW5jZSwgb3NFbGVtZW50KSB7XG4gIG9zSW5zdGFuY2Uuc2V0RGF0YSh7XG4gICAgdXJsOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdXJsJyksXG4gICAgdGV4dDogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXRleHQnKSxcbiAgICB2aWE6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS12aWEnKSxcbiAgICBoYXNodGFnczogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWhhc2h0YWdzJyksXG4gICAgdHdlZXRJZDogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXR3ZWV0LWlkJyksXG4gICAgcmVsYXRlZDogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXJlbGF0ZWQnKSxcbiAgICBzY3JlZW5OYW1lOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtc2NyZWVuLW5hbWUnKSxcbiAgICB1c2VySWQ6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS11c2VyLWlkJyksXG4gICAgbGluazogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWxpbmsnKSxcbiAgICBwaWN0dXJlOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtcGljdHVyZScpLFxuICAgIGNhcHRpb246IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jYXB0aW9uJyksXG4gICAgZGVzY3JpcHRpb246IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1kZXNjcmlwdGlvbicpLFxuICAgIHVzZXI6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS11c2VyJyksXG4gICAgdmlkZW86IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS12aWRlbycpLFxuICAgIHVzZXJuYW1lOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdXNlcm5hbWUnKSxcbiAgICB0aXRsZTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXRpdGxlJyksXG4gICAgbWVkaWE6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1tZWRpYScpLFxuICAgIHRvOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtdG8nKSxcbiAgICBzdWJqZWN0OiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtc3ViamVjdCcpLFxuICAgIGJvZHk6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1ib2R5JyksXG4gICAgaW9zOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtaW9zJyksXG4gICAgdHlwZTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXR5cGUnKSxcbiAgICBjZW50ZXI6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1jZW50ZXInKSxcbiAgICB2aWV3czogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXZpZXdzJyksXG4gICAgem9vbTogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXpvb20nKSxcbiAgICBzZWFyY2g6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1zZWFyY2gnKSxcbiAgICBzYWRkcjogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXNhZGRyJyksXG4gICAgZGFkZHI6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1kYWRkcicpLFxuICAgIGRpcmVjdGlvbnNtb2RlOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtZGlyZWN0aW9ucy1tb2RlJyksXG4gICAgcmVwbzogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXJlcG8nKSxcbiAgICBzaG90OiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtc2hvdCcpLFxuICAgIHBlbjogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXBlbicpLFxuICAgIHZpZXc6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS12aWV3JyksXG4gICAgaXNzdWU6IG9zRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1pc3N1ZScpLFxuICAgIGJ1dHRvbklkOiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtYnV0dG9uSWQnKSxcbiAgICBwb3BVcDogb3NFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLXBvcHVwJyksXG4gICAga2V5OiBvc0VsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUta2V5JyksXG4gIH0pO1xufVxuIiwiaW1wb3J0IEV2ZW50cyBmcm9tICcuLi9zcmMvbW9kdWxlcy9ldmVudHMnO1xuaW1wb3J0IHNldERhdGEgZnJvbSAnLi9zZXREYXRhJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gc2hhcmUoZSwgb3MsIG9wZW5TaGFyZSkge1xuICAvLyBpZiBkeW5hbWljIGluc3RhbmNlIHRoZW4gZmV0Y2ggYXR0cmlidXRlcyBhZ2FpbiBpbiBjYXNlIG9mIHVwZGF0ZXNcbiAgaWYgKG9wZW5TaGFyZS5keW5hbWljKSB7XG4gICAgc2V0RGF0YShvcGVuU2hhcmUsIG9zKTtcbiAgfVxuXG4gIG9wZW5TaGFyZS5zaGFyZShlKTtcblxuICAvLyB0cmlnZ2VyIHNoYXJlZCBldmVudFxuICBFdmVudHMudHJpZ2dlcihvcywgJ3NoYXJlZCcpO1xufVxuIiwiLypcbiAgIFNvbWV0aW1lcyBzb2NpYWwgcGxhdGZvcm1zIGdldCBjb25mdXNlZCBhbmQgZHJvcCBzaGFyZSBjb3VudHMuXG4gICBJbiB0aGlzIG1vZHVsZSB3ZSBjaGVjayBpZiB0aGUgcmV0dXJuZWQgY291bnQgaXMgbGVzcyB0aGFuIHRoZSBjb3VudCBpblxuICAgbG9jYWxzdG9yYWdlLlxuICAgSWYgdGhlIGxvY2FsIGNvdW50IGlzIGdyZWF0ZXIgdGhhbiB0aGUgcmV0dXJuZWQgY291bnQsXG4gICB3ZSBzdG9yZSB0aGUgbG9jYWwgY291bnQgKyB0aGUgcmV0dXJuZWQgY291bnQuXG4gICBPdGhlcndpc2UsIHN0b3JlIHRoZSByZXR1cm5lZCBjb3VudC5cbiovXG5cbmV4cG9ydCBkZWZhdWx0ICh0LCBjb3VudCkgPT4ge1xuICBjb25zdCBpc0FyciA9IHQudHlwZS5pbmRleE9mKCcsJykgPiAtMTtcbiAgY29uc3QgbG9jYWwgPSBOdW1iZXIodC5zdG9yZUdldChgJHt0LnR5cGV9LSR7dC5zaGFyZWR9YCkpO1xuXG4gIGlmIChsb2NhbCA+IGNvdW50ICYmICFpc0Fycikge1xuICAgIGNvbnN0IGxhdGVzdENvdW50ID0gTnVtYmVyKHQuc3RvcmVHZXQoYCR7dC50eXBlfS0ke3Quc2hhcmVkfS1sYXRlc3RDb3VudGApKTtcbiAgICB0LnN0b3JlU2V0KGAke3QudHlwZX0tJHt0LnNoYXJlZH0tbGF0ZXN0Q291bnRgLCBjb3VudCk7XG5cbiAgICBjb3VudCA9IGlzTnVtZXJpYyhsYXRlc3RDb3VudCkgJiYgbGF0ZXN0Q291bnQgPiAwID9cbiAgICAgIGNvdW50ICs9IGxvY2FsIC0gbGF0ZXN0Q291bnQgOlxuICAgICAgY291bnQgKz0gbG9jYWw7XG4gIH1cblxuICBpZiAoIWlzQXJyKSB0LnN0b3JlU2V0KGAke3QudHlwZX0tJHt0LnNoYXJlZH1gLCBjb3VudCk7XG4gIHJldHVybiBjb3VudDtcbn07XG5cbmZ1bmN0aW9uIGlzTnVtZXJpYyhuKSB7XG4gIHJldHVybiAhaXNOYU4ocGFyc2VGbG9hdChuKSkgJiYgaXNGaW5pdGUobik7XG59XG4iLCJpbXBvcnQgRGF0YUF0dHIgZnJvbSAnLi9tb2R1bGVzL2RhdGEtYXR0cic7XG5pbXBvcnQgU2hhcmVBUEkgZnJvbSAnLi9tb2R1bGVzL3NoYXJlLWFwaSc7XG5pbXBvcnQgRXZlbnRzIGZyb20gJy4vbW9kdWxlcy9ldmVudHMnO1xuaW1wb3J0IE9wZW5TaGFyZSBmcm9tICcuL21vZHVsZXMvb3Blbi1zaGFyZSc7XG5pbXBvcnQgU2hhcmVUcmFuc2Zvcm1zIGZyb20gJy4vbW9kdWxlcy9zaGFyZS10cmFuc2Zvcm1zJztcbmltcG9ydCBDb3VudCBmcm9tICcuL21vZHVsZXMvY291bnQnO1xuaW1wb3J0IENvdW50QVBJIGZyb20gJy4vbW9kdWxlcy9jb3VudC1hcGknO1xuaW1wb3J0IGFuYWx5dGljc0FQSSBmcm9tICcuLi9hbmFseXRpY3MnO1xuXG5jb25zdCBicm93c2VyID0gKCkgPT4ge1xuICBEYXRhQXR0cihPcGVuU2hhcmUsIENvdW50LCBTaGFyZVRyYW5zZm9ybXMsIEV2ZW50cyk7XG4gIHdpbmRvdy5PcGVuU2hhcmUgPSB7XG4gICAgc2hhcmU6IFNoYXJlQVBJKE9wZW5TaGFyZSwgU2hhcmVUcmFuc2Zvcm1zLCBFdmVudHMpLFxuICAgIGNvdW50OiBDb3VudEFQSSgpLFxuICAgIGFuYWx5dGljczogYW5hbHl0aWNzQVBJLFxuICB9O1xufTtcbmV4cG9ydCBkZWZhdWx0IGJyb3dzZXIoKTtcbiIsIi8qKlxuICogY291bnQgQVBJXG4gKi9cblxuaW1wb3J0IGNvdW50IGZyb20gJy4vY291bnQnO1xuXG5leHBvcnQgZGVmYXVsdCAoKSA9PiB7IC8vZXNsaW50LWRpc2FibGUtbGluZVxuICAvLyBnbG9iYWwgT3BlblNoYXJlIHJlZmVyZW5jaW5nIGludGVybmFsIGNsYXNzIGZvciBpbnN0YW5jZSBnZW5lcmF0aW9uXG4gIGNsYXNzIENvdW50IHtcblxuICAgIGNvbnN0cnVjdG9yKHtcbiAgICAgIHR5cGUsXG4gICAgICB1cmwsXG4gICAgICBhcHBlbmRUbyA9IGZhbHNlLFxuICAgICAgZWxlbWVudCxcbiAgICAgIGNsYXNzZXMsXG4gICAgICBrZXkgPSBudWxsLFxuICAgIH0sIGNiKSB7XG4gICAgICBjb25zdCBjb3VudE5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGVsZW1lbnQgfHwgJ3NwYW4nKTtcblxuICAgICAgY291bnROb2RlLnNldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50JywgdHlwZSk7XG4gICAgICBjb3VudE5vZGUuc2V0QXR0cmlidXRlKCdkYXRhLW9wZW4tc2hhcmUtY291bnQtdXJsJywgdXJsKTtcbiAgICAgIGlmIChrZXkpIGNvdW50Tm9kZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1rZXknLCBrZXkpO1xuXG4gICAgICBjb3VudE5vZGUuY2xhc3NMaXN0LmFkZCgnb3Blbi1zaGFyZS1jb3VudCcpO1xuXG4gICAgICBpZiAoY2xhc3NlcyAmJiBBcnJheS5pc0FycmF5KGNsYXNzZXMpKSB7XG4gICAgICAgIGNsYXNzZXMuZm9yRWFjaCgoY3NzQ0xhc3MpID0+IHtcbiAgICAgICAgICBjb3VudE5vZGUuY2xhc3NMaXN0LmFkZChjc3NDTGFzcyk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoYXBwZW5kVG8pIHtcbiAgICAgICAgcmV0dXJuIG5ldyBjb3VudCh0eXBlLCB1cmwpLmNvdW50KGNvdW50Tm9kZSwgY2IsIGFwcGVuZFRvKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ldyBjb3VudCh0eXBlLCB1cmwpLmNvdW50KGNvdW50Tm9kZSwgY2IpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBDb3VudDtcbn07XG4iLCJpbXBvcnQgY291bnRSZWR1Y2UgZnJvbSAnLi4vLi4vbGliL2NvdW50UmVkdWNlJztcbmltcG9ydCBzdG9yZUNvdW50IGZyb20gJy4uLy4uL2xpYi9zdG9yZUNvdW50Jztcbi8qKlxuICogT2JqZWN0IG9mIHRyYW5zZm9ybSBmdW5jdGlvbnMgZm9yIGVhY2ggb3BlbnNoYXJlIGFwaVxuICogVHJhbnNmb3JtIGZ1bmN0aW9ucyBwYXNzZWQgaW50byBPcGVuU2hhcmUgaW5zdGFuY2Ugd2hlbiBpbnN0YW50aWF0ZWRcbiAqIFJldHVybiBvYmplY3QgY29udGFpbmluZyBVUkwgYW5kIGtleS92YWx1ZSBhcmdzXG4gKi9cbmV4cG9ydCBkZWZhdWx0IHtcblxuICAvLyBmYWNlYm9vayBjb3VudCBkYXRhXG4gIGZhY2Vib29rKHVybCkge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiAnZ2V0JyxcbiAgICAgIHVybDogYGh0dHBzOi8vZ3JhcGguZmFjZWJvb2suY29tLz9pZD0ke3VybH1gLFxuICAgICAgdHJhbnNmb3JtKHhocikge1xuICAgICAgICBjb25zdCBmYiA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCk7XG5cbiAgICAgICAgY29uc3QgY291bnQgPSBmYi5zaGFyZSAmJiBmYi5zaGFyZS5zaGFyZV9jb3VudCB8fCAwO1xuXG4gICAgICAgIHJldHVybiBzdG9yZUNvdW50KHRoaXMsIGNvdW50KTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuLy8gcGludGVyZXN0IGNvdW50IGRhdGFcbiAgcGludGVyZXN0KHVybCkge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiAnanNvbnAnLFxuICAgICAgdXJsOiBgaHR0cHM6Ly9hcGkucGludGVyZXN0LmNvbS92MS91cmxzL2NvdW50Lmpzb24/Y2FsbGJhY2s9PyZ1cmw9JHt1cmx9YCxcbiAgICAgIHRyYW5zZm9ybShkYXRhKSB7XG4gICAgICAgIGNvbnN0IGNvdW50ID0gZGF0YS5jb3VudDtcbiAgICAgICAgcmV0dXJuIHN0b3JlQ291bnQodGhpcywgY291bnQpO1xuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIGxpbmtlZGluIGNvdW50IGRhdGFcbiAgbGlua2VkaW4odXJsKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6ICdqc29ucCcsXG4gICAgICB1cmw6IGBodHRwczovL3d3dy5saW5rZWRpbi5jb20vY291bnRzZXJ2L2NvdW50L3NoYXJlP3VybD0ke3VybH0mZm9ybWF0PWpzb25wJmNhbGxiYWNrPT9gLFxuICAgICAgdHJhbnNmb3JtKGRhdGEpIHtcbiAgICAgICAgY29uc3QgY291bnQgPSBkYXRhLmNvdW50O1xuICAgICAgICByZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBjb3VudCk7XG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgLy8gcmVkZGl0IGNvdW50IGRhdGFcbiAgcmVkZGl0KHVybCkge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiAnZ2V0JyxcbiAgICAgIHVybDogYGh0dHBzOi8vd3d3LnJlZGRpdC5jb20vYXBpL2luZm8uanNvbj91cmw9JHt1cmx9YCxcbiAgICAgIHRyYW5zZm9ybSh4aHIpIHtcbiAgICAgICAgY29uc3QgcG9zdHMgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpLmRhdGEuY2hpbGRyZW47XG4gICAgICAgIGxldCB1cHMgPSAwO1xuXG4gICAgICAgIHBvc3RzLmZvckVhY2goKHBvc3QpID0+IHtcbiAgICAgICAgICB1cHMgKz0gTnVtYmVyKHBvc3QuZGF0YS51cHMpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gc3RvcmVDb3VudCh0aGlzLCB1cHMpO1xuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4vLyBnb29nbGUgY291bnQgZGF0YVxuICBnb29nbGUodXJsKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6ICdwb3N0JyxcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgbWV0aG9kOiAncG9zLnBsdXNvbmVzLmdldCcsXG4gICAgICAgIGlkOiAncCcsXG4gICAgICAgIHBhcmFtczoge1xuICAgICAgICAgIG5vbG9nOiB0cnVlLFxuICAgICAgICAgIGlkOiB1cmwsXG4gICAgICAgICAgc291cmNlOiAnd2lkZ2V0JyxcbiAgICAgICAgICB1c2VySWQ6ICdAdmlld2VyJyxcbiAgICAgICAgICBncm91cElkOiAnQHNlbGYnLFxuICAgICAgICB9LFxuICAgICAgICBqc29ucnBjOiAnMi4wJyxcbiAgICAgICAga2V5OiAncCcsXG4gICAgICAgIGFwaVZlcnNpb246ICd2MScsXG4gICAgICB9LFxuICAgICAgdXJsOiAnaHR0cHM6Ly9jbGllbnRzNi5nb29nbGUuY29tL3JwYycsXG4gICAgICB0cmFuc2Zvcm0oeGhyKSB7XG4gICAgICAgIGNvbnN0IGNvdW50ID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KS5yZXN1bHQubWV0YWRhdGEuZ2xvYmFsQ291bnRzLmNvdW50O1xuICAgICAgICByZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBjb3VudCk7XG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgLy8gZ2l0aHViIHN0YXIgY291bnRcbiAgZ2l0aHViU3RhcnMocmVwbykge1xuICAgIHJlcG8gPSByZXBvLmluZGV4T2YoJ2dpdGh1Yi5jb20vJykgPiAtMSA/XG4gICAgcmVwby5zcGxpdCgnZ2l0aHViLmNvbS8nKVsxXSA6XG4gICAgcmVwbztcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ2dldCcsXG4gICAgICB1cmw6IGBodHRwczovL2FwaS5naXRodWIuY29tL3JlcG9zLyR7cmVwb31gLFxuICAgICAgdHJhbnNmb3JtKHhocikge1xuICAgICAgICBjb25zdCBjb3VudCA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCkuc3RhcmdhemVyc19jb3VudDtcbiAgICAgICAgcmV0dXJuIHN0b3JlQ291bnQodGhpcywgY291bnQpO1xuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIGdpdGh1YiBmb3JrcyBjb3VudFxuICBnaXRodWJGb3JrcyhyZXBvKSB7XG4gICAgcmVwbyA9IHJlcG8uaW5kZXhPZignZ2l0aHViLmNvbS8nKSA+IC0xID9cbiAgICByZXBvLnNwbGl0KCdnaXRodWIuY29tLycpWzFdIDpcbiAgICByZXBvO1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiAnZ2V0JyxcbiAgICAgIHVybDogYGh0dHBzOi8vYXBpLmdpdGh1Yi5jb20vcmVwb3MvJHtyZXBvfWAsXG4gICAgICB0cmFuc2Zvcm0oeGhyKSB7XG4gICAgICAgIGNvbnN0IGNvdW50ID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KS5mb3Jrc19jb3VudDtcbiAgICAgICAgcmV0dXJuIHN0b3JlQ291bnQodGhpcywgY291bnQpO1xuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIGdpdGh1YiB3YXRjaGVycyBjb3VudFxuICBnaXRodWJXYXRjaGVycyhyZXBvKSB7XG4gICAgcmVwbyA9IHJlcG8uaW5kZXhPZignZ2l0aHViLmNvbS8nKSA+IC0xID9cbiAgICByZXBvLnNwbGl0KCdnaXRodWIuY29tLycpWzFdIDpcbiAgICByZXBvO1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiAnZ2V0JyxcbiAgICAgIHVybDogYGh0dHBzOi8vYXBpLmdpdGh1Yi5jb20vcmVwb3MvJHtyZXBvfWAsXG4gICAgICB0cmFuc2Zvcm0oeGhyKSB7XG4gICAgICAgIGNvbnN0IGNvdW50ID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KS53YXRjaGVyc19jb3VudDtcbiAgICAgICAgcmV0dXJuIHN0b3JlQ291bnQodGhpcywgY291bnQpO1xuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIGRyaWJiYmxlIGxpa2VzIGNvdW50XG4gIGRyaWJiYmxlKHNob3QpIHtcbiAgICBzaG90ID0gc2hvdC5pbmRleE9mKCdkcmliYmJsZS5jb20vc2hvdHMnKSA+IC0xID9cbiAgICBzaG90LnNwbGl0KCdzaG90cy8nKVsxXSA6XG4gICAgc2hvdDtcbiAgICBjb25zdCB1cmwgPSBgaHR0cHM6Ly9hcGkuZHJpYmJibGUuY29tL3YxL3Nob3RzLyR7c2hvdH0vbGlrZXNgO1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiAnZ2V0JyxcbiAgICAgIHVybCxcbiAgICAgIHRyYW5zZm9ybSh4aHIsIEV2ZW50cykge1xuICAgICAgICBjb25zdCBjb3VudCA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCkubGVuZ3RoO1xuXG4gICAgICAgIC8vIGF0IHRoaXMgdGltZSBkcmliYmJsZSBsaW1pdHMgYSByZXNwb25zZSBvZiAxMiBsaWtlcyBwZXIgcGFnZVxuICAgICAgICBpZiAoY291bnQgPT09IDEyKSB7XG4gICAgICAgICAgY29uc3QgcGFnZSA9IDI7XG4gICAgICAgICAgcmVjdXJzaXZlQ291bnQodXJsLCBwYWdlLCBjb3VudCwgKGZpbmFsQ291bnQpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLmFwcGVuZFRvICYmIHR5cGVvZiB0aGlzLmFwcGVuZFRvICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgIHRoaXMuYXBwZW5kVG8uYXBwZW5kQ2hpbGQodGhpcy5vcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb3VudFJlZHVjZSh0aGlzLm9zLCBmaW5hbENvdW50LCB0aGlzLmNiKTtcbiAgICAgICAgICAgIEV2ZW50cy50cmlnZ2VyKHRoaXMub3MsIGBjb3VudGVkLSR7dGhpcy51cmx9YCk7XG4gICAgICAgICAgICByZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBmaW5hbENvdW50KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gc3RvcmVDb3VudCh0aGlzLCBjb3VudCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICB0d2l0dGVyKHVybCkge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiAnZ2V0JyxcbiAgICAgIHVybDogYGh0dHBzOi8vYXBpLm9wZW5zaGFyZS5zb2NpYWwvam9iP3VybD0ke3VybH0ma2V5PWAsXG4gICAgICB0cmFuc2Zvcm0oeGhyKSB7XG4gICAgICAgIGNvbnN0IGNvdW50ID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KS5jb3VudDtcbiAgICAgICAgcmV0dXJuIHN0b3JlQ291bnQodGhpcywgY291bnQpO1xuICAgICAgfSxcbiAgICB9O1xuICB9LFxufTtcblxuZnVuY3Rpb24gcmVjdXJzaXZlQ291bnQodXJsLCBwYWdlLCBjb3VudCwgY2IpIHtcbiAgY29uc3QgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gIHhoci5vcGVuKCdHRVQnLCBgJHt1cmx9P3BhZ2U9JHtwYWdlfWApO1xuICB4aHIuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHsgLy9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgY29uc3QgbGlrZXMgPSBKU09OLnBhcnNlKHRoaXMucmVzcG9uc2UpO1xuICAgIGNvdW50ICs9IGxpa2VzLmxlbmd0aDtcblxuICAgIC8vIGRyaWJiYmxlIGxpa2UgcGVyIHBhZ2UgaXMgMTJcbiAgICBpZiAobGlrZXMubGVuZ3RoID09PSAxMikge1xuICAgICAgcGFnZSsrO1xuICAgICAgcmVjdXJzaXZlQ291bnQodXJsLCBwYWdlLCBjb3VudCwgY2IpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjYihjb3VudCk7XG4gICAgfVxuICB9KTtcbiAgeGhyLnNlbmQoKTtcbn1cbiIsIi8qKlxuICogR2VuZXJhdGUgc2hhcmUgY291bnQgaW5zdGFuY2UgZnJvbSBvbmUgdG8gbWFueSBuZXR3b3Jrc1xuICovXG5cbmltcG9ydCBDb3VudFRyYW5zZm9ybXMgZnJvbSAnLi9jb3VudC10cmFuc2Zvcm1zJztcbmltcG9ydCBFdmVudHMgZnJvbSAnLi9ldmVudHMnO1xuaW1wb3J0IGNvdW50UmVkdWNlIGZyb20gJy4uLy4uL2xpYi9jb3VudFJlZHVjZSc7XG5pbXBvcnQgc3RvcmVDb3VudCBmcm9tICcuLi8uLi9saWIvc3RvcmVDb3VudCc7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcblxuZnVuY3Rpb24gaXNOdW1lcmljKG4pIHtcbiAgcmV0dXJuICFpc05hTihwYXJzZUZsb2F0KG4pKSAmJiBpc0Zpbml0ZShuKTtcbn1cblxuY2xhc3MgQ291bnQge1xuICBjb25zdHJ1Y3Rvcih0eXBlLCB1cmwpIHtcbiAgICAvLyB0aHJvdyBlcnJvciBpZiBubyB1cmwgcHJvdmlkZWRcbiAgICBpZiAoIXVybCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdPcGVuIFNoYXJlOiBubyB1cmwgcHJvdmlkZWQgZm9yIGNvdW50Jyk7XG4gICAgfVxuXG4gICAgLy8gY2hlY2sgZm9yIEdpdGh1YiBjb3VudHNcbiAgICBpZiAodHlwZS5pbmRleE9mKCdnaXRodWInKSA9PT0gMCkge1xuICAgICAgaWYgKHR5cGUgPT09ICdnaXRodWItc3RhcnMnKSB7XG4gICAgICAgIHR5cGUgPSAnZ2l0aHViU3RhcnMnO1xuICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAnZ2l0aHViLWZvcmtzJykge1xuICAgICAgICB0eXBlID0gJ2dpdGh1YkZvcmtzJztcbiAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ2dpdGh1Yi13YXRjaGVycycpIHtcbiAgICAgICAgdHlwZSA9ICdnaXRodWJXYXRjaGVycyc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdJbnZhbGlkIEdpdGh1YiBjb3VudCB0eXBlLiBUcnkgZ2l0aHViLXN0YXJzLCBnaXRodWItZm9ya3MsIG9yIGdpdGh1Yi13YXRjaGVycy4nKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBpZiB0eXBlIGlzIGNvbW1hIHNlcGFyYXRlIGxpc3QgY3JlYXRlIGFycmF5XG4gICAgaWYgKHR5cGUuaW5kZXhPZignLCcpID4gLTEpIHtcbiAgICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgICB0aGlzLnR5cGVBcnIgPSB0aGlzLnR5cGUuc3BsaXQoJywnKTtcbiAgICAgIHRoaXMuY291bnREYXRhID0gW107XG5cbiAgICAgIC8vIGNoZWNrIGVhY2ggdHlwZSBzdXBwbGllZCBpcyB2YWxpZFxuICAgICAgdGhpcy50eXBlQXJyLmZvckVhY2goKHQpID0+IHtcbiAgICAgICAgaWYgKCFDb3VudFRyYW5zZm9ybXNbdF0pIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE9wZW4gU2hhcmU6ICR7dHlwZX0gaXMgYW4gaW52YWxpZCBjb3VudCB0eXBlYCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvdW50RGF0YS5wdXNoKENvdW50VHJhbnNmb3Jtc1t0XSh1cmwpKTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyB0aHJvdyBlcnJvciBpZiBpbnZhbGlkIHR5cGUgcHJvdmlkZWRcbiAgICB9IGVsc2UgaWYgKCFDb3VudFRyYW5zZm9ybXNbdHlwZV0pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgT3BlbiBTaGFyZTogJHt0eXBlfSBpcyBhbiBpbnZhbGlkIGNvdW50IHR5cGVgKTtcblxuICAgICAgICAvLyBzaW5nbGUgY291bnRcbiAgICAgICAgLy8gc3RvcmUgY291bnQgVVJMIGFuZCB0cmFuc2Zvcm0gZnVuY3Rpb25cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICAgIHRoaXMuY291bnREYXRhID0gQ291bnRUcmFuc2Zvcm1zW3R5cGVdKHVybCk7XG4gICAgfVxuICB9XG5cbiAgLy8gaGFuZGxlIGNhbGxpbmcgZ2V0Q291bnQgLyBnZXRDb3VudHNcbiAgLy8gZGVwZW5kaW5nIG9uIG51bWJlciBvZiB0eXBlc1xuICBjb3VudChvcywgY2IsIGFwcGVuZFRvKSB7XG4gICAgdGhpcy5vcyA9IG9zO1xuICAgIHRoaXMuYXBwZW5kVG8gPSBhcHBlbmRUbztcbiAgICB0aGlzLmNiID0gY2I7XG4gICAgdGhpcy51cmwgPSB0aGlzLm9zLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50Jyk7XG4gICAgdGhpcy5zaGFyZWQgPSB0aGlzLm9zLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLWNvdW50LXVybCcpO1xuICAgIHRoaXMua2V5ID0gdGhpcy5vcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3Blbi1zaGFyZS1rZXknKTtcblxuICAgIGlmICghQXJyYXkuaXNBcnJheSh0aGlzLmNvdW50RGF0YSkpIHtcbiAgICAgIHRoaXMuZ2V0Q291bnQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5nZXRDb3VudHMoKTtcbiAgICB9XG4gIH1cblxuICAvLyBmZXRjaCBjb3VudCBlaXRoZXIgQUpBWCBvciBKU09OUFxuICBnZXRDb3VudCgpIHtcbiAgICBjb25zdCBjb3VudCA9IHRoaXMuc3RvcmVHZXQoYCR7dGhpcy50eXBlfS0ke3RoaXMuc2hhcmVkfWApO1xuXG4gICAgaWYgKGNvdW50KSB7XG4gICAgICBpZiAodGhpcy5hcHBlbmRUbyAmJiB0eXBlb2YgdGhpcy5hcHBlbmRUbyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzLmFwcGVuZFRvLmFwcGVuZENoaWxkKHRoaXMub3MpO1xuICAgICAgfVxuICAgICAgY291bnRSZWR1Y2UodGhpcy5vcywgY291bnQpO1xuICAgIH1cbiAgICB0aGlzW3RoaXMuY291bnREYXRhLnR5cGVdKHRoaXMuY291bnREYXRhKTtcbiAgfVxuXG4gIC8vIGZldGNoIG11bHRpcGxlIGNvdW50cyBhbmQgYWdncmVnYXRlXG4gIGdldENvdW50cygpIHtcbiAgICB0aGlzLnRvdGFsID0gW107XG5cbiAgICBjb25zdCBjb3VudCA9IHRoaXMuc3RvcmVHZXQoYCR7dGhpcy50eXBlfS0ke3RoaXMuc2hhcmVkfWApO1xuXG4gICAgaWYgKGNvdW50KSB7XG4gICAgICBpZiAodGhpcy5hcHBlbmRUbyAmJiB0eXBlb2YgdGhpcy5hcHBlbmRUbyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzLmFwcGVuZFRvLmFwcGVuZENoaWxkKHRoaXMub3MpO1xuICAgICAgfVxuICAgICAgY291bnRSZWR1Y2UodGhpcy5vcywgY291bnQpO1xuICAgIH1cblxuICAgIHRoaXMuY291bnREYXRhLmZvckVhY2goKGNvdW50RGF0YSkgPT4ge1xuICAgICAgdGhpc1tjb3VudERhdGEudHlwZV0oY291bnREYXRhLCAobnVtKSA9PiB7XG4gICAgICAgIHRoaXMudG90YWwucHVzaChudW0pO1xuXG4gICAgICAgIC8vIHRvdGFsIGNvdW50cyBsZW5ndGggbm93IGVxdWFscyB0eXBlIGFycmF5IGxlbmd0aFxuICAgICAgICAvLyBzbyBhZ2dyZWdhdGUsIHN0b3JlIGFuZCBpbnNlcnQgaW50byBET01cbiAgICAgICAgaWYgKHRoaXMudG90YWwubGVuZ3RoID09PSB0aGlzLnR5cGVBcnIubGVuZ3RoKSB7XG4gICAgICAgICAgbGV0IHRvdCA9IDA7XG5cbiAgICAgICAgICB0aGlzLnRvdGFsLmZvckVhY2goKHQpID0+IHtcbiAgICAgICAgICAgIHRvdCArPSB0O1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgaWYgKHRoaXMuYXBwZW5kVG8gJiYgdHlwZW9mIHRoaXMuYXBwZW5kVG8gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kVG8uYXBwZW5kQ2hpbGQodGhpcy5vcyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgbG9jYWwgPSBOdW1iZXIodGhpcy5zdG9yZUdldChgJHt0aGlzLnR5cGV9LSR7dGhpcy5zaGFyZWR9YCkpO1xuICAgICAgICAgIGlmIChsb2NhbCA+IHRvdCkge1xuICAgICAgICAgICAgY29uc3QgbGF0ZXN0Q291bnQgPSBOdW1iZXIodGhpcy5zdG9yZUdldChgJHt0aGlzLnR5cGV9LSR7dGhpcy5zaGFyZWR9LWxhdGVzdENvdW50YCkpO1xuICAgICAgICAgICAgdGhpcy5zdG9yZVNldChgJHt0aGlzLnR5cGV9LSR7dGhpcy5zaGFyZWR9LWxhdGVzdENvdW50YCwgdG90KTtcblxuICAgICAgICAgICAgdG90ID0gaXNOdW1lcmljKGxhdGVzdENvdW50KSAmJiBsYXRlc3RDb3VudCA+IDAgP1xuICAgICAgICAgICAgdG90ICs9IGxvY2FsIC0gbGF0ZXN0Q291bnQgOlxuICAgICAgICAgICAgdG90ICs9IGxvY2FsO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnN0b3JlU2V0KGAke3RoaXMudHlwZX0tJHt0aGlzLnNoYXJlZH1gLCB0b3QpO1xuXG4gICAgICAgICAgY291bnRSZWR1Y2UodGhpcy5vcywgdG90KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpZiAodGhpcy5hcHBlbmRUbyAmJiB0eXBlb2YgdGhpcy5hcHBlbmRUbyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhpcy5hcHBlbmRUby5hcHBlbmRDaGlsZCh0aGlzLm9zKTtcbiAgICB9XG4gIH1cblxuICAvLyBoYW5kbGUgSlNPTlAgcmVxdWVzdHNcbiAganNvbnAoY291bnREYXRhLCBjYikge1xuICAvLyBkZWZpbmUgcmFuZG9tIGNhbGxiYWNrIGFuZCBhc3NpZ24gdHJhbnNmb3JtIGZ1bmN0aW9uXG4gICAgY29uc3QgY2FsbGJhY2sgPSBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHJpbmcoNykucmVwbGFjZSgvW15hLXpBLVpdL2csICcnKTtcbiAgICB3aW5kb3dbY2FsbGJhY2tdID0gKGRhdGEpID0+IHtcbiAgICAgIGNvbnN0IGNvdW50ID0gY291bnREYXRhLnRyYW5zZm9ybS5hcHBseSh0aGlzLCBbZGF0YV0pIHx8IDA7XG5cbiAgICAgIGlmIChjYiAmJiB0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgY2IoY291bnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRoaXMuYXBwZW5kVG8gJiYgdHlwZW9mIHRoaXMuYXBwZW5kVG8gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICB0aGlzLmFwcGVuZFRvLmFwcGVuZENoaWxkKHRoaXMub3MpO1xuICAgICAgICB9XG4gICAgICAgIGNvdW50UmVkdWNlKHRoaXMub3MsIGNvdW50LCB0aGlzLmNiKTtcbiAgICAgIH1cblxuICAgICAgRXZlbnRzLnRyaWdnZXIodGhpcy5vcywgYGNvdW50ZWQtJHt0aGlzLnVybH1gKTtcbiAgICB9O1xuXG4gICAgLy8gYXBwZW5kIEpTT05QIHNjcmlwdCB0YWcgdG8gcGFnZVxuICAgIGNvbnN0IHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgIHNjcmlwdC5zcmMgPSBjb3VudERhdGEudXJsLnJlcGxhY2UoJ2NhbGxiYWNrPT8nLCBgY2FsbGJhY2s9JHtjYWxsYmFja31gKTtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdLmFwcGVuZENoaWxkKHNjcmlwdCk7XG5cbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBoYW5kbGUgQUpBWCBHRVQgcmVxdWVzdFxuICBnZXQoY291bnREYXRhLCBjYikge1xuICAgIGNvbnN0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgLy8gb24gc3VjY2VzcyBwYXNzIHJlc3BvbnNlIHRvIHRyYW5zZm9ybSBmdW5jdGlvblxuICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSAoKSA9PiB7XG4gICAgICBpZiAoeGhyLnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgICAgaWYgKHhoci5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgIGNvbnN0IGNvdW50ID0gY291bnREYXRhLnRyYW5zZm9ybS5hcHBseSh0aGlzLCBbeGhyLCBFdmVudHNdKSB8fCAwO1xuXG4gICAgICAgICAgaWYgKGNiICYmIHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2IoY291bnQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAodGhpcy5hcHBlbmRUbyAmJiB0eXBlb2YgdGhpcy5hcHBlbmRUbyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICB0aGlzLmFwcGVuZFRvLmFwcGVuZENoaWxkKHRoaXMub3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY291bnRSZWR1Y2UodGhpcy5vcywgY291bnQsIHRoaXMuY2IpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIEV2ZW50cy50cmlnZ2VyKHRoaXMub3MsIGBjb3VudGVkLSR7dGhpcy51cmx9YCk7XG4gICAgICAgIH0gZWxzZSBpZiAoY291bnREYXRhLnVybC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ2h0dHBzOi8vYXBpLm9wZW5zaGFyZS5zb2NpYWwvam9iPycpID09PSAwKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignUGxlYXNlIHNpZ24gdXAgZm9yIFR3aXR0ZXIgY291bnRzIGF0IGh0dHBzOi8vb3BlbnNoYXJlLnNvY2lhbC90d2l0dGVyL2F1dGgnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gZ2V0IEFQSSBkYXRhIGZyb20nLCBjb3VudERhdGEudXJsLCAnLiBQbGVhc2UgdXNlIHRoZSBsYXRlc3QgdmVyc2lvbiBvZiBPcGVuU2hhcmUuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgY291bnREYXRhLnVybCA9IGNvdW50RGF0YS51cmwuc3RhcnRzV2l0aCgnaHR0cHM6Ly9hcGkub3BlbnNoYXJlLnNvY2lhbC9qb2I/JykgJiYgdGhpcy5rZXkgP1xuICAgICAgY291bnREYXRhLnVybCArIHRoaXMua2V5IDpcbiAgICAgIGNvdW50RGF0YS51cmw7XG5cbiAgICB4aHIub3BlbignR0VUJywgY291bnREYXRhLnVybCk7XG4gICAgeGhyLnNlbmQoKTtcbiAgfVxuXG4gIC8vIGhhbmRsZSBBSkFYIFBPU1QgcmVxdWVzdFxuICBwb3N0KGNvdW50RGF0YSwgY2IpIHtcbiAgICBjb25zdCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgIC8vIG9uIHN1Y2Nlc3MgcGFzcyByZXNwb25zZSB0byB0cmFuc2Zvcm0gZnVuY3Rpb25cbiAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gKCkgPT4ge1xuICAgICAgaWYgKHhoci5yZWFkeVN0YXRlICE9PSBYTUxIdHRwUmVxdWVzdC5ET05FIHx8XG4gICAgICAgIHhoci5zdGF0dXMgIT09IDIwMCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNvdW50ID0gY291bnREYXRhLnRyYW5zZm9ybS5hcHBseSh0aGlzLCBbeGhyXSkgfHwgMDtcblxuICAgICAgaWYgKGNiICYmIHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBjYihjb3VudCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodGhpcy5hcHBlbmRUbyAmJiB0eXBlb2YgdGhpcy5hcHBlbmRUbyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIHRoaXMuYXBwZW5kVG8uYXBwZW5kQ2hpbGQodGhpcy5vcyk7XG4gICAgICAgIH1cbiAgICAgICAgY291bnRSZWR1Y2UodGhpcy5vcywgY291bnQsIHRoaXMuY2IpO1xuICAgICAgfVxuICAgICAgRXZlbnRzLnRyaWdnZXIodGhpcy5vcywgYGNvdW50ZWQtJHt0aGlzLnVybH1gKTtcbiAgICB9O1xuXG4gICAgeGhyLm9wZW4oJ1BPU1QnLCBjb3VudERhdGEudXJsKTtcbiAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb247Y2hhcnNldD1VVEYtOCcpO1xuICAgIHhoci5zZW5kKEpTT04uc3RyaW5naWZ5KGNvdW50RGF0YS5kYXRhKSk7XG4gIH1cblxuICBzdG9yZVNldCh0eXBlLCBjb3VudCA9IDApIHsvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgICBpZiAoIXdpbmRvdy5sb2NhbFN0b3JhZ2UgfHwgIXR5cGUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShgT3BlblNoYXJlLSR7dHlwZX1gLCBjb3VudCk7XG4gIH1cblxuICBzdG9yZUdldCh0eXBlKSB7Ly9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgaWYgKCF3aW5kb3cubG9jYWxTdG9yYWdlIHx8ICF0eXBlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcmV0dXJuIGxvY2FsU3RvcmFnZS5nZXRJdGVtKGBPcGVuU2hhcmUtJHt0eXBlfWApO1xuICB9XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgQ291bnQ7XG4iLCJpbXBvcnQgSW5pdCBmcm9tICcuLi8uLi9saWIvaW5pdCc7XG5pbXBvcnQgc2hhcmUgZnJvbSAnLi4vLi4vbGliL2luaXRpYWxpemVTaGFyZU5vZGUnO1xuaW1wb3J0IGNvdW50IGZyb20gJy4uLy4uL2xpYi9pbml0aWFsaXplQ291bnROb2RlJztcblxuZnVuY3Rpb24gaW5pdCgpIHtcbiAgSW5pdCh7XG4gICAgc2VsZWN0b3I6IHtcbiAgICAgIHNoYXJlOiAnW2RhdGEtb3Blbi1zaGFyZV06bm90KFtkYXRhLW9wZW4tc2hhcmUtbm9kZV0pJyxcbiAgICAgIGNvdW50OiAnW2RhdGEtb3Blbi1zaGFyZS1jb3VudF06bm90KFtkYXRhLW9wZW4tc2hhcmUtbm9kZV0pJyxcbiAgICB9LFxuICAgIGNiOiB7XG4gICAgICBzaGFyZSxcbiAgICAgIGNvdW50LFxuICAgIH0sXG4gIH0pKCk7XG59XG5leHBvcnQgZGVmYXVsdCAoKSA9PiB7XG4gIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnY29tcGxldGUnKSB7XG4gICAgcmV0dXJuIGluaXQoKTtcbiAgfVxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdyZWFkeXN0YXRlY2hhbmdlJywgKCkgPT4ge1xuICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnY29tcGxldGUnKSB7XG4gICAgICBpbml0KCk7XG4gICAgfVxuICB9LCBmYWxzZSk7XG59O1xuIiwiLyoqXG4gKiBUcmlnZ2VyIGN1c3RvbSBPcGVuU2hhcmUgbmFtZXNwYWNlZCBldmVudFxuICovXG5leHBvcnQgZGVmYXVsdCB7XG4gIHRyaWdnZXIoZWxlbWVudCwgZXZlbnQpIHtcbiAgICBjb25zdCBldiA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdFdmVudCcpO1xuICAgIGV2LmluaXRFdmVudChgT3BlblNoYXJlLiR7ZXZlbnR9YCwgdHJ1ZSwgdHJ1ZSk7XG4gICAgZWxlbWVudC5kaXNwYXRjaEV2ZW50KGV2KTtcbiAgfSxcbn07XG4iLCIvKipcbiAqIE9wZW5TaGFyZSBnZW5lcmF0ZXMgYSBzaW5nbGUgc2hhcmUgbGlua1xuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBPcGVuU2hhcmUge1xuXG4gIGNvbnN0cnVjdG9yKHR5cGUsIHRyYW5zZm9ybSkge1xuICAgIHRoaXMuaW9zID0gL2lQYWR8aVBob25lfGlQb2QvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkgJiYgIXdpbmRvdy5NU1N0cmVhbTtcbiAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgIHRoaXMuZHluYW1pYyA9IGZhbHNlO1xuICAgIHRoaXMudHJhbnNmb3JtID0gdHJhbnNmb3JtO1xuXG4gICAgLy8gY2FwaXRhbGl6ZWQgdHlwZVxuICAgIHRoaXMudHlwZUNhcHMgPSB0eXBlLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgdHlwZS5zbGljZSgxKTtcbiAgfVxuXG4gIC8vIHJldHVybnMgZnVuY3Rpb24gbmFtZWQgYXMgdHlwZSBzZXQgaW4gY29uc3RydWN0b3JcbiAgLy8gZS5nIHR3aXR0ZXIoKVxuICBzZXREYXRhKGRhdGEpIHtcbiAgICAvLyBpZiBpT1MgdXNlciBhbmQgaW9zIGRhdGEgYXR0cmlidXRlIGRlZmluZWRcbiAgICAvLyBidWlsZCBpT1MgVVJMIHNjaGVtZSBhcyBzaW5nbGUgc3RyaW5nXG4gICAgaWYgKHRoaXMuaW9zKSB7XG4gICAgICB0aGlzLnRyYW5zZm9ybURhdGEgPSB0aGlzLnRyYW5zZm9ybShkYXRhLCB0cnVlKTtcbiAgICAgIHRoaXMubW9iaWxlU2hhcmVVcmwgPSB0aGlzLnRlbXBsYXRlKHRoaXMudHJhbnNmb3JtRGF0YS51cmwsIHRoaXMudHJhbnNmb3JtRGF0YS5kYXRhKTtcbiAgICB9XG5cbiAgICB0aGlzLnRyYW5zZm9ybURhdGEgPSB0aGlzLnRyYW5zZm9ybShkYXRhKTtcbiAgICB0aGlzLnNoYXJlVXJsID0gdGhpcy50ZW1wbGF0ZSh0aGlzLnRyYW5zZm9ybURhdGEudXJsLCB0aGlzLnRyYW5zZm9ybURhdGEuZGF0YSk7XG4gIH1cblxuICAvLyBvcGVuIHNoYXJlIFVSTCBkZWZpbmVkIGluIGluZGl2aWR1YWwgcGxhdGZvcm0gZnVuY3Rpb25zXG4gIHNoYXJlKCkge1xuICAgIC8vIGlmIGlPUyBzaGFyZSBVUkwgaGFzIGJlZW4gc2V0IHRoZW4gdXNlIHRpbWVvdXQgaGFja1xuICAgIC8vIHRlc3QgZm9yIG5hdGl2ZSBhcHAgYW5kIGZhbGwgYmFjayB0byB3ZWJcbiAgICBpZiAodGhpcy5tb2JpbGVTaGFyZVVybCkge1xuICAgICAgY29uc3Qgc3RhcnQgPSAobmV3IERhdGUoKSkudmFsdWVPZigpO1xuXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgY29uc3QgZW5kID0gKG5ldyBEYXRlKCkpLnZhbHVlT2YoKTtcblxuICAgICAgICAvLyBpZiB0aGUgdXNlciBpcyBzdGlsbCBoZXJlLCBmYWxsIGJhY2sgdG8gd2ViXG4gICAgICAgIGlmIChlbmQgLSBzdGFydCA+IDE2MDApIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB3aW5kb3cubG9jYXRpb24gPSB0aGlzLnNoYXJlVXJsO1xuICAgICAgfSwgMTUwMCk7XG5cbiAgICAgIHdpbmRvdy5sb2NhdGlvbiA9IHRoaXMubW9iaWxlU2hhcmVVcmw7XG5cbiAgICAgIC8vIG9wZW4gbWFpbHRvIGxpbmtzIGluIHNhbWUgd2luZG93XG4gICAgfSBlbHNlIGlmICh0aGlzLnR5cGUgPT09ICdlbWFpbCcpIHtcbiAgICAgIHdpbmRvdy5sb2NhdGlvbiA9IHRoaXMuc2hhcmVVcmw7XG5cbiAgICAgIC8vIG9wZW4gc29jaWFsIHNoYXJlIFVSTHMgaW4gbmV3IHdpbmRvd1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBpZiBwb3B1cCBvYmplY3QgcHJlc2VudCB0aGVuIHNldCB3aW5kb3cgZGltZW5zaW9ucyAvIHBvc2l0aW9uXG4gICAgICBpZiAodGhpcy5wb3B1cCAmJiB0aGlzLnRyYW5zZm9ybURhdGEucG9wdXApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3BlbldpbmRvdyh0aGlzLnNoYXJlVXJsLCB0aGlzLnRyYW5zZm9ybURhdGEucG9wdXApO1xuICAgICAgfVxuXG4gICAgICB3aW5kb3cub3Blbih0aGlzLnNoYXJlVXJsKTtcbiAgICB9XG4gIH1cblxuICAvLyBjcmVhdGUgc2hhcmUgVVJMIHdpdGggR0VUIHBhcmFtc1xuICAvLyBhcHBlbmRpbmcgdmFsaWQgcHJvcGVydGllcyB0byBxdWVyeSBzdHJpbmdcbiAgdGVtcGxhdGUodXJsLCBkYXRhKSB7Ly9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgY29uc3Qgbm9uVVJMUHJvcHMgPSBbXG4gICAgICAnYXBwZW5kVG8nLFxuICAgICAgJ2lubmVySFRNTCcsXG4gICAgICAnY2xhc3NlcycsXG4gICAgXTtcblxuICAgIGxldCBzaGFyZVVybCA9IHVybCxcbiAgICAgIGk7XG5cbiAgICBmb3IgKGkgaW4gZGF0YSkge1xuICAgICAgLy8gb25seSBhcHBlbmQgdmFsaWQgcHJvcGVydGllc1xuICAgICAgaWYgKCFkYXRhW2ldIHx8IG5vblVSTFByb3BzLmluZGV4T2YoaSkgPiAtMSkge1xuICAgICAgICBjb250aW51ZTsgLy9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgICB9XG5cbiAgICAgIC8vIGFwcGVuZCBVUkwgZW5jb2RlZCBHRVQgcGFyYW0gdG8gc2hhcmUgVVJMXG4gICAgICBkYXRhW2ldID0gZW5jb2RlVVJJQ29tcG9uZW50KGRhdGFbaV0pO1xuICAgICAgc2hhcmVVcmwgKz0gYCR7aX09JHtkYXRhW2ldfSZgO1xuICAgIH1cblxuICAgIHJldHVybiBzaGFyZVVybC5zdWJzdHIoMCwgc2hhcmVVcmwubGVuZ3RoIC0gMSk7XG4gIH1cblxuICAvLyBjZW50ZXIgcG9wdXAgd2luZG93IHN1cHBvcnRpbmcgZHVhbCBzY3JlZW5zXG4gIG9wZW5XaW5kb3codXJsLCBvcHRpb25zKSB7Ly9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgY29uc3QgZHVhbFNjcmVlbkxlZnQgPSB3aW5kb3cuc2NyZWVuTGVmdCAhPT0gdW5kZWZpbmVkID8gd2luZG93LnNjcmVlbkxlZnQgOiBzY3JlZW4ubGVmdCxcbiAgICAgIGR1YWxTY3JlZW5Ub3AgPSB3aW5kb3cuc2NyZWVuVG9wICE9PSB1bmRlZmluZWQgPyB3aW5kb3cuc2NyZWVuVG9wIDogc2NyZWVuLnRvcCxcbiAgICAgIHdpZHRoID0gd2luZG93LmlubmVyV2lkdGggPyB3aW5kb3cuaW5uZXJXaWR0aCA6IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aCA/IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aCA6IHNjcmVlbi53aWR0aCwvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgICAgIGhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodCA/IHdpbmRvdy5pbm5lckhlaWdodCA6IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQgPyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0IDogc2NyZWVuLmhlaWdodCwvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgICAgIGxlZnQgPSAoKHdpZHRoIC8gMikgLSAob3B0aW9ucy53aWR0aCAvIDIpKSArIGR1YWxTY3JlZW5MZWZ0LFxuICAgICAgdG9wID0gKChoZWlnaHQgLyAyKSAtIChvcHRpb25zLmhlaWdodCAvIDIpKSArIGR1YWxTY3JlZW5Ub3AsXG4gICAgICBuZXdXaW5kb3cgPSB3aW5kb3cub3Blbih1cmwsICdPcGVuU2hhcmUnLCBgd2lkdGg9JHtvcHRpb25zLndpZHRofSwgaGVpZ2h0PSR7b3B0aW9ucy5oZWlnaHR9LCB0b3A9JHt0b3B9LCBsZWZ0PSR7bGVmdH1gKTtcblxuICAgIC8vIFB1dHMgZm9jdXMgb24gdGhlIG5ld1dpbmRvd1xuICAgIGlmICh3aW5kb3cuZm9jdXMpIHtcbiAgICAgIG5ld1dpbmRvdy5mb2N1cygpO1xuICAgIH1cbiAgfVxufVxuIiwiLyoqXG4gKiBHbG9iYWwgT3BlblNoYXJlIEFQSSB0byBnZW5lcmF0ZSBpbnN0YW5jZXMgcHJvZ3JhbW1hdGljYWxseVxuICovXG5pbXBvcnQgT1MgZnJvbSAnLi9vcGVuLXNoYXJlJztcbmltcG9ydCBTaGFyZVRyYW5zZm9ybXMgZnJvbSAnLi9zaGFyZS10cmFuc2Zvcm1zJztcbmltcG9ydCBFdmVudHMgZnJvbSAnLi9ldmVudHMnO1xuaW1wb3J0IGRhc2hUb0NhbWVsIGZyb20gJy4uLy4uL2xpYi9kYXNoVG9DYW1lbCc7XG5cbmV4cG9ydCBkZWZhdWx0ICgpID0+IHtcbiAgLy8gZ2xvYmFsIE9wZW5TaGFyZSByZWZlcmVuY2luZyBpbnRlcm5hbCBjbGFzcyBmb3IgaW5zdGFuY2UgZ2VuZXJhdGlvblxuICBjbGFzcyBPcGVuU2hhcmUge1xuXG4gICAgY29uc3RydWN0b3IoZGF0YSwgZWxlbWVudCkge1xuICAgICAgaWYgKCFkYXRhLmJpbmRDbGljaykgZGF0YS5iaW5kQ2xpY2sgPSB0cnVlO1xuXG4gICAgICBjb25zdCBkYXNoID0gZGF0YS50eXBlLmluZGV4T2YoJy0nKTtcblxuICAgICAgaWYgKGRhc2ggPiAtMSkge1xuICAgICAgICBkYXRhLnR5cGUgPSBkYXNoVG9DYW1lbChkYXNoLCBkYXRhLnR5cGUpO1xuICAgICAgfVxuXG4gICAgICBsZXQgbm9kZTtcbiAgICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgICB0aGlzLmRhdGEgPSBkYXRhO1xuXG4gICAgICB0aGlzLm9zID0gbmV3IE9TKGRhdGEudHlwZSwgU2hhcmVUcmFuc2Zvcm1zW2RhdGEudHlwZV0pO1xuICAgICAgdGhpcy5vcy5zZXREYXRhKGRhdGEpO1xuXG4gICAgICBpZiAoIWVsZW1lbnQgfHwgZGF0YS5lbGVtZW50KSB7XG4gICAgICAgIGVsZW1lbnQgPSBkYXRhLmVsZW1lbnQ7XG4gICAgICAgIG5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGVsZW1lbnQgfHwgJ2EnKTtcbiAgICAgICAgaWYgKGRhdGEudHlwZSkge1xuICAgICAgICAgIG5vZGUuY2xhc3NMaXN0LmFkZCgnb3Blbi1zaGFyZS1saW5rJywgZGF0YS50eXBlKTtcbiAgICAgICAgICBub2RlLnNldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlJywgZGF0YS50eXBlKTtcbiAgICAgICAgICBub2RlLnNldEF0dHJpYnV0ZSgnZGF0YS1vcGVuLXNoYXJlLW5vZGUnLCBkYXRhLnR5cGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkYXRhLmlubmVySFRNTCkgbm9kZS5pbm5lckhUTUwgPSBkYXRhLmlubmVySFRNTDtcbiAgICAgIH1cbiAgICAgIGlmIChub2RlKSBlbGVtZW50ID0gbm9kZTtcblxuICAgICAgaWYgKGRhdGEuYmluZENsaWNrKSB7XG4gICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5zaGFyZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKGRhdGEuYXBwZW5kVG8pIHtcbiAgICAgICAgZGF0YS5hcHBlbmRUby5hcHBlbmRDaGlsZChlbGVtZW50KTtcbiAgICAgIH1cblxuICAgICAgaWYgKGRhdGEuY2xhc3NlcyAmJiBBcnJheS5pc0FycmF5KGRhdGEuY2xhc3NlcykpIHtcbiAgICAgICAgZGF0YS5jbGFzc2VzLmZvckVhY2goKGNzc0NsYXNzKSA9PiB7XG4gICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKGNzc0NsYXNzKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChkYXRhLnR5cGUudG9Mb3dlckNhc2UoKSA9PT0gJ3BheXBhbCcpIHtcbiAgICAgICAgY29uc3QgYWN0aW9uID0gZGF0YS5zYW5kYm94ID9cbiAgICAgICAgJ2h0dHBzOi8vd3d3LnNhbmRib3gucGF5cGFsLmNvbS9jZ2ktYmluL3dlYnNjcicgOlxuICAgICAgICAnaHR0cHM6Ly93d3cucGF5cGFsLmNvbS9jZ2ktYmluL3dlYnNjcic7XG5cbiAgICAgICAgY29uc3QgYnV5R0lGID0gZGF0YS5zYW5kYm94ID9cbiAgICAgICAgJ2h0dHBzOi8vd3d3LnNhbmRib3gucGF5cGFsLmNvbS9lbl9VUy9pL2J0bi9idG5fYnV5bm93X0xHLmdpZicgOlxuICAgICAgICAnaHR0cHM6Ly93d3cucGF5cGFsb2JqZWN0cy5jb20vZW5fVVMvaS9idG4vYnRuX2J1eW5vd19MRy5naWYnO1xuXG4gICAgICAgIGNvbnN0IHBpeGVsR0lGID0gZGF0YS5zYW5kYm94ID9cbiAgICAgICAgJ2h0dHBzOi8vd3d3LnNhbmRib3gucGF5cGFsLmNvbS9lbl9VUy9pL3Njci9waXhlbC5naWYnIDpcbiAgICAgICAgJ2h0dHBzOi8vd3d3LnBheXBhbG9iamVjdHMuY29tL2VuX1VTL2kvc2NyL3BpeGVsLmdpZic7XG5cblxuICAgICAgICBjb25zdCBwYXlwYWxCdXR0b24gPSBgPGZvcm0gYWN0aW9uPSR7YWN0aW9ufSBtZXRob2Q9XCJwb3N0XCIgdGFyZ2V0PVwiX2JsYW5rXCI+XG5cbiAgICAgICAgPCEtLSBTYXZlZCBidXR0b25zIHVzZSB0aGUgXCJzZWN1cmUgY2xpY2tcIiBjb21tYW5kIC0tPlxuICAgICAgICA8aW5wdXQgdHlwZT1cImhpZGRlblwiIG5hbWU9XCJjbWRcIiB2YWx1ZT1cIl9zLXhjbGlja1wiPlxuXG4gICAgICAgIDwhLS0gU2F2ZWQgYnV0dG9ucyBhcmUgaWRlbnRpZmllZCBieSB0aGVpciBidXR0b24gSURzIC0tPlxuICAgICAgICA8aW5wdXQgdHlwZT1cImhpZGRlblwiIG5hbWU9XCJob3N0ZWRfYnV0dG9uX2lkXCIgdmFsdWU9XCIke2RhdGEuYnV0dG9uSWR9XCI+XG5cbiAgICAgICAgPCEtLSBTYXZlZCBidXR0b25zIGRpc3BsYXkgYW4gYXBwcm9wcmlhdGUgYnV0dG9uIGltYWdlLiAtLT5cbiAgICAgICAgPGlucHV0IHR5cGU9XCJpbWFnZVwiIG5hbWU9XCJzdWJtaXRcIlxuICAgICAgICBzcmM9JHtidXlHSUZ9XG4gICAgICAgIGFsdD1cIlBheVBhbCAtIFRoZSBzYWZlciwgZWFzaWVyIHdheSB0byBwYXkgb25saW5lXCI+XG4gICAgICAgIDxpbWcgYWx0PVwiXCIgd2lkdGg9XCIxXCIgaGVpZ2h0PVwiMVwiXG4gICAgICAgIHNyYz0ke3BpeGVsR0lGfSA+XG5cbiAgICAgICAgPC9mb3JtPmA7XG5cbiAgICAgICAgY29uc3QgaGlkZGVuRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGhpZGRlbkRpdi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICBoaWRkZW5EaXYuaW5uZXJIVE1MID0gcGF5cGFsQnV0dG9uO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGhpZGRlbkRpdik7XG5cbiAgICAgICAgdGhpcy5wYXlwYWwgPSBoaWRkZW5EaXYucXVlcnlTZWxlY3RvcignZm9ybScpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgfVxuXG4gICAgLy8gcHVibGljIHNoYXJlIG1ldGhvZCB0byB0cmlnZ2VyIHNoYXJlIHByb2dyYW1tYXRpY2FsbHlcbiAgICBzaGFyZShlKSB7XG4gICAgICAvLyBpZiBkeW5hbWljIGluc3RhbmNlIHRoZW4gZmV0Y2ggYXR0cmlidXRlcyBhZ2FpbiBpbiBjYXNlIG9mIHVwZGF0ZXNcbiAgICAgIGlmICh0aGlzLmRhdGEuZHluYW1pYykge1xuICAgICAgICAvL2VzbGludC1kaXNhYmxlLW5leHQtbGluZVxuICAgICAgICB0aGlzLm9zLnNldERhdGEoZGF0YSk7Ly8gZGF0YSBpcyBub3QgZGVmaW5lZFxuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5kYXRhLnR5cGUudG9Mb3dlckNhc2UoKSA9PT0gJ3BheXBhbCcpIHtcbiAgICAgICAgdGhpcy5wYXlwYWwuc3VibWl0KCk7XG4gICAgICB9IGVsc2UgdGhpcy5vcy5zaGFyZShlKTtcblxuICAgICAgRXZlbnRzLnRyaWdnZXIodGhpcy5lbGVtZW50LCAnc2hhcmVkJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIE9wZW5TaGFyZTtcbn07XG4iLCIvKipcbiAqIE9iamVjdCBvZiB0cmFuc2Zvcm0gZnVuY3Rpb25zIGZvciBlYWNoIG9wZW5zaGFyZSBhcGlcbiAqIFRyYW5zZm9ybSBmdW5jdGlvbnMgcGFzc2VkIGludG8gT3BlblNoYXJlIGluc3RhbmNlIHdoZW4gaW5zdGFudGlhdGVkXG4gKiBSZXR1cm4gb2JqZWN0IGNvbnRhaW5pbmcgVVJMIGFuZCBrZXkvdmFsdWUgYXJnc1xuICovXG5leHBvcnQgZGVmYXVsdCB7XG5cbiAgLy8gc2V0IFR3aXR0ZXIgc2hhcmUgVVJMXG4gIHR3aXR0ZXIoZGF0YSwgaW9zID0gZmFsc2UpIHtcbiAgICAvLyBpZiBpT1MgdXNlciBhbmQgaW9zIGRhdGEgYXR0cmlidXRlIGRlZmluZWRcbiAgICAvLyBidWlsZCBpT1MgVVJMIHNjaGVtZSBhcyBzaW5nbGUgc3RyaW5nXG4gICAgaWYgKGlvcyAmJiBkYXRhLmlvcykge1xuICAgICAgbGV0IG1lc3NhZ2UgPSAnJztcblxuICAgICAgaWYgKGRhdGEudGV4dCkge1xuICAgICAgICBtZXNzYWdlICs9IGRhdGEudGV4dDtcbiAgICAgIH1cblxuICAgICAgaWYgKGRhdGEudXJsKSB7XG4gICAgICAgIG1lc3NhZ2UgKz0gYCAtICR7ZGF0YS51cmx9YDtcbiAgICAgIH1cblxuICAgICAgaWYgKGRhdGEuaGFzaHRhZ3MpIHtcbiAgICAgICAgY29uc3QgdGFncyA9IGRhdGEuaGFzaHRhZ3Muc3BsaXQoJywnKTtcbiAgICAgICAgdGFncy5mb3JFYWNoKCh0YWcpID0+IHtcbiAgICAgICAgICBtZXNzYWdlICs9IGAgIyR7dGFnfWA7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGF0YS52aWEpIHtcbiAgICAgICAgbWVzc2FnZSArPSBgIHZpYSAke2RhdGEudmlhfWA7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHVybDogJ3R3aXR0ZXI6Ly9wb3N0PycsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICB9LFxuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgdXJsOiAnaHR0cHM6Ly90d2l0dGVyLmNvbS9zaGFyZT8nLFxuICAgICAgZGF0YSxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiA3MDAsXG4gICAgICAgIGhlaWdodDogMjk2LFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBUd2l0dGVyIHJldHdlZXQgVVJMXG4gIHR3aXR0ZXJSZXR3ZWV0KGRhdGEsIGlvcyA9IGZhbHNlKSB7XG4gICAgLy8gaWYgaU9TIHVzZXIgYW5kIGlvcyBkYXRhIGF0dHJpYnV0ZSBkZWZpbmVkXG4gICAgaWYgKGlvcyAmJiBkYXRhLmlvcykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdXJsOiAndHdpdHRlcjovL3N0YXR1cz8nLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgaWQ6IGRhdGEudHdlZXRJZCxcbiAgICAgICAgfSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogJ2h0dHBzOi8vdHdpdHRlci5jb20vaW50ZW50L3JldHdlZXQ/JyxcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgdHdlZXRfaWQ6IGRhdGEudHdlZXRJZCxcbiAgICAgICAgcmVsYXRlZDogZGF0YS5yZWxhdGVkLFxuICAgICAgfSxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiA3MDAsXG4gICAgICAgIGhlaWdodDogMjk2LFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBUd2l0dGVyIGxpa2UgVVJMXG4gIHR3aXR0ZXJMaWtlKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG4gICAgLy8gaWYgaU9TIHVzZXIgYW5kIGlvcyBkYXRhIGF0dHJpYnV0ZSBkZWZpbmVkXG4gICAgaWYgKGlvcyAmJiBkYXRhLmlvcykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdXJsOiAndHdpdHRlcjovL3N0YXR1cz8nLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgaWQ6IGRhdGEudHdlZXRJZCxcbiAgICAgICAgfSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogJ2h0dHBzOi8vdHdpdHRlci5jb20vaW50ZW50L2Zhdm9yaXRlPycsXG4gICAgICBkYXRhOiB7XG4gICAgICAgIHR3ZWV0X2lkOiBkYXRhLnR3ZWV0SWQsXG4gICAgICAgIHJlbGF0ZWQ6IGRhdGEucmVsYXRlZCxcbiAgICAgIH0sXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogNzAwLFxuICAgICAgICBoZWlnaHQ6IDI5NixcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgVHdpdHRlciBmb2xsb3cgVVJMXG4gIHR3aXR0ZXJGb2xsb3coZGF0YSwgaW9zID0gZmFsc2UpIHtcbiAgICAvLyBpZiBpT1MgdXNlciBhbmQgaW9zIGRhdGEgYXR0cmlidXRlIGRlZmluZWRcbiAgICBpZiAoaW9zICYmIGRhdGEuaW9zKSB7XG4gICAgICBjb25zdCBpb3NEYXRhID0gZGF0YS5zY3JlZW5OYW1lID8ge1xuICAgICAgICBzY3JlZW5fbmFtZTogZGF0YS5zY3JlZW5OYW1lLFxuICAgICAgfSA6IHtcbiAgICAgICAgaWQ6IGRhdGEudXNlcklkLFxuICAgICAgfTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdXJsOiAndHdpdHRlcjovL3VzZXI/JyxcbiAgICAgICAgZGF0YTogaW9zRGF0YSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogJ2h0dHBzOi8vdHdpdHRlci5jb20vaW50ZW50L3VzZXI/JyxcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgc2NyZWVuX25hbWU6IGRhdGEuc2NyZWVuTmFtZSxcbiAgICAgICAgdXNlcl9pZDogZGF0YS51c2VySWQsXG4gICAgICB9LFxuICAgICAgcG9wdXA6IHtcbiAgICAgICAgd2lkdGg6IDcwMCxcbiAgICAgICAgaGVpZ2h0OiAyOTYsXG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgLy8gc2V0IEZhY2Vib29rIHNoYXJlIFVSTFxuICBmYWNlYm9vayhkYXRhKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogJ2h0dHBzOi8vd3d3LmZhY2Vib29rLmNvbS9kaWFsb2cvZmVlZD9hcHBfaWQ9OTYxMzQyNTQzOTIyMzIyJnJlZGlyZWN0X3VyaT1odHRwOi8vZmFjZWJvb2suY29tJicsXG4gICAgICBkYXRhLFxuICAgICAgcG9wdXA6IHtcbiAgICAgICAgd2lkdGg6IDU2MCxcbiAgICAgICAgaGVpZ2h0OiA1OTMsXG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgICAvLyBzZXQgRmFjZWJvb2sgc2VuZCBVUkxcbiAgZmFjZWJvb2tTZW5kKGRhdGEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdXJsOiAnaHR0cHM6Ly93d3cuZmFjZWJvb2suY29tL2RpYWxvZy9zZW5kP2FwcF9pZD05NjEzNDI1NDM5MjIzMjImcmVkaXJlY3RfdXJpPWh0dHA6Ly9mYWNlYm9vay5jb20mJyxcbiAgICAgIGRhdGEsXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogOTgwLFxuICAgICAgICBoZWlnaHQ6IDU5NixcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgWW91VHViZSBwbGF5IFVSTFxuICB5b3V0dWJlKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG4gICAgLy8gaWYgaU9TIHVzZXJcbiAgICBpZiAoaW9zICYmIGRhdGEuaW9zKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB1cmw6IGB5b3V0dWJlOiR7ZGF0YS52aWRlb30/YCxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogYGh0dHBzOi8vd3d3LnlvdXR1YmUuY29tL3dhdGNoP3Y9JHtkYXRhLnZpZGVvfT9gLFxuICAgICAgcG9wdXA6IHtcbiAgICAgICAgd2lkdGg6IDEwODYsXG4gICAgICAgIGhlaWdodDogNjA4LFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBZb3VUdWJlIHN1YmNyaWJlIFVSTFxuICB5b3V0dWJlU3Vic2NyaWJlKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG4gICAgLy8gaWYgaU9TIHVzZXJcbiAgICBpZiAoaW9zICYmIGRhdGEuaW9zKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB1cmw6IGB5b3V0dWJlOi8vd3d3LnlvdXR1YmUuY29tL3VzZXIvJHtkYXRhLnVzZXJ9P2AsXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB1cmw6IGBodHRwczovL3d3dy55b3V0dWJlLmNvbS91c2VyLyR7ZGF0YS51c2VyfT9gLFxuICAgICAgcG9wdXA6IHtcbiAgICAgICAgd2lkdGg6IDg4MCxcbiAgICAgICAgaGVpZ2h0OiAzNTAsXG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgLy8gc2V0IEluc3RhZ3JhbSBmb2xsb3cgVVJMXG4gIGluc3RhZ3JhbSgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdXJsOiAnaW5zdGFncmFtOi8vY2FtZXJhPycsXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgSW5zdGFncmFtIGZvbGxvdyBVUkxcbiAgaW5zdGFncmFtRm9sbG93KGRhdGEsIGlvcyA9IGZhbHNlKSB7XG4gICAgLy8gaWYgaU9TIHVzZXJcbiAgICBpZiAoaW9zICYmIGRhdGEuaW9zKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB1cmw6ICdpbnN0YWdyYW06Ly91c2VyPycsXG4gICAgICAgIGRhdGEsXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB1cmw6IGBodHRwOi8vd3d3Lmluc3RhZ3JhbS5jb20vJHtkYXRhLnVzZXJuYW1lfT9gLFxuICAgICAgcG9wdXA6IHtcbiAgICAgICAgd2lkdGg6IDk4MCxcbiAgICAgICAgaGVpZ2h0OiA2NTUsXG4gICAgICB9LFxuICAgIH07XG4gIH0sXG5cbiAgLy8gc2V0IFNuYXBjaGF0IGZvbGxvdyBVUkxcbiAgc25hcGNoYXQoZGF0YSkge1xuICAgIHJldHVybiB7XG4gICAgICB1cmw6IGBzbmFwY2hhdDovL2FkZC8ke2RhdGEudXNlcm5hbWV9P2AsXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgR29vZ2xlIHNoYXJlIFVSTFxuICBnb29nbGUoZGF0YSkge1xuICAgIHJldHVybiB7XG4gICAgICB1cmw6ICdodHRwczovL3BsdXMuZ29vZ2xlLmNvbS9zaGFyZT8nLFxuICAgICAgZGF0YSxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiA0OTUsXG4gICAgICAgIGhlaWdodDogODE1LFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBHb29nbGUgbWFwcyBVUkxcbiAgZ29vZ2xlTWFwcyhkYXRhLCBpb3MgPSBmYWxzZSkge1xuICAgIGlmIChkYXRhLnNlYXJjaCkge1xuICAgICAgZGF0YS5xID0gZGF0YS5zZWFyY2g7XG4gICAgICBkZWxldGUgZGF0YS5zZWFyY2g7XG4gICAgfVxuXG4gICAgLy8gaWYgaU9TIHVzZXIgYW5kIGlvcyBkYXRhIGF0dHJpYnV0ZSBkZWZpbmVkXG4gICAgaWYgKGlvcyAmJiBkYXRhLmlvcykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdXJsOiAnY29tZ29vZ2xlbWFwczovLz8nLFxuICAgICAgICBkYXRhOiBpb3MsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmICghaW9zICYmIGRhdGEuaW9zKSB7XG4gICAgICBkZWxldGUgZGF0YS5pb3M7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogJ2h0dHBzOi8vbWFwcy5nb29nbGUuY29tLz8nLFxuICAgICAgZGF0YSxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiA4MDAsXG4gICAgICAgIGhlaWdodDogNjAwLFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBQaW50ZXJlc3Qgc2hhcmUgVVJMXG4gIHBpbnRlcmVzdChkYXRhKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogJ2h0dHBzOi8vcGludGVyZXN0LmNvbS9waW4vY3JlYXRlL2Jvb2ttYXJrbGV0Lz8nLFxuICAgICAgZGF0YSxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiA3NDUsXG4gICAgICAgIGhlaWdodDogNjIwLFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBMaW5rZWRJbiBzaGFyZSBVUkxcbiAgbGlua2VkaW4oZGF0YSkge1xuICAgIHJldHVybiB7XG4gICAgICB1cmw6ICdodHRwOi8vd3d3LmxpbmtlZGluLmNvbS9zaGFyZUFydGljbGU/JyxcbiAgICAgIGRhdGEsXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogNzgwLFxuICAgICAgICBoZWlnaHQ6IDQ5MixcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgQnVmZmVyIHNoYXJlIFVSTFxuICBidWZmZXIoZGF0YSkge1xuICAgIHJldHVybiB7XG4gICAgICB1cmw6ICdodHRwOi8vYnVmZmVyYXBwLmNvbS9hZGQ/JyxcbiAgICAgIGRhdGEsXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogNzQ1LFxuICAgICAgICBoZWlnaHQ6IDM0NSxcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgVHVtYmxyIHNoYXJlIFVSTFxuICB0dW1ibHIoZGF0YSkge1xuICAgIHJldHVybiB7XG4gICAgICB1cmw6ICdodHRwczovL3d3dy50dW1ibHIuY29tL3dpZGdldHMvc2hhcmUvdG9vbD8nLFxuICAgICAgZGF0YSxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiA1NDAsXG4gICAgICAgIGhlaWdodDogOTQwLFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBSZWRkaXQgc2hhcmUgVVJMXG4gIHJlZGRpdChkYXRhKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogJ2h0dHA6Ly9yZWRkaXQuY29tL3N1Ym1pdD8nLFxuICAgICAgZGF0YSxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiA4NjAsXG4gICAgICAgIGhlaWdodDogODgwLFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBGbGlja3IgZm9sbG93IFVSTFxuICBmbGlja3IoZGF0YSwgaW9zID0gZmFsc2UpIHtcbiAgICAvLyBpZiBpT1MgdXNlclxuICAgIGlmIChpb3MgJiYgZGF0YS5pb3MpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHVybDogYGZsaWNrcjovL3Bob3Rvcy8ke2RhdGEudXNlcm5hbWV9P2AsXG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgdXJsOiBgaHR0cDovL3d3dy5mbGlja3IuY29tL3Bob3Rvcy8ke2RhdGEudXNlcm5hbWV9P2AsXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogNjAwLFxuICAgICAgICBoZWlnaHQ6IDY1MCxcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgV2hhdHNBcHAgc2hhcmUgVVJMXG4gIHdoYXRzYXBwKGRhdGEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdXJsOiAnd2hhdHNhcHA6Ly9zZW5kPycsXG4gICAgICBkYXRhLFxuICAgIH07XG4gIH0sXG5cbiAgLy8gc2V0IHNtcyBzaGFyZSBVUkxcbiAgc21zKGRhdGEsIGlvcyA9IGZhbHNlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogaW9zID8gJ3NtczomJyA6ICdzbXM6PycsXG4gICAgICBkYXRhLFxuICAgIH07XG4gIH0sXG5cbiAgLy8gc2V0IEVtYWlsIHNoYXJlIFVSTFxuICBlbWFpbChkYXRhKSB7XG4gICAgbGV0IHVybCA9ICdtYWlsdG86JztcblxuICAgIC8vIGlmIHRvIGFkZHJlc3Mgc3BlY2lmaWVkIHRoZW4gYWRkIHRvIFVSTFxuICAgIGlmIChkYXRhLnRvICE9PSBudWxsKSB7XG4gICAgICB1cmwgKz0gYCR7ZGF0YS50b31gO1xuICAgIH1cblxuICAgIHVybCArPSAnPyc7XG5cbiAgICByZXR1cm4ge1xuICAgICAgdXJsLFxuICAgICAgZGF0YToge1xuICAgICAgICBzdWJqZWN0OiBkYXRhLnN1YmplY3QsXG4gICAgICAgIGJvZHk6IGRhdGEuYm9keSxcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICAvLyBzZXQgR2l0aHViIGZvcmsgVVJMXG4gIGdpdGh1YihkYXRhLCBpb3MgPSBmYWxzZSkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gICAgbGV0IHVybCA9IGRhdGEucmVwbyA/IGBodHRwczovL2dpdGh1Yi5jb20vJHtkYXRhLnJlcG99YCA6IGRhdGEudXJsO1xuXG4gICAgaWYgKGRhdGEuaXNzdWUpIHtcbiAgICAgIHVybCArPSBgL2lzc3Vlcy9uZXc/dGl0bGU9JHtkYXRhLmlzc3VlfSZib2R5PSR7ZGF0YS5ib2R5fWA7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHVybDogYCR7dXJsfT9gLFxuICAgICAgcG9wdXA6IHtcbiAgICAgICAgd2lkdGg6IDEwMjAsXG4gICAgICAgIGhlaWdodDogMzIzLFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuXG4gIC8vIHNldCBEcmliYmJsZSBzaGFyZSBVUkxcbiAgZHJpYmJibGUoZGF0YSwgaW9zID0gZmFsc2UpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICAgIGNvbnN0IHVybCA9IGRhdGEuc2hvdCA/IGBodHRwczovL2RyaWJiYmxlLmNvbS9zaG90cy8ke2RhdGEuc2hvdH0/YCA6IGAke2RhdGEudXJsfT9gO1xuICAgIHJldHVybiB7XG4gICAgICB1cmwsXG4gICAgICBwb3B1cDoge1xuICAgICAgICB3aWR0aDogNDQwLFxuICAgICAgICBoZWlnaHQ6IDY0MCxcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICBjb2RlcGVuKGRhdGEpIHtcbiAgICBjb25zdCB1cmwgPSAoZGF0YS5wZW4gJiYgZGF0YS51c2VybmFtZSAmJiBkYXRhLnZpZXcpID8gYGh0dHBzOi8vY29kZXBlbi5pby8ke2RhdGEudXNlcm5hbWV9LyR7ZGF0YS52aWV3fS8ke2RhdGEucGVufT9gIDogYCR7ZGF0YS51cmx9P2A7XG4gICAgcmV0dXJuIHtcbiAgICAgIHVybCxcbiAgICAgIHBvcHVwOiB7XG4gICAgICAgIHdpZHRoOiAxMjAwLFxuICAgICAgICBoZWlnaHQ6IDgwMCxcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcblxuICBwYXlwYWwoZGF0YSkge1xuICAgIHJldHVybiB7XG4gICAgICBkYXRhLFxuICAgIH07XG4gIH0sXG59O1xuIl19
