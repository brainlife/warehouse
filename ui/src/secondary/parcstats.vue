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

            drawing: false,

            config: Vue.config,
        }
    },

    watch: {
        async source() {
            //reload data source and update catalogs
            const res = await this.$http.get('secondary/'+this.task._id+'/'+this.output_id+'/parc-stats/'+this.source+'.csv');
            this.data = parseCSV(res.data);           
            console.dir(this.data);

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
                console.log(rec.structureID);
                if(rec.structureID && !this.structureOptions.includes(rec.structureID)) this.structureOptions.push(rec.structureID);
                if(rec.ROI_name && !this.structureOptions.includes(rec.ROI_name)) this.structureOptions.push(rec.ROI_name);
            });
            this.structures = this.structureOptions.slice(-3); //select first 3

            this.draw();
        },

        structures(v, ov) {
            this.draw();
        },
        measure(v, ov) {
            this.draw();
        },
    },

    mounted() {
        this.source = "cortex";
    },

    methods: {
        async draw() {
            if(this.drawing) return;
            this.drawing = true;
            
            this.graphData = [];

            //add "this data" first (to claim the default blue color!)
            let x = [];
            let y = [];
            this.data.forEach(rec=>{
                if(rec.structureID && !this.structures.includes(rec.structureID)) return;
                y.push(rec.structureID);
                x.push(rec[this.measure]);
            });
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

            //load reference
            //TODO - we might be splitting up the reference into different structures.. if we do, then we should load references that we haven't loaded yet
            //based on this.structures selections
            //const refdata = await fetch('https://raw.githubusercontent.com/brainlife/reference/master/neuro/parc-stats/old/reference.json').then(res=>res.json());

            //boxplots from summary stats
            //https://github.com/plotly/plotly.js/pull/4432
            //group reference into each source
            const sources = {};
            for(let i = 0;i < this.structures.length; ++i) {
                const structure = this.structures[i];
                try {
                    //come up with refrence json url
                    let url = "https://raw.githubusercontent.com/brainlife/reference/master/neuro/parc-stats/";
                    switch(this.source) {
                    case "cortex":
                        url += "cortical";
                        break;
                    case "subcortical":
                        url += "subcortical";
                        break;
                    default:
                        throw "unknow source:"+this.source;
                    }
                    url +='/'+structure+'.json';

                    //create plotly graph
                    const refdata = await fetch(url).then(res=>res.json());
                    refdata.forEach(rec=>{
                        if(!sources[rec.source]) sources[rec.source] = {x: [], y: []};

                        const measureFieldOverride = {
                            //"number_of_voxels": "number_of_voxels",
                            "gray_matter_volume_mm^3": "volume",
                        }
                        let statField = measureFieldOverride[this.measure];
                        if(!statField) statField = this.measure; //assume it's the same name
                        const stat = rec[statField];
                        if(!stat) {
                            console.log("no", this.measure, statField, "in reference rec", rec);
                        } else {
                            stat.data.forEach(v=>{
                                sources[rec.source].x.push(v);
                                sources[rec.source].y.push(structure);
                            });
                        }
                    });
                } catch(err) {
                    console.error("couldn't find / mulformed json", this.source, structure);
                }
            }

            //finally reorg to data
            for(let source in sources) {
                const s = sources[source];
                this.graphData.push({
                    x: s.x, //values
                    y: s.y, //group ids
                    orientation: 'h',
                    type: 'box',
                    /*
                    line: {
                        width: 1
                    },
                    */
                    marker: {
                        color: 'hsla('+string2hue(source)+',80%,30%,0.2)',
                    },
                    name: source+' ('+s.x.length+')',
                });
            }

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
            this.drawing = false;
        }
    },
}
</script>


