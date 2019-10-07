# Get advice on your idea

The following documents the data schema for the get advice on your idea form when submitted to Salesforce.

## Changelog

### v0.2

- Add `projectName` field

### v0.1

- Initial draft

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

### projectCountries

type: `array[string]`

One or more of: `england`, `northern-ireland`, `scotland`, `wales`

### projectLocation

type: `string` or `null`

If `projectCountries` contains more than one selection then `projectLocation` is not included.

### projectLocationDescription

type: `string` or `null`

Optional field

### projectCosts

type: `integer`

### projectDurationYears

type: `integer`

Value between `1` and `5`. If `projectCountries` contains more than one selection then `projectDurationYears` is not included.

### yourIdeaProject

type: `string`

### yourIdeaCommunity

type: `string`

### yourIdeaActivities

type: `string`

### organisationLegalName

type: `string`

### organisationTradingName

type: `string` or `null`

Optional field

### organisationAddress

type: `object`

| Name         | Type               | Notes    |
| ------------ | ------------------ | -------- |
| **line1**    | `string`           |          |
| **line2**    | `string` or `null` | Optional |
| **townCity** | `string`           |          |
| **county**   | `string` or `null` | Optional |
| **postcode** | `string`           |          |

### organisationType

type: `string`

Allowed values: `unregistered-vco`, `unincorporated-registered-charity`, `charitable-incorporated-organisation`, `not-for-profit-company`, `school`, `college-or-university`, `statutory-body`, `faith-group`

### organisationSubType

type: `string`

Present if `organisationType` is `statutory-body`

Allowed values: `parish-council`, `town-council`, `local-authority`
`nhs-trust-health-authority`, `prison-service`, `fire-service`, `police-authority`

### contactName

type: `object`

| Name          | Type     |
| ------------- | -------- |
| **firstName** | `string` |
| **lastName**  | `string` |

### contactEmail

type: `string`

### contactPhone

type: `string` or `null`

Optional field

### contactLanguagePreference

type: `string` or `null`

Only required and included when `projectCountries` contains `wales`.

### contactCommunicationNeeds

type: `string` or `null`

Optional field
