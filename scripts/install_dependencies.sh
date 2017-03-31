#!/bin/bash
yum install -y nginx
curl --silent --location https://rpm.nodesource.com/setup_6.x | bash -
yum install -y nodejs

# fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
npm install -g pm2
pm2 update