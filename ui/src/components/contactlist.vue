<template>
<div v-if="profiles">
    <select2 style="width: 100%;" v-model="values" :options="profiles" :multiple="true"></select2>
    <!--
    <el-select v-model="values" @input="updateValue" multiple style="width: 100%;">
        <el-option v-for="profile in profiles" :key="profile.id" :label="profile.text" :value="profile.id.toString()">
             {{profile.text}}
        </el-option>
    </el-select>
    -->
</div><!--root-->
</template>

<script>

import Vue from 'vue'
import select2 from '@/components/select2'
//import vSelect from 'vue-select'

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
        if(!profiles) profiles = this.$http.get(Vue.config.auth_api+'/profile', {params: {where: JSON.stringify({active: true})}});
        profiles.then(res=>{
            this.profiles = [];
            res.body.profiles.forEach(profile=>{
                this.profiles.push({id: profile.id, text: profile.fullname + "<"+profile.email+">"});
            });
        }, res=>{
            console.error(res);
        });
    },

    /*
    methods: {
        updateValue: function(values) {
            //just pass it back to parent
            this.$emit('input', values);
        }
    },
    */
}
</script>
