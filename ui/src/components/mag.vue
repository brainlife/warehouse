<template>
<div>
    <b-badge pill class="bigpill" title="Publication Date" style="float: right">
        <icon name="calendar" style="opacity: 0.4" />{{ new Date(paper.publicationDate).toLocaleDateString() }}
    </b-badge>
    <doibadge :doi="paper.doi" jump="true" style="float: right"/>
    <h5 class="paper-title">{{ paper.title }}</h5>
    <span class="mag-venue">
        {{ paper.venue }} | {{ new Date(paper.publicationDate).getFullYear() }}
    </span>
    <p style="opacity: 0.8; line-height: 180%; max-height: 125px; overflow: auto">
        {{ paper.abstract }}
    </p>
    <div style="display: inline-block; margin-top: 0; margin-bottom: 1rem">
        <div v-for="contact in paper.authors" :key="institution" class="contact">
            <img src="http://www.gravatar.com/avatar/?s=20&d=mp"/>
            <div class="name">{{ contact.name }}</div>
        </div>
    </div>
    <p>
        <b-badge v-for="tag in paper.fields" :key="tag" class="topic">{{tag}}</b-badge>
    </p>
    <hr>
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
padding-top: 10px;
transition: color 0.3s;
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
