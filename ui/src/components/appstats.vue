<template>
<div class="appstats" v-if="info">
    <!-- app status is still todo
    <h4>Status</h4>
    <p>
        <statustag status="ok"/>
    </p>
    -->
    <p>
        <span v-b-tooltip.hover="'Number of time this App was requested by all users.'" style="margin-right: 5px;">
            <icon name="paper-plane"/>&nbsp;
            {{info.counts.requested||0}}
        </span>
    </p>
    <p>
        <span v-b-tooltip.hover title="Number of unique users who ran this App." style="margin-right: 5px;">
            <icon name="user"/>&nbsp;
            {{info.users}}
        </span>
    </p>
    <p>
        <!--<span class="form-header">Avg. Runtime</span>-->
        <span title="Avg. Runtime">
            <icon name="clock"/>
            {{Math.round(info.runtime_mean/(1000*60))}} <small style="opacity: 0.8">(&plusmn;{{Math.round(info.runtime_std/(1000*60))}})</small> mins
        </span>
    </p>
    <p>
        <span v-if="info.success_rate" style="position: relative" v-b-tooltip.hover title="Success Rate. finished/(failed+finished). Same request could be re-submitted / rerun.">
            <svg width="20" height="20">
                <circle :r="40/(2*Math.PI)" cx="10" cy="10" fill="transparent" stroke="#dc3545" stroke-width="4"/>
                <circle :r="40/(2*Math.PI)" cx="10" cy="10" fill="transparent" stroke="#28a745" stroke-width="4" :stroke-dasharray="info.success_rate*(40/100)+' '+(100-info.success_rate)*(40/100)" stroke-dashoffset="0"/>
            </svg>
            {{info.success_rate.toFixed(1)}}%
            <!--
                <span :class="success_rate_color" v-if="info.success_rate">{{info.success_rate.toFixed(1)}}%</span>
            -->
        </span>
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
</style>
