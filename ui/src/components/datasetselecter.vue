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
                    <projectselecter v-model="input_dialog.project"></projectselecter>
                </el-form-item>
                <div style="background-color: #eee; padding: 20px 20px 1px 20px; margin-bottom: 10px;">
                    <h4>Filters</h4>
                    <el-form-item label="Subject" v-if="subjects">
                        <select2 style="width: 100%; max-width: 100%;" @input="selected_subjects = $event" :options="subjects"></select2>
                    </el-form-item>
                    <el-form-item label="Datatype" v-if="datatypes_s2">
                        <select2 style="width: 100%; max-width: 100%;" @input="selected_datatypes = $event" :options="datatypes_s2"></select2>
                    </el-form-item>
                </div>
                <!--
                <el-form-item label="Datatype Tags">
                    <select2 style="width: 100%; max-width: 100%;" @input="update_selected_tags" :options="alltags"></select2>
                </el-form-item>
                -->
                <el-form-item label="Datasets">
                    <select2 style="width: 100%; max-width: 100%;" :dataAdapter="debounce_grab_datasets" @input="input_dialog.datasets = $event"></select2>
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

var debounce = {};

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
            },
            
            selected: JSON.parse(localStorage.getItem('datasets.selected')) || {},
            selected_subjects: [],
            selected_datatypes: [],

            limit: 50,

            //caches
            datatypes: {}, 
            subjects: null,
            datatypes_s2: null,
            datasets: {}, //list of all datasets loaded
            
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
            var dids = this.input_dialog.datasets;
            if(!dids) return;
            var os = {};
            dids.forEach(did=>{ 
                os[did] = this.datasets[did];
            });
            this.$emit('submit', os);
        },
        
        //TODO - this is complicated/buggy (filtering by suject doesn't work) ... needs to be simplified
        grab_datasets: function(params, cb) {
            if (!params.page) {
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
                removed: false,
            };
            if (params.term) find.$text = { $search: params.term || "" };
            if (this.selected_subjects.length > 0) and.push( { $or: criteria } );
            if (this.selected_datatypes.length > 0) and.push( { $or: criteria2 } );
            //if (this.selected_tags.length > 0) and.push( { $or: criteria3 } );
            if (and.length > 0) find.$and = and;
 
            //now load datasets
            var skip = (params.page - 1) * this.limit;
            console.log("skip", skip, "limit", this.limit);
            this.$http.get('dataset', { params: {
                find: JSON.stringify(find),
                limit: this.limit,
                skip,
                sort: 'meta.subject -create_date'
            } }).then(res => {
                var data = [];
                var option_group_by_subject = {};
                var shownUp = {};
                var titlesFor = {};

                res.body.datasets.forEach(dataset=>{
                    
                    this.datasets[dataset._id] = dataset;

                    //ignore ones that doesn't have subject for now..
                    if(!dataset.meta || !dataset.meta.subject) return;
                    var subject = dataset.meta.subject.toString(); //sometime it's not string
                    
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

                    //filter out dataset that doesn't match the query on various elements (TODO - can't we do this via mongo?)
                    var date_text = new Date(dataset.create_date).toString().replace(/[ ]*GMT\-.*?$/g, "");

                    //TODO - we should use templateSelection / templateResult to show more customized text/label
                    //subject should be displayed under templateResult but not on templateSelection
                    var object = { id: dataset._id, text: `${subject} ${this.datatypes[dataset.datatype].name} ${text_tags} | ${date_text}` };
                    function query_filter(object, term) {
                        if (!term) return true;
                        return !!~object.text.replace(/[ \t]+/g, "").toLowerCase().indexOf(term.replace(/[ \t]+/g, "").toLowerCase());
                    }
                    if (query_filter(object, params.term) || query_filter({ text: subject }, params.term)) {
                        option_group_by_subject[subject].push(object);
                    }
                });
                
                //filter out subjects with no datasets (should we really do that?)
                //also filter out subjects that are already in the list?
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
                        more: skip+res.body.datasets.length < res.body.count,
                    },
                });
            });
        },
        
        debounce_grab_datasets: function(params, cb) {
            clearTimeout(debounce);
            debounce = setTimeout(()=>{
                this.grab_datasets(params, cb)
            }, 300);
        },
    },

    watch: {
        visible: function(v) {
            this.visible_ = v;
        },
        visible_: function(v) {
            this.$emit('update:visible', v);
        },

        "input_dialog.project": function(project) {
            this.$http.get('dataset/distinct', { params: {
                find: JSON.stringify({
                    project: this.input_dialog.project,
                }),
                distinct: 'meta.subject',
            }}).then(res=>{
                this.subjects = res.body;
                console.dir(this.subjects);
            });
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
