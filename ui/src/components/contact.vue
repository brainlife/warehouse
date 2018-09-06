<template>
<div v-if="profile" class="contact" :class="{'text-muted': !profile.active}" :id="uuid" @click-dis.stop="click">
    <img :src="gurl(20)">
    <div v-if="size != 'tiny'" style="display: inline-block;">
        <div class="name" v-if="profile.fullname">
            {{profile.fullname||'No Name'}}
        </div><div class="name" v-else>
            <span class="text-muted">No Name</span>
        </div><div class="email" v-if="profile.email && size == 'full'">&lt;{{profile.email}}&gt;</div>
    </div>
    <b-popover :target="uuid" :title="null" triggers="hover click" @show="show">
        <img :src="gurl(60)" style="float: left">
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

var profiles = null;

export default {
    props: {
        //set id or (fullname, email)
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

    computed: {
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
        gurl(size) {
            var email = this.profile.email;
            if(this.profile.email) {
                return "//www.gravatar.com/avatar/"+md5(this.profile.email)+"?s="+size;  
            } else {
                //generate avatar for user who doesn't have email set..
                //return "//eightbitavatar.herokuapp.com/?id="+this.id+"&s=male&size=22";
                //return "//www.gravatar.com/avatar/"+md5(this.fullname)+"?d=robohash&s=22";
                //return "https://api.adorable.io/avatars/22/"+this.fullname.replace(" ", "")+".png";
                var key = (this.fullname||this.email||this.id);
                return "https://api.adorable.io/avatars/"+size+"/"+key+".png";
            }
        },
        loadprofile() {
            if(profiles === null) {
                //TODO -- do soemthing smarter..
                profiles = this.$http.get(Vue.config.auth_api+'/profile?limit=3000');
            }
            profiles.then(res=>{
                res.body.profiles.forEach((profile)=>{
                    if(profile.id == this.id) this.profile = profile;
                });
            
            }).catch(err=>{
                console.error(err);
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

        show() {
            if(!this.public) {
                this.$http.get(Vue.config.profile_api+'/public/'+this.profile.id).then(res=>{
                    this.public = res.body;
                }).catch(err=>{
                    console.log("couldn't load profile");
                });
            }
        },
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
line-height: 22px;
box-shadow: 1px 1px 2px rgba(0,0,0,0.15);
margin-right: 5px;
cursor: pointer;
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
background-color: #ddd;
color: #888;
/*font-family: monospace;*/
}
</style>
