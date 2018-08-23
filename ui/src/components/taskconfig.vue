<template>
<div v-if="taskconfig && appconfig">
    <span style="opacity: 0.4;" v-if="Object.keys(taskconfig).length == 0">No configuration</span>
    <table width="100%:">
        <tr v-for="(v,k) in taskconfig" :key="k" :class="{ default: is_default(k) }">
            <th width="25%">{{k}}</th>
            <td v-if="v === null" width="25%">
                <pre class="text-muted" style="margin-bottom: 0">null</pre>
            </td>
            <td v-else-if="v === ''" width="25%">(empty)</td>
            <td v-else-if="typeof v == 'object'" width="25%">
                <pre v-highlightjs style="margin-bottom: 0px;"><code class="json hljs">{{v}}</code></pre>
            </td>
            <td v-else width="25%">{{v}}</td>
            
            <td style="font-size: 85%;">
                <div v-if="appconfig[k]">
                    {{ appconfig[k].desc }} <span style="opacity: 0.6;">default={{get_default(k)}}</span>
                </div>
            </td>
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
            taskconfig: null,
            appconfig: null,

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
            //console.log("task changed");
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
            if(!this.appconfig[key]) {
                console.log(key, "not found in ", this.appconfig);
                return;
            }
            return (this.appconfig[key].default == this.taskconfig[key]);
        },

        get_default: function(key) {
            var d = this.appconfig[key].default;
            //console.dir(d);
            if(d === undefined) {
                return "(not set)";
            }
            if(d === null) {
                return "(null)";
            }
            if(typeof d == 'boolean') {
                if(d) return "(true)";
                return "(false)";
            }
            if(d === '') {
                return "(empty)";
            }
            return d;
        },
    },
}
</script>

<style scoped>
tr.default {
opacity:.6;
}
td,th {
vertical-align: top;
padding-right: 10px;
font-size: 90%;
}
</style>
