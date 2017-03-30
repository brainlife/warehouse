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

Vue.use(Router)

export default new Router({
  routes: [
    { path: '/', name: 'dashboard', component: dashboard },
    { path: '/datasets', name: 'Datasets', component: datasets },
    { path: '/datasets/upload', name: 'Upload', component: upload},
    { path: '/dataset/:id', name: 'Dataset', component: dataset},
    { path: '/processes', name: 'Processes', component: processes},
    { path: '/process/:id', name: 'Process', component: process},
    { path: '/projects', name: 'Projects', component: projects },
    { path: '/apps', name: 'Apps', component: apps },
    { path: '/app/:id', name: 'App', component: app },
    { path: '/app/:id/submit', name: 'AppSubmit', component: submit},
    { path: '/app/:id/edit', name: 'AppEdit', component: appedit},
    { path: '/settings', name: 'Settings', component: settings},
  ]
})
