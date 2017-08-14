<template>
<div>
    <pageheader :user="config.user" />
    <sidemenu active="/datatypepage" />
    <div class="header" v-if="datatype">
        <div class="avatar">
            <img v-bind:src="datatype.image || ('https://robohash.org/' + encodeURIComponent(name))" />
        </div>
        <br />
        <br />
        <h1>{{datatype.name}}</h1>
    </div>
    <div class="page-content" v-if="datatype" style="margin-top: 45px; padding-top: 60px;">
        <div style="margin-left: 120px; min-height: 50px;">
            <div>
                <el-tag type="primary">datatype</el-tag>
                {{datatype.desc}}
            </div>
        </div>
        
        <table class="info">
            <tr>
                <th>DOI (2do)</th>
                <td><pre>10.1006/br.a.{{datatype._id}}</pre></td>
            </tr>
            <tr>
                <th>Raw Configuration</th>
                <td>
                    <pre v-highlightjs><code class="json hljs">{{datatype}}</code></pre>
                </td>
            </tr>
            
        </table>
    </div>
</div>
</template>

<script>

import Vue from 'vue'
import Router from 'vue-router'

import sidemenu from '@/components/sidemenu'
import pageheader from '@/components/pageheader'

export default {
    components: { sidemenu, pageheader },
    data () {
        return {
            /**
             * datatype contains _id, desc, files, meta, name, validator
             */
            
            datatype: null,
            config: Vue.config
        }
    },
    mounted () {
        this.id = this.$route.params.id;
        
        this.$http.get(Vue.config.api + "/datatype", {
            params: {
                find: JSON.stringify({
                    _id: this.id
                })
            }
        }).then(res => {
            this.datatype = res.body.datatypes[0];
        }).catch(err => {
            console.error(err);
        });
    },
    methods: {
        
    }
}

</script>

<style scoped>
.avatar {
    display:inline-block;
    float:left;
    margin-right:10px;
    margin-top:20px;
    background-color:white;
    padding:3px;
    border:1px solid #ddd;
    box-shadow:3px 3px 3px rgba(0, 0, 0, .25);
}
.avatar img {
    width:auto;
    height:80px;
    background-color:#ddd;
}
.ui.text.menu {
    margin: 0;
}
.dataset:hover {
    cursor: pointer;
    background-color: #ccc;
}
.header {
    background-color: #777;
    border-bottom: 1px solid #777;
    padding: 20px;
    padding-bottom: 30px;
    margin-top: 42px;
    height: 40px;
    position: fixed;
    right: 0px;
    left: 90px;
    color: #aaa;
    z-index: 1;
}
.header h1 {
    color: #eee;
}
.header-bottom {
    height: 50px;
    background-color: white;
    position: fixed;
    top: 140px;
    right: 0px;
    left: 90px;
    border-bottom: 1px solid #ddd;
}
.appdesc {
    margin: 20px 30px 30px 138px;
    color: gray;
}
</style>