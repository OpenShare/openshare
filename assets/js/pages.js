'use strict';

var openShareNodes = document.querySelectorAll('.open-share-examples [data-open-share]'),
    animationMods = ['square', 'diamond', 'rectangle', 'rectangle-vert', ''];

function animationLoop() {
    // loop through each animation modifier
    animationMods.forEach(function(mod, i, arr) {

        // wait a second in between each animation segment
        setTimeout(function() {

            // loop through open share nodes
            [].forEach.call(openShareNodes, function(node, j) {

                // delay by index * 100ms
                setTimeout(function() {

                    // out of mods so reset
                    if (!mod) {
                        this.setAttribute('class', 'open-share-example');

                        // apply mod
                    } else {
                        this.setAttribute('class', 'open-share-example--' + mod);
                    }

                    // bind node to setTimeout so reference doesn't change on each loop
                }.bind(node), j * 100);
            });
        }, i * 1000);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    setInterval(animationLoop, 6000);
    setTimeout(function() {
		animationLoop();
	}, 1000);
});
