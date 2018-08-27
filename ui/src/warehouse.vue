<template>
<div id="warehouse">
    <router-view/>
    <notifications position="bottom right"/>

    <!--modal that can be called from any view -->
    <dataset/>
    <datatype/>
    <agreements/>

    <!--models only used by project page (TODO - move to project page eventually -->
    <div v-if="config.user">
        <viewselecter/>
        <datasetselecter/>
        <uploader/>
        <instanceselecter/>
        <archiver/>
    </div>
</div>
</template>

<script>

import Vue from 'vue'

//modals
import viewselecter from '@/modals/viewselecter'
import dataset from '@/modals/dataset'
import datatype from '@/modals/datatype'
import datasetselecter from '@/modals/datasetselecter'
import uploader from '@/modals/uploader'
import instanceselecter from '@/modals/instanceselecter'
import archiver from '@/modals/archiver'
import agreements from '@/modals/agreements'

export default {
    components: {
        viewselecter, dataset, datatype, 
        uploader, datasetselecter, instanceselecter, 
        archiver, agreements,
    },
    data() {
        return {
            config: Vue.config,
        }
    },
    mounted() {
        this.$root.$emit("refresh_jwt");
        setInterval(()=>{
            this.$root.$emit("refresh_jwt");
        }, 1000*1800);  //refresh in half an hour
    },
    methods: { 
    },
}

</script>


<style>

/*@import url('https://fonts.googleapis.com/css?family=Cabin|Inconsolata|Nunito|Nunito+Sans|Pacifico|Quicksand|Rubik|VT323');
font-family: 'Rubik', sans-serif;
font-family: 'Pacifico', cursive;
font-family: 'Quicksand', sans-serif;
font-family: 'Inconsolata', monospace;
font-family: 'Cabin', sans-serif;
font-family: 'VT323', monospace;
font-family: 'Nunito', sans-serif;
font-family: 'Nunito Sans', sans-serif;

@import url('//fonts.googleapis.com/css?family=Muli');
font-size: 11pt; font-family: muli;

@import url('//fonts.googleapis.com/css?family=Montserrat');
font-family: 'Montserrat', sans-serif;
*/

#warehouse {
height: 100%;
background-color: #f9f9f9;
color: #555;
font-size: 11pt;
}

/*adjust bootstrap font sizes*/
.input-group-text {
font-size: 14px;
}
.form-control {
font-size: inherit;
}
legend {
font-size: 1.1rem;
}
.dropdown-menu {
font-size: inherit;
}
/*needed to keep iframe 100% with for view*/
html,body {
height:100%;
overflow: hidden;
}

/*deprecate below eventually*/

.clickable {
cursor: pointer;
}

.margin20 {
margin: 20px;
}
.margin10 {
margin: 10px;
}

.page-header {
height: 50px;
}
.page-header,
.page-content {
position: fixed;
left: 50px;
right: 0px;
top: 50px;
}
.page-content {
bottom: 0px;
overflow: auto;
}
.page-footer {
text-align: right; 
position: fixed; 
height: 60px;
left: 50px;
right: 0px;
bottom: 0px; 
padding: 10px 30px;
background-color: rgba(100,100,100,0.4);
}

.page-footer.with-menu,
.page-header.with-menu,
.page-content.with-menu {
left: 330px;
transition: 0.2s left;
}

@media screen and (max-width: 850px) {
    .page-header.with-menu,
    .page-footer.with-menu,
    .page-content.with-menu {
        left: 200px;
    }
}

code.hljs {
font-size: 80%;
}
table.info {
width: 100%;
border-spacing: 1px;
font-size: 13px;
}
table.info tr {
background-color: white;
}
table.info th {
color: #777; 
text-align: left;
vertical-align: top;
padding: 10px;
margin: 0px;
font-weight: 600;
}
table.info td {
padding: 10px;
line-height: 140%;
}
#warehouse .table thead th {
opacity: 0.5;
text-transform: uppercase;
}

