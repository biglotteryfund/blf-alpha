#!/bin/bash
chmod -R 755 /var/www/biglotteryfund
rm /etc/nginx/sites-enabled/default
cp /var/www/biglotteryfund/server.conf /etc/nginx/sites-enabled
