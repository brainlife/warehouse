import Vue from 'vue'
import Router from 'vue-router'

import dashboard from '@/dashboard'
import projects from '@/projects'
import project from '@/project'
import projectedit from '@/projectedit'
import datasets from '@/datasets'
import dataset from '@/dataset'
import upload from '@/upload'
import processes from '@/processes'
import simpleprocess from '@/simpleprocess'
import process from '@/process'
import processarchive from '@/processarchive'
import settings from '@/settings'
import apps from '@/apps'
import app from '@/app'
import appedit from '@/appedit'
import appsubmit from '@/appsubmit'
import submit from '@/submit'
import download from '@/download'
import view from '@/view'

Vue.use(Router)

export default new Router({
    //TODO remove names.. I am not using it
  routes: [
    { path: '/', redirect: '/datasets' },
    { path: '/dashboard', component: dashboard },
    { path: '/datasets/:projectid?', component: datasets },
    { path: '/upload', component: upload},
    { path: '/dataset/:id', component: dataset},
    { path: '/download/:id', component: download},
    { path: '/processes', component: processes},

    //simple workflow
    { path: '/simpleprocess/:id', component: simpleprocess},
    { path: '/process/:id?', component: process},
    { path: '/process/:id/archive', component: processarchive},

        
    { path: '/projects', component: projects },
    { path: '/project/:id', component: project },
    { path: '/project/:id/edit', component: projectedit },
    { path: '/apps', component: apps },
    { path: '/app/:id', component: app },
    { path: '/app/:id/submit', component: appsubmit},
    { path: '/app/:id/edit', component: appedit},
    { path: '/settings', component: settings},
    { path: '/submit', component: submit},
    { path: '/view/:instanceid/:taskid/:type', component: view},
  ]
})
