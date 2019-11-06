import addressLookup from './address-lookup.js';
import budgetInput from './budget-input.js';
import wordCount from './word-count.js';
import saveButton from './save-button';

function init() {
    addressLookup.init();
    budgetInput.init();
    wordCount.init();
    saveButton.init();
}

export default { init };
