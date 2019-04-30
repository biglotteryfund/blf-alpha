# Awards for All: Validation and Error Messages

This file documents validation rules, conditions, and error message text for all fields that make up the Awards for All form.

## Project details

### What is the name of your project?

**Type**: string

| Rule           | Message              |
| -------------- | -------------------- |
| Required field | Enter a project name |

### When is the planned (or estimated) start date of your project?

**Type**: date

| Rule                              | Message                                                                    |
| --------------------------------- | -------------------------------------------------------------------------- |
| Required field                    | Enter a date                                                               |
| Must be a valid date              | Enter a real date                                                          |
| At least 12 weeks into the future | Date you start the project must be after 25 July 2019/12 WEEKS INTO FUTURE |

### What country will your project be based in?

**Type**: single choice (radio)

| Rule           | Message          |
| -------------- | ---------------- |
| Required field | Choose a country |

### What is the postcode of the location where your project will take place?

**Type**: string, postcode

| Rule           | Message               |
| -------------- | --------------------- |
| Required field | Enter a postcode      |
| Valid postcode | Enter a real postcode |

## Your idea

### What would you like to do?

**Type**: text

| Rule           | Message                               |
| -------------- | ------------------------------------- |
| Required field | Tell us about your project            |
| Min words: 50  | Answer must be at least 50 words      |
| Max words: 300 | Answer must be no more than 300 words |

### How does your project meet at least one of our funding priorities?

**Type**: text

| Rule           | Message                               |
| -------------- | ------------------------------------- |
| Required field | Tell us about your project            |
| Min words: 50  | Answer must be at least 50 words      |
| Max words: 150 | Answer must be no more than 150 words |

### How does your project involve your community?

**Type**: text

| Rule           | Message                               |
| -------------- | ------------------------------------- |
| Required field | Tell us about your project            |
| Min words: 50  | Answer must be at least 50 words      |
| Max words: 200 | Answer must be no more than 200 words |

### Word count messages

All project idea questions have the following in-browser word-count messages.

| Rule            | Message                                                                                 |
| --------------- | --------------------------------------------------------------------------------------- |
| Word count      | 0 / MAX words. Must be at least MIN words. We recommend using around RECOMMENDED words. |
| Reached minimum | MIN / MAX words. We recommend using around \RECOMMENDED words.                          |
| Over limit      | You have X words too many.                                                              |

## Project costs

### Budget Items

**Type**: list of items and costs

| Rule                         | Message                                                        |
| ---------------------------- | -------------------------------------------------------------- |
| Required field               | Enter a project budget                                         |
| Missing item or activity     | Enter an item or activity                                      |
| Missing cost                 | Enter an amount                                                |
| Cost is not a number         | Each cost must be a real number                                |
| Total amount is over £10,000 | Total project costs must be less than £10,000                  |
| Too many rows                | You must use 10 budget headings or fewer to tell us your costs |

### Project total cost

**Type**: number

| Rule                 | Message                                                                           |
| -------------------- | --------------------------------------------------------------------------------- |
| Required field       | Enter a total cost for your project                                               |
| Cost is not a number | Total cost must be a real number                                                  |
| Under budget         | Total cost must be the same as or higher than the amount you're asking us to fund |

## Your organisation

### Organisation legal name

**Type**: string

| Rule           | Message                                       |
| -------------- | --------------------------------------------- |
| Required field | Enter the full legal name of the organisation |

### Organisation alias

_Does your organisation use a different name in your day-to-day work?_

**Type**: string

| Rule           | Message |
| -------------- | ------- |
| Optional field | n/a     |

### Organisation address

**Type**: address

Address field group, consists of:

-   Building and street
-   Town or city
-   County (optional)
-   Postcode

| Rule                   | Message                     |
| ---------------------- | --------------------------- |
| Required field         | Enter a full UK address     |
| No building and street | Enter a building and street |
| No town or city        | Enter a town or city        |
| No county              | Enter a county              |
| No postcode            | Enter a postcode            |
| Valid postcode         | Enter a real postcode       |

