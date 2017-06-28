<template>
    <el-dialog title="Select Datasets" :visible.sync="visible_">
        <!--<p class="text-muted">need to stage your datasets to be processed.</p>-->
        <el-tabs v-model="input_dialog.mode">
              
            <el-tab-pane label="Selected Datasets" name="selected">
                <p class="text-muted" v-if="Object.keys(selected).length == 0">Please go to <a href="#/datasets">Datasets</a> page to select datasets.</p>
                <p class="text-muted" v-else>We will stage following datasets you have selected.</p>
                <ul style="list-style: none;margin: 0px; padding: 0px; max-height: 200px; overflow: auto;">
                    <li v-for="(select, did) in selected" :key="did" style="margin-bottom: 2px;">
                        <metadata :metadata="select.meta"></metadata>
                        {{select.name}} 
                        <tags :tags="select.datatype_tags"></tags>
                    </li>
                </ul>
            </el-tab-pane>

            <el-tab-pane label="From Warehouse" name="warehouse">
                <el-form label-width="120px">
                <el-form-item label="Project">
                    <projectselecter v-model="input_dialog.project" @change="input_project_changed(project)"></projectselecter>
                </el-form-item>
                <el-form-item label="Subject">
                    <select2 style="width: 100%; max-width: 100%;" @input="update_selected_subjects" :dataAdapter="debounce_grab_subjects"></select2>
                </el-form-item>
                <el-form-item label="Datatype">
                    <select2 style="width: 100%; max-width: 100%;" @input="update_selected_datatypes" :options="datatypes_s2"></select2>
                </el-form-item>
                <!--
                <el-form-item label="Datatype Tags">
                    <select2 style="width: 100%; max-width: 100%;" @input="update_selected_tags" :options="alltags"></select2>
                </el-form-item>
                -->
                <el-form-item label="Datasets">
                    <select2 style="width: 100%; max-width: 100%;" :dataAdapter="debounce_grab_datasets" @input="update_selected_datasets"></select2>
                </el-form-item>
                </el-form>
            </el-tab-pane>

        </el-tabs>
        <span slot="footer" class="dialog-footer">
            <el-button @click="close">Cancel</el-button>
            <el-button type="primary" @click="submit" icon="check">Stage</el-button>
        </span>
    </el-dialog>
</template>

<script>
import Vue from 'vue'
import tags from '@/components/tags'
import metadata from '@/components/metadata'
import projectselecter from '@/components/projectselecter'
import select2 from '@/components/select2'

