# Big Lottery Fund Alpha

[![Build Status](https://travis-ci.org/biglotteryfund/blf-alpha.svg?branch=master)](https://travis-ci.org/biglotteryfund/blf-alpha)

## Overview

This projects contains source-code for the redesigned website for the Big Lottery Fund.

**Technologies used:**

- [Express](https://expressjs.com/) running on [Node.js](https://nodejs.org/en/)
- A MySQL instance running on AWS RDS
- App running through [Phusion Passenger](https://www.phusionpassenger.com/) via [NGINX](https://www.nginx.com/resources/wiki/)

## Prerequisites

You'll need the following tools installed:

- [Node.js](https://nodejs.org/en/download/) v8+
- [Git](https://help.github.com/articles/set-up-git/)

## Setup instructions

Run these commands in your terminal of choice:

### 1. Clone this repository

```
git clone git@github.com:biglotteryfund/blf-alpha.git
```

### 2. Download application secrets

Next, you'll need to download the application secrets. These are configuration settings that allow the application to external services like a database or email sending service.

In order to do this, you'll need to:

1. [Configure the AWS CLI](http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html) on your machine
2. Obtain AWS credentials with permissions to access EC2 Parameter Store
3. Create a directory called `/etc/blf/` and make sure it is writeable. This is where application secrets will stored.
4. Run `./bin/get-secrets`. This will download the application secrets to `/etc/blf/parameters.json`.
5. Create an `.env` in the root of the project and ask another member of the team for the values to go in here. These values are used for local configuration.

### 3. Install dependencies:

From the root of the project run:

```
npm install
```

### 4. Run a build

Check the install worked by running a build and tests.

```
npm run build && npm test
```

### 5. Start the application:

```
npm run startDev
```

This command runs the app through `nodemon` with debugging enabled.

### 6. Open the website

The application should now be running. Visit the following link in your browser to confirm everything is OK.

```
http://localhost:3000
```

### 7. Watch files for changes

Watch static assets and run an incremental build when files change.

```
npm run watch
```

## Testing

### Linting & unit tests

You can run linting (`eslint`) and unit tests (`jest`) with:

```
npm test
```

### Integration tests

A set of integration tests written using `cypress` can be run with:

```
npm run test-cypress
```

### Security tests

We have [Snyk](https://snyk.io/) configured to check for outdated dependencies with known security vulnerabilities. You can run these checks manually using:

```
npx snyk text
```

## Deployment

### Environments

There are two main environments, both running on AWS behind CloudFront.

- **TEST** - Deployed to automatically each time `master` builds
- **PRODUCTION** - Deployed to manually by triggering a release through CodeDeploy

### Deployment process

Once a change is merged to `master`, Travis will build and deploy it. A revision will be uploaded to an S3 bucket, then deployed to AWS via CodeDeploy.

### Deployment to production

Deploys to production are manual. Once a deploy has been checked on the test environment it can be advanced to production via AWS CodeDeploy, either by using the web console, or the bundled deploy script within the app:

```
./bin/deploy --live
```

This command will begin a deployment by listing the previous 10 releases deployed to **test** and asking which build you wish to deploy.

It will then list out the commit summaries for each change which will be deployed, then confirm if you wish to proceed. Progress updates will be posted to Slack as the deployment proceeds.

Please speak to [@mattandrews](https://github.com/mattandrews) or [@davidrapson](https://github.com/davidrapson) to obtain credentials to deploy.
