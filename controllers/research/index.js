const express = require('express');
const routeStatic = require('../utils/routeStatic');

const router = express.Router();

module.exports = (pages, sectionPath, sectionId) => {
    routeStatic.init({
        router,
        pages,
        sectionPath,
        sectionId
    });

    return router;
};
