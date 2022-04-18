<template>
<div>
    <small v-if="!mode">Loading..</small>
    <small v-if="mode == 'unknown'">Unknown datatype tag {{datatype_tags}}. It should be set to either macro or profiles</small>
    <div v-if="mode == 'profiles'">
        <ExportablePlotly v-if="profileGraph" :data="profileGraph" :layout="profileLayout"/>
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

    <div v-if="mode == 'macro'">
        <b>Measure</b>
        <v-select :options="measures" v-model="measure"></v-select>

        <b>Structures</b>
        <v-select multiple v-model="structures" :options="structureOptions" placeholder="Search structure name to add"/>
        <ExportablePlotly v-if="macroGraph" :data="macroGraph" :layout="macroLayout" :watchShallow="false"/>
    </div>
</div>
</template>

<script>
import Vue from 'vue'
import axios from 'axios'

import { parseCSV, string2hue } from '@/lib'

export default {
    props: ['task', 'output_id', 'datatype_tags', 'product'],
    components: {
        ExportablePlotly: ()=>import('@/components/ExportablePlotly'),
    },
    data() {
        return {
            mode: null,
            data: null, //from tractmeasure.csv

            measures: [], //selectable measures
            measure: null, //fa, etc..

            //reference
            //refdata: null,
            refNodeCount: 50,

            //for <profiles>
            profileGraph: null,
            profileLayout: null,
            structure: null, //forcepsMajor, etc..

            //for <macro>
            macroGraph: null, 
            macroLayout: null,
            structures: null,

            labels: {
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

                //macro
                volume: {
                    title: "Volume",
                    unit: "mm^3",
                },
                StreamlineCount: {
                    title: "Streamline Counts",
                    //unit: "count",
                },
                averageStreamlineLength: {
                    title: "Avg Streamline Length",
                    unit: "mm",
                },
            },

            config: Vue.config,
        }
    },
    methods: {

        async drawProfiles() {
            //load reference for selected structure
            const refdata = await fetch('https://raw.githubusercontent.com/brainlife/reference/master/neuro/tractmeasures/'+this.structure+'.json').then(res=>res.json());

            this.profileGraph = [];
            this.profileGraph.push({
                name: "This Data",
                x: this.structures[this.structure].x,
                y: this.structures[this.structure][this.measure.id],
            });

            refdata.forEach(ref=>{
                if(!ref[this.measure.id]) return; //some ref doesn't have all measures
                const refMean = ref[this.measure.id].mean;
                const refSD = ref[this.measure.id].sd;
                    const sampleNodeCount = this.structures[this.structure].x.length;
                    const x = [];
                    for(let n = 0;n < this.refNodeCount; n++) {
                        x.push(sampleNodeCount/this.refNodeCount*n);
                    }
                    const xcopy = [...x];
                    const y = [];
                    const yrev = [];
                    for(let i = 0;i < refMean.length;++i) {
                        y.push(refMean[i]+refSD[i]);
                        yrev.push(refMean[i]-refSD[i]);
                    }

                    //mean
                    this.profileGraph.push({
                        name: ref.source,
                        x, y: refMean,
                        line: {
                            color: 'hsla('+string2hue(ref.source)+',80%,30%,0.5)',
                            width: 1.5,
                        }
                    });

                    //sdev area
                    this.profileGraph.push({
                        name: ref.source+" sdev",
                        showlegend: false,
                        fill: "tozerox",
                        fillcolor: 'hsla('+string2hue(ref.source)+',80%,30%,0.2)',
                        line: {
                            width: 0,
                        },
                        x: [...x, ...xcopy.reverse()], 
                        y: [...y, ...yrev.reverse()],
                    })
            });

            this.profileLayout = {
                //showlegend: false,
                margin: {
                    l: 40, r: 10, b: 40, t: 30, pad: 0 
                },
                xaxis: {
                    title: {
                        text: "Node Position",
                        font: {
                            color: '#999',
                            size: 11,
                        },
                    },
                },
                yaxis: {
                    title: {
                        text: this.labels[this.measure.id].unit,
                        font: {
                            color: '#999',
                            size: 11,
                        },
                    },
                },
                height: 300,
            }
        }, 

        async drawMacro() {
            this.macroGraph = [];

            //create totalcount for streamlinecount proportion
            const totalStreamlineCount = this.data.filter(v=>!!v.StreamlineCount).reduce((a,v)=>a+v.StreamlineCount, 0);
            
            //add "this data" first (to claim the default blue color!)
            let x = []; //value
            let y = []; //structure name
            for(let i = 0; i < this.data.length; ++i) {
                const rec = this.data[i];
                const id = rec.TractName || rec.structureID;
                if(!id) continue;
                if(!this.structures.includes(id)) continue;

                let v = rec[this.measure.id];
                if(this.measure.id == "StreamlineCountProportion") {
                    v = rec.StreamlineCount / totalStreamlineCount;
                }
                x.push(v);
                y.push(id);
            }
            this.macroGraph.push({
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
            const sources = {};
            for(let i = 0;i < this.structures.length; ++i) {
                //.forEach(async structure=>{
                const structure = this.structures[i];
                const refdata = await fetch('https://raw.githubusercontent.com/brainlife/reference/master/neuro/tractmeasures/'+structure+'.json').then(res=>res.json());
                refdata.forEach(ref=>{
                    if(!sources[ref.source]) sources[ref.source] = {x: [], y: []};
                    if(this.measure.id == "StreamlineCountProportion") {
                        ref.StreamlineCount.data.forEach(v=>{
                            sources[ref.source].x.push(v/ref.TotalStreamlineCount);
                            sources[ref.source].y.push(structure);
                        })
                    } else {
                        ref[this.measure.id].data.forEach(v=>{
                            sources[ref.source].x.push(v);
                            sources[ref.source].y.push(structure);
                        })
                    }
                });
            }
            for(let source in sources) {
                const s = sources[source];
                this.macroGraph.push({
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
            this.macroLayout = {
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
                        text: this.measure.title+(this.measure.unit?" ("+ this.measure.unit+")":''),
                        font: {
                            color: '#999',
                            size: 11,
                        },
                    },
                },
                boxmode: 'group',
            }
        }, 

        draw() {
            switch(this.mode) {
                case "macro": this.drawMacro(); break;
                case "profiles": this.drawProfiles(); break;
            }
        },
    },

    async mounted() {

        //load the tractmeasures.csv
        try {
            const res = await this.$http.get('secondary/'+this.task._id+'/'+this.output_id+'/tractmeasures.csv');
            this.data = parseCSV(res.data);          
        } catch (err) {
            console.log("trying old filename (output_FiberStats.csv)");
            const res = await this.$http.get('secondary/'+this.task._id+'/'+this.output_id+'/output_FiberStats.csv');
            this.data = parseCSV(res.data);          
        }

        //list all measures
        this.measures = [];
        for(let key in this.data[0]) {
            //?_mean should be treated as ?
            //if(key.includes("_mean")) key = key.split("_")[0];

            if(!this.labels[key]) {
                console.log("don't have label infor for", key);
                continue;
            }
            const label = this.labels[key];
            this.measures.push(Object.assign({id: key, label: label.title}, label));

            //inject proportion field for streamlinecount
            if(key == "StreamlineCount") {
                this.measures.push({
                    id: "StreamlineCountProportion", 
                    label: "Streamline Count (proportion)", 
                    title: "Streamline Count (proportion)", 
                    unit: "%",
                });
            }
        }

        //split into different structures
        this.structures = {};
        this.data.forEach((row, idx)=>{
            if(!this.structures[row.structureID]) {
                //initialize with empty arrays
                this.structures[row.structureID] = {x: []};
                this.measures.forEach(measure=>{
                    this.structures[row.structureID][measure.id] = [];
                });
            }
            this.structures[row.structureID].x.push(row.nodeID); //nodeIS starts at 1
            this.measures.forEach(measure=>{
                this.structures[row.structureID][measure.id].push(row[measure.id]);
            });
        });


        //set graph mode based on datatype tags
        if(this.datatype_tags.includes("profiles")) {
            //preselect the first one
            this.measure = this.measures[0]; 
            this.structure = Object.keys(this.structures)[0];
            this.mode = "profiles";
        } else if(this.datatype_tags.includes("macro")) {
            //create catalog of structures
            this.structureOptions = [];
            this.data.forEach(rec=>{
                const id = rec.TractName || rec.structureID;
                if(id && !this.structureOptions.includes(id)) this.structureOptions.push(id);
            });

            this.measure = this.measures[0]; 
            this.structures = this.structureOptions.slice(-5); //select first 5
            this.mode = "macro";
        } else {
            this.mode = "unknown";
        }
        this.draw();
    },

    watch: {
        measure(v, ov) {
            if(!ov) return;
            console.log("measure updated", this.mode);
            this.draw();
        },
        structures(v, ov) {
            if(!ov) return;
            console.log("structures updated", this.mode);
            this.draw();
        },
        structure(v, ov) {
            if(!ov) return;
            console.log("structure updated", this.mode);
            this.draw();
        },
    },

    computed: {
        structureIDs() {
            return Object.keys(this.structures);
        }
    }
}
</script>

<style scoped>
</style>

