# Big Lottery Fund Alpha

[![Build Status](https://travis-ci.org/biglotteryfund/blf-alpha.svg?branch=master)](https://travis-ci.org/biglotteryfund/blf-alpha)

## Overview

This projects contains initial work on a redesigned website for the Big Lottery Fund.

**Technologies used:**

- [Express](https://expressjs.com/) running on [Node.js](https://nodejs.org/en/)
- Build tooling via [Webpack](https://webpack.js.org/), [Babel](https://babeljs.io/) and [Gulp](https://gulpjs.com/) for bundling and versioning static assets
- A MySQL instance running on AWS RDS used to power a rudimentary CMS for posting/updating news articles to the homepage
- The app itself runs via [Phusion Passenger](https://www.phusionpassenger.com/) which is integrated into [NGINX](https://www.nginx.com/resources/wiki/) for node process management.

## Getting Started

To get up and running with the app, here's what you need to do:

### Prerequisites

You'll need the following tools installed:

- Node.js (https://nodejs.org/en/download/)
- Git (https://help.github.com/articles/set-up-git/)
- Some sort of terminal app (OS X comes with one)

### Setup Instructions

Run these commands in your terminal of choice:

#### 1. Clone This Repository

```
git clone git@github.com:biglotteryfund/blf-alpha.git
```

#### 2. Configure Secrets

You'll also need the app secrets – config items that allow it to connect to the database (used for content), send emails (when customers order free items), etc.

In order to do this, you'll need to do the following:

- Obtain AWS credentials for the team's account (with permission to access EC2 Parameter Store)
- [Configure the AWS CLI](http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html) on your machine
- Make sure the directory `/etc/blf/` exists and is writeable (this is where application secrets will be downloaded to).
- Create a file called `.env` and populate ask another member of the team for the values to go in here. These missing values are used for deployments.
- Run `./bin/scripts/get-secrets` – this will download the application secrets to `/etc/blf/parameters.json`.

#### 3. Install Dependencies:

```
cd blf-alpha
npm install
```

#### 4. Run A Build

Check the install worked by running a build.

```
npm run build
```

#### 5. Start The App Server:

```
npm run startDev
```

#### 6. Access The Application

The app should now be running. Visit the app in your browser and confirm it's running.

```
http://localhost:3000
```

#### 7. Watch For Changes

Watch static assets and run an incremental build when files change.

```
npm run watch
```

## Testing

The app comes with several layers of tests to ensure everything works as expected. Tests are still in-development as the app increases in size/scope, but the framework is in place for them.

You can run them all with `gulp test` (or `npm test`) but here are the individual suites:

### Integration tests
Currently we're using PhantomJS to verify that client-side JavaScript tools work as expected. Run `gulp phantomjs` to run these tests, or load `/test/runner.html` in a browser to see them in-place.

### Unit tests

We're using Mocha to run these tests which check that the web server starts, serves pages, shows 404s and handles invalid data. You can just run `mocha` from the root directory, or just run `gulp mocha` (which will build the required client-side assets before testing).

### Security tests

[Snyk](https://snyk.io/) is in place to test for outdated npm packages with known security vulnerabilities. Run `snyk test` to verify these are secure.

### Linting

We have ESLint to check syntax errors. Run `gulp lint` to verify there's no missing semicolons etc. See `.eslintrc.js` for rules.

## Deployment

### Environments

There are three main environments:

- Test - Deployed to automatically each time `master` builds
- Production - Deployed to manually by triggering a release

All three environments run on AWS behind CloudFront to ensure parity between environments.

Environments share a MySQL instance runing on an RDS which has multiple databases used for the app: `website-dev` (for development and also the `TEST` environment), `website-test` (for the automated tests, eg. so they can simulate news posting etc) and `website` (for `PRODUCTION`).

### Deployment Process

#### Travis Builds

Builds are handled by [Travis](https://travis-ci.org/biglotteryfund/blf-alpha). Commits on `master` are automatically pushed to the `TEST` environment via AWS CodeDeploy. These deploys happen in-place by defauly with the option of deploying in "blue/green" style and replacing servers altogether.

#### Automatic Deployment To Test

Once a change is merged to `master`, Travis will build and deploy it (branches are also built, but not deployed). A revision will be uploaded to an S3 bucket, then deployed to AWS via CodeDeploy. Deployments are configured for Travis in `.travis.yml`. Amazon CodeDeploy settings are in `appspec.yml`.

The build script generates a zip file of non-dev npm modules and minified static assets. This is stored permanently for future deployments where required.

#### Deployment to production

Deploys to `PRODUCTION` are manual (for now). Once a deploy has been sanity checked on `TEST`, it can be advanced to `PRODUCTION` via AWS CodeDeploy, either by using the web console, or the bundled deploy script within the app:

```
./bin/scripts/deploy.js --live
```

This command will begin a deployment by listing the previous 10 releases deployed to `TEST` and asking which build you wish to deploy. It will then list out the commit summaries for each change which will be deployed, then confirm if you wish to proceed. Progress updates will be posted to Slack as the deployment proceeds.

Please speak to [@mattandrews](https://github.com/mattandrews) or [@davidrapson](https://github.com/davidrapson) to obtain credentials to deploy.
