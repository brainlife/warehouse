<template>
<div>
    <div class="page-content">
        <div class="header">
            <b-container>
                <h2>App Test</h2>
                <p style="opacity: 0.7;">
                    This page contains some tools to help you develop your App. Please suggest features that could help you build your App!
                </p>
            </b-container>
        </div>

        <h4 class="header-sticky"><b-container>product.json</b-container></h4> 
        <b-container>
            <p>
                <small>Enter product.json content here</small>
                <editor v-model="product_json" @init="editorInit" lang="json" height="200"/>
            </p>
            <b-btn @click="updateProduct" variant="primary">Update</b-btn>
            <product v-if="product" :product="product"/>
        </b-container>
    </div>
</div>
</template>

<script>
import Vue from 'vue'

import product from '@/components/product'

export default {
    components: { 
        product,
        editor: require('vue2-ace-editor'),
    },
    data() {
        return {
            product_json: "",
            product: null,
            config: Vue.config
        }
    },

    computed: {
    },

    mounted: function() {
    },

    methods: {
        editorInit(editor) {
            require('brace/mode/json')
            editor.container.style.lineHeight = 1.25;
            editor.renderer.updateFontSize();
        },
        
        updateProduct() {
            try {
                this.product = null;
                this.product = JSON.parse(this.product_json);
                this.product_json = JSON.stringify(this.product, null, 4);
            } catch (err) {
                alert(err);
            }            
        },
    },
}
</script>

<style scoped>
.page-content {
top: 0px;
}
.page-content h2 {
margin-bottom: 0px;
padding: 10px 0px;
font-size: 20pt;
}
.page-content h3 {
background-color: white;
color: gray;
padding: 20px;
margin-bottom: 0px;
}
.page-content h4 {
padding: 15px 20px;
background-color: white;
opacity: 0.8;
color: #999;
font-size: 17pt;
font-weight: bold;
}
.header {
padding: 10px;
background-color: white;
border-bottom: 1px solid #eee;
}
.header-sticky {
position: sticky;
top: 0px;
z-index: 1;
box-shadow: 0 0 1px #ccc;
}
h4.header-sticky {
padding: 9px;
height: 50px;
}
</style>
