# Awards for All: Validation and Error Messages

This file documents validation rules, conditions, and error message text for all fields that make up the Awards for All form.

## Project details

### What is the name of your project?

| Rule           | Message              |
| -------------- | -------------------- |
| Required field | Enter a project name |

### When would you like to start and end your project?

| Rule                   | Message                                                                  |
| ---------------------- | ------------------------------------------------------------------------ |
| Required field         | Enter a project start and end date                                       |
| Both invalid           | Project start and end dates must be real dates                           |
| Start date invalid     | Date you start the project must be a real date                           |
| End date invalid       | Date you end the project must be a real date                             |
| Date too soon          | Date you start the project must be after [example date]                  |
| Ends before start date | Date you end the project must be after the start date                    |
| Outside limit          | Date you end the project must be within [max duration] of the start date |

## Project Country

### What country will your project be based in?

| Rule           | Message          |
| -------------- | ---------------- |
| Required field | Select a country |

## Project Location

### Where will your project take place?

| Rule           | Message           |
| -------------- | ----------------- |
| Required field | Select a location |

### Tell us the towns, villages or wards where your beneficiaries live

| Rule           | Message                                                         |
| -------------- | --------------------------------------------------------------- |
| Required field | Tell us the towns, villages or wards your beneficiaries live in |

### What is the postcode of the location where your project will take place?

| Rule           | Message               |
| -------------- | --------------------- |
| Valid postcode | Enter a real postcode |

## Your idea

### What would you like to do?

| Rule           | Message                                 |
| -------------- | --------------------------------------- |
| Required field | Tell us about your project              |
| Min words      | Answer must be at least [min] words     |
| Max words      | Answer must be no more than [max] words |

### How does your project meet at least one of our funding priorities?

| Rule           | Message                                                               |
| -------------- | --------------------------------------------------------------------- |
| Required field | Tell us how your project meets at least one of our funding priorities |
| Min words      | Answer must be at least [min] words                                   |
| Max words      | Answer must be no more than [max] words                               |

### How does your project involve your community?

| Rule           | Message                                          |
| -------------- | ------------------------------------------------ |
| Required field | Tell us how your project involves your community |
| Min words      | Answer must be at least [min] words              |
| Max words      | Answer must be no more than [max] words          |

### Word count messages

All project idea questions have the following in-browser word-count messages.

| Rule            | Message                                                                                                                               |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Word count      | [x] / [max] words. Must be at least [min] words. You can write up to [limit] words for this section, but don't worry if you use less. |
| Reached minimum | [min] / [max] words. You can write up to [limit] words for this section, but don't worry if you use less.                             |
| Over limit      | You have [x] words too many.                                                                                                          |

## Project costs

### Budget Items

Server-side errors:

| Rule                  | Message                                  |
| --------------------- | ---------------------------------------- |
| Required field        | Enter a project budget                   |
| Missing description   | Enter an item or activity                |
| Missing cost          | Enter an amount                          |
| Cost is not a number  | Each cost must be a real number          |
| Amount is below limit | Project costs must be greater than [min] |
| Amount is over limit  | Project costs must be less than [max]    |

Client-side warnings:

| Rule                  | Message                                                        |
| --------------------- | -------------------------------------------------------------- |
| Amount is below limit | Project costs must be greater than [min]                       |
| Amount is over limit  | Project costs must be less than [max]                          |
| Too many rows         | You must use 10 budget headings or fewer to tell us your costs |

### Project total cost

| Rule                 | Message                                                                           |
| -------------------- | --------------------------------------------------------------------------------- |
| Required field       | Enter a total cost for your project                                               |
| Cost is not a number | Total cost must be a real number                                                  |
| Under budget         | Total cost must be the same as or higher than the amount you’re asking us to fund |

## Who will benefit

### Is your project aimed at one of the following groups of people?

| Rule           | Message          |
| -------------- | ---------------- |
| Required field | Select yes or no |

### What specific groups of people is your project aimed at?

