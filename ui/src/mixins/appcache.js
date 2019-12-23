
import Vue from 'vue'

import cache from '@/mixins/cache'

export default {
    mixins: [ cache ], 
    methods: {
        appcache(id, opt, cb) {
            //if user doesn't provide opt, let's assume they want to populate input/output datatype objects
            if(typeof opt == 'function') {
                cb = opt;
                opt = {
                    populate_datatype: true,
                }
            }
            //console.dir(opt);
            this._cache("app."+id, ()=>{
                //console.log("loading app cache for "+id);
                let params = {};
                if(opt.populate_datatype) params["populate"] = "inputs.datatype outputs.datatype";
                return this.$http.get('app/'+id, {params});
            }, (err, res)=>{
                if(err) {
                    console.error("failed to cache app", id);
                    return cb(err);
                }
                cb(null, res.data);
            });
        },  
    }
}