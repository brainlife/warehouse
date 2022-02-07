<template>
<div>
    <div class="page-header">
        <b-button variant="primary" @click="openImporter" class="import-button"><icon name="cloud-download-alt"/> Import</b-button>
        <b-tabs class="brainlife-tab" v-model="tab" title="version">
            <b-tab v-for="(version, idx) in tabs" :key="idx" :title="version" :active="tab == idx"/>
        </b-tabs>
        <h5 style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: 0.5;">
            {{path}}
        </h5>
    </div>
    <div class="page-content" v-if="selected">
        <div style="padding: 10px">
            <div>

                <!--
                <a v-if="selected.dataset_description && selected.dataset_description.DatasetDOI" :target="selected._id" :href="'https://doi.org/'+selected.dataset_description.DatasetDOI">
                    <b-badge variant="light">{{selected.dataset_description.DatasetDOI}}</b-badge>
                </a>
                <pre v-else style="opacity: 0.5; font-size: 70%">{{selected.path}}</pre>
                -->

                <h5 class="serif" style="font-size: 20px;">{{selected.dataset_description.Name}}</h5>
                <p>
                    <small v-for="(author, idx) in selected.dataset_description.Authors" :key="idx"> 
                        <span v-if="idx > 0" style="opacity: 0.3;">|</span> {{author}} 
                    </small>
                </p>
            </div>

            <p>
                <b-badge pill class="bigpill" style="margin-right: 5px;">
                    <icon name="user-friends" style="opacity: 0.4;"/>&nbsp;&nbsp;{{selected.stats.subjects}} <small>subjects</small> 
                    <span v-if="selected.stats.sessions"><span style="opacity: 0.4"> | </span>{{selected.stats.sessions}} <small>sessions</small></span>
                </b-badge>
                <doibadge v-if="selected.dataset_description.DatasetDOI" :doi="selected.dataset_description.DatasetDOI" jump="true">
                    {{selected.dataset_description.DatasetDOI}}
                </doibadge>
                &nbsp;
                <span v-for="(count, datatype_id) in selected.stats.datatypes" :key="datatype_id" style="margin-right: 10px;">
                    <datatypetag :datatype="datatype_id" :clickable="false"/> <small>{{count}}</small>
                </span>
            </p>

            <div v-if="selected.README">
                <span class="form-header">README</span>
                <vue-markdown v-if="selected.README" :source="selected.README" class="readme box"></vue-markdown>
                <hr>
            </div>

            <div v-if="selected.dataset_description.License">
                <span class="form-header">License</span>
                <div style="margin-left: 40px;" v-if="known_license(selected.dataset_description.License)">
                    <license :id="known_license(selected.dataset_description.License)"/>
                </div>
                <p v-else style="margin-left: 40px; font-style: italic;">{{selected.dataset_description.License}}</p>
            </div>

            <div v-if="selected.dataset_description.Acknowledgements && selected.dataset_description.Acknowledgements != ''">
                <span class="form-header">Acknowledgements</span>
                <ul><li v-for="(ack, idx) in selected.dataset_description.Acknowledgements" :key="idx">{{ack}}</li></ul>
            </div>

            <div v-if="selected.dataset_description.HowToAcknowledge">
                <span class="form-header">How To Acknowledge</span>
                <p style="margin-left: 40px;"><i>{{selected.dataset_description.HowToAcknowledge}}</i></p>
            </div>

            <div v-if="selected.dataset_description.Funding && selected.dataset_description.Funding != ''">
                <span class="form-header">Funding</span>
                <ul><li v-for="(fund, idx) in selected.dataset_description.Funding" :key="idx">{{fund}}</li></ul>
            </div>

            <div v-if="selected.dataset_description.ReferencesAndLinks && selected.dataset_description.ReferencesAndLinks.filter(ref=>ref != '').length > 0">
                <span class="form-header">References And Links</span>
                <ul><li v-for="(ref, idx) in selected.dataset_description.ReferencesAndLinks.filter(ref=>ref != '')" :key="idx">{{ref}}</li></ul>
            </div>

            <div v-if="selected.CHANGES">
                <span class="form-header">CHANGES</span>
                <p>{{selected.CHANGES}}</p>
            </div>
        </div>
        <dlsubjects :selected="selected"/>
    </div>
</div>
</template>

<script>
import Vue from 'vue'

import datatypetag from '@/components/datatypetag'
import dlsubjects from '@/components/dldatasetSubjects'
import doibadge from '@/components/doibadge'
import license from '@/components/license'

export default {
    components: {
        datatypetag,
        license,
        dlsubjects,
        doibadge,
        VueMarkdown: ()=>import('vue-markdown'),
    },

    data() {
        return {
            datasets: [], //list of datasets (for each versions)
            //selected: null,
            tabs: [],
            tab: 0,
            path: null,
        }
    },

    computed: {
        selected() {
            return this.datasets[this.tab];
        },
    },

    watch: {
        tab(v, ov) {
            if(~v) {
                console.log("tab changed to", v, this.tabs, "updating router");
                this.$router.replace("/dataset/"+this.path+"/"+this.tabs[v]);
            }
        },
    },

    mounted: function() {
        this.path = this.$route.params.key;
        let version = null;

        //strip version number if specified
        if(this.path.startsWith("OpenNeuro/")) {
            const tokens = this.path.split("/");
            if(tokens.length == 3) {
                version = tokens.pop(); 
                this.path = tokens.join("/");
            }
        }

        //load te dataset detail
        this.$http('datalad/datasets', {params: {
            find: JSON.stringify({
                removed: false,
                path: { $regex: "^"+this.path.replace("/", "\/")},
            }),
            sort: '-version',
        }}).then(res=>{
            console.log("loaded", res.data);
            this.datasets = res.data;
            this.tabs = this.datasets.map(d=>d.version||'default');

            //cleanup (why?)
            this.datasets.forEach(dataset=>{
                if(dataset.participants && dataset.participants.length == 0) dataset.participants = null;
            });

            //select specified version
            if(version) {
                this.$nextTick(()=>{
                    //wait for b-tab initialization first
                    this.tab = this.tabs.indexOf(version);
                });
            }
        });

    },

    methods: {
        updateHash() {
            console.log(this.tab);
        },

        openImporter() {
            if(Vue.config.user) {
                this.$root.$emit("importer.open", {
                    dataset: this.selected, 
                    subjects: this.subjects,
                });
            } else alert('Please signup/login before importing datasets.');
        },

        known_license(license) {
            license = license.toLowerCase().trim();

            //corrrect some common mistakes.. (should I do this?)
            if(license == "cco" || license == "cc") license = "cc0";
            if(license == "ppdl") license = "pddl";
            if(license == "ccby") license = "ccby.40";

            switch(license) {
            case "cc0":
            case "pddl":
            case "pd":
            case "ccby.40":
                return license;
            }
            return null;
        },

    }
}
</script>

<style scoped>
.page-header {
    padding: 12px 15px;
}
.brainlife-tab {
    float: right;
    position: relative;
    top: -10px;
    margin-right: 5px;
}
.import-button {
    float: right;
    position: relative;
    top: -5px;
}
</style>
