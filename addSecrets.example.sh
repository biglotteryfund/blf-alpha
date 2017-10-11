#!/bin/bash

# environment endpoints (for checking statuses)
export TEST_URL=
export PROD_URL=

# fetch latest params from EC2 parameter store
bin/scripts/get-secrets
