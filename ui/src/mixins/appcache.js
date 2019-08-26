
import Vue from 'vue'

import cache from '@/mixins/cache'

export default {
    mixins: [ cache ], 
    methods: {
        appcache: async function(id, cb) {
            let res = await this._cache(id, ()=>{
                return this.$http.get('app/'+id, {params: {
                    populate: 'inputs.datatype outputs.datatype',
                }});
            }, (err, res)=>{
                cb(null, res.data);
            });
        },  
    }
}


