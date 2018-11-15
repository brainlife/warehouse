<template>
<div>
    <pageheader>
        <!--
        <div class="search-box">
            <b-form-input v-model="query" type="text" placeholder="Search" @focus.native="focus_search()" @input="change_query_debounce" class="input"/>
            <icon name="search" class="search-icon" scale="1.5"/>
        </div>
        -->
    </pageheader>
    <sidemenu active="/datatypes"></sidemenu>
    <div class="datatype-list" ref="scrollable">
        <h4>Datatypes</h4>
        <p v-if="!datatypes" style="margin: 20px;">Loading ..</p>
        <div v-else>
            <h5>neuro/</h5>
            <p v-for="datatype in get_datatypes('neuro/')" :key="datatype._id" :id="datatype._id" class="item" :class="{'selected': selected == datatype}" @click="select(datatype)">
                <!--<datatypetag :datatype="datatype"/><br>-->
                <icon name="cube" :style="{color: gethsl(datatype.name)}" style="margin-right: 5px;"/> {{trim(datatype.name)}}
                <small>{{datatype.desc}}</small>
            </p>
            <br>
            <h5>Others</h5>
            <p v-for="datatype in get_not_datatypes('neuro/')" :key="datatype._id" :id="datatype._id" class="item" :class="{'selected': selected == datatype}" @click="select(datatype)">
                <!--<datatypetag :datatype="datatype" :trimname="false"/><br>-->
                <icon name="cube" :style="{color: gethsl(datatype.name)}" style="margin-right: 5px;"/>
                {{datatype.name}}
                <small>{{datatype.desc}}</small>
            </p>
        </div>
        <br>
        <br>
        <br>
        <br>
        <br>
        <b-button class="button-fixed" @click="newdatatype" title="New Datatype">
            <icon name="plus" scale="2"/>
        </b-button>
    </div>
    <div class="page-content">
        <p v-if="!selected" style="margin: 20px; opacity: 0.5">Please select a datatype to show.</p>
        <div v-if="selected">
            <div class="header">
                <b-container>
                    <div style="float: right;">
                        <span class="button" @click="edit" v-if="canedit && !editing" title="Edit"><icon name="edit" scale="1.25"/></span>
                    </div>
                    <h3>
                        <b-form-input v-if="editing" type="text" v-model="selected.name" placeholder="neuro/somename"></b-form-input>
                        <datatypetag v-else :datatype="selected" :trimname="!!(~selected.name.indexOf('neuro/'))"/>
                    </h3>
                    <b-form-textarea v-if="editing" v-model="selected.desc" :rows="2"></b-form-textarea>
                    <p v-else style="opacity: 0.8">{{selected.desc}}</p>
                </b-container>
            </div>
            <br>
            <b-container>

                <b-row>
                    <b-col cols="2">
                        <span class="form-header">README</span>
                    </b-col>
                    <b-col>
                        <b-form-textarea v-if="editing" v-model="selected.readme" :rows="2"></b-form-textarea>
                        <div v-else>
                            <p v-if="!selected.readme" style="opacity: 0.5">No README</p>
                            <vue-markdown v-else :source="selected.readme" class="readme"/>
                        </div>
                        <br>
                    </b-col>
                </b-row>

                <b-row>
                    <b-col cols="2">
                        <span class="form-header">Admins</span>
                    </b-col>
                    <b-col>
                        <p><small style="opacity: 0.5">Users who are responsible for this datatype.</small></p>
                        <contactlist v-if="editing" v-model="selected.admins"></contactlist>
                        <div v-else>
                            <p v-if="!selected.admins || selected.admins.length == 0" style="opacity: 0.8">No admins.</p>
                            <p v-for="admin in selected.admins" :key="admin._id">
                                <contact :id="admin"/>
                            </p>
                        </div>
                        <br>
                    </b-col>
                </b-row>

                <b-row>
                    <b-col cols="2">
                        <span class="form-header">Visualizer</span>
                    </b-col>
                    <b-col>
                        {{uis}}
                        <!--TODO-->
                    </b-col>
                </b-row>

                <b-row>
                    <b-col cols="2">
                        <span class="form-header">Files/Dirs</span>
                    </b-col>
                    <b-col>
                        <p><small style="opacity: 0.5">The following files/dirs are expected to be part of this datatype</small></p>
                        <pre v-highlightjs="JSON.stringify(selected.files, null, 4)"><code class="json hljs"></code></pre>
                        <br>
                    </b-col>
                </b-row>

                <b-row>
                    <b-col cols="2">
                        <span class="form-header">Datatype Tags</span>
                    </b-col>
                    <b-col>
                        <p v-if="selected.datatype_tags.length > 0"><small style="opacity: 0.5">The following datatype tags are used for this datatype.</small></p>
                        <p v-else><small style="opacity: 0.5">No officially registered datatype tags</small></p>
                        <b-row v-for="(entry, idx) in selected.datatype_tags" :key="idx" style="margin-bottom: 5px;">
                            <b-col cols="3">
                                <span style="background-color: #ddd; padding: 2px 5px; display: inline-block;">{{entry.datatype_tag}}</span>
                            </b-col>
                            <b-col cols="9">
                                {{entry.desc}}
                            </b-col>
                        </b-row>

                        <p v-if="adhoc_datatype_tags.length > 0"><small style="opacity: 0.5">The following adhoc datatype tags are used for some datasets.</small></p>
                        <b-row v-for="tag in adhoc_datatype_tags" :key="tag" style="margin-bottom: 5px;">
                            <b-col cols="3">
                                <span style="background-color: #ddd; padding: 2px 5px; display: inline-block;">{{tag}}</span>
                            </b-col>
                            <b-col cols="9">
                                <span style="opacity: 0.7">Ad-hoc</span>
                            </b-col>
                        </b-row>

                        <br>
                    </b-col>
                </b-row>

                <b-row v-if="selected.bids.maps.length > 0">
                    <b-col cols="2">
                        <span class="form-header">BIDS Export</span>
                    </b-col>
                    <b-col>
                        <p><small style="opacity: 0.5">The following file mapping is used to generate BIDS derivative exports.</small></p>
                        <b>{{selected.bids.derivatives}}</b>
                        <pre v-highlightjs="JSON.stringify(selected.bids.maps, null, 4)"><code class="json hljs"></code></pre>
                        <br>
                    </b-col>
                </b-row>

                <b-row>
                    <b-col cols="2">
                        <span class="form-header">Apps</span>
                    </b-col>
                    <b-col>
                        <p>
                            <small style="opacity: 0.5">The following Apps uses this datatype for input.</small>
                        </p>
                        <div class="apps-container">
                            <app v-for="app in input_apps" :key="app._id" :app="app" class="app" height="270px"/>
                        </div>
                        <p v-if="input_apps.length == 0" style="opacity: 0.8">No App uses this datatype as input.</p>
                        <br>

                        <p>
                            <small style="opacity: 0.5">The following Apps uses this datatype for output.</small>
                        </p>
                        <div class="apps-container">
                            <app v-for="app in output_apps" :key="app._id" :app="app" class="app" height="270px"/>
                        </div>
                        <p v-if="output_apps.length == 0" style="opacity: 0.8">No App uses this datatype as output.</p>
                        <br>

                    </b-col>
                </b-row>

                <b-row v-if="selected.validator">
                    <b-col cols="2">
                        <span class="form-header">Validator</span>
                    </b-col>
                    <b-col>
                        <p><small style="opacity: 0.5">The following validator service is used to validate/normalize when a dataset of this datatype is imported by Brainlife UI.</small></p>
                        <p><a :href="'https://github.com/'+selected.validator"><b>{{selected.validator}}</b></a></p>
                        <!--<p v-else style="opacity: 0.8">No validator</p>-->
                        <br>
                    </b-col>
                </b-row>

            </b-container>
        </div>

        <div v-if="editing" class="form-action">
            <b-container>
                <b-button @click="cancel">Cancel</b-button>
                <b-button @click="submit" variant="primary">Submit</b-button>
            </b-container>
        </div>

    </div><!--page-content-->