Shown if answered "yes" to the question above.

| Rule           | Message                                                         |
| -------------- | --------------------------------------------------------------- |
| Required field | Select the specific group(s) of people your project is aimed at |

An additional "Other" field is provided for free text responses.

### Ethnic background

| Rule           | Message                                                                           |
| -------------- | --------------------------------------------------------------------------------- |
| Required field | Select the ethnic background(s) of the people that will benefit from your project |

#### Conditions

-   If the **beneficiary groups** response includes 'ethnic-background' this question will be shown.

### Gender

| Rule           | Message                                                                |
| -------------- | ---------------------------------------------------------------------- |
| Required field | Select the gender(s) of the people that will benefit from your project |

#### Conditions

-   If the **beneficiary groups** response includes 'gender' this question will be shown.

### Age

| Rule           | Message                                                                   |
| -------------- | ------------------------------------------------------------------------- |
| Required field | Select the age group(s) of the people that will benefit from your project |

#### Conditions

-   If the **beneficiary groups** response includes 'age' this question will be shown.

### Disabled people

| Rule           | Message                                                        |
| -------------- | -------------------------------------------------------------- |
| Required field | Select the disabled people that will benefit from your project |

#### Conditions

-   If the **beneficiary groups** response includes 'disabled-people' this question will be shown.

### Religion

| Rule           | Message                                                                               |
| -------------- | ------------------------------------------------------------------------------------- |
| Required field | Select the religion(s) or belief(s) of the people that will benefit from your project |

#### Conditions

-   If the **beneficiary groups** response includes 'religion' this question will be shown.

An additional "Other" field is provided for free text responses.

### How many of the people who will benefit from your project speak Welsh?

| Rule           | Message                                                                         |
| -------------- | ------------------------------------------------------------------------------- |
| Required field | Select the amount of people who speak Welsh that will benefit from your project |

#### Conditions

-   If the **project country** is **Wales** this question will be shown.

### Which community do the people who will benefit from your project belong to?

| Rule           | Message                                                                           |
| -------------- | --------------------------------------------------------------------------------- |
| Required field | Select the community that the people who will benefit from your project belong to |

#### Conditions

-   If the **project country** is **Northern Ireland** this question will be shown.

## Your organisation

### Organisation legal name

| Rule           | Message                                       |
| -------------- | --------------------------------------------- |
| Required field | Enter the full legal name of the organisation |

### Organisation alias

_Does your organisation use a different name in your day-to-day work?_

| Rule           | Message |
| -------------- | ------- |
| Optional field | n/a     |

### When was your organisation set up?

| Rule         | Message                            |
| ------------ | ---------------------------------- |
| Empty        | Enter a month and year             |
| Invalid date | Enter a real month and year        |
| In future    | Date you enter must be in the past |

### Organisation address

| Rule                       | Message                     |
| -------------------------- | --------------------------- |
| Required field             | Enter a full UK address     |
| No building and street     | Enter a building and street |
| No town or city            | Enter a town or city        |
| No county (optional field) | n/a                         |
| No postcode                | Enter a postcode            |
| Valid postcode             | Enter a real postcode       |

### Organisation type

| Rule           | Message                       |
| -------------- | ----------------------------- |
| Required field | Select a type of organisation |

### Company number

| Rule              | Message                                          |
| ----------------- | ------------------------------------------------ |
| Conditional field | Enter your organisation's Companies House number |

#### Conditions

-   If the **organisation type** is a **not for profit company** then this field will be **required**, otherwise it is _optional_.

### Charity number

| Rule              | Message                                  |
| ----------------- | ---------------------------------------- |
| Conditional field | Enter your organisation's charity number |

### Department for Education number

| Rule              | Message                                    |
| ----------------- | ------------------------------------------ |
| Conditional field | Enter your Department for Education number |

#### Conditions

-   If the **organisation type** is an **unincorporated registered charity** or **CIO** then the field will be shown and **required**.
-   If the **organisation type** is a **not for profit company** then this field will be shown but _optional_.

