<template>
<div>
    <pageheader/>
    <sidemenu active="/admin"></sidemenu>
    <div class="ui pusher">
        <div class="page-content">
		<div class="margin20">
            <b-alert show>todo</b-alert>

            <h3>Services Running</h3>
            <pre>{{service_running}}</pre>

            <h3>su</h3>
            <v-select 
                :debounce="250" 
                :on-change="su" 
                :on-search="get_sulist" 
                :options="su_options" placeholder="search user to become" label="fullname"/>

        </div><!--magin20-->
        </div><!--page-content-->
    </div><!--off-sidemenu-->
</div>
</template>

<script>
import Vue from 'vue'
import sidemenu from '@/components/sidemenu'
import pageheader from '@/components/pageheader'

import vSelect from 'vue-select'

export default {
    components: { sidemenu, pageheader, vSelect },
    data () {
        return {
            service_running: [],
            su_options: [],
            config: Vue.config,
        }
    },
    mounted() {
        //load counts of apps currently running
        this.$http.get(Vue.config.wf_api+'/admin/services/running')
        .then(res=>{
            this.service_running = res.body;
        });

        /*
        //load counts of resource currently running
        this.$http.get(Vue.config.wf_api+'/admin/resources/running')
        .then(res=>{
            this.resource_running = res.body;
        });
        */
    },
    methods: {
        get_sulist(search, loading) {
            loading(true);
            this.$http.get(Vue.config.auth_api+'/users', { params: {
                where: JSON.stringify({
                    $or: [
                        //need to use iLike with postgres..
                        {fullname: {$like: "%"+search+"%"}}, 
                        {email: {$like: "%"+search+"%"}},
                    ],
                }),
            }}).then(res=>{
                this.su_options = res.body;
                loading(false);
            });
        },

        su(person) {
            if(!person) return;
            this.$http.get(Vue.config.auth_api+'/jwt/'+person.id).then(res=>{
                localStorage.setItem("jwt", res.body.jwt);
                document.location.reload();
            });
        }
    },
}
</script>

<style scoped>
</style>
