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
        
        grab_datasets: function(params, cb) {
            // select2 page parameter -> determines what new 'page' of data to get for the dropdown menu
            // but it's not set on its initial call, so we have to set it to 1 when it's undefined
            if (!params.page) {
                params.page = 1;
                
                // when we load new dropdown items, we must discard the old ones
                this.input_dialog.datasets_groups = {};
            }
            
            //construct dataset find query
            // first, make sure what is retrieved is coherent with our filters
            // subject filter
            // retrieve any dataset that matches any of the selected subjects
            var subject_filter = [];
            for (var ii in this.selected_subjects) {
                var selected_subject = this.selected_subjects[ii];
                subject_filter.push({
                    "meta.subject": selected_subject
                });
            }
            
            // datatype filter
            // also make sure that each dataset we retrieve matches any of the selected datatypes
            var datatype_filter = [];
            for (var ii in this.selected_datatypes) {
                var selected_datatype = this.selected_datatypes[ii];
                datatype_filter.push({
                    "datatype": selected_datatype
                });
            }
            
            // list of things that must be true for each dataset to have met the conditions for validity
            var and_statement = [];
            
            // if there's a filter for datatypes, subjects, etc., then use it for filtering
            if (datatype_filter.length > 0) and_statement.push({ $or: datatype_filter });
            if (subject_filter.length > 0) and_statement.push({ $or: subject_filter });
            
            // make sure all of the and statement values are true
            var find = {};
            if (and_statement.length > 0)
                find.$and = and_statement;
            
            find.project = this.input_dialog.project;
            find.removed = false;
            
            // user query
            if (params.term)
                find.$text = { $search: params.term };
            
            // final data retrieval parameters
            var filter_params = {};
            filter_params.find = JSON.stringify(find);
            
            // other data retrieval options
            var skip = (params.page - 1) * this.limit;
            
            filter_params.limit = this.limit;
            filter_params.skip = skip;
            filter_params.sort = 'meta.subject -create_date';
            
            // list of dropdown menu items to return
            var dropdown_items = [];
            
            //now load datasets
            this.$http.get('dataset', { params: filter_params })
            .then(res => {
                var datasets = res.body.datasets;
                
                datasets.forEach(dataset => {
                    this.datasets[dataset._id] = dataset;
                    
                    // dropdown menu item to add
                    var item_to_append = {
                        id: dataset._id
                    };
                    var subject = null;
                    var dropdown_item_text = [];
                    var title = null, show_title = true;
                    
                    // check if subject name is there, if so, put it in the dropdown item
                    if (dataset.meta && dataset.meta.subject) {
                        subject = dataset.meta.subject;
                        dropdown_item_text.push(subject);
                    }
                    else {
                        subject = "no subject name; unique key: " + Math.random();
                        show_title = false;
                    }
                    
                    //  check if the subject needs a title or not
                    if (!this.input_dialog.datasets_groups[subject]) {
                        this.input_dialog.datasets_groups[subject] = [];
                        
                        if (show_title)
                            title = subject;
                    }
                    
                    // if there's a datatype, add it to the dropdown string
                    if (dataset.datatype) {
                        var datatype_name = this.datatypes[dataset.datatype].name;
                        dropdown_item_text.push(datatype_name);
                    }
                    
                    // if there's datatype tags, add them to the dropdown string
                    if (dataset.datatype_tags) {
                        // join all datatype tags so that the resultant string looks like:
                        // <tag1> <tag2> <tag3>
                        var tags = "";
                        for (var tag of dataset.datatype_tags)
                            tags += " <" + tag + "> ";
                        dropdown_item_text.push(tags);
                    }
                    
                    // if there's a date, add it to the dropdwon string
                    if (dataset.create_date) {
                        var date = new Date(dataset.create_date).toString();
                        date = " | " + date;
                        dropdown_item_text.push(date);
                    }
                    
                    item_to_append.text = dropdown_item_text.join(" ");
                    
                    // if there's a title, place it before this dropdown item
                    if (title) {
                        item_to_append = {
                            text: title,
                            children: [item_to_append]
                        };
                    }
                    
                    // add the item to the dropdown menu
                    dropdown_items.push(item_to_append);
                });
                
                // let select2 know that we're done retrieving items
                cb({
                    results: dropdown_items,
                    pagination: {
                        // only load more items if there's more items to load
                        more: skip + res.body.datasets.length < res.body.count,
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
