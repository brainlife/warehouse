<template>
<table width="100%">
    <tr v-for="(v,k) in config" :key="k" 
        class="config-row" 
        :class="{ default: isDefault(k), hideDefault: hideDefault }"
        :title="appconfig[k].desc" v-b-tooltip.hover>

        <!--key-->
        <th style="max-width:200px">{{k}}</th>

        <!--value-->
        <td>
            <div style="word-break: break-all; max-height: 300px; overflow: auto;">
                <pre v-if="v === null" class="text-muted" style="margin-bottom: 0;">null</pre>
                <span v-else-if="v === ''">(empty)</span>
                <pre v-else-if="typeof v == 'object'" style="margin-bottom: 0;">{{JSON.stringify(v, null, 4)}}</pre>
                <pre v-else style="white-space: pre-wrap; margin-bottom: 0;">{{v}}</pre>
            </div>
            <span style="position: relative; top: -4px; opacity: 0.6;" v-if="!isDefault(k)">(default: {{getDefault(k)}})</span>
        </td>
    </tr>
</table>
</template>

<script>
import Vue from 'vue'

export default {
    props: {
        config: Object,
        appconfig: Object,
        hideDefault: Boolean,
    },

    methods: {
        isDefault: function(key) {
            if(!this.appconfig[key]) return;
            return (this.appconfig[key].default == this.config[key]);
        },
        getDefault: function(key) {
            if(!this.appconfig[key]) return "[removed?]";
            var d = this.appconfig[key].default;
            if(d === undefined) {
                return "[not set]";
            }
            if(d === null) {
                return "[null]";
            }
            if(typeof d == 'boolean') {
                if(d) return "true";
                return "false";
            }
            if(d === '') {
                return "[empty]";
            }
            return d;
        },
    },
}

</script>

<style scoped>
tr.default {
opacity:.7;
}
tr.default.hideDefault {
display: none;
}
tr:hover {
opacity: inherit; 
color: #007bff;
}
pre {
color: inherit;
}
td,th {
vertical-align: top;
padding-right: 10px;
font-size: 90%;
}
</style>
