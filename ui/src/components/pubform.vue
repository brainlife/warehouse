<template>
<b-form @submit="submit">
    <b-form-group label="Title *" horizontal>
        <b-form-input required v-model="pub.name" type="text" placeholder="Title of the paper"></b-form-input>
    </b-form-group>
    <b-form-group label="Description" horizontal>
        <b-form-textarea v-model="pub.desc" :rows="2" placeholder="A short summary of the abstract"></b-form-textarea>
    </b-form-group>
    <b-form-group label="Tags" horizontal>
        <select2 :options="oldtags" v-model="pub.tags" :multiple="true" :tags="true"></select2>
    </b-form-group>
    <b-form-group label="README *" horizontal>
        <b-form-textarea required v-model="pub.readme" :rows="6" placeholder="Content from abstract, or any other details about this publications"></b-form-textarea>
        <small class="text-muted">in markdown</small>
    </b-form-group>
    <b-form-group label="License *" horizontal>
        <b-form-select :options="licenses" required v-model="pub.license"/>
        <div style="margin-top:10px; margin-left: 10px; opacity: 0.8">
            <small>
                <license :id="pub.license"/>
            </small>
        </div>
    </b-form-group>
    <!--
    <b-form-group label="DOI" horizontal>
        <b-form-input v-model="pub.doi" type="text" placeholder="Not issued yet"></b-form-input>
    </b-form-group>
    -->
    <b-form-group label="Fundings" horizontal>
        <b-input-group v-for="(funding, idx) in pub.fundings" :key="idx" style="margin-bottom: 5px;">
            <b-input-group-addon>Funder</b-input-group-addon>
            <!--https://www.grants.gov/web/grants/learn-grants/grant-making-agencies.html-->
            <b-form-select :options="['NSF', 'NIH', 'DOE', 'DOD']" required v-model="funding.funder"/>
            <b-input-group-addon>ID</b-input-group-addon>
            <b-form-input type="text" required v-model="funding.id" placeholder=""/>
            <b-input-group-button>
                <b-button @click="remove_funder(idx)"><icon name="trash"/></b-button>
            </b-input-group-button>
        </b-input-group>
        <b-button type="button" @click="pub.fundings.push({})" size="sm"><icon name="plus"/> Add Funder</b-button>
    </b-form-group>
    <b-form-group label="Authors" horizontal>
        <contactlist v-model="pub.authors"></contactlist>
    </b-form-group>
    <b-form-group label="Contributors" horizontal>
        <contactlist v-model="pub.contributors"></contactlist>
    </b-form-group>

    <!-- we should never remove publication
    <b-form-group label="" horizontal>
        <b-form-checkbox v-model="pub.removed">Removed</b-form-checkbox>
    </b-form-group>
    -->

    <hr>
    <div style="float: right">
        <slot/>
        <b-button type="submit" variant="primary">Submit</b-button>
    </div>
    <br>
    <br>
    <br>
</b-form>
</template>

<script>

import select2 from '@/components/select2'
import license from '@/components/license'
import contactlist from '@/components/contactlist'

export default {
    components: { 
        select2, license, contactlist,
    },

    props: {
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
        }
    },

    mounted() {
        //select2 needs option set to show existing tags.. so we copy my own tags and use it as options.. stupid select2
        this.oldtags = Object.assign(this.pub.tags);
    },

    methods: {
        submit: function(evt) {
            evt.preventDefault();
            this.$emit("submit", this.pub);
        },
    
        remove_funder: function(idx) {
            console.log("removing", idx);
            this.pub.fundings.splice(idx, 1);            
            console.log(this.pub.fundings);
        },
    }
}
</script>
