# Your funding proposal

The following documents the data schema for the standard product funding proposal form when submitted to Salesforce.

## Changelog

### v1.0-beta

-   Add new conditional `projectRegions` value for applications in england. Used to determine new queue mapping rules.

### v0.2

-   Add `projectName` field

### v0.1

-   Initial draft

---

## Example data

Each submission has two top-level keys: `meta` which contains metadata about the submission and `application` which contains the answers.

```json
{
    "meta": {
        "form": "standard-enquiry",
        "schemaVersion": "vX.x",
        "environment": "development",
        "commitId": "b4ecf18eae01d34b296e9388f387cc42bf7c0f93",
        "locale": "en",
        "username": "example@example.com",
        "applicationId": "cf4a6b52-5dac-4063-8e77-ae011f3b874b",
        "startedAt": "2019-09-30T14:47:49.000Z"
    },
    "application": {
        "projectName": "Project name",
        "projectCountries": ["england"],
        "projectRegions": ["midlands"],
        "projectLocation": "derbyshire",
        "projectLocationDescription": "Example location description",
        "projectCosts": 200000,
        "projectDurationYears": 1,
        "yourIdeaProject": "Free text…",
        "yourIdeaCommunity": "Free text…",
        "yourIdeaActivities": "Free text…",
        "organisationLegalName": "Example organisation",
        "organisationTradingName": "",
        "organisationType": "unregistered-vco",
        "organisationSubType": null,
        "organisationAddress": {
            "line1": "1234 example street",
            "townCity": "Birmingham",
            "county": "West Midlands",
            "postcode": "B15 1TR"
        },
        "contactName": {
            "firstName": "Björk",
            "lastName": "Guðmundsdóttir"
        },
        "contactEmail": "example@example.com",
        "contactPhone": "0345 410 2030",
        "contactLanguagePreference": null,
        "contactCommunicationNeeds": "Example communication need"
    }
}
```

## Data

### projectName

type: `string`

validation rules: required field

### projectCountries

type: `array[string]`

validation rules: Required field, must be one or more of: `england`, `northern-ireland`, `scotland`, `wales`

### projectRegions

type: `array[string]`

validation rules: If `projectCountries` contains `england` then `projectRegions` is included and required. If `all-england` is selected all other values are stripped.

allowed values: `all-england`, `midlands`, `london-and-south-east`, `north-east-and-cumbria`, `north-west`, `south-west`, `yorkshire-and-the-humber`

### projectLocation

type: `string` or `null`

validation rules: If `projectCountries` contains more than one selection then `projectLocation` is not required or included. Otherwise required.

#### Allowed values

##### England

-   **North East & Cumbria**: `northumberland`, `county-durham`, `tyne-and-wear`, `middlesbrough`, `darlington`, `stockton-on-tees`, `cleveland`, `cumbria`
-   **North West**: `greater-manchester`, `lancashire`, `cheshire`, `merseyside`
-   **Yorkshire and the Humber**: `north-yorkshire`, `south-yorkshire`, `west-yorkshire`, `east-riding-of-yorkshire`, `north-lincolnshire`, `north-east-lincolnshire`
-   **South West**: `gloucestershire`, `south-gloucestershire`, `bristol`, `bath-and-north-east-somerset`, `north-somerset`, `somerset`, `wiltshire`, `swindon`, `dorset`, `bournemouth`, `poole`, `devon`, `torbay`, `plymouth`, `cornwall`, `isles-of-scilly`
-   **London, South East and East of England**: `greater-london`, `berkshire`, `buckinghamshire`, `east-sussex`, `west-sussex`, `hampshire`, `the-isle-of-wight`, `kent`, `oxfordshire`, `surrey`, `bedfordshire`, `peterborough`, `cambridgeshire`, `essex`, `hertfordshire`, `norfolk`, `suffolk`
-   **East and West Midlands**: `derbyshire`, `leicestershire`, `lincolnshire`, `northamptonshire`, `nottinghamshire`, `rutland`, `herefordshire`, `shropshire`, `staffordshire`, `warwickshire`, `west-midlands`, `worcestershire`

##### Scotland

