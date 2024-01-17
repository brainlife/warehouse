
import Vue from 'vue'

import cache from '@/mixins/cache'

export default {
    mixins: [ cache ], 
    methods: {
        datatypecache(id, cb) {
            this._cache("datatype."+id, ()=>{
                return this.$http.get('datatype', {params: {
                    find: JSON.stringify({_id: id}), //TODO - maybe search by name also?
                }});
            }, (err, res)=>{
                if(err) return cb(err);
                cb(err, res.data.datatypes[0]);
            });
        },
    }
}


