<template>
<div class="ui modal">
  <i class="close icon"></i>
  <div class="header"> Upload {{instance_id}}</div>
  <div class="content">
    <form class="ui form">
      <div class="ui header">Something nice to say about our user</div>
      <div class="field">
        <label>Name</label>
        <input type="text" v-model="name" placeholder="Enter name for this file group">
      </div>
      <div class="field">
        <label>Description</label>
        <textarea v-model="desc" placeholder="Describe the file group"></textarea>
      </div>
      <div class="field">
        <label>Project</label>
        <select v-model="project_id">
          <option value="123">Test Project (public)</option>
          <option value="456">Project X1 (private)</option>
          <option value="557">Project X2 (private)</option>
        </select>
      </div>

      <div class="field">
        <label>Files</label>
        <div class="field" v-for="task in tasks">
          <div v-if="task.type == 't1'">
            <label>T1</label>
            <input type="file" v-on:change="setfile(task, 't1')"></input>
          </div>
          <div v-if="task.type == 'dwi'">
            <label>DWI</label>
            <input type="file" v-on:change="setfile(task, 'dwi')"></input>
            <input type="file" v-on:change="setfile(task, 'bvecs')"></input>
            <input type="file" v-on:change="setfile(task, 'bvals')"></input>
          </div>
          {{task}}
          <hr>
        </div>
      </div>

      <!-- Add new file type -- >
      <!-- TODO loadfrom datatype collection -->
      <select v-on:change="addtask()" v-model="newtype">
        <option value="">(Select File Type to Add)</option>
        <option value="t1">T1</option>
        <option value="dwi">Diffusion Image (dwi/bvecs/bvals)</option>
      </select>
    </form>
  </div><!--content-->
  <div class="actions">
    <div class="ui black deny button">
      Cancel
    </div>
    <div class="ui positive right labeled icon button">
      Finalize <i class="checkmark icon"></i>
    </div>
  </div>
</div>
</template>

<script>
import Vue from 'vue'

export default {
  name: "uploader",
  data () {
    return {
      name: "",
      desc: "",
      instance_id: null, //set to wf instance when user request for new upload
      project_id: null, //project id to place new crate in

      newtype: "", //type of files to be added by upload_addtask
      tasks: [], //list of file types
    }
  },
  methods: {
 		addtask: function() {
			this.tasks.push({
				type: this.newtype,
        files: [],
			});
			this.newtype = ""; //reset
		},
    setfile: function(task, filetype) {
      task.files.push(filetype);
      //TODO - start uploading. to sca-wf/_upload task
      //TODO - when all files are uploaded, submit sca-wf/validator
      //TODO - monitor for validator task update and display result
    }
  },
}
</script>
