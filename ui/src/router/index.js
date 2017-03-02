import Vue from 'vue'
import Router from 'vue-router'

//import Dashboard from '@/components/Dashboard'
import dashboard from '@/dashboard'

Vue.use(Router)

export default new Router({
  routes: [
    { path: '/', name: 'Dashboard', component: dashboard },
    //{ path: '/warehouse', name: 'Warehouse', component: Warehouse },
    //{ path: '/projects', name: 'Projects', component: Projects },
    //{ path: '/project/:id', name: 'Project', component: Project },
    //{ path: '/dataset/:id', name: 'Dataset', component: Dataset },
  ]
})
