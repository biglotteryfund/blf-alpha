# Validation and Error Messages

## Application details

### Application title

**Type**: string

| Rule           | Message              |
| -------------- | -------------------- |
| Required field | Enter a project name |

### Application country

**Type**: single choice (radio)

| Rule           | Message          |
| -------------- | ---------------- |
| Required field | Choose a country |

## Your project

### Project start date

**Type**: date

| Rule                              | Message                                        |
| --------------------------------- | ---------------------------------------------- |
| Required field                    | Enter a date                                   |
| Must be a valid date              | Enter a real date                              |
| At least 12 weeks into the future | Date must be at least 12 weeks into the future |

### Project postcode

**Type**: string, postcode

| Rule           | Message          |
| -------------- | ---------------- |
| Required field | Enter a postcode |
| Valid postcode | Enter a postcode |

### Your idea

**Type**: text

Server-side rules and messages:

| Rule           | Message                        |
| -------------- | ------------------------------ |
| Required field | Tell us about your idea        |
| Min words: 50  | Must be at least 50 words      |
| Max words: 500 | Must be no more than 500 words |

Word count messages (in-browser):

| Rule            | Message                                                                             |
| --------------- | ----------------------------------------------------------------------------------- |
| Word count      | 0 / 500 words. Must be at least 10 words. You have a maximum of 47 words remaining. |
| Reached minimum | 50 / 500 words. You have a maximum of 450 words remaining.                          |
| Over limit      | You have 30 words too many.                                                         |

### Project budget

**Type**: list of items and costs

| Rule                         | Message                                                            |
| ---------------------------- | ------------------------------------------------------------------ |
| Required field               | Enter a project budget                                             |
| Missing name and/or cost     | Please supply both an item name and a cost                         |
| Cost is not a number         | Make sure each cost is a valid number                              |
| Total amount is over £10,000 | You have exceeded the budget limit for this application of £10,000 |
| Too many rows                | You have added the maximum number of budget rows available (10)    |

### Project total cost

**Type**: number

| Rule           | Message                                               |
| -------------- | ----------------------------------------------------- |
| Required field | Enter a total cost for your project, must be a number |

## Your organisation

### Organisation legal name

**Type**: string

| Rule           | Message                                  |
| -------------- | ---------------------------------------- |
| Required field | Enter the legal name of the organisation |

### Organisation alias

_Does your organisation use a different name in your day-to-day work?_

**Type**: string

| Rule           | Message |
| -------------- | ------- |
| Optional field | n/a     |

### Organisation address

**Type**: address

Address field group, consists of:

-   Address line 1
-   Address line 2 (optional)
-   Town or city
-   Postcode

| Rule           | Message                 |
| -------------- | ----------------------- |
| Required field | Enter a full UK address |
| Valid postcode | Enter a valid postcode  |

### Organisation type

**Type**: single choice (radio)

| Rule           | Message                     |
| -------------- | --------------------------- |
| Required field | Choose an organisation type |

### Company number

**Type**: string

**Conditions**: Conditionally required when the organisation type is a **not for profit company**.

| Rule                         | Message                        |
| ---------------------------- | ------------------------------ |
| Conditionally required field | Enter a companies house number |

### Charity number

**Type**: string

**Conditions**: Conditionally required when the organisation type is a **unincorporated registered charity** or **CIO**. Shown, but optional, if the organisation type is a **not for profit company**.

| Rule                         | Message                |
| ---------------------------- | ---------------------- |
| Conditionally required field | Enter a charity number |

### Accounting year date

**Type**: day and month

| Rule                 | Message                   |
| -------------------- | ------------------------- |
| Required field       | Enter valid day and month |
| Must be a valid date | Enter valid day and month |

### Total income for the year

**Type**: number

| Rule           | Message                                      |
| -------------- | -------------------------------------------- |
| Required field | Enter a number for total income for the year |

## Main contact

### Main contact name

**Type**: string

| Rule           | Message         |
| -------------- | --------------- |
| Required field | Enter full name |

### Main contact date of birth

**Type**: date

