<template>
<div>
    <b-tabs small lazy>
        <b-tab v-for="png in pngs" :key="png" :title="png">
            <a :href="fullpath(png+'.png')" :target="png">
                <img :src="fullpath(png+'.png')" width="100%"/>
            </a>
        </b-tab>
    </b-tabs>
</div>
</template>

<script>
import Vue from 'vue'
import axios from 'axios'

export default {
    props: ['task', 'output', 'product'],
    components: {},
    data() {
        return {
            pngs: [
                "bc_left",
                "bc_right",
                "masv_left",
                "masv_right",
                "final_left",
                "final_right",
                "gray_left",
                "gray_right",
                "qa_seg_bootstrap_corr_usegray_left_qa",
                "qa_seg_bootstrap_corr_usegray_right_qa",
                "qa_seg_multiatlas_corr_usegray_left_qa",
                "qa_seg_multiatlas_corr_usegray_right_qa",
                "qa_registration_left_qa",
                "qa_registration_right_qa",
                "qa_seg_bootstrap_heur_left_qa",
                "qa_seg_bootstrap_heur_right_qa",
                "qa_seg_bootstrap_corr_nogray_left_qa",
                "qa_seg_bootstrap_corr_nogray_right_qa",
                "qa_seg_multiatlas_corr_nogray_left_qa",
                "qa_seg_multiatlas_corr_nogray_right_qa",
                "qa_seg_multiatlas_heur_left_qa",
                "qa_seg_multiatlas_heur_right_qa",
                //summary.tex
            ],
            config: Vue.config,
        }
    },
    methods: {
        fullpath(filename) {
            const base = Vue.config.api+'/secondary/'+this.task._id+'/'+this.output.id+'/secondary/';
            return base+'qa/'+filename+'?at='+Vue.config.jwt;
        }
    },
    mounted() {
    },
}
</script>

<style scoped>
</style>
