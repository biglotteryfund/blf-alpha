'use strict';
function option(label) {
    return { label: label, value: label };
}

module.exports = function locationsFor(country) {
    const england = [
        {
            label: 'North East & Cumbria',
            options: [
                option('Northumberland'),
                option('County Durham'),
                option('Tyne and Wear'),
                option('Middlesbrough'),
                option('Darlington'),
                option('Stockton on Tees'),
                option('Cleveland'),
                option('Cumbria')
            ]
        },
        {
            label: 'North West',
            options: [
                option('Greater Manchester'),
                option('Lancashire'),
                option('Cheshire'),
                option('Merseyside')
            ]
        },
        {
            label: 'Yorkshire and the Humber',
            options: [
                option('North Yorkshire'),
                option('South Yorkshire'),
                option('West Yorkshire'),
                option('East Riding of Yorkshire'),
                option('North Lincolnshire'),
                option('North East Lincolnshire')
            ]
        },
        {
            label: 'South West',
            options: [
                option('Gloucestershire'),
                option('South Gloucestershire'),
                option('Bristol'),
                option('Bath and North East Somerset'),
                option('North Somerset'),
                option('Somerset'),
                option('Wiltshire'),
                option('Swindon'),
                option('Dorset'),
                option('Bournemouth'),
                option('Poole'),
                option('Devon'),
                option('Rorbay'),
                option('Plymouth'),
                option('Cornwall'),
                option('Isles of Scilly')
            ]
        },
        {
            label: 'London, South East and East of England',
            options: [
                option('Greater London'),
                option('Berkshire'),
                option('Buckinghamshire'),
                option('East Sussex'),
                option('West Sussex'),
                option('Hampshire'),
                option('the Isle of Wight'),
                option('Kent'),
                option('Oxfordshire'),
                option('Surrey'),
                option('Bedfordshire'),
                option('Peterborough'),
                option('Cambridgeshire'),
                option('Essex'),
                option('Hertfordshire'),
                option('Norfolk'),
                option('Suffolk')
            ]
        },
        {
            label: 'East and West Midlands',
            options: [
                option('Derbyshire'),
                option('Leicestershire'),
                option(
                    'Lincolnshire (except North and North East Lincolnshire)'
                ),
                option('Northamptonshire'),
                option('Nottinghamshire'),
                option('Rutland'),
                option('Herefordshire'),
                option('Shropshire'),
                option('Staffordshire'),
                option('Warwickshire'),
                option('West Midlands'),
                option('Worcestershire')
            ]
        }
    ];

    const scotland = [
        {
            label: 'Lanarkshire',
            options: [option('North Lanarkshire'), option('South Lanarkshire')]
        },
        { label: 'Glasgow', options: [option('Glasgow')] },
        {
            label: 'Highlands & Islands',
            options: [
                option('Argyll & Bute'),
                option('Highlands'),
                option('Western Isles'),
                option('Orkney'),
                option('Shetland')
            ]
        },
        {
            label: 'Lothians',
            options: [
                option('Edinburgh'),
                option('East Lothian'),
                option('West Lothian'),
                option('Midlothian')
            ]
        },
        {
            label: 'Central Scotland',
            options: [
                option('Clackmannanshire'),
                option('Fife'),
                option('Perth & Kinross'),
                option('Stirling'),
                option('Falkirk')
            ]
        },
        {
            label: 'North East Scotland',
            options: [
                option('Aberdeen City'),
                option('Aberdeenshire'),
                option('Angus'),
                option('Dundee'),
                option('Moray')
            ]
        },
        {
            label: 'South Scotland',
            options: [
                option('East Ayrshire'),
                option('North Ayrshire'),
                option('South Ayrshire'),
                option('Dumfries & Galloway'),
                option('The Scottish Borders')
            ]
        },
        {
            label: 'West of Scotland',
            options: [
                option('East Dumbartonshire'),
                option('West Dumbartonshire'),
                option('Inverclyde'),
                option('Renfrewshire'),
                option('East Renfrewshire')
            ]
        }
    ];

    const northernIreland = [
        {
            label: 'Eastern',
            options: [
                option('Antrim and Newtownabbey'),
                option('Ards and North Down'),
                option('Belfast')
            ]
        },
        {
            label: 'Western',
            options: [option('Fermanagh and Omagh'), option('Mid Ulster')]
        },
        {
            label: 'Northern',
            options: [
                option('Derry and Strabane'),
                option('Causeway, Coast and Glens'),
                option('Mid and East Antrim')
            ]
        },
        {
            label: 'Southern',
            options: [
                option('Lisburn and Castlereagh'),
                option('Newry, Mourne and Down')
            ]
        }
    ];

    const wales = [
        {
            label: 'North Wales',
            options: [
                option('Conwy'),
                option('Denbighshire'),
                option('Flintshire'),
                option('Gwynedd'),
                option('Isle of Anglesey'),
                option('Wrexham')
            ]
        },
        {
            label: 'Mid & West Wales',
            options: [
                option('Bridgend'),
                option('Carmarthenshire'),
                option('Ceredigion'),
                option('Neath Port Talbot'),
                option('Pembrokeshire'),
                option('Powys'),
                option('Swansea')
            ]
        },
        {
            label: 'South East & Central Wales',
            options: [
                option('Blaenau Gwent'),
                option('Caerphilly'),
                option('Cardiff'),
                option('Merthyr Tydfil'),
                option('Monmouthshire'),
                option('Newport'),
                option('Rhondda Cynon Taf (RCT)'),
                option('The Vale of Glamorgan'),
                option('Torfaen')
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
