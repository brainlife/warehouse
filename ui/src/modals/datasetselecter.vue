<template>
<b-modal title="Stage Data" ref="modal" id="datasetSelecter" size="lg" @ok="submit" ok-only>
    <b-row>
        <b-col><span class="form-header">From</span></b-col>
        <b-col cols="9">
            <projectselector ref="psel" v-model="project" :required="true" />
        </b-col>
    </b-row>
    <br>

    <div style="background-color: #eee; padding: 15px; opacity: 0.8;">
        <p><b>Filter</b></p>
        <b-row v-if="subjects">
            <b-col><span class="form-header">Subject</span></b-col>
            <b-col cols="9">
                <select2 style="width: 100%; max-width: 100%;" v-model="selected_subjects" :options="subjects" :multiple="true"></select2>
            </b-col>
        </b-row>
        <br>
        <b-row v-if="datatypes_s2">
            <b-col><span class="form-header">Datatype</span></b-col>
            <b-col cols="9">
                <select2 style="width: 100%; max-width: 100%;" v-model="selected_datatypes" :options="datatypes_s2" :multiple="true"></select2>
            </b-col>
        </b-row>
    </div>
    <br>

    <b-row>
        <b-col><span class="form-header">Data-Objects</span></b-col>
        <b-col cols="9">
            <select2 style="width: 100%; max-width: 100%;" v-model="datasets" :dataAdapter="debounce_grab_datasets" :multiple="true"></select2>
            <b-alert :show="is_subject_mixed" variant="info" style="margin-top: 10px;" dismissible> 
                <icon name="info-circle"/> You have selected datasets from more than one subject. 
                Processes are most effective when used for only a few subjects at a time. 
                If you would like to run processes on a large amount of subjects (i.e., bulk processing), try <a href="https://brainlife.io/docs/user/pipeline/" target="doc">pipeline rules</a>. 
                Pipeline rules allow you to easily run the same process on a large amount of subjects.              
            </b-alert>
        </b-col>
    </b-row>
    <br>
</b-modal>
</template>

<script>

import Vue from 'vue'
import tags from '@/components/tags'
//import metadata from '@/components/metadata'
import projectselector from '@/components/projectselector'
import select2 from '@/components/select2'
import datatypetag from '@/components/datatypetag'

import agreementMixin from '@/mixins/agreement'
import datatypesMixin from '@/mixins/datatypes'

const async = require("async");

var debounce = {};

export default {
    mixins: [
        agreementMixin,
        datatypesMixin,
    ],
    components: { tags, projectselector, select2, datatypetag },
    data() {
        return {
            //datasets selected via datasets page
            selected: JSON.parse(localStorage.getItem('datasets.selected')) || {},

            project: null, //selected project
            datasets: [], //user selected dataset

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

    mounted() {
        this.$root.$on("datasetselecter.open", presets=>{
            if(!this.$refs.modal) return console.log("received datasetselecter.open but this.$refs.modal not yet initialized");

            this.project = null;

            if(presets) {
                if(presets.project) this.project = presets.project; //not tested
                if(presets.subjects) this.selected_subjects = presets.subjects; //not tested
                if(presets.datatypes) this.selected_datatypes = presets.datatypes; 
            }
            
            this.loadDatatypes(
                {},
                err => {
                    if(err) console.error(err);
                    Object.values(this.datatypes).map(
                      datatype => this.datatypes_s2.push({ id: datatype._id, text: datatype.name })
                    );
                }
            );

            this.$refs.modal.show()
            Vue.nextTick(()=>{
                if(!this.$refs.psel) return console.log("received datasetselecter.open but this.$refs.psel not yet initialized");
                this.$refs.psel.load_projects();
            })
        });
    },

    computed: {
        is_subject_mixed() {
            if(this.datasets.length == 0) return false;
            let subject = null;
            let diff = false;
            this.datasets.forEach(did=>{
                let dataset = this.alldatasets[did];
                if(!subject) subject = dataset.meta.subject;
                else if(subject != dataset.meta.subject) diff = true;
            });
            return diff;
        }
    },

    methods: {
        close: function() {
            console.log("resetting datasetselecter");
            this.selected_subjects = [];
            this.selected_datatypes = [];
            this.datasets = [];
            this.$refs.modal.hide()
        },

        submit: function(evt) {
            evt.preventDefault();

            if(this.datasets.length == 0) return this.$notify("Please select a data object");
            var os = {}; 
            let project_ids = []; 
            this.datasets.forEach(did=>{ 
                os[did] = this.alldatasets[did];
                project_ids.push(this.alldatasets[did].project);
            });

            //console.log("checking project agreement");
            //load project agreements
            this.$http.get('project', {params: {
                find: JSON.stringify({
                   _id: {$in : project_ids}
                }),
                limit: 500,
                select: 'name agreements',
            }}).then(res=>{
                async.eachSeries(res.data.projects, this.check_agreements, err=>{
                    if(err) return console.error(err);
                    this.$root.$emit("datasetselecter.submit", os);
                    this.close();
                });
            });
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

            //similar code in modals/appsubmit
            if (params.term) find.$or = [
                { 'meta.subject': {$regex: params.term, $options: 'i' }}, 
                { 'meta.session': {$regex: params.term, $options: 'i' }}, 
                { 'tags': {$regex: params.term, $options: 'i' }}, 
                { 'datatype_tags': {$regex: params.term, $options: 'i' }}, 
            ];
            // final data retrieval parameters
            var skip = (params.page - 1) * this.limit;
            var filter_params = {
                find: JSON.stringify(find),
                limit: this.limit,
                skip: (params.page - 1) * this.limit,
                sort: 'meta.subject -create_date',
            };
            
            // list of dropdown menu items to return
            var dropdown_items = [];
            
            //now load datasets
            this.$http.get('dataset', { params: filter_params })
            .then(res => {
                var datasets = res.data.datasets;
                
                datasets.forEach(dataset => {
                    // create catalog of all datasets
                    this.alldatasets[dataset._id] = dataset;
                    
                    let text = "(non-existing)";
                    if(dataset.meta) {
                        if (dataset.meta.subject) text = dataset.meta.subject;
                        if (dataset.meta.session) text += " / "+dataset.meta.session;
                    }
                    
                    // dropdown menu item to add
                    let item = {
                        id: dataset._id,
                        text,
                        date: dataset.create_date,
                        datatype: this.datatypes[dataset.datatype],
                        datatype_tags: dataset.datatype_tags,
                        tags: dataset.tags,
                    };

                    if (!this.datasets_groups[text]) {
                        // first time
                        this.datasets_groups[text] = true;
                        
                        // append - select2 allows me to append item by doing following crap
                        dropdown_items.push({
                            text,
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
                        more: filter_params.skip + res.data.datasets.length < res.data.count,
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
        project: function(project) {
            console.log("project switched.... loading subjects: "+this.project);
            this.$http.get('dataset/distinct', { params: {
                find: JSON.stringify({
                    project: this.project,
                    removed: false,
                }),
                distinct: 'meta.subject',
            }}).then(res=>{
                this.subjects = res.data;
            });
        },
    },
}
</script>
