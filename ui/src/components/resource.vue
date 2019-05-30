<template>
<div>
{{id}}
{{_resource}} resource!
</div>
</template>

<script>
import Vue from 'vue'

import resource_cache from '@/mixins/resource_cache'

export default {
    mixins: [ resource_cache ],
    //components: { appavatar },
    props: {
        id: String, //resource id
        resource: Object,
    },
    data() {
        return {
            _resource: null
        }
    },
    created: function() {
        if(this.resource) this._resource = this.resource;
        if(this.id) {
            console.log("resolving id", id);
            this.resource_cache(this.id, (err, resource)=>{
                this._resource = resource;
            });
        }
    },
}
</script>