### Accounting year date

| Rule                 | Message                    |
| -------------------- | -------------------------- |
| Required field       | Enter a day and month      |
| Must be a valid date | Enter a real day and month |

### Total income for the year

| Rule                   | Message                            |
| ---------------------- | ---------------------------------- |
| Required field         | Enter a total income for the year  |
| Must be a valid number | Total income must be a real number |

## Senior contact

### Senior contact first name

### Senior contact name

| Rule                   | Message                                                         |
| ---------------------- | --------------------------------------------------------------- |
| Required field         | Enter a first and last name                                     |
| First name missing     | Enter first name                                                |
| Last name missing      | Enter last name                                                 |
| Matches Senior Contact | Senior contact must be a different person from the main contact |

#### Mappings

The senior contact role shows the following choices depending on the organisation type:

| Organisation type                                | Choices                                  |
| ------------------------------------------------ | ---------------------------------------- |
| Unregistered voluntary or community organisation | Chair, Vice-chair, Secretary, Treasurer  |
| Registered charity (unincorporated)              | Trustee                                  |
| Charitable incorporated organisation (CIO)       | Trustee, Chief Executive Officer         |
| Not-for-profit company                           | Company Director, Company Secretary      |
| School                                           | Head Teacher                             |
| College or University                            | Chancellor, Vice-chancellor              |
| Statutory body: Parish Council                   | Parish Clerk, Deputy Parish Clerk        |
| Statutory body: Town Council                     | Elected Member, Chair                    |
| Statutory body: Local Authority                  | Chair, Chief Executive Officer, Director |
| Statutory body: NHS Trust                        | Chief Executive, Director                |
| Statutory body: Prison Service                   | Free text                                |
| Statutory body: Fire Service                     | Free text                                |
| Statutory body: Police Authority                 | Free text                                |

### Senior contact date of birth

| Rule                 | Message                                      |
| -------------------- | -------------------------------------------- |
| Required field       | Enter a date of birth                        |
| Must be a valid date | Enter a real date                            |
| Date of birth        | Senior contact must be at least 18 years old |

#### Conditions

-   If the **organisation type** is either **school**, **college/university** or **statutory body** then this field will not be shown.

### Senior contact address

| Rule                       | Message                     |
| -------------------------- | --------------------------- |
| Required field             | Enter a full UK address     |
| No building and street     | Enter a building and street |
| No town or city            | Enter a town or city        |
| No county (optional field) | n/a                         |
| No postcode                | Enter a postcode            |
| Valid postcode             | Enter a real postcode       |

### Senior contact address history

Address history field group, consists of:

| Rule                       | Message                     |
| -------------------------- | --------------------------- |
| Required field             | Enter a full UK address     |
| No building and street     | Enter a building and street |
| No town or city            | Enter a town or city        |
| No county (optional field) | n/a                         |
| No postcode                | Enter a postcode            |
| Valid postcode             | Enter a real postcode       |

#### Conditions

-   If the **organisation type** is either **school**, **college/university** or **statutory body** then this field will not be shown.

### Senior contact email

| Rule                 | Message                                                                              |
| -------------------- | ------------------------------------------------------------------------------------ |
| Required field       | Enter an email address                                                               |
| Invalid format       | Email address must be in the correct format, like name@example.com                   |
| Matches main contact | Senior contact email address must be different from the main contact's email address |

### Senior contact phone

| Rule                 | Message                          |
| -------------------- | -------------------------------- |
| Required field       | Enter a UK telephone number      |
| Invalid phone number | Enter a real UK telephone number |

### Senior contact communication needs

| Rule           | Message |
| -------------- | ------- |
| Optional field | n/a     |

## Main contact

### Main contact name

| Rule                   | Message                                                         |
| ---------------------- | --------------------------------------------------------------- |
| Required field         | Enter a first and last name                                     |
| First name missing     | Enter first name                                                |
| Last name missing      | Enter last name                                                 |
| Matches Senior Contact | Main contact must be a different person from the senior contact |

