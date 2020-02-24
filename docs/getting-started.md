# Getting started

## Prerequisites

You'll need the following tools installed in order to run the project locally:

-   Node.js v12+
-   MySQL v5.7+
-   [AWS CLI](http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html) configured on your machine

Once you have the prerequisites installed on your machine, and have the project checked out locally, run these commands in your terminal of choice:

## Install dependencies:

From the root of the project run:

```shell script
npm install
```

## Download application secrets

Next, you'll need to download the application secrets. These are configuration settings that allow the application to external services like a database or email sending service.

Create a directory called `/etc/blf/` and make sure it is writeable. This is where application secrets will stored.

```shell script
mkdir -p /etc/blf
```

Next, fetch the secrets

```shell script
./bin/get-secrets
```

## Create a local `.env` file

Create an `.env` in the root of the project. Values set here are used for local configuration.
The minimum settings you'll want are as follows:

```dotenv
# Database connection string
# If no value is set the app will use an in memory sqlite database
DB_CONNECTION_URI=mysql://some-mysql-connection-string

# Watch nunjucks templates for changes.
WATCH_TEMPLATES=true

# Staff auth
MS_REDIRECT_URL=http://localhost:3000/user/staff/auth/openid/return
```

## Run a build

Before starting the application, run a build. This makes sure all client-side assets are compiled.

```shell script
npm run build
```

## Start the application

This command runs the app through `nodemon` with debugging enabled.

```shell script
npm run start-dev
```

The application should now be running. Visit `http://localhost:3000` in your browser to confirm everything is OK.
