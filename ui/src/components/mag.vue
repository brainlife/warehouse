<template>
<div class="mag">
    <div style="margin-bottom: 8px;">
        <h5 class="paper-title serif">{{paper.title}}</h5>
        <p class="mag-venue">
            {{ paper.venue }} | {{ new Date(paper.publicationDate).getFullYear() }}
        </p>
        <doibadge :doi="paper.doi" jump="true"/>
        <b-badge pill class="bigpill" title="Publication Date">
            <icon name="calendar" style="opacity: 0.4" />&nbsp;{{ new Date(paper.publicationDate).toLocaleDateString() }}
        </b-badge>
    </div>
    <p style="margin-bottom: 5px;" class="serif">
        <!--first 100 words-->
        <span>{{abstract100.join(" ")}}</span>
        <!--after 100 words-->
        <a href="javascript:void(0)" v-if="!showRest" @click="showRest = true;">&nbsp;Show More&nbsp;</a>
        <span v-if="showRest">{{abstractRest.join(" ")}}</span>
    </p>
    <p style="opacity: 0.7; margin-bottom: 5px; font-size: 95%;"> 
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
    line-height: 200%; 
    margin-bottom: 10px;
}
.mag:not(:last-child) {
    border-bottom: 1px solid #ddd;
}
.paper-title {
    text-transform: capitalize;
    color: #666;
    padding: 0px;
    transition: color 0.3s;
    font-size: 100%;
    line-height: 180%;
    margin-bottom: 0;
}

.mag-venue {
    font-style: italic;
    opacity: 0.6;
    margin-bottom: 5px;
}
.topic {
    padding: 4px; 
    background-color: #eee;
    text-transform: uppercase;
    color: #666;
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
