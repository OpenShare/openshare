function init() {
    require('./lib/init')({
		api: 'share',
		selector: '[data-open-share]:not([data-open-share-node])',
		cb: require('./lib/initializeShareNode')
	})();
}
module.exports = function() {
    if (document.readyState === "complete") {
        init();
    }
    document.addEventListener("readystatechange", function() {
        if (document.readyState === "complete") {
            init();
        }
    },false);
    return require('./src/modules/count-api')();
};
