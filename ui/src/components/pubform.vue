<template>
<b-form @submit="submit">
    <h4>Detail</h4>
    <b-form-group label="Title *" horizontal>
        <b-form-input required v-model="pub.name" type="text" placeholder="Title of the paper"></b-form-input>
    </b-form-group>
    <b-form-group label="Description *" horizontal>
        <b-form-textarea v-model="pub.desc" :rows="3" placeholder="A short description (or subtitle) of this publication (please keep it under 500 characters.)" required></b-form-textarea>
        <b-alert :show="pub.desc.length > 700" variant="danger">Sub-title is too long. Please use the Detail section below for detailed description of this publication.</b-alert>
    </b-form-group>
    <b-form-group label="Detail" horizontal>
        <b-form-textarea v-model="pub.readme" :rows="10" placeholder="Enter detailed description for this publication and your project. Explain what other searchers can do with your data. You can enter chars / tables / katex(math equations) etc.."></b-form-textarea>
        <small class="text-muted">in <a href="https://help.github.com/articles/basic-writing-and-formatting-syntax/" target="_blank">markdown format</a></small>
    </b-form-group>
    <b-form-group label="Tags" horizontal>
        <select2 :options="oldtags" v-model="pub.tags" :multiple="true" :tags="true"></select2>
    </b-form-group>
    <b-form-group label="License *" horizontal>
        <b-form-select :options="licenses" required v-model="pub.license"/>
        <div style="margin-top:10px; margin-left: 10px; opacity: 0.8">
            <small>
                <license :id="pub.license"/>
            </small>
        </div>
    </b-form-group>
    <b-form-group label="Fundings" horizontal>
        <b-row v-for="(funding, idx) in pub.fundings" :key="idx" style="margin-bottom: 5px;">
            <b-col>
                <b-input-group prepend="Funder">
                    <b-form-select :options="['NSF', 'NIH', 'DOE', 'DOD']" required v-model="funding.funder"/>
                </b-input-group>
            </b-col>
            <b-col>
                <b-input-group prepend="ID">
                    <b-form-input type="text" required v-model="funding.id" placeholder=""/>
                </b-input-group>
            </b-col>
            <b-col cols="1">
                <div class="button" @click="remove_funder(idx)"><icon name="trash"/></div>
            </b-col>
        </b-row>
        <b-button type="button" @click="pub.fundings.push({})" size="sm"><icon name="plus"/> Add Funder</b-button>
    </b-form-group>
    <b-form-group label="Authors *" horizontal>
        <contactlist v-model="pub.authors"/>
    </b-form-group>
    <b-form-group label="Contributors" horizontal>
        <contactlist v-model="pub.contributors"></contactlist>
    </b-form-group>
    <b-form-group label="Releases" horizontal>
        <p>
            <small opacity="0.7">This is where you list data objects you'd like to publish, and group analysis notebooks.</small>
        </p>
        <b-card v-for="(release, idx) in pub.releases" v-if="!release.removed" :key="release._id||idx" style="margin-bottom: 5px;">
            <b-row>
                <b-col>
                    <b-input-group prepend="Release Name">
                        <b-form-input type="text" required v-model="release.name" placeholder=""/>
                    </b-input-group>
                    <br>

                    <b>Description</b>
                    <b-form-textarea v-model="release.desc" :rows="3" placeholder="A short description for this release"/>
                </b-col>
                <b-col>
                    <b-input-group prepend="Release Date">
                        <b-form-input type="date" required v-model="release._create_date" placeholder=""/>
                    </b-input-group>
                </b-col>
                <b-col sm="1">
                    <!-- we don't have a mechanism to unpublish published data objects-->
                    <div class="button" v-if="!release._id" @click="release.removed = true"><icon name="trash"/></div>
                </b-col>
            </b-row>
            <br>

            <b-row>
                <b-col>
                    <div v-for="(set, idx) in release.sets" :key="idx" style="margin-bottom: 5px">
                        <span v-if="set.add" @click="remove_set(release, idx)" style="opacity: 0.5; float: right;">
                            <icon name="trash" scale="0.9"/>
                        </span>
                        <releaseset :set="set"/>
                    </div>
                    <b-button type="button" variant="outline-success" @click="add_datasets(release)" size="sm"><icon name="plus"/> Add Data Objects</b-button>
                </b-col>
                <b-col>
                    <div v-for="(gaarchive, idx) in release.gaarchives" :key="idx">
                        <span @click="removeGAArchive(release, gaarchive)" style="opacity: 0.5; float: right;">
                            <icon name="trash" scale="0.9"/>
                        </span>
                        <gaarchive :gaarchive="gaarchive"/>
                    </div>
                    <b-button type="button" variant="outline-success" @click="add_ga(release)" size="sm"><icon name="plus"/> Add Group Analysis Result</b-button>
                </b-col>
                <b-col sm="1">
                    <!--placeholder to match the releasename/date field-->
                </b-col>
            </b-row>
        </b-card>
        <b-button type="button" @click="new_release" size="sm"><icon name="plus"/> Add New Release</b-button>
    </b-form-group>

    <br>
    <br>
    <br>
    <br>
    <br>

    <!--
    <div v-if="config.debug" style="background-color: gray;">
        <pre>{{pub}}</pre>
    </div>
    -->

    <div class="page-footer">
        <b-button type="button" @click="cancel">Cancel</b-button>
        <b-button type="submit" variant="primary">Submit</b-button>
    </div>
