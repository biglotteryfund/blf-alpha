// Original source:
// https://github.com/alphagov/govuk_publishing_components/blob/master/app/assets/javascripts/govuk_publishing_components/components/modal-dialogue.js

import forEach from 'lodash/forEach';

const modalStartedAttr = 'data-modal-started';

function ModalDialogue() {}

ModalDialogue.prototype.start = function($module) {
    this.$module = $module;
    this.$dialogBox = this.$module.querySelector('.gem-c-modal-dialogue__box');
    this.$closeButton = this.$module.querySelector(
        '.gem-c-modal-dialogue__close-button'
    );
    this.$body = document.querySelector('body');

    this.$module.open = this.handleOpen.bind(this);
    this.$module.close = this.handleClose.bind(this);
    this.$module.focusDialog = this.handleFocusDialog.bind(this);
    this.$module.boundKeyDown = this.handleKeyDown.bind(this);

    var $triggerElement = document.querySelector(
        '[data-toggle="modal"][data-target="' + this.$module.id + '"]'
    );

    if ($triggerElement) {
        $triggerElement.addEventListener('click', this.$module.open);
    }

    if (this.$closeButton) {
        this.$closeButton.addEventListener('click', this.$module.close);
    }
};

ModalDialogue.prototype.handleOpen = function(event) {
    if (event) {
        event.preventDefault();
    }

    this.$body.classList.add('app-o-template__body--modal');
    this.$body.classList.add('app-o-template__body--blur');
    this.$focusedElementBeforeOpen = document.activeElement;
    this.$module.style.display = 'block';
    this.$dialogBox.focus();

    document.addEventListener('keydown', this.$module.boundKeyDown, true);
};

ModalDialogue.prototype.handleClose = function(event) {
    if (event) {
        event.preventDefault();
    }

    this.$body.classList.remove('app-o-template__body--modal');
    this.$body.classList.remove('app-o-template__body--blur');
    this.$module.style.display = 'none';
    this.$focusedElementBeforeOpen.focus();

    document.removeEventListener('keydown', this.$module.boundKeyDown, true);
};

ModalDialogue.prototype.handleFocusDialog = function() {
    this.$dialogBox.focus();
};

// while open, prevent tabbing to outside the dialogue
// and listen for ESC key to close the dialogue
ModalDialogue.prototype.handleKeyDown = function(event) {
    var KEY_TAB = 9;
    var KEY_ESC = 27;

    switch (event.keyCode) {
        case KEY_TAB:
            if (event.shiftKey) {
                if (document.activeElement === this.$dialogBox) {
                    event.preventDefault();
                    this.$closeButton.focus();
                }
            } else {
                if (document.activeElement === this.$closeButton) {
                    event.preventDefault();
                    this.$dialogBox.focus();
                }
            }

            break;
        case KEY_ESC:
            this.$module.close();
            break;
        default:
            break;
    }
};

function init() {
    const modalElements = document.querySelectorAll('[data-modal]');
    forEach(modalElements, el => {
        const started = el.getAttribute(modalStartedAttr);
        if (!started) {
            const modal = new ModalDialogue();
            modal.start(el);
            el.setAttribute(modalStartedAttr, true);
        }
    });
}

function triggerModal(id) {
    const modal = document.getElementById(id);
    if (modal && modal.open) {
        modal.open();
    }
}

export default {
    init,
    triggerModal
};
