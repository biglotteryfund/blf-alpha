'use strict';
const _ = require('lodash');
const materials = require('../../config/content/materials.json');

module.exports = (req, orderKey, code) => {

    const validActions = ['increase', 'decrease', 'remove'];

    // get form parameters
    const id = parseInt(req.params.id);
    const action = req.sanitize('action').escape();

    // look up the item they're adding
    const item = materials.items.find(i => i.id === id);

    // is this a valid item/action?
    if (item && validActions.indexOf(action) !== -1) {

        let maxQuantity = item.maximum;
        let notAllowedWithItemId = item.notAllowedWithItem;

        // get all their current orders
        let orders = _.get(req.session, [orderKey], {});

        // how many of the current item do they have?
        const currentItemQuantity = _.get(req.session, [orderKey, code, 'quantity'], 0);

        // are they blocked from adding this item?
        let hasBlockerItem = false;

        if (notAllowedWithItemId) {
            // check if their current orders contain a blocker
            for (let code in orders) {
                if (orders[code].id === notAllowedWithItemId) {
                    hasBlockerItem = true;
                }
            }
        }

        // can they add more of this item?
        const noSpaceLeft = (currentItemQuantity === maxQuantity);

        if (action === 'increase') {
            if (!noSpaceLeft && !hasBlockerItem) {
                _.set(req.session, [orderKey, code, 'id'], id);
                _.set(req.session, [orderKey, code, 'quantity'], currentItemQuantity + 1);
            }
        } else if (currentItemQuantity > 1 && action === 'decrease') {
            _.set(req.session, [orderKey, code, 'id'], id);
            _.set(req.session, [orderKey, code, 'quantity'], currentItemQuantity - 1);
        } else if (action === 'remove' || (action === 'decrease' && currentItemQuantity === 1)) {
            _.unset(req.session, [orderKey, code]);
            if (Object.keys(req.session[orderKey]).length === 0) {
                delete req.session[orderKey];
            }
        }
    }
};