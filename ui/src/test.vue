<template>
<div>
    <h1>Test</h1>
    <v-select :options="['aaa', 'bbb']" style="margin: 20px;"/>
</div>
</template>

<script>
import Vue from 'vue'

export default {
    components: {
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
