# Your funding proposal validation messages

## projectName

| Rule       | Message                                    |
| ---------- | ------------------------------------------ |
| base       | Enter a project name                       |
| string.max | Project name must be 80 characters or less |

## projectCountries

| Rule | Message          |
| ---- | ---------------- |
| base | Select a country |

## projectRegions

| Rule | Message                    |
| ---- | -------------------------- |
| base | Select one or more regions |

## projectLocation

| Rule | Message           |
| ---- | ----------------- |
| base | Select a location |

## projectLocationDescription

| Rule       | Message                                                             |
| ---------- | ------------------------------------------------------------------- |
| base       | Tell us all of the locations that you'll be running your project in |
| string.max | Project locations must be 255 characters or less                    |

## projectCosts

| Rule           | Message                                                                                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| base           | Enter a total cost for your project                                                                                                                                    |
| number.integer | Total cost must be a whole number (eg. no decimal point)                                                                                                               |
| number.min     | The amount you ask for must be more than £10,000. If you need less than £10,000, apply today through <a href="/funding/under10k"> National Lottery Awards for All </a> |

## projectDurationYears

| Rule | Message                   |
| ---- | ------------------------- |
| base | Select a project duration |

## yourIdeaProject

| Rule            | Message                               |
| --------------- | ------------------------------------- |
| string.minWords | Answer must be at least 0 words       |
| string.maxWords | Answer must be no more than 500 words |
| base            | Tell us what you would like to do     |

## yourIdeaCommunity

| Rule            | Message                                          |
| --------------- | ------------------------------------------------ |
| string.minWords | Answer must be at least 0 words                  |
| string.maxWords | Answer must be no more than 500 words            |
| base            | Tell us how your project involves your community |

## yourIdeaActivities

| Rule            | Message                                                   |
| --------------- | --------------------------------------------------------- |
| string.minWords | Answer must be at least 0 words                           |
| string.maxWords | Answer must be no more than 350 words                     |
| base            | Tell us how your idea fits in with other local activities |

## organisationLegalName

| Rule       | Message                                                        |
| ---------- | -------------------------------------------------------------- |
| base       | Enter the full legal name of the organisation                  |
| string.max | Full legal name of organisation must be 255 characters or less |

## organisationTradingName

| Rule        | Message                                                       |
| ----------- | ------------------------------------------------------------- |
| any.invalid | Trading name must not be the same as legal name               |
| string.max  | Organisation's day-to-day name must be 255 characters or less |

## organisationAddress

| Rule            | Message                                            |
| --------------- | -------------------------------------------------- |
| base            | Enter a full UK address                            |
| any.empty       | Enter a building and street                        |
| string.max      | Building and street must be 255 characters or less |
| string.max      | Address line must be 255 characters or less        |
| any.empty       | Enter a town or city                               |
| string.max      | Town or city must be 40 characters or less         |
| string.max      | County must be 80 characters or less               |
| any.empty       | Enter a postcode                                   |
| string.postcode | Enter a real postcode                              |

## organisationType

| Rule | Message                       |
| ---- | ----------------------------- |
| base | Select a type of organisation |

## organisationSubType

| Rule | Message                                     |
| ---- | ------------------------------------------- |
| base | Tell us what type of statutory body you are |

## contactName

| Rule       | Message                                  |
| ---------- | ---------------------------------------- |
| base       | Enter first and last name                |
| any.empty  | Enter first name                         |
| string.max | First name must be 40 characters or less |
| string.max | Last name must be 80 characters or less  |
| any.empty  | Enter last name                          |

## contactEmail

| Rule         | Message                                                            |
| ------------ | ------------------------------------------------------------------ |
| base         | Enter an email address                                             |
| string.email | Email address must be in the correct format, like name@example.com |

## contactPhone

| Rule               | Message                          |
| ------------------ | -------------------------------- |
| base               | Enter a UK telephone number      |
| string.phonenumber | Enter a real UK telephone number |

## contactLanguagePreference

| Rule | Message           |
| ---- | ----------------- |
| base | Select a language |

## contactCommunicationNeeds

| Rule       | Message                                                       |
| ---------- | ------------------------------------------------------------- |
| string.max | Particular communication needs must be 255 characters or less |
