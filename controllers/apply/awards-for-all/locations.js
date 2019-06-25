'use strict';

module.exports = function locationsFor(country) {
    const england = [
        {
            label: 'East and West Midlands',
            options: [
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
                    label:
                        'Lincolnshire (except North and North East Lincolnshire)'
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
            ]
        },
        {
            label: 'London, South East and East of England',
            options: [
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
            ]
        },
        {
            label: 'North East & Cumbria',
            options: [
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
            ]
        },
        {
            label: 'North West',
            options: [
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
            ]
        },
        {
            label: 'South West',
            options: [
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
            ]
        },
        {
            label: 'Yorkshire and the Humber',
            options: [
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
        }
    ];

    const scotland = [
        {
            label: 'Scotland',
            options: [
                {
                    value: 'aberdeen-city',
                    label: 'Aberdeen City'
                },
                {
                    value: 'aberdeenshire',
                    label: 'Aberdeenshire'
                },
                {
                    value: 'angus',
                    label: 'Angus'
                },
                {
                    value: 'argyll-and-bute',
                    label: 'Argyll & Bute'
                },
                {
                    value: 'clackmannanshire',
                    label: 'Clackmannanshire'
                },
                {
                    value: 'dumfries-and-galloway',
                    label: 'Dumfries & Galloway'
                },
                {
                    value: 'dundee',
                    label: 'Dundee'
                },
                {
                    value: 'east-ayrshire',
                    label: 'East Ayrshire'
                },
                {
                    value: 'east-dumbartonshire',
                    label: 'East Dumbartonshire'
                },
                {
                    value: 'east-lothian',
                    label: 'East Lothian'
                },
                {
                    value: 'east-renfrewshire',
                    label: 'East Renfrewshire'
                },
                {
                    value: 'edinburgh',
                    label: 'Edinburgh'
                },
                {
                    value: 'falkirk',
                    label: 'Falkirk'
                },
                {
                    value: 'fife',
                    label: 'Fife'
                },
                {
                    value: 'glasgow',
                    label: 'Glasgow'
                },
                {
                    value: 'highlands',
                    label: 'Highlands'
                },
                {
                    value: 'inverclyde',
                    label: 'Inverclyde'
                },
                {
                    value: 'midlothian',
                    label: 'Midlothian'
                },
                {
                    value: 'moray',
                    label: 'Moray'
                },
                {
                    value: 'north-ayrshire',
                    label: 'North Ayrshire'
                },
                {
                    value: 'north-lanarkshire',
                    label: 'North Lanarkshire'
                },
                {
                    value: 'orkney',
                    label: 'Orkney'
                },
                {
                    value: 'perth-and-kinross',
                    label: 'Perth & Kinross'
                },
                {
                    value: 'renfrewshire',
                    label: 'Renfrewshire'
                },
                {
                    value: 'shetland',
                    label: 'Shetland'
                },
                {
                    value: 'south-ayrshire',
                    label: 'South Ayrshire'
                },
                {
                    value: 'south-lanarkshire',
                    label: 'South Lanarkshire'
                },
                {
                    value: 'stirling',
                    label: 'Stirling'
                },
                {
                    value: 'the-scottish-borders',
                    label: 'The Scottish Borders'
                },
                {
                    value: 'west-dumbartonshire',
                    label: 'West Dumbartonshire'
                },
                {
                    value: 'west-lothian',
                    label: 'West Lothian'
                },
                {
                    value: 'western-isles',
                    label: 'Western Isles'
                }
            ]
        }
    ];

    const northernIreland = [
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

    const wales = [
        {
            label: 'Wales',
            options: [
                {
                    value: 'blaenau-gwent',
                    label: 'Blaenau Gwent'
                },
                {
                    value: 'bridgend',
                    label: 'Bridgend'
                },
                {
                    value: 'caerphilly',
                    label: 'Caerphilly'
                },
                {
                    value: 'cardiff',
                    label: 'Cardiff'
                },
                {
                    value: 'carmarthenshire',
                    label: 'Carmarthenshire'
                },
                {
                    value: 'ceredigion',
                    label: 'Ceredigion'
                },
                {
                    value: 'conwy',
                    label: 'Conwy'
                },
                {
                    value: 'denbighshire',
                    label: 'Denbighshire'
                },
                {
                    value: 'flintshire',
                    label: 'Flintshire'
                },
                {
                    value: 'gwynedd',
                    label: 'Gwynedd'
                },
                {
                    value: 'isle-of-anglesey',
                    label: 'Isle of Anglesey'
                },
                {
                    value: 'merthyr-tydfil',
                    label: 'Merthyr Tydfil'
                },
                {
                    value: 'monmouthshire',
                    label: 'Monmouthshire'
                },
                {
                    value: 'neath-port-talbot',
                    label: 'Neath Port Talbot'
                },
                {
                    value: 'newport',
                    label: 'Newport'
                },
                {
                    value: 'pembrokeshire',
                    label: 'Pembrokeshire'
                },
                {
                    value: 'powys',
                    label: 'Powys'
                },
                {
                    value: 'rhondda-cynon-taf',
                    label: 'Rhondda Cynon Taf (RCT)'
                },
                {
                    value: 'swansea',
                    label: 'Swansea'
                },
                {
                    value: 'the-vale-of-glamorgan',
                    label: 'The Vale of Glamorgan'
                },
                {
                    value: 'torfaen',
                    label: 'Torfaen'
                },
                {
                    value: 'wrexham',
                    label: 'Wrexham'
                }
            ]
        }
    ];

    let result;
    switch (country) {
        case 'england':
            result = england;
            break;
        case 'scotland':
            result = scotland;
            break;
        case 'northern-ireland':
            result = northernIreland;
            break;
        case 'wales':
            result = wales;
            break;
        default:
            result = [];
            break;
    }

    return result;
};
