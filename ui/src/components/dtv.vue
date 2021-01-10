<template>
<div>
    <div v-if="task.finish_date" class="validated">
        <timeago class="text-muted" style="float: right" :datetime="task.finish_date" :auto-update="10"/>
        <span v-if="task.product && task.product.errors.length == 0 && task.product.warnings.length == 0" style="opacity: 0.5;">
            <icon name="check" scale="0.8"/> <b style="opacity: 0.8">Validated</b>
            <small>by {{task.service}} {{task.service_branch}} <small>{{task._id}}</small></small>
            <br> Found no issues
        </span>
        <div v-if="task.product" style="margin-bottom: 5px;">
            <b-alert show v-for="(error, idx) in task.product.errors" :key="idx" variant="danger" class="dtv-alert"><b>Error</b> {{error}}</b-alert>
            <b-alert show v-for="(warning, idx) in task.product.warnings" :key="idx" variant="secondary" class="dtv-alert"><b>Warning</b> {{warning}}</b-alert>
            <product :product="task.product" skipFollow="true"/>
        </div>

        <secondary v-if="secondary && product" :task="task" :output="output" :product="product" :secondary="secondary"/>

    </div>
    <task v-else :task="task"/>
</div>
</template>

<script>
import Vue from 'vue'
import product from '@/components/product'
import secondary from '@/components/secondary'
import task from '@/components/task'
import secondaryWaiter from '@/mixins/secondarywaiter'
import statusicon from '@/components/statusicon'

import axios from 'axios'

export default {
    mixins: [secondaryWaiter],
    props: ['task', 'output'],

    components: {
        secondary,
        product,
        task,
        statusicon,
    },

    data() {
        return {
            product: null, 
            secondary: null, 
        }
    },

    watch: {
        task() {
            if(this.task.finish_date && !this.secondary) {
                //console.log("watch detected dtv finish");
                this.waitSecondaryArchive(this.task, (err, secondary)=>{
                    if(err) console.error(err);
                    else this.secondary = secondary;
                });
            }
        }
    },

    mounted() {
        this.$http.get(Vue.config.wf_api+'/task/product/', {params: {ids: [this.task._id]}}).then(res=>{
            if(res.data.length == 1) {
                this.product = res.data[0].product;
            } else {
                this.product = {}
            }
        });

        if(this.task.finish_date) {
            console.log("validator finished.. now waiting for secondary");
            this.waitSecondaryArchive(this.task, (err, secondary)=>{
                if(err) console.error(err);
                else this.secondary = secondary;
            });
        }
    },
}
</script>

<style scoped>
.dtv-alert {
padding-left: 10px;
margin-bottom: 1px !important;
}
.dtv-alert b {
opacity: 0.5;
margin-right: 10px;
}
.validated {
margin-top: 10px;
padding: 10px 15px;
background-color: white;
border-radius: 4px;
/*border: 2px solid #ddd;*/
box-shadow: 0px 0px 3px #0002;
}
.subtitle {
font-weight: bold;
opacity: 0.5;
}
</style>
