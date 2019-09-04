'use strict';

import Vue from 'vue'

import cache from '@/mixins/cache'

export default {
    mixins: [ cache ], 
    methods: {
        resource_cache(id, cb) {
            this._cache("resource."+id, ()=>{
                console.log("loading resource info for "+id);
                return this.$http.get(Vue.config.amaretti_api+'/resource', {params: {
                    find: JSON.stringify({_id: id}),
                }});
            }, (err, res)=>{
                let resource = res.data.resources[0];
                cb(null, resource);
            });
        },  
    }
}


