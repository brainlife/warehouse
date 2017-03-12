import Vue from 'vue'
import Router from 'vue-router'

import dashboard from '@/dashboard'
import projects from '@/projects'
import warehouse from '@/warehouse'
import dataset from '@/dataset'
import upload from '@/upload'
import processes from '@/processes'
import settings from '@/settings'

Vue.use(Router)

export default new Router({
  routes: [
    { path: '/', name: 'dashboard', component: dashboard },
    { path: '/data', name: 'Warehouse', component: warehouse },
    { path: '/data/upload', name: 'Upload', component: upload},
    { path: '/data/:id', name: 'Dataset', component: dataset},
    { path: '/processes', name: 'processes', component: processes},
    { path: '/projects', name: 'projects', component: projects },
    //{ path: '/project', name: 'newproject', component: project },
    //{ path: '/project/:id', name: 'editproject', component: project },
    //{ path: '/dataset/:id', name: 'Dataset', component: Dataset },
    { path: '/settings', name: 'settings', component: settings},
  ]
})
