/**
 * OpenShare generates a single share link
 */
export default class OpenShare {

  constructor(type, transform) {
    this.ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    this.type = type;
    this.dynamic = false;
    this.transform = transform;

    // capitalized type
    this.typeCaps = type.charAt(0).toUpperCase() + type.slice(1);
  }

  // returns function named as type set in constructor
  // e.g twitter()
  setData(data) {
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
  share() {
    // if iOS share URL has been set then use timeout hack
    // test for native app and fall back to web
    if (this.mobileShareUrl) {
      const start = (new Date()).valueOf();

      setTimeout(() => {
        const end = (new Date()).valueOf();

        // if the user is still here, fall back to web
        if (end - start > 1600) {
          return;
        }

        window.location = this.shareUrl;
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
  template(url, data) {//eslint-disable-line
    const nonURLProps = [
      'appendTo',
      'innerHTML',
      'classes',
    ];

    let shareUrl = url,
      i;

    for (i in data) {
      // only append valid properties
      if (!data[i] || nonURLProps.indexOf(i) > -1) {
        continue; //eslint-disable-line
      }

      // append URL encoded GET param to share URL
      data[i] = encodeURIComponent(data[i]);
      shareUrl += `${i}=${data[i]}&`;
    }

    return shareUrl.substr(0, shareUrl.length - 1);
  }

  // center popup window supporting dual screens
  openWindow(url, options) {//eslint-disable-line
    const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : screen.left,
      dualScreenTop = window.screenTop !== undefined ? window.screenTop : screen.top,
      width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width,//eslint-disable-line
      height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height,//eslint-disable-line
      left = ((width / 2) - (options.width / 2)) + dualScreenLeft,
      top = ((height / 2) - (options.height / 2)) + dualScreenTop,
      newWindow = window.open(url, 'OpenShare', `width=${options.width}, height=${options.height}, top=${top}, left=${left}`);

    // Puts focus on the newWindow
    if (window.focus) {
      newWindow.focus();
    }
  }
}
