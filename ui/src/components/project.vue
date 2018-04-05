<!-- I believe this is deprecated-->
<template>
<div>
    <el-alert v-if="project.removed" title="This project has been removed" type="warning" show-icon :closable="false"></el-alert>
    
    <h5><projectaccess :access="project.access"/> {{project.name}}</h5>
    <p>{{project.desc||'No description provided'}}</p>

    <table class="info">
    <tr>
        <th>Admins</th>
        <td>
        <contact v-for="id in project.admins" key="id" :id="id"></contact>
        </td>
    </tr>
    <tr>
        <th>Members</th>
        <td>
        <contact v-for="id in project.members" key="id" :id="id"></contact>
        </td>
    </tr>
    <tr>
        <th>Guests</th>
        <td>
        <contact v-for="id in project.members" key="id" :id="id"></contact>
        </td>
    </tr>
    </table>
</div>
</template>

<script>
// import Vue from 'vue'
import contact from '@/components/contact'
import projectaccess from '@/components/projectaccess'

export default {
    components: { contact, projectaccess },
    name: "project",
    props: [ "project" ],
}
</script>
