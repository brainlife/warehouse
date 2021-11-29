<template>
<div v-if="taskconfig && appconfig">
    <small style="opacity: 0.5" v-if="Object.keys(taskconfig).length == 0">No configuration</small>
    <taskconfigtable :appconfig="appconfig" :config="taskconfig"/>
    <div v-if="!showAdDef && Object.keys(adDefConfig).length" class="adDef">
        <div @click="showAdDef = true" class="toggler">
            <icon name="caret-right" style="width: 20px"/> Show Other Advanced Options <small>(set to default)</small>
        </div>
    </div>
    <div v-if="showAdDef" class="adDef">
        <div @click="showAdDef = false" class="toggler">
            <icon name="caret-down" style="width: 20px"/> Hide Other Advanced Options
        </div>
        <taskconfigtable :appconfig="appconfig" :config="adDefConfig"/>
    </div>
</div>
</template>

<script>
import Vue from 'vue'
import appcache from '@/mixins/appcache'
import taskconfigtable from '@/components/taskconfigtable'

export default {
    components: {
        taskconfigtable,
    },
    mixins: [ appcache ],
    props: {
        //one of the following needs to be set
        task: Object,
        taskid: String,
    },
    data() {
        return {
            taskconfig: null,
            adDefConfig: null,
            appconfig: null,

            showAdDef: false,

            config: Vue.config,
        }
    },
    mounted: function() {
        this.load();
    },

    watch: {
        taskid: function() {
            this.load();
        },
        task: function() {
            this.load();
        },
    },

    methods: {
        load: function() {
            if(this.task) {
                this.load_config(this.task.config);
            } else {
                if(!this.taskid) return;
                this.$http.get(Vue.config.wf_api+'/task/'+this.taskid).then(res=>{
                    this.load_config(res.data.config);
                });
            }
        },

        load_config: function(config) {
            if(!config._app) {
                return;
            }
            this.appcache(config._app, (err, app)=>{
                //create key/value of scalar config
                this.taskconfig = {};
                this.adDefConfig = {};
                this.appconfig = {};
                
                if (app) this.appconfig = app.config;
                for(let id in config) {
                    if(id[0] == "_") continue;

                    let v = config[id];
                    if(v && v.toString().startsWith("..")) continue;

                    if(app.config[id].advanced && app.config[id].default !== undefined && app.config[id].default == v) {
                        this.adDefConfig[id] = v;
                    } else {
                        this.taskconfig[id] = v;
                    }
                }
            });
        },
        
    },
}
</script>

<style scoped>
.toggler {
    display: block;
    padding: 5px 0;
    font-size: 80%;
}
.toggler:hover {
    cursor: pointer;
    color: #2693ff;
}
.adDef {
    padding: 0 5px;
    background-color: #f0f0f0;
}
</style>

