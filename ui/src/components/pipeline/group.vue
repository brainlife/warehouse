<template>
<div class="pipeline-group" :class="{'group-root': root}" :style="{'background-color': group.color}">
    <h5 style="opacity: 0.7" v-if="!root">{{group.name}}</h5>

    <div v-if="!group.open" class="item-body">
        <pipelineReadme v-if="closedItem" :item="closedItem" @updated="$emit('updated')"/>
        <small>{{activeRuleCount}} Active</small>
    </div>

    <draggable :list="group.items" group="pipeline-items" :style="{'min-height': group.open?'300px':''}" @end="$emit('updated')" handle=".handle">
        <div v-if="group.open" v-for="(item, idx) in group.items" :key="idx" class="item">
            <!--move button-->
            <div class="item-buttons">
                <b-button-group>

                    <b-btn variant="primary" size="sm" @click="editReadme(item)" title="Edit" v-if="item.type == 'readme' && item._editing === null"><icon name="edit"/></b-btn>
                    <b-btn variant="primary" size="sm" @click="editRule(item)" title="Edit" v-if="item.type == 'rule'"><icon name="edit"/></b-btn>
                    <b-btn variant="primary" size="sm" @click="editGroup(item)" title="Edit" v-if="item.type == 'group'"><icon name="edit"/></b-btn>
                    <b-btn variant="outline-secondary" size="sm" class="handle" title="Move this item"><icon name="arrows-alt-v"/></b-btn>
                    <b-btn variant="primary" size="sm" v-if="item.type == 'readme' && item._editing !== null" title="Save the update" @click="saveReadme(item)">Save</b-btn>
                    <b-btn variant="secondary" size="sm" v-if="item.type == 'readme' && item._editing !== null" title="Edit this note" @click="cancelEditReadme(item)">X</b-btn>
                    <b-btn variant="outline-secondary" size="sm" v-if="item.type == 'group' && item.open" title="Close this group" @click="toggle(item)"><icon name="minus"/></b-btn>
                    <b-btn variant="outline-secondary" size="sm" v-if="item.type == 'group' && !item.open" title="Open this group" @click="toggle(item)"><icon name="plus"/></b-btn>

                    <b-btn variant="danger" size="sm" @click="remove(item)" title="Remove this item"><icon name="trash"/></b-btn>
                </b-button-group>
            </div>

            <div class="item-body">
                <pipelineGroup v-if="item.type == 'group'" 
                    :group="item"
                    @updated="$emit('updated')"
                    @newrule="newrule" 
                    :rules="rules"/>

                <pipelineReadme v-if="item.type == 'readme'" 
                    :item="item"
                    @updated="$emit('updated')"/>

                <pipelineRule v-if="item.type == 'rule'" 
                    :rule="rules.find(r=>r._id == item.ruleId)"/>
            </div>
        </div>
    </draggable>
    <p class="group-buttons" v-if="group.open">
        <b-button variant="success" size="sm" @click="newrule(group)" v-if="!root">
            <icon name="robot"/>&nbsp;&nbsp;Add Rule
        </b-button>
        <b-button variant="outline-secondary" size="sm" @click="newgroup" v-if="root" title="Create New Group">
            <icon name="indent"/>&nbsp;&nbsp;Add Group
        </b-button>
        <b-button variant="outline-secondary" size="sm" @click="newmarkdown" v-if="!root" title="Add New Note">
            <icon name="edit"/>&nbsp;&nbsp;Add Note
        </b-button>
    </p>
</div>
</template>

<script>
import Vue from 'vue'

