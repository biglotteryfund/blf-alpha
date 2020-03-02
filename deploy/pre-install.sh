#!/bin/bash
set -e
#################################################
# BeforeInstall script
#################################################

# Clear out old app if found
# Only true if running an in-place deploy
rm -rf /var/www/biglotteryfund
