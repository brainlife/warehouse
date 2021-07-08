<template>
<div>
    <b>Source</b>
    <v-select v-model="source" :options="sourceOptions"/>
    <b>Measure</b>
    <v-select v-model="measure" :options="measureOptions"/>

    <b>Structure</b>
    <v-select multiple v-model="structures" :options="structureOptions" placeholder="Search structure name to add"/>

    <ExportablePlotly v-if="graphData" :data="graphData" :layout="graphLayout" :watchShallow="false"/>
</div>
</template>

<script>
import Vue from 'vue'
import axios from 'axios'

import { parseCSV, string2hue } from '@/lib'

export default {
    props: [ 'task', 'output_id', 'product' ],
    components: {
        ExportablePlotly: ()=>import('@/components/ExportablePlotly'),
    },
    data() {
        return {
            sourceOptions: [ "cortex", "subcortical", /*"rois", "whole_brain" -- don't work yet*/ ],
            source: null,

            measureOptions: [],
            measure: null,

            structureOptions: [], //available structures to choose from
            structures: [],  //selected structurues

            data: [],
            refdata: null,

            graphData: null,
            graphLayout: null,

            config: Vue.config,
            csv: 'cortex',
        }
    },

    watch: {
        async source() {
            //reload data source and update catalogs
            console.log("loading source", this.source, this.measure);
            const res = await this.$http.get('secondary/'+this.task._id+'/'+this.output_id+'/parc-stats/'+this.source+'.csv');
            this.data = parseCSV(res.data);           

            const sample = this.data[0];
            const ignore = ["parcID", "subjectID", "structureID", "nodeID", "segID", "ROI_name"];
            this.measureOptions = [];
            for(const key in sample) {
                if(ignore.includes(key)) continue;
                this.measureOptions.push(key);
            }
            this.measure = this.measureOptions[0];//pick first one

            //create catalog of structures
            this.structureOptions = [];
            this.data.forEach(rec=>{
                if(rec.structureID && !this.structureOptions.includes(rec.structureID)) this.structureOptions.push(rec.structureID);
                if(rec.ROI_name && !this.structureOptions.includes(rec.ROI_name)) this.structureOptions.push(rec.ROI_name);
            });
            this.structures = this.structureOptions.slice(-3); //select first 3

            this.draw();
        },

        structures() {
            this.draw();
        },
        measure() {
            this.draw();
        },
    },

    mounted() {
        this.source = "cortex";
    },

    methods: {
        async draw() {
            /*
            //subjectID,Total_Brain_volume,Total_Intracranial_volume,Total_Gray_Matter_volume,Total_White_Matter_volume,Left_Hemisphere_Gray_Matter_volume,Right_Hemisphere_Gray_Matter_volume,Left_Hemisphere_White_Matter_volume,Right_Hemisphere_White_Matter_volume,Left_Hemisphere_Mean_Gray_Matter_thickness,Right_Hemisphere_Mean_Gray_Matter_thickness
            //soichi,1245338.0,1554102.356326,510700.772537,490168.0,258217.335363,252483.437174,247827.0,242341.0,2.5156400000000003,2.46113
            res = await this.$http.get('secondary/'+this.task._id+'/'+this.output_id+'/parc-stats/whole_brain.csv');
            const wholeBrain = parseCSV(res.data);           
            */

            //load reference
            //TODO - we might be splitting up the reference into different structures.. if we do, then we should load references that we haven't loaded yet
            //based on this.structures selections
            const refdata = await fetch('https://raw.githubusercontent.com/brainlife/reference/master/neuro/parc-stats/reference.json').then(res=>res.json());

            //add "this data" first (to claim the default blue color!)
            let x = [];
            let y = [];
            this.data.forEach(rec=>{
                if(rec.structureID && !this.structures.includes(rec.structureID)) return;
                /* 
                (roi)
                {
                    "parcID": 72,
                    "subjectID": "soichi",
                    "structureID": "rh_S_temporal_inf",
                    "nodeID": 1,
                    "number_of_vertices": 1502,
                    "surface_area_mm^2": 995,
                    "gray_matter_volume_mm^3": 2012,
                    "average_thickness_mm": 2.4819999999999998,
                    "thickness_stddev_mm": 0.474,
                    "integrated_rectified_mean_curvature_mm^-1": 0.106,
                    "integrated_rectified_gaussian_curvature_mm^-2": 0.018000000000000002,
                    "folding_index": 8,
                    "intrinsic_curvature_index": 1.3
                }
                (cortex)
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
                }gray_matter_volume_mm^3
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
                x.push(rec[this.measure]);
            });
            this.graphData = [];
            this.graphData.push({
                x,
                y,
                orientation: 'h',
                name: "This data",
                type: 'box',
                mode: 'markers',
                /* marker: { color: 'rgb(219, 64, 82)', size: 12, } */
                line: {
                    width: 5,
                },
            });

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

                    line: {
                        width: 1,
                        color: 'hsla('+string2hue(rec.source)+',80%,30%,0.5)',
                    },

                    name: rec.source,
                    /*
                    error_x: {
                        type: 'data', 
                        symmetric: true,
                        array: [],
                    }
                    */
                }
                if(this.structures.includes(rec.structurename)) {
                    const stat = rec[this.measure];
                    if(!stat) {
                        console.log("no", this.measure, "in reference rec", rec);
                    } else {
                        sources[rec.source].y.push(rec.structurename);

                        //we don't have quartile.. so let's approximate
                        const q1 = stat.mean - stat.sd*0.675;
                        const q3 = stat.mean + stat.sd*0.675;
                        //const iqr = q3 - q1;
                        
                        sources[rec.source].lowerfence.push(stat.min);
                        sources[rec.source].upperfence.push(stat.max);

                        //we don't have q1/median/q3.. let's approximate from mean/sd
                        sources[rec.source].q1.push(q1);
                        sources[rec.source].q3.push(q3);
                        sources[rec.source].median.push(stat.mean);

                        /*
                        sources[rec.source].mean.push(stat.mean);
                        sources[rec.source].sd.push(stat.sd);
                        */
                        //sources[rec.source].error_x.array.push(stat.sd);
                    }
                }
            });

            //I can't just reset height.. I guess it's not set to deep: true?
            //https://github.com/David-Desmaisons/vue-plotly/issues/20#issuecomment-854926404
            this.graphLayout = {
                height: 80*this.structures.length+200,
                margin: {
                    l: 175, r: 10, b: 40, t: 10, 
                },
                font: {
                    size: 11,
                    family: "Arial",
                },
                xaxis: {
                    title: {
                        text: this.measure,
                        font: {
                            color: '#999',
                            size: 11,
                        },
                    },
                },
                boxmode: 'group',
            }

            //finally reorg to data
            for(let source in sources) {
                this.graphData.push(sources[source]);
            }

        }
    },
}
</script>

<style scoped>
</style>

