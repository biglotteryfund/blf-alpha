#!/bin/bash
yum install -y nginx
curl --silent --location https://rpm.nodesource.com/setup_6.x | bash -
yum install -y nodejs