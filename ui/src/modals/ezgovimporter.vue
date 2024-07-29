<template>
  <b-modal id="ezgov-import-modal" title="Import from ezGOV" @ok="importDocument">
    <b-form-group label="Select Project">
      <b-form-select v-model="selectedProject" @change="onProjectSelect" :options="projectOptions">
        <template #first>
          <option :value="null" disabled>Select Project</option>
        </template>
      </b-form-select>
    </b-form-group>

    <b-form-group label="Select Document" v-if="selectedProject">
      <b-form-select v-model="selectedDocument" :options="documentOptions">
        <template #first>
          <option :value="null" disabled>Select Document</option>
        </template>
      </b-form-select>
    </b-form-group>
  </b-modal>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      projects: [],
      selectedProject: null,
      selectedDocument: null
    };
  },
  computed: {
    projectOptions() {
      return this.projects.map(project => ({ value: project, text: project.title }));
    },
    documentOptions() {
      if (this.selectedProject) {
        return this.selectedProject.documents.map(doc => {
          const fileExtension = doc.fileName.split('.').pop().toLowerCase();
          const isSupported = ['txt', 'pdf', 'docx'].includes(fileExtension);
          return { value: doc, text: doc.fileName, disabled: !isSupported };
        });
      }
      return [];
    }
  },
  methods: {
    async fetchProjects() {
      try {
        const response = await axios.get('ezgov/projects');
        this.projects = response.data;
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    },
    onProjectSelect() {
      this.selectedDocument = null;
    },
    async importDocument() {
      if (this.selectedProject && this.selectedDocument) {
        try {
          const response = await axios.get(`ezgov/project/${this.selectedProject._id}/file/${this.selectedDocument._id}/getText`);
          this.$emit('importedText', response.data);
        } catch (error) {
          console.error('Error importing document:', error);
        }
      }
    }
  },
  mounted() {
    this.fetchProjects();
  }
};
</script>
