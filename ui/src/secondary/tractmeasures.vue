<template>
<div>
    <div v-if="profileGraphs">
        <Plotly v-if="structure && measure" :data="profileGraphs[structure+'.'+measure.id].data" :layout="profileGraphs[structure+'.'+measure.id].layout" :autoResize="true"/>
        <br>
        <b-row>
            <b-col cols="2">
                <b>Measure</b>
            </b-col>
            <b-col cols="4">
                <v-select :options="measures" v-model="measure"></v-select>
            </b-col>
            <b-col cols="2">
                <b>Structure</b>
            </b-col>
            <b-col cols="4">
                <v-select :options="structureIDs" v-model="structure"></v-select>
            </b-col>
        </b-row>
    </div>
</div>
</template>

<script>
import Vue from 'vue'
import axios from 'axios'
import { Plotly } from 'vue-plotly'

import { parseCSV } from '@/lib'

export default {
    props: ['task', 'output', 'product'],
    components: {
        Plotly
    },
    data() {
        return {

            structureIDs: [],
            structure: null, //forcepsMajor, etc..

            measures: [],
            measure: null, //fa, etc..

            profileGraphs: null, 
            macroGraphs: null, //TODO..

            config: Vue.config,
        }
    },
    methods: {
        hashCode(s) {
            let sum = 0;
            for (let i = 0; i < s.length; i++) {
                sum += s.charCodeAt(i)*1050;
            }
            return sum%360;
        },

        async generateProfileGraphs() {
            try{
                //load the tractmeasures.csv
                let data = null;
                try {
                    const res = await this.$http.get('secondary/'+this.task._id+'/'+this.output.id+'/tractmeasures.csv');
                    data = parseCSV(res.data);          
                } catch (err) {
                    console.log("trying old filename");
                    const res = await this.$http.get('secondary/'+this.task._id+'/'+this.output.id+'/output_FiberStats.csv');
                    data = parseCSV(res.data);          
                }

                //load reference
                const refdata = await fetch('https://raw.githubusercontent.com/brainlife/validator-neuro-tractmeasures/master/reference/tractmeasures_references_v1.json').then(res=>res.json());
                const refNodeCount = 50;

                const labels = {
                    //tensor 
                    fa: {
                        title: "Fractional Anisotropy (FA)",
                        unit: "normalized fraction of anisotropic component",
                    },
                    ad: {
                        title: "Axial Diffusivity (AD)",
                        unit: "microm^2/msec",
                    },
                    md: {
                        title: "Mean Diffusivity (MD)",
                        unit: "microm^2/msec",
                    },
                    rd: {
                        title: "Radial Diffusivity (RD)",
                        unit: "microm^2/msec",
                    },
                    
                    //noddi
                    ndi: {
                        title: "Neurite Density Index (NDI)",
                        unit: "intra-cellular volume fraction",
                    },
                    isovf: {
                        title: "Isotropic Volume Fraction (ISOVF)",
                        unit: "extra-cellular volume fraction",
                    },
                    odi: {
                        title: "Orientation Dispersion Index (ODI)",
                        unit: "relative dispersion of fiber orientation",
                    },

                    //dki
                    ga: {
                        title: "Geodesic Anisotropy (GA)",
                        unit: "normalized fraction of geodesic component",
                    },
                    mk: {
                        title: "Mean Kurtosis (MK)",
                        unit: "microm^2/msec",
                    },
                    ak: {
                        title: "Axial Kurtosis (MK)",
                        unit: "microm^2/msec",
                    },
                    rk: {
                        title: "Radial Kurtosis (RK)",
                        unit: "microm^2/msec",
                    },
                }

                //create color for each reference data
                const colors = {};
                refdata.forEach(ref=>{
                    if(!colors[ref.source]) {
                        colors[ref.source] = this.hashCode(ref.source);
                    }
                });

                this.measures = [];
                for(let key in data[0]) {
                    if(["subjectID", "nodeID", "structureID"].includes(key)) continue;
                    this.measures.push({id: key, label: labels[key].title});
                }

                //split into different structures
                const structures = {};
                this.profileGraphs = {};
                data.forEach(row=>{
                    if(!structures[row.structureID]) {
                        //initialize with empty arrays
                        structures[row.structureID] = {x: []};
                        this.measures.forEach(measure=>{
                            structures[row.structureID][measure.id] = [];
                        });
                    }
                    structures[row.structureID].x.push(row.nodeID); //nodeIS starts at 1
                    this.measures.forEach(measure=>{
                        structures[row.structureID][measure.id].push(row[measure.id]);
                    });
                });
                this.structureIDs = Object.keys(structures);

                //create graph for each measure for each structure
                for(const structureID in structures) {
                    this.measures.forEach(measure=>{

                        const data = [];
                        data.push({
                            name: "This Data",
                            x: structures[structureID].x,
                            y: structures[structureID][measure.id],
                        });

                        //find reference
                        refdata.forEach(ref=>{
                            const refMean = ref[measure.id].mean;
                            const refSD = ref[measure.id].sd;

                            if(ref.structurename == structureID) {
                                const sampleNodeCount = structures[structureID].x.length;
                                const step = sampleNodeCount/refNodeCount;
                                const x = [];
                                for(let n = 0;n < refNodeCount; n++) {
                                    x.push(sampleNodeCount/refNodeCount*n);
                                }
                                const xcopy = [...x];
                                const y = [];
                                const yrev = [];
                                for(let i = 0;i < refMean.length;++i) {
                                    y.push(refMean[i]+refSD[i]);
                                    yrev.push(refMean[i]-refSD[i]);
                                }

                                //mean
                                data.push({
                                    name: ref.source,
                                    x, y: refMean,
                                    line: {
                                        color: 'hsla('+colors[ref.source]+',80%,30%,0.5)',
                                        width: 1.5,
                                    }
                                });

                                //sdev area
                                data.push({
                                    name: ref.source+" sdev",
                                    showlegend: false,
                                    fill: "tozerox",
                                    fillcolor: 'hsla('+colors[ref.source]+',80%,30%,0.2)',
                                    line: {
                                        width: 0,
                                    },
                                    x: [...x, ...xcopy.reverse()], 
                                    y: [...y, ...yrev.reverse()],
                                })
                            }
                        });

                        const layout = {
                            //showlegend: false,
                            margin: {
                                l: 40, r: 10, b: 40, t: 30, pad: 0 
                            },
                            xaxis: {
                                title: {
                                    text: "Node Position",
                                    font: {
                                        color: '#999',
                                    },
                                    size: 11,
                                },
                            },
                            yaxis: {
                                title: {
                                    text: labels[measure.id].unit,
                                    font: {
                                        color: '#999',
                                        size: 11,
                                    },
                                },
                            },
                            //title: labels[measure.id].title,
                            height: 300,
                        }
                        
                        this.profileGraphs[structureID+"."+measure.id] = {data, layout};
                    });
                }

                //preselect the first one
                this.structure = this.structureIDs[0];
                this.measure = this.measures[0]; 
            } catch(err) {
                console.log("failed to load csv / ref");
                console.log(err);
            }
        }
    },

    mounted() {
        if(this.output.datatype_tags.includes("profiles")) this.generateProfileGraphs();
    },
}
</script>

<style scoped>
</style>

