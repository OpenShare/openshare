import countReduce from '../../lib/countReduce';
import storeCount from '../../lib/storeCount';
/**
 * Object of transform functions for each openshare api
 * Transform functions passed into OpenShare instance when instantiated
 * Return object containing URL and key/value args
 */
export default {

  // facebook count data
  facebook(url) {
    return {
      type: 'get',
      url: `https://graph.facebook.com/?id=${url}`,
      transform(xhr) {
        const fb = JSON.parse(xhr.responseText);

        const count = (fb.share && fb.share.share_count) || 0;

        return storeCount(this, count);
      },
    };
  },

// pinterest count data
  pinterest(url) {
    return {
      type: 'jsonp',
      url: `https://api.pinterest.com/v1/urls/count.json?callback=?&url=${url}`,
      transform(data) {
        const count = data.count || 0;
        return storeCount(this, count);
      },
    };
  },

  // linkedin count data
  linkedin(url) {
    return {
      type: 'jsonp',
      url: `https://www.linkedin.com/countserv/count/share?url=${url}&format=jsonp&callback=?`,
      transform(data) {
        const count = data.count || 0;
        return storeCount(this, count);
      },
    };
  },

  // reddit count data
  reddit(url) {
    return {
      type: 'get',
      url: `https://www.reddit.com/api/info.json?url=${url}`,
      transform(xhr) {
        const reddit = JSON.parse(xhr.responseText);
        const posts = (reddit.data && reddit.data.children) || null;
        let ups = 0;

        if (posts) {
          posts.forEach((post) => {
            ups += Number(post.data.ups);
          });
        }

        return storeCount(this, ups);
      },
    };
  },

// google count data
  google(url) {
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
          groupId: '@self',
        },
        jsonrpc: '2.0',
        key: 'p',
        apiVersion: 'v1',
      },
      url: 'https://clients6.google.com/rpc',
      transform(xhr) {
        const google = JSON.parse(xhr.responseText);
        const count = (google.result
          && google.result.metadata
          && google.result.metadata.globalCounts
          && google.result.metadata.globalCounts.count) || 0;
        return storeCount(this, count);
      },
    };
  },

  // github star count
  githubStars(repo) {
    repo = repo.indexOf('github.com/') > -1 ?
    repo.split('github.com/')[1] :
    repo;
    return {
      type: 'get',
      url: `https://api.github.com/repos/${repo}`,
      transform(xhr) {
        const count = JSON.parse(xhr.responseText).stargazers_count || 0;
        return storeCount(this, count);
      },
    };
  },

  // github forks count
  githubForks(repo) {
    repo = repo.indexOf('github.com/') > -1 ?
    repo.split('github.com/')[1] :
    repo;
    return {
      type: 'get',
      url: `https://api.github.com/repos/${repo}`,
      transform(xhr) {
        const count = JSON.parse(xhr.responseText).forks_count || 0;
        return storeCount(this, count);
      },
    };
  },

  // github watchers count
  githubWatchers(repo) {
    repo = repo.indexOf('github.com/') > -1 ?
    repo.split('github.com/')[1] :
    repo;
    return {
      type: 'get',
      url: `https://api.github.com/repos/${repo}`,
      transform(xhr) {
        const count = JSON.parse(xhr.responseText).watchers_count || 0;
        return storeCount(this, count);
      },
    };
  },

  // dribbble likes count
  dribbble(shot) {
    shot = shot.indexOf('dribbble.com/shots') > -1 ?
    shot.split('shots/')[1] :
    shot;
    const url = `https://api.dribbble.com/v1/shots/${shot}/likes`;
    return {
      type: 'get',
      url,
      transform(xhr, Events) {
        const count = JSON.parse(xhr.responseText).length;

        // at this time dribbble limits a response of 12 likes per page
        if (count === 12) {
          const page = 2;
          recursiveCount(url, page, count, (finalCount) => {
            if (this.appendTo && typeof this.appendTo !== 'function') {
              this.appendTo.appendChild(this.os);
            }
            countReduce(this.os, finalCount, this.cb);
            Events.trigger(this.os, `counted-${this.url}`);
            return storeCount(this, finalCount);
          });
        } else {
          return storeCount(this, count);
        }
      },
    };
  },

  twitter(url) {
    return {
      type: 'get',
      url: `https://api.openshare.social/job?url=${url}&key=`,
      transform(xhr) {
        const count = JSON.parse(xhr.responseText).count || 0;
        return storeCount(this, count);
      },
    };
  },
};

function recursiveCount(url, page, count, cb) {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', `${url}?page=${page}`);
  xhr.addEventListener('load', function () { //eslint-disable-line
    const likes = JSON.parse(this.response);
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
