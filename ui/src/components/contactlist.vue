<template>
<v-select v-if="profiles"
    v-model.sync="values" 
    :options="profiles" 
    :reduce="p=>p.sub" 
    label="label" 
    multiple/>
</template>

<script>

import Vue from 'vue'

let profilesCache = null;

export default {
    props: ['value'],
    data () {
        return {
            values: [],
            profiles: null,
        }
    },

    watch: {
        /*
        value: function() {
            this.values = this.value.splice();
        },
        */

        values: function() {
            this.$emit('input', this.values);
        },
    },

    mounted: function() {
        if(this.value) this.values = this.value;

        //TODO I should let ui-select/async and let it "search" users
        if(!profilesCache) profilesCache = this.$http.get(Vue.config.auth_api+'/profile/list', {params: {
            find: JSON.stringify({active: true}),
            limit: 5000, 
        }});

        profilesCache.then(res=>{
            this.profiles = [];
            res.data.profiles.forEach(profile=>{
                //auth service still uses number for sub, but we should eventually convert it 
                //to use string warehouse stores sub in string.
                //let's operate using string across all other services
                this.profiles.push({
                    sub: profile.sub.toString(), 
                    label: profile.fullname + " <"+profile.email+">",
                });
            });
        }, res=>{
            console.error(res);
        });
    },
}
</script>
