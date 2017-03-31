#!/bin/bash
cd /var/www/biglotteryfund
npm install
pm2 start process.yml