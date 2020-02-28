# Cypress tests

We use [Cypress](https://www.cypress.io/) for writing our end-to-end tests.

Wherever possible we use the helper methods provided by [`cypress-testing-library`](https://www.npmjs.com/package/@testing-library/cypress) in our tests. This helps us keep our tests as close as possible to how a real person would interact with the app.

Further details on this approach can be found at [https://testing-library.com/docs/intro]()

All integration tests are written in a single `integration_spec.js` file in order to keep test time down in CI.
