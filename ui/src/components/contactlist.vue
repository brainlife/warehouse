<template>
<div v-if="profiles">
    <select2 style="width: 100%;" v-model="values" :options="profiles" :multiple="true"></select2>
</div><!--root-->
</template>

<script>

import Vue from 'vue'
import select2 from '@/components/select2' //TODO - use vue-select instead

var profiles = null;

export default {
    components: { select2 },
    data () {
        return {
            values: [],
            profiles: null,
        }
    },
    props: ['value'],

    watch: {
        value: function(values) {
            this.values = values; 
        },
        values: function(values) {
            this.$emit('input', values);
        }
    },

    mounted: function() {
        this.values = this.value; //init

        //TODO I should let ui-select/async and let it "search" users
        if(!profiles) profiles = this.$http.get(Vue.config.auth_api+'/profile', {params: {
            where: JSON.stringify({active: true}),
            limit: 5000, 
        }});
        profiles.then(res=>{
            this.profiles = [];
            res.body.profiles.forEach(profile=>{
                this.profiles.push({id: profile.id, text: profile.fullname + "<"+profile.email+">"});
            });
        }, res=>{
            console.error(res);
        });
    },
}
</script>
