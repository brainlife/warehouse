import Vue from 'vue'
import Router from 'vue-router'

import dashboard from '@/dashboard'
import projects from '@/projects'
import datasets from '@/datasets'
import dataset from '@/dataset'
import upload from '@/upload'
import processes from '@/processes'
import process from '@/process'
import settings from '@/settings'
import apps from '@/apps'
import app from '@/app'
import appedit from '@/appedit'
import submit from '@/submit'
import download from '@/download'
import view from '@/view'

Vue.use(Router)

export default new Router({
    //TODO remove names.. I am not using it
  routes: [
    { path: '/', component: dashboard },
    { path: '/datasets', component: datasets },
    { path: '/datasets/upload', component: upload},
    { path: '/dataset/:id', component: dataset},
    { path: '/download/:id', component: download},
    { path: '/processes', component: processes},
    { path: '/process/:id', component: process},
    { path: '/projects', component: projects },
    { path: '/apps', component: apps },
    { path: '/app/:id', component: app },
    { path: '/app/:id/submit', component: submit},
    { path: '/app/:id/edit', component: appedit},
    { path: '/settings', component: settings},
    { path: '/view/:instanceid/:taskid', component: view},
  ]
})
