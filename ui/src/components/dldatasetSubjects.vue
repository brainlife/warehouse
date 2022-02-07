<template>
<!--b-container prevents b-row to show vertical scrollbar-->
<div class="dlsubjects">
    <div class="table-header">
        <b-row>
            <b-col cols="1">subject<small>/session</small></b-col>
            <b-col cols="2" v-if="selected.participants"/>
            <b-col>
                <b-row>
                    <b-col>datatype</b-col>
                    <b-col>tags</b-col>
                </b-row>
            </b-col>
        </b-row>
    </div>

    <div class="table-body">
        <b-row v-for="(group, subses) in subjects" :key="subses" class="subject-group">
            <b-col cols="1">{{subses}}</b-col>
            <b-col cols="2" v-if="selected.participants">
                <span class="keyvalue" v-for="(v, k) in selected.participants.find(p=>p.subject == group.subject)" :key="k" v-if="k != 'subject'">
                    <small>{{k}}</small> {{v}}
                </span>
            </b-col>
            <b-col>
                <div v-for="dataset in group.datasets" :key="dataset._id">
                    <b-row @click="click_dataset(dataset)" class="dataobject-clickable">
                        <b-col>
                            <datatypetag :datatype="dataset.datatype" :clickable="false" :tags="dataset.datatype_tags" />
                        </b-col>
                        <b-col><tags :tags="dataset.tags"/></b-col>
                    </b-row>
                    <div v-if="dataset.showmeta">
                        <pre style="font-size: 80%; background-color: #f6f6f6; max-height: 300px;">{{dataset._meta}}</pre>
                        <ul>
                            <li v-for="file in dataset._files" :key="file.dest">
                                <span style="display: inline-block;">{{file.src}}</span>
                                <b-badge variant="secondary">{{file.dest}}</b-badge> 
                            </li>
                        </ul>
                    </div>
                </div>
            </b-col>
        </b-row>
    </div>

    <!--
    <p v-if="hasMore" style="padding: 10px 20px; margin: 0px; background-color: #f0f0f0;">
        Showing up to {{itemLimit}} data objects
        <b-button style="float: right" @click="showAll()">Show All</b-button>
        <br clear="both">
    </p>

    <div v-if="selected.participants_info">
        <b-alert show variant="secondary">Phenotype Column Definitions</b-alert>
        <pre>{{selected.participants_info}}</pre>
    </div>
    -->

</div>
</template>

<script>
import Vue from 'vue'
import datatypetag from '@/components/datatypetag'
import tags from '@/components/tags'

export default {
    components: { datatypetag, tags },
    data() {
        return {
            subjects: null,
        }
    },
    props: ['selected'],
    mounted() {
        this.$http('datalad/items', {params: {
            find: JSON.stringify({dldataset: this.selected._id}), 
            select: 'dataset.meta.subject dataset.meta.session dataset.desc dataset.datatype dataset.datatype_tags dataset.tags',
            limit: this.itemLimit,
            sort: 'dataset.meta.subject',
        }}).then(res=>{
            let items = res.data;

            //organize to subject-session and list of datasets
            this.subjects = {};
            for(let item of items) {
                let subject = item.dataset.meta.subject;
                let session = item.dataset.meta.session;
                item.dataset._id = item._id;
                let group = subject;
                if(session) group += " / "+session;
                if(!this.subjects[group]) this.subjects[group] = {subject, session, datasets: []};
                this.subjects[group].datasets.push(item.dataset);
            }
            this.loading_dataset = false;

            this.hasMore = (items.length == this.itemLimit);
        }).catch(console.error);
    },

    methods: {
        click_dataset(item) {
            if(item.showmeta) {
                item.showmeta = false;
                this.$forceUpdate();
            } else {
                item.showmeta = true;
                if(item._meta) {
                    this.$forceUpdate();
                    return; //already loaded?
                }
                this.$http('datalad/items', {params: {
                    find: JSON.stringify({_id: item._id}), 
                    select: 'dataset.meta dataset.storage_config.files',
                }}).then(res=>{
                    item._meta = res.data[0].dataset.meta;
                    item._files = res.data[0].dataset.storage_config.files;
                    this.$forceUpdate();
                });
            }
        },
    },
}
</script>

<style scoped>

.dlsubjects {
    width: 100%;
    padding-right: 15px;
    padding-left: 15px;
    margin-right: auto;
    margin-left: auto;
    background-color: white;
}
.table-header {
    position: sticky; 
    top: 0; 
    background-color: #ddd; 
    padding: 5px 15px;
    margin: 0 -15px;
    z-index: 1;
    text-transform: uppercase;
    font-weight: bold;
}

.table-body {
    padding: 0px 10px;
}
.subject-group {
    border-bottom: 1px solid #ddd9;
    padding: 5px 0px;
    font-size: 90%;
}
.subject-group .dataobject-clickable:hover {
    background-color: #eee;
    cursor: pointer;
}

</style>


