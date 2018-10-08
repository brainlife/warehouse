<template>
<b-modal :no-close-on-backdrop='true' title="Download Selected Datasets" ref="modal" size="lg">
    <p class="text-muted">Please run following command on your terminal.</p>
    <br>
    <pre v-if="ds">
    curl https://dev1.soichi.us/api/warehouse/dataset/ds/{{ds.id}} | bash
    </pre>
    <br>
    <div slot="modal-footer">
        <b-button variant="primary" @click="close">Close</b-button>
    </div>
</b-modal>
</template>

<script>
import Vue from 'vue'

export default {
    components: { },

    data() {
        return {
            ds: null,
        }
    },

    destroyed() {
        this.$root.$off("downscript.open");
    },

    mounted() {
        console.log("listening downscript.open");
        this.$root.$on("downscript.open", ds=>{
            console.dir(ds);
            this.ds = ds;
            this.$refs.modal.show()
        });
    },

    methods: {
        close: function() {
            this.$refs.modal.hide();
        },
    },
} 
</script>
