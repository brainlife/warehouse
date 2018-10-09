<template>
<b-modal :no-close-on-backdrop='true' title="Download Selected Datasets" ref="modal" size="lg">
    <p class="text-muted">Please copy and paste the following command on your terminal to download your datasets.</p>
    <br>
    <pre style="white-space: pre-wrap; font-size: 70%">curl -H "Authorization: Bearer {{jwt}}" -H "Content-Type: application/json" -d '{{json}}' -X POST https://dev1.soichi.us/api/warehouse/dataset/downscript | bash</pre>
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
            query: null,
            jwt: Vue.config.jwt,
        }
    },

    destroyed() {
        this.$root.$off("downscript.open");
    },

    computed: {
        json() {
            if(!this.query) return null;
            let json = {};
            if(this.query.find) json.find = JSON.stringify(this.query.find);
            return JSON.stringify(json);
        }
    },

    mounted() {
        console.log("listening downscript.open");
        this.$root.$on("downscript.open", query=>{
            this.query = query;
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
