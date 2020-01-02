
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-vue/dist/bootstrap-vue.min.css'

import 'select2/dist/css/select2.css'
//import 'highlight.js/styles/default.css'

import 'katex/dist/katex.min.css'
import 'vue2-animate/dist/vue2-animate.min.css'

//3rd parties
import 'jquery/dist/jquery.js'
import 'select2/dist/js/select2.js'
import Vue from 'vue'

import 'vue-select/dist/vue-select.css';
import vSelect from 'vue-select' 

//import VueHighlightJS from 'vue-highlightjs'

import Notifications from 'vue-notification' //override element-ui ugly $notify..
import 'vue-awesome/icons'
import Icon from 'vue-awesome/components/Icon.vue'
import VueLazyload from 'vue-lazyload'
import BootstrapVue from 'bootstrap-vue' //bootstrap will eventually replace ElementUI / locale

import router from './router.js'
import warehouse from './warehouse'
import VueTimeago from 'vue-timeago'

import SocialSharing from 'vue-social-sharing';

import VueAnalytics from 'vue-analytics'

import axios from 'axios'
import VueAxios from 'vue-axios'

import {parseBibFile} from "bibtex";

Vue.component('v-select', vSelect)
Vue.component('icon', Icon)

import VueDisqus from 'vue-disqus';

import toNow from 'date-fns/distance_in_words_to_now'

Vue.use(VueDisqus)
//Vue.use(VueHighlightJS)
Vue.use(VueAxios, axios)
Vue.use(Notifications);
Vue.use(VueLazyload)
Vue.use(BootstrapVue);
Vue.use(SocialSharing);
Vue.use(VueTimeago, {
    name: 'timeago',
    locale: 'en',
    converter: (date, locale, converterOptions) => {
        const { includeSeconds, addSuffix = true } = converterOptions
        return toNow(date, {
          locale,
          includeSeconds,
          addSuffix
        }).replace("less than a minute ago", "just now")
          .replace("in less than a minute", "just now")
          .replace("about ", "~");
    }
});

/////////////////////////////////////// main /////////////////////////////////////

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

