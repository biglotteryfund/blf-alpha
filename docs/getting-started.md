# Getting started

## Prerequisites

You'll need the following tools installed in order to run the project locally:

-   Node.js v12+
-   MySQL v5.7+
-   [AWS CLI](http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html) configured on your machine

Once you have the prerequisites installed on your machine, and have the project checked out locally, run these commands in your terminal of choice:

## Install dependencies

From the root of the project run:

```shell script
npm install
```

## Download application secrets

Next, you'll need to download the application secrets. These are configuration settings that allow the application to external services like a database or email sending service.

Create a directory called `/etc/blf/` and make sure it is writeable. This is where application secrets will be stored.

Optional: you can override the location of this directory by setting an environment variable like so: 

```
SECRET_DIR=C:/Users/Someone/FolderName
```

Make sure this directory exists, eg.

```shell script
mkdir -p /etc/blf
```

Next, fetch the secrets. You'll need to ask a mmember of the team to grant you the appropriate AWS permissions otherwise this step will fail.

```shell script
./bin/get-secrets
```

## Create a local `.env` file

This is used to set local configuration values. There is a `.env.sample` file at the root of the project which documents available options. You should make a copy of this as `.env`.

At a minimum you need to set a `DB_CONNECTION_URI` value to point to a local database instance. This can be a SQLite database in development but we recommend setting up a local MySQL instance for parity with production.

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
