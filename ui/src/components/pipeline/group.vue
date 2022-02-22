<template>
<div class="pipeline-group" :class="{'group-root': root, 'group-open': group.open}" :style="{'background-color': group.color}">

    <groupbuttons :group="group" v-if="group.open && root && group.items.length" :root="root" :insertTop="true" 
        @newrule="newrule" 
        @newgroup="newgroup" 
        @newmarkdown="newmarkdown" 
        @sort="sort"/>

    <h5 style="opacity: 0.7" v-if="!root">{{group.name}}</h5>
    <div v-if="!group.open" class="item-body">
        <pipelineReadme v-if="closedItem" :item="closedItem" @updated="$emit('updated')"/>
        <small>{{activeRuleCount}} Active</small>
    </div>

    <draggable :list="group.items" class="draggable" group="pipeline-items" @end="$emit('updated')" handle=".handle">
        <div v-if="group.open" v-for="(item, idx) in group.items" :key="idx" class="item">
            <!--move button-->
            <div class="item-buttons">
                <b-button-group vertical>

                    <b-btn variant="primary" size="sm" @click="editReadme(item)" title="Edit" v-if="item.type == 'readme' && item._editing === null"><icon name="edit"/></b-btn>
                    <b-btn variant="primary" size="sm" @click="editRule(item)" title="Edit" v-if="item.type == 'rule'"><icon name="edit"/></b-btn>
                    <b-btn variant="primary" size="sm" @click="editGroup(item)" title="Edit" v-if="item.type == 'group'"><icon name="edit"/></b-btn>
                    <b-btn variant="light" size="sm" @click="copyrule({group, ruleId: item.ruleId})" title="Copy" v-if="item.type == 'rule'">
                        <icon name="copy"/>
                    </b-btn>
                    <b-btn variant="light" size="sm" class="handle" title="Move this item"><icon name="arrows-alt-v"/></b-btn>
                    <b-btn variant="primary" size="sm" v-if="item.type == 'readme' && item._editing !== null" title="Save the update" @click="saveReadme(item)"><icon name="check"/></b-btn>
                    <b-btn variant="secondary" size="sm" v-if="item.type == 'readme' && item._editing !== null" title="Edit this note" @click="cancelEditReadme(item)">X</b-btn>
                    <b-btn variant="light" size="sm" v-if="item.type == 'group' && item.open" title="Close this group" @click="toggle(item)"><icon name="minus"/></b-btn>
                    <b-btn variant="light" size="sm" v-if="item.type == 'group' && !item.open" title="Open this group" @click="toggle(item)"><icon name="plus"/></b-btn>

                    <b-btn variant="danger" size="sm" @click="remove(item)" title="Remove this item"><icon name="trash"/></b-btn>
                </b-button-group>
            </div>

            <div class="item-body">
                <pipelineGroup v-if="item.type == 'group'" 
                    :group="item"
                    @updated="$emit('updated')"
                    @newrule="newrule"
                    @copyrule="copyrule"
                    :rules="rules"/>

                <pipelineReadme v-if="item.type == 'readme'" 
                    :item="item"
                    @updated="$emit('updated')"/>

                <pipelineRule v-if="item.type == 'rule'" 
                    :rule="rules.find(r=>r._id == item.ruleId)"/>
            </div>
        </div>
    </draggable>

    <groupbuttons v-if="group.open" :root="root" :group="group" :insertTop="false"
        @newrule="newrule" 
        @newgroup="newgroup" 
        @newmarkdown="newmarkdown" 
        @sort="sort"/>
</div>
</template>

<script>
import Vue from 'vue'

import groupbuttons from './groupbuttons'

export default {
    props: [ 'rules', 'group', 'root', ],

    components: {
        pipelineRule: ()=>import('@/components/pipeline/rule'),
        pipelineReadme: ()=>import('@/components/pipeline/readme'),
        pipelineGroup: ()=>import('@/components/pipeline/group'), //recursive
        draggable: ()=>import('vuedraggable'),
        groupbuttons,
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

        newgroup(opt) {
            this.$root.$emit("pipelinegroup.edit", {
                group: {},
                cb: (err, group)=>{
                    if(opt.insertTop) this.group.items.unshift(group);
                    else this.group.items.push(group);
                    this.$emit("updated", group);
                }
            });
        },

        newmarkdown(opt) {
            const newm = { type: "readme", readme: "", _editing: "" };
            if(opt.insertTop) this.group.items.unshift(newm);
            else this.group.items.push(newm);
            this.$emit("updated", opt);
        },

        newrule(opt) {
            this.$emit("newrule", opt);
        },

        copyrule(opt) {
            this.$emit("copyrule", opt);
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
                    Object.assign(group, updated);
                    this.$emit("updated");
                }
            });
        },
        
        sort(mode) {
            //sort items 
            this.group.items.sort((a,b)=>{

                //I can only sort rules
                if(a.type != "rule") return 0;
                if(b.type != "rule") return 0;

                const arule = this.rules.find(r=>r._id == a.ruleId);
                const brule = this.rules.find(r=>r._id == b.ruleId);
                let av, bv;
                switch(mode) {
                case "date":
                    av = new Date(arule.create_date);
                    bv = new Date(brule.create_date);
                case "name":
                    av = arule.app.name;
                    bv = brule.app.name;
                }
                if(av > bv) return 1;
                if(av < bv) return -1;
                return 0;
            });
            this.$emit("updated");
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
.item {
    padding-bottom: 6px;
    min-height: 35px;
}
.item-buttons {
    float: right; 
    width: 50px; 
    opacity: 0.1;
    transition: 0.3s opacity;
    position: relative;
    left: -5px;
}
.item-body {
    margin-right: 50px;
    padding-right: 10px;
    border-right: 3px solid #0000;
    min-height: 70px;
}
.item:hover > .item-buttons {
    opacity: 1;
}
.handle {
    cursor: ns-resize !important;
}
.group-open > .draggable {
    min-height: 300px;
}
.group-root.group-open > .draggable {
    min-height: inherit;
}
</style>
