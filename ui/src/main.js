
//3rd parties
import 'jquery/dist/jquery.js'
import 'semantic-ui/dist/semantic.css'
import 'semantic-ui/dist/semantic.js'
var jwt_decode = require('jwt-decode');

import Vue from 'vue'
import warehouse from './warehouse'
import VueResource from 'vue-resource'

import VueSemantic from 'vue-semantic'
import router from './router'

Vue.use(VueResource)
Vue.use(VueSemantic)
Vue.use(require('vue-filter'))

///////////////////////////////////////////////////////////////////////////////////////////////////
//
// config
// TODO - find a way to put these somewhere under /config
//
console.log("setting config");
Vue.config.debug = true;
//Vue.config.productionTip = false //what is this?

Vue.config.api = "https://soichi7.ppa.iu.edu/api/warehouse";
Vue.config.wf_api = "https://soichi7.ppa.iu.edu/api/wf";
Vue.config.auth_api = "https://soichi7.ppa.iu.edu/api/auth";
Vue.config.event_api = "https://soichi7.ppa.iu.edu/api/event";
Vue.config.event_ws = "wss://soichi7.ppa.iu.edu/api/event";

Vue.http.options.root = Vue.config.api; //default root for $http

//
//
///////////////////////////////////////////////////////////////////////////////////////////////////

//config derivatives
Vue.config.jwt = localStorage.getItem("jwt");//jwt token for user
if(Vue.config.jwt) Vue.config.user = jwt_decode(Vue.config.jwt);
Vue.http.headers.common['Authorization'] = 'Bearer '+Vue.config.jwt;

/* eslint-disable no-new */
new Vue({
  el: '#warehouse',
  router,
  template: '<warehouse/>',
  components: { warehouse }
})
