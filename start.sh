
pm2 delete warehouse
pm2 start api/warehouse.js -i 3 --watch --ignore-watch="*.log test *.sh ui bin example"
pm2 save
