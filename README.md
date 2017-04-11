# Big Lottery Fund Alpha

[![Build Status](https://travis-ci.org/biglotteryfund/blf-alpha.svg?branch=master)](https://travis-ci.org/biglotteryfund/blf-alpha)

This is the initial work on a redesigned website for the Big Lottery Fund.

It's a NodeJS app using Express as a web framework.

It uses Gulp to build Sass, JavaScript (via Browserify) and versioning static assets.

Builds are done by [Travis](https://travis-ci.org/biglotteryfund/blf-alpha) and commits on `master` are automatically pushed to the `TEST` environment via AWS CodeDeploy. These deploys are done in-place, but we can also deploy in "blue/green" style (eg. replacing servers altogether).

## Running the app

To get up and running with the app, here's what you need to do:

### Prerequisites

You'll need the following tools installed:

- NodeJS (https://nodejs.org/en/download/)
- Gulp (`npm install --global gulp-cli`)
- Git (https://help.github.com/articles/set-up-git/)
- Some sort of terminal app (OS X comes with one)

### Step-by-step

1. Clone this repository:

        git clone git@github.com:biglotteryfund/blf-alpha.git
    
2. Install its dependencies:

        cd app
        npm install
        
3. Check the install worked – try to use `gulp` to build the frontend assets:
        
        gulp build --production
        
4. Start the app server:

        node bin/www
        
5. Visit [http://localhost:3000](http://localhost:3000) in your browser and confirm it's working. Press `Ctrl+C` to stop the server.

## Testing

The app comes with several layers of tests to ensure everything works as expected. Tests are still in-development as the app increases in size/scope, but the framework is in place for them. 

You can run them all with `gulp test` (or `npm test`) but here are the individual suites:

### Integration tests

We're using Mocha to run these tests which check that the web server starts, serves pages, shows 404s and handles invalid data. You can just run `mocha` from the `/app` directory, or just run `gulp mocha` (which will build the required client-side assets before testing).

### Unit tests

Currently we're using PhantomJS to verify that client-side JavaScript tools work as expected. Run `gulp phantomjs` to run these tests, or load `app/test/runner.html` in a browser to see them in-place.

### Security tests

[Snyk](https://snyk.io/) is in place to test for outdated npm packages with known security vulnerabilities. Run `snyk test` to verify these are secure.

### Linting

We have ESLint to check syntax errors. Run `gulp lint` to verify there's no missing semicolons etc. See `.eslintrc.js` for rules.

## Deployment

Once a change is merged to `master`, Travis will build and deploy it (branches are also built, but not deployed). A revision will be uploaded to an S3 bucket, then deployed to AWS via CodeDeploy.

The build script generates a zip file of non-dev npm modules and minified static assets. This is stored permanently for future deployments where required.

Currently there is only a single environment, `TEST`. Shortly we'll be adding a `PRODUCTION` environment which can be deployed to manually via CodeDeploy after sanity checking on `TEST`.

Deployments are configured for Travis in `.travis.yml`. Amazon CodeDeploy settings are in `appspec.yml`.
 
Please speak to @mattandrews to obtain access to AWS/Jenkins to manage deployment.

The app itself runs via [Phusion Passenger](https://www.phusionpassenger.com/) which is integrated into nginx web server. This is effectively a reverse proxy which adds security and manages node processes. It also allows for static assets to be served directly via nginx, bypassing node for quicker responses. On live instances, this can be monitored by running `sudo passenger-status` (`sudo` because CodeDeploy runs as root). 

