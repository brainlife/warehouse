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
            <h5>Search Criteria
                <small style="float: right;" class="text-primary"><icon name="plus" @click=""/></small>
            </h5>
            <div v-for="(c, idx) in criterias" :key="idx" class="criteria">
                <v-select v-model="c.key" :options="keys"></v-select>
                <b-form-group style="margin-bottom: 0px; padding-top: 10px;">
                    <b-form-radio-group v-if="c.options" v-model="c.value" :options="c.options"></b-form-radio-group>
                    <b-form-input v-if="!c.options" type="number" v-model="c.value"/>
                </b-form-group>
            </div>
        </b-col>
        <b-col cols="8">
            <h5>Results</h5>
            <div style="background-color: #eee; padding: 5px; max-height: 350px; overflow: auto;">
                <small style="opacity: 0.8; float: right;">12 datasets / 20 subjects</small>
                <div class="results-ds" v-for="r in results" :key="r.ds" style="margin-bottom: 5px;">
                    <b-form-checkbox v-model="r.selected">{{r.ds}}</b-form-checkbox>
                    <div class="results-subjects" v-for="subject in r.subjects" :key="subject" style="margin-left: 30px;"> 
                        <b-form-checkbox v-model="subject.selected">{{subject}}</b-form-checkbox>
                    </div>
                </div>
            </div>
<!--
            <pre style="background-color: #eee; padding: 10px; height: 400px; font-size: 80%;">
action summary:
  search (ok: 54)
search(ok): /home/hayashis/datalad/labs/haxby/attention/sub-rid000012/anat/sub-rid000012_rec-ehalfhalf_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/labs/haxby/attention/sub-rid000012/anat/sub-rid000012_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/labs/haxby/attention/sub-rid000024/anat/sub-rid000024_rec-ehalfhalf_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/labs/haxby/attention/sub-rid000024/anat/sub-rid000024_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/labs/haxby/attention/sub-rid000032/anat/sub-rid000032_rec-ehalfhalf_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/labs/haxby/attention/sub-rid000032/anat/sub-rid000032_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000001/sub-11/anat/sub-11_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000001/sub-15/anat/sub-15_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000002/sub-02/anat/sub-02_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000002/sub-05/anat/sub-05_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000005/sub-07/anat/sub-07_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000006/sub-14/ses-retest/anat/sub-14_ses-retest_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000006/sub-14/ses-test/anat/sub-14_ses-test_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000008/sub-15/anat/sub-15_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000108/sub-26/anat/sub-26_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000117/sub-11/ses-mri/anat/sub-11_ses-mri_acq-epi_T1w.nii (file)
search(ok): /home/hayashis/datalad/openfmri/ds000117/sub-11/ses-mri/anat/sub-11_ses-mri_acq-mprage_T1w.nii (file)
search(ok): /home/hayashis/datalad/openfmri/ds000117/sub-12/ses-mri/anat/sub-12_ses-mri_acq-epi_T1w.nii (file)
search(ok): /home/hayashis/datalad/openfmri/ds000117/sub-12/ses-mri/anat/sub-12_ses-mri_acq-mprage_T1w.nii (file)
search(ok): /home/hayashis/datalad/openfmri/ds000117/sub-14/ses-mri/anat/sub-14_ses-mri_acq-epi_T1w.nii (file)
search(ok): /home/hayashis/datalad/openfmri/ds000117/sub-14/ses-mri/anat/sub-14_ses-mri_acq-mprage_T1w.nii (file)
search(ok): /home/hayashis/datalad/openfmri/ds000140/sub-02/anat/sub-02_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000140/sub-19/anat/sub-19_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000148/sub-16/anat/sub-16_acq-axial_run-01_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000148/sub-16/anat/sub-16_acq-sagittal_run-01_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000157/sub-01/anat/sub-01_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000157/sub-16/anat/sub-16_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000157/sub-25/anat/sub-25_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000171/sub-control09/anat/sub-control09_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000171/sub-mdd08/anat/sub-mdd08_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000202/sub-1076/anat/sub-1076_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000202/sub-1090/anat/sub-1090_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000202/sub-1091/anat/sub-1091_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000202/sub-1093/anat/sub-1093_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000214/sub-EESS010/anat/sub-EESS010_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000214/sub-EESS033/anat/sub-EESS033_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000217/sub-Exp1s04/anat/sub-Exp1s04_inplaneT1.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000217/sub-Exp1s04/anat/sub-Exp1s04_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000217/sub-Exp2s16/anat/sub-Exp2s16_inplaneT1.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000217/sub-Exp2s16/anat/sub-Exp2s16_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000222/sub-3201/anat/sub-3201_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000222/sub-3218/anat/sub-3218_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000222/sub-3253/anat/sub-3253_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000229/sub-01/anat/sub-01_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000229/sub-06/anat/sub-06_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000233/sub-rid000012/anat/sub-rid000012_rec-ehalfhalf_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000233/sub-rid000012/anat/sub-rid000012_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000233/sub-rid000024/anat/sub-rid000024_rec-ehalfhalf_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000233/sub-rid000024/anat/sub-rid000024_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000233/sub-rid000032/anat/sub-rid000032_rec-ehalfhalf_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000233/sub-rid000032/anat/sub-rid000032_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000253/sub-09/anat/sub-09_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000253/sub-11/anat/sub-11_T1w.nii.gz (file)
search(ok): /home/hayashis/datalad/openfmri/ds000254/sub-13/anat/sub-13_T1w.nii.gz (file)
</pre>
-->
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

            //list of datasets and subjects
            results: [
                {
                    ds: "labs/haxby/attention",
                    subjects: [ "sub-rid000012", "sub-rid000024", "sub-rid000032"],
                    selected: false,
                },
                {
                    ds: "openfmri/ds000001",
                    subjects: [ "sub-11", "sub-15" ],
                    selected: false,
                },
                {
                    ds: "openfmri/ds000002",
                    subjects: [ "sub-02", "sub-05" ],
                    selected: false,
                },
                {
                    ds: "openfmri/ds000005",
                    subjects: [ "sub-07" ],
                    selected: false,
                },
                {
                    ds: "openfmri/ds000006",
                    subjects: [ "sub-14" ],
                    selected: false,
                },
                {
                    ds: "openfmri/ds000008",
                    subjects: [ "sub-15" ],
                    selected: false,
                },
                {
                    ds: "openfmri/ds000108",
                    subjects: [ "sub-26" ],
                    selected: false,
                },
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


