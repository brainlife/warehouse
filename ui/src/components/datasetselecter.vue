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
                    <select2 style="width: 100%; max-width: 100%;" @input="update_selected_subjects" :dataAdapter="debounce_function(grab_subjects)"></select2>
                </el-form-item>
                <el-form-item label="Datatype" v-if="datatypes_s2">
                    <select2 style="width: 100%; max-width: 100%;" @input="update_selected_datatypes" :options="datatypes_s2"></select2>
                </el-form-item>
                <!--
                <el-form-item label="Datatype Tags">
                    <select2 style="width: 100%; max-width: 100%;" @input="update_selected_tags" :options="alltags"></select2>
                </el-form-item>
                -->
                <el-form-item label="Datasets">
                    <select2 style="width: 100%; max-width: 100%;" :dataAdapter="debounce_function(grab_datasets)" @input="update_selected_datasets"></select2>
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
                groups: {},          // generic groups
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
            datatypes_s2: null,
            
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
            // var did = this.input_dialog.datasets;
            // if(!did) return;

            // //need to look for this dataset
            // for(var subject in this.input_dialog.datasets_groups) {
            //     var datasets = this.input_dialog.datasets_groups[subject];
            //     datasets.forEach(dataset=>{
            //         if(dataset._id == this.input_dialog.dataset) {
            //             var o = {};
            //             o[this.input_dialog.dataset]= dataset;
            //             //this.submit_stage(o);
            //             this.$emit('submit', o);
            //         }
            //     });
            // }

            var dids = this.input_dialog.datasets;
            
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
                
                this.$emit("submit", o);
            });
        },
        
        /**
         * @desc Generic adapter for result filtering, use this for all filters except datasets, since it has pre-, mid-, and post-code that is specific to its needs
         *
         * @param params -> chained from jquery->select2, contains information about the user's original query (noteworthy: params.text is what they typed in)
         * @param cb -> when called, you tell it hey I'm done, and I have data for you! A child of the callback object called 'results' functions the same as original select2 options
         * @param getWhere -> where to GET data from (dataset, datatype, etc.)
         * @param gParams -> JSON to give to the GET packet
         * @param unique_name -> some name for this adapter; doesn't have to be creative, but it allows global knowledge to still take place from within this function
         * @param fBody -> function that takes in the result from the GET request, and returns where the items are (like res.body)
         * @param fText -> function that takes in an object from within fBody(), and returns what to use as its 'text' option for select2
         * @param fId -> function that does the same thing as fText, except returns 'id'
         * @returns absolutely nothing
         *
         * If you need an example for use, see this.grab_subjects
        */
        generic_adapter: function(params, cb, getWhere, gParams, unique_name, fBody, fText, fId) {
            this.input_dialog.groups[unique_name] = this.input_dialog.groups[unique_name] || {};
            if (!('page' in params)) {
                params.page = 1;
                this.input_dialog.groups[unique_name] = {};
            }
            
            var data = {};
            
            this.$http.get(getWhere, { params: gParams }).then(res => {
                var data = [];
                var howMany = 0;
                
                fBody(res).forEach(obj => {
                    var text = fText(obj), id = fId(obj);
                    var object = { text, id };
                    
                    if (!this.input_dialog.groups[unique_name][id])
                        this.input_dialog.groups[unique_name][id] = true;
                    else
                        return;
                    
                    // additional filter
                    if (this.query_filter(object, params.term)) {
                        ++howMany;
                        data.push(object);
                    }
                });
                
                var r = {};
                r.results = data;
                r.pagination = {};
                r.pagination.more = data.length != 0 && howMany == this.limit;
                cb(r);
            });
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
                        more: data.length != 0 && data.length == this.limit
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
            var find = { $match: {
                    name: {
                        $regex: params.term || "",
                        $options: 'i'
                    }
                }
            };
            var gParams = {
                find: JSON.stringify(find),
                limit: this.limit,
                skip: ((params.page || 1) - 1) * this.limit,
                sort: JSON.stringify({ meta: -1 }),
                distinct: '$meta'
            };
            
            return this.generic_adapter(params, cb, 'dataset', gParams, 'subjects', (r) => r.body, (o) => o._id.subject, (o) => o._id.subject);
        },
        
        debounce_function: function(f) {
            return (params, cb) => {
                let self = this;
                this.debounce(() => f(params, cb), 300);
            };
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
            // a.k.a. this.input_dialog.dataset will be an array
            this.input_dialog.datasets = selected;
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
            }),
            sort: 'name'
        }}).then(res=>{
            this.datatypes = {};
            this.datatypes_s2 = [];
            
            res.body.datatypes.forEach(datatype=>{
                this.datatypes[datatype._id] = datatype;
                this.datatypes_s2.push({ id: datatype._id, text: datatype.name });
            });
        });
    }
}
</script>
