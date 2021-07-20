<template>
    <div v-if="user">
        <b-card>
            <h6>{{user.username}}</h6>
            <h5>{{user.fullname}}</h5>
        </b-card>    
    </div>
</template>

<script>
import Vue from 'vue'
export default {
    props : {
        user : Object,
    }
}
</script>