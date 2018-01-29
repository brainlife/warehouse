<template>
<b-form @submit="submit">
    <h3 style="opacity: 0.7">{{pub.doi||pub._id+' (no doi)'}}</h3>
    <p style="opacity: 0.7">Only the publication metadata can be edited at this time. To update published datasets, please contact administrator.</p>
    <b-form-group label="Title *" horizontal>
        <b-form-input required v-model="pub.name" type="text" placeholder="Title of the paper"></b-form-input>
    </b-form-group>
    <!--
    <b-form-group label="Publisher *" horizontal>
        <b-form-input required v-model="pub.publisher" type="text" placeholder="Name of the journal to publish this paper"></b-form-input>
        <small class="text-muted">This property will be used to formulate the citation, so consider the prominence of the role.</small>
    </b-form-group>
    -->
    <b-form-group label="Publication Date" horizontal>
        <b-form-input required v-model="pub._publish_date" type="date" @change="change_pubdate"></b-form-input>
        <small class="text-muted">If not published yet, please enter an estimated publication date. You can be updated this later.</small>
    </b-form-group>
    <b-form-group label="Description" horizontal>
        <b-form-textarea v-model="pub.desc" :rows="5" placeholder="A short summary of the abstract"></b-form-textarea>
    </b-form-group>
    <b-form-group label="Tags" horizontal>
        <select2 :options="oldtags" v-model="pub.tags" :multiple="true" :tags="true"></select2>
    </b-form-group>
    <b-form-group label="Abstract *" horizontal>
        <b-form-textarea required v-model="pub.readme" :rows="10" placeholder="Content from abstract, or any other details about this publications"></b-form-textarea>
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
        <contactlist v-model="pub.authors"/>
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
    
    /*
    watch: {
        pub: function() {
            
        }
    }
    */

    mounted() {
        //select2 needs option set to show existing tags.. so we copy my own tags and use it as options.. stupid select2
        this.oldtags = Object.assign(this.pub.tags);
        if(!this.pub.publish_date) this.pub.publish_date = new Date(); //backward compatibility
        else this.pub.publish_date = new Date(this.pub.publish_date); //convert from iso string to javascript date
        this.pub._publish_date = this.pub.publish_date.toISOString().split("T")[0];//TODO - better way?
    },

    methods: {
        submit: function(evt) {
            evt.preventDefault();
            this.pub.publish_date = new Date(this.pub._publish_date);
            this.$emit("submit", this.pub);
        },

        remove_funder: function(idx) {
            console.log("removing", idx);
            this.pub.fundings.splice(idx, 1);            
            console.log(this.pub.fundings);
        },

        //vue bootstrap's date controller doesn't do 2way binding?
        change_pubdate: function(d) {
            this.pub._publish_date = new Date(d);
        },
    }
}
</script>
