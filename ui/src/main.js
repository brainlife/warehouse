// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.

import 'jquery/dist/jquery.js'
import 'semantic-ui/dist/semantic.css'
import 'semantic-ui/dist/semantic.js'

var jwt_decode = require('jwt-decode');

import Vue from 'vue'
import App from './App'
import VueResource from 'vue-resource'
import router from './router'

Vue.use(VueResource)

Vue.config.productionTip = false

//TODO - find a way to put these somewhere under /config
Vue.config.wf_api = "https://soichi7.ppa.iu.edu/api/wf/"; //workflow service
Vue.config.auth_api = "https://soichi7.ppa.iu.edu/api/auth/"; //workflow service

//config derivatives
Vue.config.jwt = localStorage.getItem("jwt");//jwt token for user
if(Vue.config.jwt) Vue.config.user = jwt_decode(Vue.config.jwt);

//vue-resource config
Vue.http.options.root = "https://soichi7.ppa.iu.edu/api/warehouse/"; //default
Vue.http.headers.common['Authorization'] = 'Bearer '+Vue.config.jwt;
//Vue.http.headers.common['X-CSRF-TOKEN'] = ...
//console.dir(Vue.config.user);

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  template: '<App/>',
  components: { App }
})
