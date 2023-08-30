
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-vue/dist/bootstrap-vue.min.css'

import 'select2/dist/css/select2.css'
// import 'highlight.js/styles/default.css'

import 'katex/dist/katex.min.css'
import 'vue2-animate/dist/vue2-animate.min.css'

import 'jquery/dist/jquery.js'
import 'select2/dist/js/select2.js'
import Vue from 'vue'

import 'vue-select/dist/vue-select.css'
import vSelect from 'vue-select'

import 'perfect-scrollbar/css/perfect-scrollbar.css'

import Notifications from 'vue-notification'

import './icons'
import Icon from 'vue-awesome/components/Icon'

import VueLazyload from 'vue-lazyload'
import BootstrapVue from 'bootstrap-vue'

import router from './router.js'
import warehouse from './warehouse'
import VueTimeago from 'vue-timeago'

import VueDisqus from 'vue-disqus'

import toNow from 'date-fns/distance_in_words_to_now'

// import SocialSharing from 'vue-social-sharing'
// import VueGtag from 'vue-gtag'

import axios from 'axios'
import VueAxios from 'vue-axios'

import numeral from 'numeral'
import JWTDecode from 'jwt-decode'

Vue.component('v-select', vSelect)
Vue.component('icon', Icon)

Vue.use(VueDisqus)
Vue.use(VueAxios, axios)
Vue.use(Notifications)
Vue.use(VueLazyload)
Vue.use(BootstrapVue)

// Vue.use(SocialSharing)

Vue.use(VueTimeago, {
    name: 'timeago',
    locale: 'en',
    converter: (date, locale, converterOptions) => {
        const { includeSeconds, addSuffix = true } = converterOptions
        return toNow(date, {
            locale,
            includeSeconds,
            addSuffix
        })
            .replace('less than a minute ago', 'just now')
            .replace('in less than a minute', 'just now')
            .replace('about ', '~')
    }
})

Vue.filter('filesize', function (num) {
    // https://github.com/sindresorhus/pretty-bytes
    if (typeof num !== 'number' || isNaN(num)) {
        throw new TypeError('Expected a number')
    }

    const neg = num < 0
    const units = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

    if (neg) {
        num = -num
    }

    if (num < 1) {
        return (neg ? '-' : '') + num + ' B'
    }

    const exponent = Math.min(Math.floor(Math.log(num) / Math.log(1000)), units.length - 1)
    const unit = units[exponent]
    num = (num / Math.pow(1000, exponent)).toFixed(2) * 1

    return (neg ? '-' : '') + num + ' ' + unit
})

Vue.filter('capitalize', v => v.toUpperCase())
Vue.filter('formatNumber', v => numeral(v).format('0,0'))

const host = process.env.HOSTNAME || window.location.hostname
const httpProtocol = location.protocol
const wsProtocol = httpProtocol === 'https:' ? 'wss:' : 'ws:'
const apiHost = `${httpProtocol}//${host}`
const wsHost = `${wsProtocol}//${host}`
const soundUri = 'https://raw.githubusercontent.com/brainlife/warehouse/master/ui/sounds/'

const ezBIDSUrl = process.env.NODE_ENV === 'development' ? `${httpProtocol}//localhost:8082` : `${apiHost}/api/ezbids`;

Vue.config.debug = false

Vue.config.api = `${apiHost}/api/warehouse`
Vue.config.amaretti_api = `${apiHost}/api/amaretti`
Vue.config.auth_api = `${apiHost}/api/auth`
Vue.config.event_api = `${apiHost}/api/event`
Vue.config.event_ws = `${wsHost}/api/event`

Vue.config.auth_signin = '/auth/#!/signin'
Vue.config.auth_signout = '/auth/#!/signout'
Vue.config.auth_signup = '/auth/#!/signup'
Vue.config.ezbids_api = ezBIDSUrl;
Vue.config.debug_doi = '10.25663/bl.p.3' // o3d publication

Vue.config.plotly = {
    font: {
        font: 'Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji',
        size: 11,
    },
}

Vue.config.hasRole = function (role, service = 'warehouse') {
    return (
        Vue.config.user &&
        Vue.config.user.scopes[service] &&
        ~Vue.config.user.scopes[service].indexOf(role)
    )
}

Vue.config.isSu = function () {
    return !!localStorage.getItem('su-jwt')
}

axios.defaults.baseURL = Vue.config.api

function setUpJWT (jwt) {
    Vue.config.user = JWTDecode(jwt)
    Vue.config.jwt = jwt

    Vue.config.user.sub = `${Vue.config.user.sub}`
    axios.defaults.headers.common['Authorization'] = `Bearer ${Vue.config.jwt}`
}

