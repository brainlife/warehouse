
pm2 delete warehouse
pm2 start api/warehouse.js -i 3 --watch --ignore-watch="*.log test *.sh ui bin example"
pm2 save

pm2 delete warehouse-rule
pm2 start bin/rule_handler.js --name warehouse-rule --watch --ignore-watch="*.log test *.sh ui example"
pm2 save

pm2 delete warehouse-event
pm2 start bin/event_handler.js --name warehouse-event --watch --ignore-watch="*.log test *.sh ui example"
pm2 save
