<template>
<div v-if="product">
    <div v-if="product.brainlife" v-for="item in product.brainlife">
        <vue-plotly v-if="item.type == 'plotly'" :data="item.data" :layout="item.layout" :options="item.options"/>
        <b-alert v-else-if="item.type == 'error'" show variant="danger">{{item.msg}}</b-alert>
        <b-alert v-else-if="item.type == 'info'" variant="secondary" show>{{item.msg}}</b-alert>
        <b-alert v-else-if="item.type == 'danger'" variant="danger" show>{{item.msg}}</b-alert>
        <b-alert v-else-if="item.type == 'warning'" variant="warning" show>{{item.msg}}</b-alert>
    </div>
    <pre v-if="Object.keys(other_product).length != 0" v-highlightjs="JSON.stringify(other_product, null, 4)" style="max-height: 150px;"><code class="json hljs"></code></pre>
</div>
</template>

<script>

import Vue from 'vue'
import VuePlotly from '@statnett/vue-plotly'

export default {
    props: ['product'],
    computed: {
        other_product: function() {
            let all = Object.assign({}, this.product);
            delete all.brainlife; 
            return all;
        },
    },
    components: {
        VuePlotly,
    },
    data() {
        return {
            config: Vue.config,
        }
    },
}

</script>
