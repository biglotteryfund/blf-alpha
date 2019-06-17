# Awards for All: Schema

The following documents the data schema for Awards for All applications when submitted to Salesforce.

Each submission has two top-level keys: `meta` which contains metadata about the submission and `application` which contains the applicants answers.

## Example data

```json
{
    "meta": {
        "form": "awards-for-all",
        "environment": "production",
        "commitId": "b4ecf18eae01d34b296e9388f387cc42bf7c0f93",
        "username": "example@example.com",
        "applicationId": "e9ae2cc4-fd7b-4fe5-bd55-17317a288fd4",
        "startedAt": "2019-05-17T15:34:13.000Z"
    },
    "application": {
        "projectName": "My project name",
        "projectCountry": "england",
        "projectStartDate": "2020-12-12",
        "projectLocation": "west-midlands",
        "projectLocationDescription": "Additional description of location",
        "projectPostcode": "B15 1TR",
        "yourIdeaProject": "Free text…",
        "yourIdeaPriorities": "Free text…",
        "yourIdeaCommunity": "Free text…",
        "projectBudget": [
            {
                "item": "aut ut ea id dolor",
                "cost": 455
            },
            {
                "item": "quasi rem est sunt ut",
                "cost": 295
            },
            {
                "item": "alias et quam possimus voluptatibus",
                "cost": 746
            },
            {
                "item": "ipsam odit eum quae quia",
                "cost": 699
            },
            {
                "item": "nam cum dolorum ut minus",
                "cost": 228
            }
        ],
        "projectTotalCosts": 20000,
        "beneficiariesGroupsCheck": "yes",
        "beneficiariesGroups": [
            "ethnic-background",
            "gender",
            "age",
            "disabled-people",
            "religion",
            "lgbt",
            "caring-responsibilities"
        ],
        "beneficiariesGroupsEthnicBackground": ["african", "caribbean"],
        "beneficiariesGroupsGender": ["non-binary"],
        "beneficiariesGroupsAge": ["0-12", "13-24"],
        "beneficiariesGroupsDisabledPeople": ["sensory"],
        "beneficiariesGroupsReligion": ["sikh"],
        "beneficiariesWelshLanguage": null,
        "beneficiariesNorthernIrelandCommunity": null,
        "organisationLegalName": "Mitchell, Koelpin and Nikolaus",
        "organisationTradingName": "Dickinson, Pfannerstill and McKenzie",
        "organisationAddress": {
            "line1": "82553 Demarco Rapid",
            "townCity": "Waelchitown",
            "county": "Berkshire",
            "postcode": "B15 1TR"
        },
        "organisationType": "not-for-profit-company",
        "companyNumber": "123456789",
        "charityNumber": null,
        "educationNumber": null,
        "accountingYearDate": {
            "day": 1,
            "month": 3
        },
        "totalIncomeYear": 824974,
        "mainContactFirstName": "Nelda",
        "mainContactLastName": "Nolan",
        "mainContactDateOfBirth": "1975-10-12",
        "mainContactAddress": {
            "line1": "41465 Bashirian Oval",
            "townCity": "Friesenhaven",
            "county": "Berkshire",
            "postcode": "B15 1TR"
        },
        "mainContactAddressHistory": {
            "currentAddressMeetsMinimum": "no",
            "previousAddress": {
                "line1": "46760 Marks Garden",
                "townCity": "New Katheryn",
                "county": "Bedfordshire",
                "postcode": "ABC 1TR"
            }
        },
        "mainContactEmail": "Lizzie87@example.com",
        "mainContactPhone": "0345 4 10 20 30",
        "mainContactCommunicationNeeds": [],
        "seniorContactFirstName": "Maribel",
        "seniorContactLastName": "D'Amore",
        "seniorContactRole": "trustee",
        "seniorContactDateOfBirth": "1980-12-12",
        "seniorContactAddress": {
            "line1": "535 Weissnat Corner",
            "townCity": "Trantowfort",
            "county": "Bedfordshire",
            "postcode": "ABC 1TR"
        },
        "seniorContactAddressHistory": {
            "currentAddressMeetsMinimum": "yes",
            "previousAddress": null
        },
        "seniorContactEmail": "Leora.Walker66@example.org",
        "seniorContactPhone": "020 7211 1888",
        "seniorContactCommunicationNeeds": [],
        "bankAccountName": "Kulas - Greenfelder",
        "bankSortCode": "108800",
        "bankAccountNumber": "00012345",
        "bankStatement": {
            "filename": "example.pdf",
            "size": "123",
            "type": "application/pdf"
        },
        "termsAgreement1": "yes",
        "termsAgreement2": "yes",
        "termsAgreement3": "yes",
        "termsAgreement4": "yes",
        "termsPersonName": "Guybrush Threepwood",
        "termsPersonPosition": "Mighty Pirate"
    }
}
```

