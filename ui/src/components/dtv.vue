<template>
<div>
    <div v-if="task.finish_date">
        <b style="opacity: 0.5;">{{task.service}}<small>:{{task.service_branch}}</small></b>
        <span v-if="task.product && task.product.errors.length == 0 && task.product.warnings.length == 0">
            <icon name="check" scale="0.8"/> Found no issues
        </span>
        <small>({{task._id}})</small>
        <div v-if="task.product" style="margin-bottom: 5px;">
            <b-alert show v-for="(error, idx) in task.product.errors" :key="idx" variant="danger"><b>Error</b> {{error}}</b-alert>
            <b-alert show v-for="(warning, idx) in task.product.warnings" :key="idx" variant="secondary"><b>Warning</b> {{warning}}</b-alert>
            <product :product="task.product" skipFollow="true"/>
        </div>
        <secondary v-if="secondaryArchived && product" :task="task" :output="output" :product="product"/>
    </div>
    <div v-else>
        <task :task="task"/>
    </div>
</div>
</template>

<script>
import Vue from 'vue'
import product from '@/components/product'
import secondary from '@/components/secondary'
import task from '@/components/task'

import axios from 'axios'

export default {
    props: ['task', 'output'],
    components: {
        secondary,
        product,
        task,
    },
    data() {
        return {
            product: null, 
            secondaryArchived: false,
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

        this.checkSecondaryArchive();
    },
    methods: {
        checkSecondaryArchive() {
            console.log("checking to see if secondary archive task has finished", this.task._id);
            //look for finished secondary archive task
            this.$http.get(Vue.config.amaretti_api+'/task', {params: {
                find: JSON.stringify({
                    instance_id: this.task.instance_id,
                    'deps_config.task': this.task._id,
                    //finish_date: {$exists: true},
                }),
                populate: 'finish_date status',
                limit: 1,
            }})
            .then(res=>{
                if(res.data.tasks.length == 0) {
                    console.log("secondary archiver hasn't been submitted yet.. waiting");
                    setTimeout(()=>{
                        this.checkSecondaryArchive();
                    }, 5000);
                } else if(res.data.tasks.length == 1) {
                    let task = res.data.tasks[0];
                    if(task.finish_date) {
                        console.log("secondary archiver exists and it's finished");
                        this.secondaryArchived = true;
                    } else {
                        if(task.status == "requested" || task.status == "running") {
                            console.log("secondary task archiver still running.. waiting");
                            //secondary data not yet archived? pull again later
                            setTimeout(()=>{
                                this.checkSecondaryArchive();
                            }, 5000);
                        } else {
                            console.error("secondary task failed?");
                            console.dir(task);
                        }
                    }
                }
            });
        },
    },
}
</script>

<style scoped>
</style>

