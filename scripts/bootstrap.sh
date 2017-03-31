#!/bin/bash

# install npm deps
cd /var/www/biglotteryfund
npm install

# configure nginx (would be nice to conditionally restart here)
cp /var/www/biglotteryfund/config/server.conf /etc/nginx/sites-enabled
service nginx restart