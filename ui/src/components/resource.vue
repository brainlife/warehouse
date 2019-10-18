<template>
<div v-if="resource_obj">
    <div style="float: right">
        <b-badge v-if="!resource_obj.active">Inactive</b-badge>
        <b-badge v-if="resource_obj.status == 'ok'" variant="success">OK</b-badge>
        <b-badge v-if="resource_obj.status != 'ok'" variant="danger">{{resource_obj.status}}</b-badge>
    </div>
    <span>{{resource_obj.name}}</span><br>
    <span style="font-size: 80%; opacity: 0.7;">{{resource_obj._detail.desc}}</span>
    <b-alert :show="resource_obj.status != 'ok'" variant="danger">{{resource_obj.status_msg}}</b-alert>
</div>
</template>

<script>
import Vue from 'vue'

import resource_cache from '@/mixins/resource_cache'

export default {
    mixins: [ resource_cache ],
    props: {
        id: String, //resource id
        resource: Object,
    },
    data() {
        return {
            resource_obj: null
        }
    },
    created: function() {
        if(this.resource) this.resource_obj = this.resource;
        if(this.id) {
            this.resource_cache(this.id, (err, resource)=>{
                this.resource_obj = resource;
            });
        }
    },
}
</script>

<style scoped>
.alert {
padding: 2px 5px;
}
</style>
