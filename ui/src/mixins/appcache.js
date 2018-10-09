'use strict';

import Vue from 'vue'

import cache from '@/mixins/cache'

export default {
    mixins: [ cache ], 
    methods: {
        appcache: function(id, cb) {
            let cached_app = this.get_cache(id);
            if(cached_app) cb(null, cached_app);
            else {
                //console.log("no cache.. loading new");
                this.$http.get('app', {params: {
                    find: JSON.stringify({_id: id}),
                    populate: 'inputs.datatype outputs.datatype',
                }}).then(res=>{
                    let app = res.body.apps[0];
                    this.set_cache(id, app);
                    cb(null, app);
                }).catch(cb);
            }
        },  
    }
}


