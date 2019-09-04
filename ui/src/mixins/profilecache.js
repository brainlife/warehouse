
import Vue from 'vue'

import cache from '@/mixins/cache'

export default {
    mixins: [ cache ], 
    methods: {
        profilecache(id, cb) {
            this._cache("profilecache."+id, ()=>{
                console.log("loading public profile for "+id);
                return this.$http.get(Vue.config.profile_api+'/public/'+id);
            }, (err, res)=>{
                if(!res.data) return cb("couldn't find such profile");
                cb(null, res.data);
            });
        },  
    }
}