Vue.filter('capitalize', v=>{
    return v.toUpperCase();
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
//Vue.config.profile_api = apihost+"/api/profile";
Vue.config.event_ws = apihost_ws+"/api/event";
Vue.config.auth_signin = "/auth#!/signin";
Vue.config.auth_signout = "/auth#!/signout";
Vue.config.productionTip = false;
Vue.config.debug_doi = "10.25663/bl.p.3"; //o3d publication
Vue.config.plotly = {
    font: {
        font: '-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji',
        size: 11,
    },
};

Vue.config.has_role = function(role, service = "warehouse") {
    if( Vue.config.user && 
        Vue.config.user.scopes[service] &&
        ~Vue.config.user.scopes[service].indexOf(role)) return true;
    return false;
}

//Vue.http.options.root = Vue.config.api; //default root for $http
axios.defaults.baseURL = Vue.config.api; //default root for $http

if (process.env.NODE_ENV == "development") {
    Vue.config.debug = true;
    
    //do crosssite auth between localhost and dev1 auth
    Vue.config.auth_signin = "https://dev1.soichi.us/auth#!/signin?app=localhost";
    Vue.config.auth_signout = "https://dev1.soichi.us/auth#!/signout?app=localhost";

    //intercept jwt sent via url parameter
    var urlParams = new URLSearchParams(window.location.search);
    if(urlParams.has('jwt')) {
        localStorage.setItem("jwt", urlParams.get('jwt'));
        window.location.search = "";
    }
}

function jwt_decode_brainlife(jwt) {
    Vue.config.user = jwt_decode(jwt);
    Vue.config.jwt = jwt;
    //Vue.config.profile = res.data; //depreacted.. use user.profile
    
    //auth service should return sub in string format, but currently it doesn't..
    //let's just covert it to string 
    Vue.config.user.sub = Vue.config.user.sub.toString();
    axios.defaults.headers.common['Authorization'] = 'Bearer '+Vue.config.jwt;

    //deprecated .. use Vue.config.has_role
    Vue.config.is_admin = Vue.config.has_role("admin"); 
    if(Vue.config.has_role("admin")) console.log("user is admin!");
}

Vue.config.jwt = localStorage.getItem("jwt");//jwt token for user
if (Vue.config.jwt) {
    jwt_decode_brainlife(Vue.config.jwt);
} else {
    console.log("jwt not set");
}

router.beforeEach(function (to, from, next) {
    if (to.matched.length == 0) {
        console.log("no match for router");
        console.dir(to);
        document.location = "/404";
        return;
    }

    // redirect to auth unless route is public
    if (!to.meta) to.meta = {};
    if (!to.meta.public && !Vue.config.jwt) {
        console.log("authentication required", document.location.href);
        if(!Vue.config.debug) {
            document.location = Vue.config.auth_signin;
            sessionStorage.setItem('auth_redirect', document.location.href);
        }
        return;
    }

    window.scrollTo(0, 0); //scroll to top on route update (sensible default.. or bad practice?)
    next();
});

if (!Vue.config.debug) {
    Vue.use(VueAnalytics, { id: 'UA-118407195-1', router })
}

//create main component
new Vue({
    el: '#app',
    router,
    template: `
    <warehouse v-if="ready"/>
    `,
    data() {
        return {
            ready: false,
        }
    },
    components: { warehouse },

    mounted() {

        //allow child component to refresh jwt
        //project/submit (adding project requires jwt scope change for ac)
        this.$on("refresh_jwt", cb=>{
            this.refresh_jwt(cb);
        });

        if(!Vue.config.jwt) {
            return this.ready = true;
        }
        
        this.ensure_myproject();

        //refresh jwt on page refresh (and to get new jwt after creating new project)
        this.refresh_jwt(err=>{
            this.$root.$emit("jwt_refreshed");
            this.ready = true;
            /*
            this.load_profile(err=>{
            });
            */
        });

        //refresh in half an hour
        console.log("starting auto-jwt refresh");
        setInterval(()=>{
            this.$root.$emit("refresh_jwt");
        }, 1000*1800);
    },

    methods: {
        async ensure_myproject() {
            if(!Vue.config.jwt) return;
            
            //make sure user has create at least 1 project
            var res = await this.$http.get('project', {params: {
                //find: {$or: [{admins: Vue.config.user.sub}, {members: Vue.config.user.sub}]},
                find: { user_id: Vue.config.user.sub },
                limit: 1, //I just need count (0 means all)
            }});

            console.log("checking project", res.data.projects);
            if(res.data.projects.length == 0) {
                //let's create a default project
                console.log("need to create default project");
                await this.$http.post('project', {
                    name: "My Default Project",
                    desc: "Please use this project for testing purpose. You can update this project, or create new projects",
                    access: "private",
                    admins: [Vue.config.user.sub],
                    members: [],
                    agreements: [],
                });
                //console.dir(res);

                //we don't have good way of invalidating all projects loaded by the time we finish creating project.
                //we need to reload page..
                //(well.. as long as we don't redirect to a page that loads project list, we should be fine..)
                //location.reload();
            }
        },

        refresh_jwt(cb) {
            if(!Vue.config.jwt) return;
            console.log("refreshing token");
            this.$http.post(Vue.config.auth_api+"/refresh").then(res=>{
                if(!res.data.jwt) console.log("token refresh didn't work.. resetting jwt");
                console.log("refreshed token!");
                jwt_decode_brainlife(res.data.jwt);
                localStorage.setItem("jwt", res.data.jwt);
                if(cb) cb();
            }).catch(err=>{
                console.error("failed to referesh token");
                console.error("redirecting to auth service");
                console.error(err); 
                sessionStorage.setItem('auth_redirect', document.location.href);
                document.location = Vue.config.auth_signin;
                if(cb) cb(err);
            });
        },

        /*
        load_profile(cb) {
            if(!Vue.config.jwt) return;
            console.log("loading private profile");
            this.$http.get(Vue.config.profile_api+"/private").then(res=>{
                Vue.config.profile = res.data;
                cb();
            }).catch(cb);
        },
        */
    },
})
