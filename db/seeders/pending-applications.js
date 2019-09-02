'use strict';
const pendingApplications = require('./data/pending-applications');

module.exports = {
  up: (queryInterface) => {
    return queryInterface.bulkInsert('PendingApplications', pendingApplications.data, {});
  },

  down: (queryInterface) => {
   return queryInterface.bulkDelete('PendingApplications', null, {});
  }
};

