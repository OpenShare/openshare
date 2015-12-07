/**
* OpenShare generates a single share link
*/
module.exports = class Count {

    constructor(type) {

        // throw error if invalid type provided
        if (!this[type]) {
            throw new Error(`Open Share: ${type} is an invalid count type`);
        }

        this.countData = this[type]();
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

    facebook(data) {
        return {
            url: 'http://graph.facebook.com/?id=http://digitalsurgeons.com',
            transform: function(xhr) {
                return JSON.parse(xhr.responseText).shares;
            }
        };
    }

};
