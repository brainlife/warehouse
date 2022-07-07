<template>
<b-table :items="events" :fields="fields">
    <template #cell(date)="data">
        <!-- <timeago :datetime="data.value" style="width: 100px;"/>-->
        <div style="width: 150px">
            <small>{{new Date(data.value).toLocaleString()}}</small>
        </div>
    </template>
    <template #cell(user_id)="data">
        <contact :id="data.value" size="small"/>
    </template>
    <template #cell(status)="data">
        <statustag :status="data.value" hideicon="true"/>
    </template>
    <template #cell(status_msg)="data">
        <pre>{{data.value}}</pre>
    </template>
</b-table>
</template>

<script>

import Vue from 'vue'

import statustag from '@/components/statustag'
import contact from '@/components/contact'

export default {
    components: { statustag, contact },
    props: {
        taskId: String,
    },
    data() {
        return {
            events: [],
            fields: [
                'date', 
                //'user_id', 
                'status', 
                'status_msg'
            ],
        }
    },
    mounted() {
        console.log("mounting", this.taskId);
        this.$http.get(Vue.config.amaretti_api+'/taskevent/'+this.taskId).then(res=>{
            this.events = res.data.taskevents;
            console.dir(this.events);
        });
    },
}
</script>

<style scoped>
.validator-sign {
    float: right;
    opacity: 0.7;
}
</style>
