<template>
<b-modal :no-close-on-backdrop='true' ref="modal" :title="subject" @ok="submit" ok-title="Update"> 
    <b>Participants Info <small>json</small></b>
    <editor v-model="data" @init="editorInit" lang="json" height="200"/>
    <p class="text-muted">
        Participants Info is only accessible for project admin and members (not guests).
        You can use this information for group analysis.
    </p>
</b-modal>
</template>
<script>

import Vue from 'vue'

export default {
    components: { 
        editor: require('vue2-ace-editor'),
    },
    data () {
        return {
            project: null,
            subject: null,
            data: null,
            cb: null, 
            config: Vue.config,
        } 
    },
    mounted() {
        this.$root.$on("participants.edit", (opt)=>{
            this.project = opt.project;
            this.subject = opt.subject;
            this.cb = opt.cb;
            this.data = JSON.stringify(opt.data||{key:"value"}, null, 4);
            this.$nextTick(()=>{
                this.$refs.modal.show()
            });
        });
    },
    methods: {
        close: function() {
            this.$refs.modal.hide();
        },
        editorInit(editor) {
            require('brace/mode/json')
            editor.container.style.lineHeight = 1.25;
            editor.renderer.updateFontSize();
        },
        submit(evt) {
            let data;
            try {
                data = JSON.parse(this.data);
            } catch (err) {
                evt.preventDefault();
                alert('Failed to parse json. Please correct the syntax.');
                return;
            }

            this.axios.patch("participant/"+this.project._id+"/"+this.subject, data).then(res=>{
                this.$notify("Updated participants info");
                this.cb(data);
            }).catch(err=>{
                evt.preventDefault();
                alert(err);
            });
        },
    },
}

</script>
