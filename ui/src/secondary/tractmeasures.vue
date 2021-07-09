<template>
<div>
    <small v-if="!mode">Loading..</small>
    <small v-if="mode == 'unknown'">Unknown datatype tag {{datatype_tags}}</small>
    <div v-if="mode == 'profiles'">
        <ExportablePlotly v-if="structure && measure" :data="profileGraphs[structure+'.'+measure.id].data" :layout="profileGraphs[structure+'.'+measure.id].layout"/>
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
            refdata: null,
            refNodeCount: 50,

            //for <profiles>
            profileGraphs: null, 
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
                    refid: "volume",
                },
                StreamlineCount: {
                    title: "Streamline Counts",
                    refid: "count",
                },
                avgerageStreamlineLength: {
                    title: "Avg Streamline Length",
                    unit: "mm",
                    refid: "length",
                },
            },

            config: Vue.config,
        }
    },
    methods: {

        async drawProfiles() {

            //create graph for each measure for each structure
            this.profileGraphs = {};
            for(const structureID in this.structures) {
                this.measures.forEach(measure=>{

                    const data = [];
                    data.push({
                        name: "This Data",
                        x: this.structures[structureID].x,
                        y: this.structures[structureID][measure.id],
                    });

                    //find reference
                    this.refdata.forEach(ref=>{
                        const refMean = ref[measure.id].mean;
                        const refSD = ref[measure.id].sd;

                        if(ref.structurename == structureID) {
                            const sampleNodeCount = this.structures[structureID].x.length;
                            const step = sampleNodeCount/this.refNodeCount;
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
                            data.push({
                                name: ref.source,
                                x, y: refMean,
                                line: {
                                    color: 'hsla('+string2hue(ref.source)+',80%,30%,0.5)',
                                    width: 1.5,
                                }
                            });

                            //sdev area
                            data.push({
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
                                    size: 11,
                                },
                            },
                        },
                        yaxis: {
                            title: {
                                text: this.labels[measure.id].unit,
                                font: {
                                    color: '#999',
                                    size: 11,
                                },
                            },
                        },
                        //title: this.labels[measure.id].title,
                        height: 300,
                    }
                    
                    this.profileGraphs[structureID+"."+measure.id] = {data, layout};
                });
            }

        }, 

        async drawMacro() {
            //add "this data" first (to claim the default blue color!)
            let x = [];
            let y = [];
            this.data.forEach(rec=>{
                const id = rec.TractName || rec.structureID;
                if(id && !this.structures.includes(id)) return;
                /*
                {
                    "TractName": "wbfg",
                    "StreamlineCount": 1500000,
                    "volume": 689042,
                    "avgerageStreamlineLength": 52.3374268320154,
                    "streamlineLengthStdev": 24.5019123600965,
                    "averageFullDisplacement": 37.4882340792743,
                    "fullDisplacementStdev": 15.7604755775957,
                    "ExponentialFitA": 0.0313347189722198,
                    "ExponentialFitB": -0.0292611175183509,
                    "StreamlineLengthTotal": 78506140.248023,
                    "endpoint1Density": "NaN",
                    "Endpoint2Density": "NaN",
                    "AverageEndpointDistanceFromCentroid1": "NaN",
                    "AverageEndpointDistanceFromCentroid2": "NaN",
                    "stdevOfEndpointDistanceFromCentroid1": "NaN",
                    "stdevEndpointDistanceFromCentroid2": "NaN",
                    "MidpointDensity": "NaN",
                    "averageMidpointDistanceFromCentroid": "NaN",
                    "stDevOfMidpointDistanceFromCentroid": "NaN",
                    "TotalVolumeProportion": 1,
                    "TotalCountProportion": 1,
                    "TotalWiringProportion": 1
                }
                */
                y.push(id);
                x.push(rec[this.measure.id]);
            });

            this.macroGraph = [];
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
            //group reference into each source
            const sources = {};
            this.refdata.forEach(rec=>{
                /*
                {
                    "structurename": "leftmeyer",
                    "source": "ping-siemens",
                    ...
                    "count": {
                        "mean": 427.56,
                        "min": 165,
                        "max": 714,
                        "sd": 128.84
                    },
                    "length": {
                        "mean": 74.99,
                        "min": 63.12,
                        "max": 86.64,
                        "sd": 5.62
                    },
                    "volume": {
                        "mean": 12536.7,
                        "min": 7947,
                        "max": 17164,
                        "sd": 2111.73
                    }
                }
                */
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
                        width: 1
                    },
                    marker: {
                        color: 'hsla('+string2hue(rec.source)+',80%,30%,0.2)',
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
                    const stat = rec[this.measure.refid];
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

            //finally reorg to data
            for(let source in sources) {
                this.macroGraph.push(sources[source]);
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

        //load reference data
        this.refdata = await fetch('https://raw.githubusercontent.com/brainlife/reference/master/neuro/tractmeasures/reference.json').then(res=>res.json());

        //list all measures
        this.measures = [];
        for(let key in this.data[0]) {
            //?_mean should be treated as ?
            if(key.includes("_mean")) key = key.split("_")[0];

            if(!this.labels[key]) continue;
            const label = this.labels[key];
            this.measures.push(Object.assign({id: key, label: label.title}, label));
        }

        //split into different structures
        this.structures = {};
        this.data.forEach(row=>{
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
            this.mode = "profiles";

            //preselect the first one
            this.measure = this.measures[0]; 
            this.structure = Object.keys(this.structures)[0];

        } else if(this.datatype_tags.includes("macro")) {
            this.mode = "macro";

            //create catalog of structures
            this.structureOptions = [];
            this.data.forEach(rec=>{
                const id = rec.TractName || rec.structureID;
                if(id && !this.structureOptions.includes(id)) this.structureOptions.push(id);
            });

            this.measure = this.measures[0]; 
            this.structures = this.structureOptions.slice(-5); //select first 5
        } else {
            this.mode = "unknown";
        }

        this.draw();
    },

    watch: {
        measure() {
            this.draw();
        },
        structures() {
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

