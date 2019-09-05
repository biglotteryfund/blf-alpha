'use strict';
const { prepareSeeds } = require('./data/pending-applications');

module.exports = {
  up: async (queryInterface) => {
    const applications = await prepareSeeds();

    return queryInterface.bulkInsert('PendingApplications', applications, {});
  },

  down: (queryInterface) => {
   return queryInterface.bulkDelete('PendingApplications', null, {});
  }
};

