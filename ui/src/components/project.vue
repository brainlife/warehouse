<template>
<div>
    <el-alert v-if="project.removed" title="This project has been removed" type="warning" show-icon :closable="false"></el-alert>
    
  <table class="info">
  <tr>
      <th width="130px">Name</th>
      <td>{{project.name}}</td>
  </tr>
  <tr>
      <th>Access</th>
      <td>
        <projectaccess :access="project.access"/>
      </td>
  </tr>
  <tr>
      <th>Description</th>
      <td>
        {{project.desc||'No description provided'}}
      </td>
  </tr>
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
  </table>
</div>
</template>

<script>
import Vue from 'vue'
import contact from '@/components/contact'
import projectaccess from '@/components/projectaccess'

export default {
  components: { contact, projectaccess },
  name: "project",
  props: [ "project" ],
}
</script>