</div>
</template>

<script>

import Vue from 'vue'
import Router from 'vue-router'

import 'perfect-scrollbar/css/perfect-scrollbar.css'
import PerfectScrollbar from 'perfect-scrollbar'
import VueMarkdown from 'vue-markdown'

import sidemenu from '@/components/sidemenu'
import datatypetag from '@/components/datatypetag'
import pageheader from '@/components/pageheader'
import contact from '@/components/contact'
import app from '@/components/app'
import contactlist from '@/components/contactlist'

export default {
    components: { sidemenu, pageheader, datatypetag, app, VueMarkdown, contact, contactlist } ,

    data () {
        return {
            ps: null,
            datatypes: null,
            //datatype_tags: null,
            selected: null, //selected datatype

            //for selected item
            apps: [], //apps that uses selected datatype
            adhoc_datatype_tags: [], //datatype tags associated with selected datatype

            uis: [],  //ui catalog
            
            //view_datatype_id: null,
            //count: 0, //total counts of datatypes (not paged)

            //user: Vue.config.user, //see if user is logged in

            /*
            //placeholder for dialog
            edit: {
                _id: null, //set if editing
                name: "",
                desc: "",
                access: "",

                admins: [],
                members: [],
            },
            */

            editing: false, 

            //query: "",

            config: Vue.config,
        }
    },

    computed: {
        input_apps() {
            if(!this.apps) return [];
            return this.apps.filter(a=>{
                return a.inputs.find(it=>it.datatype == this.selected._id);
            });
        },
        output_apps() {
            if(!this.apps) return [];
            return this.apps.filter(a=>{
                return a.outputs.find(it=>it.datatype == this.selected._id);
            });
        },
        canedit() {
            return ~this.selected.admins.indexOf(Vue.config.user.sub);
        }
    },

    mounted: function() {
        this.ps = new PerfectScrollbar(this.$refs.scrollable);
        this.$http.get('datatype/ui', {params: {}})
        .then(res=>{
            this.uis = res.body.uis;    
        });

        this.$http.get('datatype', {params: {
            sort: 'name'
        }})
        .then(res=>{
            this.datatypes = res.body.datatypes;
            //this.count = res.body.count;

            //select datatype selected by url
            this.selected = this.datatypes.find(d=>d._id == this.$route.params.id);
            //Vue.set(this.selected, "bids", JSON.stringify(this.selected.bids));
            this.$nextTick(()=>{
                this.scroll_to_selected();
            });
            
            /*
            //load datatype_tags from all apps
            //from appedit
            // could return this promise or just have it all here...leaving it as is for now
            this.$http.get('app', {params: {
                select: 'inputs outputs',
                order: 'name',
            }}).then(res=>{
                var v = this;
                v.datatype_tags = {};
                v.datatypes.forEach(type=>{
                    v.datatype_tags[type._id] = [];
                });
                
                function aggregate_tags(dataset) {
                    if(!dataset.datatype_tags) return;
                    dataset.datatype_tags.forEach(tag=>{
                        if (!~v.datatype_tags[dataset.datatype].indexOf(tag)) v.datatype_tags[dataset.datatype].push(tag);
                    });
                }
                res.body.apps.forEach(app=>{
                    app.inputs.forEach(aggregate_tags);
                    app.outputs.forEach(aggregate_tags);
                });
                
                this.handle_route_params();
                
                // console.log(v.datatype_tags);
            });
            */
        }).catch(console.error);

        //this.scroll_to_active();
    },

    methods: {
        
        select(datatype) {
            this.selected = datatype;
            this.$router.push(`/datatypes/${datatype._id}`);
        },

        scroll_to_selected: function() {
            if(!this.selected) return;
            //scroll to selected datatype if it's out the scroll window
            var e = document.getElementById(this.selected._id);
            var area = this.$refs.scrollable;
            if(area.clientHeight + area.scrollTop < e.offsetTop) {
                area.scrollTop = e.offsetTop - area.clientHeight/2;
            }

            //I also need to scroll back to top if area is above..
            if(e.offsetTop < area.scrollTop) {
                area.scrollTop = e.offsetTop - 300;
            }
        },
        
        get_datatypes(prefix) {
            return this.datatypes.filter(d=>{
                if(~d.name.indexOf(prefix)) {
                    return true;
                }
                return false;
            }); 
        },

        get_not_datatypes(prefix) {
            return this.datatypes.filter(d=>{
                if(!~d.name.indexOf(prefix)) {
                    return true;
                }
                return false;
            }); 
        },

        get_official_desc(tag) {
            if(!this.selected.datatype_tags) return;
            return this.selected.datatype_tags.find(d=>d.datatype_tag == tag);
        },

        edit() {
            this.editing = true;
        },

        newdatatype() {
            this.selected = {
                name: "tbd",
                desc: "tbd desc",
                readme: "tdb readme",
                admins: [ Vue.config.user.sub ],
                files: [],
                datatype_tags: [],
                bids: {
                    derivatives: "",
                    maps: [],
                },
            }
            this.editing = true;
        },

        cancel() {
            if(this.selected._id) {
                //revert by loading previous state
                this.$http.get('datatype', {params: {
                    sort: 'name',
                    find: JSON.stringify({_id: this.selected._id}),
                }}).then(res=>{
                    Object.assign(this.selected, res.body.datatypes[0]);
                });
            } else {
                this.selected = null;
            }
            this.editing = false; 
        },
        
        submit() {
        },

        trim(n) {
            return n.split("/").splice(1).join("/");
        },

        gethsl(n) {
            let hash = n.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
            let numhash = Math.abs(hash+120)%360;
            return "hsl("+(numhash%360)+", 50%, 60%)";
        },
    },

    destroyed() {
        this.ps.destroy();
    },
  
    watch: {
        selected() {
            if(!this.selected) return; 
            if(!this.selected._id) return; //editing new

            //load apps that uses this datatype
            this.$http.get('app', {params: {
                find: JSON.stringify({
                    removed: false,
                    $or: [
                        {'inputs.datatype': this.selected._id},
                        {'outputs.datatype': this.selected._id},
                    ]
                }),
                //populate: 'projects',
                select: 'name desc inputs outputs stats github',
            }}).then(res=>{
                this.apps = res.body.apps;
            })

            //load adhoc datatype_tags used for this datatype
            let registered_datatype_tags = this.selected.datatype_tags.map(entry=>entry.datatype_tag);
            this.$http.get('dataset/distinct', {params: {
                distinct: 'datatype_tags',
                find: JSON.stringify({
                    removed: false,
                    datatype: this.selected._id,
                    datatype_tags: {$nin: registered_datatype_tags},
                }),
                
            }}).then(res=>{
                this.adhoc_datatype_tags = res.body;
            });

        },
        /*
        '$route': function() {
            this.handle_route_params();
        }
        */
    }
}
</script>

