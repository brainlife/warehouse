import Vue from 'vue'
import Router from 'vue-router'

import dashboard from '@/dashboard'

//import datasets from '@/datasets'
//import dataset from '@/dataset'
//import upload from '@/upload'
import download from '@/download'

import view from '@/view'
import novnc from '@/novnc'

import processes from '@/processes'

import apps from '@/apps'
import app from '@/app'
import appedit from '@/appedit'

//import projects from '@/projects'
import project from '@/project'
import projectedit from '@/projectedit'

import datatypes from '@/datatypes'
import datatype from '@/datatype'
import datatypeedit from '@/datatypeedit'

import settings from '@/settings'

import test from '@/test'
import missing from '@/missing'

import pubs from '@/pubs'
import pub from '@/pub'

import admin from '@/admin'
import Meta from 'vue-meta'

Vue.use(Router)
Vue.use(Meta, /*{
  keyName: 'metaInfo', // the component option name that vue-meta looks for meta info on.
  attribute: 'data-vue-meta', // the attribute name vue-meta adds to the tags it observes
  ssrAttribute: 'data-vue-meta-server-rendered', // the attribute name that lets vue-meta know that meta info has already been server-rendered
  tagIDKeyName: 'vmid' // the property name that vue-meta uses to determine whether to overwrite or append a tag
}*/)

export default new Router({
    mode: 'history',
    //base: '/warehouse',
    routes: [
        {path: '/', redirect: '/project'},
        {path: '/dashboard', component: dashboard},
        //{path: '/upload', component: upload},
        {path: '/download/:id', component: download},
        {path: '/processes/:id?', component: processes},
        
        {path: '/apps', component: apps, meta: {public: true}},
        {path: '/app/:id', component: app, meta: {public: true}},
        //{path: '/app/:id/submit', component: appsubmit},
        {path: '/app/:id/edit', component: appedit},

        {path: '/view/:instanceid/:taskid/:type/:subdir?', component: view, props: true},
        {path: '/novnc/:instanceid/:taskid/:type/:subdir?', component: novnc, props: true},

        //{path: '/projects', component: projects, meta: {public: true}}, //deprecated by /project

        {path: '/project', component: project},
        {path: '/project/:id', component: project},
        //{path: '/project/:id/upload', component: projectedit},
        {path: '/project/:id/edit', component: projectedit},
        {path: '/project/:id/:tab?/:subid?', component: project},

        {path: '/datatypes', component: datatypes},
        {path: '/datatypes/:id', component: datatypes},
        {path: '/datatype/:id', component: datatype},
        {path: '/datatype/:id/edit', component: datatypeedit},

        //{path: '/settings', component: settings},

        {path: '/pubs', component: pubs, meta: {public: true}},
        {path: '/pub/:id', component: pub, meta: {public: true}},

        {path: '/test', component: test},
        {path: '/404', component: missing, meta: {public: true}},
        
        //deprecated paths
        {path: '/datasets/:id?', component: project},
        //{path: '/dataset/:id', component: dataset},

        {path: '/admin', component: admin},

    ]
})


