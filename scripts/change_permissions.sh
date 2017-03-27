#!/bin/bash
chmod -R 755 /var/www/biglotteryfund

rm /etc/nginx/nginx.conf
cp /var/www/biglotteryfund/server.conf /etc/nginx/sites-enabled
cp /var/www/biglotteryfund/nginx.conf /etc/nginx/
