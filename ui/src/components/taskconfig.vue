<template>
<div v-if="taskconfig">
    <span class="text-muted" v-if="Object.keys(taskconfig).length == 0">No configuration</span>
    <table class="table table-sm" style="margin-bottom: 0px; font-size: 85%;">
    <tr v-for="(v,k) in taskconfig" :key="k">
        <th width="30%" style="opacity: 0.7">&nbsp;&nbsp;{{k}}</th>
        <td v-if="typeof v == 'object'">
            <pre v-highlightjs style="margin-bottom: 0px;"><code class="json hljs">{{v}}</code></pre>
        </td>
        <td v-else>{{v}}</td>
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
                    //create key(input id)/dataset_id of _input
                });
            }
        },

        load_config: function(config) {
            //create key/value of scalar config
            this.taskconfig = {};
            for(let id in config) {
                if(id[0] == "_") continue;
                let v = config[id];
                let vs = v.toString();
                if(vs.indexOf("..") != 0) this.taskconfig[id] = v;
            }

        }
    },

}
</script>

