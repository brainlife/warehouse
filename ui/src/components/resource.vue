<template>
<div class="resource" v-if="resource_obj" @click="open">
    <div style="height: 150px; position: absolute; width: 100%; z-index: 1;">
        <div class="resource-tags">
            <b-badge v-if="resource_obj.status == 'ok'" variant="success">OK</b-badge>
            <b-badge v-if="resource_obj.status != 'ok'" variant="danger">{{resource_obj.status}}</b-badge>
        </div>
        <div style="height: 90px; padding: 5px; overflow: hidden;">
            <b-badge v-if="!resource_obj.active" title="This resource is manually disabled by the resource owner, or status has been non-OK for long time.">Inactive</b-badge>
            <b-badge v-if="!resource.gids || resource.gids.length == 0" variant="danger" title="Private resource that's not shared with anyone."><icon name="lock" scale="0.8"/></b-badge>
            <span>{{resource_obj.name}}</span><br>
            <span style="font-size: 80%; opacity: 0.8;">{{resource_obj.config.desc}}</span>
        </div>
    </div>
    <div style="bottom: 10px; position: absolute; left: 10px;">
        <b style="margin-bottom: 0px;">{{resource_obj.config.maxtask}}</b><br>
        <small style="opacity: 0.5; text-transform: uppercase;">max tasks</small>
    </div>
    <div style="bottom: 10px; right: 10px; position: absolute; text-align: right;">
        <b style="margin-bottom: 0px;">{{running}}</b><br>
        <small style="opacity: 0.5; text-transform: uppercase;">running</small>
    </div>
    <svg viewBox="0 0 200 100" style="position: absolute; bottom: 0px; height: 150px; width: 100%;" preserveAspectRatio="none">
        <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#0c9;stop-opacity:0.5" />
          <stop offset="80%" style="stop-color:#00f;stop-opacity:0.01" />
        </linearGradient>
        <path :d="usage_path" fill="url(#grad1)" stroke="#2693ff60" stroke-width="0.5"/>
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
        running() {
            if(!this.resource_obj.stats || !this.resource_obj.stats.recent_job_counts) return 0;
            let raw_points = this.resource_obj.stats.recent_job_counts; 
            if(raw_points.length == 0) return 0;
            let last = raw_points[raw_points.length-1]; 
            return last[1];
        },

        usage_path() {
            if(!this.resource_obj.stats || !this.resource_obj.stats.recent_job_counts) return "";
            if(this.resource_obj.config.maxtask == 0) return "";
            let raw_points = this.resource_obj.stats.recent_job_counts; 
            if(raw_points.length == 0) return "";

            //scale time to fit 200x50
            let points = [];
            let min_time = raw_points[0][0];
            let max_time = raw_points[raw_points.length-1][0];
            let range_time = max_time - min_time;

            /*
            raw_points.forEach(point=>{
                if(max_value < point[1]) max_value = point[1];
            });
            */
            raw_points.forEach(point=>{
                let t = point[0] - min_time;
                t = t / range_time * 200; 
                let v = point[1];
                //if(Vue.config.debug) v += Math.random()*4;
                v = 99 - v / this.resource_obj.config.maxtask * 100; //don't let graph touch top and bottom..
                points.push([t,v]);
            });

            const smoothing = 0.2; //smoothing causes graph to dip below 0 when 0 goes to 1

            // Properties of a line 
            // I:  - pointA (array) [x,y]: coordinates
            //     - pointB (array) [x,y]: coordinates
            // O:  - (object) { length: l, angle: a }: properties of the line
            function line (pointA, pointB) {
              const lengthX = pointB[0] - pointA[0]
              const lengthY = pointB[1] - pointA[1]
              return {
                  length: Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2)),
                  angle: Math.atan2(lengthY, lengthX)
              }
            }

            //https://codepen.io/francoisromain/pen/dzoZZj
            // Position of a control point 
            // I:  - current (array) [x, y]: current point coordinates
            //     - previous (array) [x, y]: previous point coordinates
            //     - next (array) [x, y]: next point coordinates
            //     - reverse (boolean, optional): sets the direction
            // O:  - (array) [x,y]: a tuple of coordinates
            function controlPoint(current, previous, next, reverse) {
              // When 'current' is the first or last point of the array
              // 'previous' or 'next' don't exist.
              // Replace with 'current'
              const p = previous || current
              const n = next || current

              // Properties of the opposed-line
              const o = line(p, n)

              // If is end-control-point, add PI to the angle to go backward
              const angle = o.angle + (reverse ? Math.PI : 0)
              const length = o.length * smoothing

              // The control point position is relative to the current point
              const x = current[0] + Math.cos(angle) * length
              const y = current[1] + Math.sin(angle) * length
              return [x, y]
            }

            function bezierCommand(point, i, a) {
                // start control point
                const cps = controlPoint(a[i - 1], a[i - 2], point)

                // end control point
                const cpe = controlPoint(point, a[i - 1], a[i + 1], true)
                return `C ${cps[0]},${cps[1]} ${cpe[0]},${cpe[1]} ${point[0]},${point[1]}`
            }

            //let points = this.resource_obj.stats.recent_job_counts;

            // build the d attributes by looping over the points
            const d = points.reduce((acc, point, i, a) => {
                if(i === 0) {
                    //make sure graph doesn't end too close to the left/right end
                    return "M250,0L250,150L-50,150L-50,0L"+point[0]+","+point[1];
                } else {
                    return acc+' '+ bezierCommand(point, i, a);
                }
            }, '')
            //console.log(d);
            return d;
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
height: 150px;
position: relative;
}
.resource-tags {
float: right; 
font-size: 125%; 
text-transform: uppercase; 
padding: 0px 5px;
overflow: hidden;
}
</style>
