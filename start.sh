
#api
pm2 delete warehouse-api
pm2 start api/warehouse.js --name warehouse-api --watch --ignore-watch="*.log test *.sh ui bin example .git"

pm2 delete warehouse-rule
pm2 start bin/rule_handler.js --name warehouse-rule --watch --ignore-watch="*.log test *.sh ui example .git"

pm2 delete warehouse-event
pm2 start bin/event_handler.js --name warehouse-event --watch --ignore-watch="*.log test *.sh ui example .git"

#manually run this to test - I don't want to run out of api quota
#pm2 delete warehouse-appinfo
#pm2 start bin/appinfo.js --name warehouse-appinfo --watch --ignore-watch="*.log test *.sh ui example .git"

pm2 save