## Meta

| Name              | Type     | Notes                                                      |
| ----------------- | -------- | ---------------------------------------------------------- |
| **form**          | `string` | `awards-for-all`                                           |
| **environment**   | `string` | `development`, `test`, `production`                        |
| **commitId**      | `string` | Git commit for website at the time of submission           |
| **username**      | `string` | Username for the logged in user                            |
| **applicationId** | `string` | UUID reference to the application as stored by the website |
| **startedAt**     | `string` | ISO date string for the date the application was started   |

## Application

### projectName

type: `string`

### projectCountry

type: `string`

Allowed values: `england`, `northern-ireland`, `scotland`, `wales`

### projectStartDate

type: `string`

Date in the format `yyyy-mm-dd`

### projectLocation

type: `string`

### Allowed values

#### England

-   **North East & Cumbria**: `northumberland`, `county-durham`, `tyne-and-wear`, `middlesbrough`, `darlington`, `stockton-on-tees`, `cleveland`, `cumbria`
-   **North West**: `greater-manchester`, `lancashire`, `cheshire`, `merseyside`
-   **Yorkshire and the Humber**: `north-yorkshire`, `south-yorkshire`, `west-yorkshire`, `east-riding-of-yorkshire`, `north-lincolnshire`, `north-east-lincolnshire`
-   **South West**: `gloucestershire`, `south-gloucestershire`, `bristol`, `bath-and-north-east-somerset`, `north-somerset`, `somerset`, `wiltshire`, `swindon`, `dorset`, `bournemouth`, `poole`, `devon`, `rorbay`, `plymouth`, `cornwall`, `isles-of-scilly`
-   **London, South East and East of England**: `greater-london`, `berkshire`, `buckinghamshire`, `east-sussex`, `west-sussex`, `hampshire`, `the-isle-of-wight`, `kent`, `oxfordshire`, `surrey`, `bedfordshire`, `peterborough`, `cambridgeshire`, `essex`, `hertfordshire`, `norfolk`, `suffolk`
-   **East and West Midlands**: `derbyshire`, `leicestershire`, `lincolnshire`, `northamptonshire`, `nottinghamshire`, `rutland`, `herefordshire`, `shropshire`, `staffordshire`, `warwickshire`, `west-midlands`, `worcestershire`

#### Scotland

-   **Lanarkshire**: `north-lanarkshire`, `south-lanarkshire`
-   **Glasgow**: `glasgow`
-   **Highlands & Islands**: `argyll-and-bute`, `highlands`, `western-isles`, `orkney`, `shetland`
-   **Lothians**: `edinburgh`, `east-lothian`, `west-lothian`, `midlothian`
-   **Central Scotland**: `clackmannanshire`, `fife`, `perth-and-kinross`, `stirling`, `falkirk`
-   **North East Scotland**: `aberdeen-city`, `aberdeenshire`, `angus`, `dundee`, `moray`
-   **South Scotland**: `east-ayrshire`, `north-ayrshire`, `south-ayrshire`, `dumfries-and-galloway`, `the-scottish-borders`
-   **West of Scotland**: `east-dumbartonshire`, `west-dumbartonshire`, `inverclyde`, `renfrewshire`, `east-renfrewshire`