**Optional** if the organisation type is a **school or educational body**.

| Rule                 | Message                                    |
| -------------------- | ------------------------------------------ |
| Required field       | Enter a date of birth                      |
| Must be a valid date | Enter a real date                          |
| Date of birth        | Main contact must be at least 18 years old |

### Main contact address

**Type**: address

Address field group, consists of:

-   Address line 1
-   Address line 2 (optional)
-   Town or city
-   Postcode

**Optional** if the organisation type is a **school or educational body**.

| Rule           | Message                 |
| -------------- | ----------------------- |
| Required field | Enter a full UK address |
| Valid postcode | Enter a valid postcode  |

### Main contact email

**Type**: email

| Rule           | Message                                                             |
| -------------- | ------------------------------------------------------------------- |
| Required field | Enter an email address                                              |
| Invalid format | Enter an email address in the correct format, like name@example.com |

### Main contact phone

**Type**: string

| Rule                 | Message                       |
| -------------------- | ----------------------------- |
| Required field       | Enter a phone number          |
| Invalid phone number | Enter a valid UK phone number |

**Note**: Phone numbers validated using [joi-phone-number](https://github.com/Salesflare/joi-phone-number) which is a wrapper around the Google `libphonenumber` library.

### Main contact communication needs

**Type**: multiple choice (checkbox)

| Rule           | Message                                 |
| -------------- | --------------------------------------- |
| Optional field | n/a                                     |
| Invalid choice | Choose from one of the options provided |

## Legal contact

### Legal contact name

**Type**: string

| Rule           | Message         |
| -------------- | --------------- |
| Required field | Enter full name |

### Legal contact role

**Type**: single choice (radio)

| Rule           | Message       |
| -------------- | ------------- |
| Required field | Choose a role |

#### Mappings

The legal contact role shows the following choices depending on the organisation type:

| Organisation type                                | Choices                                   |
| ------------------------------------------------ | ----------------------------------------- |
| Unregistered voluntary or community organisation | Chair, Vice-chair, Secretary, Treasurer   |
| Registered charity (unincorporated)              | Trustee                                   |
| Charitable incorporated organisation (CIO)       | Trustee                                   |
| Not-for-profit company                           | Company Director, Company Secretary       |
| School or educational body                       | Head Teacher, Chancellor, Vice-chancellor |
| Statutory body                                   | Parish Clerk, Chief Executive             |

### Legal contact date of birth

**Type**: date

**Optional** if the organisation type is a **school or educational body**.

| Rule                 | Message                       |
| -------------------- | ----------------------------- |
| Required field       | Enter a date of birth         |
| Must be a valid date | Enter a real date             |
| Date of birth        | Must be at least 18 years old |

### Legal contact address

**Type**: address

Address field group, consists of:

-   Address line 1
-   Address line 2 (optional)
-   Town or city
-   Postcode

**Optional** if the organisation type is a **school or educational body**.

| Rule           | Message                 |
| -------------- | ----------------------- |
| Required field | Enter a full UK address |
| Valid postcode | Enter a valid postcode  |

### Legal contact email

**Type**: email

| Rule           | Message                                                             |
| -------------- | ------------------------------------------------------------------- |
| Required field | Enter an email address                                              |
| Invalid format | Enter an email address in the correct format, like name@example.com |

### Legal contact phone

**Type**: string

| Rule                 | Message                       |
| -------------------- | ----------------------------- |
| Required field       | Enter a phone number          |
| Invalid phone number | Enter a valid UK phone number |

**Note**: Phone numbers validated using [joi-phone-number](https://github.com/Salesflare/joi-phone-number) which is a wrapper around the Google `libphonenumber` library.

### Legal contact communication needs

**Type**: multiple choice (checkbox)

| Rule           | Message                                 |
| -------------- | --------------------------------------- |
| Optional field | n/a                                     |
| Invalid choice | Choose from one of the options provided |

## Bank details

### Account name

**Type**: string

| Rule           | Message                       |
| -------------- | ----------------------------- |
| Required field | Enter the name on the account |

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
