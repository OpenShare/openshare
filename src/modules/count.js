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

        this.countData = this[type](url);
    }

    getCount(os) {
        let xhr = new XMLHttpRequest();

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

    facebook(url) {
        return {
            url: `http://graph.facebook.com/?id=${url}`,
            transform: function(xhr) {
                return JSON.parse(xhr.responseText).shares;
            }
        };
    }

};