Vue.config.jwt = localStorage.getItem('jwt')
if (Vue.config.jwt) {
    setUpJWT(Vue.config.jwt)
}

router.beforeEach(function (to, from, next) {
    if (to.matched.length === 0) {
        document.location = '/404'
        return
    }

    if (!to.meta) to.meta = {}

    // redirect to auth unless route is public
    if (!to.meta.public && !Vue.config.jwt) {
        if (!Vue.config.debug) {
            sessionStorage.setItem('auth_redirect', document.location.href)
            document.location = Vue.config.auth_signin
        }
        return
    }

    // scroll to the top of the page
    window.scrollTo(0, 0)
    next()
})

// disabled due to GDRP
/*
Vue.use(VueGtag, {
    appName: "brainlife.io",
    config: {
        id: process.env.GTAG,
    }
}, router)
*/

export const app = new Vue({
    el: '#app',
    router,
    template: `<warehouse v-if="ready"/>`,
    data () {
        return {
            ready: false,

            // things we can access via $root
            sidemenuWide: true,
            rightviewOpen: null,

            // ezbids sessionId, to open ezbidssession dialog on modal load
            ezbidsSession: null,

            notificationSounds: {},
        }
    },
    components: { warehouse },

    async mounted () {
        let wide = localStorage.getItem('sidemenuWide')
        if (wide) this.sidemenuWide = (wide === '1')

        let ro = localStorage.getItem('rightviewOpen')
        if (ro) {
            this.rightviewOpen = JSON.parse(ro)
        } else {
            // open doc for new users
            if (Vue.config.jwt) this.rightviewOpen = 'doc'
        }

        // allow child component to refresh jwt
        // project/submit (adding project requires jwt scope change for ac)
        this.$on('refresh_jwt', this.refresh_jwt)

        if (!Vue.config.jwt) {
            this.ready = true
        } else {
            // for authenticated user
            this.ensure_myproject()
            this.load_profile()

            // refresh jwt on page refresh
            await this.refresh_jwt()

            this.$root.$emit('jwt_refreshed')
            this.ready = true

            // refresh in 30 minutes
            setInterval(() => {
                this.$root.$emit('refresh_jwt')
            }, 1000 * 60 * 30)
        }
    },

    methods: {
        toggleSideMenu () {
            this.sidemenuWide = !this.sidemenuWide
            localStorage.setItem('sidemenuWide', this.sidemenuWide ? '1' : '0')
        },

        toggleRightView (page) {
            this.rightviewOpen = page
            localStorage.setItem('rightviewOpen', JSON.stringify(page))
        },

        async ensure_myproject () {
            if (!Vue.config.jwt) return

            // TODO create project in API

            // make sure user has create at least 1 project
            const res = await this.$http.get('project', {params: {
                find: { user_id: Vue.config.user.sub },
                limit: 1, // I just need count (0 means all)
            }})
            if (res.data.projects.length) return

            await this.$http.post('project', {
                name: 'My Default Project',
                desc: 'Please use this project for testing purpose. You can update this project, or create new projects',
                access: 'private',
                admins: [Vue.config.user.sub],
                members: [],
                agreements: [],
            })

            // we don't have good way of invalidating all projects loaded by the time we finish creating project.
            // we need to reload page..
            location.reload()
        },

        async refresh_jwt (cb) {
            if (!Vue.config.jwt) return

            if (Vue.config.isSu()) {
                const jwt = localStorage.getItem('su-jwt')
                try {
                    const res = await this.$http.post(
                        `${Vue.config.auth_api}/refresh`,
                        {},
                        { headers: { Authorization: `Bearer ${jwt}` } }
                    )
                    localStorage.setItem('su-jwt', res.data.jwt)
                } catch (error) {
                    localStorage.removeItem('su-jwt')
                }
            }

            try {
                const res = await this.$http.post(`${Vue.config.auth_api}/refresh`)
                setUpJWT(res.data.jwt)
                localStorage.setItem('jwt', res.data.jwt)
                if (cb) cb()
            } catch (error) {
                sessionStorage.setItem('auth_redirect', document.location.href)
                document.location = Vue.config.auth_signin
                if (cb) cb(error)
            }
        },

        async load_profile () {
            if (!Vue.config.jwt) return
            try {
                const res = await this.$http.get(`${Vue.config.auth_api}/profile`)
                Vue.config.profile = res.data.profile
            } catch (error) {
            }
        },

        playNotification (name, theme) {
            if (!theme && Vue.config.profile.private.notification) {
                theme = Vue.config.profile.private.notification.process_sound
            }
            if (!theme) return

            new Audio(soundUri + theme + '/' + name + '.mp3').play()
        },
    },
})
