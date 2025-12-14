#!/bin/bash
cd /Users/yanyu/www/yyc3-22/app

for dir in services/api services/admin services/llm services/mail; do
  cd $dir
  npm install
  cd /Users/yanyu/www/yyc3-22/app
done

pm2 start /Users/yanyu/www/yyc3-22/app/config/ecosystem.config.js
pm2 save
pm2 startup systemd
systemctl enable pm2-root
