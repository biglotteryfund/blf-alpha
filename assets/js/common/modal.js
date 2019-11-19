// Original source:
// https://github.com/alphagov/govuk_publishing_components/blob/master/app/assets/javascripts/govuk_publishing_components/components/modal-dialogue.js
// See https://github.com/alphagov/govuk-design-system-backlog/issues/30 for more

import forEach from 'lodash/forEach';

function ModalDialogue() {}

ModalDialogue.prototype.start = function($module) {
    this.$module = $module;
    this.$dialogBox = this.$module.querySelector('.js-modal-dialog');
    this.$closeButton = this.$module.querySelector(
        '.js-modal-dialog-close-button--main'
    );
    this.$allCloseButtons = this.$module.querySelectorAll(
        '.js-modal-dialog-close-button'
    );
    this.$body = document.querySelector('body');

    this.$module.open = this.handleOpen.bind(this);
    this.$module.close = this.handleClose.bind(this);
    this.$module.focusDialog = this.handleFocusDialog.bind(this);
    this.$module.boundKeyDown = this.handleKeyDown.bind(this);

    const $triggerElement = document.querySelector(
        '[data-toggle="modal"][data-target="' + this.$module.id + '"]'
    );

    if ($triggerElement) {
        $triggerElement.addEventListener('click', this.$module.open);
    }

    if (this.$allCloseButtons) {
        forEach(this.$allCloseButtons, el => {
            el.addEventListener('click', this.$module.close);
        });
    }
};

ModalDialogue.prototype.handleOpen = function(event) {
    if (event) {
        event.preventDefault();
    }

    // Close any currently-open modal
    const currentOpenModal = this.$body.querySelector(
        '[data-modal-open="true"]'
    );
    if (currentOpenModal) {
        currentOpenModal.close();
    }

    this.$body.classList.add('is-modal');
    this.$focusedElementBeforeOpen = document.activeElement;
    this.$module.style.display = 'block';
    this.$module.setAttribute('data-modal-open', true);
    this.$dialogBox.focus();

    document.addEventListener('keydown', this.$module.boundKeyDown, true);
};

ModalDialogue.prototype.handleClose = function(event) {
    if (event) {
        event.preventDefault();
    }

    this.$body.classList.remove('is-modal');
    this.$module.style.display = 'none';
    this.$module.removeAttribute('data-modal-open');
    this.$focusedElementBeforeOpen.focus();

    document.removeEventListener('keydown', this.$module.boundKeyDown, true);
};

ModalDialogue.prototype.handleFocusDialog = function() {
    this.$dialogBox.focus();
};

// while open, prevent tabbing to outside the dialogue
// and listen for ESC key to close the dialogue
ModalDialogue.prototype.handleKeyDown = function(event) {
    const KEY_TAB = 9;
    const KEY_ESC = 27;

    switch (event.keyCode) {
        // @TODO in modals without close buttons it's possible to tab into the document below
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
            if (this.$closeButton) {
                this.$module.close();
            }
            break;
        default:
            break;
    }
};

function init() {
    const modalStartedAttr = 'data-modal-started';
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