export default {
    props: [ 'rules', 'group', 'root', ],

    components: {
        pipelineRule: ()=>import('@/components/pipeline/rule'),
        pipelineReadme: ()=>import('@/components/pipeline/readme'),
        pipelineGroup: ()=>import('@/components/pipeline/group'), //recursive
        draggable: ()=>import('vuedraggable'),
    },

    computed: {
        closedItem() {
            const firstReadme = this.group.items.find(i=>i.type == "readme");
            if(!firstReadme) return null;
            let firstline = firstReadme.readme.split("\n")[0];
            if(firstline.length > 100) firstline = firstline.substring(0, 100)+"...";
            return {type: "readme", readme: firstline,  _editing: null};
        },

        activeRuleCount() {
            let count = 0;
            this.group.items.forEach(item=>{
                if(item.type != "rule") return;
                const rule = this.rules.find(r=>r._id == item.ruleId);
                if(rule.active) count+=1;
            });
            return count;
        },
    },

    methods: {
        moveup(item) {
            const idx = this.group.items.indexOf(item);
            this.group.items[idx] = this.group.items[idx-1];
            this.group.items[idx-1] = item;
            this.$emit("updated");
        },
        movedown(item) {
            const idx = this.group.items.indexOf(item);
            this.group.items[idx] = this.group.items[idx+1];
            this.group.items[idx+1] = item;
            this.$emit("updated");
        },
    
        newgroup() {
            this.$root.$emit("pipelinegroup.edit", {
                group: {},
                cb: (err, group)=>{
                    console.log("created new group", group);
                    /*
                    this.group.items.push({
                        type: "group",
                        name: "please enter name",
                        items: [
                            {type: "readme", readme: "", _editing: "Enter text here"},
                        ],
                        open: true,
                        color: "#fff2",
                    })
                    */
                    this.group.items.push(group);
                    this.$emit("updated");
                }
            });
        },

        newmarkdown() {
            this.group.items.push({ type: "readme", readme: "", _editing: ""});
            this.$emit("updated");
        },
        
        newrule(group) {
            this.$emit("newrule", group);
        },

        cancelEditReadme(item) {
            item._editing = null;
            this.$emit("updated");
        },

        saveReadme(item) {
            item.readme = item._editing;
            item._editing = null;
            this.$emit("updated");
        },

        editReadme(item) {
            item._editing = item.readme;
        },

        editRule(item) {
            const rule = this.rules.find(r=>r._id == item.ruleId);
            this.$router.push("/project/"+rule.project+"/pipeline/"+rule._id);
        },

        editGroup(group) {
            this.$root.$emit("pipelinegroup.edit", {
                group,
                cb: (err, updated)=>{
                    console.log("updated group", updated);
                    Object.assign(group, updated);
                    this.$emit("updated");
                }
            });
        },

        /*
        changecolor(item) {
            const newcolor = prompt("Enter Group Color", item.color);
            if(newcolor) {
                item.color = newcolor;
                this.$emit("updated");
            }
        },
        */

        remove(item) {
            if(confirm("Are you sure you want to remove this item?")) {
                if(item.type == "rule") {
                    const rule = this.rules.find(r=>r._id == item.ruleId);
                    if(rule.stats && rule.stats.tasks && Object.keys(rule.stats.tasks).length > 0) {
                        return alert("Please remove all jobs submitted by this rule before removing this rule");
                    }
                    this.$http.delete('rule/'+item.ruleId).then(res=>{
                        this.$notify({text: "Removed a rule", type: "success"});
                    });
                }

                if(item.type == "group") {
                    if(item.items.length) {
                        return alert("Please remove all items inside group to remove the group");
                    }
                }

                //remove from rule list
                const idx = this.group.items.indexOf(item);
                this.group.items.splice(idx, 1);
                this.$emit("updated");
            }
        },

        /*
        checkEmpty(group) {
            //if a group becomes empty, remove it
            if(group.items.length == 0) {
                console.log("a group became empty.. removing this group");
                const idx = this.group.items.indexOf(group);
                this.group.items.splice(idx, 1);
            }
            this.$emit("updated");
        },
        */

        toggle(item) {
            item.open = !item.open;
            this.$emit("updated");
        },
    },
}
</script>

<style type="scss" scoped>
.pipeline-group {
    padding: 10px 20px;
    box-shadow: 1px 1px 3px #0002;
    border-radius: 5px;
    margin-bottom: 10px;
}
.group-root {
    background-color: inherit;
    border-radius: 0;
    box-shadow: none;
}

.group-root > .group-buttons {
}

.item {
    padding-bottom: 6px;
    min-height: 35px;
}
.spacefordrop {
    min-height: 300px;
}
.item-buttons {
    float: right; 
    width: 100px; 
    opacity: 0.1;
    transition: 0.3s opacity;
    position: relative;
    left: -5px;
}
.item-body {
    margin-right: 100px;
    padding-right: 10px;
    border-right: 3px solid #0000;
}
.item:hover > .item-buttons {
    opacity: 1;
}
.handle {
    cursor: ns-resize !important;
}
</style>
