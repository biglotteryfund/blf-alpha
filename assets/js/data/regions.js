// configure grant data for map
const grantData = [
    {
        name: "Northern Ireland",
        id: "northern-ireland",
        population: 1862100,
        totalAwarded: "£27.0m",
        beneficiaries: 440784
    },
    {
        name: "Wales",
        id: "wales",
        population: 3113200,
        totalAwarded: "£44.3m",
        beneficiaries: 706774
    },

    {
        name: "Scotland",
        id: "scotland",
        population: 5404700,
        totalAwarded: "£75.8m",
        beneficiaries: 1023198
    },
    {
        name: "East Midlands",
        id: "east-midlands",
        population: 4724437,
        totalAwarded: "£33.0m",
        beneficiaries: 610741
    },
    {
        name: "East of England",
        id: "east-england",
        population: 6130542,
        totalAwarded: "£38.9m",
        beneficiaries: 506417
    },

    {
        name: "London",
        id: "london",
        population: 8787892,
        totalAwarded: "£86.9m",
        beneficiaries: 862913
    },
    {
        name: "North East",
        id: "north-east",
        population: 2636848,
        totalAwarded: "£34.4m",
        beneficiaries: 474637
    },
    {
        name: "North West",
        id: "north-west",
        population: 7219623,
        totalAwarded: "£75.2m",
        beneficiaries: 1145485
    },
    {
        name: "South East",
        id: "south-east",
        population: 9026297,
        totalAwarded: "£37.3m",
        beneficiaries: 646667
    },
    {
        name: "South West",
        id: "south-west",
        population: 5515953,
        totalAwarded: "£57.4m",
        beneficiaries: 684665
    },
    {
        name: "West Midlands",
        id: "west-midlands",
        population: 5800734,
        totalAwarded: "£64.0m",
        beneficiaries: 803497
    },
    {
        name: "Yorkshire and the Humber",
        id: "yorkshire",
        population: 5425741,
        totalAwarded: "£66.1m",
        beneficiaries: 929239
    }
];

// look up a grant by region
let getGrantDataById = (id) => grantData.find(g => g.id === id);

module.exports = {
    grantData: grantData,
    getGrantDataById: getGrantDataById
};