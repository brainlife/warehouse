<template>
<div>
    <!-- no secondary output for wmc yet.. -->

    <!-- metadata can be accessed via product.meta-->
    <!--
    {{product.meta}}
    -->
    <Plotly :data="data" :layout="layout" :autoResize="true"/>
    <v-select :options="['cortex', 'lh.cortex', 'rh.cortex', 'rois', 'subcortical', 'whole_brain']" v-model="csv"></v-select>
</div>
</template>

<script>
import Vue from 'vue'
import axios from 'axios'

import { Plotly } from 'vue-plotly'
import { parseCSV } from '@/lib'

export default {
    props: [
        'task', 
        'output', 
        'product'
    ],
    components: {
        Plotly
    },
    data() {
        return {
            data: [],
            layout: {
                height: 4000,
                margin: {
                    l: 175, 
                    //r: 10, b: 40, t: 30, pad: 0 
                },
                boxmode: 'group',
            },
            config: Vue.config,
            csv: 'cortex',
        }
    },
    async mounted() {
        let res = await this.$http.get('secondary/'+this.task._id+'/'+this.output.id+'/parc-stats/cortex.csv');
        const cortex = parseCSV(res.data);           

        res = await this.$http.get('secondary/'+this.task._id+'/'+this.output.id+'/parc-stats/rois.csv');
        const rois = parseCSV(res.data);           

        res = await this.$http.get('secondary/'+this.task._id+'/'+this.output.id+'/parc-stats/subcortical.csv');
        const subcortical = parseCSV(res.data);           

        //load reference
        const refdata = await fetch('https://raw.githubusercontent.com/brainlife/reference/master/neuro/parc-stats/reference.json').then(res=>res.json());
        console.dir(refdata);

        let x = [];
        let y = [];
        const measure = "gray_matter_volume_mm^3"; 
        subcortical.forEach(rec=>{
            /* sample (cortex)
            {
                average_thickness_mm: 2.7
                folding_index: 5
                gray_matter_volume_mm^3: 1120
                integrated_rectified_gaussian_curvature_mm^-2: 0.023
                integrated_rectified_mean_curvature_mm^-1: 0.113
                intrinsic_curvature_index: 0.6
                nodeID: 1
                number_of_vertices: 641
                parcID: 33
                structureID: "rh_transversetemporal"
                subjectID: "soichi"
                surface_area_mm^2: 391
                thickness_stddev_mm: 0.371
            }
            */
            /* sample (subcortical)
                gray_matter_volume_mm^3: 0
                nodeID: 1
                number_of_voxels: 0
                segID: 81
                structureID: "Left-non-WM-hypointensities"
                subjectID: "soichi"
            */
            y.push(rec.structureID);
            x.push(rec[measure]);
        });
        this.data.push({
            x,
            y,
            orientation: 'h',
            name: "This data",
            mode: 'markers',
            /* marker: { color: 'rgb(219, 64, 82)', size: 12, } */
        });

        //draw references
        /*
        x = [];
        y = [];
        refdata.forEach(rec=>{
            if(y.includes(rec.structurename)) {
                y.push(rec.structureID);
                x.push(rec.structureID);
            }
        });
        */
        //boxplots from summary stats
        //https://github.com/plotly/plotly.js/pull/4432
        //group reference into each source
        const sources = {};
        refdata.forEach(rec=>{
            //init
            if(!sources[rec.source]) sources[rec.source] = {
                //x: [],
                type: 'box',
                y: [],
                lowerfence: [],
                upperfence: [],
                q1: [],
                mean: [],
                sd: [],
                median: [],
                q3: [],

                name: rec.source,
                /*
                error_x: {
                    type: 'data', 
                    symmetric: true,
                    array: [],
                }
                */
            }
            if(y.includes(rec.structurename)) {
                const stat = rec[measure];
                //sources[rec.source].x.push(stat.mean);
                sources[rec.source].lowerfence.push(stat.min);
                sources[rec.source].q1.push(stat.mean - stat.sd/2);
                sources[rec.source].median.push(stat.mean);
                sources[rec.source].mean.push(stat.mean);
                sources[rec.source].sd.push(stat.sd);
                sources[rec.source].q3.push(stat.mean + stat.sd/2);
                sources[rec.source].upperfence.push(stat.max);

                sources[rec.source].y.push(rec.structurename);
                //sources[rec.source].error_x.array.push(stat.sd);
            }
        });

        //add to data
        console.dir(sources);
        for(let source in sources) {
            this.data.push(sources[source]);
        }
    },
}
</script>

<style scoped>
</style>

