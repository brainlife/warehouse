<template>
<div>
    <div class="page-content">
        <pipelineGroup 
            v-if="this.project.pipelines && this.rules" 
            :group="this.project.pipelines" 
            @updated="updatePipeline" 
            @newrule="newrule" 
            @copyrule="copyrule" 
            :rules="rules" 
            :root="true"
            class="pipeline-group"/>
    </div><!--page-content-->
</div>
</template>

<script>
import Vue from 'vue'

import pipelineGroup from '@/components/pipeline/group'
import ReconnectingWebSocket from 'reconnectingwebsocket'

import appcache from '@/mixins/appcache'

const async = require("async");

var debounce = null;

export default {
    mixins: [ appcache ],

    props: [ 'project' ],
    components: {
        pipelineGroup,
    },
    data () {
        return {
            editing: null,
            selected: null,
            //order: 'create_date', //default (new > old)

            //ready: false,

            rules: null,
            //datatypes: null,
            //projects: null,

            ws: null,

            config: Vue.config,
        }
    },

    mounted() {
        this.load();
    },

    destroyed() {
        if(this.ws) this.ws.close();
    },

    watch: {
        project: function() {
            this.load();
        },

        '$route': function() {
            this.handleRoute();

            //deprecated
            var subid = this.$route.params.subid;
            if(!subid) this.editing = null;
        },
    },

    methods: {
        handleRoute() {
            const subid = this.$route.params.subid;
            if(subid && this.rules) {
                const rule = this.rules.find(r=>r._id == subid);
                this.$root.$emit("rule.edit", {rule, cb: (err, _rule)=>{
                    if(err) console.error(err);
                    const idx = this.rules.indexOf(rule);   
                    this.appcache(_rule.app, {populate_datatype: false}, (err, app)=>{
                        _rule.app = app;
                        Vue.set(this.rules, idx, _rule);
                    });
                }});
            }
        },

        load(cb) {
            this.$http.get('rule', {params: {
                find: JSON.stringify({
                    project: this.project._id,
                }),
                populate: 'app',
                sort: 'create_date',
                limit: 500,
            }})
            .then(res=>{
                this.rules = res.data.rules;

                this.handleRoute();   
                this.subscribe();

                //initialize if pipeline hierarchy doesn' exist yet
                if(!this.project.pipelines) {
                    const pipelines = {
                        type: "group",
                        name: "", //we don't show name on root
                        open: true,
                        color: "inherit", //root doesn't have any color
                        /*
                        items: [
                            {
                                type: "group", 
                                name: "Please rename this group",
                                open: true,
                                color: "#f0f0f0", //default
                                items: [
                                    //{type: "readme", readme: "Unorganized pipeline rules", _editing: null},
                                    ...this.rules.filter(r=>!r.removed).map(r=>({type: "rule", ruleId: r._id}))
                                ]
                            },
                        ],
                        */
                        items: [
                            ...this.rules.filter(r=>!r.removed).map(r=>({type: "rule", ruleId: r._id}))
                        ]
                    };
                    Vue.set(this.project, 'pipelines', pipelines);
                }
            });
        },

        subscribe() {
            var url = Vue.config.event_ws+"/subscribe?jwt="+Vue.config.jwt;
            if(this.ws) this.ws.close();
            this.ws = new ReconnectingWebSocket(url, null, {/*debug: Vue.config.debug,*/ reconnectInterval: 3000});
            this.ws.onopen = (e)=>{
                this.ws.send(JSON.stringify({
                    bind: {
                        ex: "warehouse",
                        key: "rule.*.*."+this.project._id+".#",
                    }
                }));
            }

            this.ws.onmessage=(json)=>{
                const event = JSON.parse(json.data);
                if(!event.dinfo) return; //??

                const keys = event.dinfo.routingKey.split(".");
                const project_id = keys[3];
                const rule_id = keys[4];

                if(event.dinfo.routingKey.startsWith("rule.update.")) {
                    let newrule = event.msg;
                    let rule = this.rules.find(rule=>rule._id == rule_id);
                    if(rule) {
                        //update existing rule
                        for(let key in newrule) {
                            switch(key) {
                            case "app":
                            case "stats":
                                //we handle these differently
                                break;
                            default:
                                rule[key] = newrule[key];
                            }
                        }
                        if(newrule.stats) {
                            //stats events are populated sparsely.. so let's not overwrite
                            for(let key in newrule.stats) {
                                rule.stats[key] = newrule.stats[key];
                            }
                        }
                    } else {
                        console.error("odd.. couldn't find the rule that we just received update", keys, newrule);
                    }

                    if(newrule.app) {
                        //populate app info
                        this.appcache(newrule.app, {populate_datatype: false}, (err, app)=>{
                            rule.app = app;
                        });
                    }
                }

                if(event.dinfo.routingKey.startsWith("rule.create.")) {
                    let newrule = event.msg;
                    this.appcache(newrule.app, {populate_datatype: false}, (err, app)=>{
                        newrule.app = app;
                        this.rules.push(newrule);
                    });
                }
            }
        },

        updatePipeline() {
            this.$http.put('project/'+this.project._id, {
                pipelines: this.project.pipelines,
            });
        },

        newrule(group) {
            this.$root.$emit("rule.edit", {
                rule: {
                    //_id: null, //for new rule
                    project: this.project._id, 
                },
                cb: (err, _rule)=>{
                    this.appcache(_rule.app, {populate_datatype: false}, (err, app)=>{
                        _rule.app = app;
                        this.rules.push(_rule);

                        group.items.push({type: "rule", ruleId: _rule._id})
                        this.updatePipeline();
                    });
                }
            });
        },

        copyrule({group, ruleId}) {
            const rule = this.rules.find(r=>r._id == ruleId);
            const newrule = Object.assign({}, rule);
            delete newrule._id;
            newrule.name = "(copy of) "+newrule.name||'untitled';
            this.$root.$emit("rule.edit", {
                rule: newrule,
                cb: (err, _rule)=>{
                    this.appcache(_rule.app, {populate_datatype: false}, (err, app)=>{
                        _rule.app = app;
                        this.rules.push(_rule);

                        group.items.push({type: "rule", ruleId: _rule._id})
                        this.updatePipeline();
                    });
                }
            });
        },
   },
};

