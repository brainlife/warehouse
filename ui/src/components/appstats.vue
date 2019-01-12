<template>
<div class="appstats" v-if="info">
    <p>
        <!--
        <span v-b-tooltip.hover="'Number of time this App was requested by all users.'" style="margin-right: 5px;">
            <icon name="paper-plane"/>&nbsp;{{info.counts.requested||0}}
        </span>
        -->
        <img :src="config.api+'/app/'+appid+'/badge'" @click="show_badge_url('/app/'+appid+'/badge')" class="clickable"/>
    </p>
    <!--
    <p>
        <span v-b-tooltip.hover title="Number of unique users who ran this App." style="margin-right: 5px;">
            <icon name="user"/>&nbsp;
            {{info.users}}
        </span>
    </p>
    -->
    <div style="border: 1px solid #eee; background-color: white; padding: 10px 0px; max-width: 200px; text-align: center;">
        <p v-if="info.success_rate" v-b-tooltip.hover.d1000.right
            title="finished/(failed+finished). Same request could be re-submitted / rerun.">
            <span style="opacity: 0.5">Success Rate</span>
            <br>
            <svg width="70" height="70">
                <circle :r="140/(2*Math.PI)" cx="35" cy="35" fill="transparent" stroke="#666" stroke-width="15"/>
                <circle :r="140/(2*Math.PI)" cx="35" cy="35" fill="transparent" stroke="#28a745" stroke-width="15" 
                    :stroke-dasharray="info.success_rate*(140/100)+' '+(100-info.success_rate)*(140/100)" stroke-dashoffset="-105"/>
            </svg>
            <br>
            <b>{{info.success_rate.toFixed(1)}}%</b>
            <!--
                <span :class="success_rate_color" v-if="info.success_rate">{{info.success_rate.toFixed(1)}}%</span>
            -->
        </p>
        <hr>
        <p>
            <span style="opacity: 0.5">Average Runtime</span>
            <br>
            <b>{{Math.round(info.runtime_mean/(1000*60))}} <small style="opacity: 0.8">(&plusmn;{{Math.round(info.runtime_std/(1000*60))}})</small> mins</b>
        </p>
    </div>

</div>
</template>

<script>
import Vue from 'vue'
import statustag from '@/components/statustag'

export default {
    props: ['info', 'appid'],
    components: { statustag },
    data() {
        return {
            config: Vue.config,
        }
    },

    computed: {

        success_rate_color() {
            if(this.info.success_rate < 50) return "text-danger"; 
            if(this.info.success_rate < 80) return "text-warning"; 
            if(this.info.success_rate < 95) return "text-secondary"; 
            return "text-success"; 
        },

        show_badge_url(badge) {
            let badge_url = this.config.api+"/app/"+this.appid+"/badge";
            prompt("Markdown Content", "[![Brainlife]("+badge_url+")]("+document.location+")");
        }
    },
}
</script>

<style scoped>
h4 {
font-weight: bold;
font-size: 13px;
}
</style>