.button-fixed {
opacity: 0.7;
position: fixed;
bottom: 20px;
right: 30px;
border-radius: 25px;
width: 50px;
height: 50px;
padding: 10px;
margin: 10px;
font-weight: bold;
color: white;
background-color: gray;
border: none;
box-shadow: 1px 1px 5px rgba(0,0,0,0.2);
transition: background-color 0.3s, transform 0.5s, box-shadow 0.5s, left 0.5s, right 0.5s, opacity 0.5s;
z-index: 2;
}
.button-fixed:hover {
opacity: 1;
background-color: #2693ff;
transform: rotate(180deg);
box-shadow: none;
cursor: pointer;
}
.button {
display: inline-block;
color: rgba(0,0,0,0.5);
padding: 4px 8px;
min-width: 25px;
cursor: pointer;
border-radius: 3px;
transition: background-color 0.3s;
}
.button:hover {
background-color: rgba(0,0,0,0.3);
color: white;
}
.button-danger {
color: #dc3545;
}
.button-gray {
opacity: 0.5;
}
.button-danger:hover {
background-color: #dc3545;
color: white;
}

.table th, .table td {
border-top: none;
}

/*------------------------------------------------------------*/
/* update bootstrap default tab */

.brainlife-tab-dark .nav-tabs {
padding-top: 10px;
border: none;
background-color: #444;
color:white;
}
.brainlife-tab-dark .nav-item a {
color: inherit;
opacity: 0.5;
border: none;
transition: color 0.5s, opacity 0.5s;
font-weight: bold;
}
.brainlife-tab-dark .nav-item a:hover {
opacity: 1;
}
.brainlife-tab-dark .nav-item a[aria-selected="true"] {
color: #fff;
background:none;
opacity: 1;
border-bottom: 3px solid #aaa;
}

.brainlife-tab .nav-tabs {
padding-top: 9px;
border: none;
background-color: white;
}

.brainlife-tab .nav-item a {
color: inherit;
opacity: 0.5;
border: none;
transition: color 0.5s, opacity 0.5s;
font-weight: bold;
}
.brainlife-tab .nav-item a:hover {
color: #007bff;
opacity: 1;
}
.brainlife-tab .nav-item a[aria-selected="true"] {
color: #2693ff;
opacity: 1;
border-bottom: 3px solid #2693ff;
}

#warehouse .alert {
border-radius: 0;
border: none;
margin-bottom: 0px;
}
#warehouse .card {
border-radius: 0;
}

.modal-content {
border-radius: 0;
}
.modal-dialog {
box-shadow: 0 0 20px #000;
}
.brainlife-modal {
background-color: #fff;
height: 100%;
padding: 0px;
box-shadow: 0 0 20px #000;
position: relative;
}
.brainlife-modal-overlay {
position: fixed;
top: 0px;
left: 0px;
bottom: 0px;
right: 0px;
background-color: rgba(0,0,0,0.3);
z-index: 10;
padding: 30px;
}
.brainlife-modal-header {
background-color: white;
padding: 10px 20px;
box-shadow: 0 0 3px rgba(0,0,0,0.5);
z-index: 20;
height: 60px;
position: relative;
}
.readme pre {
background-color: white;
padding: 10px;
}
small {
font-size: 85%;
opacity: 0.7;
}
.form-header {
text-transform: uppercase;
opacity: 0.4;
font-weight: bold;
font-size: 90%;
}
div.readme p, p.text {
line-height: 175%;
}
.v-select .dropdown-toggle {
background-color: white;
}
.v-select {
font-family: inherit;
}

.select2-container--default .select2-selection--single {
height: 36px;
}
.select2-container--default .select2-selection--single .select2-selection__rendered {
margin: 3px 0px;
}
.select2-container--default .select2-selection--single,
.select2-container--default.select2-container--focus .select2-selection--multiple,
.select2-container--default .select2-selection--multiple {
border: 1px solid #ced4da;
}

.ps__rail-x:hover, .ps__rail-y:hover, .ps__rail-x:focus, .ps__rail-y:focus {
background-color: rgba(0,0,0,0);
opacity: 1;
}
.ps__rail-y {
width: 6px;
}
.ps__rail-y:hover > .ps__thumb-y, .ps__rail-y:focus > .ps__thumb-y {
width: 6px;
}
.js-plotly-plot .plotly .modebar {
z-index: inherit;
}
::placeholder,
.form-control::placeholder {
color: black;
opacity: 0.35;
}

.readme h1 {
font-size: 1.5rem;
}
.readme h2 {
font-size: 1.3rem;
}
.readme h3 {
font-size: 1.1rem;
}
.readme h4,
.readme h5,
.readme h6 {
font-size: 1rem;
}

pre {
margin-bottom: 0px;
}
.hljs {
background-color: inherit;
}

</style>


