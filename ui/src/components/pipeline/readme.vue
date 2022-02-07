<template>
<div class="pipeline-readme">
    <div v-if="item._editing !== null">
        <b-form-textarea v-model="item._editing" rows="4" max-rows="9" placeholder="Enter a note here"/>
        <small class="text-muted">You can use <a href="https://help.github.com/articles/basic-writing-and-formatting-syntax/" target="_blank">markdown format</a></small>
    </div>
    <vue-markdown :source="item.readme" v-else class="readme"/>
</div>
</template>

<script>
import Vue from 'vue'

export default {
    props: [
        'item'
    ],

    components: {
        VueMarkdown: ()=>import('vue-markdown'),
    },

    data() {
        return {
        }
    },

    mounted() {
    },

    methods: {
    },

}
</script>

<style scoped>
.pipeline-readme {
    min-height: 100px;
}
.buttons {
    float: right; 
    opacity: 0.1;
    transition: 0.3s opacity;
}
.pipeline-readme:hover {
    /*background-color: #eee;*/
}
.pipeline-readme:hover > .buttons {
    opacity: 1;
}
/deep/ .readme p {
    margin-bottom: 0px;
}
</style>
