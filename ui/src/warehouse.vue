<template>
<div id="warehouse">
    <router-view/>
    <notifications position="bottom right"/>
    <modals/>

</div>
</template>

<script>

import Vue from 'vue'

import modals from '@/components/modals'

export default {
    components: {
        modals,
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
}

</script>

<style>

/*
@import url('https://fonts.googleapis.com/css?family=Cabin|Inconsolata|Nunito|Nunito+Sans|Pacifico|Quicksand|Rubik|VT323');
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

@import url('//fonts.googleapis.com/css?family=IBM+Plex+Sans');
@import url('//fonts.googleapis.com/css?family=Roboto');

*/

#warehouse {
height: 100%;
background-color: #f9f9f9;
color: #555;
font-size: 14px;
}

/*adjust bootstrap font sizes*/
.input-group-text {
font-size: 14px;
}

.form-control,
.custom-select {
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
height: 45px;
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

/*
@media screen and (max-width: 850px) {
    .page-header.with-menu,
    .page-footer.with-menu,
    .page-content.with-menu {
        left: 200px;
    }
}
*/

code.hljs {
font-size: 85%;
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
.button-fixed .fa-icon {
top: -1px;
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

.brainlife-tab {
min-height: 45px;
padding-top: 5px;
}
.brainlife-tab .nav-tabs {
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
.nav:focus {
outline: none;
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
.brainlife-modal-header-buttons {
float: right;
margin-top: 5px;
}
/*
.brainlife-modal-footer {
background-color: white;
padding: 10px 20px;
height: 60px;
position: fixed;
bottom: 30px;
box-shadow: inset 0 2px 2px rgba(0,0,0,0.1);
width: 100%;
}
*/
small {
font-size: 85%;
opacity: 0.7;
}
.col-form-label,
.form-header {
text-transform: uppercase;
opacity: 0.9;
font-weight: bold;
font-size: 95%;
}

.vs__actions button.clear {
position: relative;
top: 2px;
}

.v-select .dropdown-toggle {
background-color: white;
}
.v-select {
font-family: inherit;
}

/*prevent bootstrap-vue css conflict*/
.v-select.dropdown .dropdown-toggle::after {
display: none;
}
.v-select.dropdown .form-control {
height: inherit; 
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

.js-plotly-plot .plotly .modebar {
z-index: inherit;
}
::placeholder,
.form-control::placeholder {
color: black;
opacity: 0.35;
}

div.readme p, p.text {
line-height: 175%;
}
.readme img {
max-width: 100%;
}
.readme pre {
background-color: #f6f8fa;
padding: 10px;
margin-bottom: 15px;
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
/*
.hljs {
background-color: inherit;
}
*/

/*default vue-animate.css effect is too slow*/
.fade-enter-active, .fadeIn,
.fade-leave-active, .fadeOut {
  -webkit-animation-duration: 0.2s;
          animation-duration: 0.2s;
  -webkit-animation-fill-mode: both;
          animation-fill-mode: both; 
}
.github {
opacity: 0.7;
font-size: 90%;
margin-bottom: 2px;
}

.fa-icon {
position: relative;
top: -0.1em;
}

/*perfectscrollbar mod*/
.ps .ps__rail-y:hover,
.ps .ps__rail-y:focus,
.ps .ps__rail-y.ps--clicking  {
background-color: transparent;
opacity: 0.9;
}
.ps__thumb-y {
width: 11px;
}

/* this fixes some issue but creates another.. (can't select):
.ace_layer,
.ace_gutter {
z-index: inherit;
}
*/
</style>
