'use strict';
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

async function findGrants(db, searchParams) {
    return await db.collection(collectionName).find(searchParams).toArray();
}
async function getFundingProgrammes(db) {
    try {
        return await db.collection(collectionName).aggregate([
            {
                $group: {
                    _id: "$Grant Programme:Title",
                    code: {
                        "$first": "$Grant Programme:Code"
                    },
                    numGrants: {
                        $sum: 1
                    }
                }
            },
            {
                $sort: {
                    "_id": 1
                }
            }
        ], {
            cursor: {}
        }).toArray();
    } catch (err) {
        console.log(err);
        return false;
    }
}


async function init({ router, routeConfig }) {
    const db = await connectToMongo();

    router.get(routeConfig.path, async (req, res) => {

        const searchParams = {};
        const filters = {};
        const searchTerm = req.query.q;
        const programme = req.query.programme;

        if (searchTerm) {
            searchParams['Title'] = new RegExp(searchTerm, "i");
            filters.title = searchTerm;
        }

        if (programme) {
            searchParams['Grant Programme:Code'] = {
                '$eq': programme
            };
            filters.programme = programme;
        }

        const programmes = await getFundingProgrammes(db);
        const grants = await findGrants(db, searchParams);
        res.render(routeConfig.template, {
            grants: grants,
            programmes: programmes,
            title: "Search Past Grants",
            filters: filters
        });
    });
}

module.exports = {
    init
};
