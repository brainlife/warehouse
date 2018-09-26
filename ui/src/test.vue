<template>
<div>
    <h1>Test</h1>
    <v-select :options="['aaa', 'bbb']" style="margin: 20px;"/>
    <!--
    <b-form>
        <b-form-checkbox id="checkbox1"
                         v-model="status"
                         value="accepted"
                         unchecked-value="not_accepted">
          I accept the terms and use
        </b-form-checkbox>
        <div class='altmetric-embed' data-badge-type='donut' data-doi="10.1038/nature.2012.9872"></div>
    </b-form>
    <vue-plotly :data="data" :layout="layout"/>
    -->
    <!--<div ref="plot"/>-->
</div>
</template>

<script>
import Vue from 'vue'
import VuePlotly from '@statnett/vue-plotly'
//import Plotly from 'plotly.js/dist/plotly.min.js' //works.. but slow?

//import Plotly from 'plotly.js' //doesn't work

export default {
    components: {
        //Plotly, 
        VuePlotly,
    },

    data() {
        return {
            data: [{
               z: [1,2,3], 
                type: 'surface',
            }],
            layout: {},
        }
    },
    mounted: function() {
        //Plotly.newPlot(this.$refs.plot, [data_z1, data_z2, data_z3], layout);
    },

    methods: {
        handleClick: function() {
            alert("yp");
        }
    }
}
</script>
