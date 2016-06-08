'use strict';

var openShareNodes = document.querySelectorAll('.open-share-examples [data-open-share]'),
    animationMods = ['square', 'diamond', 'rectangle', 'rectangle-vert', ''],
	burger = document.querySelector('.burger-icon'),
	nav = document.querySelector('.header__nav');

burger.addEventListener('click', function() {
	burger.classList.toggle('active');
	nav.classList.toggle('active');
});

function animationLoop() {
    // loop through each animation modifier
    animationMods.forEach(function(mod, i, arr) {

        // wait a second in between each animation segment
    	var timer = new Timer(function() {

            // loop through open share nodes
            [].forEach.call(openShareNodes, function(node, j) {
                // delay by index * 100ms
                var delay = new Timer(function() {

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

		[].forEach.call(openShareNodes, function(node) {
			node.addEventListener('mouseenter', function () {
				timer.pause();
			});
			node.addEventListener('mouseleave', function () {
				timer.resume();
			});
		});
    });
}

document.addEventListener('DOMContentLoaded', function() {
    var interval = new RecurringTimer(animationLoop, 6000);
	[].forEach.call(openShareNodes, function(node) {
		node.addEventListener('mouseenter', function () {
			interval.pause();
		});
		node.addEventListener('mouseleave', function () {
			interval.resume();
		});
	});
    setTimeout(function() {
		animationLoop();
	}, 1000);
});

function Timer(callback, delay) {
    var timerId, start, remaining = delay;

    this.pause = function() {
        window.clearTimeout(timerId);
        remaining -= new Date() - start;
    };

    this.resume = function() {
        start = new Date();
        window.clearTimeout(timerId);
        timerId = window.setTimeout(callback, remaining);
    };

    this.resume();
}


function RecurringTimer(callback, delay) {
    var timerId, start, remaining = delay;

    this.pause = function() {
        window.clearTimeout(timerId);
        remaining -= new Date() - start;
    };

    var resume = function() {
        start = new Date();
        timerId = window.setTimeout(function() {
            remaining = delay;
            resume();
            callback();
        }, remaining);
    };

    this.resume = resume;

    this.resume();
}
