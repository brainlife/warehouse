<template>
<div>
    <b-row>
        <b-col>
            <!--
            <a :href="config.api+'/secondary/'+task._id+'/'+output.id+'/secondary/aparc+aseg.nii.gz?at='+config.jwt">
                aparc+aseg.nii.gz
            </a>
            <a :href="config.api+'/secondary/'+task._id+'/'+output.id+'/secondary/aparc.a2009s+aseg.nii.gz?at='+config.jwt">
                aparc.a2009s+aseg.nii.gz
            </a>
            <a :href="config.api+'/secondary/'+task._id+'/'+output.id+'/secondary/aparc.DKTatlas+aseg.nii.gz?at='+config.jwt">
                aparc.DKTatlas+aseg.nii.gz
            </a>
            -->
            <div v-for="plot in plots" :key="plot.csv">
                <center><b>{{plot.csv}}</b></center>
                <b-row no-gutters="true">
                    <b-col>
                        <vue-plotly :data="plot.ad.data" :layout="plot.ad.layout" :autoResize="true"/>
                    </b-col>
                    <b-col>
                        <vue-plotly :data="plot.fa.data" :layout="plot.fa.layout" :autoResize="true"/>
                    </b-col>
                    <b-col>
                        <vue-plotly :data="plot.md.data" :layout="plot.md.layout" :autoResize="true"/>
                    </b-col>
                    <b-col>
                        <vue-plotly :data="plot.rd.data" :layout="plot.rd.layout" :autoResize="true"/>
                    </b-col>
                </b-row>
            </div>
        </b-col>
    </b-row>
    <small>TODO... Only showing only the first few CSVs. noddi measures is coming soon!</small>
</div>
</template>

<script>
import Vue from 'vue'
import axios from 'axios'

export default {
    props: ['task', 'output', 'product'],
    components: {
        'vuePlotly': ()=> import('@statnett/vue-plotly'),
    },
    data() {
        return {
            config: Vue.config,

            plots: [], // grouped by csv, then measures
            /*
            ad_data: [],
            ad_layout: { title: 'AD', },
            fa_data: [],
            fa_layout: { title: 'FA', },
            */
        }
    },
    mounted() {
        //load csvs
        this.product.meta.csvs.forEach((csv, csv_idx)=>{
            if(csv_idx >= 3) return; //only show the first csv..

            console.log("loading", csv);
            this.$http.get('secondary/'+this.task._id+'/'+this.output.id+'/secondary/profiles/'+csv).then(res=>{
                let plot = {
                    csv, 
                    ad: { 
                        data: [], 
                        layout: {
                            title: "AD",
                            showlegend: false,
                            margin: {
                                l: 30, r: 0, b: 30, t: 30, pad: 0 
                            },
                            height: 300,
                        }
                    }, 
                    fa: { 
                        data: [], 
                        layout: {
                            title: "FA",
                            showlegend: false,
                            margin: {
                                l: 30, r: 0, b: 30, t: 30, pad: 0 
                            },
                            height: 300,
                        }
                    }, 
                    md: { 
                        data: [], 
                        layout: {
                            title: "MD",
                            showlegend: false,
                            margin: {
                                l: 30, r: 0, b: 30, t: 30, pad: 0 
                            },
                            height: 300,
                        }
                    }, 
                    rd: { 
                        data: [], 
                        layout: {
                            title: "RD",
                            showlegend: false,
                            margin: {
                                l: 30, r: 0, b: 30, t: 30, pad: 0 
                            },
                            height: 300,
                        }
                    }, 
                };

                let rows = res.data.split("\n"); 
                let header = rows.shift();
                console.log(header);

                //value
                let x = [];
                let ad_y = [];
                let fa_y = [];
                let md_y = [];
                let rd_y = [];

                //sdev
                let x2 = [];
                let ad_y2 = [];
                let fa_y2 = [];
                let md_y2 = [];
                let rd_y2 = [];

                rows.forEach(row=>{
                    let cols = row.split(",").map(v=>parseFloat(v));

                    x.push(x.length); 
                    ad_y.push(cols[0]); 
                    fa_y.push(cols[2]); 
                    md_y.push(cols[4]); 
                    rd_y.push(cols[6]); 

                    x2.push(x2.length); 
                    ad_y2.push(cols[0]+cols[1]);
                    fa_y2.push(cols[2]+cols[3]);
                    md_y2.push(cols[4]+cols[5]);
                    rd_y2.push(cols[6]+cols[7]);
                });

                //follow the bottom curve of sdev in reverse order back to the beginning
                let x2idx = x.length-1;
                rows.reverse().forEach(row=>{
                    let cols = row.split(",").map(v=>parseFloat(v));
                    x2.push(x2idx--);
                    ad_y2.push(cols[0]-cols[1]);
                    fa_y2.push(cols[2]-cols[3]);
                    md_y2.push(cols[4]-cols[5]);
                    rd_y2.push(cols[6]-cols[7]);
                });

                //now put data together for each plots
                plot.ad.data.push({
                    x: x2,
                    y: ad_y2,
                    fill: "tozerox",
                    line: { color: "transparent"},
                })
                plot.ad.data.push({ x, y: ad_y, })

                plot.fa.data.push({
                    x: x2,
                    y: fa_y2,
                    fill: "tozerox",
                    line: { color: "transparent"},
                })
                plot.fa.data.push({ x, y: fa_y, })

                plot.md.data.push({
                    x: x2,
                    y: md_y2,
                    fill: "tozerox",
                    line: { color: "transparent"},
                })
                plot.md.data.push({ x, y: md_y, })

                plot.rd.data.push({
                    x: x2,
                    y: rd_y2,
                    fill: "tozerox",
                    line: { color: "transparent"},
                })
                plot.rd.data.push({ x, y: rd_y, })

                this.plots.push(plot);
            });
        });
    },
}
</script>

<style scoped>
</style>

