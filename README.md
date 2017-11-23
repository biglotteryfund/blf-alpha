# Big Lottery Fund Alpha

[![Build Status](https://travis-ci.org/biglotteryfund/blf-alpha.svg?branch=master)](https://travis-ci.org/biglotteryfund/blf-alpha)

## Overview

This projects contains source-code for the redesigned website for the Big Lottery Fund.

**Technologies used:**

- [Express](https://expressjs.com/) running on [Node.js](https://nodejs.org/en/)
- Build tooling via [Webpack](https://webpack.js.org/), [Babel](https://babeljs.io/), and [Gulp](https://gulpjs.com/)
- A MySQL instance running on AWS RDS
- App running through [Phusion Passenger](https://www.phusionpassenger.com/) via [NGINX](https://www.nginx.com/resources/wiki/)

## Getting started

To get up and running with the app, here's what you need to do:

### Prerequisites

You'll need the following tools installed:

- [Node.js](https://nodejs.org/en/download/) v8+
- [Git](https://help.github.com/articles/set-up-git/)

### Setup instructions

Run these commands in your terminal of choice:

#### 1. Clone this repository

```
git clone git@github.com:biglotteryfund/blf-alpha.git
```

#### 2. Download application secrets

Next, you'll need to download the application secrets. These are configuration settings that allow the application to external services like a database or email sending service.

In order to do this, you'll need to:

1. [Configure the AWS CLI](http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html) on your machine
2. Obtain AWS credentials with permissions to access EC2 Parameter Store
3. Create a directory called `/etc/blf/` and make sure it is writeable. This is where application secrets will be downloaded to.
4. Create an `.env` in the root of the project and ask another member of the team for the values to go in here. These values are used for deployments.
5. Run `./bin/scripts/get-secrets`. This will download the application secrets to `/etc/blf/parameters.json`.

#### 3. Install dependencies:

From the root of the project run:

```
npm install
```

#### 4. Run a build

Check the install worked by running a build and tests.

```
npm run build && npm test
```

#### 5. Start the application:

```
npm run startDev
```

#### 6. Open the website

The application should now be running. Visit the following link in your browser to confirm everything is running.

```
http://localhost:3000
```

#### 7. Watch files for changes

Watch static assets and run an incremental build when files change.

```
npm run watch
```

## Testing

The app comes with several layers of tests to ensure everything works as expected. You can run all the tests using:

```
npm test
```


### Unit tests

Unit tests are written using mocha. These tests are colocated next to the individual files they test. Unit tests can be run using:

```
npm run test-unit
```

### Integration tests

Integration tests are stored under `integration-tests/` and check to see that critical server routes are working as expected by starting up a test instance of the application server. Integration tests can be run using:

```
npm run test-integration
```

### Security tests

[Snyk](https://snyk.io/) is in place to check for outdated dependencies with known security vulnerabilities. You can run these checks manually using:

```
npm run test-deps
```

### Linting

We have ESLint to check syntax errors. Lint checks are run automatically on a pre-push git hook and in CI. You can run these checks directly using:

```
npm run lint
```

## Deployment

### Environments

There are three main environments:

- **Test** - Deployed to automatically each time `master` builds
- **Production** - Deployed to manually by triggering a release

All three environments run on AWS behind CloudFront to ensure parity between environments.

Environments share a RDS MySQL instance which has multiple databases used for the app:

- `website-dev` for local development and the test environment
- `website-test` for automated tests
- `website` for the production environment

### Deployment Process

Once a change is merged to `master`, Travis will build and deploy it (branches are also built, but not deployed). A revision will be uploaded to an S3 bucket, then deployed to AWS via CodeDeploy.

#### Deployment to production

Deploys to **production** are manual. Once a deploy has been sanity checked on **tests**, it can be advanced to **production** via AWS CodeDeploy, either by using the web console, or the bundled deploy script within the app:

```
./bin/scripts/deploy.js --live
```

This command will begin a deployment by listing the previous 10 releases deployed to **test** and asking which build you wish to deploy.

It will then list out the commit summaries for each change which will be deployed, then confirm if you wish to proceed. Progress updates will be posted to Slack as the deployment proceeds.

Please speak to [@mattandrews](https://github.com/mattandrews) or [@davidrapson](https://github.com/davidrapson) to obtain credentials to deploy.
