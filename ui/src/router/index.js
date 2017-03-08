import Vue from 'vue'
import Router from 'vue-router'

//import Dashboard from '@/components/Dashboard'
import dashboard from '@/dashboard'
import projects from '@/projects'
//import project from '@/project'

Vue.use(Router)

export default new Router({
  routes: [
    { path: '/', name: 'dashboard', component: dashboard },
    //{ path: '/warehouse', name: 'Warehouse', component: Warehouse },
    { path: '/projects', name: 'projects', component: projects },
    //{ path: '/project', name: 'newproject', component: project },
    //{ path: '/project/:id', name: 'editproject', component: project },
    //{ path: '/dataset/:id', name: 'Dataset', component: Dataset },
  ]
})
