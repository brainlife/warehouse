<template>
<div>
    <div style="width: 250px; float: left; background-color: #eee;">
        <p style="margin: 5px">
            <span class="form-header">Measures</span>
            <span v-for="(o, column) in columns" :key="column" style="margin: 0; padding-right: 5px;">
                <b-form-checkbox v-model="o.show" style="display: inline-block">{{column.toUpperCase()}}</b-form-checkbox>
            </span>
        </p>

        <table class="table table-sm">
        <thead>
            <tr style="opacity: 0.7;">
                <th>Tracts</th>
                <th width="16px">L</th>
                <th width="16px">C</th>
                <th width="16px">R</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="(o, name) in csvs" :key="name">
                <th><b>{{name}}</b></th>
                <th>
                    <b-form-checkbox v-if="o.left" v-model="o.left.show" @change="showHideTract($event, o.left)"/>
                </th>
                <th>
                    <b-form-checkbox v-if="o.center" v-model="o.center.show" @change="showHideTract($event, o.center)"/>
                </th>
                <th>
                    <b-form-checkbox v-if="o.right" v-model="o.right.show" @change="showHideTract($event, o.right)"/>
                </th>
            </tr>
        </tbody>
        </table>
    </div>
    <div style="margin-left: 250px; padding-left: 10px;">
        <div v-for="o in shownTracts" :key="o.path">
            <center><b>{{o.path}}</b></center>
            <b-row v-if="plots[o.path]" no-gutters>
                <b-col v-for="column_name in shownColumns" :key="column_name" v-if="">
                    <div v-if="plots[o.path][column_name]">
                        <ExportablePlotly :data="plots[o.path][column_name].data" :layout="plots[o.path][column_name].layout" @hover="hover"/>
                    </div>
                    <span v-else>No {{column_name}}</span>
                </b-col>
            </b-row>
        </div>
    </div>
    <br clear="both"/>
</div>
</template>

<script>
import Vue from 'vue'
import axios from 'axios'