### Organisation type

**Type**: single choice (radio)

| Rule           | Message                       |
| -------------- | ----------------------------- |
| Required field | Choose a type of organisation |

### Company number

**Type**: string

| Rule              | Message                                          |
| ----------------- | ------------------------------------------------ |
| Conditional field | Enter your organisation's Companies House number |

#### Conditions

-   If the **organisation type** is a **not for profit company** then this field will be **required**, otherwise it is _optional_.

### Charity number

**Type**: string

| Rule              | Message                                  |
| ----------------- | ---------------------------------------- |
| Conditional field | Enter your organisation's charity number |

### Department for Education number

**Type**: string

| Rule              | Message                                    |
| ----------------- | ------------------------------------------ |
| Conditional field | Enter your Department for Education number |

#### Conditions

-   If the **organisation type** is a **school** then this field will be **required**, otherwise it is _optional_.

#### Conditions

-   If the **organisation type** is an **unincorporated registered charity** or **CIO** then the field will be shown and **required**.
-   If the **organisation type** is a **not for profit company** then this field will be shown but _optional_.

### Accounting year date

**Type**: day and month

| Rule                 | Message                    |
| -------------------- | -------------------------- |
| Required field       | Enter a day and month      |
| Must be a valid date | Enter a real day and month |

### Total income for the year

**Type**: number

| Rule                   | Message                            |
| ---------------------- | ---------------------------------- |
| Required field         | Enter a total income for the year  |
| Must be a valid number | Total income must be a real number |

## Main contact

### Main contact first name

**Type**: string

| Rule           | Message          |
| -------------- | ---------------- |
| Required field | Enter first name |

### Main contact last name

**Type**: string

| Rule           | Message         |
| -------------- | --------------- |
| Required field | Enter last name |

### Main contact date of birth

**Type**: date

| Rule                 | Message                                    |
| -------------------- | ------------------------------------------ |
| Required field       | Enter a date of birth                      |
| Must be a valid date | Enter a real date                          |
| Date of birth        | Main contact must be at least 16 years old |

#### Conditions

-   If the **organisation type** is either **school / educational body** or **statutory body** then this field will not be shown.

### Main contact address

**Type**: address

Address field group, consists of:

-   Building and street
-   Town or city
-   County (optional)
-   Postcode

| Rule                   | Message                     |
| ---------------------- | --------------------------- |
| Required field         | Enter a full UK address     |
| No building and street | Enter a building and street |
| No town or city        | Enter a town or city        |
| No county              | Enter a county              |
| No postcode            | Enter a postcode            |
| Valid postcode         | Enter a real postcode       |

#### Conditions

-   If the **organisation type** is either **school / educational body** or **statutory body** then this field will not be shown.

### Main contact address history

**Type**: address-history

Address history field group, consists of:

-   Have you lived at your last address for at least three years?
-   Building and street
-   Town or city
-   County (optional)
-   Postcode

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

-   If the **organisation type** is either **school / educational body** or **statutory body** then this field will not be shown.

### Main contact email

**Type**: email

| Rule           | Message                                                            |
| -------------- | ------------------------------------------------------------------ |
| Required field | Enter an email address                                             |
| Invalid format | Email address must be in the correct format, like name@example.com |

### Main contact phone

**Type**: string

| Rule                 | Message                          |
| -------------------- | -------------------------------- |
| Required field       | Enter a UK telephone number      |
| Invalid phone number | Enter a real UK telephone number |

