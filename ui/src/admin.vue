<template>
<div>
    <pageheader/>
    <sidemenu active="/admin"></sidemenu>
    <div class="ui pusher">
        <div class="page-content">
		<div class="margin20">
            <b-alert show>todo</b-alert>
            <h3>Running</h3>
            <pre>{{running}}</pre>
        </div><!--magin20-->
        </div><!--page-content-->
    </div><!--off-sidemenu-->
</div>
</template>

<script>
import Vue from 'vue'
import sidemenu from '@/components/sidemenu'
import pageheader from '@/components/pageheader'

export default {
    components: { sidemenu, pageheader },
    data () {
        return {
            running: [],
            config: Vue.config,
        }
    },
    mounted() {
        //load counts of apps currently running
        this.$http.get(Vue.config.wf_api+'/task/running')
        .then(res=>{
            this.running = res.body;
        });
    },
}
</script>

<style scoped>
</style>
