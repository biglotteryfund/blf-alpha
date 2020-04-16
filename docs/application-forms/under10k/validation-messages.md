# Apply for funding under £10,000 validation messages

## projectName

| Rule           | Message              |
| -------------- | -------------------- |
| base | Enter a project name |
| string.max | Project name must be 80 characters or less |

## projectCountry

| Rule           | Message              |
| -------------- | -------------------- |
| base | Select a country |

## projectLocation

| Rule           | Message              |
| -------------- | -------------------- |
| base | Select a location |

## projectLocationDescription

| Rule           | Message              |
| -------------- | -------------------- |
| base | Tell us the towns, villages or wards your beneficiaries live in |
| string.max | Project locations must be 255 characters or less |

## projectStartDate

| Rule           | Message              |
| -------------- | -------------------- |
| any.invalid | Enter a real date |
| base | Enter a project start date |
| dateParts.minDate | Date you start the project must be on or after 20 08 2020 |

## projectEndDate

| Rule           | Message              |
| -------------- | -------------------- |
| any.invalid | Enter a real date |
| base | Enter a project end date |
| dateParts.minDateRef | Date you end the project must be after the start date |
| dateParts.rangeLimit | Date you end the project must be within 15 months of the start date. |

## projectPostcode

| Rule           | Message              |
| -------------- | -------------------- |
| base | Enter a real postcode |

## yourIdeaProject

| Rule           | Message              |
| -------------- | -------------------- |
| string.minWords | Answer must be at least 50 words |
| string.maxWords | Answer must be no more than 300 words |
| base | Tell us about your project |

## yourIdeaPriorities

| Rule           | Message              |
| -------------- | -------------------- |
| string.minWords | Answer must be at least 50 words |
| string.maxWords | Answer must be no more than 150 words |
| base | Tell us how your project meets at least one of our funding priorities |

## yourIdeaCommunity

| Rule           | Message              |
| -------------- | -------------------- |
| string.minWords | Answer must be at least 50 words |
| string.maxWords | Answer must be no more than 200 words |
| base | Tell us how your project involves your community |

## projectBudget

| Rule           | Message              |
| -------------- | -------------------- |
| base | Enter a project budget |
| any.empty | Enter an item or activity |
| string.max | Item or activity must be 255 characters or less |
| number.base | Enter an amount |
| number.integer | Use whole numbers only, eg. 360 |
| number.min | Amount must be £1 or more |
| array.min | Enter at least one item |
| array.max | Enter no more than 10 items |
| budgetItems.overBudget | Costs you would like us to fund must be less than £10,000 |
| budgetItems.underBudget | Costs you would like us to fund must be greater than £300 |

## projectTotalCosts

| Rule           | Message              |
| -------------- | -------------------- |
| base | Enter a total cost for your project |
| number.integer | Total cost must be a whole number (eg. no decimal point) |
| number.min | Total cost must be the same as or higher than the amount you’re asking us to fund |

## beneficiariesGroupsCheck

| Rule           | Message              |
| -------------- | -------------------- |
| base | Select an option |

## beneficiariesGroups

| Rule           | Message              |
| -------------- | -------------------- |
| base | Select the specific group(s) of people your project is aimed at |

## beneficiariesGroupsOther

| Rule           | Message              |
| -------------- | -------------------- |
| string.max | Other specific groups must be 255 characters or less |

## beneficiariesGroupsEthnicBackground

| Rule           | Message              |
| -------------- | -------------------- |
| base | Select the ethnic background(s) of the people that will benefit from your project |

## beneficiariesGroupsGender

| Rule           | Message              |
| -------------- | -------------------- |
| base | Select the gender(s) of the people that will benefit from your project |

## beneficiariesGroupsAge

| Rule           | Message              |
| -------------- | -------------------- |
| base | Select the age group(s) of the people that will benefit from your project |

## beneficiariesGroupsDisabledPeople

| Rule           | Message              |
| -------------- | -------------------- |
| base | Select the disabled people that will benefit from your project |

## beneficiariesGroupsReligion

| Rule           | Message              |
| -------------- | -------------------- |
| base | Select the religion(s) or belief(s) of the people that will benefit from your project |

## beneficiariesGroupsReligionOther

| Rule           | Message              |
| -------------- | -------------------- |
| string.max | Other religions or beliefs must be 255 characters or less |

## beneficiariesWelshLanguage

| Rule           | Message              |
| -------------- | -------------------- |
| base | Select the amount of people who speak Welsh that will benefit from your project |

## beneficiariesNorthernIrelandCommunity

| Rule           | Message              |
| -------------- | -------------------- |
| base | Select the community that the people who will benefit from your project belong to |

## organisationHasDifferentTradingName

