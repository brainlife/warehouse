'use strict';

import Vue from 'vue'

import cache from '@/mixins/cache'

export default {
    mixins: [ cache ], 
    methods: {
        resource_cache(id, cb) {
            this._cache("resource."+id, ()=>{
                return this.$http.get(Vue.config.amaretti_api+'/resource', {params: {
                    find: JSON.stringify({_id: id}),
                }});
            }, (err, res)=>{
                if(err) return cb(err);
                cb(null, res.data.resources[0]);
            });
        },  
    }
}


