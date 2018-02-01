<template>
<div id="warehouse">
    <router-view/>
    <notifications position="bottom right"/>

    <!--modal that can be called from any view -->
    <viewselecter/>
    <dataset/>
    <datatype/>

    <!--models only used by project page (TODO - move to project page eventually -->
    <datasetselecter/>
    <uploader/>
    <instanceselecter/>
    
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

export default {
    components: {
        //modals
        viewselecter, dataset, datatype, 
        uploader, datasetselecter, instanceselecter
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
*/

#warehouse {
height: 100%;
background-color: #f9f9f9;
color: #444;
font-size: 14px;
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

/*needed to keep iframe 100% with for view*/
html,body {
height:100%;
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
.page-content {
position: fixed;
left: 90px;
right: 0px;
top: 50px;
bottom: 0px;
overflow: auto;
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
padding-top: 10px;
border: none;
height: 50px;
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
}
#warehouse .card {
border-radius: 0;
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
</style>

