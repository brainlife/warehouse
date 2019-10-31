<template>
<div v-if="profile" style="display: inline-block">

    <!--contact tag-->
    <div class="contact" :id="uuid" :class="{'text-muted': !profile.active, 'contact-tiny': size == 'tiny'}">
        <img v-lazy="avatar_url(profile, 20)">
        <div v-if="size != 'tiny'" style="display: inline-block;">
            <div class="name" v-if="profile.fullname">
                {{profile.fullname||'No Name'}}
            </div><div class="name" v-else>
                <span class="text-muted">No Name</span>
            </div><div class="email" v-if="profile.email && size == 'full'">&lt;{{profile.email}}&gt;</div>
        </div>
    </div>

    <b-popover :target="uuid" :title="null" triggers="click">
        <img v-lazy="avatar_url(profile, 60)" style="float: left">
        <div style="margin-left: 70px; min-height: 60px;">
            <b>{{profile.fullname}}</b> <small style="opacity: 0.5">{{profile.username}}</small>
            <div v-if="public && public.bio">
                <p style="margin-top: 5px; opacity: 0.8; margin-bottom: 0px;" v-if="public && public.bio">{{public.bio}}</p>
                <small style="opacity: 0.5;" v-if="public.institution">
                    <icon name="university"/> {{public.institution}}
                </small>
            </div>
            <div v-else style="opacity: 0.5"><p style="opacity: 0.5">No bio..</p></div>
        </div>
        <div style="margin-top: 10px; padding-top: 5px; border-top: 1px solid #eee">
            <small>{{profile.email}}</small>
        </div>
    </b-popover>
</div>
</template>

<script>
import Vue from 'vue'
import md5 from 'md5'

import authprofilecache from '@/mixins/authprofilecache'
import profilecache from '@/mixins/profilecache'

const lib = require('@/lib'); //for avatar_url

export default {
    mixins: [authprofilecache, profilecache],
    props: {
        //set id(sub) or (fullname, email)
        id: {
            type: String,
        },
        fullname: {
            type: String,
        }, 
        email: {
            type: String,
        }, 

        //size can be either
        // full (default)
        // small
        // tiny (avatar only)
        size: {
            type: String,
            default: "full",
        },
    },
    data () {
        return {
            profile: {
                active: true,

            },
            public: null, //public profile itself

            uuid: Math.random().toString(),
        }
    },

    watch: {
        id: function() {
            this.loadprofile();
        }
    },

    created: function() {
        //TODO - what is the point of this?
        this.profile.fullname = this.fullname;
        this.profile.email = this.email;

        if(this.id) this.loadprofile();
    },

    methods: {
        avatar_url: lib.avatar_url,
        loadprofile() {
            //if(!Vue.config.user) return; //TODO what is this?
            this.authprofilecache(this.id, (err, profile)=>{
                this.profile = profile;
                this.profilecache(this.id, (err, public_profile)=>{
                    this.public = public_profile;
                });
            });
        },

        click() {
            if(this.profile.email) document.location = 'mailto:'+this.profile.email;
        },

        /*
        title() {
            let t = "";
            if(this.profile.fullname) t += this.profile.fullname + " ";
            t+="<"+this.profile.email+">";
            return t;
        },
        */

        /*
        show() {
            if(!this.public) {
                this.$http.get(Vue.config.profile_api+'/public/'+this.profile.sub).then(res=>{
                    this.public = res.data;
                }).catch(err=>{
                    console.log("couldn't load profile");
                });
            }
        },
        */
    },
}
</script>

<style scoped>
.contact {
display: inline-block;
height: 20px;
margin-right: 10px;
font-size: 11px;
color: #555;
font-weight: 700;
white-space: nowrap;
line-height: 20px;
box-shadow: 1px 1px 2px rgba(0,0,0,0.15);
margin-right: 5px;
cursor: pointer;
}
.contact img {
float: left;
height: 20px;
}
.contact-tiny {
margin-right: 8px;
}
.name, .email {
display: inline-block;
padding: 0px 10px;
}
.name {
background-color: #fff;
}
.email {
background-color: #ddd;
color: #888;
}
</style>
