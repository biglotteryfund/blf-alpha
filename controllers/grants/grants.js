'use strict';
const { concat } = require('lodash');
const MongoClient = require('mongodb').MongoClient;

const url = 'mongodb://localhost:27017';
const dbName = 'grants';
const collectionName = 'blf';

async function connectToMongo() {
    try {
        let client = await MongoClient.connect(url);
        return client.db(dbName);
    } catch (err) {
        console.log(err.stack);
        return err;
    }
}

function aggregate(db, pipeline) {
    return db
        .collection(collectionName)
        .aggregate(pipeline);
        // .limit(200);
}

function getFacetsPipeline() {
    return [
        {
            $facet: {
                organisationType: [
                    {
                        $group: {
                            _id: '$BIGField_Organisation_Type',
                            count: { $sum: 1 }
                        }
                    }
                ],
                amount: [
                    {
                        $bucket: {
                            groupBy: '$Amount Awarded',
                            boundaries: [
                                0,
                                500,
                                1000,
                                2000,
                                5000,
                                10000,
                                20000,
                                50000,
                                100000,
                                200000,
                                500000,
                                1000000
                            ],
                            default: 1000000,
                            output: {
                                count: { $sum: 1 }
                            }
                        }
                    }
                ],
                grantProgramme: [
                    {
                        $group: {
                            _id: '$Grant Programme:Title',
                            count: { $sum: 1 }
                        }
                    }
                ]
            }
        }
    ];
}

function getCorePipeline(queryParams) {
    const match = {};
    const addFields = {
        cleanOrganisationType: {
            $arrayElemAt: [{ $split: ['$BIGField_Organisation_Type', ' : '] }, 0]
        }
    };

    if (queryParams.q) {
        match.$text = { $search: queryParams.q };
        addFields.score = { $meta: 'textScore' };
    }

    if (queryParams.organisationType) {
        match['BIGField_Organisation_Type'] = { $all: queryParams.organisationType };
    }

    // if (queryParams.amount) {
    //     match['Amount Awarded'] = { $all: queryParams.amount };
    // }

    return [{ $match: match }, { $addFields: addFields }];
}

async function query(db, queryParams) {
    try {
        const corePipeline = getCorePipeline(queryParams);
        const facetResults = await aggregate(db, concat(corePipeline, getFacetsPipeline())).toArray();
        const results = await aggregate(db, corePipeline).toArray();
        return { facetResults, results };
    } catch (error) {
        console.log(error);
        return { facetResults: [], results: [] };
    }
}

async function init({ router, routeConfig }) {
    const db = await connectToMongo();

    router.get(routeConfig.path, async (req, res) => {
        res.render(routeConfig.template, {
            queryParams: req.query,
            collection: await query(db, req.query)
        });
    });
}

module.exports = {
    init
};
