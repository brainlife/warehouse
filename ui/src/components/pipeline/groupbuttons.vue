<template>
<b-button-group style="margin-bottom: 10px;">
    <b-button variant="success" size="sm" @click="newrule">
        <icon name="robot"/>&nbsp;&nbsp;Add Rule
    </b-button>
    <b-button variant="light" size="sm" @click="newgroup" v-if="root" title="Create New Group">
        <icon name="indent"/>&nbsp;&nbsp;Add Group
    </b-button>
    <b-button variant="light" size="sm" @click="newmarkdown" title="Add New Note">
        <icon name="edit"/>&nbsp;&nbsp;Add Note
    </b-button>
    <b-dropdown variant="secondary" text="Sort">
        <b-dropdown-item @click="sort('date')">By creation date</b-dropdown-item>
        <b-dropdown-item @click="sort('name')">By app name</b-dropdown-item>
    </b-dropdown>
</b-button-group>
</template>

<script>
import Vue from 'vue'

export default {
    props: [ 'root', 'group', 'insertTop' ],
    methods: {
        newrule(group) {
            //I have to let the group to add the newrule bubble up all the way to the root, which then
            //takes care of actually creating a rule (why can't we just let the group itself create it?)
            this.$emit("newrule", {group: this.group, insertTop: this.insertTop});
        },
        newgroup() {
            this.$emit("newgroup", {insertTop: this.insertTop});
        },
        newmarkdown() {
            this.$emit("newmarkdown", {insertTop: this.insertTop});
        },
        sort(mode) {
            this.$emit("sort", mode);
        },
    }
}
</script>
