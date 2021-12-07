<template>
<div>
    <b-badge>{{group.id}}</b-badge>
    <b-badge variant="danger" v-if="!group.active">Inactive</b-badge>

    <b class="serif">{{group.name}}</b>
    <br>
    <small>{{group.desc}}</small>

    <p>
        Admins:
        <span v-for="c in group.admins" :key="c._id">
            <contact :fullname="c.fullname" :email="c.email"/>
        </span>
    </p>

    <!--
    {{group.members}}
    {{group.create_date}}
    -->
</div>
</template>

<script>
import Vue from 'vue'
import groupcache from '@/mixins/groupcache'
import contact from '@/components/contact'

export default {
    mixins: [groupcache],
    components: { 
        contact, 
    },
    props: {
        id: {
            type: Number,
        },
    },

    data () {
        return {
            group: {
            },
        }
    },

    created: function() {
        this.groupcache(this.id, (err, group)=>{
            this.group = group;
        });
    },
}
</script>

<style scoped>
</style>
