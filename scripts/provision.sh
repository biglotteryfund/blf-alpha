#!/bin/bash

# update packages

sudo apt-get update
sudo apt-get install python-pip -y
sudo apt-get install ruby -y
sudo apt-get install wget -y

# install codedeploy-agent

cd /home/ubuntu
wget https://aws-codedeploy-eu-west-1.s3.amazonaws.com/latest/install
chmod +x ./install
sudo ./install auto

# install passenger

# Install PGP key and add HTTPS support for APT
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys 561F9B9CAC40B2F7
sudo apt-get install -y apt-transport-https ca-certificates

# Add APT repository
sudo sh -c 'echo deb https://oss-binaries.phusionpassenger.com/apt/passenger xenial main > /etc/apt/sources.list.d/passenger.list'
sudo apt-get update

# Install Passenger + Nginx
sudo apt-get install -y nginx-extras passenger

# enable passenger in nginx
PassengerDisabled="# include /etc/nginx/passenger.conf;"
PassengerEnabled="include /etc/nginx/passenger.conf;"
sudo sed -i "s|$PassengerDisabled|$PassengerEnabled|g" /etc/nginx/nginx.conf

# install node
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs