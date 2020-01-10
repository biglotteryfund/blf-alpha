#!/bin/bash
set -e
#################################################
# ApplicationStart script
#################################################

# Trigger a Passenger "restart" to reload latest config
touch /var/www/biglotteryfund/tmp/restart.txt
