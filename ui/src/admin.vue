<template>
<div>
    <pageheader/>
    <div class="ui pusher">
        <div class="page-content">
		<div class="margin20">
            <b-alert show>todo</b-alert>

            <!--
            <h3>Services Running</h3>
            <pre>{{service_running}}</pre>
            -->

            <p>
                <h3>su</h3>
                <v-select 
                    @search="get_sulist" 
                    @input="su" 
                    :debounce="250" 
                    :options="su_options" placeholder="search user to become" label="fullname"/>
            </p>

            <p>
                <b-button @click="refresh">Refresh Token</b-button>
            </p>
        </div><!--magin20-->
        </div><!--page-content-->
    </div>
</div>
</template>

<script>
import Vue from 'vue'
import pageheader from '@/components/pageheader'

export default {
    components: { pageheader },
    data () {
        return {
            //service_running: [],
            su_options: [],
            config: Vue.config,
        }
    },
    mounted() {
        //load counts of apps currently running
        /*
        this.$http.get(Vue.config.wf_api+'/admin/services/running')
        .then(res=>{
            this.service_running = res.data;
        });
        */

        /*
        //load counts of resource currently running
        this.$http.get(Vue.config.wf_api+'/admin/resources/running')
        .then(res=>{
            this.resource_running = res.data;
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
                        {fullname: {$regex: search, $options : 'i'}}, 
                        {email: {$regex: search, $options : 'i'}},
                    ],
                }),
                limit: 0,
            }}).then(res=>{
                this.su_options = res.data;
                loading(false);
            });
        },

        su(person) {
            if(!person) return;
            this.$http.get(Vue.config.auth_api+'/jwt/'+person.sub).then(res=>{
                localStorage.setItem("jwt", res.data.jwt);
                document.location = "/project/";
            });
        },

        refresh() {
            this.$http.post(Vue.config.auth_api+'/refresh').then(res=>{
                console.log(res.data.jwt);
                localStorage.setItem("jwt", res.data.jwt);
                this.$notify("refreshed");
            });
            
        },
    },
}
</script>

<style scoped>
</style>
