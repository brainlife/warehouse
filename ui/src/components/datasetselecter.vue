<template>
<b-modal title="Select Datasets" ref="modal" id="datasetSelecter" @ok="submit">
    <el-form label-width="120px">
    <div style="background-color: #fff; padding: 10px 10px 1px 10px;">
        <el-form-item label="Project">
            <projectselecter v-model="project"></projectselecter>
        </el-form-item>
    </div>
    <div style="background-color: #eee; padding: 10px 10px 1px 10px; margin-bottom: 10px;">
        <b>Filters</b>
        <el-form-item label="Subject" v-if="subjects">
            <select2 style="width: 100%; max-width: 100%;" v-model="selected_subjects" :options="subjects" :multiple="true"></select2>
        </el-form-item>
        <el-form-item label="Datatype" v-if="datatypes_s2">
            <select2 style="width: 100%; max-width: 100%;" v-model="selected_datatypes" :options="datatypes_s2" :multiple="true"></select2>
        </el-form-item>
    </div>
    <div style="background-color: #fff; padding: 10px 10px 1px 10px;">
        <el-form-item label="Datasets">
            <select2 style="width: 100%; max-width: 100%;" v-model="datasets" :dataAdapter="debounce_grab_datasets" :multiple="true"></select2>
        </el-form-item>
    </div>
    </el-form>
</b-modal>
</template>

<script>
import Vue from 'vue'
import tags from '@/components/tags'
import metadata from '@/components/metadata'
import projectselecter from '@/components/projectselecter'
import select2 from '@/components/select2'
import datatypetag from '@/components/datatypetag'

var debounce = {};

export default {
    components: { metadata, tags, projectselecter, select2, datatypetag },
    props: [ 'visible' ],
    data() {
        return {
            //datasets selected via datasets page
            selected: JSON.parse(localStorage.getItem('datasets.selected')) || {},

            project: null, //selected project
            datasets: null, //user selected dataset

            //use selected filter 
            selected_subjects: [],
            selected_datatypes: [],

            datasets_groups: {}, //group by subject
            limit: 50,

            //caches
            datatypes: null, 
            datatypes_s2: [], 
            subjects: null,
            alldatasets: {}, //list of all datasets ever loaded
            
            config: Vue.config,
        }
    },

    methods: {
        close: function() {
            console.log("resetting datasetselecter");
            this.selected_subjects = [];
            this.selected_datatypes = [];
            this.datasets = [];
        },

        hide: function() {
            this.$emit('update:visible', false);
        },

        submit: function() {
            if(this.datasets.length) {
                var os = {}; 
                this.datasets.forEach(did=>{ 
                    os[did] = this.alldatasets[did];
                });
                this.$emit('submit', os);
            }
            this.close();
        },

        grab_datasets: function(params, cb) {
            // select2 page parameter -> determines what new 'page' of data to get for the dropdown menu
            // but it's not set on its initial call, so we have to set it to 1 when it's undefined
            if (!params.page) {
                params.page = 1;
                
                // when we load new dropdown items, we must discard the old ones
                this.datasets_groups = {};
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
            var find = {
                project: this.project,
                storage: {$exists: true},
                removed: false
            };
            if (and_statement.length > 0) find.$and = and_statement;
            if (params.term) find.$text = { $search: params.term };
            
            // final data retrieval parameters
            var skip = (params.page - 1) * this.limit;
            var filter_params = {
                find: JSON.stringify(find),
                limit: this.limit,
                skip: (params.page - 1) * this.limit,
                sort: 'meta.subject -create_date',
                //populate: 'datatype', 
            };
            
            // list of dropdown menu items to return
            var dropdown_items = [];
            
            //now load datasets
            this.$http.get('dataset', { params: filter_params })
            .then(res => {
                var datasets = res.body.datasets;
                
                datasets.forEach(dataset => {
                    //console.dir(dataset);
                    
                    // create catalog of all datasets
                    this.alldatasets[dataset._id] = dataset;
                    
                    var subject = "(non-existing)";
                    if (dataset.meta && dataset.meta.subject) subject = dataset.meta.subject;
                    
                    // dropdown menu item to add
                    var item = {
                        id: dataset._id,
                        //text: subject,
                        date: dataset.create_date,
                        datatype: this.datatypes[dataset.datatype],
                        tags: dataset.datatype_tags
                    };

                    if (!this.datasets_groups[subject]) {
                        // first time
                        this.datasets_groups[subject] = true;
                        
                        // append - select2 allows me to append item by doing following crap
                        dropdown_items.push({
                            text: subject,
                            children: [item]
                        });
                    } else {
                        // every other time
                        dropdown_items.push(item);
                    }
                });
                
                // let select2 know that we're done retrieving items
                cb({
                    results: dropdown_items,
                    pagination: {
                        // only load more items if there's more items to load
                        more: filter_params.skip + res.body.datasets.length < res.body.count,
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
            console.log("visibility changed", v);
            if(v) this.$refs.modal.show() 
            else this.$refs.modal.hide() 
        },

        project: function(project) {
            this.$http.get('dataset/distinct', { params: {
                find: JSON.stringify({
                    project: this.project,
                }),
                distinct: 'meta.subject',
            }}).then(res=>{
                this.subjects = res.body;
            });
         }
    },

    mounted() {
        //I should display this at root
        document.body.appendChild(this.$refs.modal.$el);
    },
    destoyed() {
        //TODO - not sure if this prevents the memory leak? Should I move it back to this component?
        //document.body.remove(this.$refs.modal.$el);
    },

    created: function() {
        //load datatypes
        this.$http.get('datatype', {params: {
            find: JSON.stringify({
                //removed: false,
            }),
            sort: 'name'
        }}).then(res=>{
            this.datatypes = {};
            res.body.datatypes.forEach(datatype=>{
                this.datatypes[datatype._id] = datatype;
                this.datatypes_s2.push({ id: datatype._id, text: datatype.name });
            });
        });
    }
}
</script>

