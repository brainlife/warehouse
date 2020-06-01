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
                <b-row :no-gutters="true">
                    <b-col>
                        <vue-plotly :data="plot.p1.data" :layout="plot.p1.layout" :autoResize="true"/>
                    </b-col>
                    <b-col>
                        <vue-plotly :data="plot.p2.data" :layout="plot.p2.layout" :autoResize="true"/>
                    </b-col>
                    <b-col>
                        <vue-plotly :data="plot.p3.data" :layout="plot.p3.layout" :autoResize="true"/>
                    </b-col>
                    <b-col v-if="plot.p4">
                        <vue-plotly :data="plot.p4.data" :layout="plot.p4.layout" :autoResize="true"/>
                    </b-col>
                </b-row>
            </div>
            <small v-if="product.meta.tensor_measures">
                TODO - describe tensor measures. 
            </small>
            <small v-if="product.meta.noddi_measures">
                NDI is a summary of the intra-cellular anisotropic diffusion, ISOVF is a summary of the extracellular isotropic diffusion, and ODI is a mathematical inference based on the watson distribution that depends on both anistropic and isotropic components
            </small>
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
                };
            
                function initPlot(name, unit) {
                    return {
                        layout: {
                            title: name,
                            showlegend: false,
                            margin: {
                                l: 40, r: 10, b: 30, t: 30, pad: 0 
                            },
                            xaxis: {
                                title: {
                                    text: 'node postition',
                                    font: {
                                        color: '#999',
                                    },
                                },
                            },
                            yaxis: {
                                title: {
                                    text: unit,
                                    font: {
                                        color: '#999',
                                        size: 12,
                                    },
                                },
                            },
                            height: 300,
                        },
                        data: [],
                    }
                }

                if(this.product.meta.tensor_measures) {
                    //ad_1,ad_2,fa_1,fa_2,md_1,md_2,rd_1,rd_2,ad_inverse_1,ad_inverse_2,fa_inverse_1,fa_inverse_2,md_inverse_1,md_inverse_2,rd_inverse_1,rd_inverse_2,ndi_1,ndi_2,isovf_1,isovf_2,odi_1,odi_2,ndi_inverse_1,ndi_inverse_2,isovf_inverse_1,isovf_inverse_2,odi_inverse_1,odi_inverse_2
                    plot.p1 = initPlot("Axial Diffusivity (AD)", "nm^2/msec");
                    plot.p2 = initPlot("Fractional Anisotropy (FA)", "normalized fraction of anisotropic component");
                    plot.p3 = initPlot("Mean Diffusivity (MD)", "nm^2/msec");
                    plot.p4 = initPlot("Radial Diffusivity (RD)", "nm^2/msec");
                } else {
                    //ndi_1,ndi_2,isovf_1,isovf_2,odi_1,odi_2,ndi_inverse_1,ndi_inverse_2,isovf_inverse_1,isovf_inverse_2,odi_inverse_1,odi_inverse_2
                    plot.p1 = initPlot("Neurite Density Index (NDI)", "intra-cellular volume fraction");
                    plot.p2 = initPlot("Isotropic Volume Fraction (ISOVF)", "extra-cellular volume fraction");
                    plot.p3 = initPlot("Orientation Dispersion Index (ODI)", "relative dispersion of fiber orientation");
                }

                let rows = res.data.split("\n"); 
                let header = rows.shift();
                //console.log(header);

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
                plot.p1.data.push({
                    x: x2,
                    y: ad_y2,
                    fill: "tozerox",
                    line: { color: "transparent"},
                })
                plot.p1.data.push({ x, y: ad_y, })

                plot.p2.data.push({
                    x: x2,
                    y: fa_y2,
                    fill: "tozerox",
                    line: { color: "transparent"},
                })
                plot.p2.data.push({ x, y: fa_y, })

                plot.p3.data.push({
                    x: x2,
                    y: md_y2,
                    fill: "tozerox",
                    line: { color: "transparent"},
                })
                plot.p3.data.push({ x, y: md_y, })

                if(plot.p4) {
                    plot.p4.data.push({
                        x: x2,
                        y: rd_y2,
                        fill: "tozerox",
                        line: { color: "transparent"},
                    })
                    plot.p4.data.push({ x, y: rd_y, })
                }

                this.plots.push(plot);
            });
        });
    },
}
</script>

<style scoped>
</style>

