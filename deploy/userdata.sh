#!/bin/bash
###############################################
# CHANGING THIS FILE REQUIRES RE-UPLOADING IT #
# AND THEN CLONING THE LAUNCH CONFIGURATIONS. #
# FUTURE DEPLOYS MAY FAIL IF YOU FORGET THIS! #
###############################################

#################################################
# Install CodeDeploy agent
#################################################
# Must be installed on boot for CodeDeploy to work

apt-get update
apt-get install ruby -y
apt-get install wget -y
cd /home/ubuntu || exit
wget https://aws-codedeploy-eu-west-2.s3.amazonaws.com/latest/install
chmod +x ./install
./install auto
