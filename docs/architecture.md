# Architecture

## Web app

This project covers the main web app, this is a Node.js app written in Express. Its purpose is to provide the main front-end for the website, as well as handling the application forms and user flow used to apply for funding.

### CloudFront

All requests to www.tnlcommunityfund.org.uk are routed via CloudFront. Requests are sent to one of two locations:

-   Anything under `/assets` is routed directly to a static S3 bucket
-   All other requests are sent to the web app load balancer

### NGINX and Passenger

Requests to the origin are handled by NGINX(https://www.nginx.com/) which is primarily concerned with routing requests to [Passenger](https://www.phusionpassenger.com/) which handles all Node.js processes. We also use NGINX as a rate limiter to avoid overloading user endpoints.

### EC2 and ELB

The application runs on EC2 behind an ELB. Provisioning of new servers is handled by CodeDeploy. Scripts used to provision servers can be found in the `deploy/` directory. These scripts map to different CodeDeploy lifecyle stages as defined in `appspec.yml`

### Lambda

This has a single Lambda function which is run on a schedule and used to trigger periodic application expiry emails.

### RDS

We use MySQL hosted on RDS for our database instance.

### Azure Active Directory auth

We have a handful of internal staff tools within the application which are protected behind staff-only log in. This relies on a small Active Directory app which controls access permissions. This app lives in Azure and configured separately there.

## Connected services

As well as the main web app there are two other key services that power the website: A CMS-backed content API, and a past grants API. You can run the main app without having the other two services set up locally.

## Content API

The Content API is a headless CMS powered by [Craft](https://craftcms.com/). We use this for managing most frequently changing content on the website. The main exceptions to this are landing pages and any copy related to application forms where we need more control over what is presented to users.

See [https://github.com/biglotteryfund/craft-dev]()

## Past grants API

We run a separate API service for all of our historic past grants data. This is a set of serverless methods which are backed by a Mongo database.

See [https://github.com/biglotteryfund/grants-service]()
