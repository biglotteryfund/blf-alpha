'use strict';

module.exports = function featuredErrors(messages = [], allowList = []) {
    if (messages.length > 0) {
        return messages.filter(message => {
            return allowList.some(item => {
                if (item.includeBaseError) {
                    return item.param === message.param;
                } else {
                    return (
                        item.param === message.param && message.type !== 'base'
                    );
                }
            });
        });
    } else {
        return [];
    }
};