</b-form>
</template>

<script>
import Vue from 'vue'

import select2 from '@/components/select2'
import license from '@/components/license'
import contactlist from '@/components/contactlist'
import gaarchive from '@/components/gaarchive'
import releaseset from '@/components/releaseset'

const async = require("async");

export default {
    components: { 
        select2, 
        license, 
        contactlist, 
        gaarchive,
        releaseset,
    },

    props: {
        project: { type: Object },
        pub: { type: Object },
    },

    data () {
        return {
            licenses: [
                {value: 'ccby.40', text: 'CC BY 4.0'},
                {value: 'ccbysa.30', text: 'CC BY-SA 3.0'},
                {value: 'cc0', text: 'CC0'},
                {value: 'pddl', text: 'PDDL'},
                {value: 'odc.by', text: 'ODC BY 1.0'},
            ],
            oldtags: null,

            config: Vue.config,
        }
    },

    mounted() {
        //select2 needs option set to show existing tags.. so we copy my own tags and use it as options.. stupid select2
        this.oldtags = Object.assign(this.pub.tags);

        if(!this.pub.releases) this.$set(this.pub, 'releases', []);
        this.pub.releases.forEach(release=>{
            release._create_date = (new Date(release.create_date)).toISOString().split('T')[0];
        });
    },

    methods: {
        cancel() {
            console.log("cancel pubform");
            this.$emit("cancel");
        },

        removeGAArchive(release, ga) {
            const idx = release.gaarchives.indexOf(ga);
            release.gaarchives.splice(idx, 1);
        },

        submit(evt) {
            evt.preventDefault();
            
            //reset release create_date
            this.pub.releases.forEach(release=>{
                release.create_date = new Date(release._create_date);
            });

            this.$emit("submit", this.pub);
        },

        remove_funder(idx) {
            console.log("removing", idx);
            this.pub.fundings.splice(idx, 1);            
            console.log(this.pub.fundings);
        },

        new_release() {
            this.pub.releases.push({
                _create_date: (new Date()).toISOString().split('T')[0],
                name: (this.pub.releases.length+1).toString(),
                removed: false,

                sets: [],
                gaarchives: [],
            })
        },

        add_datasets(release) {
            this.$root.$emit("datatypeselecter.open", {project: this.project, /*selected: release.sets*/});
            this.$root.$on("datatypeselecter.submit", sets=>{
                this.$root.$off("datatypeselecter.submit");

                //set add flag to true to signal API server to publish these new datasets
                sets.forEach(set=>{ set.add = true; }); 

                release.sets = release.sets.concat(sets); //TODO - dedupe this
                this.$forceUpdate(); //to show new sets..
            });
        },

        add_ga(release) {
            this.$root.$emit("gaarchiver.open", {project: this.project, release, cb: (err, ga)=>{
                console.log("created new ga", ga);
                release.gaarchives.push(ga);
            }});
        },

        remove_set(release, idx) {
            release.sets.splice(idx, 1);
            this.$forceUpdate();
        }
    }
}
</script>

<style scoped>
h4 {
color: #999;
border-bottom: 1px solid #eee;
padding-bottom: 10px;
margin-bottom: 15px;
}
</style>