<style>
.el-card {
box-shadow: none;
}
</style>

<style scoped>
.datatype-list {
position: fixed;
top: 50px;
bottom: 0px;
left: 50px;
width: 300px;
background-color: #444;
}
.datatype-list h4 {
font-size: 18px;
padding: 20px 10px;
text-transform: uppercase;
margin-bottom: 0px;
color: #777;
font-weight: bold;
}
.datatype-list h5 {
font-size: 15px;
padding: 10px 10px;
text-transform: uppercase;
margin-bottom: 0px;
color: #999;
font-weight: bold;
}
.datatype-list .item {
padding: 5px 10px;
margin-bottom: 0px;
color: white;
transition: background-color 0.5s;
font-size: 95%;
}
.datatype-list .item:hover {
cursor: pointer;
background-color: black;
}
.datatype-list .item.selected {
background-color: #007bff;
/*
background-color: white;
color: #000;
*/
}
.button-fixed {
opacity: 0;
left: 250px;
}
.datatype-list:hover .button-fixed {
opacity: 0.8;
}
.datatype-list:hover .button-fixed:hover {
opacity: 1;
}
.page-content {
margin-left: 300px;
}
.page-content h4 {
text-transform: uppercase;
color: gray;
font-size: 17pt;
font-weight: bold;
}
.header {
padding: 20px;
background-color: white;
border-bottom: 1px solid #eee;
}
.apps-container {
display: flex;
flex-wrap: wrap;
}
.apps-container .app {
margin-right: 10px;
margin-bottom: 10px;
width: 400px;
box-sizing: border-box;
}
code.json {
background-color: white;
}
.form-action {
text-align: right;
position: fixed;
bottom:0;
right:0;
left:350px;
background-color: rgba(100,100,100,0.4);
padding: 10px;
}
</style>