#### Northern Ireland

-   **Eastern**: `antrim-and-newtownabbey`, `ards-and-north-down`, `belfast`
-   **Western**: `fermanagh-and-omagh`, `mid-ulster`
-   **Northern**: `derry-and-strabane`, `causeway-coast-and-glens`, `mid-and-east-antrim`
-   **Southern**: `lisburn-and-castlereagh`, `newry-mourne-and-down`

#### Wales

-   **North Wales**: `conwy`, `denbighshire`, `flintshire`, `gwynedd`, `isle-of-anglesey`, `wrexham`
-   **Mid & West Wales**: `bridgend`, `carmarthenshire`, `ceredigion`, `neath-port-talbot`, `pembrokeshire`, `powys`, `swansea`
-   **South East & Central Wales**: `blaenau-gwent`, `caerphilly`, `cardiff`, `merthyr-tydfil`, `monmouthshire`, `newport`, `rhondda-cynon-taf`, `the-vale-of-glamorgan`, `torfaen`

### projectLocationDescription

type: `string`

### projectPostcode

type: `string`

### yourIdeaProject

type: `string`

### yourIdeaPriorities

type: `string`

### yourIdeaCommunity

type: `string`

### projectBudget

type: `array`

Array of budget items

| Name     | Type      | Notes                   |
| -------- | --------- | ----------------------- |
| **item** | `string`  | Budget item description |
| **cost** | `integer` | Budget item cost        |

### projectTotalCosts

type: `integer`

### beneficiariesGroupsCheck

type: `string`

allowed values: `yes` or `no`

### beneficiariesGroups

type: `array`

Allowed values: `ethnic-background`, `gender`, `age,`disabled-people`,`religion`,`lgbt`,`caring-responsibilities`

### beneficiariesGroupsEthnicBackground

type: `array`

Allowed values: `white-british`, `irish` , `gypsy-or-irish-traveller`, `white-other`, `mixed-background`, `indian` , `pakistani`, `bangladeshi`, `chinese` , `asian-other`, `caribbean`, `african`, `black-other`, `arab`, `other`

### beneficiariesGroupsGender

type: `array`

Allowed values: `male`, `female`, `trans`, `non-binary`, `intersex`

### beneficiariesGroupsAge

type: `array`

Allowed values: `0-12`, `13-24`, `25-64`, `65+`,

### beneficiariesGroupsDisabledPeople

type: `array`

Allowed values: `sensory`, `physical`, `learning`

### beneficiariesGroupsReligion

type: `array`

Allowed values: `buddhist` , `christian`, `jewish` , `muslim` , `sikh` , `no-religion`

### beneficiariesGroupsReligionOther

type: `string` or `null`

Optional field

### beneficiariesWelshLanguage

type: `string` or `null`

Optional field. Required if `projectCountry` is `wales`

Allowed values: `all`, `more-than-half`, `less-than-half`, `none`

### beneficiariesNorthernIrelandCommunity

type: `string` or `null`

Optional field. Required if `projectCountry` is `northern-ireland`

Allowed values: `both-catholic-and-protestant`, `mainly-protestant`, `mainly-catholic`, `neither-catholic-or-protestant`

### organisationLegalName

type: `string`

### organisationTradingName

type: `string` or `null`

Optional field

### organisationAddress

type: `object`

Address object with the following fields:

| Name         | Type               | Notes    |
| ------------ | ------------------ | -------- |
| **line1**    | `string`           |          |
| **line2**    | `string` or `null` | Optional |
| **townCity** | `string`           |          |
| **county**   | `string` or `null` | Optional |
| **postcode** | `string`           |          |

### organisationType

type: `string`

Allowed values: `unregistered-vco`, `unincorporated-registered-charity`, `charitable-incorporated-organisation`, `not-for-profit-company`, `school`, `statutory-body`

### companyNumber

type: `string` or `null`

Present if `organisationType` is `not-for-profit-company`

### charityNumber

type: `string` or `null`

Present if `organisationType` is `unincorporated-registered-charity` or `charitable-incorporated-organisation`

### educationNumber

type: `string` or `null`

Present if `organisationType` is `school`

### accountingYearDate

type: `object`

Object with properties:

| Name      | Type      |
| --------- | --------- |
| **year**  | `integer` |
| **month** | `integer` |

### mainContactFirstName

type: `string`

### mainContactLastName

type: `string`

### mainContactDateOfBirth

type: `string`

Date string in the format `YYYY-MM-DD`

### mainContactAddress

type: `object`

Address object with the following fields:

| Name         | Type               | Notes    |
| ------------ | ------------------ | -------- |
| **line1**    | `string`           |          |
| **line2**    | `string`           | Optional |
| **townCity** | `string`           |          |
| **county**   | `string` or `null` | Optional |
| **postcode** | `string`           |          |

### mainContactAddressHistory

type: `object`

Object with the following properties

| Name                           | Type     | Notes                                            |
| ------------------------------ | -------- | ------------------------------------------------ |
| **currentAddressMeetsMinimum** | `string` | `yes` or `no                                     |
| **previousAddress**            | `string` | Present if `currentAddressMeetsMinimum` is `yes` |

