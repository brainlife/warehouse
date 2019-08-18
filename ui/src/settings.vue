<template>
<div>
    <sidemenu active="/settings"></sidemenu>
    <div class="page-content">
        <div class="header">
            <b-container>
                <h1>Settings</h1>
                <b-tabs class="brainlife-tab" v-model="tab">
                    <b-tab title="Account"/>
                    <b-tab title="Resources"/>
                    <b-tab title="Notifications"/>
                </b-tabs>
            </b-container>
        </div><!--header-->

        <!--main content-->
        <b-container>
            body
        </b-container>
        <br>
        <br>
    </div><!--page-content-->
</div>
</template>

<script>
import Vue from 'vue'
import pageheader from '@/components/pageheader'
import sidemenu from '@/components/sidemenu'

export default {
    components: { 
        pageheader, sidemenu,
    },

    data () {
        return {
            tab: 0,
            config: Vue.config,
        }
    },

    mounted() {
        console.log("mounting settings"); 
    },
    
    methods: {
    },
}
</script>

<style scoped>
.page-content {
    top: 0px;
}
.page-content h1 {
font-size: 1.75rem;
color: #999;
margin-bottom: 0px;
padding: 10px 0px;
}
.header {
    background-color: white;
    margin-bottom: 30px;
    padding: 15px 0px 0px 0px;
    border-bottom: 1px solid #eee;
    position: sticky;
    top: 0px;
    z-index: 1;
}
</style>


