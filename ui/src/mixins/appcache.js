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
            this._cache("app."+id, ()=>{
                let params = {};
                if(opt.populate_datatype) params["populate"] = "inputs.datatype outputs.datatype";
                return this.$http.get('app/'+id, {params});
            }, (err, res)=>{
                if(err) return cb(err);
                cb(null, res.data);
            });
        },
    }
}
