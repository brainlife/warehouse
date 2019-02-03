<template>
<transition name="fade">
    <div v-if="open" class="brainlife-modal-overlay">
        <b-container class="brainlife-modal">
            <div class="brainlife-modal-header">
                <div style="float: right;">
                    <div class="button" @click="open = false" style="margin-left: 20px; opacity: 0.8;">
                        <icon name="times" scale="1.5"/>
                    </div>
                </div>
                <h4 style="margin-top: 8px;">
                    {{task.name}} 
                    <span style="float: right;">
                        <small style="opacity: 0.5">{{task._id}}</small>
                        <b style="opacity: 0.5; position: relative; top: -8px; font-size: 60%;">t.{{task.config._tid}}</b>
                    </span>
                </h4>
            </div><!--header-->

            <div class="scrolled" style="background-color: #fcfcfc;">
                <b-alert variant="secondary" :show="!loading && !smon.info" style="opacity: 0.8">Runtime info (_smon.out) not available</b-alert>

                <div style="padding: 20px;">
                    <b-row>
                        <b-col cols="6">
                            <h5>Task</h5>
                            <!--dates table-->
                            <table class="table table-sm">
                            <tr>
                                <th>Submitter</th>
                                <td>
                                    <contact :id="task.user_id" size="small"/>
                                </td>
                            </tr>
                            <tr>
                                <th>Created</th>
                                <td>{{new Date(this.task.create_date).toLocaleString()}}</td>
                            </tr>
                            <tr v-if="task.start_date">
                                <th>Started</th>
                                <td>{{new Date(this.task.start_date).toLocaleString()}}</td>
                            </tr>
                            <tr v-if="task.finish_date">
                                <th>Finished</th>
                                <td>{{new Date(this.task.finish_date).toLocaleString()}}</td>
                            </tr>
                            <tr v-if="task.fail_date">
                                <th>Failed</th>
                                <td>{{new Date(this.task.fail_date).toLocaleString()}}</td>
                            </tr>
                            <tr v-if="task.nice">
                                <th>Nice</th>
                                <td>{{task.nice}} <small style="opacity: 0.5">yeilds to less nice tasks</small></td>
                            </tr>
                            <tr v-if="task.config._rule">
                                <th>Rule</th>
                                <td>
                                    <small>This task was submitted by {{task.config._rule.id}}
                                    For subject:<b>{{task.config._rule.subject}}</b></small>
                                </td>
                            </tr>
                            <tr v-if="task.next_date" style="opacity: 0.6;">
                                <th>Next&nbsp;Chk</th>
                                <td>In {{((new Date(this.task.next_date).getTime() - new Date().getTime())/1000).toFixed(0)}} secs</td>
                            </tr>
                            <tr v-if="task.max_runtime">
                                <th>Max Runtime</th>
                                <td>{{task.max_runtime/(1000*60)}} mins</td>
                            </tr>
                            <tr v-if="resource">
                                <th>Resource</th>
                                <td>{{resource.name}} <small>{{resource.config.username}}@{{resource.config.hostname}} {{resource.desc}}</small></td>
                            </tr>
                            </table>
                        </b-col>
                        <b-col cols="6" v-if="smon.info">
                            <h5>Compute Node</h5>
                            <!--<p><small style="opacity: 0.5">This task rans on the following compute node</small></p>-->
                            <table class="table table-sm">
                            <tr>
                                <th>Host</th>
                                <td>
                                    {{smon.info.uid}}@{{smon.info.uname[1]}}
                                </td>
                            </tr>
                            <tr>
                                <th>Session ID</th>
                                <td>
                                    {{smon.info.sid}}
                                </td>
                            </tr>
                            <tr>
                                <th>OS</th>
                                <td>
                                    {{smon.info.uname[3]}}<br>
                                    <span style="opacity: 0.7">{{smon.info.uname[0]}} {{smon.info.uname[2]}}</span>
                                </td>
                            </tr>
                            <tr>
                                <th>CPUs</th>
                                <td>
                                    {{smon.info.cpu_total}} Total
                                    <span style="opacity: 0.7" v-if="smon.info.cpu_total != smon.info.cpu_avail">({{smon.info.cpu_requested}} requested)</span>
                                </td>
                            </tr>
                            <tr>
                                <th>Memory</th>
                                <td>
                                    {{smon.info.memory_total|memory}} Total
                                    <span style="opacity: 0.7" v-if="smon.info.memory_total != smon.info.memory_avail">({{smon.info.memory_requested|memory}} requested)</span>
                                </td>
                            </tr>
                            <tr v-if="smon.info.walltime_requested">
                                <th>Requested Walltime</th>
                                <td>
                                    {{smon.info.walltime_requested}} secs
                                </td>
                            </tr>
                            </table>
                        </b-col>
                    </b-row>
                </div><!--padding-->

                <h5 v-if="loading" style="opacity: 0.8; padding: 20px;"><icon name="cog" :spin="true"/> Loading runtime info .. </h5>

                <div v-if="!loading && smon.info" style="padding: 20px;">

                    <h5>Resource Utilization</h5>
                    <p style="opacity: 0.7"><small>
                        The following information is collected on the actual compute node used to run this App.
                        The App should be using close to all requested CPU cores / memory.
                    </small></p>
               
                    <!-- without watchShallow, vue-plotly will go infinite loop with layout watch event and locks up the browser-->
                    <div v-if="smon.cpu.data">
                        <vue-plotly :data="smon.cpu.data" :layout="smon.cpu.layout" :autoResize="true" :watchShallow="true"/>
                    </div>
                    <div v-if="smon.memory.data">
                        <vue-plotly :data="smon.memory.data" :layout="smon.memory.layout" :autoResize="true" :watchShallow="true"/>
                    </div>
                    <div v-if="smon.disk.data">
                        <vue-plotly :data="smon.disk.data" :layout="smon.disk.layout" :autoResize="true" :watchShallow="true"/>
                    </div>
                    <br>

                    <h5>Job ENVs</h5>
                    <p style="opacity: 0.8; margin: 5px 0px; overflow: auto;">
                        <b-badge v-for="(v, k) in smon.info.env" :key="k" variant="light"><b>{{k}}</b> {{v}}</b-badge>
                    </p>
                </div> <!-- smon-->
                <div style="padding: 20px;">
                    <h5>Config</h5>
                    <pre v-highlightjs="JSON.stringify(task.config, null, 4)" style="background-color: white;"><code class="json hljs"></code></pre>
                </div>
            </div>
        </b-container>
    </div>