</script>

<style scoped>
.rule {
    box-shadow: 1px 1px 3px rgba(0,0,0,0.3);
    margin: 0px 20px;
    transition: margin 0.2s;
    background-color: white;
}
.rule:first-child {
    margin-top: 2px;
}
.rule.rule-selected {
margin: 0px;
margin-top: 20px;
background-color: #f0f0f0;
margin-bottom: 20px;
box-shadow: none;
}
.rule.rule-selected .rule-header {
margin-bottom: 10px;
background-color: #f0f0f0;
}
.rule.rule-inactive .rule-header {
background-color: #ddd;
}
.rule.rule-inactive {
background-color: #eee;
}
.rule-header {
cursor: pointer;
transition: background-color 0.3s;
padding: 4px 10px;
padding-top: 10px;
font-size: 88%;
}
.rule-header .custom-switch {
top: -2px;
}
.rule.rule-selected .rule-header {
padding: 15px;
position: sticky;
top: 0px;
z-index: 7; /*make it on top of scrollbar for log view*/
}
.rule-body {
margin-right: 100px;
background-color: white;
clear: both;
}
.rule.rule-selected .rule-body {
box-shadow: 2px 2px 3px rgba(0,0,0,0.2);
}
.expand-transition {
  transition: all .3s ease;
  height: 30px;
  padding: 10px;
  background-color: #eee;
  overflow: hidden;
}
.expand-enter, .expand-leave {
  height: 0;
  padding: 0 10px;
  opacity: 0;
}
.rule-header:hover {
cursor: pointer;
background-color: #eee;
}
.info {
    top: 100px;
    padding: 8px 20px;
    color: #999;
    background-color: #f9f9f9;
    z-index: 1; /*needed to make sort order dropdown box to show up on top of page-content*/
}
.page-content {
    overflow-x: hidden; /*i can't figure out why there would be x scroll bar when a rule is active*/
    top: 95px;
    background-color: #e0e0e0;
}
.header,
.content {
    min-width: 500px;
}
.config {
    background-color: #f9f9f9;
}
.date {
    font-size: 85%;
    opacity: 0.5;
}
.section-header {
    background-color: #f4f4f4;
    clear: both;
    padding: 10px;
    margin-bottom: 10px;
}
.pipeline-group {
}
</style>

