'use strict';

import Vue from 'vue'

export default {
    data: function() {
        return {}
    },

    methods: {
        createOrFindGAInstance(project, cb) {
            //find or create an instance to host all ga tasks .. must match in api/common/update_project_stats
            let key = {
                group_id: project.group_id,
                name: "ga-launchers", 
            }
            console.log("looking for an instance", key);
            this.$http.get(Vue.config.amaretti_api+'/instance', {
                params: {
                    find: JSON.stringify(key),
                },
            }).then(res=>{
                if(res.data.instances.length == 1) return cb(null, res.data.instances[0]);
                console.log("didn't find any instance.. creating new ga instance");
                this.$http.post(Vue.config.amaretti_api+'/instance', key).then(res=>{
                    cb(null, res.data);
                }).catch(cb);
            }).catch(cb);
        },  
    }
}


