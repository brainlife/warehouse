<template>
<div class="rightview" :class="{open}" v-if="!noRightView">
    <div class="icon" @click="toggle('doc')" :class="{active: $root.rightviewOpen == 'doc'}">
        <icon name="book" scale="1.2"/>
    </div>

    <div v-if="open">
        <div v-if="loading" class="loading">Loading...</div>
        <div v-show="!loading">
            <iframe :src="src" frameBorder="0" @load="loaded" ref="docframe"/>
        </div>
    </div>
</div>
</template>

<script>

import Vue from 'vue'

export default {
    props: {
    },
    data() {
        let src = "/docs/user/started";
        if(Vue.config.debug) src = "https://test.brainlife.io"+src; //localhost doesn't have /docs.. so we have to use this
        return {
            loading: true,
            src,
        }
    },
    methods: {
        toggle(page) {
            if(this.$root.rightviewOpen == page) page = null;
            console.log(page);
            this.$root.toggleRightView(page);
        },
        loaded() {
            this.loading = false;

            console.log("doc frame loaded");
            /*
            //this only works for the same domain 
            //(Blocked a frame with origin "http://localhost:8080" from accessing a cross-origin frame.)
            //and css flickers.. so let's handle this via mkdocs extra_css
            let docframe = this.$refs.docframe;
            let html = docframe.contentWindow.document.querySelector('html');
            html.style.fontSize = '13pt';
            //body.style.lineHeight = '20px';
            */
        }
    },
    computed: {
        open() {
            if(this.$root.rightviewOpen == null) return false;
            //if(!this.noRigthView) return false;
            return true;
        },

        noRightView() {
            if(this.$router.currentRoute.meta && this.$router.currentRoute.meta.noRightView) return true;
            return false;
        },
    },
    created() {
    },
}
</script>

<style scoped>
.rightview {
    position: fixed;
    top: 0;
    bottom: 0;
    right: 0;
    background-color: #eee;
    box-shadow: 0 0 2px #0004;
    z-index: 4; /*on top of dataset/selected view*/
    transition: width 0.2s;
    width: 30px;
}

.rightview.open {
    width: 350px;
}
iframe {
    width: 100%;
    height: 100%;
    position: fixed;
    width: 320px;
    right: 0;
    top: 0;
    bottom: 0;
    transition: right 0.2s;
    right: -320px;
    background-color: white;
}
.open iframe {
    right: 0;
}
.closer {
    position: fixed;
    z-index: 5;
    top: 45px;
    right: 30px;
    opacity: 0.5;
}
.icon {
    width: 30px;
    height: 38px;
    padding: 8px 7px;
    transition: background-color 0.1s, color 0.1s;
}
.icon.active {
    box-shadow: inset 2px 0px 4px #0002;
    background-color: #0003;
    color: white;
}
.icon:hover {
    background-color: white;
    cursor: pointer;
    color: #666;
}

.loading {
    padding: 15px;
    opacity: 0.5;
    font-size: 120%;
}
</style>




