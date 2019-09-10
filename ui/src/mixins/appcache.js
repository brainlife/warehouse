
import Vue from 'vue'

import cache from '@/mixins/cache'

export default {
    mixins: [ cache ], 
    methods: {
        appcache(id, cb) {
            this._cache("app."+id, ()=>{
                console.log("loading app cache for "+id);
                return this.$http.get('app/'+id, {params: {
                    populate: 'inputs.datatype outputs.datatype',
                }});
            }, (err, res)=>{
                cb(null, res.data);
            });
        },  
    }
}


