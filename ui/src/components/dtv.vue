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
        <secondary v-if="secondary && product" 
            :task="task" :output="output" :product="product" :secondary="secondary"/>
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
import secondaryWaiter from '@/mixins/secondarywaiter'

import axios from 'axios'

export default {
    mixins: [secondaryWaiter],
    props: ['task', 'output'],

    components: {
        secondary,
        product,
        task,
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
                console.log("watch detected dtv finish");
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
</style>

