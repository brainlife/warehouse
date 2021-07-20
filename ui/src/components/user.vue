<template>
    <div v-if="user">
        <b-card>
            <div style="float: right;top: 0px">
                <icon name="edit" scale="1.25"/>
                  <b-button v-b-toggle="''+user._id">Show More</b-button>
            </div>
            <h5>{{user.username}}</h5>
            <h6>{{user.fullname}} | {{user.email}} <b-badge v-if="user.email_confirmed" variant="success">Confirmed</b-badge> <b-badge v-else variant="danger">Not Confirmed</b-badge></h6>
        
            <b-collapse v-bind:id="user._id" class="mt-2">
                <b-card>
                    <b-container class="bv-example-row">
                        <b-row>
                            <b-col>
                                <h6>User Profile</h6>
                                <pre>{{user.profile}}</pre>
                                <br>
                                <h6>Scopes</h6>
                                <pre>{{user.scopes}}}</pre>
                            </b-col>
                            <b-col>
                                <h6>Timestamps</h6>
                                <pre>{{user.times}}</pre>
                                <h6>Ext</h6>
                                <pre>{{user.ext}}</pre>
                            </b-col>
                        </b-row>
                    </b-container>
                </b-card>
            </b-collapse>
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
<style scoped>
pre {
    background: #ececec;
    padding : 15px;
}
</style>