<template>
<b-modal id='modal-pipelinegroup' :title="group.name||'Pipeline Group'" @hidden="hidden" @ok="submit">
    <b-form-group label="Title" horizontal>
        <b-form-input type="text" v-model="group.name" placeholder="Please enter a group name"/>
    </b-form-group>
    <b-form-group label="Color" horizontal>
        <b-form-input type="color" v-model="group.color"/>
    </b-form-group>
</b-modal>
</template>

<script>

import Vue from 'vue'

//const lib = require('@/lib');

export default {
    components: { 
    },

    data () {
        return {
            //defaults are set when the modal is opened below
            group: {
                type: "group",
                name: "",
                items: [],
                open: true,
                color: "",
            },
            cb: null, //cb function to call with (err, rule[updated])

            config: Vue.config,
        }
    },

    computed: {
    },

    mounted() {
        this.$root.$on("pipelinegroup.edit", opt=>{
            Object.assign(this.group, {
                type: "group",
                name: "",
                items: [],
                open: true,
                color: "#f0f0f0",
            }, opt.group);
            this.cb = opt.cb;
            this.$root.$emit('bv::show::modal', 'modal-pipelinegroup')
        });
    },

    destroyed() {
        this.$root.$off("pipelinegroup.edit");
    },

    methods: {
        hidden() {
            //if(this.rule._id) this.$router.replace("/project/"+this.rule.project+"/pipeline");
        },
        submit() {
            this.cb(null, this.group);
        },
    },
}
</script>

<style scoped>
</style>

