<template>
<div class="appstats" v-if="info">
    <!-- app status is still todo
    <h4>Status</h4>
    <p>
        <statustag status="ok"/>
    </p>
    -->

    <span class="form-header">Total Runs</span>
    <p v-b-tooltip.hover title="Number of time this App was requested.">
        {{info.counts.requested||0}}
    </p>

    <span class="form-header">Users</span>
    <p v-b-tooltip.hover title="Number of unique users who ran this App.">
        {{info.users}}
    </p>

    <div v-if="info.success_rate">
        <span class="form-header">Success Rate</span>
        <p v-b-tooltip.hover title="finished/(failed+finished). Same request could be re-submitted / rerun.">
            <svg width="50px" height="50px">
                <circle :r="100/(2*Math.PI)" cx="25" cy="25" fill="transparent" stroke="#dc3545" stroke-width="9"/>
                <circle :r="100/(2*Math.PI)" cx="25" cy="25" fill="transparent" stroke="#28a745" stroke-width="10" :stroke-dasharray="info.success_rate+' '+(100-info.success_rate)" stroke-dashoffset="25"/>
            </svg>
            {{info.success_rate.toFixed(1)}}%
            <!--
                <span :class="success_rate_color" v-if="info.success_rate">{{info.success_rate.toFixed(1)}}%</span>
            -->
        </p>
    </div>

    <span class="form-header">Avg. Runtime</span>
    <p>
        {{Math.round(info.runtime_mean/(1000*60))}} <small style="opacity: 0.8">(&plusmn;{{Math.round(info.runtime_std/(1000*60))}})</small> mins
    </p>
</div>
</template>

<script>
import Vue from 'vue'
import statustag from '@/components/statustag'

export default {
    props: ['info'],
    components: { statustag },
    data() {
        return {}
    },

    computed: {
        success_rate_color: function() {
            if(this.info.success_rate < 50) return "text-danger"; 
            if(this.info.success_rate < 80) return "text-warning"; 
            if(this.info.success_rate < 95) return "text-secondary"; 
            return "text-success"; 
        },
    },
}
</script>

<style scoped>
h4 {
font-weight: bold;
font-size: 13px;
}
.appstats p {
opacity: 0.8;
}
</style>
