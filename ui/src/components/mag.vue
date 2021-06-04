<template>
<div style="line-height: 200%;">
    <div style="border-left: 3px solid #ddd; padding-left: 10px; margin-bottom: 10px;">
        <h5 class="paper-title">{{paper.title}}</h5>
        <doibadge :doi="paper.doi" jump="true"/>
        <b-badge pill class="bigpill" title="Publication Date">
            <icon name="calendar" style="opacity: 0.4" />&nbsp;{{ new Date(paper.publicationDate).toLocaleDateString() }}
        </b-badge>
        &nbsp;
        &nbsp;
        <span class="mag-venue">
            {{ paper.venue }} | {{ new Date(paper.publicationDate).getFullYear() }}
        </span>
    </div>
    <p>
        <!--first 100 words-->
        <span>{{abstract100.join(" ")}}</span>
        <!--after 100 words-->
        <a href="javascript:void(0)" v-if="!showRest" @click="showRest = true;">.. show more</a>
        <span v-if="showRest">{{abstractRest.join(" ")}}</span>
    </p>
    <p style="opacity: 0.7;"> 
        <span v-for="(contact, idx) in paper.authors" :key="idx" >
             <small v-if="idx">|</small> {{ contact.name }} 
        </span>
    </p>
    <p>
        <b-badge v-for="tag in paper.fields" :key="tag" class="topic">{{tag}}</b-badge>
    </p>
</div>
</template>

<script>
import Vue from "vue";

import doibadge from "@/components/doibadge";

export default {
    components: { doibadge },
    props: ["paper"],
    data() {
        return {
            abstract100: [],
            abstractRest: [],
            showRest: true,
        }
    },
    mounted() {
        if(this.paper.abstract) {
            const tokens = this.paper.abstract.split(" ");
            this.abstract100 = tokens.slice(0, 100);
            this.abstractRest = tokens.slice(100);
            if(this.abstractRest.length) this.showRest = false;
        }
    }
};
</script>

<style scoped>
.mag {
    border-left: 3px solid #f0f0f0;
}
h4 {
    font-size: 15px;
    font-weight: bold;
    color: #333;
}
.topic {
    padding: 4px;
    background-color: #eee;
    text-transform: uppercase;
    color: #999;
    border-radius: 0px;
    margin-right: 4px;
    margin-bottom: 2px;
}

.paper-title {
    text-transform: capitalize;
    color: #333;
    padding: 0px;
    transition: color 0.3s;
    font-size: 120%;
    line-height: 200%;
}

.mag-venue {
font-style: italic;
opacity: 0.6;
}
.topic {
padding: 4px; 
background-color: #eee;
text-transform: uppercase;
color: #999;
border-radius: 0px;
margin-right: 4px;
margin-bottom: 2px;
}
.contact {
display: inline-block;
height: 20px;
margin-right: 10px;
font-size: 11px;
font-weight: 700;
white-space: nowrap;
line-height: 20px;
margin-right: 5px;
cursor: pointer;
}
.contact img {
float: left;
height: 20px;
background:#999;
}
.name {
background-color: #fff;
display: inline-block;
padding: 0px 10px;
}
</style>
