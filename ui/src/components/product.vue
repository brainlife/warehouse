<template>
<div v-if="product">
    <div v-for="(alert, idx) in alerts" :key="idx">
        <b-alert v-if="alert.type == 'error'" variant="danger" show>{{alert.msg}}</b-alert>
        <b-alert v-else-if="alert.type == 'info'" variant="secondary" show>{{alert.msg}}</b-alert>
        <b-alert v-else-if="alert.type == 'warning'" variant="dark" show>{{alert.msg}}</b-alert>
        <b-alert v-else-if="alert.type == 'danger'" variant="danger" show>{{alert.msg}}</b-alert>
        <b-alert v-else-if="alert.type == 'success'" variant="success" show>{{alert.msg}}</b-alert>
        <div v-else>
            <b-alert show variant="danger">Unknown brainlife product type</b-alert>
            <pre v-if="Object.keys(other_product).length != 0">{{JSON.stringify(other_product, null, 4)}}</pre>
        </div>
    </div>
    <b-tabs class="brainlife-tab" v-model="tab" v-if="shouldShowTab">
        <b-tab v-for="(p, $idx) in plots" :title="p.name||$idx" :key="$idx">
            <p v-if="p.desc" style="background-color: white; padding: 5px 10px; margin: 0;"><small>{{p.desc}}</small></p>
            <ExportablePlotly v-if="tab == $idx && p.data" :data="p.data" :layout="p.layout"/>
        </b-tab>
        <b-tab v-for="(p, $idx) in images" :title="p.name||$idx" :key="$idx">
            <p v-if="p.desc"><small>{{p.desc}}</small></p>
            <a :download="'image.'+p.type.split('/')[1]" :href="'data:'+p.type+';base64,'+p.base64">
                <img v-if="p.type.includes('image/')" :src="'data:'+p.type+';base64,'+p.base64" style="max-width: 100%"/>
            </a>
        </b-tab>
    </b-tabs>
</div>
</template>

<script>

import Vue from 'vue'

const alert_types = ["error", "info", "danger", "warning", "success"];

export default {
    props: ['product', 'skipFollow'],

    components: {
        //import Plotly from '@statnett/vue-plotly' //doesn't work with 3d
        //Plotly: ()=>import('vue-plotly').then(m=>m.Plotly) //ugly..?
        ExportablePlotly: ()=>import('@/components/ExportablePlotly')
        //editor: ()=>import('vue2-ace-editor'), 
    },

    data() {
        return {
            config: Vue.config,
            tab: null,
            others: null,
        }
    },

    mounted() {
        this.updateData();
    },

    computed: {
        other_product() {
            let all = Object.assign({}, this.product);
            delete all.brainlife;
            return all;
        },

        alerts() {
            if(!this.product.brainlife) return [];
            let items = this.product.brainlife.filter(p=>alert_types.includes(p.type)); 
            if(this.skipFollow) items = this.filterFollow(items);
            return items;
        },

        plots() {
            if(!this.product.brainlife) return [];
            let items = this.product.brainlife.filter(p=>p.type == 'plotly');
            if(this.skipFollow) items = this.filterFollow(items);
            return items;
        },

        images() {
            if(!this.product.brainlife) return [];
            let items = this.product.brainlife.filter(p=>p.type.startsWith('image/'));
            if(this.skipFollow) items = this.filterFollow(items);
            return items;
        },

        shouldShowTab() {
            if(!this.product.brainlife) return false;
            let items = this.product.brainlife.filter(p=>!alert_types.includes(p.type)); 
            items = this.filterFollow(items);
            return (items.length > 0)
        },
    },

    methods: {
        filterFollow(items) {
            if(!this.skipFollow) return items; 
            return items.filter(item=>!Boolean(item._follow));
        },

        updateData() {
            if(!this.product) return;

            //list "other" graphs
            let others = Object.assign({}, this.product);
            delete others.brainlife;
            if(Object.keys(others).length > 0) {     
               this.others = JSON.stringify(others, null, 4);
            }

            //add svg export button on plotly plots
            if(this.product.brainlife) {
                this.product.brainlife.forEach((p, idx)=>{
                    if(p.type != 'plotly') return;
                    if(p._svg_added) return;
                    p._svg_added = true;
                });
            }
        },
    },

    watch: {
        product(nv, ov) {
            this.updateData();
        },
    },
}

</script>