-   **Lanarkshire**: `north-lanarkshire`, `south-lanarkshire`
-   **Glasgow**: `glasgow`
-   **Highlands & Islands**: `argyll-and-bute`, `highland`, `western-isles`, `orkney-islands`, `shetland-islands`
-   **Lothians**: `edinburgh`, `east-lothian`, `west-lothian`, `midlothian`
-   **Central Scotland**: `clackmannanshire`, `fife`, `perth-and-kinross`, `stirling`, `falkirk`
-   **North East Scotland**: `aberdeen-city`, `aberdeenshire`, `angus`, `dundee`, `moray`
-   **South Scotland**: `east-ayrshire`, `north-ayrshire`, `south-ayrshire`, `dumfries-and-galloway`, `the-scottish-borders`
-   **West of Scotland**: `east-dunbartonshire`, `west-dunbartonshire`, `inverclyde`, `renfrewshire`, `east-renfrewshire`

##### Northern Ireland

-   **Eastern**: `antrim-and-newtownabbey`, `ards-and-north-down`, `belfast`
-   **Western**: `fermanagh-and-omagh`, `mid-ulster`
-   **Northern**: `derry-and-strabane`, `causeway-coast-and-glens`, `mid-and-east-antrim`
-   **Southern**: `armagh-banbridge-and-craigavon`, `lisburn-and-castlereagh`, `newry-mourne-and-down`

##### Wales

-   **North Wales**: `conwy`, `denbighshire`, `flintshire`, `gwynedd`, `isle-of-anglesey`, `wrexham`
-   **Mid & West Wales**: `bridgend`, `carmarthenshire`, `ceredigion`, `neath-port-talbot`, `pembrokeshire`, `powys`, `swansea`
-   **South East & Central Wales**: `blaenau-gwent`, `caerphilly`, `cardiff`, `merthyr-tydfil`, `monmouthshire`, `newport`, `rhondda-cynon-taf`, `the-vale-of-glamorgan`, `torfaen`

### projectLocationDescription

type: `string` or `null`

validation rules: Optional field

### projectCosts

type: `integer`

validation rules: Must be a whole number over 10,000

### projectDurationYears

type: `integer`

validation rules: Must be between `1` and `5`. If `projectCountries` contains more than one selection then `projectDurationYears` is not included.

### yourIdeaProject

type: `string`

validation rules: Required field, must be at most 250 words.

### yourIdeaCommunity

type: `string`

validation rules: Required field, must be at most 500 words.

### yourIdeaActivities

type: `string`

validation rules: Required field, must be at most 350 words.

### organisationLegalName

type: `string`

validation rules: Required field

### organisationTradingName

type: `string` or `null`

validation rules: Optional field. If provided must not match `organisationLegalName`

### organisationAddress

type: `object`

validation rules: Required field

| Name         | Type               | Notes    |
| ------------ | ------------------ | -------- |
| **line1**    | `string`           |          |
| **line2**    | `string` or `null` | Optional |
| **townCity** | `string`           |          |
| **county**   | `string` or `null` | Optional |
| **postcode** | `string`           |          |

### organisationType

type: `string`

validation rules: Required field, must be one of: `unregistered-vco`, `unincorporated-registered-charity`, `charitable-incorporated-organisation`, `not-for-profit-company`, `school`, `college-or-university`, `statutory-body`, `faith-group`

### organisationSubType

type: `string`

validation rules: Required if `organisationType` is `statutory-body`. Must be one of: `parish-council`, `town-council`, `local-authority`
`nhs-trust-health-authority`, `prison-service`, `fire-service`, `police-authority`

### contactName

type: `object`

validation rules: Required field

| Name          | Type     |
| ------------- | -------- |
| **firstName** | `string` |
| **lastName**  | `string` |

### contactEmail

type: `string`

validation rules: Required field, must be a valid email address format

### contactPhone

type: `string` or `null`

validation rules: Required field, must be a valid UK phone number format

Optional field

### contactLanguagePreference

type: `string` or `null`

validation rules: Only required and included when `projectCountries` contains `wales`.

### contactCommunicationNeeds

type: `string` or `null`

validation rules: Optional field
