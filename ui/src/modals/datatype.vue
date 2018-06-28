<template>
<transition name="fade">
<div v-if="datatype" class="datatype-overlay">
    <b-container class="datatype-modal">
        <div class="datatype-header">
            <div style="float:right;">
                <div class="button" @click="close" style="margin-left: 20px; opacity: 0.8;">
                    <icon name="times" scale="1.5"/>
                </div>
            </div>
            <div style="display:inline-block;">
                <h2>{{datatype.name}}</h2>
            </div>
        </div><!--header-->
        
        <div style="display:relative; box-sizing:border-box; overflow:auto;">
            <div style="position:absolute; bottom:0; top:65px; left: 0; right: 0; padding:4px; overflow: auto;">
                <datatype :datatype="datatype"></datatype>
                <div v-if="apps" style="padding:10px;">
                    <b-alert show variant="info" v-if="apps.length == 0">There are currently no applications that use this datatype.</b-alert>
                    <p v-else>The following apps require this datatype as an input.</p>
                    <div v-for="app in apps" :key="app._id" style="display:inline-block; width: 33%;">
                        <div style="margin-left: 5px; margin-right: 5px; margin-bottom: 10px; cursor: pointer;" @click="openapp(app._id)">
                            <app :app="app" descheight="80px" :clickable="false"></app>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!--<b-tabs class="brainlife-tab" v-model="tab_index"></b-tabs>-->
    </b-container>
</div>
</transition>
</template>
<script>
import Vue from 'vue'

import app from '@/components/app'
import datatype from '@/components/datatype'
import datatypetag from '@/components/datatypetag'

export default {
    components: { 
        app, datatype, datatypetag
    },
    data () {
        return {
            datatype: null,
            apps: null,

            alltags: null,
            config: Vue.config,
        } 
    },

    mounted() {
        this.$root.$on("datatype.view", id=>{
            // console.log("requested to view", id);
            this.load(id);
        });
        
        document.addEventListener("keydown", e => {
            if (e.keyCode == 27) {
                this.close();
            }
        });
    },
    
    watch: {
        '$route': function() {
            if (!this.$route.path.startsWith('/datatypes')) {
                this.close();
            }
        },
    },

    methods: {
        load: function(id) {
            this.$http.get('datatype', {params: {
                "find": JSON.stringify({
                    "_id": id
                })
            }}).then(res=>{
                if (!res.body.count) console.error(`No matching datatype found for ${id}`);
                else {
                    this.datatype = res.body.datatypes[0];
                    
                    this.$http.get('app', {params: {
                        "find": JSON.stringify({
                            //look for apps that uses my datatype as input
                            "inputs.datatype": this.datatype._id,
                            removed: false,
                        }),
                        populate: 'inputs.datatype outputs.datatype contributors',
                    }}).then(res=>{
                        if(!res) return; //TODO notify error?
                        this.apps = res.body.apps;
                    });
                }
            }).catch(console.error);
        },
    
        close: function() {
            if(!this.datatype) return;
            this.$router.push(this.$route.path.replace(this.datatype._id, ""));
            this.datatype = null;
        },
        
        openapp: function(app_id) {
            if(!this.datatype) return;
            this.$router.push('/app/'+app_id);
            this.datatype = null;
        },
    }
}

</script>
<style scoped>
.datatype-overlay {
position: fixed;
top: 0px;
left: 0px;
bottom: 0px;
right: 0px;
background-color: rgba(0,0,0,0.3);
z-index: 10;
padding: 30px;
}
.datatype-header {
background-color: white;
padding: 10px 20px;
box-shadow: 0 0 3px rgba(0,0,0,0.5);
z-index: 20;
height: 60px;
position: relative;
}
.datatype-modal {
background-color: #fff;
height: 100%;
padding: 0px;
box-shadow: 0 0 20px #000;
position: relative;
}

.fade-enter-active, .fade-leave-active {
transition: opacity .3s;
}
.fade-enter, .fade-leave-to {
opacity: 0;
}
</style>
