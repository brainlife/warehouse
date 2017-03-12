<template>
<div>

  <h3>{{project.name}}</h3>
  <table class="ui definition table">
    <tbody>
      <tr>
          <td>Create Date</td>
          <td>
            <time>{{project.create_date}}</time>
          </td>
      </tr>
      <tr>
          <td>Access</td>
          <td>
            <div v-if="project.access == 'public'" class="ui blue label">Public</div>
            <div v-if="project.access == 'private'" class="ui red label">Private</div>
          </td>
      </tr>
      <tr>
          <td>Description</td>
          <td>
            {{project.desc||'No description provided'}}
          </td>
      </tr>
      <tr>
          <td>Admins</td>
          <td>
            <contact v-for="id in project.admins" key="id" :id="id"></contact>
          </td>
      </tr>
      <tr>
          <td>Members</td>
          <td>
            <contact v-for="id in project.members" key="id" :id="id"></contact>
          </td>
      </tr>
    </tbody>
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
