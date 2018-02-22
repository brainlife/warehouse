<template>
<div v-if="taskconfig">
    <span class="text-muted" v-if="Object.keys(taskconfig).length == 0">No configuration</span>
    <b-row v-for="(v,k) in taskconfig" :key="k">
        <b-col :cols="3" style="font-size: 90%; opacity: 0.7">&nbsp;&nbsp;{{k}}</b-col>

        <b-col v-if="v === null"><span class="text-muted">null</span></b-col>
        <b-col v-else-if="typeof v == 'object'">
            <pre v-highlightjs style="margin-bottom: 0px;"><code class="json hljs">{{v}}</code></pre>
        </b-col>
        <b-col v-else>{{v}}</b-col>
    </b-row>
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
            //create key/value of scalar config
            this.taskconfig = {};
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

        }
    },
}
</script>

