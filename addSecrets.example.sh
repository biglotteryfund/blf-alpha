#!/bin/bash

# slack token (for pushing deploy updates)
export SLACK_URL=

# environment endpoints (for checking statuses)
export TEST_URL=
export PROD_URL=

# fetch latest params from EC2 parameter store
bin/scripts/get-secrets
