<template>
<div :class="{'rule-inactive': !rule.active}" class="rule">
    <!--
    <div style="float: right">
        <div class="button" @click="open"><icon name="edit"/></div>
    </div>
    -->
    <app :app="rule.app" :branch="rule.brancn" :compact="true" :clickable="false">
        <div style="margin: 10px 100px 0 10px">
            <taskconfigtable :config="rule.config" :appconfig="rule.app.config" :hideDefault="true"/>
        </div>
    </app>
   
    <p class="desc" v-if="rule.name">{{rule.name}}</p>

    <!--other metadata-->
    <div style="margin-left: 10px; margin-top: 10px;">
        <div>
            <span style="opacity: 0.5">Created</span> <timeago :datetime="rule.create_date" :auto-update="10"/>
            &nbsp;
            by
            &nbsp;
            &nbsp;
            <contact :id="rule.user_id" size="small"/>
            <span style="opacity: 0.5">Updated</span> <timeago :datetime="rule.update_date" :auto-update="10"/>
            &nbsp;
            &nbsp;
        </div>
    </div>
 
    <hr>
    <div style="margin-left: 10px;">
        <b-row>
            <b-col>
                <icon name="arrow-right" style="float: right; position: relative; top: 0px; opacity: 0.5;"/>
                <span class="form-header" style="display: inline-block;">Input</span>
                &nbsp;
                <span v-if="rule.subject_match" title="Only handle subjects that matches this regex">
                    <b-badge>SUBJECT: {{rule.subject_match}}</b-badge>
                </span>
                &nbsp;
                <span v-if="rule.session_match" title="Only handle session that matches this regex">
                    <b-badge>SESSION: {{rule.session_match}}</b-badge>
                </span>
                <br>

                <div v-for="input in rule.app.inputs" :key="input._id" style="display: inline-block;">
                    <div v-if="inputUsed(input.id)" style="display: inline-block;">
                        <datatypetag :datatype="input.datatype" :tags="[...input.datatype_tags, ...rule.extra_datatype_tags[input.id]]" :clickable="false"/>
                        <small v-for="(tag,idx) in rule.input_tags[input.id]" :key="idx"> | {{tag}} </small>
                    </div>
                    &nbsp;
                </div>
            </b-col>
            <b-col>
                <span class="form-header">Output</span>
                <div v-for="output in rule.app.outputs" :key="output._id" style="display: inline-block">
                    <div v-if="outputArchived(output.id)" style="display: inline-block">
                        <datatypetag :datatype="output.datatype" :tags="output.datatype_tags" :clickable="false"/>
                        <small v-for="(tag,idx) in rule.output_tags[output.id]" :key="idx"> | {{tag}} </small>
                    </div>
                    &nbsp;
                </div>
            </b-col>
        </b-row>
    </div>

    <hr>

    <b-row>
        <b-col :cols="4">
            <div>
                <div class="button" @click="updateStats" style="float: right;" title="Reprocess this rule now"><icon name="sync-alt"/></div>
                &nbsp;
                &nbsp;
                <b-form-checkbox switch v-model="rule.active" size="lg" @change="flip" name="something" style="display: inline-block">
                    <b v-if="rule.active" class="text-primary" title="Piepline will submit new job when conditions are met">Active</b>
                    <b v-else class="text-secondary" title="No new jobs will be submitted by this rule">Inactive</b>
                </b-form-checkbox>
            </div>
        </b-col>

        <!--counts-->
        <b-col :cols="2" v-if="rule.stats && rule.stats.counts" title="Number of subjects/session that this rule is waiting for the input data to become available">
            <h5 style="height: 20px; margin-bottom: 3px">{{rule.stats.counts.waiting}}</h5>
            <span class="form-header">Waiting</span>
        </b-col>
        <b-col v-if="rule.stats && rule.stats.tasks">
            <div style="height: 20px; margin-bottom: 3px">
                <stateprogress v-if="(rule.active || numJobsRunning)" :states="rule.stats.tasks"/>
            </div>
            <div v-if="numJobsRunning" class="button" style="float: right; position: relative; top: -3px;" @click="removeJobs"> <icon name="trash"/>&nbsp;&nbsp;Remove All Jobs </div>
            <span class="form-header" style="float: left;">Processing</span>
        </b-col>
        <b-col :cols="2" v-if="rule.stats && rule.stats.counts">
            <h5 style="height: 20px; margin-bottom: 3px">{{rule.stats.counts.finished}}</h5>
            <span class="form-header">Finished</span>
        </b-col>
    </b-row>
