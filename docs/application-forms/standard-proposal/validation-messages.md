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

## projectLocationPostcode

| Rule       | Message          |
| ---------- | ---------------- |
| base       | Enter a postcode |

## projectTotalCost

| Rule           | Message                                                                                |
| -------------- | -------------------------------------------------------------------------------------- |
| base           | Enter a total cost for your project                                                    |
| number.integer | Total cost must be a whole number (eg. no decimal point)                               |
| number.min     | Total cost must be the same as or higher than the amount you’re asking us to fund.     |
| number.max     | Enter a total cost for your project                                                    |

## projectCosts

| Rule           | Message                                                                                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| base           | Enter an amount less than or equal to the total cost.                                                                                                                  |
| number.integer | Total cost must be a whole number (eg. no decimal point)                                                                                                               |
| number.min     | The amount you ask for must be more than £10,000. If you need less than £10,000, apply today through <a href="/funding/under10k"> National Lottery Awards for All </a> |
| number.max     | Enter an amount less than or equal to the total cost.                                                                                                                  |

## projectSpend

| Rule            | Message                                   |
| --------------- | ----------------------------------------- |
| base            | Tell us what you will spend the money on. |

## projectStartDate

| Rule           | Message                                                                 |
| -------------- | ----------------------------------------------------------------------- |
| base           | Select a project duration                                               |
| string.maxDate | The date you start the project must be less than 10 years in the future |
| string.minDate | The date you start the project must be on or after **Current date**     |

## projectDurationYears

| Rule | Message                    |
| ---- | -------------------------  |
| base | Enter a project start date |

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

## projectOrganisation

| Rule       | Message                                                        |
| ---------- | -------------------------------------------------------------- |
| base       | Tell us why your organisation is the right one to manage this project |
| string.min | Answer must be at least 50 words                               |
| string.max | Answer must be no more than 500 words                          |

## organisationLegalName

| Rule       | Message                                                        |
| ---------- | -------------------------------------------------------------- |
| base       | Enter the full legal name of the organisation                  |
| string.max | Full legal name of organisation must be 255 characters or less |

## organisationDifferentName

| Rule       | Message           |
| ---------- | ----------------- |
| base       | Select yes or no. |

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

## organisationStartDate

| Rule           | Message                               |
| -------------- | ------------------------------------- |
| base           | Enter your organisation start date    |
| string.maxDate | Date you entered must be in the past. |
| string.minDate | Enter your organisation start date    |

## organisationSupport

| Rule           | Message                                    |
| -------------- | ------------------------------------------ |
| base           | Enter a number that's less than 70,000,000.|
| number.integer | Enter a number that's less than 70,000,000.|
| number.min     | Enter a number.                            |
| number.max     | Enter a number that's less than 70,000,000.|

## organisationVolunteers

| Rule           | Message                                    |
| -------------- | ------------------------------------------ |
| base           | Enter a number.                            |
| number.integer | Use whole numbers only, eg. 12             |
| number.min     | Enter a number.                            |

## organisationFullTimeStaff

| Rule           | Message                                    |
| -------------- | ------------------------------------------ |
| base           | Enter a number.                            |
| number.min     | Enter a number.                            |

## organisationLeadership

| Rule           | Message                                    |
| -------------- | ------------------------------------------ |
| base           | Enter a number.                            |
| number.integer | Use whole numbers only, eg. 12             |
| number.min     | Number must be between 0 and 100.          |
| number.max     | Number must be between 0 and 100.          |

## organisationType

| Rule | Message                       |
| ---- | ----------------------------- |
| base | Select a type of organisation |

## organisationSubType

| Rule | Message                                     |
| ---- | ------------------------------------------- |
| base | Tell us what type of statutory body you are |

## accountingYearDate
| Rule           | Message                    |
| -------------- | -------------------------- |
| base           | Enter a day and month      |
| any.invalid    | Enter a real day and month |

## totalIncomeYear

| Rule           | Message                                                                                 |
| -------------- | --------------------------------------------------------------------------------------- |
| base           | Enter a total income for the year (eg. a whole number with no commas or decimal points) |
| any.invalid    | Total income must be a real number                                                      |
| number.integer | Total income must be a whole number (eg. no decimal point)                              |

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

## seniorContactRole

| Rule          | Message                          |
| ------------- | -------------------------------- |
| base          | Choose a role                    |
| any.allowOnly | Senior contact role is not valid |

## seniorContactName

| Rule           | Message                                                            |
| -------------- | ------------------------------------------------------------------ |
| base           | Enter first and last name                                          |
| any.empty      | Enter first name                                                   |
| string.max     | First name must be 40 characters or less                           |
| string.max     | Last name must be 80 characters or less                            |
| any.empty      | Enter last name                                                    |
| object.isEqual | Senior contact name must be different from the main contact's name |

## seniorContactDateOfBirth

| Rule              | Message                                                        |
| ----------------- | -------------------------------------------------------------- |
| any.invalid       | Enter a real date                                              |
| base              | Enter a date of birth                                          |
| dateParts.maxDate | Must be at least 18 years old                                  |
| dateParts.minDate | Their birth date is not valid—please use four digits, eg. 1986 |

