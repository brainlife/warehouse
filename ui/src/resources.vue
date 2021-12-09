<template>
<div>
    <div class="page-content" ref="scrolled">
        <!--
        <div class="header">
            <b-container>
                <h2>Resources</h2>
                <p style="opacity: 0.7;">
                    You can run Apps on the following computing resources. To register your own resources, please see <a href="https://brainlife.io/docs/resources/register/" target="doc">Registering Resources</a>.
                </p>
            </b-container>
        </div>
        -->
        <div v-if="resources.mine.length > 0">
            <h4 class="header-sticky"><b-container>My Resources</b-container></h4> 
            <b-container>
                <resource v-for="resource in resources.mine" :key="resource._id" class="resource" :resource="resource"/>
            </b-container>
            <br>
            <br>
        </div>

        <div v-if="resources.others.length > 0">
            <h4 class="header-sticky"><b-container>User Resources <small>(for admin)</small></b-container></h4> 
            <b-container>
                <resource v-for="resource in resources.others" :key="resource._id" class="resource" :resource="resource"/>
            </b-container>
            <br>
            <br>
        </div>

        <div v-if="resources.public.length > 0">
            <h4 class="header-sticky"><b-container>Public Resources</b-container></h4> 
            <b-container>
                <br>
                <p style="opacity: 0.7">
                    The following resources are shared among all brainlife users.
                </p>
                <resource v-for="resource in resources.public" :key="resource._id" class="resource" :resource="resource"/>
                <br>
                <p>
                    <small>To register your own resources, please see <a href="https://brainlife.io/docs/resources/register/" target="doc">Registering Resources</a>.</small>
                </p>
            </b-container>
            <br>
            <br>
        </div>

        <b-button v-if="config.hasRole('resource.create', 'amaretti')" class="button-fixed" @click="newresource">
            New Resource
        </b-button>
    </div><!--page-content-->
</div>
</template>

<script>

import Vue from 'vue'
import Router from 'vue-router'

import PerfectScrollbar from 'perfect-scrollbar'
import VueMarkdown from 'vue-markdown'

import pageheader from '@/components/pageheader'
import contact from '@/components/contact'
import tags from '@/components/tags'
import resource from '@/components/resource'

export default {
    components: { 
        pageheader, contact, tags, resource,
    },

    data () {
        return {
            resources: {
                mine: [],
                others: [], //only admin should see this
                public: [], 
            },

            //for selected item
            apps: [], //apps that uses selected datatype
            adhoc_datatype_tags: [], //datatype tags associated with selected datatype

            //sample_task: null,
            sample_datasets: [],
            
            //editing: false, 
            config: Vue.config,
        }
    },

    computed: {
        /*
        myResources() {
            if(!this.resources) return [];
            const usub = Vue.config.user.sub.toString();
            return this.resources.filter(r=>(r.user_id == usub || (r.admins && r.admins.includes(usub))));
        },

        userResources() {
            if(!this.resources) return [];
            const usub = Vue.config.user.sub.toString();
            return this.resources.filter(r=>(!r.gids.includes(1) && r.user_id != usub && (!r.admins || !r.admins.includes(usub))));
        },

        publicResources() {
            if(!this.resources) return [];
            return this.resources.filter(r=>r.gids.includes(1));
        },
        */
    },

    mounted() {
        const find = {
            status: {$ne: "removed"},
        };
        if(Vue.config.hasRole("admin")) find.user_id = null; //disable user filtering to show all

        this.$http.get(Vue.config.amaretti_api+'/resource', {params: {
            find: JSON.stringify(find),
            select: 'resource_id config.desc config.maxtask name citation status status_msg lastok_date active gids stats avatar'
        }}).then(res=>{
            this.resources.mine = [];
            this.resources.others = [];
            this.resources.public = [];
            const usub = Vue.config.user.sub.toString();
            res.data.resources.forEach(r=>{
                if(r.gids.includes(1)) {
                    //public resource
                    this.resources.public.push(r);
                } else if(r.user_id == usub || (r.admins && r.admins.includes(usub))) {
                    //mine
                    this.resources.mine.push(r);
                } else {
                    this.resources.others.push(r); //only admin should see this
                }
            });
        }).catch(console.error);
    },

    methods: {
        newresource() {
            this.$router.push('/resource/_/edit');
        },
    }, //methods
}
</script>

<style scoped>
.page-content {
    top: 0px;
}
.page-content h2 {
    margin-bottom: 0px;
    padding: 10px 0px;
    font-size: 20pt;
}
.page-content h4 {
    padding: 15px 20px;
    background-color: white;
    opacity: 0.8;
    color: #999;
    font-size: 17pt;
    font-weight: bold;
}
.header {
    padding: 10px;
    background-color: white;
    border-bottom: 1px solid #eee;
}
h4.header-sticky {
    position: sticky;
    top: 0px;
    z-index: 2;
    box-shadow: 0 0 1px #ccc;
    padding-top: 12px;
    height: 50px;
}
.resource {
    border-bottom: 1px solid #0001;
}
.container p {
    margin-left: 20px;
}
</style>