| Rule           | Message              |
| -------------- | -------------------- |
| base | Select an option |

## organisationLegalName

| Rule           | Message              |
| -------------- | -------------------- |
| base | Enter the full legal name of the organisation |
| string.max | Full legal name of organisation must be 255 characters or less |

## organisationTradingName

| Rule           | Message              |
| -------------- | -------------------- |
| base | Please provide your organisation's trading name |
| string.max | Organisation's day-to-day name must be 255 characters or less |

## organisationStartDate

| Rule           | Message              |
| -------------- | -------------------- |
| base | Enter a month and year |
| any.invalid | Enter a real month and year |
| number.min | Must be a full year e.g. 2015 |
| monthYear.pastDate | Date you enter must be in the past |

## organisationAddress

| Rule           | Message              |
| -------------- | -------------------- |
| base | Enter a full UK address |
| any.empty | Enter a building and street |
| string.max | Building and street must be 255 characters or less |
| string.max | Address line must be 255 characters or less |
| any.empty | Enter a town or city |
| string.max | Town or city must be 40 characters or less |
| string.max | County must be 80 characters or less |
| any.empty | Enter a postcode |
| string.postcode | Enter a real postcode |

## organisationType

| Rule           | Message              |
| -------------- | -------------------- |
| base | Select a type of organisation |

## organisationSubType

| Rule           | Message              |
| -------------- | -------------------- |
| base | Tell us what type of statutory body you are |

## companyNumber

| Rule           | Message              |
| -------------- | -------------------- |
| base | Enter your organisation’s Companies House number |
| string.max | Companies House number must be 255 characters or less |

## charityNumber

| Rule           | Message              |
| -------------- | -------------------- |
| base | Enter your organisation’s charity number |
| string.regex.base | Enter a real charity registration number. And don’t use any spaces. Scottish charity registration numbers must also use the number ‘0’ in ‘SC0’ instead of the letter ‘O’. |
| string.max | Charity registration number must be 255 characters or less |

## educationNumber

| Rule           | Message              |
| -------------- | -------------------- |
| base | Enter your organisation’s Department for Education number |
| string.max | Department for Education number must be 255 characters or less |

## accountingYearDate

| Rule           | Message              |
| -------------- | -------------------- |
| base | Enter a day and month |
| any.invalid | Enter a real day and month |

## totalIncomeYear

| Rule           | Message              |
| -------------- | -------------------- |
| base | Enter a total income for the year (eg. a whole number with no commas or decimal points) |
| any.invalid | Total income must be a real number |
| number.integer | Total income must be a whole number (eg. no decimal point) |

## mainContactName

| Rule           | Message              |
| -------------- | -------------------- |
| base | Enter first and last name |
| any.empty | Enter first name |
| string.max | First name must be 40 characters or less |
| string.max | Last name must be 80 characters or less |
| any.empty | Enter last name |
| object.isEqual | Main contact name must be different from the senior contact's name |

## mainContactDateOfBirth

| Rule           | Message              |
| -------------- | -------------------- |
| any.invalid | Enter a real date |
| base | Enter a date of birth |
| dateParts.maxDate | Must be at least 16 years old |
| dateParts.minDate | Their birth date is not valid—please use four digits, eg. 1986 |

## mainContactAddress

| Rule           | Message              |
| -------------- | -------------------- |
| base | Enter a full UK address |
| any.empty | Enter a building and street |
| string.max | Building and street must be 255 characters or less |
| string.max | Address line must be 255 characters or less |
| any.empty | Enter a town or city |
| string.max | Town or city must be 40 characters or less |
| string.max | County must be 80 characters or less |
| any.empty | Enter a postcode |
| string.postcode | Enter a real postcode |
| object.isEqual | Main contact address must be different from the senior contact's address |

## mainContactAddressHistory

| Rule           | Message              |
| -------------- | -------------------- |
| base | Enter a full UK address |
| any.required | Choose from one of the options provided |
| any.empty | Enter a building and street |
| string.max | Building and street must be 255 characters or less |
| string.max | Address line must be 255 characters or less |
| any.empty | Enter a town or city |
| any.empty | Enter a county |
| string.max | Town or city must be 40 characters or less |
| string.max | County must be 80 characters or less |
| any.empty | Enter a postcode |
| string.postcode | Enter a real postcode |

## mainContactEmail

| Rule           | Message              |
| -------------- | -------------------- |
| base | Enter an email address |
| string.email | Email address must be in the correct format, like name@example.com |
| any.invalid | Main contact email address must be different from the senior contact's email address |

## mainContactPhone

| Rule           | Message              |
| -------------- | -------------------- |
| base | Enter a UK telephone number |
| string.phonenumber | Enter a real UK telephone number |

