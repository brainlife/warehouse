<template>
<div class="rightview" :class="{open}" v-if="!noRightView">
    <div class="icon" @click="toggle('doc')" :class="{active: $root.rightviewOpen == 'doc'}">
        <icon name="book" scale="1.2"/>
    </div>

    <div v-if="open">
        <div v-if="loading" class="loading">Loading...</div>
        <div v-show="!loading">
            <iframe :src="docSrc" frameBorder="0" @load="loaded" ref="docframe"/>
        </div>
    </div>
</div>
</template>

<script>

import Vue from 'vue'

export default {
    data() {
        return {
            loading: true,
            docSrc: null,
        }
    },

    watch: {
        '$route'() {
            let doc = this.findDoc();
            if(doc) this.setDocUrl(doc);
        }
    },

    mounted() {
        let doc = this.findDoc();
        if(!doc) doc = "/docs/user/started";
        this.setDocUrl(doc);
    },

    methods: {
        setDocUrl(src) {
            if(Vue.config.debug) src = "https://test.brainlife.io"+src; //localhost doesn't have /docs.. so we have to use this
            //console.log("setting doc url", src);
            this.docSrc = src;
        },

        findDoc() {
            //pick a page to show based on sidemenu 
            if(this.$route.meta) {
                //console.log("sidemenu", this.$route.meta.sidemenu)
                let doc = null;
                switch(this.$route.meta.sidemenu) {

                case "project":
                    //project page has sub pages
                    switch(this.$route.params.tab) {
                    case "dataset":
                        return "/docs/user/archive";
                    case "process":
                        return "/docs/user/process/"; 
                    case "pipeline":
                        return "/docs/user/pipeline/"; 
                    case "groupanalysis":
                        return "/docs/user/groupanalysis/"; 
                        break;
                    case "pub":
                        return "/docs/user/publication/"; 
                    default:
                        return "/docs/user/project/";
                    }
                    break;

                case "app":
                    switch(this.$route.params.mode) {
                    case "edit":
                        return "/docs/apps/register/";
                    default:
                        return "/docs/user/started/";
                    }
                    break;

                case "datatype":
                    return "/docs/user/datatypes/";
                case "pub":
                    //TODO - this is for users publishing things - not looking at published stuff
                    return "/docs/user/publication/";
                case "app":
                    return "/docs/user/started/#apps";
                case "resource":
                    return "/docs/resources/register/";
                case "dataset":
                    return "/docs/user/datasets/";
                }
                return null;
            }
        },

        toggle(page) {
            if(this.$root.rightviewOpen == page) page = null;
            //console.log(page);
            this.$root.toggleRightView(page);
        },
        loaded() {
            this.loading = false;
            //console.log("doc frame loaded");
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
    height: 50px;
    padding: 15px 7px;
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