export default {
    components: { metadata, tags, projectselecter, select2 },
    props: [ 'visible' ],
    data() {
        return {
            visible_: false,
            input_dialog: {
                mode: "selected",

                //for warehouse download
                project: null,
                dataset: null, //selected dataset
                datasets_groups: {}, //group by subject
                datatypes_groups: {},
                subjects_groups: {},
                tags_groups: {}
            },
            
            tmp: {
                debounce: {}
            },

            selected: JSON.parse(localStorage.getItem('datasets.selected')) || {},
            selected_subjects: [],
            selected_datatypes: [],
            //selected_tags: [],

            limit: 50,

            //caches
            datatypes: {}, 
            
            config: Vue.config,
        }
    },
    methods: {
        close: function() {
            this.$emit('update:visible', false);
            //this._visible = false;
        },
        submit: function() {
            if(this.input_dialog.mode == "selected") this.submit_selected();
            if(this.input_dialog.mode == "warehouse") this.submit_dataset();
            this.close();
        },

        submit_selected: function() {
            this.$emit('submit', this.selected);
        },

        submit_dataset: function() {
            var did = this.input_dialog.dataset;
            if(!did) return;

            //need to look for this dataset
            for(var subject in this.input_dialog.datasets_groups) {
                var datasets = this.input_dialog.datasets_groups[subject];
                datasets.forEach(dataset=>{
                    if(dataset._id == this.input_dialog.dataset) {
                        var o = {};
                        o[this.input_dialog.dataset]= dataset;
                        //this.submit_stage(o);
                        this.$emit('submit', o);
                    }
                });
            }

            //I am not sure why this was updated..
            /*
            var dids = this.input_dialog.dataset;
            
            if(!dids) return;
            if (!(dids instanceof Array))
                dids = [dids];
            
            this.$http.get('dataset', { params: {
                find: JSON.stringify({
                    _id: { $in: dids }
                })
            }}).then(res => {
                var datasets = res.body.datasets;
                var o = {};
                
                datasets.forEach(dataset => {
                    o[dataset._id]= dataset;
                });
                
                this.submit_stage(o);
            });
            */
        },

        grab_datasets: function(params, cb) {
            if (!('page' in params)) {
                params.page = 1;
                this.input_dialog.datasets_groups = {};
            }
            
            //construct dataset find query
            var data = {};
            var criteria = this.selected_subjects.map((value) => { return { "meta.subject": value }; });
            var criteria2 = this.selected_datatypes.map((value) => { return { "datatype": value } })
            //var criteria3 = this.selected_tags.map((value) => { return { "datatype_tags": value } })
            var and = [];
            var find = {
                project: this.input_dialog.project,
                removed: false
            };
            if (params.term) find.$text = { $search: params.term || "" };
            if (this.selected_subjects.length > 0) and.push( { $or: criteria } );
            if (this.selected_datatypes.length > 0) and.push( { $or: criteria2 } );
            //if (this.selected_tags.length > 0) and.push( { $or: criteria3 } );
            if (and.length > 0) find.$and = and;
            
            //now load datasets
            this.$http.get('dataset', { params: {
                find: JSON.stringify(find),
                limit: this.limit,
                skip: (params.page - 1) * this.limit,
                sort: 'meta.subject -create_date'
            } }).then(res => {

                var data = [];
                var option_group_by_subject = {};
                var shownUp = {};
                var titlesFor = {};
                
                res.body.datasets.forEach(dataset=>{

                    //ignore ones that doesn't have subject for now..
                    if(!dataset.meta || !dataset.meta.subject) return;
                    var subject = dataset.meta.subject;
                    
                    //organize datasets for select2
                    if(!this.input_dialog.datasets_groups[subject]) {
                        titlesFor[subject] = false;
                        this.input_dialog.datasets_groups[subject] = [];
                    } else if (!shownUp[subject]) titlesFor[subject] = true;
                    shownUp[subject] = true;
                    option_group_by_subject[subject] = option_group_by_subject[subject] || [];
                    this.input_dialog.datasets_groups[subject].push(dataset);
                    
                    //stripping text that shouldn't be part of select2? (can't select2 take care of this?)
                    var text_tags = dataset.datatype_tags.length != 0 ?
                                    dataset.datatype_tags.toString()
                                          .replace(/\[/g, "<")
                                          .replace(/\]/g, ">")
                                          .replace(/,/g, "> <")
                                    : "";
                    var date_text = new Date(dataset.create_date).toString().replace(/[ ]*GMT\-.*?$/g, "");
                    console.log(this.datatypes);
                    var object = { id: dataset._id, text: `${this.datatypes[dataset.datatype].name} ${text_tags} | ${date_text}` };

                    //not sure what this is about..
                    if (this.query_filter(object, params.term) || this.query_filter({ text: subject }, params.term)) {
                        option_group_by_subject[subject].push(object);
                    }
                });
                
                //??
                for (var k in option_group_by_subject) {
                    var group = option_group_by_subject[k];
                    var toBeAdded = { text: k, children:group };
                    if (group.length == 0) continue;
                    if (titlesFor[k]) toBeAdded = group
                    data.push(toBeAdded);
                }

                cb({
                    results: data,
                    pagination: {
                        more: res.body.datasets.length
                    },
                });
            });
        },

        /*
        //load tags from all apps and create a catalog
        load_app_tags: function() {
            return new Promise((resolve, reject)=>{
                this.$http.get('datatype', {params: {
                    select: 'tags',
                }}).then(res=>{
                    var alltags = []; 
                    console.dir(res.body.apps);
                    res.body.apps.forEach(app=>{
                        if(app.tags) app.tags.forEach(tag=>{
                            if(!~alltags.indexOf(tag)) alltags.push(tag);
                        });
                    });
                    resolve(alltags);
                }, reject);
            });
        }
        */
        
        grab_subjects: function(params, cb) {
            if (!('page' in params)) {
                params.page = 1;
                this.input_dialog.subjects_groups = {};
            }
            
            var data = {};
            var find = { $match: {
                    name: {
                        $regex: params.term || "",
                        $options: 'i'
                    }
                }
            };
            
            this.$http.get('dataset', { params: {
                find: JSON.stringify(find),
                limit: this.limit,
                skip: (params.page - 1) * this.limit,
                //sort: JSON.stringify({ 'meta.subject': -1 }), //doesn't seem to work
                distinct: '$meta',
            } }).then(res => {
                var data = [];

                res.body.forEach(obj => {
                    if(!obj._id) return;
                    var subject = obj._id.subject.toString(); //sometime it's not string
                    var object = { id: subject, text: subject };
                    
                    if (!this.input_dialog.subjects_groups[subject])
                        this.input_dialog.subjects_groups[subject] = true;
                    else return;
                    
                    if (this.query_filter(object, params.term)) {
                        data.push(object);
                    }
                });

                //return data to select2
                cb({
                    results: data,
                    pagination: {
                        //more: data.length != 0 && howMany == this.limit
                        more: res.body.length,
                    }
                });
            });
        },
        
        debounce_grab_subjects: function(params, cb) {
            let self = this;
            this.debounce(() => self.grab_subjects(params, cb), 300);
        },
        debounce_grab_datasets: function(params, cb) {
            let self = this;
            this.debounce(() => self.grab_datasets(params, cb), 300);
        },
        query_filter: function(object, term) {
            if (!term) return true;
            return !!~object.text.replace(/[ \t]+/g, "").toLowerCase().indexOf(term.replace(/[ \t]+/g, "").toLowerCase());
        },
        
        debounce: function(f, timeout) {
            let self = this;
            let token = Math.random();
            
            this.tmp.debounce[f] = token;
            
            setTimeout(function() {
                if (token != self.tmp.debounce[f])
                    return;
                f();
            }, timeout);
        },
        
        update_selected_datasets: function(selected) {
            this.input_dialog.dataset = selected;
        },
        
        update_selected_subjects: function(selected) {
            this.selected_subjects = selected;
        },
        
        update_selected_datatypes: function(selected) {
            this.selected_datatypes = selected;
        },
        
        /*
        update_selected_tags: function(selected) {
            this.selected_tags = selected;
        },
        */
    },

    watch: {
        visible: function(v) {
            //console.log("upstream visible flag changed", v);
            this.visible_ = v;
        },
        visible_: function(v) {
            //console.log("own _visible flag changed", v);
            this.$emit('update:visible', v);
        }
    },

    mounted: function() {
        this.visible_ = this.visible; //initial value (always false?)

        //load datatypes
        this.$http.get('datatype', {params: {
            find: JSON.stringify({
                //removed: false,
            })
        }}).then(res=>{
            this.datatypes = {};
            res.body.datatypes.forEach(datatype=>{
                this.datatypes[datatype._id] = datatype;
            });
        });
    },

    computed: {
        datatypes_s2: function() {
            var s2 = [];
            for(var did in this.datatypes) {
                s2.push({id: did, text: this.datatypes[did].name});
            }
            return s2;
        }
    },
}
</script>