## mainContactLanguagePreference

| Rule           | Message              |
| -------------- | -------------------- |
| base | Select a language |

## mainContactCommunicationNeeds

| Rule           | Message              |
| -------------- | -------------------- |
| string.max | Particular communication needs must be 255 characters or less |

## seniorContactRole

| Rule           | Message              |
| -------------- | -------------------- |
| base | Choose a role |
| any.allowOnly | Senior contact role is not valid |

## seniorContactName

| Rule           | Message              |
| -------------- | -------------------- |
| base | Enter first and last name |
| any.empty | Enter first name |
| string.max | First name must be 40 characters or less |
| string.max | Last name must be 80 characters or less |
| any.empty | Enter last name |
| object.isEqual | Senior contact name must be different from the main contact's name |

## seniorContactDateOfBirth

| Rule           | Message              |
| -------------- | -------------------- |
| any.invalid | Enter a real date |
| base | Enter a date of birth |
| dateParts.maxDate | Must be at least 18 years old |
| dateParts.minDate | Their birth date is not valid—please use four digits, eg. 1986 |

## seniorContactAddress

| Rule           | Message              |
| -------------- | -------------------- |
| base | Enter a full UK address |
| any.empty | Enter a building and street |
| string.max | Building and street must be 255 characters or less |
| string.max | Address line must be 255 characters or less |
| any.empty | Enter a town or city |
| string.max | Town or city must be 40 characters or less |
| string.max | County must be 80 characters or less |
| any.empty | Enter a postcode |
| string.postcode | Enter a real postcode |
| object.isEqual | Senior contact address must be different from the main contact's address |

## seniorContactAddressHistory

| Rule           | Message              |
| -------------- | -------------------- |
| base | Enter a full UK address |
| any.required | Choose from one of the options provided |
| any.empty | Enter a building and street |
| string.max | Building and street must be 255 characters or less |
| string.max | Address line must be 255 characters or less |
| any.empty | Enter a town or city |
| any.empty | Enter a county |
| string.max | Town or city must be 40 characters or less |
| string.max | County must be 80 characters or less |
| any.empty | Enter a postcode |
| string.postcode | Enter a real postcode |

## seniorContactEmail

| Rule           | Message              |
| -------------- | -------------------- |
| base | Enter an email address |
| string.email | Email address must be in the correct format, like name@example.com |

## seniorContactPhone

| Rule           | Message              |
| -------------- | -------------------- |
| base | Enter a UK telephone number |
| string.phonenumber | Enter a real UK telephone number |

## seniorContactLanguagePreference

| Rule           | Message              |
| -------------- | -------------------- |
| base | Select a language |

## seniorContactCommunicationNeeds

| Rule           | Message              |
| -------------- | -------------------- |
| string.max | Particular communication needs must be 255 characters or less |

## bankAccountName

| Rule           | Message              |
| -------------- | -------------------- |
| base | Enter the name of your organisation, as it appears on your bank statement |
| string.max | Name of your organisation must be 255 characters or less |

## bankSortCode

| Rule           | Message              |
| -------------- | -------------------- |
| base | Enter a sort code |
| string.length | Sort code must be six digits long |

## bankAccountNumber

| Rule           | Message              |
| -------------- | -------------------- |
| base | Enter an account number |
| string.min | Enter a valid length account number |
| string.max | Enter a valid length account number |

## buildingSocietyNumber

| Rule           | Message              |
| -------------- | -------------------- |
| string.max | Building society number must be 255 characters or less |

## bankStatement

| Rule           | Message              |
| -------------- | -------------------- |
| any.allowOnly | Please upload a file in one of these formats: PNG, JPEG, PDF |
| number.max | Please upload a file below 12MB |
| base | Provide a bank statement |

## termsAgreement1

| Rule           | Message              |
| -------------- | -------------------- |
| base | You must confirm that you're authorised to submit this application |

## termsAgreement2

| Rule           | Message              |
| -------------- | -------------------- |
| base | You must confirm that the information you've provided in this application is accurate |

## termsAgreement3

| Rule           | Message              |
| -------------- | -------------------- |
| base | You must confirm that you understand how we'll use any personal information you've provided |

## termsAgreement4

| Rule           | Message              |
| -------------- | -------------------- |
| base | You must confirm that you understand your application is subject to our Freedom of Information policy |

## termsPersonName

| Rule           | Message              |
| -------------- | -------------------- |
| base | Enter the full name of the person completing this form |
| string.max | Full name must be 255 characters or less |

## termsPersonPosition

| Rule           | Message              |
| -------------- | -------------------- |
| base | Enter the position of the person completing this form |
| string.max | Position in organisation must be 255 characters or less |