<template>
<b-modal :no-close-on-backdrop='true' title="Import Dataset" ref="modal" size="lg">
    <b-tabs class="brainlife-tab">
        <b-tab title="Datalad"/>
        <b-tab title="XNAT"/>
        <b-tab title="SchizConnect"/>
    </b-tabs>

    <img src="https://www.datalad.org/theme/img/logo/datalad_nav_wide.png" height="50px" class="logo">
    <p style="opacity: 0.8; margin-top: 10px;">Please specify Datalad search criterias to import datasets from Datalad. Only the dataset with datatypes supported by Brainlife can be imported.</p>

    <b-row>
        <b-col cols="4">
            <h5>Search Criteria</h5>
            <b-btn size="sm"><icon name="plus"/> Add Criteria</b-btn>
            <div v-for="(c, idx) in criterias" :key="idx" class="criteria">
                <v-select v-model="c.key" :options="keys"></v-select>
                <b-form-group style="margin-bottom: 0px; padding-top: 10px;">
                    <b-form-radio-group v-if="c.options" v-model="c.value" :options="c.options"></b-form-radio-group>
                    <b-form-input v-if="!c.options" type="number" v-model="c.value"/>
                </b-form-group>
            </div>
        </b-col>
        <b-col>
            <h5>Results</h5>
            <pre style="background-color: #eee; padding: 10px; height: 400px;">
///labs/haxby/attention/
///openfmri/ds000001/
///openfmri/ds000002/
///openfmri/ds000005/
///openfmri/ds000006/
///openfmri/ds000008/
</pre>
        </b-col>
    </b-row>

    <div slot="modal-footer">
        <b-form-group>
            <b-button @click="cancel">Cancel</b-button>
            <b-button variant="primary" @click="submit">Import</b-button>
        </b-form-group>
    </div>
</b-modal>
</template>

<script>
import Vue from 'vue'

//singleton instance to handle upload request
export default {
    components: {},

    data () {
        return {
            criterias: [
                {
                    key: "bids.subject.sex",
                    value: "m",
                    options: [ "m", "f", "male", "female" ],
                },
                {
                    key: "bids.type",
                    value: "t1",
                    options: [ "all", "t1", "inplaneT1", "inplaneT2", "anatMRIQC", "f134", "f135", "license", ],
                },
                {
                    key: "bids.subject.age",
                    value: "24",
                    //options: [ "m", "f" ],
                },
            ],
            keys: [
                "bids", 
                "bids.AccelFactPE",
                "bids.Acknowledgements",
                "bids.AcquisitionDateTime",
                "bids.AcquisitionDuration",
                "bids.AcquisitionMatrix",
                "bids.AcquisitionNumber",
                "bids.AcquisitionTime",
                "bids.BIDSVersion",
                "bids.subject",
                "bids.subject.sex",
                "bids.subject.age",
            ],
            config: Vue.config,
        }
    },

    mounted() {
        this.$root.$on("dsimport.open", (opt)=>{
            this.$refs.modal.show();
        });
    },

    methods: {
        reset: function() {
        },

        cancel() {
            this.$refs.modal.hide();
        },

        submit() {
            this.$refs.modal.hide();
        },
    },
}
</script>

<style scoped>
.criteria {
margin-bottom: 5px;
padding: 10px;
background-color: #f9f9f9;
}
h5 {
font-size: 16px;
border-bottom: 1px solid #eee;
padding-bottom: 5px;
margin: 10px 0px;
font-weight: bold;
}
.logo {
float: right;
margin-left: 10px;
padding-right: 20px;
}
</style>


