#!/bin/bash
set -e

# Install Passenger/nginx
apt-get install -y dirmngr gnupg
apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys 561F9B9CAC40B2F7
apt-get install -y apt-transport-https ca-certificates
sh -c 'echo deb https://oss-binaries.phusionpassenger.com/apt/passenger bionic main > /etc/apt/sources.list.d/passenger.list'
apt-get update
apt-get install -y nginx-extras libnginx-mod-http-passenger

# Install ClamAV
apt-get install -y clamav clamav-daemon

# Initial update of antivirus databases
# We do this so that we can start clamav-daemon without an arbitrary `sleep`
wget -O /var/lib/clamav/main.cvd https://database.clamav.net/main.cvd && \
wget -O /var/lib/clamav/daily.cvd https://database.clamav.net/daily.cvd && \
wget -O /var/lib/clamav/bytecode.cvd https://database.clamav.net/bytecode.cvd

service clamav-daemon start
service clamav-daemon status

# Install Node
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
apt-get install -y nodejs

# Install AWS CLI (to fetch secrets from parameter store)
rm -rf awscli-bundle.zip awscli-bundle
curl "https://s3.amazonaws.com/aws-cli/awscli-bundle.zip" -o "awscli-bundle.zip"
unzip awscli-bundle.zip
./awscli-bundle/install -i /usr/local/aws -b /usr/local/bin/aws

# Install Cloudwatch agent (for logging)
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
dpkg -i -E ./amazon-cloudwatch-agent.deb