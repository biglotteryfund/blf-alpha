(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

require('./utils');

// configure grant data for map
var grantData = [{
    "name": "South West",
    "id": "south-west",
    "totalAwarded": 36520521.98,
    "numGrants": 1016
}, {
    "name": "Scotland",
    "id": "scotland",
    "totalAwarded": 111276238.98,
    "numGrants": 3008
}, {
    "name": "East Midlands",
    "id": "east-midlands",
    "totalAwarded": 71704233.38999999,
    "numGrants": 851
}, {
    "name": "West Midlands",
    "id": "west-midlands",
    "totalAwarded": 47640121.46,
    "numGrants": 1088
}, {
    "name": "London",
    "id": "london",
    "totalAwarded": 223806798.16999996,
    "numGrants": 1365
}, {
    "name": "East of England",
    "id": "east-england",
    "totalAwarded": 58675152.62999999,
    "numGrants": 674
}, {
    "name": "North East",
    "id": "north-east",
    "totalAwarded": 34707389.940000005,
    "numGrants": 554
}, {
    "name": "Northern Ireland",
    "id": "northern-ireland",
    "totalAwarded": 12851020.13,
    "numGrants": 592
}, {
    "name": "South East Coast",
    "id": "south-east",
    "totalAwarded": 17687173.56,
    "numGrants": 527
}, {
    "name": "Yorkshire and the Humber",
    "id": "yorkshire",
    "totalAwarded": 88337519.25999996,
    "numGrants": 981
}, {
    "name": "South Central",
    "id": "south-west",
    "totalAwarded": 16297303.830000002,
    "numGrants": 389
}, {
    "name": "North West",
    "id": "north-west",
    "totalAwarded": 110342378.00000001,
    "numGrants": 1418
}, {
    "name": "Wales",
    "id": "wales",
    "totalAwarded": 25316250.32,
    "numGrants": 960
}];

// look up a grant by region
var getGrantDataById = function getGrantDataById(id) {
    return grantData.find(function (g) {
        return g.id === id;
    });
};

// turn 32424.23123 => 32,424.23
var formatCurrency = function formatCurrency(n) {
    return n.toFixed(2).replace(/./g, function (c, i, a) {
        return i && c !== "." && (a.length - i) % 3 === 0 ? ',' + c : c;
    });
};

// build html string for map overlay
var makeHTMLPopup = function makeHTMLPopup(data) {
    return '<div class="map-popup-box">\n            <h5>' + data.name + '</h5>\n            <ul>\n                <li><strong>Grants made</strong>: ' + data.numGrants + '</li>\n                <li><strong>Total awarded</strong>: &pound;' + formatCurrency(data.totalAwarded) + '</li>\n            </ul>\n        </div>';
};

var $svg = document.getElementById('js-map-svg');
var $mapInfo = document.getElementById('js-map-info');

$svg.addEventListener('click', function (e) {
    var id = e.target.getAttribute('data-id');
    if (id) {
        var data = getGrantDataById(id);
        if (data) {
            $mapInfo.querySelector('#js-region-name').textContent = data.name;
            $mapInfo.querySelector('#js-num-grants').textContent = data.numGrants;
            $mapInfo.querySelector('#js-num-awards').textContent = '\xA3' + formatCurrency(data.totalAwarded);
            $mapInfo.classList.remove('hidden');
        }
    }
});

// fake a click on the default region
var defaultRegion = document.getElementById('js-initial-region');
var e = document.createEvent('UIEvents');
e.initUIEvent('click', true, true, window, 1);
defaultRegion.dispatchEvent(e);

},{"./utils":2}],2:[function(require,module,exports){
'use strict';

// https://tc39.github.io/ecma262/#sec-array.prototype.find
if (!Array.prototype.find) {
    Object.defineProperty(Array.prototype, 'find', {
        value: function value(predicate) {
            // 1. Let O be ? ToObject(this value).
            if (this == null) {
                throw new TypeError('"this" is null or not defined');
            }

            var o = Object(this);

            // 2. Let len be ? ToLength(? Get(O, "length")).
            var len = o.length >>> 0;

            // 3. If IsCallable(predicate) is false, throw a TypeError exception.
            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }

            // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
            var thisArg = arguments[1];

            // 5. Let k be 0.
            var k = 0;

            // 6. Repeat, while k < len
            while (k < len) {
                // a. Let Pk be ! ToString(k).
                // b. Let kValue be ? Get(O, Pk).
                // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
                // d. If testResult is true, return kValue.
                var kValue = o[k];
                if (predicate.call(thisArg, kValue, k, o)) {
                    return kValue;
                }
                // e. Increase k by 1.
                k++;
            }

            // 7. Return undefined.
            return undefined;
        }
    });
}

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhc3NldHMvanMvbWFpbi5qcyIsImFzc2V0cy9qcy91dGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOztBQUNBLFFBQVEsU0FBUjs7QUFHQTtBQUNBLElBQU0sWUFBWSxDQUNkO0FBQ0ksWUFBUSxZQURaO0FBRUksVUFBTSxZQUZWO0FBR0ksb0JBQWdCLFdBSHBCO0FBSUksaUJBQWE7QUFKakIsQ0FEYyxFQU9kO0FBQ0ksWUFBUSxVQURaO0FBRUksVUFBTSxVQUZWO0FBR0ksb0JBQWdCLFlBSHBCO0FBSUksaUJBQWE7QUFKakIsQ0FQYyxFQWFkO0FBQ0ksWUFBUSxlQURaO0FBRUksVUFBTSxlQUZWO0FBR0ksb0JBQWdCLGlCQUhwQjtBQUlJLGlCQUFhO0FBSmpCLENBYmMsRUFtQmQ7QUFDSSxZQUFRLGVBRFo7QUFFSSxVQUFNLGVBRlY7QUFHSSxvQkFBZ0IsV0FIcEI7QUFJSSxpQkFBYTtBQUpqQixDQW5CYyxFQXlCZDtBQUNJLFlBQVEsUUFEWjtBQUVJLFVBQU0sUUFGVjtBQUdJLG9CQUFnQixrQkFIcEI7QUFJSSxpQkFBYTtBQUpqQixDQXpCYyxFQStCZDtBQUNJLFlBQVEsaUJBRFo7QUFFSSxVQUFNLGNBRlY7QUFHSSxvQkFBZ0IsaUJBSHBCO0FBSUksaUJBQWE7QUFKakIsQ0EvQmMsRUFxQ2Q7QUFDSSxZQUFRLFlBRFo7QUFFSSxVQUFNLFlBRlY7QUFHSSxvQkFBZ0Isa0JBSHBCO0FBSUksaUJBQWE7QUFKakIsQ0FyQ2MsRUEyQ2Q7QUFDSSxZQUFRLGtCQURaO0FBRUksVUFBTSxrQkFGVjtBQUdJLG9CQUFnQixXQUhwQjtBQUlJLGlCQUFhO0FBSmpCLENBM0NjLEVBaURkO0FBQ0ksWUFBUSxrQkFEWjtBQUVJLFVBQU0sWUFGVjtBQUdJLG9CQUFnQixXQUhwQjtBQUlJLGlCQUFhO0FBSmpCLENBakRjLEVBdURkO0FBQ0ksWUFBUSwwQkFEWjtBQUVJLFVB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S0FBYSxDQUF2Qjs7QUFFQTtBQUNBLGdCQUFJLE9BQU8sU0FBUCxLQUFxQixVQUF6QixFQUFxQztBQUNqQyxzQkFBTSxJQUFJLFNBQUosQ0FBYyw4QkFBZCxDQUFOO0FBQ0g7O0FBRUQ7QUFDQSxnQkFBSSxVQUFVLFVBQVUsQ0FBVixDQUFkOztBQUVBO0FBQ0EsZ0JBQUksSUFBSSxDQUFSOztBQUVBO0FBQ0EsbUJBQU8sSUFBSSxHQUFYLEVBQWdCO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQkFBSSxTQUFTLEVBQUUsQ0FBRixDQUFiO0FBQ0Esb0JBQUksVUFBVSxJQUFWLENBQWUsT0FBZixFQUF3QixNQUF4QixFQUFnQyxDQUFoQyxFQUFtQyxDQUFuQyxDQUFKLEVBQTJDO0FBQ3ZDLDJCQUFPLE1BQVA7QUFDSDtBQUNEO0FBQ0E7QUFDSDs7QUFFRDtBQUNBLG1CQUFPLFNBQVA7QUFDSDtBQXZDMEMsS0FBL0M7QUF5Q0giLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xucmVxdWlyZSgnLi91dGlscycpO1xuXG5cbi8vIGNvbmZpZ3VyZSBncmFudCBkYXRhIGZvciBtYXBcbmNvbnN0IGdyYW50RGF0YSA9IFtcbiAgICB7XG4gICAgICAgIFwibmFtZVwiOiBcIlNvdXRoIFdlc3RcIixcbiAgICAgICAgXCJpZFwiOiBcInNvdXRoLXdlc3RcIixcbiAgICAgICAgXCJ0b3RhbEF3YXJkZWRcIjogMzY1MjA1MjEuOTgsXG4gICAgICAgIFwibnVtR3JhbnRzXCI6IDEwMTZcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJuYW1lXCI6IFwiU2NvdGxhbmRcIixcbiAgICAgICAgXCJpZFwiOiBcInNjb3RsYW5kXCIsXG4gICAgICAgIFwidG90YWxBd2FyZGVkXCI6IDExMTI3NjIzOC45OCxcbiAgICAgICAgXCJudW1HcmFudHNcIjogMzAwOFxuICAgIH0sXG4gICAge1xuICAgICAgICBcIm5hbWVcIjogXCJFYXN0IE1pZGxhbmRzXCIsXG4gICAgICAgIFwiaWRcIjogXCJlYXN0LW1pZGxhbmRzXCIsXG4gICAgICAgIFwidG90YWxBd2FyZGVkXCI6IDcxNzA0MjMzLjM4OTk5OTk5LFxuICAgICAgICBcIm51bUdyYW50c1wiOiA4NTFcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJuYW1lXCI6IFwiV2VzdCBNaWRsYW5kc1wiLFxuICAgICAgICBcImlkXCI6IFwid2VzdC1taWRsYW5kc1wiLFxuICAgICAgICBcInRvdGFsQXdhcmRlZFwiOiA0NzY0MDEyMS40NixcbiAgICAgICAgXCJudW1HcmFudHNcIjogMTA4OFxuICAgIH0sXG4gICAge1xuICAgICAgICBcIm5hbWVcIjogXCJMb25kb25cIixcbiAgICAgICAgXCJpZFwiOiBcImxvbmRvblwiLFxuICAgICAgICBcInRvdGFsQXdhcmRlZFwiOiAyMjM4MDY3OTguMTY5OTk5OTYsXG4gICAgICAgIFwibnVtR3JhbnRzXCI6IDEzNjVcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJuYW1lXCI6IFwiRWFzdCBvZiBFbmdsYW5kXCIsXG4gICAgICAgIFwiaWRcIjogXCJlYXN0LWVuZ2xhbmRcIixcbiAgICAgICAgXCJ0b3RhbEF3YXJkZWRcIjogNTg2NzUxNTIuNjI5OTk5OTksXG4gICAgICAgIFwibnVtR3JhbnRzXCI6IDY3NFxuICAgIH0sXG4gICAge1xuICAgICAgICBcIm5hbWVcIjogXCJOb3J0aCBFYXN0XCIsXG4gICAgICAgIFwiaWRcIjogXCJub3J0aC1lYXN0XCIsXG4gICAgICAgIFwidG90YWxBd2FyZGVkXCI6IDM0NzA3Mzg5Ljk0MDAwMDAwNSxcbiAgICAgICAgXCJudW1HcmFudHNcIjogNTU0XG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwibmFtZVwiOiBcIk5vcnRoZXJuIElyZWxhbmRcIixcbiAgICAgICAgXCJpZFwiOiBcIm5vcnRoZXJuLWlyZWxhbmRcIixcbiAgICAgICAgXCJ0b3RhbEF3YXJkZWRcIjogMTI4NTEwMjAuMTMsXG4gICAgICAgIFwibnVtR3JhbnRzXCI6IDU5MlxuICAgIH0sXG4gICAge1xuICAgICAgICBcIm5hbWVcIjogXCJTb3V0aCBFYXN0IENvYXN0XCIsXG4gICAgICAgIFwiaWRcIjogXCJzb3V0aC1lYXN0XCIsXG4gICAgICAgIFwidG90YWxBd2FyZGVkXCI6IDE3Njg3MTczLjU2LFxuICAgICAgICBcIm51bUdyYW50c1wiOiA1MjdcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJuYW1lXCI6IFwiWW9ya3NoaXJlIGFuZCB0aGUgSHVtYmVyXCIsXG4gICAgICAgIFwiaWRcIjogXCJ5b3Jrc2hpcmVcIixcbiAgICAgICAgXCJ0b3RhbEF3YXJkZWRcIjogODgzMzc1MTkuMjU5OTk5OTYsXG4gICAgICAgIFwibnVtR3JhbnRzXCI6IDk4MVxuICAgIH0sXG4gICAge1xuICAgICAgICBcIm5hbWVcIjogXCJTb3V0aCBDZW50cmFsXCIsXG4gICAgICAgIFwiaWRcIjogXCJzb3V0aC13ZXN0XCIsXG4gICAgICAgIFwidG90YWxBd2FyZGVkXCI6IDE2Mjk3MzAzLjgzMDAwMDAwMixcbiAgICAgICAgXCJudW1HcmFudHNcIjogMzg5XG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwibmFtZVwiOiBcIk5vcnRoIFdlc3RcIixcbiAgICAgICAgXCJpZFwiOiBcIm5vcnRoLXdlc3RcIixcbiAgICAgICAgXCJ0b3RhbEF3YXJkZWRcIjogMTEwMzQyMzc4LjAwMDAwMDAxLFxuICAgICAgICBcIm51bUdyYW50c1wiOiAxNDE4XG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwibmFtZVwiOiBcIldhbGVzXCIsXG4gICAgICAgIFwiaWRcIjogXCJ3YWxlc1wiLFxuICAgICAgICBcInRvdGFsQXdhcmRlZFwiOiAyNTMxNjI1MC4zMixcbiAgICAgICAgXCJudW1HcmFudHNcIjogOTYwXG4gICAgfVxuXTtcblxuLy8gbG9vayB1cCBhIGdyYW50IGJ5IHJlZ2lvblxubGV0IGdldEdyYW50RGF0YUJ5SWQgPSAoaWQpID0+IGdyYW50RGF0YS5maW5kKGcgPT4gZy5pZCA9PT0gaWQpO1xuXG4vLyB0dXJuIDMyNDI0LjIzMTIzID0+IDMyLDQyNC4yM1xubGV0IGZvcm1hdEN1cnJlbmN5ID0gZnVuY3Rpb24gKG4pIHtcbiAgICByZXR1cm4gbi50b0ZpeGVkKDIpLnJlcGxhY2UoLy4vZywgZnVuY3Rpb24gKGMsIGksIGEpIHtcbiAgICAgICAgcmV0dXJuIGkgJiYgYyAhPT0gXCIuXCIgJiYgKChhLmxlbmd0aCAtIGkpICUgMyA9PT0gMCkgPyAnLCcgKyBjIDogYztcbiAgICB9KTtcbn07XG5cbi8vIGJ1aWxkIGh0bWwgc3RyaW5nIGZvciBtYXAgb3ZlcmxheVxubGV0IG1ha2VIVE1MUG9wdXAgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgIHJldHVybiBgPGRpdiBjbGFzcz1cIm1hcC1wb3B1cC1ib3hcIj5cbiAgICAgICAgICAgIDxoNT4ke2RhdGEubmFtZX08L2g1PlxuICAgICAgICAgICAgPHVsPlxuICAgICAgICAgICAgICAgIDxsaT48c3Ryb25nPkdyYW50cyBtYWRlPC9zdHJvbmc+OiAke2RhdGEubnVtR3JhbnRzfTwvbGk+XG4gICAgICAgICAgICAgICAgPGxpPjxzdHJvbmc+VG90YWwgYXdhcmRlZDwvc3Ryb25nPjogJnBvdW5kOyR7Zm9ybWF0Q3VycmVuY3koZGF0YS50b3RhbEF3YXJkZWQpfTwvbGk+XG4gICAgICAgICAgICA8L3VsPlxuICAgICAgICA8L2Rpdj5gO1xufTtcblxubGV0ICRzdmcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnanMtbWFwLXN2ZycpO1xubGV0ICRtYXBJbmZvID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2pzLW1hcC1pbmZvJyk7XG5cbiRzdmcuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xuICAgIGxldCBpZCA9IGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1pZCcpO1xuICAgIGlmIChpZCkge1xuICAgICAgICBsZXQgZGF0YSA9IGdldEdyYW50RGF0YUJ5SWQoaWQpO1xuICAgICAgICBpZiAoZGF0YSkge1xuICAgICAgICAgICAgJG1hcEluZm8ucXVlcnlTZWxlY3RvcignI2pzLXJlZ2lvbi1uYW1lJykudGV4dENvbnRlbnQgPSBkYXRhLm5hbWU7XG4gICAgICAgICAgICAkbWFwSW5mby5xdWVyeVNlbGVjdG9yKCcjanMtbnVtLWdyYW50cycpLnRleHRDb250ZW50ID0gZGF0YS5udW1HcmFudHM7XG4gICAgICAgICAgICAkbWFwSW5mby5xdWVyeVNlbGVjdG9yKCcjanMtbnVtLWF3YXJkcycpLnRleHRDb250ZW50ID0gYMKjJHtmb3JtYXRDdXJyZW5jeShkYXRhLnRvdGFsQXdhcmRlZCl9YDtcbiAgICAgICAgICAgICRtYXBJbmZvLmNsYXNzTGlzdC5yZW1vdmUoJ2hpZGRlbicpO1xuICAgICAgICB9XG4gICAgfVxufSk7XG5cbi8vIGZha2UgYSBjbGljayBvbiB0aGUgZGVmYXVsdCByZWdpb25cbmxldCBkZWZhdWx0UmVnaW9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2pzLWluaXRpYWwtcmVnaW9uJyk7XG52YXIgZSA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdVSUV2ZW50cycpO1xuZS5pbml0VUlFdmVudCgnY2xpY2snLCB0cnVlLCB0cnVlLCB3aW5kb3csIDEpO1xuZGVmYXVsdFJlZ2lvbi5kaXNwYXRjaEV2ZW50KGUpOyIsIi8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLWFycmF5LnByb3RvdHlwZS5maW5kXG5pZiAoIUFycmF5LnByb3RvdHlwZS5maW5kKSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEFycmF5LnByb3RvdHlwZSwgJ2ZpbmQnLCB7XG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbihwcmVkaWNhdGUpIHtcbiAgICAgICAgICAgIC8vIDEuIExldCBPIGJlID8gVG9PYmplY3QodGhpcyB2YWx1ZSkuXG4gICAgICAgICAgICBpZiAodGhpcyA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJ0aGlzXCIgaXMgbnVsbCBvciBub3QgZGVmaW5lZCcpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgbyA9IE9iamVjdCh0aGlzKTtcblxuICAgICAgICAgICAgLy8gMi4gTGV0IGxlbiBiZSA/IFRvTGVuZ3RoKD8gR2V0KE8sIFwibGVuZ3RoXCIpKS5cbiAgICAgICAgICAgIHZhciBsZW4gPSBvLmxlbmd0aCA+Pj4gMDtcblxuICAgICAgICAgICAgLy8gMy4gSWYgSXNDYWxsYWJsZShwcmVkaWNhdGUpIGlzIGZhbHNlLCB0aHJvdyBhIFR5cGVFcnJvciBleGNlcHRpb24uXG4gICAgICAgICAgICBpZiAodHlwZW9mIHByZWRpY2F0ZSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ3ByZWRpY2F0ZSBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gNC4gSWYgdGhpc0FyZyB3YXMgc3VwcGxpZWQsIGxldCBUIGJlIHRoaXNBcmc7IGVsc2UgbGV0IFQgYmUgdW5kZWZpbmVkLlxuICAgICAgICAgICAgdmFyIHRoaXNBcmcgPSBhcmd1bWVudHNbMV07XG5cbiAgICAgICAgICAgIC8vIDUuIExldCBrIGJlIDAuXG4gICAgICAgICAgICB2YXIgayA9IDA7XG5cbiAgICAgICAgICAgIC8vIDYuIFJlcGVhdCwgd2hpbGUgayA8IGxlblxuICAgICAgICAgICAgd2hpbGUgKGsgPCBsZW4pIHtcbiAgICAgICAgICAgICAgICAvLyBhLiBMZXQgUGsgYmUgISBUb1N0cmluZyhrKS5cbiAgICAgICAgICAgICAgICAvLyBiLiBMZXQga1ZhbHVlIGJlID8gR2V0KE8sIFBrKS5cbiAgICAgICAgICAgICAgICAvLyBjLiBMZXQgdGVzdFJlc3VsdCBiZSBUb0Jvb2xlYW4oPyBDYWxsKHByZWRpY2F0ZSwgVCwgwqsga1ZhbHVlLCBrLCBPIMK7KSkuXG4gICAgICAgICAgICAgICAgLy8gZC4gSWYgdGVzdFJlc3VsdCBpcyB0cnVlLCByZXR1cm4ga1ZhbHVlLlxuICAgICAgICAgICAgICAgIHZhciBrVmFsdWUgPSBvW2tdO1xuICAgICAgICAgICAgICAgIGlmIChwcmVkaWNhdGUuY2FsbCh0aGlzQXJnLCBrVmFsdWUsIGssIG8pKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBrVmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIGUuIEluY3JlYXNlIGsgYnkgMS5cbiAgICAgICAgICAgICAgICBrKys7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIDcuIFJldHVybiB1bmRlZmluZWQuXG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgfSk7XG59Il19
