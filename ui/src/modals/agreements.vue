<template>
<b-modal ref="modal" hide-footer> 
    <div slot="modal-title">
        <icon name="handshake" scale="2" style="position: relative; top: 6px"/>&nbsp; Project Agreements
    </div>
    <p class="text-muted">You must consent to the following agreements before accessing datasets on this project.</p>
    <agreements :agreements="project.agreements" @agreed="close" v-if="project"/>
</b-modal>
</template>
<script>

import Vue from 'vue'

import agreements from '@/components/agreements'

export default {
    components: { 
        agreements
    },
    data () {
        return {
            project: null,
            cb: null,
            config: Vue.config,
        } 
    },
    mounted() {
        this.$root.$on("agreements.open", (opt)=>{
            this.project = opt.project;
            this.cb = opt.cb;
            this.$refs.modal.show()
        });
    },
    methods: {
        close: function() {
            this.$refs.modal.hide();
            if(this.cb) this.cb();
        },
    },
}

</script>
<style scoped>
</style>
