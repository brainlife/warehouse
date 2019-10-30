<template>
<div class="resource" v-if="resource_obj" @click="open">
    <div class="resource-info">
        <b-badge v-if="resource_obj.status == 'ok'" variant="success">OK</b-badge>
        <b-badge v-if="resource_obj.status != 'ok'" variant="danger">{{resource_obj.status}}</b-badge>
    </div>
    <b-badge v-if="!resource_obj.active" title="This resource is manually disabled by the resource owner, or status has been non-OK for long time.">Inactive</b-badge>
    <b-badge v-if="!resource.gids || resource.gids.length == 0" variant="danger" title="Private resource that's not shared with anyone."><icon name="lock" scale="0.8"/></b-badge>
    <span>{{resource_obj.name}}</span><br>
    <span style="font-size: 80%; opacity: 0.7;">{{resource_obj.config.desc}}</span>
    <svg viewBox="0 0 200 200" version="1.1" xmlns="http://www.w3.org/2000/svg" class="svg">
        <path :d="usage_path" fill="none" stroke="grey" />
    </svg>
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
    computed: {
        usage_path() {
            function bezierCommand(point, i, a) {
                // start control point
                const cps = controlPoint(a[i - 1], a[i - 2], point)

                // end control point
                const cpe = controlPoint(point, a[i - 1], a[i + 1], true)
                return `C ${cps[0]},${cps[1]} ${cpe[0]},${cpe[1]} ${point[0]},${point[1]}`
            }

            let points = this.resource_obj.stats.recent_job_counts;
            // build the d attributes by looping over the points
            const d = points.reduce((acc, point, i, a) => i === 0
            ? `M ${point[0]},${point[1]}`
            : `${acc} ${command(point, i, a)}`
            , '')
            return d;
            //return `<path d="${d}" fill="none" stroke="grey" />`
        },
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
}
.resource-info {
float: right; 
font-size: 125%; 
text-transform: 
uppercase; 
height: 80%; 
overflow: hidden;
}
</style>
