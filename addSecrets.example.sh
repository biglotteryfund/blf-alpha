#!/bin/bash

# small grants online form (URL obfuscation)
export SGO_HASH=
export SGO_HASH_TEST=

# slack token (for pushing deploy updates)
export SLACK_URL=

# environment load balancer endpoints (for checking statuses)
export ELB_TEST=
export ELB_PROD=

# fetch latest params from EC2 parameter store
bin/scripts/get_secrets.sh