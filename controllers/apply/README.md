# Apply Router

This router handles all the application forms under `/apply`.

There are two key concepts: The form router which is shared across all forms, and form models which are specific to each product.

## dashboard

This directory handles routing and views for the dashboard screens which show people a summary of their applications.

## form-router

This directory contains common router code shared across all forms. It handles common behaviour for eligibility checkers right through to submitting applications to Salesforce but doesn't contain any product specific code.

## awards-for-all

This directory defines the structure, field definitions, and validation rules for the simple funding application form.

## standard-proposal

This directory defines the structure, field definitions, and validation rules for the simple funding application form.

## contact-next

Prototype clone of awards for all model, used to experiment with a new approach to the contacts section. This can be deleted if this experiment is abandoned.

## expiries

Handles expiry emails for pending applications. Also allows people to unsubscribe from emails.

## lib

Handles common helper code used for defining form models. Specifically defines some common field types and validation rules that are reused across forms.
