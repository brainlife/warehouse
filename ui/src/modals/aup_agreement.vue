<template>
    <b-modal ref="modal">
      <div slot="modal-title">Updated User Agreement</div>
      <iframe :src="agreementURL" style="width: 100%; height: 400px;"></iframe>
      <template #modal-footer>
        <b-button @click="ok" variant="primary">Accept</b-button>
        <b-button @click="close" variant="secondary">Cancel</b-button>
      </template>
    </b-modal>
  </template>
  
  <script>
  import Vue from "vue";
  
  export default {
    data() {
      return {
        config: Vue.config,
        agreementURL: "https://brainlife.io/docs/aup/",
        profile: {
                public: {
                    institution: "",
                    position: "",
                    bio: "",
                    //institution map coordinate
                    showOnMap: false,
                    lat: "",
                    lng: "",
                },
                private: {
                    aup: false,
                    /*
                    neuroimaging_experience: null,
                    study_experience: null,
                    programming_experience: null, 
                    computing_experience: null, 
                    */
                    notification: {
                       //newsletter_general: false,
                        process_sound: null
                    }
                }
        },
      };
    },
    mounted() {
        this.$http.get(Vue.config.auth_api+"/profile").then(res=>{
            if(res.data.profile) lib.mergeDeep(this.profile, res.data.profile);
        });
      this.$refs.modal.show();
    },
    methods: {
      close() {
        this.$refs.modal.hide();
      },
      ok() {
        this.profile.private.aup = new Date();
       
          this.$http.patch(Vue.config.auth_api+"/profile", {
                profile: this.profile, 
            }).then(res=>{
                Vue.config.profile = this.profile;
                this.$notify({ type: "success", text: "Updated Details" });
                // update JWT token
                this.$http.post(Vue.config.auth_api+'/refresh').then(res=>{
                localStorage.setItem("jwt", res.data.jwt);
                this.$notify("refreshed");
                }).catch(err=>{
                    console.error(err.response);
                });
                
                this.$refs.modal.hide();
            }).catch(err=>{
                console.error(err.response);
                this.$notify({type: "error", text: err.response.data.message});
            });  
      },
    },
  };
  </script>
  