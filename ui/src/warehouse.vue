<template>
<div
    id="warehouse" 
    :class="{
        'sidewide': $root.sidemenuWide, 
        'rightviewOpen': $root.rightviewOpen
    }">
    <sidemenu/>
    <rightview/>
    <router-view/>
    <notifications position="bottom left"/>
    <modals/>
    <loading/>
</div>
</template>

<script>
import Vue from 'vue'
import modals from '@/components/modals'
import sidemenu from '@/components/sidemenu'
import rightview from '@/components/rightview'
import loading from '@/components/loading'

export default {
    components: {
        modals,
        sidemenu,
        loading,
        rightview,
    },

    data() {
        return {
            config: Vue.config,
        }
    },

    watch: {
        '$route': function() {
            this.handleHashRequest();
        }
    },

    mounted() {
        this.handleHashRequest();
    },

    methods: {
        handleHashRequest() {
            if(document.location.hash.startsWith("#ezbids")) {
                if(!Vue.config.jwt) {
                    sessionStorage.setItem('auth_redirect', document.location.href);
                    document.location = Vue.config.auth_signin;
                } else {
                    const urlFragment = document.location.hash;
                    // we expect a hash of type: #ezbids=abc123&pipeline=DWI for example or #ezbids=abc123 (pipeline may or may not be there)
                    const { ezbids: ezBidsSessionId, pipeline: pipelineName } = Object.fromEntries(
                        urlFragment.substring(1).split('&').map((keyValProp) => keyValProp.split('='))
                    );
                    if (!ezBidsSessionId) return;

                    this.$root.ezbidsSession = {
                        sessionId: ezBidsSessionId,
                        pipelineName: pipelineName ? pipelineName : null
                    };
                }
            }

            if(document.location.hash.startsWith("#object")) {
                const id = document.location.hash.substring(8);
                this.$root.openDataObject = {id};
            }
        },
    },

}
</script>

<style>

@import url('https://fonts.googleapis.com/css?family=Open+Sans:700'); /*only used by pageheader title*/
@import url('https://fonts.googleapis.com/css2?family=Merriweather+Sans:wght@400;700&family=Merriweather:wght@400;700');

#warehouse {
    height: 100%;
    background-color: #f9f9f9;
    color: #333;
    font-size: 14px;
    font-family: 'Merriweather Sans',Georgia,sans-serif;
}
.serif {
    font-family: Merriweather,Georgia,serif;
}
.readme {
    line-height: 180%;
}

h1,h2,h3,h4,h5,.title {
    font-weight: 600;
}

body.dragging {
    user-select: none;
}
.select2-container, 
.form-control,
.custom-select {
    font-size: 14px;
}
.dropdown-menu {
    font-size: inherit;
}

.progress {
    border-radius: inherit;
}

/*adjust bootstrap font sizes*/
.input-group-text {
    font-size: 14px;
}
legend {
    font-size: 1.1rem;
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
    box-shadow: 0px 0px 5px rgba(0,0,0,0.2);
    z-index: 1;
    background-color: white;
}
.page-header h4 {
    opacity: 0.8;
    overflow: hidden; 
    white-space: nowrap; 
    text-overflow: ellipsis;
}

.page-header,
.page-content {
    position: fixed;
    left: 40px;
    right: 30px;
    top: 0px;
    transition: left 0.2s, right 0.2s;
}

.sidewide .page-header, 
.sidewide .page-footer,
.sidewide .page-content, 
.sidewide .search-box {
    left: 180px;
}

.onRight {
    transition: right 0.2s;
    right: 30px;
}
.rightviewOpen .page-header, 
.rightviewOpen .page-footer,
.rightviewOpen .page-content,
.rightviewOpen .button-fixed,
.rightviewOpen .onRight {
    right: 350px;
}

.page-content {
    top: 50px;
    bottom: 0px;
    overflow: auto;

}
.page-footer {
    text-align: right; 
    position: fixed; 
    height: 60px;
    left: 40px;
    right: 30px;
    bottom: 0px; 
    padding: 10px 30px;
    background-color: rgba(100,100,100,0.4);
    z-index: 7;
    pointer-events: none;
    transition: left 0.2s, right 0.2s;
}

