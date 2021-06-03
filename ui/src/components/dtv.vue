<template>
<div>
    <div v-if="task.finish_date" class="validated">
        <timeago class="text-muted" style="float: right" :datetime="task.finish_date" :auto-update="10"/>
        <span v-if="task.product && 
            task.product.errors && 
            task.product.errors.length == 0 && 
            task.product.warnings && 
            task.product.warnings.length == 0">
            <icon name="check" scale="0.8"/> <b style="opacity: 0.8">Validated</b>
            <!-- <br> Found no issues-->
        </span>
        <small>by {{task.service}} {{task.service_branch}} <small>{{task._id}}</small></small>
        <div v-if="task.product" style="margin-bottom: 5px;">
            <b-alert show v-for="(error, idx) in task.product.errors" :key="idx" variant="danger" class="dtv-alert"><b>Error</b> {{error}}</b-alert>
            <b-alert show v-for="(warning, idx) in task.product.warnings" :key="idx" variant="secondary" class="dtv-alert"><b>Warning</b> {{warning}}</b-alert>
            <product :product="task.product" skipFollow="true"/>
        </div>

        <b-alert :show="secondaryError != ''" variant="secondary">{{secondaryError}}</b-alert>
        <secondary v-if="secondary && task.product" :task="task" :output="output" :product="task.product" :secondary="secondary"/>
        <span v-else>
            <icon name="cog" spin></icon> Waiting to be archived ...
        </span>
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
    props: [
        'task',  //validator(dtv) task
        'output'
    ],

    components: {
        secondary,
        product,
        task,
        statusicon,
    },

    data() {
        return {
            //product: null,  //product of dtv
            secondary: null, 
            secondaryError: "",
        }
    },

    mounted() {
        //this.loadProduct();
        if(this.task.finish_date) {
            console.log("waiting for secondary acchive");
            this.waitSecondaryArchive(this.task, (err, secondary)=>{
                if(err) {
                    console.error(err); //let it continue
                    this.secondaryError = err;
                }
                console.log("done secondary archive!");
                this.secondary = secondary;
            });
        }
    },

    watch: {
        task() {
            if(this.task.finish_date && !this.secondary) {
                this.waitSecondaryArchive(this.task, (err, secondary)=>{
                    if(err) console.error(err);
                    else this.secondary = secondary;
                });
            }
        }
    },

    methods: {
        /*
        loadProduct() {
            this.$http.get(Vue.config.wf_api+'/task/product/', {params: {ids: [this.task._id]}}).then(res=>{
                if(res.data.length == 1) {
                    this.product = res.data[0].product;
                } else {
                    console.log("don't have product.. will reload later..");
                    setTimeout(this.loadProduct, 5*1000);
                }
            });
        }
        */
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
