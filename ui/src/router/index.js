import Vue from 'vue'
import Router from 'vue-router'

import dashboard from '@/dashboard'

import datasets from '@/datasets'
import dataset from '@/dataset'
import upload from '@/upload'
import download from '@/download'
import view from '@/view'

import processes from '@/processes'

import apps from '@/apps'
import app from '@/app'
import appedit from '@/appedit'
import appsubmit from '@/appsubmit'

import projects from '@/projects'
import project from '@/project'
import projectedit from '@/projectedit'

import datatypes from '@/datatypes'
import datatype from '@/datatype'
import datatypeedit from '@/datatypeedit'

import settings from '@/settings'

import test from '@/test'

Vue.use(Router)

export default new Router({
    routes: [
        { path: '/', redirect: '/datasets' },
        { path: '/dashboard', component: dashboard },
        { path: '/datasets/:projectid?', component: datasets },
        { path: '/upload', component: upload},
        { path: '/dataset/:id', component: dataset},
        { path: '/download/:id', component: download},
        { path: '/processes/:id?', component: processes},

        { path: '/apps', component: apps },
        { path: '/app/:id', component: app },
        { path: '/app/:id/submit', component: appsubmit},
        { path: '/app/:id/edit', component: appedit},
        { path: '/view/:instanceid/:taskid/:type/:subdir?', component: view, props: true},

        { path: '/projects', component: projects },
        { path: '/project/:id', component: project },
        { path: '/project/:id/edit', component: projectedit },

        { path: '/datatypes', component: datatypes },
        { path: '/datatype/:id', component: datatype },
        { path: '/datatype/:id/edit', component: datatypeedit },

        { path: '/settings', component: settings},

        { path: '/test', component: test},
    ]
})


