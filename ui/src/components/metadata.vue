<template>
<div style="padding: 3px 0">
    <b-button variant="link" v-if="!show" @click="show = true" size="sm"><icon name="caret-right"/> Show Metadata</b-button>
    <b-button variant="link" v-if="show" @click="show = false" size="sm"><icon name="caret-down"/> Hide Metadata</b-button>
    <pre v-if="show && _meta">{{JSON.stringify(_meta, null, 4)}}</pre>
</div>

</template>
<script>

import Vue from 'vue'

export default {
    props: {
        id: {type: String},
        meta: {type: Object},
    },
    data() {
        return {
            _meta: null,
            config: Vue.config,
            show: false,
        }
    },
    async mounted() {
        if(this.meta) {
            Object.assign(this._meta, this.meta);
        }

        if(this.id) {
            const res = await this.$http.get('dataset', {params: {
                find: JSON.stringify({_id: this.id}),
                select: "meta project",
            }});
            if(res.status == 200 && res.data.count == 1) {
                this._meta = res.data.datasets[0].meta;
            }
        }
    },
}
</script>

<style scoped>
pre {
    font-size: 80%;
    max-height: 200px;
    overflow: auto;
    background-color: #eee;
    padding: 5px;
}
</style>
