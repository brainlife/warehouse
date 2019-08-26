'use strict';

import Vue from 'vue'

import cache from '@/mixins/cache'

export default {
    mixins: [ cache ], 
    methods: {
        resource_cache: async function(id, cb) {
            let res = await this._cache(id, ()=>{
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


