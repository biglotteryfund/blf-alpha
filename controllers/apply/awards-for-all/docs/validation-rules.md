# Awards for All: Validation and Error Messages

This file documents validation rules, conditions, and error message text for all fields that make up the Awards for All form.

## Project details

### What is the name of your project?

| Rule           | Message              |
| -------------- | -------------------- |
| Required field | Enter a project name |

### When would you like to start and end your project?

| Rule                              | Message                                                                          |
| --------------------------------- | -------------------------------------------------------------------------------- |
| Required field                    | Enter a date                                                                     |
| Must be a valid date              | Enter a real date                                                                |
| At least 12 weeks into the future | Date you start the project must be after [example date 12 weeks into the future] |

## Project Country

### What country will your project be based in?

| Rule           | Message          |
| -------------- | ---------------- |
| Required field | Choose a valid country |

## Project Location

### Where will your project take place?

| Rule           | Message           |
| -------------- | ----------------- |
| Required field | Choose a location |

### Tell us the towns, villages or wards where your beneficiaries live

| Rule           | Message             |
| -------------- | ------------------- |
| Required field | Enter a description |

### What is the postcode of the location where your project will take place?

| Rule           | Message               |
| -------------- | --------------------- |
| Required field | Enter a postcode      |
| Valid postcode | Enter a real postcode |

## Your idea

### What would you like to do?

| Rule           | Message                               |
| -------------- | ------------------------------------- |
| Required field | Tell us about your project            |
| Min words: 50  | Answer must be at least 50 words      |
| Max words: 300 | Answer must be no more than 300 words |

### How does your project meet at least one of our funding priorities?

| Rule           | Message                               |
| -------------- | ------------------------------------- |
| Required field | Tell us about your project            |
| Min words: 50  | Answer must be at least 50 words      |
| Max words: 150 | Answer must be no more than 150 words |

### How does your project involve your community?

| Rule           | Message                               |
| -------------- | ------------------------------------- |
| Required field | Tell us about your project            |
| Min words: 50  | Answer must be at least 50 words      |
| Max words: 200 | Answer must be no more than 200 words |

### Word count messages

All project idea questions have the following in-browser word-count messages.

| Rule            | Message                                                                                 |
| --------------- | --------------------------------------------------------------------------------------- |
| Word count      | 0 / MAX words. Must be at least MIN words. You can write up to RECOMMENDED words for this section, but don't worry if you use less. |
| Reached minimum | MIN / MAX words. You can write up to RECOMMENDED words for this section, but don't worry if you use less.                          |
| Over limit      | You have X words too many.                                                              |

## Project costs

### Budget Items

| Rule                         | Message                                                        |
| ---------------------------- | -------------------------------------------------------------- |
| Required field               | Enter a project budget                                         |
| Missing item or activity     | Enter an item or activity                                      |
| Missing cost                 | Enter an amount                                                |
| Cost is not a number         | Each cost must be a real number                                |
| Total amount is over £10,000 | Total project costs must be less than £10,000                  |
| Too many rows                | You must use 10 budget headings or fewer to tell us your costs |

### Project total cost

| Rule                 | Message                                                                           |
| -------------------- | --------------------------------------------------------------------------------- |
| Required field       | Enter a total cost for your project                                               |
| Cost is not a number | Total cost must be a real number                                                  |
| Under budget         | Total cost must be the same as or higher than the amount you're asking us to fund |

## Who will benefit

### Is your project aimed at one of the following groups of people?

| Rule           | Message          |
| -------------- | ---------------- |
| Required field | Answer yes or no |

### What specific groups of people is your project aimed at?

Shown if answered "yes" to the question above.

| Rule           | Message                                 |
| -------------- | --------------------------------------- |
| Required field | Choose from one of the options provided |

An additional "Other" field is provided for free text responses.

### Ethnic background

| Rule           | Message                                 |
| -------------- | --------------------------------------- |
| Required field | Choose from one of the options provided |

#### Conditions

-   If the **beneficiary groups** response includes 'ethnic-background' this question will be shown.

