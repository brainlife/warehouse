<template>
<div class="contact" :class="{'text-muted': !profile.active}">
    <img :src="gurl">
    <div class="name" v-if="profile.fullname">
        {{profile.fullname||'No Name'}}
    </div><div class="name" v-else>
        <span class="text-muted">No Name</span>
    </div><div class="email" v-if="profile.email">&lt;{{profile.email}}&gt;</div>
</div>
</template>

<script>
import Vue from 'vue'
import md5 from 'md5'

var profiles = null;

export default {
    props: ['id', 'fullname', 'email'],
    data () {
        return {
            profile: {
                active: true
            },
        }
    },

    computed: {
        gurl: function() {
            var email = this.profile.email;
            if(this.profile.email) {
                return "//www.gravatar.com/avatar/"+md5(this.profile.email)+"?s=22";  
            } else {
                //generate avatar for user who doesn't have email set..
                return "http://eightbitavatar.herokuapp.com/?id="+this.id+"&s=male&size=22";
            }
        } 
    },

    watch: {
        id: function() {
            this.loadprofile();
        }
    },

    created: function() {
        this.profile.fullname = this.fullname;
        this.profile.email = this.email;
        if(this.id) this.loadprofile();
    },

    methods: {
        loadprofile: function() {
            if(profiles === null) {
                profiles = this.$http.get(Vue.config.auth_api+'/profile');
            }
            profiles.then(res=>{
                res.body.profiles.forEach((profile)=>{
                    if(profile.id == this.id) this.profile = profile;
                });
            }, res=>{
                console.error(res);
            });
        }
    },
}
</script>

<style scoped>
.contact {
display: inline-block;
height: 22px;
margin-right: 10px;
font-size: 12px;
color: #555;
font-weight: 700;
white-space: nowrap;
margin: 2px 0px;
line-height: 22px;
box-shadow: 1px 1px 2px rgba(0,0,0,0.15);
margin-right: 5px;
}
.contact img {
float: left;
height: 22px;
}
.name, .email {
display: inline-block;
padding: 0px 10px;
}
.name {
background-color: #fff;
}
.email {
position: relative;
background-color: #ddd;
color: #888;
font-family: monospace;
}
</style>
