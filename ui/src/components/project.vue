<template>
<div>
  <table class="info">
  <tr>
      <th width="130px">Name</th>
      <td>{{project.name}}</td>
  </tr>
  <tr>
      <th>Access</th>
      <td>
        <div v-if="project.access == 'public'" class="ui blue label">Public</div>
        <div v-if="project.access == 'private'" class="ui red label">Private</div>
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

export default {
  name: "project",
  props: [ "project" ],
  components: { contact },
}
</script>
