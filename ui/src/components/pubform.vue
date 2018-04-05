<template>
<b-form @submit="submit">
    <b-form-group label="Title *" horizontal>
        <b-form-input required v-model="pub.name" type="text" placeholder="Title of the paper"></b-form-input>
    </b-form-group>
    <b-form-group label="Description *" horizontal>
        <b-form-textarea v-model="pub.desc" :rows="3" placeholder="A short summary of this dataset/app publication." required></b-form-textarea>
    </b-form-group>
    <b-form-group label="Tags" horizontal>
        <select2 :options="oldtags" v-model="pub.tags" :multiple="true" :tags="true"></select2>
    </b-form-group>
    <b-form-group label="Detail" horizontal>
        <b-form-textarea v-model="pub.readme" :rows="10" placeholder="Any detailed description for this publications. You can enter chars / tables / katex(math equations) etc.."></b-form-textarea>
        <small class="text-muted">in <a href="https://help.github.com/articles/basic-writing-and-formatting-syntax/" target="_blank">markdown format</a></small>
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
        <b-row v-for="(funding, idx) in pub.fundings" :key="idx" style="margin-bottom: 3px;">
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
    <br>
    <br>
    <br>
    <div class="form-action">
        <b-button type="button" @click="cancel">Cancel</b-button>
        <b-button type="submit" variant="primary">Submit</b-button>
    </div>
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
        cancel: function() {
            console.log("cancel pubform");
            this.$emit("cancel");
        },
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

<style scoped>
.form-action {
text-align: right; 
position: fixed; 
right: 0px; 
left: 350px; 
bottom: 0px; 
padding: 10px 30px;
background-color: rgba(100,100,100,0.4);
}
</style>

