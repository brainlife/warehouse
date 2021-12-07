
<template>
<Plotly 
    :data="data" 
    :layout="_layout" 
    :toImageButtonOptions="toImageButtonOptions" 
    :modeBarButtonsToAdd="modeBarButtonsToAdd" 
    ref="plotly" 
    :autoResize="true" 
    :watchShallow="watchShallow"/>
</template>

<script>

import Vue from 'vue'

export default {
    props: ['data', 'layout', 'watchShallow'],
    components: {
        Plotly: ()=>import('vue-plotly').then(m=>m.Plotly) //ugly..?
    },
    data() {
        return {
            modeBarButtonsToAdd: [],
            toImageButtonOptions: {
                width: 1200,
                height: 800,
            }
        }
    },
    computed: {
        //add a bit of extra layout options (doesn't work?)
        _layout() {
            return Object.assign({}, this.layout, {
                font: Vue.config.plotly.font, //we want to show a bit smaller font
            });
        },
    },
    created() {
        this.modeBarButtonsToAdd.push({
            name: 'SVG',

            //TODO - I should find a better logo for svg export
            icon: {
                width: 1792,
                ascent: 1792,
                descent: 0,
                path: 'M1344 1344q0-26-19-45t-45-19-45 19-19 45 19 45 45 19 45-19 19-45zm256 0q0-26-19-45t-45-19-45 19-19 45 19 45 45 19 45-19 19-45zm128-224v320q0 40-28 68t-68 28h-1472q-40 0-68-28t-28-68v-320q0-40 28-68t68-28h465l135 136q58 56 136 56t136-56l136-136h464q40 0 68 28t28 68zm-325-569q17 41-14 70l-448 448q-18 19-45 19t-45-19l-448-448q-31-29-14-70 17-39 59-39h256v-448q0-26 19-45t45-19h256q26 0 45 19t19 45v448h256q42 0 59 39z',
            },
            click: ()=>{
                let plot = this.$refs.plotly;
                plot.downloadImage({format: 'svg'});
            }
        });
    },
}
</script>
