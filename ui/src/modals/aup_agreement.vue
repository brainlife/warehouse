<template>
    <b-modal size="lg" ref="modal">
      <div slot="modal-title">Updated User Agreement</div>
      <iframe :src="agreementURL" style="width: 100%; height: 600px;"></iframe>
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
      };
    },
    mounted() {
      this.$refs.modal.show();
    },
    methods: {
      close() {
        this.$refs.modal.hide();
      },
      ok() {
            const updatedAup = new Date();       
            this.$http.patch(Vue.config.auth_api+"/profile", {
                profile: { private: { aup: updatedAup } }
            }).then(res=>{
                Vue.config.profile.private.aup = updatedAup;
                this.$notify({ type: "success", text: "Updated Details" });
                this.$refs.modal.hide();
            }).catch(err=>{
                console.error(err.response);
                this.$notify({type: "error", text: err.response.data.message});
            });  
      },
    },
  };
  </script>
  