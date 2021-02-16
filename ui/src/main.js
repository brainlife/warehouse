
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

import 'perfect-scrollbar/css/perfect-scrollbar.css'
//import VueHighlightJS from 'vue-highlightjs'

//https://www.npmjs.com/package/vue-notification
import Notifications from 'vue-notification' //override element-ui ugly $notify..

//import 'vue-awesome/icons'
import 'vue-awesome/icons/robot.js'
import 'vue-awesome/icons/book.js'
import 'vue-awesome/icons/paper-plane.js'
import 'vue-awesome/icons/vial.js'
import 'vue-awesome/icons/search.js'
import 'vue-awesome/icons/th.js'
import 'vue-awesome/icons/list.js'
import 'vue-awesome/icons/lock.js'
import 'vue-awesome/icons/ban.js'
import 'vue-awesome/icons/plus.js'
import 'vue-awesome/icons/home.js'
import 'vue-awesome/icons/th-large.js'
import 'vue-awesome/icons/code-branch.js'
import 'vue-awesome/icons/caret-right.js'
import 'vue-awesome/icons/caret-up.js'
import 'vue-awesome/icons/caret-down.js'
import 'vue-awesome/icons/chart-area.js'
import 'vue-awesome/icons/newspaper.js'
import 'vue-awesome/icons/cog.js'
import 'vue-awesome/icons/archive.js'
import 'vue-awesome/icons/bars.js'
import 'vue-awesome/icons/wrench.js'
import 'vue-awesome/icons/sign-in-alt.js'
import 'vue-awesome/icons/sign-out-alt.js'
import 'vue-awesome/icons/external-link-alt.js'
import 'vue-awesome/icons/exclamation.js'
import 'vue-awesome/icons/exclamation-triangle.js'
import 'vue-awesome/icons/exclamation-circle.js'
import 'vue-awesome/icons/question-circle.js'
import 'vue-awesome/icons/question.js'
import 'vue-awesome/icons/copy.js'
import 'vue-awesome/icons/cubes.js'
import 'vue-awesome/icons/cube.js'
import 'vue-awesome/icons/server.js'
import 'vue-awesome/icons/id-badge.js'
import 'vue-awesome/icons/eye.js'
import 'vue-awesome/icons/play.js'
import 'vue-awesome/icons/calendar.js'
import 'vue-awesome/icons/download.js'
import 'vue-awesome/icons/certificate.js'
import 'vue-awesome/icons/cloud.js'
import 'vue-awesome/icons/cloud-download-alt.js'
import 'vue-awesome/icons/edit.js'
import 'vue-awesome/icons/sort.js'
import 'vue-awesome/icons/stop.js'
import 'vue-awesome/icons/stop-circle.js'
import 'vue-awesome/icons/info.js'
import 'vue-awesome/icons/hand-paper.js'
import 'vue-awesome/icons/handshake.js'
import 'vue-awesome/icons/redo.js'
import 'vue-awesome/icons/trash.js'
import 'vue-awesome/icons/ellipsis-v.js'
import 'vue-awesome/icons/angle-left.js'
import 'vue-awesome/icons/shield-alt.js'
import 'vue-awesome/icons/times.js'
import 'vue-awesome/icons/check.js'
import 'vue-awesome/icons/check-square.js'
import 'vue-awesome/icons/chevron-left.js'
import 'vue-awesome/icons/chevron-right.js'
import 'vue-awesome/icons/check-circle.js'
import 'vue-awesome/icons/star.js'
import 'vue-awesome/icons/flask.js'
import 'vue-awesome/icons/envelope.js'
import 'vue-awesome/icons/user-friends.js'
import 'vue-awesome/icons/user.js'
import 'vue-awesome/icons/user-cog.js'
import 'vue-awesome/icons/university.js'
import 'vue-awesome/icons/users.js'
import 'vue-awesome/icons/user-friends.js'
import 'vue-awesome/icons/fire-alt.js'
import 'vue-awesome/icons/arrow-up.js'
import 'vue-awesome/icons/arrow-down.js'
import 'vue-awesome/icons/arrow-right.js'
import 'vue-awesome/icons/arrow-left.js'
import 'vue-awesome/icons/info-circle.js'
import 'vue-awesome/icons/circle.js'
import 'vue-awesome/icons/dot-circle.js'
import 'vue-awesome/icons/sync-alt.js'
import 'vue-awesome/icons/book.js'
import 'vue-awesome/icons/file-signature.js'
import 'vue-awesome/icons/file.js'
import 'vue-awesome/icons/hourglass.js'
import 'vue-awesome/icons/hourglass-half.js'
import 'vue-awesome/icons/thumbs-up.js'
import 'vue-awesome/icons/folder.js'
import 'vue-awesome/icons/clock.js'
import 'vue-awesome/icons/folder-open.js'
import 'vue-awesome/icons/link.js'
import 'vue-awesome/icons/brands/slack.js'
import 'vue-awesome/icons/brands/github.js'
import 'vue-awesome/icons/brands/twitter.js'
import 'vue-awesome/icons/brands/facebook.js'
import 'vue-awesome/icons/brands/google-plus.js'
import 'vue-awesome/icons/brands/linkedin.js'
import 'vue-awesome/icons/brands/pinterest.js'
import 'vue-awesome/icons/brands/reddit.js'
import 'vue-awesome/icons/brands/skype.js'
import 'vue-awesome/icons/brands/weibo.js'
import 'vue-awesome/icons/regular/file.js'
import 'vue-awesome/icons/regular/calendar-times.js'
import 'vue-awesome/icons/skull-crossbones.js'

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
Vue.use(VueAxios, axios)
Vue.use(Notifications);
Vue.use(VueLazyload)
Vue.use(BootstrapVue, {
    /*doesn't seem to work 
    //https://github.com/bootstrap-vue/bootstrap-vue/issues/3169#issuecomment-758212291
    bvToast: {
        title: "Alert",
        autoHideDelay: 1000, 
    }
    */
});
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
Vue.config.event_ws = apihost_ws+"/api/event";
Vue.config.auth_signin = "/auth#!/signin";
Vue.config.auth_signout = "/auth#!/signout";
Vue.config.ezbids_api = apihost+"/api/ezbids";
Vue.config.productionTip = false;
Vue.config.debug_doi = "10.25663/bl.p.3"; //o3d publication
Vue.config.plotly = {
    font: {
        font: 'Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji',
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
    Vue.config.auth_signin = "https://dev1.soichi.us/auth#!/signin?app=dev";
    Vue.config.auth_signout = "https://dev1.soichi.us/auth#!/signout?app=dev";
    Vue.config.ezbids_api = "https://dev1.soichi.us/api/ezbids";

    //intercept jwt sent via url parameter
    var urlParams = new URLSearchParams(window.location.search);
    if(urlParams.has('jwt')) {
        localStorage.setItem("jwt", urlParams.get('jwt'));
        window.location.search = "";
    }
}

// warning - jwt_decode just decode any jwt token. it doesn't validate it
// so we can't really trust that user is who they say they are on the client side.
// we just assume that user is trustworthy on the client side and pass jwt to 
// server so that we can do a real jwt validation there
function jwt_decode_brainlife(jwt) {
    Vue.config.user = jwt_decode(jwt);
    Vue.config.jwt = jwt;
    
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

const soundHost = "https://raw.githubusercontent.com/brainlife/warehouse/master/ui/sounds/";

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

            //things we can access via $root
            sidemenuWide: true,

            notificationSounds: {},
        }
    },
    components: { warehouse },

    mounted() {
        let wide = localStorage.getItem("sidemenuWide");
        if(wide) this.sidemenuWide = (wide=="1"?true:false);

        //allow child component to refresh jwt
        //project/submit (adding project requires jwt scope change for ac)
        this.$on("refresh_jwt", this.refresh_jwt);

        if(!Vue.config.jwt) {
            //for guest
            this.ready = true;
        } else {
            //for authenticated user
            this.ensure_myproject();
            this.load_profile();

            //refresh jwt on page refresh (and to get new jwt after creating new project)
            this.refresh_jwt(err=>{
                this.$root.$emit("jwt_refreshed");
                this.ready = true;
            });

            //refresh in half an hour
            setInterval(()=>{
                this.$root.$emit("refresh_jwt");
            }, 1000*1800);
        }
    },

    methods: {
        toggleSideMenu() {
            this.sidemenuWide = !this.sidemenuWide;
            localStorage.setItem("sidemenuWide", this.sidemenuWide?"1":"0");
        },

        async ensure_myproject() {
            if(!Vue.config.jwt) return;
            
            //make sure user has create at least 1 project
            var res = await this.$http.get('project', {params: {
                //find: {$or: [{admins: Vue.config.user.sub}, {members: Vue.config.user.sub}]},
                find: { user_id: Vue.config.user.sub },
                limit: 1, //I just need count (0 means all)
            }});

            //console.log("checking project", res.data.projects);
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

        load_profile() {
            if(!Vue.config.jwt) return;
            this.$http.get(Vue.config.auth_api+"/profile").then(res=>{
                Vue.config.profile = res.data.profile; 
                //this.load_notification_sounds(Vue.config.profile.private.notification.process_sound);
            }).catch(console.error);
        },

        /*
        load_notification_sounds(theme) {
            if(!theme) return;
            ["failed", "finished", "running"].forEach(name=>{
                this.notificationSounds[name] = new Audio(soundHost+theme+"/"+name+".mp3");
            });
        },
        */

        /*
        playNotification(name) {
            if(this.notificationSounds[name]) this.notificationSounds[name].play();
            else {
                console.log("no notification sound loaded for ", name);
            }
        },
        */

        playNotification(name, theme) {
            if(!theme) theme = Vue.config.profile.private.notification.process_sound;
            if(!theme) return;
            new Audio(soundHost+theme+"/"+name+".mp3").play();
        },

    },
})