### Main contact date of birth

| Rule                 | Message                                    |
| -------------------- | ------------------------------------------ |
| Required field       | Enter a date of birth                      |
| Must be a valid date | Enter a real date                          |
| Date of birth        | Main contact must be at least 16 years old |

#### Conditions

-   If the **organisation type** is either **school**, **college/university** or **statutory body** then this field will not be shown.

### Main contact address

| Rule                       | Message                     |
| -------------------------- | --------------------------- |
| Required field             | Enter a full UK address     |
| No building and street     | Enter a building and street |
| No town or city            | Enter a town or city        |
| No county (optional field) | n/a                         |
| No postcode                | Enter a postcode            |
| Valid postcode             | Enter a real postcode       |

#### Conditions

-   If the **organisation type** is either **school**, **college/university** or **statutory body** then this field will not be shown.

### Main contact address history

| Rule                       | Message                     |
| -------------------------- | --------------------------- |
| Required field             | Enter a full UK address     |
| No building and street     | Enter a building and street |
| No town or city            | Enter a town or city        |
| No county (optional field) | n/a                         |
| No postcode                | Enter a postcode            |
| Valid postcode             | Enter a real postcode       |

#### Conditions

-   If the **organisation type** is either **school**, **college/university** or **statutory body** then this field will not be shown.

### Main contact email

| Rule                   | Message                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------ |
| Required field         | Enter an email address                                                               |
| Invalid format         | Email address must be in the correct format, like name@example.com                   |
| Matches senior contact | Main contact email address must be different from the senior contact's email address |

### Main contact phone

| Rule                 | Message                          |
| -------------------- | -------------------------------- |
| Required field       | Enter a UK telephone number      |
| Invalid phone number | Enter a real UK telephone number |

### Main contact communication needs

| Rule           | Message |
| -------------- | ------- |
| Optional field | n/a     |

## Bank details

### Account name

| Rule           | Message                                                                  |
| -------------- | ------------------------------------------------------------------------ |
| Required field | Enter the name of your organisation as it appears on your bank statement |

### Sort code

| Rule           | Message                           |
| -------------- | --------------------------------- |
| Required field | Enter a sort code                 |
| Invalid length | Sort code must be six digits long |

### Account number

| Rule           | Message                                                        |
| -------------- | -------------------------------------------------------------- |
| Required field | Enter an account number                                        |
| Too short      | Is this correct? Account numbers are usually eight digits long |

### Building society number

| Rule           | Message |
| -------------- | ------- |
| Optional field | n/a     |

### Bank statement

| Rule           | Message                                                       |
| -------------- | ------------------------------------------------------------- |
| Required field | Provide a bank statement                                      |
| Invalid format | Please upload a file in one of these formats: [valid formats] |
| Too large      | Please upload a file below [max size]                         |

## Terms

### Terms checkbox 1

| Rule     | Message                                                            |
| -------- | ------------------------------------------------------------------ |
| Required | You must confirm that you're authorised to submit this application |

### Terms checkbox 2

| Rule     | Message                                                                               |
| -------- | ------------------------------------------------------------------------------------- |
| Required | You must confirm that the information you've provided in this application is accurate |

### Terms checkbox 3

| Rule     | Message                                                                                     |
| -------- | ------------------------------------------------------------------------------------------- |
| Required | You must confirm that you understand how we'll use any personal information you've provided |

### Terms checkbox 3

| Rule     | Message                                                                                               |
| -------- | ----------------------------------------------------------------------------------------------------- |
| Required | You must confirm that you understand your application is subject to our Freedom of Information policy |

### Full name of person completing this form

| Rule     | Message                                                |
| -------- | ------------------------------------------------------ |
| Required | Enter the full name of the person completing this form |

### Position in organisation

| Rule     | Message                                               |
| -------- | ----------------------------------------------------- |
| Required | Enter the position of the person completing this form |
