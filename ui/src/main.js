
//3rd parties
import 'jquery/dist/jquery.js'
//import '@/reset.css'

import 'highlight.js/styles/default.css'
//import 'vue2-animate/dist/vue2-animate.min.css'

//import hljs from 'highlight.js'
import VueHighlightJS from 'vue-highlightjs'
Vue.use(VueHighlightJS)

var jwt_decode = require('jwt-decode');

import Vue from 'vue'
import VueResource from 'vue-resource'
Vue.use(VueResource)

import warehouse from './warehouse'

//element ui
import '../theme/index.css'
import ElementUI from 'element-ui'
import locale from 'element-ui/lib/locale/lang/en'
Vue.use(ElementUI, {locale})

//fontasome
import 'vue-awesome/icons'
import Icon from 'vue-awesome/components/Icon.vue'
Vue.component('icon', Icon)

import router from './router'

Vue.use(require('vue-filter'))

Vue.filter('filesize', function (num) {
	// jacked from: https://github.com/sindresorhus/pretty-bytes
	if (typeof num !== 'number' || isNaN(num)) {
        throw new TypeError('Expected a number');
	}

	var exponent;
	var unit;
	var neg = num < 0;
	var units = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

	if (neg) {
        num = -num;
	}

	if (num < 1) {
        return (neg ? '-' : '') + num + ' B';
	}

	exponent = Math.min(Math.floor(Math.log(num) / Math.log(1000)), units.length - 1);
	num = (num / Math.pow(1000, exponent)).toFixed(2) * 1;
	unit = units[exponent];

	return (neg ? '-' : '') + num + ' ' + unit;
});

///////////////////////////////////////////////////////////////////////////////////////////////////
//
// config
// TODO - find a way to put these somewhere under /config
//
var apihost = "https://"+process.env.HOSTNAME;
var apihost_ws = "wss://"+process.env.HOSTNAME;

switch(process.env.NODE_ENV) {
case "development": 
    //var apihost = "https://soichi7.ppa.iu.edu";
    //var apihost_ws = "wss://soichi7.ppa.iu.edu";
    Vue.config.debug = true;
    break;
case "production":
    console.log("running in production mode");
    break;
}

Vue.config.api = apihost+"/api/warehouse";
Vue.config.wf_api = apihost+"/api/wf";
Vue.config.auth_api = apihost+"/api/auth";
Vue.config.event_api = apihost+"/api/event";
Vue.config.event_ws = apihost_ws+"/api/event";

Vue.http.options.root = Vue.config.api; //default root for $http

///////////////////////////////////////////////////////////////////////////////////////////////////

//config derivatives

//make sure user is logged in and jwt is valid
function signin() {
    sessionStorage.setItem('auth_redirect', document.location);
    document.location = "/auth#!/signin";
}
Vue.config.jwt = localStorage.getItem("jwt");//jwt token for user
if(!Vue.config.jwt) {
    console.log("jwt not set");
    signin();
}
Vue.config.user = jwt_decode(Vue.config.jwt);
if(!Vue.config.user.exp) {
    console.log("jwt.exp not set");
    signin();
}
if(Vue.config.user.exp < Date.now()/1000) {
    console.log("jwt expired", Vue.config.user.exp, Date.now()/1000);
    signin();
}
console.log("user", Vue.config.user);

Vue.http.headers.common['Authorization'] = 'Bearer '+Vue.config.jwt;

router.beforeEach(function (to, from, next) {
    console.log("scrolling to top");
    window.scrollTo(0, 0);
    next();
})

new Vue({
    el: '#warehouse',
    router,
    template: '<warehouse/>',
    components: { warehouse },
    mounted() {
        //start token refresh
        if(!Vue.config.debug) {
            setInterval(()=>{
                console.log("refreshing token");
                this.$http.post(Vue.config.auth_api+'/refresh').then(res=>{
                    if(res.body.jwt) {
                        Vue.config.jwt = res.body.jwt;
                        Vue.config.user = jwt_decode(Vue.config.jwt);
                        localStorage.setItem("jwt", res.body.jwt);
                        //console.dir(Vue.config.user);
                    }
                }).catch(err=>{
                    console.error(err); //TODO - I should send message to auth service?
                    document.location = "/auth#!/signin";
                });
            }, 1000*3600); //1hour
        }
    }
})


