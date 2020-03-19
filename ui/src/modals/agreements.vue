<template>
<b-modal ref="modal" hide-footer v-if="project"> 
    <div slot="modal-title">
        <icon name="handshake" scale="2" style="opacity: 0.7; margin-top: 5px;"/>&nbsp; {{project.name}} <small>Project Agreements</small>
    </div>
    <p class="text-muted">You must consent to the following agreements before accessing datasets on this project.</p>
    <agreements :agreements="project.agreements" @agreed="close"/>
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
            this.cb = opt.cb;
            this.project = opt.project;
            this.$nextTick(()=>{
                this.$refs.modal.show()
            });
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