### Gender

| Rule           | Message                                 |
| -------------- | --------------------------------------- |
| Required field | Choose from one of the options provided |

#### Conditions

-   If the **beneficiary groups** response includes 'gender' this question will be shown.

### Age

| Rule           | Message                                 |
| -------------- | --------------------------------------- |
| Required field | Choose from one of the options provided |

#### Conditions

-   If the **beneficiary groups** response includes 'age' this question will be shown.

### Disabled people

| Rule           | Message                                 |
| -------------- | --------------------------------------- |
| Required field | Choose from one of the options provided |

#### Conditions

-   If the **beneficiary groups** response includes 'disabled-people' this question will be shown.

### Religion

| Rule           | Message                                 |
| -------------- | --------------------------------------- |
| Required field | Choose from one of the options provided |

#### Conditions

-   If the **beneficiary groups** response includes 'religion' this question will be shown.

An additional "Other" field is provided for free text responses.

### How many of the people who will benefit from your project speak Welsh?

| Rule           | Message          |
| -------------- | ---------------- |
| Required field | Choose an option |

#### Conditions

-   If the **project country** is **Wales** this question will be shown.

### Which community do the people who will benefit from your project belong to?

| Rule           | Message          |
| -------------- | ---------------- |
| Required field | Choose an option |

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

### Organisation address

| Rule                   | Message                     |
| ---------------------- | --------------------------- |
| Required field         | Enter a full UK address     |
| No building and street | Enter a building and street |
| No town or city        | Enter a town or city        |
| No county              | Enter a county              |
| No postcode            | Enter a postcode            |
| Valid postcode         | Enter a real postcode       |

### Organisation type

| Rule           | Message                       |
| -------------- | ----------------------------- |
| Required field | Choose a type of organisation |

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

## Main contact

### Main contact first name

| Rule           | Message          |
| -------------- | ---------------- |
| Required field | Enter first name |

### Main contact last name

| Rule           | Message         |
| -------------- | --------------- |
| Required field | Enter last name |

### Main contact date of birth

| Rule                 | Message                                    |
| -------------------- | ------------------------------------------ |
| Required field       | Enter a date of birth                      |
| Must be a valid date | Enter a real date                          |
| Date of birth        | Main contact must be at least 16 years old |

#### Conditions

-   If the **organisation type** is either **school**, **college/university** or **statutory body** then this field will not be shown.

### Main contact address

| Rule                   | Message                     |
| ---------------------- | --------------------------- |
| Required field         | Enter a full UK address     |
| No building and street | Enter a building and street |
| No town or city        | Enter a town or city        |
| No county              | Enter a county              |
| No postcode            | Enter a postcode            |
| Valid postcode         | Enter a real postcode       |

#### Conditions

-   If the **organisation type** is either **school**, **college/university** or **statutory body** then this field will not be shown.

### Main contact address history

| Rule                   | Message                                 |
| ---------------------- | --------------------------------------- |
| Required field         | Enter a full UK address                 |
| Invalid choice         | Choose from one of the options provided |
| No building and street | Enter a building and street             |
| No town or city        | Enter a town or city                    |
| No county              | Enter a county                          |
| No postcode            | Enter a postcode                        |
| Valid postcode         | Enter a real postcode                   |

#### Conditions

-   If the **organisation type** is either **school**, **college/university** or **statutory body** then this field will not be shown.

### Main contact email

| Rule           | Message                                                            |
| -------------- | ------------------------------------------------------------------ |
| Required field | Enter an email address                                             |
| Invalid format | Email address must be in the correct format, like name@example.com |

### Main contact phone

| Rule                 | Message                          |
| -------------------- | -------------------------------- |
| Required field       | Enter a UK telephone number      |
| Invalid phone number | Enter a real UK telephone number |

