'use strict';

function englandRegions() {
    return [
        {
            label: 'East and West Midlands',
            value: 'midlands'
        },
        {
            label: 'London, South East and East of England',
            value: 'london-and-south-east'
        },
        {
            label: 'North East & Cumbria',
            value: 'north-east-and-cumbria'
        },
        {
            label: 'North West',
            value: 'north-west'
        },
        {
            label: 'South West',
            value: 'south-west'
        },
        {
            label: 'Yorkshire and the Humber',
            value: 'yorkshire-and-the-humber'
        }
    ];
}

function englandLocationOptions(filterRegions = []) {
    const locationOptions = {
        'midlands': [
            {
                value: 'derbyshire',
                label: 'Derbyshire'
            },
            {
                value: 'herefordshire',
                label: 'Herefordshire'
            },
            {
                value: 'leicestershire',
                label: 'Leicestershire'
            },
            {
                value: 'lincolnshire',
                label: `Lincolnshire (except North and North East Lincolnshire)`
            },
            {
                value: 'northamptonshire',
                label: 'Northamptonshire'
            },
            {
                value: 'nottinghamshire',
                label: 'Nottinghamshire'
            },
            {
                value: 'rutland',
                label: 'Rutland'
            },
            {
                value: 'shropshire',
                label: 'Shropshire'
            },
            {
                value: 'staffordshire',
                label: 'Staffordshire'
            },
            {
                value: 'warwickshire',
                label: 'Warwickshire'
            },
            {
                value: 'west-midlands',
                label: 'West Midlands'
            },
            {
                value: 'worcestershire',
                label: 'Worcestershire'
            }
        ],
        'london-and-south-east': [
            {
                value: 'bedfordshire',
                label: 'Bedfordshire'
            },
            {
                value: 'berkshire',
                label: 'Berkshire'
            },
            {
                value: 'buckinghamshire',
                label: 'Buckinghamshire'
            },
            {
                value: 'cambridgeshire',
                label: 'Cambridgeshire'
            },
            {
                value: 'east-sussex',
                label: 'East Sussex'
            },
            {
                value: 'essex',
                label: 'Essex'
            },
            {
                value: 'greater-london',
                label: 'Greater London'
            },
            {
                value: 'hampshire',
                label: 'Hampshire'
            },
            {
                value: 'hertfordshire',
                label: 'Hertfordshire'
            },
            {
                value: 'kent',
                label: 'Kent'
            },
            {
                value: 'norfolk',
                label: 'Norfolk'
            },
            {
                value: 'oxfordshire',
                label: 'Oxfordshire'
            },
            {
                value: 'peterborough',
                label: 'Peterborough'
            },
            {
                value: 'suffolk',
                label: 'Suffolk'
            },
            {
                value: 'surrey',
                label: 'Surrey'
            },
            {
                value: 'west-sussex',
                label: 'West Sussex'
            },
            {
                value: 'the-isle-of-wight',
                label: 'the Isle of Wight'
            }
        ],
        'north-east-and-cumbria': [
            {
                value: 'cleveland',
                label: 'Cleveland'
            },
            {
                value: 'county-durham',
                label: 'County Durham'
            },
            {
                value: 'cumbria',
                label: 'Cumbria'
            },
            {
                value: 'darlington',
                label: 'Darlington'
            },
            {
                value: 'middlesbrough',
                label: 'Middlesbrough'
            },
            {
                value: 'northumberland',
                label: 'Northumberland'
            },
            {
                value: 'stockton-on-tees',
                label: 'Stockton on Tees'
            },
            {
                value: 'tyne-and-wear',
                label: 'Tyne and Wear'
            }
        ],
        'north-west': [
            {
                value: 'cheshire',
                label: 'Cheshire'
            },
            {
                value: 'greater-manchester',
                label: 'Greater Manchester'
            },
            {
                value: 'lancashire',
                label: 'Lancashire'
            },
            {
                value: 'merseyside',
                label: 'Merseyside'
            }
        ],
        'south-west': [
            {
                value: 'bath-and-north-east-somerset',
                label: 'Bath and North East Somerset'
            },
            {
                value: 'bournemouth',
                label: 'Bournemouth'
            },
            {
                value: 'bristol',
                label: 'Bristol'
            },
            {
                value: 'cornwall',
                label: 'Cornwall'
            },
            {
                value: 'devon',
                label: 'Devon'
            },
            {
                value: 'dorset',
                label: 'Dorset'
            },
            {
                value: 'gloucestershire',
                label: 'Gloucestershire'
            },
            {
                value: 'isles-of-scilly',
                label: 'Isles of Scilly'
            },
            {
                value: 'north-somerset',
                label: 'North Somerset'
            },
            {
                value: 'plymouth',
                label: 'Plymouth'
            },
            {
                value: 'poole',
                label: 'Poole'
            },
            {
                value: 'somerset',
                label: 'Somerset'
            },
            {
                value: 'south-gloucestershire',
                label: 'South Gloucestershire'
            },
            {
                value: 'swindon',
                label: 'Swindon'
            },
            {
                value: 'torbay',
                label: 'Torbay'
            },
            {
                value: 'wiltshire',
                label: 'Wiltshire'
            }
        ],
        'yorkshire-and-the-humber': [
            {
                value: 'east-riding-of-yorkshire',
                label: 'East Riding of Yorkshire'
            },
            {
                value: 'north-east-lincolnshire',
                label: 'North East Lincolnshire'
            },
            {
                value: 'north-lincolnshire',
                label: 'North Lincolnshire'
            },
            {
                value: 'north-yorkshire',
                label: 'North Yorkshire'
            },
            {
                value: 'south-yorkshire',
                label: 'South Yorkshire'
            },
            {
                value: 'west-yorkshire',
                label: 'West Yorkshire'
            }
        ]
    };

    const regions =
        Array.isArray(filterRegions) && filterRegions.length
            ? englandRegions().filter(region =>
                  filterRegions.includes(region.value)
              )
            : englandRegions();

    return regions.map(function(region) {
        return {
            id: region.value,
            label: region.label,
            options: locationOptions[region.value]
        };
    });
}

function northernIrelandLocationOptions() {
    return [
        {
            label: 'Northern Ireland',
            options: [
                {
                    value: 'antrim-and-newtownabbey',
                    label: 'Antrim and Newtownabbey'
                },
                {
                    value: 'ards-and-north-down',
                    label: 'Ards and North Down'
                },
                {
                    value: 'armagh-banbridge-and-craigavon',
                    label: 'Armagh, Banbridge and Craigavon'
                },
                {
                    value: 'belfast',
                    label: 'Belfast'
                },
                {
                    value: 'causeway-coast-and-glens',
                    label: 'Causeway, Coast and Glens'
                },
                {
                    value: 'derry-and-strabane',
                    label: 'Derry and Strabane'
                },
                {
                    value: 'fermanagh-and-omagh',
                    label: 'Fermanagh and Omagh'
                },
                {
                    value: 'lisburn-and-castlereagh',
                    label: 'Lisburn and Castlereagh'
                },
                {
                    value: 'mid-ulster',
                    label: 'Mid Ulster'
                },
                {
                    value: 'mid-and-east-antrim',
                    label: 'Mid and East Antrim'
                },
                {
                    value: 'newry-mourne-and-down',
                    label: 'Newry, Mourne and Down'
                }
            ]
        }
    ];
}

module.exports = {
    englandRegions,
    englandLocationOptions,
    northernIrelandLocationOptions
};
