<template>
    <div v-if="user">
        <b-card>
            <div style="float: right;top: 0px">
                <div class="button" title="Edit user" @click="edit()"><icon name="edit" scale="1.25"/></div>
                <b-button v-b-toggle="''+user._id" >Show More</b-button>
            </div>
            <h5>{{user.username}}</h5>
            <p>{{user.fullname}} | {{user.email}} <b-badge v-if="user.email_confirmed" variant="success">Confirmed</b-badge> <b-badge v-else variant="danger">Not Confirmed</b-badge></p>
        
            <b-collapse v-bind:id="user._id" class="mt-2">
                <div>
                    <b-container class="data-container">
                        <b-row>
                            <b-col>
                                <b>User Profile</b>
                                <pre>{{user.profile}}</pre>
                                <b>Scopes</b>
                                <pre>{{user.scopes}}}</pre>
                            </b-col>
                            <b-col>
                                <b>Timestamps</b>
                                <pre>{{user.times}}</pre>
                                <b>Ext</b>
                                <pre>{{user.ext}}</pre>
                            </b-col>
                        </b-row>
                    </b-container>
                </div>
            </b-collapse>
        </b-card>    
    </div>
</template>

<script>
import Vue from 'vue'
export default {
    props : {
        user : Object,
        index : Number,
    },
    methods: {
        edit() {
            this.$router.push('/settings/user/'+(this.index + 1)+'/edit');
        }
    }
}
</script>
<style scoped>
pre {
    background: #ececec;
    padding : 15px;
}
.data-container {
    padding-left : 0;
}
</style>