</transition>
</template>

<script>
import Vue from 'vue'

import app from '@/components/app'
import datatypetag from '@/components/datatypetag'
import configform from '@/components/configform'
import advanced from '@/components/appadvanced'
import tageditor from '@/components/tageditor'

import contact from '@/components/contact'
import VueMarkdown from 'vue-markdown'
import VuePlotly from '@statnett/vue-plotly'

const lib = require('../lib');

export default {
    components: { 
        app, datatypetag, configform, advanced, tageditor, contact, VueMarkdown, VuePlotly,
    },

    data() {
        return {
            open: false,
            task: null,
            resource: null,
            smon: {
                info: null,

                //plotly graphs
                disk: {
                    data: null,
                    layout: null,
                },
                cpu: {
                    data: null,
                    layout: null,
                },

                memory: {
                    data: null,
                    layout: null,
                },
            },
            loading: false,
        }
    },

    created() {
        this.$root.$on("taskinfo.open", opt=>{
            console.log("opening taskinfo", opt.task._id);
            this.task = opt.task;
            this.resource = opt.resource;
            this.open = true;
            this.load_smon();
        });

        //TODO - call removeEventListener in destroy()? Or I should do this everytime modal is shown/hidden?
        document.addEventListener("keydown", e => {
            if (e.keyCode == 27) {
                this.open = false;
            }
        });
    },

    /*
    destroyed() {
        this.$root.$off("taskinfo.open");
    },
    */

    methods: {
        load_smon() {
            this.loading = true;
            this.smon.info = null;
            this.$http.get(Vue.config.amaretti_api+'/task/download/'+this.task._id+'?p=_smon.out').then(res=>{
                let records = res.data.split("\n");

                //first record should be host/job info
                this.smon.info = JSON.parse(records.shift()); 
                let begin_date = new Date(this.smon.info.time*1000);
                let end_date = null;

                function shorten(long) {
                    if(long.length < 40) return long;
                    let tokens = long.split(" ");
                    let short = "";
                    tokens.forEach(t=>{
                        if(t.length < 20) {
                            short+=t+" ";
                            return;
                        }
                        short+=".."+t.substring(t.length-20)+" ";
                    });
                    if(short.length > 40) short = short.substring(0, 40)+"...";
                    return short;
                }

                //rest is resource utilization 
                let disk = {
                    x: [],
                    y: [],
                    name: "workdir (.)",
                    mode: "lines",
                    line: {width: 0},
                    fill: 'tozeroy'
                }; 
                let pcpus = {};
                let memory = {};
                records.forEach(record_json=>{
                    if(record_json == "") return;
                    try {
                        let record = JSON.parse(record_json);
                        let time = new Date(record.time*1000);
                        end_date = time;

/*
{
	"processes": [{
		"pcpu": 0.0,
		"cmd": "slurmstepd: [40555]",
		"pid": "27289",
		"etime": "01:03",
		"pmem": 0.0,
		"vsz": 133808,
		"rss": 4852
	}, {
		"pcpu": 0.0,
		"cmd": "/bin/bash /var/lib/slurm-llnl/slurmd/job40555/slurm_script",
		"pid": "27293",
		"etime": "01:02",
		"pmem": 0.0,
		"vsz": 11248,
		"rss": 2932
	}, {
		"pcpu": 10.7,
		"cmd": "/usr/lib/x86_64-linux-gnu/singularity/bin/docker-extract /home/brlife/.singularity/docker/sha256:69375bcede9e50197544edde37a64e3a9e8a2c724c79aae0623cb8f74f6bc6d4.tar.gz",
		"pid": "27380",
		"etime": "00:47",
		"pmem": 0.0,
		"vsz": 67956,
		"rss": 5224
	}],
	"disks": [{
		"path": ".",
		"size": 2365716
	}],
	"memory_avail": 13919813632,
	"time": 1541644209.550354
}
*/

                        //deal with disk usage
                        if(record.disks) record.disks.forEach(rd=>{
                            if(rd.path == ".") {
                                disk.x.push(time);
                                disk.y.push(rd.size/1000);
                            }
                        });

                        //deal with process
                        if(record.processes) record.processes.forEach(p=>{
                            if(p.cmd.indexOf("ps ") == 0) return;
                            if(!pcpus[p.pid]) pcpus[p.pid] = {x: [], y: [], name: shorten(p.cmd), mode: 'lines', stackgroup: 'pcpu', line: {width: 0} }
                            pcpus[p.pid].x.push(time);
                            pcpus[p.pid].y.push(p.pcpu);

                            if(!memory[p.pid]) memory[p.pid] = {x: [], y: [], name: shorten(p.cmd), mode: 'lines', stackgroup: 'memory', line: {width: 0} }
                            memory[p.pid].x.push(time);
                            memory[p.pid].y.push((p.rss*1024)/(1000*1000)); //convert kiloBytes to MB
                        });
                    } catch(err) {
                        //parse error?
                        console.log(record_json);
                        console.error(err);
                    }
                });

                this.smon.disk.data = [disk];
                this.smon.disk.layout = {
                    title: "Disk Usage",
                    height: 370,
                    margin: {
                        //l: 50, 
                        //r: 10, 
                        //b: 80,
                        t: 25,
                    },
                    showlegend: true,
                    legend: {
                        //orientation: "h",
                        font: {
                            family: 'sans-serif',
                            size: 10,
                        }
                    },
                    yaxis: {
                        title: 'MB',
                        //range: [new Date("2018-01-01"), new Date()],
                    },
                };

                this.smon.cpu.data = [];
                for(let pid in pcpus) {
                    //look for non-0
                    let non0 = pcpus[pid].y.find(y=>y>0.5);
                    if(non0) this.smon.cpu.data.push(pcpus[pid]);
                }
                this.smon.cpu.layout = {
                    title: "CPU Usage (ps/pcpu)",
                    xaxis: {
                        range: [begin_date, end_date],
                    },
                    yaxis: {
                        title: 'CPU%',
                        overlaying: "y",
                        //side: "right",
                        //type: 'log',
                    },
                    showlegend: true,
                    legend: {
                        font: {
                            family: 'sans-serif',
                            size: 10,
                        }
                    },
                    height: 400,
                    margin: {
                        //l: 50, 
                        //r: 10, 
                        //b: 80,
                        t: 25,
                    },
                    shapes: [
                        //job max
                        {
                            type: 'rect',
                            xref: 'paper',
                            x0: 0,
                            y0: 100.0*this.smon.info.cpu_requested*0.95,
                            x1: 1,
                            y1: 100.0*this.smon.info.cpu_requested,
                            fillcolor: 'rgba(255, 0, 0, 0.5)',
                            line: {
                                width: 0,
                            }
                        },
                    ]
                };

                this.smon.memory.data = [];
                for(let pid in memory) {
                    //look for non-0
                    let non0 = memory[pid].y.find(y=>y>10); //10MB min
                    if(non0) this.smon.memory.data.push(memory[pid]);
                }
                this.smon.memory.layout = {
                    title: "Memory Usage (RSS)",
                    xaxis: {
                        range: [begin_date, end_date],
                    },
                    yaxis: {
                        title: 'MB',
                        overlaying: "y",
                        //side: "right",
                        type: 'log',
                    },
                    showlegend: true,
                    //paper_bgcolor: "#000",
                    legend: {
                        font: {
                          family: 'sans-serif',
                          size: 10,
                        },
                    },
                    height: 400,
                    margin: {
                        //l: 50, 
                        //r: 10, 
                        //b: 80,
                        t: 25,
                    },
                    shapes: [
                        //job memory max
                        {
                            type: 'rect',
                            //xref: 'paper',
                            x0: begin_date,
                            y0: this.smon.info.memory_requested/(1000*1000)*0.95,
                            x1: end_date,
                            y1: this.smon.info.memory_requested/(1000*1000),
                            fillcolor: 'rgba(255, 0, 0, 0.5)',
                            line: {
                                width: 0,
                            }
                        },
                
                    ]
                };
                this.loading = false;
            }).catch(err=>{
                this.loading = false;
                console.error(err);
            });
        },
    },

    computed: {
        /*
        computed_remove_date() {
            if(this.task.remove_date) {
                return new Date(this.task.remove_date);
            } else {
                //use finish date instead
                let d = new Date(this.task.finish_date);
                d.setDate(d.getDate() + 25); //should match with amaretti bin/task
                return d;
            }
        },
        */
    },

    filters: {
        memory(v) {
            return (v/(1000*1000*1000)).toFixed(2)+"GB";
        }
    },
} 
</script>

<style scoped>
h5 {
    font-size: 17px;
    font-weight: bold;
    color: gray;
    text-transform: uppercase;
}
.scrolled {
position: absolute;
top: 60px;
left: 0;
right: 0;
bottom: 0px;
overflow-x: hidden;
overflow-y: auto;
}
.badge {
border-radius: 0;
margin-right: 3px;
font-weight: normal;
padding: 5px;
}
</style>
