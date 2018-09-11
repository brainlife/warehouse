
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

import '../theme/index.css' 

import 'select2/dist/css/select2.css'
import 'highlight.js/styles/default.css'

//3rd parties
import 'jquery/dist/jquery.js'
import 'select2/dist/js/select2.js'
import 'katex/dist/katex.min.css'

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

import SocialSharing from 'vue-social-sharing';

Vue.config.productionTip = false

import VueAnalytics from 'vue-analytics'

Vue.component('icon', Icon)

import VueDisqus from 'vue-disqus'
Vue.use(VueDisqus)

Vue.use(VueHighlightJS)
Vue.use(VueResource)
Vue.use(Element, {locale})
Vue.use(Notifications);
Vue.use(VueLazyload)
Vue.use(BootstrapVue);
Vue.use(Vue2Filters)
Vue.use(SocialSharing);
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

var apihost = "https://"+window.location.hostname;
var apihost_ws = "wss://"+window.location.hostname;

//override api hostname (from config/*.env.js)
if (process.env.HOSTNAME) {
    apihost = "https://"+process.env.HOSTNAME;
    apihost_ws = "wss://"+process.env.HOSTNAME;
}

Vue.config.debug = false;
Vue.config.api = apihost+"/api/warehouse";
Vue.config.wf_api = apihost+"/api/amaretti"; //deprecated by amaretti_api
Vue.config.amaretti_api = apihost+"/api/amaretti";
Vue.config.auth_api = apihost+"/api/auth";
Vue.config.event_api = apihost+"/api/event";
Vue.config.profile_api = apihost+"/api/profile";
Vue.config.event_ws = apihost_ws+"/api/event";
Vue.config.auth_signin = "/auth#!/signin";

Vue.http.options.root = Vue.config.api; //default root for $http

if (process.env.NODE_ENV == "development") {
    Vue.config.debug = true;
}

function jwt_decode_brainlife(jwt) {
    Vue.config.user = jwt_decode(jwt);
    Vue.config.jwt = jwt;
    
    //auth service should return sub in string format, but currently it doesn't..
    //let's just covert it to string 
    Vue.config.user.sub = Vue.config.user.sub.toString();
    Vue.http.headers.common['Authorization'] = 'Bearer '+Vue.config.jwt;
}

Vue.config.jwt = localStorage.getItem("jwt");//jwt token for user
if (Vue.config.jwt) {
    jwt_decode_brainlife(Vue.config.jwt);
} else {
    console.log("jwt not set");
}

router.beforeEach(function (to, from, next) {
    if (to.matched.length == 0) {
        console.log("no matching reouter for", JSON.stringify(to, null, 4), "redirecting to /404");
        document.location = "/404";
        return;
    }

    // redirect to auth unless route is public
    if (!to.meta) to.meta = {};
    if (!to.meta.public && !Vue.config.jwt) {
        console.log("authentication required", document.location.href);
        sessionStorage.setItem('auth_redirect', document.location.href);
        document.location = Vue.config.auth_signin;
        return;
    }

    //console.log("scrolling to top");
    window.scrollTo(0, 0); //scroll to top on route update (sensible default.. or bad practice?)
    next();
});

if (!Vue.config.debug) {
    Vue.use(VueAnalytics, { id: 'UA-118407195-1', router })
}

new Vue({
    el: '#warehouse',
    router,
    template: '<warehouse/>',
    components: { warehouse },

    async mounted() {
        //console.log("starting jwt token interval");
        setInterval(()=>{
            this.refresh_jwt();
        }, 1000*3600); //every 1hour?

        this.$on("refresh_jwt", ()=>{
            this.refresh_jwt();
        });

        this.refresh_jwt(err=>{
            this.load_profile();
        });
    },

    methods: {
        refresh_jwt(cb) {
            if(!Vue.config.jwt) {
                //console.log("no jwt.. not refreshing");
                return;
            }

            //console.log("attemping to refresh token - mainly to detect expiration");
            this.$http.post(Vue.config.auth_api+"/refresh").then(res=>{
                if(!res.body.jwt) console.log("token refresh didn't work.. resetting jwt");
                console.log("refreshed token!");
                jwt_decode_brainlife(res.body.jwt);
                localStorage.setItem("jwt", res.body.jwt);
                if(cb) cb();
            }).catch(err=>{
                console.error("failed to referesh token - redirecting to auth service");
                console.error(err); 
                sessionStorage.setItem('auth_redirect', document.location.href);
                document.location = Vue.config.auth_signin;
            });
        },

        load_profile() {
            if(!Vue.config.jwt) return;
            this.$http.get(Vue.config.profile_api+"/private").then(res=>{
                Vue.config.profile = res.body;
                //console.dir(Vue.config.profile);
            }).catch(err=>{
                console.error(err); 
            });
        },
    },
})
