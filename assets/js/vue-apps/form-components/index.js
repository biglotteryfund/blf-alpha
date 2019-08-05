import addressLookup from './address-lookup.js';
import budgetInput from './budget-input.js';
import wordCount from './word-count.js';

function init() {
    addressLookup.init();
    budgetInput.init();
    wordCount.init();
}

export default { init };