## seniorContactAddress

| Rule            | Message                                                                  |
| --------------- | ------------------------------------------------------------------------ |
| base            | Enter a full UK address                                                  |
| any.empty       | Enter a building and street                                              |
| string.max      | Building and street must be 255 characters or less                       |
| string.max      | Address line must be 255 characters or less                              |
| any.empty       | Enter a town or city                                                     |
| string.max      | Town or city must be 40 characters or less                               |
| string.max      | County must be 80 characters or less                                     |
| any.empty       | Enter a postcode                                                         |
| string.postcode | Enter a real postcode                                                    |
| object.isEqual  | Senior contact address must be different from the main contact's address |

## seniorContactAddressHistory

| Rule            | Message                                            |
| --------------- | -------------------------------------------------- |
| base            | Enter a full UK address                            |
| any.required    | Choose from one of the options provided            |
| any.empty       | Enter a building and street                        |
| string.max      | Building and street must be 255 characters or less |
| string.max      | Address line must be 255 characters or less        |
| any.empty       | Enter a town or city                               |
| any.empty       | Enter a county                                     |
| string.max      | Town or city must be 40 characters or less         |
| string.max      | County must be 80 characters or less               |
| any.empty       | Enter a postcode                                   |
| string.postcode | Enter a real postcode                              |

## seniorContactEmail

| Rule         | Message                                                            |
| ------------ | ------------------------------------------------------------------ |
| base         | Enter an email address                                             |
| string.email | Email address must be in the correct format, like name@example.com |

## seniorContactPhone

| Rule               | Message                          |
| ------------------ | -------------------------------- |
| base               | Enter a UK telephone number      |
| string.phonenumber | Enter a real UK telephone number |

## seniorContactCommunicationNeeds

| Rule       | Message                                                       |
| ---------- | ------------------------------------------------------------- |
| string.max | Particular communication needs must be 255 characters or less |

## mainContactName

| Rule           | Message                                                            |
| -------------- | ------------------------------------------------------------------ |
| base           | Enter first and last name                                          |
| any.empty      | Enter first name                                                   |
| string.max     | First name must be 40 characters or less                           |
| string.max     | Last name must be 80 characters or less                            |
| any.empty      | Enter last name                                                    |
| object.isEqual | Main contact name must be different from the senior contact's name |

## mainContactDateOfBirth

| Rule              | Message                                                        |
| ----------------- | -------------------------------------------------------------- |
| any.invalid       | Enter a real date                                              |
| base              | Enter a date of birth                                          |
| dateParts.maxDate | Must be at least 16 years old                                  |
| dateParts.minDate | Their birth date is not valid—please use four digits, eg. 1986 |

## mainContactAddress

| Rule            | Message                                                                  |
| --------------- | ------------------------------------------------------------------------ |
| base            | Enter a full UK address                                                  |
| any.empty       | Enter a building and street                                              |
| string.max      | Building and street must be 255 characters or less                       |
| string.max      | Address line must be 255 characters or less                              |
| any.empty       | Enter a town or city                                                     |
| string.max      | Town or city must be 40 characters or less                               |
| string.max      | County must be 80 characters or less                                     |
| any.empty       | Enter a postcode                                                         |
| string.postcode | Enter a real postcode                                                    |
| object.isEqual  | Main contact address must be different from the senior contact's address |

## mainContactAddressHistory

| Rule            | Message                                            |
| --------------- | -------------------------------------------------- |
| base            | Enter a full UK address                            |
| any.required    | Choose from one of the options provided            |
| any.empty       | Enter a building and street                        |
| string.max      | Building and street must be 255 characters or less |
| string.max      | Address line must be 255 characters or less        |
| any.empty       | Enter a town or city                               |
| any.empty       | Enter a county                                     |
| string.max      | Town or city must be 40 characters or less         |
| string.max      | County must be 80 characters or less               |
| any.empty       | Enter a postcode                                   |
| string.postcode | Enter a real postcode                              |

## mainContactEmail

| Rule         | Message                                                                              |
| ------------ | ------------------------------------------------------------------------------------ |
| base         | Enter an email address                                                               |
| string.email | Email address must be in the correct format, like name@example.com                   |
| any.invalid  | Main contact email address must be different from the senior contact's email address |

## mainContactPhone

| Rule               | Message                          |
| ------------------ | -------------------------------- |
| base               | Enter a UK telephone number      |
| string.phonenumber | Enter a real UK telephone number |

## mainContactCommunicationNeeds

| Rule       | Message                                                       |
| ---------- | ------------------------------------------------------------- |
| string.max | Particular communication needs must be 255 characters or less |

## termsAgreement1

| Rule | Message                                                            |
| ---- | ------------------------------------------------------------------ |
| base | You must confirm that you're authorised to submit this application |

## termsAgreement2

| Rule | Message                                                                               |
| ---- | ------------------------------------------------------------------------------------- |
| base | You must confirm that you're authorised to submit this application                    |

## termsAgreement3

| Rule | Message                                                                                      |
| ---- | -------------------------------------------------------------------------------------------- |
| base | You must confirm that you understand your application is subject to our Terms and conditions |

