# The National Lottery Community Fund

[![Build Status](https://travis-ci.org/biglotteryfund/blf-alpha.svg?branch=master)](https://travis-ci.org/biglotteryfund/blf-alpha)

This project contains the source-code for The National Lottery Community Fund website.

The website is broken up into three services:

| Project                                                            | Description                                                                 |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| this project                                                       | The main web application                                                    |
| [craft-dev](https://github.com/biglotteryfund/craft-dev)           | A headless CMS which powers content pages on the website                    |
| [grants-service](https://github.com/biglotteryfund/grants-service) | A set of lambda functions which power the past grants search on the website |

You can run the main app without having the other two services set up locally.

## Setup instructions

### Prerequisites

You'll need the following tools installed in order to run the project locally:

-   Git
-   Node.js v12+
-   MySQL v5.7+
-   [AWS CLI](http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html) configured on your machine

Once you have the prerequisites installed on your machine, run these commands in your terminal of choice:

### Clone this repository

```shell script
git clone git@github.com:biglotteryfund/blf-alpha.git
```

### Install dependencies:

From the root of the project run:

```shell script
npm install
```

### Download application secrets

Next, you'll need to download the application secrets. These are configuration settings that allow the application to external services like a database or email sending service.

Create a directory called `/etc/blf/` and make sure it is writeable. This is where application secrets will stored.

```shell script
mkdir -p /etc/blf
```

Download application secrets

```shell script
./bin/get-secrets
```

### Create a local `.env` file

Create an `.env` in the root of the project. Values set here are used for local configuration.
The minimum settings you'll want are as follows:

```dotenv
# Database connection string
# If no value is set the app will use an in memory sqlite database
DB_CONNECTION_URI=mysql://some-mysql-connection-string

# Watch nunjucks templates for changes
WATCH_TEMPLATES=true

# Staff auth
MS_REDIRECT_URL=http://localhost:3000/user/staff/auth/openid/return
```

### Run a build

Check the install worked by running a build and tests.

```shell script
npm run build && npm test
```

### Start the application:

This command runs the app through `nodemon` with debugging enabled.

```shell script
npm run start-dev
```

The application should now be running. Visit `http://localhost:3000` in your browser to confirm everything is OK.

## Testing

We use a mixture of [Eslint](https://eslint.org/) for linting, [Jest](https://jestjs.io/) for unit tests, and [Cypress](https://www.cypress.io/) for end-to-end browser testing.

### Unit tests

Our unit tests are collocated next to the files they test rather than in a top-level `tests` directory so you will see `.test.js` files throughout the project.

You can run the linted and unit tests with:

```shell script
npm test
```

To start a test runner which will notify you of test failures as you work you can run:

```shell script
npm run watch-tests
```

### Cypress tests

A set of end-to-end tests written using `cypress` can be run locally using a headless browser with:

```shell script
npm run test-integration
```

If you'd like to run cypress tests through the UI you can run the following

```shell script
npm run start-test
```

In a new terminal

```shell script
npx cypress open
```

## Client-side builds

We use [Sass](https://sass-lang.com/) for stylesheets and a small amount of [Vue](https://vuejs.org/) for JavaScript enhancements. We use comparatively little JavaScript on the client-side, only where necessary to enhance a baseline experience.

You can run a one-off build with:

```shell script
npm run build
```

Watch static assets and run an incremental build when files change with:

```shell script
npm run watch
```

If you want to run a browser-sync server locally to live reload on changes you can run the following command:

```
npx browser-sync start --no-open --proxy 'http://localhost:3000' --files 'public'
```

## Project structure

The broad project structure is as follows

| Name            | Description                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------------- |
| **assets**      | Contains the source for all client-side code. Sass stylesheets and client-side JavaScript            |
| **bin**         | Contains helper scripts and the main start up script for the app `bin/www`                           |
| **common**      | Helper code which is common to the entire app                                                        |
| **config**      | Config and locale files                                                                              |
| **controllers** | The bulk of the app code lives in here, grouped by feature.                                          |
| **cypress**     | Cypress end-to-end test code                                                                         |
| **db**          | Model definitions and database config code                                                           |
| **deploy**      | CodeDeploy scripts and Nginx config                                                                  |
| **middleware**  | Common middleware. **Deprecated in favour of living in `common` or inline in `server.js`**           |
| **public**      | Public assets. Built stylesheets and client-side JavaScript is output here                           |
| **views**       | Used for shared layouts and components only, all other template files live alongside controller code |
| **server.js**   | Main entry point for the app                                                                         |

### Feature code structure

The majority of the app code lives under `controllers/` with functionality grouped by feature. A typical structure is the following:

| Name       | Description                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------- |
| `lib/`     | Helper code specific to this feature, includes tests collocated next to the code being tested                 |
| `views/`   | Nunjucks view templates specific to this feature                                                              |
| `index.js` | Router code for the feature, routes within this may be broken down into smaller files depending on complexity |

We are still evolving this code but the idea is to only lift code up into `common/` or other top-level directories when it is used by more than two features and the abstraction is clear. Otherwise we favour grouping code distinctly by feature.

## Deployment

The app runs on AWS behind CloudFront and through [Phusion Passenger](https://www.phusionpassenger.com/) via [NGINX](https://www.nginx.com/) backed by an RDS MySQL database.

There are two main environments:

-   **Test** - Deployed to automatically each time `master` builds
-   **Production** - Deployed to manually by triggering a release through CodeDeploy

Once a change is merged to `master`, Travis will build and deploy it. A revision will be uploaded to an S3 bucket, then deployed to AWS via CodeDeploy.

Deploys to production are manual. Once a deploy has been checked on the test environment it can be advanced to production via AWS CodeDeploy, either by using the web console, or the bundled deploy script within the app:

```
./bin/deploy --live
```

This command will begin a deployment by listing the previous 10 releases deployed to **test** and asking which build you wish to deploy. It will then list out the commit summaries for each change which will be deployed, then confirm if you wish to proceed. Progress updates will be posted to Slack as the deployment proceeds.

Please speak to [@mattandrews](https://github.com/mattandrews) or [@davidrapson](https://github.com/davidrapson) to obtain credentials to deploy.

## Seeding

### Prerequisites

You'll need the [sequelize-cli](https://github.com/sequelize/cli) installed locally.

### Generate Seeds

You can generate a seed file using the following command (this will prepend a timestamp on the file name which you can remove if required)

```
npx sequelize-cli seed:generate --name file-name
```

This will create the file with placeholder content within the 'seeders-path' (which can be found in the `.sequelizerc`). Edit the file as per the requirements to interact with the db.

### Running Seeds

Once completed, you can run a particular seed file using the `--seed` argument. eg:

```
npx sequelize-cli db:seed --seed db/seeders/pending-applications
```
