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
      if(!this.userAgreementAgreed()) this.$refs.modal.show();
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
      userAgreementAgreed() {
            const latestAgreementDate = new Date('2023-08-17'); // Replace with the actual date of the latest version
            const userAgreementDateStr = Vue.config.profile.private.aup;
            console.log("User agreement date", userAgreementDateStr);

            if (typeof userAgreementDateStr === "boolean") {
                console.log("User agreement date is a boolean value:", userAgreementDateStr);
                return false;
            }

            const userAgreementDate = new Date(userAgreementDateStr);

            if (!(userAgreementDate instanceof Date && !isNaN(userAgreementDate.getTime()))) {
                console.log("User agreement date is not a valid date", userAgreementDate);
                return false;
            } 

            // User has not accepted the latest version of the data use agreement
            if (userAgreementDate < latestAgreementDate) {
                console.log("User has not accepted the latest version of the data use agreement", userAgreementDate, latestAgreementDate);
                return false;
            }

            return true;           
        }
    },
  };
  </script>
  