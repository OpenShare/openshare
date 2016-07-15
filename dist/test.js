"use strict";function _classCallCheck(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}var _createClass=function(){function t(t,e){for(var n=0;n<e.length;n++){var a=e[n];a.enumerable=a.enumerable||!1,a.configurable=!0,"value"in a&&(a.writable=!0),Object.defineProperty(t,a.key,a)}}return function(e,n,a){return n&&t(e.prototype,n),a&&t(e,a),e}}();!function t(e,n,a){function r(i,s){if(!n[i]){if(!e[i]){var u="function"==typeof require&&require;if(!s&&u)return u(i,!0);if(o)return o(i,!0);var c=new Error("Cannot find module '"+i+"'");throw c.code="MODULE_NOT_FOUND",c}var d=n[i]={exports:{}};e[i][0].call(d.exports,function(t){var n=e[i][1][t];return r(n?n:t)},d,d.exports,t,e,n,a)}return n[i].exports}for(var o="function"==typeof require&&require,i=0;i<a.length;i++)r(a[i]);return r}({1:[function(t,e,n){function a(t,e,n){n--,window.ga?(e&&e(),o(function(e){var n=e.target.getAttribute("data-open-share"),a=e.target.getAttribute("data-open-share-link")||e.target.getAttribute("data-open-share-url")||e.target.getAttribute("data-open-share-username")||e.target.getAttribute("data-open-share-center")||e.target.getAttribute("data-open-share-search")||e.target.getAttribute("data-open-share-body");"ga"===t&&ga("send","event",{eventCategory:"OpenShare Click",eventAction:n,eventLabel:a,transport:"beacon"}),"ga-social"===t&&ga("send",{hitType:"social",socialNetwork:n,socialAction:"share",socialTarget:a})})):n&&setTimeout(function(){a(t,e,n)},5e3)}function r(t){t&&t(),window.dataLayer=window.dataLayer||[],o(s),i(function(t){var e=t.target?t.target.innerHTML:t.innerHTML,n=t.target?t.target.getAttribute("data-open-share"):t.getAttribute("data-open-share");window.dataLayer.push({event:"OpenShare Count",platform:n,resource:e,activity:"count"})})}function o(t){[].forEach.call(document.querySelectorAll("[data-open-share]"),function(e){e.addEventListener("OpenShare.shared",t)})}function i(t){var e=document.querySelectorAll("[data-open-share-count]");[].forEach.call(e,function(e){e.textContent?t(e):e.addEventListener("OpenShare.counted-"+e.getAttribute("data-open-share-count-url"),t)})}function s(t){var e=t.target.getAttribute("data-open-share"),n=t.target.getAttribute("data-open-share-link")||t.target.getAttribute("data-open-share-url");window.dataLayer.push({event:"OpenShare Share",platform:e,resource:n,activity:"share"})}e.exports=function(t,e){var n=10;document.addEventListener("DOMContentLoaded",function(){var o="ga"===t||"ga-social"===t,i="tagManager"===t;o&&a(t,e,n),i&&r(e)})}},{}],2:[function(t,e,n){e.exports=function(){return document.addEventListener("DOMContentLoaded",t("./lib/init")({api:"count",selector:"[data-open-share-count]:not([data-open-share-node])",cb:t("./lib/initializeCountNode")})),t("./src/modules/count-api")()}()},{"./lib/init":5,"./lib/initializeCountNode":6,"./src/modules/count-api":14}],3:[function(t,e,n){function a(t,e){if("number"!=typeof t)throw new TypeError("Expected value to be a number");var n=e>0?"e":"e-",a=e>0?"e-":"e";return e=Math.abs(e),Number(Math.round(t+n+e)+a+e)}function r(t){return a(t/1e3,1)+"K"}function o(t){return a(t/1e6,1)+"M"}function i(t,e,n){e>999999?(t.innerHTML=o(e),n&&"function"==typeof n&&n(t)):e>999?(t.innerHTML=r(e),n&&"function"==typeof n&&n(t)):(t.innerHTML=e,n&&"function"==typeof n&&n(t))}e.exports=i},{}],4:[function(t,e,n){e.exports=function(t,e){var n=e.substr(t+1,1),a=e.substr(t,2);return e=e.replace(a,n.toUpperCase())}},{}],5:[function(t,e,n){function a(t){return function(){var e=r({api:t.api||null,container:t.container||document,selector:t.selector,cb:t.cb});e(),void 0!==window.MutationObserver&&o(document.querySelectorAll("[data-open-share-watch]"),e)}}var r=t("./initializeNodes"),o=t("./initializeWatcher");e.exports=a},{"./initializeNodes":7,"./initializeWatcher":9}],6:[function(t,e,n){function a(t){var e=t.getAttribute("data-open-share-count"),n=t.getAttribute("data-open-share-count-repo")||t.getAttribute("data-open-share-count-shot")||t.getAttribute("data-open-share-count-url"),a=new r(e,n);a.count(t),t.setAttribute("data-open-share-node",e)}var r=t("../src/modules/count");e.exports=a},{"../src/modules/count":16}],7:[function(t,e,n){function a(t){return function(){if(t.api){var e=t.container.querySelectorAll(t.selector);[].forEach.call(e,t.cb),r.trigger(document,t.api+"-loaded")}else{var n=t.container.querySelectorAll(t.selector.share);[].forEach.call(n,t.cb.share),r.trigger(document,"share-loaded");var a=t.container.querySelectorAll(t.selector.count);[].forEach.call(a,t.cb.count),r.trigger(document,"count-loaded")}}}var r=t("../src/modules/events");e.exports=a},{"../src/modules/events":17}],8:[function(t,e,n){function a(t){var e=t.getAttribute("data-open-share"),n=e.indexOf("-"),a=void 0;n>-1&&(e=u(n,e));var c=r[e];if(!c)throw new Error("Open Share: "+e+" is an invalid type");a=new o(e,c),t.getAttribute("data-open-share-dynamic")&&(a.dynamic=!0),i(a,t),t.addEventListener("click",function(e){s(e,t,a)}),t.addEventListener("OpenShare.trigger",function(e){s(e,t,a)}),t.setAttribute("data-open-share-node",e)}var r=t("../src/modules/share-transforms"),o=t("../src/modules/open-share"),i=t("./setData"),s=t("./share"),u=t("./dashToCamel");e.exports=a},{"../src/modules/open-share":18,"../src/modules/share-transforms":20,"./dashToCamel":4,"./setData":10,"./share":11}],9:[function(t,e,n){function a(t,e){[].forEach.call(t,function(t){var n=new MutationObserver(function(t){e(t[0].target)});n.observe(t,{childList:!0})})}e.exports=a},{}],10:[function(t,e,n){function a(t,e){t.setData({url:e.getAttribute("data-open-share-url"),text:e.getAttribute("data-open-share-text"),via:e.getAttribute("data-open-share-via"),hashtags:e.getAttribute("data-open-share-hashtags"),tweetId:e.getAttribute("data-open-share-tweet-id"),related:e.getAttribute("data-open-share-related"),screenName:e.getAttribute("data-open-share-screen-name"),userId:e.getAttribute("data-open-share-user-id"),link:e.getAttribute("data-open-share-link"),picture:e.getAttribute("data-open-share-picture"),caption:e.getAttribute("data-open-share-caption"),description:e.getAttribute("data-open-share-description"),user:e.getAttribute("data-open-share-user"),video:e.getAttribute("data-open-share-video"),username:e.getAttribute("data-open-share-username"),title:e.getAttribute("data-open-share-title"),media:e.getAttribute("data-open-share-media"),to:e.getAttribute("data-open-share-to"),subject:e.getAttribute("data-open-share-subject"),body:e.getAttribute("data-open-share-body"),ios:e.getAttribute("data-open-share-ios"),type:e.getAttribute("data-open-share-type"),center:e.getAttribute("data-open-share-center"),views:e.getAttribute("data-open-share-views"),zoom:e.getAttribute("data-open-share-zoom"),search:e.getAttribute("data-open-share-search"),saddr:e.getAttribute("data-open-share-saddr"),daddr:e.getAttribute("data-open-share-daddr"),directionsmode:e.getAttribute("data-open-share-directions-mode"),repo:e.getAttribute("data-open-share-repo"),shot:e.getAttribute("data-open-share-shot"),pen:e.getAttribute("data-open-share-pen"),view:e.getAttribute("data-open-share-view"),issue:e.getAttribute("data-open-share-issue"),buttonId:e.getAttribute("data-open-share-buttonId")})}e.exports=a},{}],11:[function(t,e,n){function a(t,e,n){n.dynamic&&o(n,e),n.share(t),r.trigger(e,"shared")}var r=t("../src/modules/events"),o=t("./setData");e.exports=a},{"../src/modules/events":17,"./setData":10}],12:[function(t,e,n){function a(t){return!isNaN(parseFloat(t))&&isFinite(t)}e.exports=function(t,e){var n=t.type.indexOf(",")>-1,r=Number(t.storeGet(t.type+"-"+t.shared));if(r>e&&!n){var o=Number(t.storeGet(t.type+"-"+t.shared+"-latestCount"));t.storeSet(t.type+"-"+t.shared+"-latestCount",e),e=e+=a(o)&&o>0?r-o:r}return n||t.storeSet(t.type+"-"+t.shared,e),e}},{}],13:[function(t,e,n){e.exports=function(){return document.addEventListener("DOMContentLoaded",t("./lib/init")({api:"share",selector:"[data-open-share]:not([data-open-share-node])",cb:t("./lib/initializeShareNode")})),t("./src/modules/share-api")()}()},{"./lib/init":5,"./lib/initializeShareNode":8,"./src/modules/share-api":19}],14:[function(t,e,n){var a=t("./count");e.exports=function(){var t=function e(t,n){var r=t.type,o=t.url,i=t.appendTo,s=void 0!==i&&i,u=t.element,c=t.classes;_classCallCheck(this,e);var d=document.createElement(u||"span");return d.setAttribute("data-open-share-count",r),d.setAttribute("data-open-share-count-url",o),d.classList.add("open-share-count"),c&&Array.isArray(c)&&c.forEach(function(t){d.classList.add(t)}),s?new a(r,o).count(d,n,s):new a(r,o).count(d,n)};return t}},{"./count":16}],15:[function(t,e,n){function a(t,e,n,r){var o=new XMLHttpRequest;o.open("GET",t+"?page="+e),o.addEventListener("load",function(){var o=JSON.parse(this.response);n+=o.length,12===o.length?(e++,a(t,e,n,r)):r(n)}),o.send()}var r=t("../../lib/countReduce"),o=t("../../lib/storeCount");e.exports={facebook:function(t){return{type:"get",url:"//graph.facebook.com/?id="+t,transform:function(t){var e=JSON.parse(t.responseText).shares;return o(this,e)}}},pinterest:function(t){return{type:"jsonp",url:"//api.pinterest.com/v1/urls/count.json?callback=?&url="+t,transform:function(t){var e=t.count;return o(this,e)}}},linkedin:function(t){return{type:"jsonp",url:"//www.linkedin.com/countserv/count/share?url="+t+"&format=jsonp&callback=?",transform:function(t){var e=t.count;return o(this,e)}}},reddit:function(t){return{type:"get",url:"//www.reddit.com/api/info.json?url="+t,transform:function(t){var e=JSON.parse(t.responseText).data.children,n=0;return e.forEach(function(t){n+=Number(t.data.ups)}),o(this,n)}}},google:function(t){return{type:"post",data:{method:"pos.plusones.get",id:"p",params:{nolog:!0,id:t,source:"widget",userId:"@viewer",groupId:"@self"},jsonrpc:"2.0",key:"p",apiVersion:"v1"},url:"https://clients6.google.com/rpc",transform:function(t){var e=JSON.parse(t.responseText).result.metadata.globalCounts.count;return o(this,e)}}},githubStars:function(t){return t=t.indexOf("github.com/")>-1?t.split("github.com/")[1]:t,{type:"get",url:"//api.github.com/repos/"+t,transform:function(t){var e=JSON.parse(t.responseText).stargazers_count;return o(this,e)}}},githubForks:function(t){return t=t.indexOf("github.com/")>-1?t.split("github.com/")[1]:t,{type:"get",url:"//api.github.com/repos/"+t,transform:function(t){var e=JSON.parse(t.responseText).forks_count;return o(this,e)}}},githubWatchers:function(t){return t=t.indexOf("github.com/")>-1?t.split("github.com/")[1]:t,{type:"get",url:"//api.github.com/repos/"+t,transform:function(t){var e=JSON.parse(t.responseText).watchers_count;return o(this,e)}}},dribbble:function(t){t=t.indexOf("dribbble.com/shots")>-1?t.split("shots/")[1]:t;var e="https://api.dribbble.com/v1/shots/"+t+"/likes";return{type:"get",url:e,transform:function(t,n){var i=this,s=JSON.parse(t.responseText).length;if(12!==s)return o(this,s);var u=2;a(e,u,s,function(t){return i.appendTo&&"function"!=typeof i.appendTo&&i.appendTo.appendChild(i.os),r(i.os,t,i.cb),n.trigger(i.os,"counted-"+i.url),o(i,t)})}}},twitter:function(t){return{type:"get",url:"//api.openshare.social/jobs?url="+t,transform:function(t){var e=JSON.parse(t.responseText).count;return o(this,e)}}}}},{"../../lib/countReduce":3,"../../lib/storeCount":12}],16:[function(t,e,n){function a(t){return!isNaN(parseFloat(t))&&isFinite(t)}var r=t("./count-transforms"),o=t("./events"),i=t("../../lib/countReduce");t("../../lib/storeCount");e.exports=function(){function t(e,n){var a=this;if(_classCallCheck(this,t),!n)throw new Error("Open Share: no url provided for count");if(0===e.indexOf("github")&&("github-stars"===e?e="githubStars":"github-forks"===e?e="githubForks":"github-watchers"===e?e="githubWatchers":console.error("Invalid Github count type. Try github-stars, github-forks, or github-watchers.")),e.indexOf(",")>-1)this.type=e,this.typeArr=this.type.split(","),this.countData=[],this.typeArr.forEach(function(t){if(!r[t])throw new Error("Open Share: "+e+" is an invalid count type");a.countData.push(r[t](n))});else{if(!r[e])throw new Error("Open Share: "+e+" is an invalid count type");this.type=e,this.countData=r[e](n)}}return _createClass(t,[{key:"count",value:function(t,e,n){this.os=t,this.appendTo=n,this.cb=e,this.url=this.os.getAttribute("data-open-share-count"),this.shared=this.os.getAttribute("data-open-share-count-url"),Array.isArray(this.countData)?this.getCounts():this.getCount()}},{key:"getCount",value:function(){var t=this.storeGet(this.type+"-"+this.shared);t&&(this.appendTo&&"function"!=typeof this.appendTo&&this.appendTo.appendChild(this.os),i(this.os,t)),this[this.countData.type](this.countData)}},{key:"getCounts",value:function(){var t=this;this.total=[];var e=this.storeGet(this.type+"-"+this.shared);e&&(this.appendTo&&"function"!=typeof this.appendTo&&this.appendTo.appendChild(this.os),i(this.os,e)),this.countData.forEach(function(e){t[e.type](e,function(e){if(t.total.push(e),t.total.length===t.typeArr.length){var n=0;t.total.forEach(function(t){n+=t}),t.appendTo&&"function"!=typeof t.appendTo&&t.appendTo.appendChild(t.os);var r=Number(t.storeGet(t.type+"-"+t.shared));if(r>n){var o=Number(t.storeGet(t.type+"-"+t.shared+"-latestCount"));t.storeSet(t.type+"-"+t.shared+"-latestCount",n),n=n+=a(o)&&o>0?r-o:r}t.storeSet(t.type+"-"+t.shared,n),i(t.os,n)}})}),this.appendTo&&"function"!=typeof this.appendTo&&this.appendTo.appendChild(this.os)}},{key:"jsonp",value:function(t,e){var n=this,a=Math.random().toString(36).substring(7).replace(/[^a-zA-Z]/g,"");window[a]=function(a){var r=t.transform.apply(n,[a])||0;e&&"function"==typeof e?e(r):(n.appendTo&&"function"!=typeof n.appendTo&&n.appendTo.appendChild(n.os),i(n.os,r,n.cb)),o.trigger(n.os,"counted-"+n.url)};var r=document.createElement("script");r.src=t.url.replace("callback=?","callback="+a),document.getElementsByTagName("head")[0].appendChild(r)}},{key:"get",value:function(t,e){var n=this,a=new XMLHttpRequest;a.onreadystatechange=function(){if(4===a.readyState)if(200===a.status){var r=t.transform.apply(n,[a,o])||0;e&&"function"==typeof e?e(r):(n.appendTo&&"function"!=typeof n.appendTo&&n.appendTo.appendChild(n.os),i(n.os,r,n.cb)),o.trigger(n.os,"counted-"+n.url)}else console.error("Failed to get API data from",t.url,". Please use the latest version of OpenShare.")},a.open("GET",t.url),a.send()}},{key:"post",value:function(t,e){var n=this,a=new XMLHttpRequest;a.onreadystatechange=function(){if(a.readyState===XMLHttpRequest.DONE&&200===a.status){var r=t.transform.apply(n,[a])||0;e&&"function"==typeof e?e(r):(n.appendTo&&"function"!=typeof n.appendTo&&n.appendTo.appendChild(n.os),i(n.os,r,n.cb)),o.trigger(n.os,"counted-"+n.url)}},a.open("POST",t.url),a.setRequestHeader("Content-Type","application/json;charset=UTF-8"),a.send(JSON.stringify(t.data))}},{key:"storeSet",value:function(t){var e=arguments.length<=1||void 0===arguments[1]?0:arguments[1];window.localStorage&&t&&localStorage.setItem("OpenShare-"+t,e)}},{key:"storeGet",value:function(t){if(window.localStorage&&t)return localStorage.getItem("OpenShare-"+t)}}]),t}()},{"../../lib/countReduce":3,"../../lib/storeCount":12,"./count-transforms":15,"./events":17}],17:[function(t,e,n){e.exports={trigger:function(t,e){var n=document.createEvent("Event");n.initEvent("OpenShare."+e,!0,!0),t.dispatchEvent(n)}}},{}],18:[function(t,e,n){e.exports=function(){function t(e,n){_classCallCheck(this,t),this.ios=/iPad|iPhone|iPod/.test(navigator.userAgent)&&!window.MSStream,this.type=e,this.dynamic=!1,this.transform=n,this.typeCaps=e.charAt(0).toUpperCase()+e.slice(1)}return _createClass(t,[{key:"setData",value:function(t){if(this.ios){var e=this.transform(t,!0);this.mobileShareUrl=this.template(e.url,e.data)}var n=this.transform(t);this.shareUrl=this.template(n.url,n.data)}},{key:"share",value:function(t){var e=this;if(this.mobileShareUrl){var n=(new Date).valueOf();setTimeout(function(){var t=(new Date).valueOf();t-n>1600||(window.location=e.shareUrl)},1500),window.location=this.mobileShareUrl}else"email"===this.type?window.location=this.shareUrl:window.open(this.shareUrl,"OpenShare")}},{key:"template",value:function(t,e){var n=["appendTo","innerHTML","classes"],a=t,r=void 0;for(r in e)!e[r]||n.indexOf(r)>-1||(e[r]=encodeURIComponent(e[r]),a+=r+"="+e[r]+"&");return a.substr(0,a.length-1)}}]),t}()},{}],19:[function(t,e,n){var a=t("./open-share"),r=t("./share-transforms"),o=t("./events"),i=t("../../lib/dashToCamel");e.exports=function(){var t=function(){function t(e,n){var o=this;_classCallCheck(this,t),e.bindClick||(e.bindClick=!0);var s=e.type.indexOf("-");s>-1&&(e.type=i(s,e.type));var u=void 0;if(this.element=n,this.data=e,this.os=new a(e.type,r[e.type]),this.os.setData(e),n&&!e.element||(n=e.element,u=document.createElement(n||"a"),e.type&&(u.classList.add("open-share-link",e.type),u.setAttribute("data-open-share",e.type),u.setAttribute("data-open-share-node",e.type)),e.innerHTML&&(u.innerHTML=e.innerHTML)),u&&(n=u),e.bindClick&&n.addEventListener("click",function(t){o.share()}),e.appendTo&&e.appendTo.appendChild(n),e.classes&&Array.isArray(e.classes)&&e.classes.forEach(function(t){n.classList.add(t)}),"paypal"===e.type.toLowerCase()){var c=e.sandbox?"https://www.sandbox.paypal.com/cgi-bin/webscr":"https://www.paypal.com/cgi-bin/webscr",d=e.sandbox?"https://www.sandbox.paypal.com/en_US/i/btn/btn_buynow_LG.gif":"https://www.paypalobjects.com/en_US/i/btn/btn_buynow_LG.gif",p=e.sandbox?"https://www.sandbox.paypal.com/en_US/i/scr/pixel.gif":"https://www.paypalobjects.com/en_US/i/scr/pixel.gif",l="<form action="+c+' method="post" target="_blank">\n\n\t\t\t\t  <!-- Saved buttons use the "secure click" command -->\n\t\t\t\t  <input type="hidden" name="cmd" value="_s-xclick">\n\n\t\t\t\t  <!-- Saved buttons are identified by their button IDs -->\n\t\t\t\t  <input type="hidden" name="hosted_button_id" value="'+e.buttonId+'">\n\n\t\t\t\t  <!-- Saved buttons display an appropriate button image. -->\n\t\t\t\t  <input type="image" name="submit"\n\t\t\t\t    src='+d+'\n\t\t\t\t    alt="PayPal - The safer, easier way to pay online">\n\t\t\t\t  <img alt="" width="1" height="1"\n\t\t\t\t    src='+p+" >\n\n\t\t\t\t</form>",h=document.createElement("div");h.style.display="none",h.innerHTML=l,document.body.appendChild(h),this.paypal=h.querySelector("form")}return this.element=n,n}return _createClass(t,[{key:"share",value:function(t){this.data.dynamic&&this.os.setData(data),"paypal"===this.data.type.toLowerCase()?this.paypal.submit():this.os.share(t),o.trigger(this.element,"shared")}}]),t}();return t}},{"../../lib/dashToCamel":4,"./events":17,"./open-share":18,"./share-transforms":20}],20:[function(t,e,n){e.exports={twitter:function(t){var e=!(arguments.length<=1||void 0===arguments[1])&&arguments[1];if(e&&t.ios){var n="";if(t.text&&(n+=t.text),t.url&&(n+=" - "+t.url),t.hashtags){var a=t.hashtags.split(",");a.forEach(function(t){n+=" #"+t})}return t.via&&(n+=" via "+t.via),{url:"twitter://post?",data:{message:n}}}return{url:"https://twitter.com/share?",data:t}},twitterRetweet:function(t){var e=!(arguments.length<=1||void 0===arguments[1])&&arguments[1];return e&&t.ios?{url:"twitter://status?",data:{id:t.tweetId}}:{url:"https://twitter.com/intent/retweet?",data:{tweet_id:t.tweetId,related:t.related}}},twitterLike:function(t){var e=!(arguments.length<=1||void 0===arguments[1])&&arguments[1];return e&&t.ios?{url:"twitter://status?",data:{id:t.tweetId}}:{url:"https://twitter.com/intent/favorite?",data:{tweet_id:t.tweetId,related:t.related}}},twitterFollow:function(t){var e=!(arguments.length<=1||void 0===arguments[1])&&arguments[1];if(e&&t.ios){var n=t.screenName?{screen_name:t.screenName}:{id:t.userId};return{url:"twitter://user?",data:n}}return{url:"https://twitter.com/intent/user?",data:{screen_name:t.screenName,user_id:t.userId}}},facebook:function(t){return{url:"https://www.facebook.com/dialog/feed?app_id=961342543922322&redirect_uri=http://facebook.com&",data:t}},facebookSend:function(t){return{url:"https://www.facebook.com/dialog/send?app_id=961342543922322&redirect_uri=http://facebook.com&",data:t}},youtube:function(t){var e=!(arguments.length<=1||void 0===arguments[1])&&arguments[1];return e&&t.ios?{url:"youtube:"+t.video+"?"}:{url:"https://www.youtube.com/watch?v="+t.video+"?"}},youtubeSubscribe:function(t){var e=!(arguments.length<=1||void 0===arguments[1])&&arguments[1];return e&&t.ios?{url:"youtube://www.youtube.com/user/"+t.user+"?"}:{url:"https://www.youtube.com/user/"+t.user+"?"}},instagram:function(t){return{url:"instagram://camera?"}},instagramFollow:function(t){var e=!(arguments.length<=1||void 0===arguments[1])&&arguments[1];return e&&t.ios?{url:"instagram://user?",data:t}:{url:"http://www.instagram.com/"+t.username+"?"}},snapchat:function(t){return{url:"snapchat://add/"+t.username+"?"}},google:function(t){return{url:"https://plus.google.com/share?",data:t}},googleMaps:function(t){var e=!(arguments.length<=1||void 0===arguments[1])&&arguments[1];return t.search&&(t.q=t.search,delete t.search),e&&t.ios?{url:"comgooglemaps://?",data:e}:(!e&&t.ios&&delete t.ios,{url:"https://maps.google.com/?",data:t})},pinterest:function(t){return{url:"https://pinterest.com/pin/create/bookmarklet/?",data:t}},linkedin:function(t){return{url:"http://www.linkedin.com/shareArticle?",data:t}},buffer:function(t){return{url:"http://bufferapp.com/add?",data:t}},tumblr:function(t){return{url:"https://www.tumblr.com/widgets/share/tool?",data:t}},reddit:function(t){return{url:"http://reddit.com/submit?",data:t}},flickr:function(t){var e=!(arguments.length<=1||void 0===arguments[1])&&arguments[1];return e&&t.ios?{url:"flickr://photos/"+t.username+"?"}:{url:"http://www.flickr.com/photos/"+t.username+"?"}},whatsapp:function(t){return{url:"whatsapp://send?",data:t}},sms:function(t){var e=!(arguments.length<=1||void 0===arguments[1])&&arguments[1];return{url:e?"sms:&":"sms:?",data:t}},email:function(t){var e="mailto:";return null!==t.to&&(e+=""+t.to),e+="?",{url:e,data:{subject:t.subject,body:t.body}}},github:function(t){var e=(!(arguments.length<=1||void 0===arguments[1])&&arguments[1],t.repo?"https://github.com/"+t.repo:t.url);return t.issue&&(e+="/issues/new?title="+t.issue+"&body="+t.body),{url:e+"?"}},dribbble:function(t){var e=(!(arguments.length<=1||void 0===arguments[1])&&arguments[1],t.shot?"https://dribbble.com/shots/"+t.shot+"?":t.url+"?");return{url:e}},codepen:function(t){var e=t.pen&&t.username&&t.view?"https://codepen.io/"+t.username+"/"+t.view+"/"+t.pen+"?":t.url+"?";return{url:e}},paypal:function(t){return{data:t}}}},{}],21:[function(t,e,n){function a(t){var e=document.createElement("a");e.classList.add("open-share-link","twitter"),e.setAttribute("data-open-share","twitter"),e.setAttribute("data-open-share-url",t.url),e.setAttribute("data-open-share-via",t.via),e.setAttribute("data-open-share-text",t.text),e.setAttribute("data-open-share-hashtags",t.hashtags),e.innerHTML='<span class="fa fa-twitter"></span>'+t.button;new s.share({type:"twitter",url:"http://www.digitalsurgeons.com",via:"digitalsurgeons",hashtags:"forwardobsessed",appendTo:document.querySelector(".open-share-watch"),innerHTML:"Created via OpenShareAPI",element:"div",classes:["wow","such","classes"]});return e}function r(){var t=u;document.querySelector(".open-share-watch").appendChild(a(t))}function o(){new s.count({type:"facebook",url:"https://www.digitalsurgeons.com/"},function(t){var e=new s.share({type:"twitter",url:"http://www.digitalsurgeons.com",via:"digitalsurgeons",hashtags:"forwardobsessed",innerHTML:"Created via OpenShareAPI",element:"div",classes:["wow","such","classes"]});document.querySelector(".create-node.w-count").appendChild(e),e.appendChild(t)})}function i(){var t=document.querySelector(".create-node.count-nodes"),e=t.querySelector("input.count-type").value,n=t.querySelector("input.count-url").value;new s.count({type:e,url:n,appendTo:t,classes:["test"]},function(t){t.style.position="relative"}),t.querySelector("input.count-type").value="",t.querySelector("input.count-url").value=""}var s={share:t("../share.js"),count:t("../count.js"),analytics:t("../analytics.js")};s.analytics("tagManager",function(){console.log("tag manager loaded")}),s.analytics("ga",function(){console.log("google analytics loaded")}),s.analytics("ga-social",function(){console.log("google analytics loaded")});var u={url:"http://www.digitalsurgeons.com",via:"digitalsurgeons",text:"Forward Obsessed",hashtags:"forwardobsessed",button:"Open Share Watcher!"};window.addNode=r,window.addNodeWithCount=o,window.createCountNode=i,new s.share({type:"googleMaps",center:"40.765819,-73.975866",view:"traffic",zoom:14,appendTo:document.body,innerHTML:"Maps"}),new s.share({type:"twitter-follow",screenName:"digitalsurgeons",userId:"18189130",appendTo:document.body,innerHTML:"Follow Test"}),new s.share({type:"paypal",buttonId:"2P3RJYEFL7Z62",sandbox:!0,appendTo:document.body,innerHTML:"PayPal Test"}),document.addEventListener("OpenShare.count-loaded",function(){console.log("OpenShare (count) loaded")}),document.addEventListener("OpenShare.share-loaded",function(){console.log("OpenShare (share) loaded"),[].forEach.call(document.querySelectorAll("[data-open-share]"),function(t){t.addEventListener("OpenShare.shared",function(t){console.log("Open Share Shared",t)})});({twitter:new s.share({type:"twitter",bindClick:!0,url:"http://digitalsurgeons.com",via:"digitalsurgeons",text:"Digital Surgeons",hashtags:"forwardobsessed"},document.querySelector('[data-api-example="twitter"]')),facebook:new s.share({type:"facebook",bindClick:!0,link:"http://digitalsurgeons.com",picture:"http://www.digitalsurgeons.com/img/about/bg_office_team.jpg",caption:"Digital Surgeons",description:"forwardobsessed"},document.querySelector('[data-api-example="facebook"]')),pinterest:new s.share({type:"pinterest",bindClick:!0,url:"http://digitalsurgeons.com",media:"http://www.digitalsurgeons.com/img/about/bg_office_team.jpg",description:"Digital Surgeons",appendTo:document.body},document.querySelector('[data-api-example="pinterest"]')),email:new s.share({type:"email",bindClick:!0,to:"techroom@digitalsurgeons.com",subject:"Digital Surgeons",body:"Forward Obsessed"},document.querySelector('[data-api-example="email"]'))})});var c=["facebook","google","linkedin","reddit","pinterest",["google","linkedin","reddit","pinterest"]];c.forEach(function(t){Array.isArray(t)&&(t=t.join(","));var e=document.querySelectorAll('[data-open-share-count="'+t+'"]');[].forEach.call(e,function(e){e.addEventListener("OpenShare.counted-"+t,function(){var n=e.innerHTML;n&&console.log(t,"shares: ",n)})})})},{"../analytics.js":1,"../count.js":2,"../share.js":13}]},{},[21]);