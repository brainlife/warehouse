<template>
<div>
    <b-row v-for="(v,k) in taskconfig" :key="k">
        <b-col :cols="4"><span class="text-muted">{{k}}</span></b-col>
        <b-col><b>{{v}}</b></b-col>
    </b-row>
    <!--<pre v-if="config.debug">{{task.config}}</pre>-->
</div>
</template>

<script>
import Vue from 'vue'

export default {
    props: {
        taskid: {type: String},
    },
    data() {
        return {
            //task: null,    

            taskconfig: null,

            config: Vue.config,
        }
    },
    mounted: function() {
        console.log("mounted", this.taskid);
        this.load();
    },

    watch: {
        taskid: function() {
            this.load();
        },
    },

    methods: {
        load: function() {
            if(!this.taskid) return;
            this.$http.get(Vue.config.wf_api+'/task/'+this.taskid).then(res=>{
                let task = res.body;

                //create key/value of scalar config
                this.taskconfig = {};
                for(let id in task.config) {
                    if(id[0] == "_") continue;
                    let v = task.config[id];
                    let vs = v.toString();
                    if(vs.indexOf("..") != 0) this.taskconfig[id] = v;
                }

                //create key(input id)/dataset_id of _input
            });
        },
    },

}
</script>

