
//CSS
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

//theme for element-ui
import '../theme/index.css' 

import 'select2/dist/css/select2.css'
import 'highlight.js/styles/default.css'

//3rd parties
import 'jquery/dist/jquery.js'
import 'select2/dist/js/select2.js'

import Vue from 'vue'

import VueResource from 'vue-resource'
import VueHighlightJS from 'vue-highlightjs'
import Vue2Filters from 'vue2-filters'

import Element from 'element-ui'
import locale from 'element-ui/lib/locale/lang/en'

import Notifications from 'vue-notification' //override element-ui ugly $notify..
import 'vue-awesome/icons'
import Icon from 'vue-awesome/components/Icon.vue'
import VueLazyload from 'vue-lazyload'
import BootstrapVue from 'bootstrap-vue' //bootstrap will eventually replace ElementUI / locale

import router from './router.js'
import warehouse from './warehouse'
import VueTimeago from 'vue-timeago'

Vue.config.productionTip = false

Vue.component('icon', Icon)

Vue.use(VueHighlightJS)
Vue.use(VueResource)
Vue.use(Element, {locale})
Vue.use(Notifications);
Vue.use(VueLazyload)
Vue.use(BootstrapVue);
Vue.use(Vue2Filters)

Vue.use(VueTimeago, {
    name: 'timeago',
    locale: 'en-US',
    locales: {
        'en-US': require('vue-timeago/locales/en-US.json')
    }
});

var jwt_decode = require('jwt-decode');

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

Vue.config.jwt = localStorage.getItem("jwt");//jwt token for user
if(Vue.config.jwt) {
    //validate jwt..
    Vue.config.user = jwt_decode(Vue.config.jwt);
    if(Vue.config.user.exp && Vue.config.user.exp < Date.now()/1000) {
        console.error("jwt expired", Vue.config.user.exp, Date.now()/1000);
        delete Vue.config.jwt;
        localStorage.removeItem("jwt");
    } else {
        Vue.http.headers.common['Authorization'] = 'Bearer '+Vue.config.jwt;
    }
} else {
    console.log("jwt not set");
}

router.beforeEach(function (to, from, next) {
    if(to.matched.length == 0) {
        console.log("no matching reouter for", JSON.stringify(to, null, 4), "redirecting to /404");
        document.location = "/404";
        return;
    }

    //redirect to auth unless route is public
    if(!to.meta) to.meta = {};
    if(!to.meta.public) {
        if(!Vue.config.jwt) {
            console.log("authentication required", document.location.href);
            sessionStorage.setItem('auth_redirect', document.location.href);
            document.location = "/auth#!/signin";
            return;
        }
    }

    window.scrollTo(0, 0); //scroll to top on route update (sensible default.. or bad practice?)
    next();
})

new Vue({
    el: '#warehouse',
    router,
    template: '<warehouse/>',
    components: { warehouse },
    mounted() {
        console.log("starting jwt token interval");
        setInterval(()=>{
            this.refresh_jwt();
        }, 1000*3600); //every 1hour?

        this.$on("refresh_jwt", ()=>{
            this.refresh_jwt();
        });
    },
    methods: {
        refresh_jwt: function() {
            if(Vue.config.debug) {
                console.log("not refreshing token.. as this is running in debug mode");
                return;
            }
            if(!Vue.config.jwt) {
                console.log("no jwt.. not refreshing");
                return;
            }
            console.log("refreshing jwt token");
            this.$http.post(Vue.config.auth_api+'/refresh').then(res=>{
                if(res.body.jwt) {
                    console.log("renewed!");
                    Vue.config.jwt = res.body.jwt;
                    Vue.config.user = jwt_decode(Vue.config.jwt);
                    localStorage.setItem("jwt", res.body.jwt);
                }
            }).catch(err=>{
                console.error(err); 
                document.location = "/auth#!/signin";
            });
        }
    },
})