**Note**: Phone numbers validated using [joi-phone-number](https://github.com/Salesflare/joi-phone-number) which is a wrapper around the Google `libphonenumber` library.

### Main contact communication needs

**Type**: multiple choice (checkbox)

| Rule           | Message                                 |
| -------------- | --------------------------------------- |
| Optional field | n/a                                     |
| Invalid choice | Choose from one of the options provided |

## Senior contact

### Senior contact first name

**Type**: string

| Rule           | Message          |
| -------------- | ---------------- |
| Required field | Enter first name |

### Senior contact last name

**Type**: string

| Rule           | Message         |
| -------------- | --------------- |
| Required field | Enter last name |

### Senior contact role

**Type**: single choice (radio)

| Rule           | Message       |
| -------------- | ------------- |
| Required field | Choose a role |

#### Mappings

The senior contact role shows the following choices depending on the organisation type:

| Organisation type                                | Choices                                   |
| ------------------------------------------------ | ----------------------------------------- |
| Unregistered voluntary or community organisation | Chair, Vice-chair, Secretary, Treasurer   |
| Registered charity (unincorporated)              | Trustee                                   |
| Charitable incorporated organisation (CIO)       | Trustee                                   |
| Not-for-profit company                           | Company Director, Company Secretary       |
| School or educational body                       | Head Teacher, Chancellor, Vice-chancellor |
| Statutory body                                   | Parish Clerk, Chief Executive             |

### Senior contact date of birth

**Type**: date

| Rule                 | Message                                      |
| -------------------- | -------------------------------------------- |
| Required field       | Enter a date of birth                        |
| Must be a valid date | Enter a real date                            |
| Date of birth        | Senior contact must be at least 18 years old |

#### Conditions

-   If the **organisation type** is either **school / educational body** or **statutory body** then this field will not be shown.

### Senior contact address

**Type**: address

Address field group, consists of:

-   Building and street
-   Town or city
-   County (optional)
-   Postcode

| Rule                   | Message                     |
| ---------------------- | --------------------------- |
| Required field         | Enter a full UK address     |
| No building and street | Enter a building and street |
| No town or city        | Enter a town or city        |
| No county              | Enter a county              |
| No postcode            | Enter a postcode            |
| Valid postcode         | Enter a real postcode       |

### Senior contact address history

**Type**: address-history

Address history field group, consists of:

-   Have you lived at your last address for at least three years?
-   Building and street
-   Town or city
-   County (optional)
-   Postcode

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

-   If the **organisation type** is either **school / educational body** or **statutory body** then this field will not be shown.

#### Conditions

-   If the **organisation type** is either **school / educational body** or **statutory body** then this field will not be shown.

### Senior contact email

**Type**: email

| Rule           | Message                                                            |
| -------------- | ------------------------------------------------------------------ |
| Required field | Enter an email address                                             |
| Invalid format | Email address must be in the correct format, like name@example.com |

### Senior contact phone

**Type**: string

| Rule                 | Message                          |
| -------------------- | -------------------------------- |
| Required field       | Enter a UK telephone number      |
| Invalid phone number | Enter a real UK telephone number |

**Note**: Phone numbers validated using [joi-phone-number](https://github.com/Salesflare/joi-phone-number) which is a wrapper around the Google `libphonenumber` library.

### Senior contact communication needs

**Type**: multiple choice (checkbox)

| Rule           | Message                                 |
| -------------- | --------------------------------------- |
| Optional field | n/a                                     |
| Invalid choice | Choose from one of the options provided |

## Bank details

### Account name

**Type**: string

| Rule           | Message                            |
| -------------- | ---------------------------------- |
| Required field | Enter the name on the bank account |

### Sort code

**Type**: string

| Rule           | Message           |
| -------------- | ----------------- |
| Required field | Enter a sort-code |

### Account number

**Type**: string

| Rule           | Message                 |
| -------------- | ----------------------- |
| Required field | Enter an account number |

### Building society number

**Type**: string

| Rule           | Message |
| -------------- | ------- |
| Optional field | n/a     |

### Bank statement

**Type**: file

| Rule           | Message                  |
| -------------- | ------------------------ |
| Required field | Provide a bank statement |
