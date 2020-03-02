<template>
<div style="display: inline-block">

    <!--contact tag-->
    <div class="contact" :id="uuid" :class="{'text-muted': !user.active, 'contact-tiny': size == 'tiny'}">
        <img v-lazy="avatar_url(user, 20)">
        <div v-if="size != 'tiny'" style="display: inline-block;">
            <div class="name">{{user.fullname||'No Name'}}</div>
            <div class="email" v-if="user.email && size == 'full'">&lt;{{user.email}}&gt;</div>
        </div>
    </div>

    <b-popover :target="uuid" :title="null" triggers="click">
        <img v-lazy="avatar_url(user, 60)" style="float: left">
        <div style="margin-left: 70px; min-height: 60px;">
            <b>{{user.fullname}}</b> <small style="opacity: 0.5">{{user.username}}</small>
            <div v-if="user.profile && user.profile.public && user.profile.public.bio">
                <p style="margin-top: 5px; opacity: 0.8; margin-bottom: 0px;">{{user.profile.public.bio}}</p>
                <small style="opacity: 0.5;" v-if="user.profile.public.institution">
                    <icon name="university"/> {{user.profile.public.institution}}
                </small>
            </div>
        </div>
        <div style="margin-top: 10px; padding-top: 5px; border-top: 1px solid #eee">
            <small>{{user.email}}</small>
        </div>
    </b-popover>
</div>
</template>

<script>
import Vue from 'vue'
//import md5 from 'md5'

import authprofilecache from '@/mixins/authprofilecache'
//import profilecache from '@/mixins/profilecache'

const lib = require('@/lib'); //for avatar_url

export default {
    mixins: [authprofilecache],
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
            user: {
                username: null,  
                fullname: null,
                email: null,
                active: true,
                profile: null,
            },

            uuid: Math.random().toString(), //for popover
        }
    },

    watch: {
        id: function() {
            this.loadprofile();
        }
    },

    created: function() {
        //this component works with either id, or fullname/email
        if(this.id) this.loadprofile();
        else {
            this.user.fullname = this.fullname;
            this.user.email = this.email;
        }
    },

    methods: {
        avatar_url: lib.avatar_url,
        loadprofile() {
            //if(!Vue.config.user) return; //TODO what is this?
            this.authprofilecache(this.id, (err, user)=>{
                Object.assign(this.user, user);
            });
        },

        click() {
            if(this.user.email) document.location = 'mailto:'+this.user.email;
        },
    },
}
</script>

<style scoped>
.contact {
display: inline-block;
height: 20px;
margin-right: 10px;
font-size: 11px;
font-weight: 700;
white-space: nowrap;
line-height: 20px;
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
