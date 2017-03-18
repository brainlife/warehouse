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

Vue.use(Router)

export default new Router({
  routes: [
    { path: '/', name: 'dashboard', component: dashboard },
    { path: '/datasets', name: 'Datasets', component: datasets },
    { path: '/dataset/:id', name: 'Dataset', component: dataset},
    { path: '/data/upload', name: 'Upload', component: upload},
    { path: '/processes', name: 'processes', component: processes},
    { path: '/process/:id', name: 'process', component: process},
    { path: '/projects', name: 'projects', component: projects },
    { path: '/apps', name: 'apps', component: apps },
    { path: '/app/:id', name: 'app', component: app },
    //{ path: '/project', name: 'newproject', component: project },
    //{ path: '/project/:id', name: 'editproject', component: project },
    //{ path: '/dataset/:id', name: 'Dataset', component: Dataset },
    { path: '/settings', name: 'settings', component: settings},
  ]
})
