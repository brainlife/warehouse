<template>
<<<<<<< HEAD
<div class="mag">
    <div style="padding-left: 10px;">
        <h5 class="paper-title">{{ paper.title }}</h5>
        <p>
            <span class="mag-venue">
                {{ paper.venue }} | {{ new Date(paper.publicationDate).getFullYear() }}
            </span>
        </p>
        <p> {{ paper.abstract }} </p>
        <p> 
            <span v-for="(contact, idx) in paper.authors" :key="idx" >
                {{ contact.name }} <small>|</small>
            </span>
        </p>
        <p>
            <b-badge v-for="tag in paper.fields" :key="tag" class="topic">{{tag}}</b-badge>
        </p>
    </div>
=======
<div>
    <h5 class="paper-title">{{ paper.title }}</h5>
    <span class="mag-venue">
        {{ paper.venue }} | {{ new Date(paper.publicationDate).getFullYear() }}
    </span>
    <p>
        {{ paper.abstract }}
    </p>
    <p> 
        <span v-for="(contact, idx) in paper.authors" :key="idx" >
             <small v-if="idx">|</small> {{ contact.name }} 
        </span>
    </p>
    <p>
        <b-badge v-for="tag in paper.fields" :key="tag" class="topic">{{tag}}</b-badge>
    </p>
>>>>>>> 89f104fc9423a4e4b6267688de597e7956d8bc84

    <div style="background-color: #eee; padding: 10px; text-align: right;">
        <doibadge :doi="paper.doi" jump="true"/>
        <b-badge pill class="bigpill" title="Publication Date">
            <icon name="calendar" style="opacity: 0.4" />&nbsp;{{ new Date(paper.publicationDate).toLocaleDateString() }}
        </b-badge>
    </div>
</div>
</template>

<script>
import Vue from "vue";

import doibadge from "@/components/doibadge";

export default {
    components: { doibadge },
    props: ["paper"],
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
font-size: 130%;
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
