<template>
<div>
    <el-select v-model="uids" multiple style="width: 100%;">
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
    name: "contactlist",
    data () {
        return {
            profiles: [],
            resetting: false, 
        }
    },
    props: ['uids'],

    mounted: function() {
        //TODO I should let ui-select/async and let it "search" users
        if(!profiles) profiles = this.$http.get(Vue.config.auth_api+'/profile');
        profiles.then(res=>{
            //this.$http.get(Vue.config.auth_api+'/profiles').then(res=>{
            this.profiles = res.body.profiles;

            /*
            //I have to initialize dropdown *after* Vue had chance to insert all
            //<option> tags - I can't do this during mounted step.
            Vue.nextTick(()=>{
                this.resetting = true;
                $(this.$el).find('.dropdown').dropdown('set exactly', this.uids);
                this.resetting = false;

                //inform parent of selection change
                $(this.$el).find('.dropdown').dropdown('setting', 'onChange', (v)=>{
                    if(this.resetting) return;
                    if(!v) return;
                    if(v.length == this.uids.length) return; //assume same
                    this.$emit('changed', v);
                });
            });
            */
        }, res=>{
            console.error(res);
        });
    },

    watch: {
        /*
        //initial uids to reset to..
        uids: function(val) {
            if(!val) return;
            //val = val.map(v=>v); //convert to pure array
            //"set exactly" fires changes event while resetting.. erronously informating
            //client and worse, causes infinite event looping.. resetting flag prevents it
            this.resetting = true;
            $(this.$el).find('.dropdown').dropdown('set exactly', val);
            this.resetting = false;
        }
        */
    },

    destroy: function () {
        //$(this.$el).find('.dropdown').dropdown('destroy');
    },

}
</script>
