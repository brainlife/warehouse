<template>
<div class="resource" 
    v-if="resource_obj" 
    @click="open" 
    :class="{'resource-inactive': !resource_obj.active}" 
    :title="resource_obj.config.desc">

    <b-row>
        <b-col>
            <p style="margin-bottom: 5px">
                <b-badge v-if="!resource.gids || resource.gids.length == 0" variant="secondary" title="Private resource that's not shared with anyone.">
                    <icon name="lock" scale="0.8"/>
                </b-badge>
                <span style="position: relative; top: -2px">
                    <b-badge v-if="!resource_obj.active" variant="secondary">Inactive</b-badge>
                    <b-badge v-if="resource_obj.gids && resource_obj.gids.includes(1)" variant="success">Public</b-badge>
                </span>
                <b>{{resource_obj.name}}</b>
            </p>
            <p class="desc">
                <small>{{trim(resource_obj.config.desc)}}</small>
            </p>
            <p v-if="resource_obj.user_id">
                <contact :id="resource_obj.user_id"/>
            </p>
            <p style="opacity: 0.8;" v-if="resource_obj.stats">
                <b-badge pill class="bigpill" v-if="resource_obj.stats.services">
                    <icon name="th-large"/>&nbsp;
                    {{Object.keys(resource_obj.stats.services).length}} <span style="opacity: 0.5">Apps</span>
                </b-badge>
                <b-badge pill class="bigpill" v-if="resource_obj.stats.total">
                    <icon name="check"/>&nbsp;
                    {{resource_obj.stats.total.finished|formatNumber}} <span style="opacity: 0.5">Finished</span>
                </b-badge>
                <!--
                <b-badge pill class="bigpill">
                    <icon name="th-large"/>&nbsp;
                    {{resource_obj.stats.total.running}} Running
                </b-badge>
                -->
                <b-badge pill class="bigpill" v-if="resource_obj.stats.total">
                    <icon name="exclamation-circle"/>&nbsp;
                    {{resource_obj.stats.total.failed|formatNumber}} <span style="opacity: 0.5">Failed</span>
                </b-badge>
            </p>
        </b-col>

        <b-col cols="1">
            <!--
            <span :title="resource_obj.status">
                <icon v-if="resource_obj.status == 'ok'" name="check-circle" style="color: #28a745;"/>
                <icon v-else name="exclamation-circle" style="color: #dc3545"/>
            </span>
            -->
            <statustag :status="resource_obj.status"/>
        </b-col>

        <b-col cols="3" v-if="usage_path">
            <!--small chart to show the recent execution-->
            <div style="position: relative; height: 100px;">
                <div style="position: absolute; top: 0">
                    <span>
                        <small style="opacity: 0.7;">RUNNING</small>
                        <b style="font-size: 125%;">{{running}}</b>
                    </span>
                    <span style="opacity: 0.7">
                        / {{resource_obj.config.maxtask}}      
                        <small style="opacity: 0.5; text-transform: uppercase;">max</small>         
                    </span>
                    <br>
                </div>
                <small style="float: right; opacity: 0.3; z-index: 1; position: absolute; bottom: -8px; right: 10px;">24h</small>
                <svg viewBox="0 0 200 100" style="position: absolute; bottom: 10px; height: 50px; width: 100%; left: 0;" 
                    preserveAspectRatio="none">
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="20%" style="stop-color:#2693ff;stop-opacity:0.2" />
                        <stop offset="60%" style="stop-color:#00f;stop-opacity:0.0" />
                    </linearGradient>
                    <path :d="usage_path" fill="url(#grad1)" stroke="rgba(26,93,255,0.7)" stroke-width="1"/>
                </svg>
            </div>
        </b-col>
        <b-col cols="1">
            <b-img v-if="resource_obj.avatar" :src="resource_obj.avatar" fluid/>
        </b-col>
    </b-row>
</div>
</template>

<script>
import Vue from 'vue'

import resource_cache from '@/mixins/resource_cache'
import statustag from '@/components/statustag'

export default {
    mixins: [ resource_cache ],
    components: {
        statustag,
        contact: ()=>import('@/components/contact'),
    },
    props: {
        id: String, //resource id

        //things you should populate
        //name config.hostname config.desc stats status avatar active
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
            //app passes resource object from resource/best api - which contains somewhat abbreviated resource info
            if(this.resource_obj.detail && this.resource_obj.detail.running) return this.resource_obj.detail.running;

            //for full resource detail.. use the last reported number from grafana
            //TODO - the count might be different from the amaretti resource/tasks/<resource_id> api count.. but.. what can I do?
            if(this.resource_obj.stats && this.resource_obj.stats.recent_job_counts) {
                let recs = this.resource_obj.stats.recent_job_counts; 
                if(recs.length > 0) return recs[recs.length-1][1];
            } 
            return 0;
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
            raw_points.forEach(point=>{
                let t = point[0] - min_time;
                t = t / range_time * 200; 
                let v = point[1];
                
                //if(Vue.config.debug) v += Math.random()*4;
                
                v = 90 - v / this.resource_obj.config.maxtask * 75; //don't let it touch the top of the graph
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
        trim(s) {
            if(!s) return;
            if(s.length < 400) return s;
            return s.substring(0, 400)+"...";
        },
    },
}
</script>

<style scoped>
.desc {
    line-height: 180%;
    margin-bottom: 10px;
}
.alert {
    padding: 2px 5px;
}
.resource {
    padding: 10px 15px;
    background-color: white;
    cursor: pointer;
    transition: 0.3s all;
}
.resource-tags {
    float: left;
    font-size: 125%; 
    padding: 10px;
    text-transform: uppercase; 
    overflow: hidden;
}
.resource.resource-inactive {
    opacity: 0.5;
    background-color: #f6f6f6;
    color: #666;
}
.bigpill {
    position: relative;
    left: -10px;
}
p:last-child {
    margin-bottom: 0;
}
</style>