.page-footer .btn {
    pointer-events: auto;
}

.page-footer.with-menu,
.page-header.with-menu,
.page-content.with-menu {
    left: 480px;
    transition: 0.2s left;
}
code.hljs {
    font-size: 85%;
}
.table {
    color: inherit;
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
}
.table-sm {
    font-size: 90%;
}
/*
.table-sm td {
    padding: 0 3px;
    line-height: 110%;
}
*/

#warehouse .table thead th,
#warehouse .table td {
    opacity: 0.8;
    text-transform: uppercase;
    padding: 5px;
    border: none;
}

.button-fixed {
    position: fixed;
    bottom: 20px;
    right: 30px;
    margin-right: 30px;
    border-radius: 4px;
    width: 150px;
    font-weight: bold;
    border: none;
    background-color: #159957;
    transition: background-image 0.5s, left 0.2s, right 0.2s, opacity 0.5s, transform 0.2s, margin-right 0.2s;
    box-shadow: 1px 1px 3px #0001;
    color: white;
    z-index: 6;
}
.button-fixed:hover {
    transform: scale(1.05);
    background-color: #2693ff;
    cursor: pointer;
}

.fa-icon {
    vertical-align: middle !important;
    position: relative;
    fill: currentColor;
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

.brainlife-tab {
    min-height: 45px;
    padding-top: 5px;
    overflow: hidden;
}
.brainlife-tab .nav-tabs {
    border: none;
    background-color: white;
}

.brainlife-tab .nav-item a {
    color: inherit;
    opacity: 0.6;
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

:focus {
    outline: none;
}

#warehouse .alert {
    border-radius: 0;
    border: none;
    margin-bottom: 0px;
}
.card {
    border: none;
    box-shadow: 0 0 3px #0002;
    border-radius: 0;
}
.card.roundtop {
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
}
.card.roundbottom {
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
}

.modal-content {
    border-radius: 0;
}
.modal-dialog {
    box-shadow: 0 0 20px #000;
    font-size: 11pt;
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

small {
    font-size: 85%;
    opacity: 0.8;
}

.col-form-label,
.form-header {
    text-transform: uppercase;
    opacity: 0.8;
    font-weight: bold;
    font-size: 13px;
    margin-bottom: 5px;
    display: block;
}

.form-sub-header {
    font-weight: bold;
    opacity: 0.8;
    font-size: 11px;
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

.readme {
    line-height: 175%;
}
.pub p {
    line-height: 180%;
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
    font-size: 1.3rem;
}
.readme h2 {
    font-size: 1.2rem;
}
.readme h3,
.readme h4,
.readme h5,
.readme h6 {
    font-size: 1.1rem;
}

.readme .table {
    font-size: 90%;
    background-color: white;
}
.readme .table th {
    font-size: 80%;
}
.readme .table td {
    padding: 2px 4px;
}

pre {
    margin-bottom: 0px;
    white-space: pre-wrap;
}

/*default vue-animate.css effect is too slow*/
/*
.fade-enter-active, .fadeIn,
.fade-leave-active, .fadeOut {
  -webkit-animation-duration: 0.2s;
          animation-duration: 0.2s;
  -webkit-animation-fill-mode: both;
          animation-fill-mode: both; 
}
*/

.github {
    opacity: 0.7;
    font-size: 90%;
    margin-bottom: 2px;
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
.search-box {
    position: fixed;
    top: 6px;
    padding-left: 10px;
    right: 30px;
    left: 40px;
    transition: left 0.2s;
}
.search-box .input {
    font-size: 120%;
    background-color: #fff6;
    border: none;
    transition: background-color 0.5s, color 0.5s;
    padding-left: 45px;
}

.search-box .input:focus,
.search-box .input:not([value=""]) {
    color: gray;
    box-shadow: none;
}

.search-box .search-icon {
    position: absolute;
    top: 7px;
    left: 20px;
    z-index: -1;
    transition: color 0.5s;
}
.search-box .clear-search {
    position: absolute;
    top: 5px;
    right: 20px;
    z-index: 1;
    transition: color 0.5s;
    opacity: 0.4;
    cursor: pointer;
}
.search-box .input::placeholder {
    font-weight: bold;
}

.search-box .search-icon,
.search-box .input::placeholder {
    color: black;
    opacity: 0.3;
}
.search-box .input:focus::placeholder {
    opacity: 0;
}
.input:focus ~ .search-icon,
.input:not([value=""]) ~ .search-icon {
    color: gray;
    z-index: 2;
}

.btn-outline-info.active,
.btn-outline-info:hover,
.bg-info {
    background-color: #50bfff !important;
}

.btn-outline-info {
    color: #50bfff;
}

.splitter {
    position: fixed;
    top: 0px;
    bottom: 0px;
    width: 10px;
    cursor: ew-resize;
    background-color: #eee;
    transition: background-color 0.3s;
}
.splitter:hover {
    background-color: #ddd;
}

.bigpill {
    background-color: white; 
    text-transform: uppercase; 
    border: 1px solid #ddd; 
    padding: 4px 15px; 
    opacity: 0.8;
    color: #333;
    height: 26px;
}
.bigpill svg {
    min-height: 16px;
}
.bigpill.clickable:hover {
    background-color: #ccc;
    cursor: pointer;
}

.scroll-shadow {
    /*https://stackoverflow.com/questions/9333379/check-if-an-elements-content-is-overflowing*/
    background:
    /* Shadow covers */
    linear-gradient(white 30%, rgba(255,255,255,0)),
    linear-gradient(rgba(255,255,255,0), white 70%) 0 100%,

    /* Shadows */
    radial-gradient(50% 0, farthest-side, rgba(0,0,0,.3), rgba(0,0,0,0)),
    radial-gradient(50% 100%,farthest-side, rgba(0,0,0,.3), rgba(0,0,0,0)) 0 100%;

    background:
    /* Shadow covers */
    linear-gradient(white 30%, rgba(255,255,255,0)),
    linear-gradient(rgba(255,255,255,0), white 70%) 0 100%,

    /* Shadows */
    radial-gradient(farthest-side at 50% 0, rgba(0,0,0,.3), rgba(0,0,0,0)),
    radial-gradient(farthest-side at 50% 100%, rgba(0,0,0,.3), rgba(0,0,0,0)) 0 100%;

    background-repeat: no-repeat;
    background-color: white;
    background-size: 100% 40px, 100% 40px, 100% 14px, 100% 14px;

    /* Opera doesn't support this in the shorthand */
    background-attachment: local, local, scroll, scroll;
}

.btn-primary {
    background-color: #2693ff;
    border-color: #2693ff90;
}

.status-color.finished {
    color: white;
    background-color: #28a745;
}
.status-color.failed {
    color: white;
    background-color: #c00;
}
.status-color.running_sync,
.status-color.running {
    color: white;
    background-color: #007bff;
}
.status-color.waiting {
    color: white;
    background-color: #50bfff;
}
.status-color.requested {
    color: white;
    background-color: #50bfff;
}
.status-color.removed,
.status-color.stop_requested,
.status-color.stopped {
    color: white;
    background-color: gray;
}

/*
hide rightview for mobile
https://stackoverflow.com/questions/14942081/detect-if-a-browser-in-a-mobile-device-ios-android-phone-tablet-is-used*/
@media (pointer:none), (pointer:coarse),
@media (max-width: 800px) {
    /*hide un-opened rightview menu for mobile*/
    #warehouse:not(.rightviewOpen) .rightview {
        display: none;
    }
    #warehouse:not(.rightviewOpen) .page-header,
    #warehouse:not(.rightviewOpen) .page-content,
    #warehouse:not(.rightviewOpen) .onRight {
        right: 0;
    }
}

#notebook-container.container {
    width: 100px;
}
.badge {
    font-size: 80%;
    position: relative;
    top: -1px;
}

</style>
