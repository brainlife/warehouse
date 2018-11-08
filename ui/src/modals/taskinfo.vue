<template>
<transition name="fade">
<div v-if="open" class="brainlife-modal-overlay">
<b-container class="brainlife-modal">
    <div class="brainlife-modal-header">
        <div style="float: right;">
            <div class="button" @click="open = false" style="margin-left: 20px; opacity: 0.8;">
                <icon name="times" scale="1.5"/>
            </div>
        </div>
        <h4 style="margin-top: 8px;">Task Info</h4>
    </div><!--header-->

    {{task}}

</b-container>
</div>
</transition>
</template>

<script>
import Vue from 'vue'

import app from '@/components/app'
import datatypetag from '@/components/datatypetag'
import configform from '@/components/configform'
import advanced from '@/components/appadvanced'
import tageditor from '@/components/tageditor'

const lib = require('../lib');

export default {
    components: { 
        app, datatypetag, configform, advanced, tageditor,
    },

    data() {
        return {
            open: false,
            task: null,
        }
    },

    created() {
        this.$root.$on("taskinfo.open", task=>{
            this.task = task;
            this.open = true;
        });

        //TODO - call removeEventListener in destroy()? Or I should do this everytime modal is shown/hidden?
        document.addEventListener("keydown", e => {
            if (e.keyCode == 27) {
                this.open = false;
            }
        });
    },

    destroyed() {
        this.$root.$off("taskinfo.open");
    },

    methods: {
    },
} 
</script>

<style scoped>
</style>
