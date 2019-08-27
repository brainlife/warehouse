'use strict';

import Vue from 'vue'

let cache_ = {}; //global cache

export default {
    methods: {
        _cache(id, promise_maker, cb) {
            //let now = (new Date()).getTime();
            let cache = cache_[id];
            
            //check cache exists
            if(!cache) {
                //start caching
                //let exp = now + ttl;
                cache = {promise: promise_maker()};
                cache_[id] = cache;
                cache.promise.then(it=>{
                    cache_[id].it = it;
                    cb(null, it);
                }).catch(cb);
                return;
            }

            //item already loaded?
            if(!cache.it) {
                //wait for existing promise
                cache.promise.then(it=>{
                    cb(null, it);
                }).catch(cb);
                return;
            }

            //all good!
            cb(null, cache.it);
        },  
    }
}


