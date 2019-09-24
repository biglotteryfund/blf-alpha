# Get advice on your idea

The following documents the data schema for the get advice on your idea form when submitted to Salesforce.

## Changelog

### v0.1

Initial draft

## Data

### projectName

type: `string`

### projectCountry

type: `array[string]`

One or more of: `england`, `northern-ireland`, `scotland`, `wales`

### projectLocation

type: `string` or `null`

If more than one `projectCountry` is selected then `projectLocation` is not included.

### projectLocationDescription

type: `string` or `null`

Optional field

### projectCosts

type: `integer`

### projectDurationYears

type: `integer`

Value between `1` and `5`. If more than one `projectCountry` is selected then `projectDurationYears` is not included.

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

### mainContactAddress

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
