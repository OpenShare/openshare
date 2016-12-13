(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

/**
 * Trigger custom OpenShare namespaced event
 */

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Events = {
  trigger: function trigger(element, event) {
    var ev = document.createEvent('Event');
    ev.initEvent('OpenShare.' + event, true, true);
    element.dispatchEvent(ev);
  }
};

var analytics = function analytics(type, cb) {
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

function init$1(opts) {
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

/**
 * Object of transform functions for each openshare api
 * Transform functions passed into OpenShare instance when instantiated
 * Return object containing URL and key/value args
 */
var ShareTransforms = {

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
    var ios = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

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
    var ios = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

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
    var ios = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

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
    var ios = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
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

function share(e, os, openShare) {
  // if dynamic instance then fetch attributes again in case of updates
  if (openShare.dynamic) {
    setData(openShare, os);
  }

  openShare.share(e);

  // trigger shared event
  Events.trigger(os, 'shared');
}

// type contains a dash
// transform to camelcase for function reference
// TODO: only supports single dash, should should support multiple
var dashToCamel = function dashToCamel(dash, type) {
  var nextChar = type.substr(dash + 1, 1);
  var group = type.substr(dash, 2);

  type = type.replace(group, nextChar.toUpperCase());
  return type;
};

function initializeShareNode(os) {
  // initialize open share object with type attribute
  var type = os.getAttribute('data-open-share');
  var dash = type.indexOf('-');

  if (dash > -1) {
    type = dashToCamel(dash, type);
  }

  var transform = ShareTransforms[type];

  if (!transform) {
    throw new Error('Open Share: ' + type + ' is an invalid type');
  }

  var openShare = new OpenShare(type, transform);

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

/*
   Sometimes social platforms get confused and drop share counts.
   In this module we check if the returned count is less than the count in
   localstorage.
   If the local count is greater than the returned count,
   we store the local count + the returned count.
   Otherwise, store the returned count.
*/

var storeCount = function storeCount(t, count) {
  var isArr = t.type.indexOf(',') > -1;
  var local = Number(t.storeGet(t.type + '-' + t.shared));

  if (local > count && !isArr) {
    var latestCount = Number(t.storeGet(t.type + '-' + t.shared + '-latestCount'));
    t.storeSet(t.type + '-' + t.shared + '-latestCount', count);

    count = isNumeric$1(latestCount) && latestCount > 0 ? count += local - latestCount : count += local;
  }

  if (!isArr) t.storeSet(t.type + '-' + t.shared, count);
  return count;
};

function isNumeric$1(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

/**
 * Object of transform functions for each openshare api
 * Transform functions passed into OpenShare instance when instantiated
 * Return object containing URL and key/value args
 */
var CountTransforms = {

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
        var count = data.count || 0;
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
        var count = data.count || 0;
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
        var reddit = JSON.parse(xhr.responseText);
        var posts = reddit.data && reddit.data.children || null;
        var ups = 0;

        if (posts) {
          posts.forEach(function (post) {
            ups += Number(post.data.ups);
          });
        }

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
        var google = JSON.parse(xhr.responseText);
        var count = google.result && google.result.metadata && google.result.metadata.globalCounts && google.result.metadata.globalCounts.count || 0;
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
        var count = JSON.parse(xhr.responseText).stargazers_count || 0;
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
        var count = JSON.parse(xhr.responseText).forks_count || 0;
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
        var count = JSON.parse(xhr.responseText).watchers_count || 0;
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
        var _this2 = this;

        var count = JSON.parse(xhr.responseText).length;

        // at this time dribbble limits a response of 12 likes per page
        if (count === 12) {
          var page = 2;
          recursiveCount(url, page, count, function (finalCount) {
            if (_this2.appendTo && typeof _this2.appendTo !== 'function') {
              _this2.appendTo.appendChild(_this2.os);
            }
            countReduce(_this2.os, finalCount, _this2.cb);
            Events.trigger(_this2.os, 'counted-' + _this2.url);
            return storeCount(_this2, finalCount);
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
        var count = JSON.parse(xhr.responseText).count || 0;
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

/**
 * Generate share count instance from one to many networks
 */

var Count = function () {
  function Count(type, url) {
    var _this3 = this;

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

        _this3.countData.push(CountTransforms[t](url));
      });

      var count = this.storeGet(this.type + '-' + this.shared);

      if (count) {
        if (this.appendTo && typeof this.appendTo !== 'function') {
          this.appendTo.appendChild(this.os);
        }
        countReduce(this.os, count);
      }

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
      var _this4 = this;

      this.total = [];

      var count = this.storeGet(this.type + '-' + this.shared);

      if (count) {
        if (this.appendTo && typeof this.appendTo !== 'function') {
          this.appendTo.appendChild(this.os);
        }
        countReduce(this.os, count);
      }

      this.countData.forEach(function (countData) {
        _this4[countData.type](countData, function (num) {
          _this4.total.push(num);

          // total counts length now equals type array length
          // so aggregate, store and insert into DOM
          if (_this4.total.length === _this4.typeArr.length) {
            var tot = 0;

            _this4.total.forEach(function (t) {
              tot += t;
            });

            if (_this4.appendTo && typeof _this4.appendTo !== 'function') {
              _this4.appendTo.appendChild(_this4.os);
            }

            var local = Number(_this4.storeGet(_this4.type + '-' + _this4.shared));
            if (local > tot) {
              // const latestCount = Number(this.storeGet(`${this.type}-${this.shared}-latestCount`));
              // this.storeSet(`${this.type}-${this.shared}-latestCount`, tot);
              //
              // tot = isNumeric(latestCount) && latestCount > 0 ?
              // tot += local - latestCount :
              // tot += local;
              tot = local;
            }
            _this4.storeSet(_this4.type + '-' + _this4.shared, tot);

            countReduce(_this4.os, tot);
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
      var _this5 = this;

      // define random callback and assign transform function
      var callback = Math.random().toString(36).substring(7).replace(/[^a-zA-Z]/g, '');
      window[callback] = function (data) {
        var count = countData.transform.apply(_this5, [data]) || 0;

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
      var _this6 = this;

      var xhr = new XMLHttpRequest();

      // on success pass response to transform function
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            var count = countData.transform.apply(_this6, [xhr, Events]) || 0;

            if (cb && typeof cb === 'function') {
              cb(count);
            } else {
              if (_this6.appendTo && typeof _this6.appendTo !== 'function') {
                _this6.appendTo.appendChild(_this6.os);
              }
              countReduce(_this6.os, count, _this6.cb);
            }

            Events.trigger(_this6.os, 'counted-' + _this6.url);
            return;
          } else if (countData.url.toLowerCase().indexOf('https://api.openshare.social/job?') === 0) {
            console.warn('Please sign up for Twitter counts at https://openshare.social/twitter/auth');
            var _count = 0;

            if (cb && typeof cb === 'function') {
              cb(_count);
            } else {
              if (_this6.appendTo && typeof _this6.appendTo !== 'function') {
                _this6.appendTo.appendChild(_this6.os);
              }
              countReduce(_this6.os, _count, _this6.cb);
            }

            Events.trigger(_this6.os, 'counted-' + _this6.url);
          } else {
            console.warn('Failed to get API data from', countData.url, '. Please use the latest version of OpenShare.');
            var _count2 = 0;

            if (cb && typeof cb === 'function') {
              cb(_count2);
            } else {
              if (_this6.appendTo && typeof _this6.appendTo !== 'function') {
                _this6.appendTo.appendChild(_this6.os);
              }
              countReduce(_this6.os, _count2, _this6.cb);
            }

            Events.trigger(_this6.os, 'counted-' + _this6.url);
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
      var _this7 = this;

      var xhr = new XMLHttpRequest();

      // on success pass response to transform function
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== XMLHttpRequest.DONE || xhr.status !== 200) {
          return;
        }

        var count = countData.transform.apply(_this7, [xhr]) || 0;

        if (cb && typeof cb === 'function') {
          cb(count);
        } else {
          if (_this7.appendTo && typeof _this7.appendTo !== 'function') {
            _this7.appendTo.appendChild(_this7.os);
          }
          countReduce(_this7.os, count, _this7.cb);
        }
        Events.trigger(_this7.os, 'counted-' + _this7.url);
      };

      xhr.open('POST', countData.url);
      xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
      xhr.send(JSON.stringify(countData.data));
    }
  }, {
    key: 'storeSet',
    value: function storeSet(type) {
      var count = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
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

function initializeCountNode(os) {
  // initialize open share object with type attribute
  var type = os.getAttribute('data-open-share-count');
  var url = os.getAttribute('data-open-share-count-repo') || os.getAttribute('data-open-share-count-shot') || os.getAttribute('data-open-share-count-url');
  var count = new Count(type, url);

  count.count(os);
  os.setAttribute('data-open-share-node', type);
}

function init() {
  init$1({
    selector: {
      share: '[data-open-share]:not([data-open-share-node])',
      count: '[data-open-share-count]:not([data-open-share-node])'
    },
    cb: {
      share: initializeShareNode,
      count: initializeCountNode
    }
  })();
}
var DataAttr = function DataAttr() {
  if (document.readyState === 'complete') {
    return init();
  }
  document.addEventListener('readystatechange', function () {
    if (document.readyState === 'complete') {
      init();
    }
  }, false);
};

/**
 * Global OpenShare API to generate instances programmatically
 */
var ShareAPI = function ShareAPI() {
  // global OpenShare referencing internal class for instance generation
  var OpenShare$$1 = function () {
    function OpenShare$$1(data, element) {
      var _this8 = this;

      _classCallCheck(this, OpenShare$$1);

      if (!data.bindClick) data.bindClick = true;

      var dash = data.type.indexOf('-');

      if (dash > -1) {
        data.type = dashToCamel(dash, data.type);
      }

      var node = void 0;
      this.element = element;
      this.data = data;

      this.os = new OpenShare(data.type, ShareTransforms[data.type]);
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
          _this8.share();
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


    _createClass(OpenShare$$1, [{
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

    return OpenShare$$1;
  }();

  return OpenShare$$1;
};

/**
 * count API
 */

var CountAPI = function CountAPI() {
  //eslint-disable-line
  // global OpenShare referencing internal class for instance generation
  var Count$$1 = function Count$$1(_ref, cb) {
    var type = _ref.type;
    var url = _ref.url;
    var _ref$appendTo = _ref.appendTo;
    var appendTo = _ref$appendTo === undefined ? false : _ref$appendTo;
    var element = _ref.element;
    var classes = _ref.classes;
    var _ref$key = _ref.key;
    var key = _ref$key === undefined ? null : _ref$key;

    _classCallCheck(this, Count$$1);

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
      return new Count(type, url).count(countNode, cb, appendTo);
    }

    return new Count(type, url).count(countNode, cb);
  };

  return Count$$1;
};

var browser = function browser() {
  DataAttr(OpenShare, Count, ShareTransforms, Events);
  window.OpenShare = {
    share: ShareAPI(OpenShare, ShareTransforms, Events),
    count: CountAPI(),
    analytics: analytics
  };
};
var browser_js = browser();

module.exports = browser_js;

},{}]},{},[1]);
