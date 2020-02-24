# Testing

We rely on a number of different tools for testing our code.

## Linting

We have the following linters configured to run during CI.

-   [eslint](https://eslint.org/) - Used for linting all client-side and server-side JavaScript
-   [stylelint](https://stylelint.io/) - Used for linting `.scss` stylesheets
-   [shellcheck](https://www.shellcheck.net/) - Used to check bash scripts

We _do not_ use linting to enforce stylistic choices. Instead we rely on [prettier](https://prettier.io/) to auto-format our code.

You can run `eslint` and `stylelint` manually by running:

```shell script
npm run lint
```

## Unit tests

Unit tests are run using [Jest](https://jestjs.io/). All out unit tests are collocated next to the files they test rather than in a top-level `tests` directory so you will see `.test.js` files throughout the project.

You can run the linted and unit tests with:

```shell script
npm test
```

To start a test runner which will notify you of test failures as you work you can run:

```shell script
npm run watch-tests
```

## End-to-end tests

We use [Cypress](https://www.cypress.io/) for end-to-end browser testing. These can be run locally with a headless browser with the following command:

```shell script
npm run test-integration
```

If you'd like to run cypress tests through the UI you can run the following:

```shell script
npm run start-test
```

In a new terminal

```shell script
npx cypress open
```
