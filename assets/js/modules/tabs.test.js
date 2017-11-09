/* eslint-env mocha */

'use strict';
const chai = require('chai');
const expect = chai.expect;

const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const dom = new JSDOM(
    `
    <ul class="js-tabset" id="js-tab-test-broken"></ul>

    <ul class="js-tabset" data-paneset="js-tab-test-panes" id="js-tab-test">
        <li><a class="js-tab" href="#js-tab-pane-foo">Item one</a></li>
        <li><a class="js-tab tab--active" href="#js-tab-pane-bar">Item two</a></li>
    </ul>
    <div class="js-paneset" id="js-tab-test-panes">
        <section id="js-tab-pane-foo">Foo content</section>
        <section id="js-tab-pane-bar">Bar content</section>
    </div>

    <ul class="js-tabset" data-paneset="js-tab-test-panes-2" id="js-tab-test-2">
        <li><a class="js-tab" href="#js-tab-pane-foo-2">Item one</a></li>
        <li><a class="js-tab tab--active" href="#js-tab-pane-bar-2">Item two</a></li>
    </ul>

    <div class="js-paneset" id="js-tab-test-panes-2">
        <section id="js-tab-pane-foo-2">Foo content</section>
        <section id="js-tab-pane-bar-2">Bar content</section>
    </div>
`,
    {
        url: 'https://example.org/'
    }
);

global.window = dom.window;
global.document = dom.window.document;

// JSDOM doesn't have an implementation for this so stub it.
window.HTMLElement.prototype.scrollIntoView = function() {};

const tabs = require('./tabs');

let getClassesFromElm = elm => {
    let classes = [];
    if (elm && elm.classList) {
        [].forEach.call(elm.classList, c => classes.push(c));
    }
    return classes;
};

describe('Tab module', () => {
    // get first tab module
    let tabModule = document.getElementById('js-tab-test');

    // find a wrongly-configured tab module
    let tabModuleBroken = document.getElementById('js-tab-test-broken');

    tabs.init();

    it('registers new tab modules', () => {
        expect(tabModule.querySelectorAll('.tab--active').length).to.equal(1);
    });

    it('does not modify incorrectly configured tab modules', () => {
        expect(tabModuleBroken.querySelectorAll('.tab--active').length).to.equal(0);
    });

    it('adds a class to a tab when clicked', () => {
        let tabLink = tabModule.querySelector('a');
        tabLink.click();
        expect(getClassesFromElm(tabLink)).to.contain('tab--active');
    });

    it('removes a class from other tabs when one is clicked', () => {
        let tabs = tabModule.querySelectorAll('li');
        let t1 = tabs[1].querySelector('a');
        let t2 = tabs[0].querySelector('a');
        t1.click(); // first click tab 2
        t2.click(); // now click tab 1
        expect(getClassesFromElm(t2)).to.contain('tab--active');
        expect(getClassesFromElm(t1)).not.to.contain('tab--active');
    });

    it('adds a class to the correct pane when a tab is clicked', () => {
        let tabs = tabModule.querySelectorAll('li');
        let link = tabs[1].querySelector('a');
        link.click();
        let pane = document.querySelector(link.getAttribute('href'));
        expect(getClassesFromElm(pane)).to.contain('pane--active');
    });

    it('removes a class from other panes when a tab is clicked', () => {
        let tabs = tabModule.querySelectorAll('li');
        let t1 = tabs[1].querySelector('a');
        let t2 = tabs[0].querySelector('a');
        t1.click(); // first click tab 1
        t2.click(); // next click tab 2
        let activePane = document.querySelector(t2.getAttribute('href'));
        let inactivePane = document.querySelector(t1.getAttribute('href'));
        expect(getClassesFromElm(activePane)).to.contain('pane--active');
        expect(getClassesFromElm(inactivePane)).not.to.contain('pane--active');
    });
});
