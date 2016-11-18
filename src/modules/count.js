/**
 * Generate share count instance from one to many networks
 */

import CountTransforms from './count-transforms';
import Events from './events';
import countReduce from '../../lib/countReduce';
import storeCount from '../../lib/storeCount'; // eslint-disable-line no-unused-vars

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

class Count {
  constructor(type, url) {
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
      this.typeArr.forEach((t) => {
        if (!CountTransforms[t]) {
          throw new Error(`Open Share: ${type} is an invalid count type`);
        }

        this.countData.push(CountTransforms[t](url));
      });

      const count = this.storeGet(`${this.type}-${this.shared}`);

      if (count) {
        if (this.appendTo && typeof this.appendTo !== 'function') {
          this.appendTo.appendChild(this.os);
        }
        countReduce(this.os, count);
      }

      // throw error if invalid type provided
    } else if (!CountTransforms[type]) {
      throw new Error(`Open Share: ${type} is an invalid count type`);

        // single count
        // store count URL and transform function
    } else {
      this.type = type;
      this.countData = CountTransforms[type](url);
    }
  }

  // handle calling getCount / getCounts
  // depending on number of types
  count(os, cb, appendTo) {
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
  getCount() {
    const count = this.storeGet(`${this.type}-${this.shared}`);

    if (count) {
      if (this.appendTo && typeof this.appendTo !== 'function') {
        this.appendTo.appendChild(this.os);
      }
      countReduce(this.os, count);
    }
    this[this.countData.type](this.countData);
  }

  // fetch multiple counts and aggregate
  getCounts() {
    this.total = [];

    const count = this.storeGet(`${this.type}-${this.shared}`);

    if (count) {
      if (this.appendTo && typeof this.appendTo !== 'function') {
        this.appendTo.appendChild(this.os);
      }
      countReduce(this.os, count);
    }

    this.countData.forEach((countData) => {
      this[countData.type](countData, (num) => {
        this.total.push(num);

        // total counts length now equals type array length
        // so aggregate, store and insert into DOM
        if (this.total.length === this.typeArr.length) {
          let tot = 0;

          this.total.forEach((t) => {
            tot += t;
          });

          if (this.appendTo && typeof this.appendTo !== 'function') {
            this.appendTo.appendChild(this.os);
          }

          const local = Number(this.storeGet(`${this.type}-${this.shared}`));
          if (local > tot) {
            // const latestCount = Number(this.storeGet(`${this.type}-${this.shared}-latestCount`));
            // this.storeSet(`${this.type}-${this.shared}-latestCount`, tot);
            //
            // tot = isNumeric(latestCount) && latestCount > 0 ?
            // tot += local - latestCount :
            // tot += local;
            tot = local;
          }
          this.storeSet(`${this.type}-${this.shared}`, tot);

          countReduce(this.os, tot);
        }
      });
    });

    if (this.appendTo && typeof this.appendTo !== 'function') {
      this.appendTo.appendChild(this.os);
    }
  }

  // handle JSONP requests
  jsonp(countData, cb) {
  // define random callback and assign transform function
    const callback = Math.random().toString(36).substring(7).replace(/[^a-zA-Z]/g, '');
    window[callback] = (data) => {
      const count = countData.transform.apply(this, [data]) || 0;

      if (cb && typeof cb === 'function') {
        cb(count);
      } else {
        if (this.appendTo && typeof this.appendTo !== 'function') {
          this.appendTo.appendChild(this.os);
        }
        countReduce(this.os, count, this.cb);
      }

      Events.trigger(this.os, `counted-${this.url}`);
    };

    // append JSONP script tag to page
    const script = document.createElement('script');
    script.src = countData.url.replace('callback=?', `callback=${callback}`);
    document.getElementsByTagName('head')[0].appendChild(script);

    return;
  }

  // handle AJAX GET request
  get(countData, cb) {
    const xhr = new XMLHttpRequest();

    // on success pass response to transform function
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          const count = countData.transform.apply(this, [xhr, Events]) || 0;

          if (cb && typeof cb === 'function') {
            cb(count);
          } else {
            if (this.appendTo && typeof this.appendTo !== 'function') {
              this.appendTo.appendChild(this.os);
            }
            countReduce(this.os, count, this.cb);
          }

          Events.trigger(this.os, `counted-${this.url}`);
          return;
        } else if (countData.url.toLowerCase().indexOf('https://api.openshare.social/job?') === 0) {
          console.warn('Please sign up for Twitter counts at https://openshare.social/twitter/auth');
          const count = 0;

          if (cb && typeof cb === 'function') {
            cb(count);
          } else {
            if (this.appendTo && typeof this.appendTo !== 'function') {
              this.appendTo.appendChild(this.os);
            }
            countReduce(this.os, count, this.cb);
          }

          Events.trigger(this.os, `counted-${this.url}`);
        } else {
          console.warn('Failed to get API data from', countData.url, '. Please use the latest version of OpenShare.');
          const count = 0;

          if (cb && typeof cb === 'function') {
            cb(count);
          } else {
            if (this.appendTo && typeof this.appendTo !== 'function') {
              this.appendTo.appendChild(this.os);
            }
            countReduce(this.os, count, this.cb);
          }

          Events.trigger(this.os, `counted-${this.url}`);
        }
      }
    };

    countData.url = countData.url.startsWith('https://api.openshare.social/job?') && this.key ?
      countData.url + this.key :
      countData.url;

    xhr.open('GET', countData.url);
    xhr.send();
  }

  // handle AJAX POST request
  post(countData, cb) {
    const xhr = new XMLHttpRequest();

    // on success pass response to transform function
    xhr.onreadystatechange = () => {
      if (xhr.readyState !== XMLHttpRequest.DONE ||
        xhr.status !== 200) {
        return;
      }

      const count = countData.transform.apply(this, [xhr]) || 0;

      if (cb && typeof cb === 'function') {
        cb(count);
      } else {
        if (this.appendTo && typeof this.appendTo !== 'function') {
          this.appendTo.appendChild(this.os);
        }
        countReduce(this.os, count, this.cb);
      }
      Events.trigger(this.os, `counted-${this.url}`);
    };

    xhr.open('POST', countData.url);
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xhr.send(JSON.stringify(countData.data));
  }

  storeSet(type, count = 0) {//eslint-disable-line
    if (!window.localStorage || !type) {
      return;
    }

    localStorage.setItem(`OpenShare-${type}`, count);
  }

  storeGet(type) {//eslint-disable-line
    if (!window.localStorage || !type) {
      return;
    }

    return localStorage.getItem(`OpenShare-${type}`);
  }

}

export default Count;
