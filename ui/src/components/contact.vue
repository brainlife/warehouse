<template>
<div class="contact">
    <img :src="gurl">
    <div class="name">
        {{profile.fullname||'?'}}
        <span v-if="!profile.active">- inactive</span>
    </div>
    <div class="email">&lt;{{profile.email}}&gt;</div>
</div>
</template>

<script>
import Vue from 'vue'
import md5 from 'md5'

var profiles = null;

export default {
    props: ['id'],
    data () {
        return {
            profile: {},
        }
    },

    computed: {
        gurl: function() {
            var email = this.profile.email;
            if(!this.profile.email) {
                //generate avatar for user who doesn't have email set..
                return "http://eightbitavatar.herokuapp.com/?id="+this.id+"&s=male&size=22";
            } else {
                return "//www.gravatar.com/avatar/"+md5(this.profile.email)+"?s=22";  
            }
        } 
    },

    watch: {
        id: function() {
            this.loadprofile();
        }
    },

  mounted: function() {
    this.loadprofile();
  },
  methods: {
    loadprofile: function() {
      if(!this.id) return; //not yet set?
      if(profiles === null) {
        //load all "active:false"-ones too - so that we can display the status
        profiles = this.$http.get(Vue.config.auth_api+'/profile');
      }
      profiles.then(res=>{
        res.body.profiles.forEach((profile)=>{
            if(profile.id == this.id) this.profile = profile;
        });
        //if(!this.profile) console.error("failed to find profile id",this.id);
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
}
.contact img {
float: left;
height: 22px;
border-top-left-radius: 3px;
border-bottom-left-radius: 3px;
}
.name, .email {
display: inline-block;
padding: 0px 10px;
background-color: #fdfdfd;
}
.email {
position: relative;
left: -3px;
background-color: #ddd;
color: #888;
font-family: monospace;
border-top-right-radius: 3px;
border-bottom-right-radius: 3px;
}
</style>