export default {
    props: ['task', 'output_id', 'product'],
    components: {
        ExportablePlotly: ()=>import('@/components/ExportablePlotly'),
    },
    data() {
        return {
            config: Vue.config,
            csvs: {
                //name: {
                //  left: {csv: , show: true/false}, 
                //  right: 
                //  center: 
                //}
            },
            columns: {},
            plots: {}, //keyed by path - loaded plots
        }
    },

    computed: {
        shownColumns() {
            let shown = [];
            for(let column in this.columns) {
                if(this.columns[column].show) shown.push(column);
            }
            return shown;
        },
        shownTracts() {
            let shown = [];
            for(let tract in this.csvs) {
                if(this.csvs[tract].left && this.csvs[tract].left.show) shown.push(this.csvs[tract].left);
                if(this.csvs[tract].right && this.csvs[tract].right.show) shown.push(this.csvs[tract].right);
                if(this.csvs[tract].center && this.csvs[tract].center.show) shown.push(this.csvs[tract].center);
            }
            return shown;
        },
    },

    mounted() {
        console.log("mounted tractprofile secondary ui");
        //console.dir(this.product.meta);
        if(this.hasTensor()) {
            Vue.set(this.columns, 'fa', {show: false});
            Vue.set(this.columns, 'ad', {show: false});
            Vue.set(this.columns, 'md', {show: false});
            Vue.set(this.columns, 'rd', {show: false});
        }

        if(this.hasNoddi()) {
            Vue.set(this.columns, 'ndi', {show: false});
            Vue.set(this.columns, 'isovf', {show: false});
            Vue.set(this.columns, 'odi', {show: false});
        }

        if(this.hasDki()) {
            Vue.set(this.columns, 'ga', {show: false});
            Vue.set(this.columns, 'mk', {show: false});
            Vue.set(this.columns, 'ak', {show: false});
            Vue.set(this.columns, 'rk', {show: false});
        }

        Vue.set(this.columns, 'xyz', {show: false});

        if(this.hasTensor()) {
            this.columns.ad.show = true;
            this.columns.fa.show = true;
            this.columns.rd.show = true;
        } else if(this.hasNoddi()) {
            this.columns.ndi.show = true;
            this.columns.isovf.show = true;
            this.columns.odi.show = true;
        } else if(this.hasDki()) {
            this.columns.ga.show = true;
            this.columns.mk.show = true;
            this.columns.ak.show = true;
        } else {
            //console.dir(this.product.meta);
            console.error("odd.. either tensor or noddi should be set");
        }

        //load csvs
        this.product.meta.csvs.sort((a,b)=>{
            return a.localeCompare(b);
        }).forEach((path, csv_idx)=>{
            let name = path.substring(0, path.length-4); //remove ".csv"
            name = name.replace("_profiles", "");
            let left = false;
            let right = false;
            if(name.includes("left")) {
                left = true;
                name = name.replace("left", "");
            }  
            if(name.includes("right")) {
                right = true;
                name = name.replace("right", "");
            }  
            if(!this.csvs[name]) Vue.set(this.csvs, name, {});
            if(left) Vue.set(this.csvs[name], 'left', {path, show: false, });
            else if(right) Vue.set(this.csvs[name], 'right', {path, show: false, });
            else Vue.set(this.csvs[name], 'center', {path, show: false, });
        });

        //select the first 3 csvs
        let count = 0;
        for(let name in this.csvs) {
            let csv = this.csvs[name];
            if(csv.left && count < 2) {
                this.loadCSV(csv.left.path);
                csv.left.show = true;
                count++;
            }
        }
    },

    methods: {

        hasTensor() {
            //fa, md, rd, ad
            if(this.product.meta.tensor_measures) return true; //deprecated
            if(this.product.meta.columns.includes("fa_1")) return true;
            if(this.product.meta.columns.includes("fa_mean")) return true;
            return false;
        },

        hasNoddi() {
            //ndi, isovf, odi
            if(this.product.meta.noddi_measures) return true; //deprecated
            if(this.product.meta.columns.includes("ndi_1")) return true;
            if(this.product.meta.columns.includes("ndi_mean")) return true;
            return false;
        },

        hasDki() {
            //ga, mk, ak, rk
            if(this.product.meta.columns.includes("ga_1")) return true;
            if(this.product.meta.columns.includes("ga_mean")) return true;
            return false;
        },

        hover(e) {
            let points = e.points[e.points.length-1];
            let pointNum = points.pointNumber;
        },

        showHideTract(show, o) {
            //console.log("showdhide", o.path);
            if(show) {
                if(this.plots[o.path] == null) {
                    this.loadCSV(o.path);
                }
            }
        },

        loadCSV(path) {
            console.log("loading", this.output_id);
            Vue.set(this.plots, path, {});
            this.$http.get('secondary/'+this.task._id+'/'+this.output_id+'/secondary/profiles/'+path, {responseType: 'text'}).then(res=>{
                this.plots[path] = this.createPlot(res.data);
            });
        },

        createPlot(csv) {
            let csv_rows = csv.split("\n"); 
            let headers = csv_rows.shift().split(",");
            let plots = {}; 
            let rows = [];
            csv_rows.forEach(csv_row=>{
                rows.push(csv_row.split(",").map(v=>parseFloat(v)));
            });
            let reversed_rows = rows.slice().reverse(); 

            let x_coords = null;
            let y_coords = null;
            let z_coords = null;

            headers.forEach((header, cid)=>{
                let plot = {
                    layout: {
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
                                font: {
                                    color: '#999',
                                    size: 12,
                                },
                            },
                        },
                        height: 300,
                    },
                    data: [],
                };

                switch(header) {
                //TENSOR measures
                case "fa_1": //deprecated
                case "fa_mean":
                    plot.layout.title = "Fractional Anisotropy (FA)";
                    plot.layout.yaxis.title.text = "normalized fraction of anisotropic component";
                    plots["fa"] = plot;
                    break;
                case "ad_1": //deprecated
                case "ad_mean":
                    plot.layout.title = "Axial Diffusivity (AD)";
                    plot.layout.yaxis.title.text = "microm^2/msec";
                    plots["ad"] = plot;
                    break;
                case "md_1": //deprecated
                case "md_mean":
                    plot.layout.title = "Mean Diffusivity (MD)";
                    plot.layout.yaxis.title.text = "microm^2/msec";
                    plots["md"] = plot;
                    break;
                case "rd_1": //deprecated
                case "rd_mean":
                    plot.layout.title = "Radial Diffusivity (RD)";
                    plot.layout.yaxis.title.text = "microm^2/msec";
                    plots["rd"] = plot;
                    break;

                //NODDI measures
                case "ndi_1": //deprecated
                case "ndi_mean":
                    plot.layout.title = "Neurite Density Index (NDI)";
                    plot.layout.yaxis.title.text = "intra-cellular volume fraction";
                    plots["ndi"] = plot;
                    break;
                case "isovf_1": //deprecated
                case "isovf_mean":
                    plot.layout.title = "Isotropic Volume Fraction (ISOVF)";
                    plot.layout.yaxis.title.text = "extra-cellular volume fraction";
                    plots["isovf"] = plot;
                    break;
                case "odi_1": //deprecated
                case "odi_mean":
                    plot.layout.title = "Orientation Dispersion Index (ODI)";
                    plot.layout.yaxis.title.text = "relative dispersion of fiber orientation";
                    plots["odi"] = plot;
                    break;

                //DKI measures
                case "ga_mean":
                    plot.layout.title = "Geodesic Anisotropy (GA)";
                    plot.layout.yaxis.title.text = "normalized fraction of geodesic component";
                    plots["ga"] = plot;
                    break;

                case "mk_mean":
                    plot.layout.title = "Mean Kurtosis (MK)";
                    plot.layout.yaxis.title.text = "microm^2/msec";
                    plots["mk"] = plot;
                    break;

                case "ak_mean":
                    plot.layout.title = "Axial Kurtosis (AK)";
                    plot.layout.yaxis.title.text = "microm^2/msec";
                    plots["ak"] = plot;
                    break;

                case "rk_mean":
                    plot.layout.title = "Radial Kurtosis (RK)";
                    plot.layout.yaxis.title.text = "microm^2/msec";
                    plots["rk"] = plot;
                    break;

                case "x_coords":
                    x_coords = [];
                    y_coords = [];
                    z_coords = [];
                    rows.forEach(cols=>{
                        x_coords.push(cols[cid]); 
                        y_coords.push(cols[cid+1]); 
                        z_coords.push(cols[cid+2]); 
                    });
                    return;
                default:
                    //console.log("ignoring ", header);
                    return;
                }

                let x = [];
                let y = [];
                let xerr = [];
                let yerr = [];
                rows.forEach(cols=>{
                    x.push(x.length); 
                    y.push(cols[cid]); 
                    xerr.push(xerr.length); 
                    yerr.push(cols[cid]+cols[cid+1]);
                });

                //follow the bottom curve of sdev in reverse order back to the beginning
                let xerridx = x.length-1;
                reversed_rows.forEach(cols=>{
                    xerr.push(xerridx--);
                    yerr.push(cols[cid]-cols[cid+1]);
                });

                //now put data together for each plots (put err bar first so that primary line goes on top)
                plot.data.push({
                    x: xerr,
                    y: yerr,
                    fill: "tozerox",
                    line: { color: "transparent"},
                })
                plot.data.push({ x, y })
            });

            //create xyz graph
            if(x_coords) {
                let text = [];
                for(let i = 0;i < x_coords.length;++i) {
                    if(i%50 == 0) text.push(i.toString());
                    else text.push(null);
                }

                let min = null;
                let max = null;
                function checkMinMax(v) {
                    if(min == null || min > v) min = v;
                    if(max == null || max < v) max = v;
                }
                x_coords.forEach(checkMinMax);
                y_coords.forEach(checkMinMax);
                z_coords.forEach(checkMinMax);

                plots["xyz"] = {
                    layout: {
                        //showlegend: false,
                        margin: {
                            l: 40, r: 10, b: 30, t: 30, pad: 0 
                        },
                        height: 300,
                        scene: {
                            xaxis: {
                                range: [min, max],
                                title: 'x (Left to Right)',
                            },
                            yaxis: {
                                range: [min, max],
                                title: 'y (Posterior to Anterior)'
                            },
                            zaxis: {
                                range: [min, max],
                                title: 'z (Inferior to Superior)'
                            },
                        },
                    },
                    data: [
                        {
                            type: 'scatter3d',
                            mode: 'lines+markers+text',
                            x: x_coords,
                            y: y_coords,
                            z: z_coords,
                            text,
                            marker: {
                                size: 2,
                            }
                        }
                    ],
                };
            }

            return plots;        
        },
    },
}
</script>

<style scoped>
.table-sm tbody {
font-size: 80%;
}
.table-sm tbody th {
padding: 0;
padding-left: 5px;
}
</style>