**Note**: Phone numbers validated using [joi-phone-number](https://github.com/Salesflare/joi-phone-number) which is a wrapper around the Google `libphonenumber` library.

### Main contact communication needs

| Rule           | Message                                 |
| -------------- | --------------------------------------- |
| Optional field | n/a                                     |
| Invalid choice | Choose from one of the options provided |

## Senior contact

### Senior contact first name

| Rule           | Message          |
| -------------- | ---------------- |
| Required field | Enter first name |

### Senior contact last name

| Rule           | Message         |
| -------------- | --------------- |
| Required field | Enter last name |

### Senior contact role

| Rule           | Message       |
| -------------- | ------------- |
| Required field | Choose a role |

#### Mappings

The senior contact role shows the following choices depending on the organisation type:

| Organisation type                                | Choices                                   |
| ------------------------------------------------ | ----------------------------------------- |
| Unregistered voluntary or community organisation | Chair, Vice-chair, Secretary, Treasurer   |
| Registered charity (unincorporated)              | Trustee                                   |
| Charitable incorporated organisation (CIO)       | Trustee, Chief Executive Officer          |
| Not-for-profit company                           | Company Director, Company Secretary       |
| School                                           | Head Teacher                              |
| College or University                            | Chancellor, Vice-chancellor               |
| Statutory body: Parish Council                   | Parish Clerk, Deputy Parish Clerk         |
| Statutory body: Town Council                     | Elected Member, Chair                     |
| Statutory body: Local Authority                  | Chair, Chief Executive Officer, Director  |
| Statutory body: NHS Trust                        | Chief Executive, Director                 |
| Statutory body: Prison Service                   | Free text                                 |
| Statutory body: Fire Service                     | Free text                                 |
| Statutory body: Police Authority                 | Free text                                 |

### Senior contact date of birth

| Rule                 | Message                                      |
| -------------------- | -------------------------------------------- |
| Required field       | Enter a date of birth                        |
| Must be a valid date | Enter a real date                            |
| Date of birth        | Senior contact must be at least 18 years old |

#### Conditions

-   If the **organisation type** is either **school**, **college/university**  or **statutory body** then this field will not be shown.

### Senior contact address

| Rule                   | Message                     |
| ---------------------- | --------------------------- |
| Required field         | Enter a full UK address     |
| No building and street | Enter a building and street |
| No town or city        | Enter a town or city        |
| No county              | Enter a county              |
| No postcode            | Enter a postcode            |
| Valid postcode         | Enter a real postcode       |

### Senior contact address history

Address history field group, consists of:

| Rule                   | Message                                 |
| ---------------------- | --------------------------------------- |
| Required field         | Enter a full UK address                 |
| Invalid choice         | Choose from one of the options provided |
| No building and street | Enter a building and street             |
| No town or city        | Enter a town or city                    |
| No county              | Enter a county                          |
| No postcode            | Enter a postcode                        |
| Valid postcode         | Enter a real postcode                   |

#### Conditions

-   If the **organisation type** is either **school**, **college/university** or **statutory body** then this field will not be shown.

### Senior contact email

| Rule           | Message                                                            |
| -------------- | ------------------------------------------------------------------ |
| Required field | Enter an email address                                             |
| Invalid format | Email address must be in the correct format, like name@example.com |

### Senior contact phone

| Rule                 | Message                          |
| -------------------- | -------------------------------- |
| Required field       | Enter a UK telephone number      |
| Invalid phone number | Enter a real UK telephone number |

### Senior contact communication needs

| Rule           | Message                                 |
| -------------- | --------------------------------------- |
| Optional field | n/a                                     |
| Invalid choice | Choose from one of the options provided |

## Bank details

### Account name

| Rule           | Message                            |
| -------------- | ---------------------------------- |
| Required field | Name on the bank account |

### Sort code

| Rule           | Message           |
| -------------- | ----------------- |
| Required field | Enter a sort-code |

### Account number

| Rule           | Message                 |
| -------------- | ----------------------- |
| Required field | Enter an account number |

### Building society number

| Rule           | Message |
| -------------- | ------- |
| Optional field | n/a     |

### Bank statement

| Rule           | Message                  |
| -------------- | ------------------------ |
| Required field | Provide a bank statement |
