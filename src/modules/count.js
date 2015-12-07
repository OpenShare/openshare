/**
* OpenShare generates a single share link
*/
module.exports = class Count {

    constructor(type, url) {
        // throw error if invalid type provided
        if (!this[type]) {
            throw new Error(`Open Share: ${type} is an invalid count type`);
        }

        // throw error if no url provided
        if (!url) {
            throw new Error(`Open Share: no url provided for count`);
        }

        // store count URL and transform function
        this.countData = this[type](url);
    }

    // fetch count either AJAX or JSONP
    getCount(os) {
        this[this.countData.type](os);
    }

    // handle JSONP requests
    jsonp(os) {
        // define random callback and assign transform function
        let callback = `jsonp_${Math.random().toString().substr(-10)}`;
        window[callback] = (data) => {
            os.innerHTML = this.countData.transform(data);
        };

        // append JSONP script tag to page
        let script = document.createElement('script');
        script.src = this.countData.url.replace('callback=?', `callback=${callback}`);
        document.getElementsByTagName('head')[0].appendChild(script);

        return;
    }

    // handle AJAX GET request
    get(os) {
        let xhr = new XMLHttpRequest();

        // on success pass response to transform function
        xhr.onreadystatechange = () => {
            if (xhr.readyState !== XMLHttpRequest.DONE ||
                xhr.status !== 200) {
                return;
            }

            os.innerHTML = this.countData.transform(xhr);
        };

        xhr.open('GET', this.countData.url);
        xhr.send();
    }

    // handle AJAX POST request
    post(os) {
        let xhr = new XMLHttpRequest();

        // on success pass response to transform function
        xhr.onreadystatechange = () => {
            if (xhr.readyState !== XMLHttpRequest.DONE ||
                xhr.status !== 200) {
                return;
            }

            os.innerHTML = this.countData.transform(xhr);
        };

        xhr.open('POST', this.countData.url);
        xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        xhr.send(JSON.stringify(this.countData.data));
    }

    // facebook count data
    facebook(url) {
        return {
            type: 'get',
            url: `http://graph.facebook.com/?id=${url}`,
            transform: function(xhr) {
                return JSON.parse(xhr.responseText).shares;
            }
        };
    }

    // pinterest count data
    pinterest(url) {
        return {
            type: 'jsonp',
            url: `http://api.pinterest.com/v1/urls/count.json?callback=?&url=${url}`,
            transform: function(data) {
                return data.count;
            }
        };
    }

    // linkedin count data
    linkedin(url) {
        return {
            type: 'jsonp',
            url: `http://www.linkedin.com/countserv/count/share?url=${url}&format=jsonp&callback=?`,
            transform: function(data) {
                return data.count;
            }
        };
    }

    // reddit count data
    reddit(url) {
        return {
            type: 'get',
            url: `https://www.reddit.com/api/info.json?url=${url}`,
            transform: function(xhr) {
                let posts = JSON.parse(xhr.responseText).data.children,
                    ups = 0;

                posts.forEach((post) => {
                    ups += Number(post.data.ups);
                });

                return ups;
            }
        };
    }

    // linkedin count data
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
                    groupId: '@self'
                },
                jsonrpc: '2.0',
                key: 'p',
                apiVersion: 'v1'
            },
            url: `https://clients6.google.com/rpc`,
            transform: function(xhr) {
                return JSON.parse(xhr.responseText).result.metadata.globalCounts.count;
            }
        };
    }

};
