'use strict';

module.exports = function locationsFor(country) {
    const england = [
        {
            label: 'North East & Cumbria',
            options: [
                { value: 'northumberland', label: 'Northumberland' },
                { value: 'county-durham', label: 'County Durham' },
                { value: 'tyne-and-wear', label: 'Tyne and Wear' },
                { value: 'middlesbrough', label: 'Middlesbrough' },
                { value: 'darlington', label: 'Darlington' },
                { value: 'stockton-on-tees', label: 'Stockton on Tees' },
                { value: 'cleveland', label: 'Cleveland' },
                { value: 'cumbria', label: 'Cumbria' }
            ]
        },
        {
            label: 'North West',
            options: [
                { value: 'greater-manchester', label: 'Greater Manchester' },
                { value: 'lancashire', label: 'Lancashire' },
                { value: 'cheshire', label: 'Cheshire' },
                { value: 'merseyside', label: 'Merseyside' }
            ]
        },
        {
            label: 'Yorkshire and the Humber',
            options: [
                { value: 'north-yorkshire', label: 'North Yorkshire' },
                { value: 'south-yorkshire', label: 'South Yorkshire' },
                { value: 'west-yorkshire', label: 'West Yorkshire' },
                {
                    value: 'east-riding-of-yorkshire',
                    label: 'East Riding of Yorkshire'
                },
                { value: 'north-lincolnshire', label: 'North Lincolnshire' },
                {
                    value: 'north-east-lincolnshire',
                    label: 'North East Lincolnshire'
                }
            ]
        },
        {
            label: 'South West',
            options: [
                { value: 'gloucestershire', label: 'Gloucestershire' },
                {
                    value: 'south-gloucestershire',
                    label: 'South Gloucestershire'
                },
                { value: 'bristol', label: 'Bristol' },
                {
                    value: 'bath-and-north-east-somerset',
                    label: 'Bath and North East Somerset'
                },
                { value: 'north-somerset', label: 'North Somerset' },
                { value: 'somerset', label: 'Somerset' },
                { value: 'wiltshire', label: 'Wiltshire' },
                { value: 'swindon', label: 'Swindon' },
                { value: 'dorset', label: 'Dorset' },
                { value: 'bournemouth', label: 'Bournemouth' },
                { value: 'poole', label: 'Poole' },
                { value: 'devon', label: 'Devon' },
                { value: 'torbay', label: 'Torbay' },
                { value: 'plymouth', label: 'Plymouth' },
                { value: 'cornwall', label: 'Cornwall' },
                { value: 'isles-of-scilly', label: 'Isles of Scilly' }
            ]
        },
        {
            label: 'London, South East and East of England',
            options: [
                { value: 'greater-london', label: 'Greater London' },
                { value: 'berkshire', label: 'Berkshire' },
                { value: 'buckinghamshire', label: 'Buckinghamshire' },
                { value: 'east-sussex', label: 'East Sussex' },
                { value: 'west-sussex', label: 'West Sussex' },
                { value: 'hampshire', label: 'Hampshire' },
                { value: 'the-isle-of-wight', label: 'the Isle of Wight' },
                { value: 'kent', label: 'Kent' },
                { value: 'oxfordshire', label: 'Oxfordshire' },
                { value: 'surrey', label: 'Surrey' },
                { value: 'bedfordshire', label: 'Bedfordshire' },
                { value: 'peterborough', label: 'Peterborough' },
                { value: 'cambridgeshire', label: 'Cambridgeshire' },
                { value: 'essex', label: 'Essex' },
                { value: 'hertfordshire', label: 'Hertfordshire' },
                { value: 'norfolk', label: 'Norfolk' },
                { value: 'suffolk', label: 'Suffolk' }
            ]
        },
        {
            label: 'East and West Midlands',
            options: [
                { value: 'derbyshire', label: 'Derbyshire' },
                { value: 'leicestershire', label: 'Leicestershire' },
                {
                    value: 'lincolnshire',
                    label: `Lincolnshire (except North and North East Lincolnshire)`
                },
                { value: 'northamptonshire', label: 'Northamptonshire' },
                { value: 'nottinghamshire', label: 'Nottinghamshire' },
                { value: 'rutland', label: 'Rutland' },
                { value: 'herefordshire', label: 'Herefordshire' },
                { value: 'shropshire', label: 'Shropshire' },
                { value: 'staffordshire', label: 'Staffordshire' },
                { value: 'warwickshire', label: 'Warwickshire' },
                { value: 'west-midlands', label: 'West Midlands' },
                { value: 'worcestershire', label: 'Worcestershire' }
            ]
        }
    ];

    const scotland = [
        {
            label: 'Lanarkshire',
            options: [
                { value: 'north-lanarkshire', label: 'North Lanarkshire' },
                { value: 'south-lanarkshire', label: 'South Lanarkshire' }
            ]
        },
        {
            label: 'Glasgow',
            options: [{ value: 'glasgow', label: 'Glasgow' }]
        },
        {
            label: 'Highlands & Islands',
            options: [
                { value: 'argyll-and-bute', label: 'Argyll & Bute' },
                { value: 'highlands', label: 'Highlands' },
                { value: 'western-isles', label: 'Western Isles' },
                { value: 'orkney', label: 'Orkney' },
                { value: 'shetland', label: 'Shetland' }
            ]
        },
        {
            label: 'Lothians',
            options: [
                { value: 'edinburgh', label: 'Edinburgh' },
                { value: 'east-lothian', label: 'East Lothian' },
                { value: 'west-lothian', label: 'West Lothian' },
                { value: 'midlothian', label: 'Midlothian' }
            ]
        },
        {
            label: 'Central Scotland',
            options: [
                { value: 'clackmannanshire', label: 'Clackmannanshire' },
                { value: 'fife', label: 'Fife' },
                { value: 'perth-and-kinross', label: 'Perth & Kinross' },
                { value: 'stirling', label: 'Stirling' },
                { value: 'falkirk', label: 'Falkirk' }
            ]
        },
        {
            label: 'North East Scotland',
            options: [
                { value: 'aberdeen-city', label: 'Aberdeen City' },
                { value: 'aberdeenshire', label: 'Aberdeenshire' },
                { value: 'angus', label: 'Angus' },
                { value: 'dundee', label: 'Dundee' },
                { value: 'moray', label: 'Moray' }
            ]
        },
        {
            label: 'South Scotland',
            options: [
                { value: 'east-ayrshire', label: 'East Ayrshire' },
                { value: 'north-ayrshire', label: 'North Ayrshire' },
                { value: 'south-ayrshire', label: 'South Ayrshire' },
                {
                    value: 'dumfries-and-galloway',
                    label: 'Dumfries & Galloway'
                },
                { value: 'the-scottish-borders', label: 'The Scottish Borders' }
            ]
        },
        {
            label: 'West of Scotland',
            options: [
                { value: 'east-dumbartonshire', label: 'East Dumbartonshire' },
                { value: 'west-dumbartonshire', label: 'West Dumbartonshire' },
                { value: 'inverclyde', label: 'Inverclyde' },
                { value: 'renfrewshire', label: 'Renfrewshire' },
                { value: 'east-renfrewshire', label: 'East Renfrewshire' }
            ]
        }
    ];

    const northernIreland = [
        {
            label: 'Eastern',
            options: [
                {
                    value: 'antrim-and-newtownabbey',
                    label: 'Antrim and Newtownabbey'
                },
                { value: 'ards-and-north-down', label: 'Ards and North Down' },
                { value: 'belfast', label: 'Belfast' }
            ]
        },
        {
            label: 'Western',
            options: [
                { value: 'fermanagh-and-omagh', label: 'Fermanagh and Omagh' },
                { value: 'mid-ulster', label: 'Mid Ulster' }
            ]
        },
        {
            label: 'Northern',
            options: [
                { value: 'derry-and-strabane', label: 'Derry and Strabane' },
                {
                    value: 'causeway-coast-and-glens',
                    label: 'Causeway, Coast and Glens'
                },
                { value: 'mid-and-east-antrim', label: 'Mid and East Antrim' }
            ]
        },
        {
            label: 'Southern',
            options: [
                {
                    value: 'lisburn-and-castlereagh',
                    label: 'Lisburn and Castlereagh'
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
            label: 'North Wales',
            options: [
                { value: 'conwy', label: 'Conwy' },
                { value: 'denbighshire', label: 'Denbighshire' },
                { value: 'flintshire', label: 'Flintshire' },
                { value: 'gwynedd', label: 'Gwynedd' },
                { value: 'isle-of-anglesey', label: 'Isle of Anglesey' },
                { value: 'wrexham', label: 'Wrexham' }
            ]
        },
        {
            label: 'Mid & West Wales',
            options: [
                { value: 'bridgend', label: 'Bridgend' },
                { value: 'carmarthenshire', label: 'Carmarthenshire' },
                { value: 'ceredigion', label: 'Ceredigion' },
                { value: 'neath-port-talbot', label: 'Neath Port Talbot' },
                { value: 'pembrokeshire', label: 'Pembrokeshire' },
                { value: 'powys', label: 'Powys' },
                { value: 'swansea', label: 'Swansea' }
            ]
        },
        {
            label: 'South East & Central Wales',
            options: [
                { value: 'blaenau-gwent', label: 'Blaenau Gwent' },
                { value: 'caerphilly', label: 'Caerphilly' },
                { value: 'cardiff', label: 'Cardiff' },
                { value: 'merthyr-tydfil', label: 'Merthyr Tydfil' },
                { value: 'monmouthshire', label: 'Monmouthshire' },
                { value: 'newport', label: 'Newport' },
                {
                    value: 'rhondda-cynon-taf',
                    label: 'Rhondda Cynon Taf (RCT)'
                },
                {
                    value: 'the-vale-of-glamorgan',
                    label: 'The Vale of Glamorgan'
                },
                { value: 'torfaen', label: 'Torfaen' }
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
