"use strict";function _classCallCheck(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}var _createClass=function(){function t(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}return function(e,r,n){return r&&t(e.prototype,r),n&&t(e,n),e}}();!function t(e,r,n){function a(s,i){if(!r[s]){if(!e[s]){var u="function"==typeof require&&require;if(!i&&u)return u(s,!0);if(o)return o(s,!0);var c=new Error("Cannot find module '"+s+"'");throw c.code="MODULE_NOT_FOUND",c}var l=r[s]={exports:{}};e[s][0].call(l.exports,function(t){var r=e[s][1][t];return a(r?r:t)},l,l.exports,t,e,r,n)}return r[s].exports}for(var o="function"==typeof require&&require,s=0;s<n.length;s++)a(n[s]);return a}({1:[function(t,e,r){!function(){var e=t("./modules/data-attr"),r=t("./modules/api"),n=t("./modules/events"),a=t("./modules/open-share"),o=t("./modules/transforms"),s=t("./modules/count");e(a,s,o,n),r(a,o,n)}()},{"./modules/api":2,"./modules/count":3,"./modules/data-attr":4,"./modules/events":5,"./modules/open-share":6,"./modules/transforms":7}],2:[function(t,e,r){e.exports=function(t,e,r){function n(r,n){var a=this;this.element=r,this.data=n,this.os=new t(n.type,e[n.type]),this.os.setData(n),this.data.bindClick&&this.element.addEventListener("click",function(t){a.share()})}n.prototype.share=function(t){this.data.dynamic&&this.os.setData(data),this.os.share(t),r.trigger(this.element,"shared")},window.OpenShare=n}},{}],3:[function(t,e,r){e.exports=function(){function t(e,r){var n=this;if(_classCallCheck(this,t),!r)throw new Error("Open Share: no url provided for count");if(e.indexOf(",")>-1)this.type=e,this.typeArr=this.type.split(","),this.countData=[],this.typeArr.forEach(function(t){if(!n[t])throw new Error("Open Share: "+e+" is an invalid count type");n.countData.push(n[t](r))});else{if(!this[e])throw new Error("Open Share: "+e+" is an invalid count type");this.type=e,this.countData=this[e](r)}}return _createClass(t,[{key:"count",value:function(t){this.os=t,Array.isArray(this.countData)?this.getCounts():this.getCount()}},{key:"getCount",value:function(){var t=this.storeGet(this.type);t&&(this.os.innerHTML=t),this[this.countData.type](this.countData)}},{key:"getCounts",value:function(){var t=this;this.total=[];var e=this.storeGet(this.type);e&&(this.os.innerHTML=e),this.countData.forEach(function(e){t[e.type](e,function(e){if(t.total.push(e),t.total.length===t.typeArr.length){var r=0;t.total.forEach(function(t){r+=t}),t.storeSet(t.type,r),t.os.innerHTML=r}})}),this.os.innerHTML=this.total}},{key:"jsonp",value:function(t,e){var r=this,n="jsonp_"+Math.random().toString().substr(-10);window[n]=function(n){var a=t.transform(n)||0;e&&"function"==typeof e?e(a):r.os.innerHTML=a};var a=document.createElement("script");a.src=t.url.replace("callback=?","callback="+n),document.getElementsByTagName("head")[0].appendChild(a)}},{key:"get",value:function(t,e){var r=this,n=new XMLHttpRequest;n.onreadystatechange=function(){if(n.readyState===XMLHttpRequest.DONE&&200===n.status){var a=t.transform(n)||0;e&&"function"==typeof e?e(a):r.os.innerHTML=a}},n.open("GET",t.url),n.send()}},{key:"post",value:function(t,e){var r=this,n=new XMLHttpRequest;n.onreadystatechange=function(){if(n.readyState===XMLHttpRequest.DONE&&200===n.status){var a=t.transform(n)||0;e&&"function"==typeof e?e(a):r.os.innerHTML=a}},n.open("POST",t.url),n.setRequestHeader("Content-Type","application/json;charset=UTF-8"),n.send(JSON.stringify(t.data))}},{key:"storeSet",value:function(t){var e=arguments.length<=1||void 0===arguments[1]?0:arguments[1];window.localStorage&&t&&localStorage.setItem("OpenShare-"+t,e)}},{key:"storeGet",value:function(t){return window.localStorage&&t?localStorage.getItem("OpenShare-"+t):void 0}},{key:"facebook",value:function(t){var e=this;return{type:"get",url:"http://graph.facebook.com/?id="+t,transform:function(t){var r=JSON.parse(t.responseText).shares;return e.storeSet(e.type,r),r}}}},{key:"pinterest",value:function(t){var e=this;return{type:"jsonp",url:"http://api.pinterest.com/v1/urls/count.json?callback=?&url="+t,transform:function(t){var r=t.count;return e.storeSet(e.type,r),r}}}},{key:"linkedin",value:function(t){var e=this;return{type:"jsonp",url:"http://www.linkedin.com/countserv/count/share?url="+t+"&format=jsonp&callback=?",transform:function(t){var r=t.count;return e.storeSet(e.type,r),r}}}},{key:"reddit",value:function(t){var e=this;return{type:"get",url:"https://www.reddit.com/api/info.json?url="+t,transform:function(t){var r=JSON.parse(t.responseText).data.children,n=0;return r.forEach(function(t){n+=Number(t.data.ups)}),e.storeSet(e.type,n),n}}}},{key:"google",value:function(t){var e=this;return{type:"post",data:{method:"pos.plusones.get",id:"p",params:{nolog:!0,id:t,source:"widget",userId:"@viewer",groupId:"@self"},jsonrpc:"2.0",key:"p",apiVersion:"v1"},url:"https://clients6.google.com/rpc",transform:function(t){var r=JSON.parse(t.responseText).result.metadata.globalCounts.count;return e.storeSet(e.type,r),r}}}}]),t}()},{}],4:[function(t,e,r){e.exports=function(t,e,r,n){function a(){o(),void 0!==window.MutationObserver&&u(document.querySelectorAll("[data-open-share-watch]"))}function o(){var t=arguments.length<=0||void 0===arguments[0]?document:arguments[0],e=t.querySelectorAll("[data-open-share]:not([data-open-share-node])");[].forEach.call(e,i);var r=t.querySelectorAll("[data-open-share-count]:not([data-open-share-node])");[].forEach.call(r,s),n.trigger(document,"loaded")}function s(t){var r=t.getAttribute("data-open-share-count"),n=new e(r,t.getAttribute("data-open-share-count-url"));n.count(t),t.setAttribute("data-open-share-node",r)}function i(e){var n=e.getAttribute("data-open-share"),a=n.indexOf("-"),o=void 0;if(a>-1){var s=n.substr(a+1,1),i=n.substr(a,2);n=n.replace(i,s.toUpperCase())}var u=r[n];if(!u)throw new Error("Open Share: "+n+" is an invalid type");o=new t(n,u),e.getAttribute("data-open-share-dynamic")&&(o.dynamic=!0),l(o,e),e.addEventListener("click",function(t){c(t,e,o)}),e.addEventListener("OpenShare.trigger",function(t){c(t,e,o)}),e.setAttribute("data-open-share-node",n)}function u(t){[].forEach.call(t,function(t){var e=new MutationObserver(function(t){o(t[0].target)});e.observe(t,{childList:!0})})}function c(t,e,r){r.dynamic&&l(r,e),r.share(t),n.trigger(e,"shared")}function l(t,e){t.setData({url:e.getAttribute("data-open-share-url"),text:e.getAttribute("data-open-share-text"),via:e.getAttribute("data-open-share-via"),hashtags:e.getAttribute("data-open-share-hashtags"),tweetId:e.getAttribute("data-open-share-tweet-id"),related:e.getAttribute("data-open-share-related"),screenName:e.getAttribute("data-open-share-screen-name"),userId:e.getAttribute("data-open-share-user-id"),link:e.getAttribute("data-open-share-link"),picture:e.getAttribute("data-open-share-picture"),caption:e.getAttribute("data-open-share-caption"),description:e.getAttribute("data-open-share-description"),user:e.getAttribute("data-open-share-user"),video:e.getAttribute("data-open-share-video"),username:e.getAttribute("data-open-share-username"),title:e.getAttribute("data-open-share-title"),media:e.getAttribute("data-open-share-media"),to:e.getAttribute("data-open-share-to"),subject:e.getAttribute("data-open-share-subject"),body:e.getAttribute("data-open-share-body"),mobile:e.getAttribute("data-open-share-mobile")})}document.addEventListener("OpenShare.load",a),document.addEventListener("DOMContentLoaded",a)}},{}],5:[function(t,e,r){e.exports={trigger:function(t,e){var r=document.createEvent("Event");r.initEvent("OpenShare."+e,!0,!0),t.dispatchEvent(r)}}},{}],6:[function(t,e,r){e.exports=function(){function t(e,r){_classCallCheck(this,t),this.ios=/iPad|iPhone|iPod/.test(navigator.userAgent)&&!window.MSStream,this.type=e,this.dynamic=!1,this.transform=r,this.typeCaps=e.charAt(0).toUpperCase()+e.slice(1)}return _createClass(t,[{key:"setData",value:function(t){if(this.ios){var e=this.transform(t,!0);this.mobileShareUrl=this.template(e.url,e.data)}var r=this.transform(t);this.shareUrl=this.template(r.url,r.data)}},{key:"share",value:function(t){var e=this;if(this.mobileShareUrl){var r=(new Date).valueOf();setTimeout(function(){var t=(new Date).valueOf();t-r>1600||(window.location=e.shareUrl)},1500),window.location=this.mobileShareUrl}else"email"===this.type?window.location=this.shareUrl:window.open(this.shareUrl,"OpenShare")}},{key:"template",value:function(t,e){var r=t,n=void 0;for(n in e)e[n]&&(e[n]=encodeURIComponent(e[n]),r+=n+"="+e[n]+"&");return r.substr(0,r.length-1)}}]),t}()},{}],7:[function(t,e,r){e.exports={twitter:function(t){var e=arguments.length<=1||void 0===arguments[1]?!1:arguments[1];if(e&&t.ios){var r="";if(t.text&&(r+=t.text),t.url&&(r+=" - "+t.url),t.hashtags){var n=t.hashtags.split(",");n.forEach(function(t){r+=" #"+t})}return t.via&&(r+=" via "+t.via),{url:"twitter://post?",data:{message:r}}}return{url:"https://twitter.com/share?",data:t}},twitterRetweet:function(t){var e=arguments.length<=1||void 0===arguments[1]?!1:arguments[1];return e&&t.ios?{url:"twitter://status?",data:{id:t.tweetId}}:{url:"https://twitter.com/intent/retweet?",data:{tweet_id:t.tweetId,related:t.related}}},twitterLike:function(t){var e=arguments.length<=1||void 0===arguments[1]?!1:arguments[1];return e&&t.ios?{url:"twitter://status?",data:{id:t.tweetId}}:{url:"https://twitter.com/intent/favorite?",data:{tweet_id:t.tweetId,related:t.related}}},twitterFollow:function(t){var e=arguments.length<=1||void 0===arguments[1]?!1:arguments[1];if(e&&t.ios){var r=t.screenName?{screen_name:t.screenName}:{id:t.userId};return{url:"twitter://user?",data:r}}return{url:"https://twitter.com/intent/user?",data:{screen_name:t.screenName,user_id:t.userId}}},facebook:function(t){return{url:"https://www.facebook.com/dialog/feed?app_id=961342543922322&redirect_uri=http://facebook.com&",data:t}},facebookSend:function(t){return{url:"https://www.facebook.com/dialog/send?app_id=961342543922322&redirect_uri=http://facebook.com&",data:t}},youtube:function(t){var e=arguments.length<=1||void 0===arguments[1]?!1:arguments[1];return e&&t.ios?{url:"youtube:"+t.video+"?"}:{url:"https://www.youtube.com/watch?v="+t.video+"?"}},youtubeSubscribe:function(t){var e=arguments.length<=1||void 0===arguments[1]?!1:arguments[1];return e&&t.ios?{url:"youtube://www.youtube.com/user/"+t.user+"?"}:{url:"https://www.youtube.com/user/"+t.user+"?"}},instagram:function(t){return{url:"instagram://camera?"}},instagramFollow:function(t){var e=arguments.length<=1||void 0===arguments[1]?!1:arguments[1];return e&&t.ios?{url:"instagram://user?",data:t}:{url:"http://www.instagram.com/"+t.username+"?"}},snapchat:function(t){return{url:"snapchat://add/"+t.username+"?"}},google:function(t){return{url:"https://plus.google.com/share?",data:t}},pinterest:function(t){return{url:"https://pinterest.com/pin/create/bookmarklet/?",data:t}},linkedin:function(t){return{url:"http://www.linkedin.com/shareArticle?",data:t}},buffer:function(t){return{url:"http://bufferapp.com/add?",data:t}},tumblr:function(t){return{url:"https://www.tumblr.com/widgets/share/tool?",data:t}},reddit:function(t){return{url:"http://reddit.com/submit?",data:t}},flickr:function(t){var e=arguments.length<=1||void 0===arguments[1]?!1:arguments[1];return e&&t.ios?{url:"flickr://photos/"+t.username+"?"}:{url:"http://www.flickr.com/photos/"+t.username+"?"}},whatsapp:function(t){return{url:"whatsapp://send?",data:t}},sms:function(t){var e=arguments.length<=1||void 0===arguments[1]?!1:arguments[1];return{url:e?"sms:&":"sms:?",data:t}},email:function(t){var e="mailto:";return null!==t.to&&(e+=""+t.to),e+="?",{url:e,data:{subject:t.subject,body:t.body}}}}},{}]},{},[1]);