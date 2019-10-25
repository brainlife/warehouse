<template>
<div class="resource" v-if="resource_obj" @click="open">
    <div style="float: right; font-size: 125%; text-transform: uppercase;">
        <b-badge v-if="resource_obj.status == 'ok'" variant="success">OK</b-badge>
        <b-badge v-if="resource_obj.status != 'ok'" variant="danger">{{resource_obj.status}}</b-badge>
    </div>
    <b-badge v-if="!resource_obj.active" title="This resource is manually disabled by the resource owner, or status has been non-OK for long time.">Inactive</b-badge>
    <b-badge v-if="!resource.gids || resource.gids.length == 0" variant="danger" title="Private resource that's not shared with anyone."><icon name="lock" scale="0.8"/></b-badge>
    <span>{{resource_obj.name}}</span><br>
    <span style="font-size: 80%; opacity: 0.7;">{{resource_obj.config.desc}}</span>
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
    methods: {
        open() {
            this.$router.push('/resource/'+this.resource._id);
        },
    },
}
</script>

<style scoped>
.alert {
padding: 2px 5px;
}
.resource {
height: 80px;
overflow: hidden;
}
</style>
