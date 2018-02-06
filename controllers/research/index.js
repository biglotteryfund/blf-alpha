const express = require('express');
const routeStatic = require('../utils/routeStatic');
const addSection = require('../../middleware/addSection');

const router = express.Router();

module.exports = (pages, sectionPath, sectionId) => {
    router.use(addSection(sectionId));

    routeStatic.init({
        router,
        pages,
        sectionPath,
        sectionId
    });

    return router;
};
