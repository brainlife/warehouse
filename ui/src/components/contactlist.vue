<template>
<div>
    <el-select v-model="values" @input="updateValue" multiple style="width: 100%;">
        <el-option v-for="profile in profiles" :key="profile.id" :label="profile.fullname||profile.email" :value="profile.id.toString()">
             {{profile.fullname}}
            <code><{{profile.email}}></code>
        </el-option>
    </el-select>
</div><!--root-->
</template>

<script>
import Vue from 'vue'

var profiles = null;

export default {
    data () {
        return {
            values: [],
            profiles: [],
            resetting: false, 
        }
    },
    props: ['value'],

    watch: {
        value: function(values) {
            this.values = values; 
        }
    },

    mounted: function() {
        this.values = this.value; //init

        //TODO I should let ui-select/async and let it "search" users
        if(!profiles) profiles = this.$http.get(Vue.config.auth_api+'/profile');
        profiles.then(res=>{
            this.profiles = res.body.profiles;
        }, res=>{
            console.error(res);
        });
    },

    methods: {
        updateValue: function(values) {
            //just pass it back to parent
            this.$emit('input', values);
        }
    },
}
</script>
