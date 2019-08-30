'use strict';
const moment = require('moment');
const uuidv4 = require('uuid/v4');
const pendingApplications = require('./data/pending-applications-data.json');

const prepareData = () => {
  pendingApplications.data.forEach(application => {
    application.id = uuidv4();
    application.createdAt = moment().toDate();
    application.updatedAt = moment().toDate();
  });
  pendingApplications.data[0].expiresAt = moment().add('30', 'days').toDate();
  pendingApplications.data[1].expiresAt = moment().add('14', 'days').toDate();
  pendingApplications.data[2].expiresAt = moment().add('2', 'days').toDate();
  pendingApplications.data[3].expiresAt = moment().toDate();
  pendingApplications.data[4].expiresAt = moment().subtract('5', 'days').toDate();
};

module.exports = {
  up: (queryInterface) => {
    prepareData();
    return queryInterface.bulkInsert('PendingApplications', pendingApplications.data, {});
  },

  down: (queryInterface) => {
   return queryInterface.bulkDelete('PendingApplications', null, {});
  }
};