</div>
</template>

<script>
import Vue from 'vue'

export default {
    props: [
        'rule'
    ],

    components: {
        stateprogress: ()=>import('@/components/stateprogress'),
        contact: ()=>import('@/components/contact'),
        taskconfigtable: ()=>import('@/components/taskconfigtable'),
        app: ()=>import('@/components/app'),
        datatypetag: ()=>import('@/components/datatypetag'),
        tags: ()=>import('@/components/tags'),
    },
    
    computed: {
        numJobsRunning() {
            if(!this.rule.stats) return 0;
            if(!this.rule.stats.tasks) return 0;
            let count = 0;
            for(let state in this.rule.stats.tasks) {
                count += this.rule.stats.tasks[state];
            }
            return count;
        }, 
    },

    methods: {
        inputUsed(id) {
            if(!this.rule.input_selection[id]) return true; //assume it's used
            if(this.rule.input_selection[id] == "ignore") return false;
            return true;
        },

        outputArchived(id) {
            return this.rule.archive[id].do;
        },

        flip(v) {
            this.$http.put('rule/'+this.rule._id, {active: v}).then(res=>{
                //this.$notify({ title: 'Activating', text: 'Successfully activated', type: 'success', });
                /*
                if(!v && this.numJobsRunning > 0) {
                    alert("There are still jobs submitted by this rule. Please remove them if you don't want those jobs anymore.");
                }
                */
            }).catch(this.notify_error);
            /*
            if(rule.active) {
                //activate
                this.$http.put('rule/'+rule._id, {active: true}).then(res=>{
                    //this.$notify({ title: 'Activating', text: 'Successfully activated', type: 'success', });
                }).catch(this.notify_error);
            } else {
                //deactivate
                //this.$notify({ title: 'Deactivating', text: 'Deactivating this rule and all tasks submitted from it', type: 'info', });
                this.$http.put('rule/deactivate/'+rule._id).then(res=>{
                    //this.$notify({ title: 'Deactivating', text: 'Successfully deactivated', type: 'success', });
                }).catch(this.notify_error);
            }
            */

            return true; //stop prop
        },

        removeJobs() {
            if(this.rule.active) {
                alert("Please deactivate the rule before removing the jobs");
                return;
            }
            this.$root.$emit("loading",{message: "Removing Jobs.."});
            this.$http.put('rule/removejobs/'+this.rule._id).then(res=>{
                this.$notify({ text: res.data.msg, type: 'info', });
                this.$root.$emit("loading", {show: false});
            }).catch(err=>{
                console.error(err);
                this.$root.$emit("loading", {show: false});
                this.$notify({type: "error", text: err.response.data.message});
            });;
        },

        //event_handler listens to task update (including task removal) but sometimes
        //status gets stuck (maybe something wrong with event not received, or debouncer has
        //has some issue? This allows user to force update_rule_stats
        updateStats() {
            this.$http.post("rule/updatestats/"+this.rule._id).then(res=>{
                console.dir(res.data);
            });
        },
    },

}
</script>

<style scoped>
.rule {
    font-size: 80%;
    padding: 10px;
    box-shadow: 1px 1px 3px #0002;
    border-radius: 4px;
    background-color: white;
    transition: 0.3s background-color;
}
.rule-inactive {
    opacity: 0.6;
}
hr {
    margin-top: 8px;
    margin-bottom: 10px;
}
.desc {
    margin-left: 10px;
    margin-bottom: 5px;
}
</style>
