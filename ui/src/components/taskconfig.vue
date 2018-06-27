<template>
<div v-if="taskconfig">
    <span style="opacity: 0.4;" v-if="Object.keys(taskconfig).length == 0">No configuration</span>
    <table>
        <tr v-for="(v,k) in taskconfig" :key="k" :class="{ default: is_default(k) }">
            <td>{{k}}</td>
            
            <td v-if="v === null">
                <pre class="text-muted" style="margin-bottom: 0">null</pre>
            </td>
            <td v-else-if="typeof v == 'object'">
                <pre v-highlightjs style="margin-bottom: 0px;"><code class="json hljs">{{v}}</code></pre>
            </td>
            <td v-else>{{v}}</td>
            
            <td v-if="appconfig[k]" style="font-size: 70%;">{{ appconfig[k].desc }}</td>
        </tr>
    </table>
</div>
</template>

<script>
import Vue from 'vue'

export default {
    props: {
        //one of the following needs to be set
        task: Object,
        taskid: String,
    },
    data() {
        return {
            //task: null,    
            taskconfig: null,
            appconfig: {},

            config: Vue.config,
        }
    },
    mounted: function() {
        //console.log("mounted taskconfig");
        this.load();
    },

    watch: {
        taskid: function() {
            this.load();
        },
        task: function() {
            console.log("task changed");
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
                    this.load_config(res.body.config);
                });
            }
        },

        load_config: function(config) {
            this.$http.get('app', { params: {
                find: JSON.stringify({
                    _id: config._app,
                    removed: false,
                }),
            } })
            .then(res => {
                //create key/value of scalar config
                this.taskconfig = {};
                this.appconfig = {};
                
                if (res.body.apps[0]) this.appconfig = res.body.apps[0].config;
                for(let id in config) {
                    if(id[0] == "_") continue;
                    
                    let v = config[id];
                    if(v === null) {
                        this.taskconfig[id] = null;
                    } else {
                        let vs = v.toString();
                        if(vs.indexOf("..") != 0) this.taskconfig[id] = v;
                    }
                }
            });
        },
        
        is_default: function(key) {
            if (typeof this.appconfig[key] != 'undefined') {
                return (this.appconfig[key].default + "").length > 0;
            }
            return false;
        },
    },
}
</script>

<style scoped>
tr.default {
opacity:.5;
}

td {
padding-right:40px;
}
</style>