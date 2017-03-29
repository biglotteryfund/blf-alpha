#!/bin/bash
sudo /etc/init.d/httpd stop
service nginx restart

cd /var/www/biglotteryfund
npm install
pm2 start bin/www -n www -i 0