**previousAddress** contains the following properties

| Name         | Type               | Notes    |
| ------------ | ------------------ | -------- |
| **line1**    | `string`           |          |
| **line2**    | `string`           | Optional |
| **townCity** | `string`           |          |
| **county**   | `string` or `null` | Optional |
| **postcode** | `string`           |          |

### mainContactEmail

type: `string`

### mainContactPhone

type: `string`

### mainContactCommunicationNeeds

type: `string`

Allowed values: `audiotape` , `braille` , `disk` , `large-print` , `letter` , `sign-language,`text-relay`

### seniorContactFirstName

type: `string`

### seniorContactLastName

type: `string`

### seniorContactRole

type: `string`

Allowed values: `trustee`, `chair`, `vice-chair`, `secretary`, `treasurer`, `company-director`, `company-secretary`, `chief-executive`, `chief-executive-officer`, `parish-clerk`, `head-teacher`, `chancellor`, `vice-chancellor`

### seniorContactDateOfBirth

type: `string`

Date string in the format `YYYY-MM-DD`

### seniorContactAddress

type: `object`

Address object with the following fields:

| Name         | Type               | Notes    |
| ------------ | ------------------ | -------- |
| **line1**    | `string`           |          |
| **line2**    | `string` or `null` | Optional |
| **townCity** | `string`           |          |
| **county**   | `string` or `null` | Optional |
| **postcode** | `string`           |          |

### seniorContactAddressHistory

type: `object`

Object with the following properties

| Name                           | Type     | Notes                                            |
| ------------------------------ | -------- | ------------------------------------------------ |
| **currentAddressMeetsMinimum** | `string` | `yes` or `no                                     |
| **previousAddress**            | `string` | Present if `currentAddressMeetsMinimum` is `yes` |

**previousAddress** contains the following properties

| Name         | Type               | Notes    |
| ------------ | ------------------ | -------- |
| **line1**    | `string`           |          |
| **line2**    | `string`           | Optional |
| **townCity** | `string`           |          |
| **county**   | `string` or `null` | Optional |
| **postcode** | `string`           |          |

### seniorContactEmail

type: `string`

### seniorContactPhone

type: `string`

### seniorContactCommunicationNeeds

type: `string`

Allowed values: `audiotape` , `braille` , `disk` , `large-print` , `letter` , `sign-language,`text-relay`

### bankAccountName

type: `string`

### bankSortCode

type: `string`

### bankAccountNumber

type: `string`

### bankStatement

type: `file`

### termsAgreement1
### termsAgreement2
### termsAgreement3
### termsAgreement4

type: `string`

Will always be "yes" (required fields)

### termsPersonName
type: `string`

### termsPersonPosition
type: `string`
