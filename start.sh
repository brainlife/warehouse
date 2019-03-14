
#api
pm2 delete warehouse
pm2 start api/warehouse.js --watch --ignore-watch="*.log test *.sh ui bin example .git"

#dataset/download
#pm2 delete warehouse-download
#PORT=12502 pm2 start api/warehouse.js -n warehouse-download --watch --ignore-watch="*.log test *.sh ui bin example .git"

pm2 delete warehouse-rule
pm2 start bin/rule_handler.js --name warehouse-rule --watch --ignore-watch="*.log test *.sh ui example .git"

pm2 delete warehouse-event
pm2 start bin/event_handler.js --name warehouse-event --watch --ignore-watch="*.log test *.sh ui example .git"

#pm2 delete warehouse-archive
#pm2 start bin/archive_handler.js -i 2 --name warehouse-archive --watch --ignore-watch="*.log test *.sh ui example .git"

pm2 delete warehouse-appinfo
pm2 start bin/appinfo.js --name warehouse-appinfo --watch --ignore-watch="*.log test *.sh ui example .git"

#pm2 delete warehouse-projectinfo
#pm2 start bin/projectinfo.js --name warehouse-projectinfo --watch --ignore-watch="*.log test *.sh ui example .git"

pm2 save
