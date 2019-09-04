<template>
<div v-if="resource_obj">
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
}
</script>


