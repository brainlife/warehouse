<template>
<b-row v-if="group" class="group">
    <b-col>
        <b-badge variant="danger" v-if="!group.active">Inactive</b-badge>
        <b>{{group.name}}</b>
    </b-col>
    <b-col>
        <span v-for="c in group.admins" :key="c._id">
            <contact :fullname="c.fullname" :email="c.email"/>
        </span>
    </b-col>
</b-row>
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
            group: null,
        }
    },

    created: function() {
        this.groupcache(this.id, (err, group)=>{
            if(err) console.error(err);
            else this.group = group;
        });
    },
}
</script>

<style scoped>
.group {
    padding: 10px;
    background-color: white;
}
</style>
