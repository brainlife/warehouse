<template>
<div v-if="taskconfig && appconfig">
    <span style="opacity: 0.4;" v-if="Object.keys(taskconfig).length == 0">No configuration</span>
    <table width="100%">
        <tr v-for="(v,k) in taskconfig" :key="k" class="config-row" :class="{ default: is_default(k) }">
            <th>{{k}}</th>
            <td v-if="v === null">
                <pre class="text-muted" style="margin-bottom: 0">null</pre>
            </td>
            <td v-else-if="v === ''">(empty)</td>
            <td v-else-if="typeof v == 'object'">
                <!-- <pre v-highlightjs style="margin-bottom: 0px;"><code class="json hljs">{{v}}</code></pre> -->
                <pre style="margin-bottom: 0px;">{{JSON.stringify(v, null, 4)}}</pre>
            </td>
            <td v-else width="30%"><pre style="white-space: pre-wrap;">{{v}}</pre></td>
            
            <td style="font-size: 85%;" width="50%" v-if="appconfig[k]" :title="appconfig[k].desc" v-b-tooltip.hover>
                <div style="white-space: pre-line; overflow: hidden; text-overflow: ellipsis; height: 15px;">
                    <span style="opacity: 0.7;">default: {{get_default(k)}}</span> {{appconfig[k].desc}} 
                </div>
            </td>
        </tr>
    </table>
    <!--<small style="opacity: 0.5" v-if="taskconfig == {}">No Configuration</small>-->
</div>
</template>

<script>
import Vue from 'vue'
import appcache from '@/mixins/appcache'

export default {
    mixins: [ appcache ],
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
                    this.load_config(res.data.config);
                });
            }
        },

        load_config: function(config) {
            if(!config._app) {
                //console.error("can't load config without _app set");
                return;
            }
            this.appcache(config._app, (err, app)=>{
                //create key/value of scalar config
                this.taskconfig = {};
                this.appconfig = {};
                
                if (app) this.appconfig = app.config;
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
                //console.log(key, "not found in ", this.appconfig);
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
opacity:.7;
}
tr:hover {
opacity: inherit; 
color: #007bff;
}
pre {
color: inherit;
}
td,th {
vertical-align: top;
padding-right: 10px;
font-size: 90%;
}
</style>