## termsAgreement4

| Rule | Message                                                                               |
| ---- | ------------------------------------------------------------------------------------- |
| base | You must confirm that the information you've provided in this application is accurate |

## termsAgreement5

| Rule | Message                                                                                                                          |
| ---- | ------------------------------------------------------------------------------------------- |
| base | You must confirm that you understand how we'll use any personal information you've provided |

## termsAgreement6

| Rule | Message                                                                                               |
| ---- | ----------------------------------------------------------------------------------------------------- |
| base | You must confirm that you understand your application is subject to our Freedom of Information policy |

## termsPersonName

| Rule       | Message                                                |
| ---------- | ------------------------------------------------------ |
| base       | Enter the full name of the person completing this form |
| string.max | Full name must be 255 characters or less               |

## termsPersonPosition

| Rule       | Message                                                 |
| ---------- | ------------------------------------------------------- |
| base       | Enter the position of the person completing this form   |
| string.max | Position in organisation must be 255 characters or less |

## beneficiariesPreflightCheck

| Rule | Message          |
| ---- | ---------------- |
| base | Check this box to show you understand |

## beneficiariesGroupsCheck

| Rule | Message          |
| ---- | ---------------- |
| base | Select an option |

## beneficiariesGroups

| Rule | Message                                                         |
| ---- | --------------------------------------------------------------- |
| base | Select the specific group(s) of people your project is aimed at |

## beneficiariesGroupsEthnicBackground

| Rule | Message                                                                           |
| ---- | --------------------------------------------------------------------------------- |
| base | Select the ethnic background(s) of the people that will benefit from your project |

## beneficiariesGroupsReligion

| Rule | Message                                                                               |
| ---- | ------------------------------------------------------------------------------------- |
| base | Select the religion(s) or belief(s) of the people that will benefit from your project |

## beneficiariesGroupsMigrant

| Rule | Message                                                                               |
| ---- | ------------------------------------------------------------------------------------- |
| base | Select the group(s) of the people that will benefit from your project |

## beneficiariesGroupsDisabledPeople

| Rule | Message                                                        |
| ---- | -------------------------------------------------------------- |
| base | Select the group(s) of people that will benefit from your project |

## beneficiariesGroupsAge

| Rule | Message                                                                   |
| ---- | ------------------------------------------------------------------------- |
| base | Select the age group(s) of the people that will benefit from your project |

## beneficiariesGroupsLGBT

| Rule | Message                                                                               |
| ---- | ------------------------------------------------------------------------------------- |
| base | Select an option |

## beneficiariesGroupsSpecificPeople

| Rule | Message                                                                               |
| ---- | ------------------------------------------------------------------------------------- |
| base | Please tell us the people that will benefit from your project |
| length.max | Answer must be no more than 100 words |

## beneficiariesGroupsOther

| Rule       | Message                                                   |
| ---------- | --------------------------------------------------------- |
| string.max | Answer must be no more than 100 words |

## beneficiariesNorthernIrelandCommunity

| Rule | Message                                                                           |
| ---- | --------------------------------------------------------------------------------- |
| base | Select the community that the people who will benefit from your project belong to |

## beneficiariesAnyGroupsOther

| Rule       | Message                                                   |
| ---------- | --------------------------------------------------------- |
| string.max | Answer must be no more than 100 words |
    
## beneficiariesLeadershipGroups

| Rule | Message                                                         |
| ---- | --------------------------------------------------------------- |
| base | Select the specific group(s) of people your project is aimed at |

## beneficiariesLeadershipGroupsEthnicBackground

| Rule | Message                                                                           |
| ---- | --------------------------------------------------------------------------------- |
| base | Select the ethnic background(s) of the people that will benefit from your project |

## beneficiariesLeadershipGroupsReligion

| Rule | Message                                                                               |
| ---- | ------------------------------------------------------------------------------------- |
| base | Select the religion(s) or belief(s) of the people that will benefit from your project |

## beneficiariesLeadershipGroupsMigrant

| Rule | Message                                                                               |
| ---- | ------------------------------------------------------------------------------------- |
| base | Select the group(s) of the people that will benefit from your project |

## beneficiariesLeadershipGroupsDisabledPeople

| Rule | Message                                                        |
| ---- | -------------------------------------------------------------- |
| base | Select the group(s) of people that will benefit from your project |

## beneficiariesLeadershipGroupsAge

| Rule | Message                                                                   |
| ---- | ------------------------------------------------------------------------- |
| base | Select the age group(s) of the people that will benefit from your project |

## beneficiariesLeadershipGroupsLGBT

| Rule | Message                                                                               |
| ---- | ------------------------------------------------------------------------------------- |
| base | Select an option |

## beneficiariesLeadershipGroupsOther

| Rule       | Message                                                   |
| ---------- | --------------------------------------------------------- |
| string.max | Answer must be no more than 100 words |

## beneficiariesLeadershipAnyGroupsOther

| Rule       | Message                                                   |
| ---------- | --------------------------------------------------------- |
| string.max | Answer must be no more than 100 words |

