<template>
    <div>
        <p>
            <b-form-checkbox v-model="archive.do">Submit the App if this output data does not exist (and archive the output).</b-form-checkbox>
        </p>
        <div v-if="archive.do">
            <b-row>
                <b-col>
                    Dataset Tags
                    <p>
                        <small class="text-muted">Tags to add to the archived data. Tags allow you to specify which input data to use on subsequent rules if there are multiple.</small>
                    </p>
                </b-col>
                <b-col :cols="9">
                    <p>
                        <TagEditor v-model="outputTagsForInput" placeholder="(any tags)" :options="outputDatasetTags"/>
                    </p>
                </b-col>
            </b-row>
            <b-row>
                <b-col>Description</b-col>
                <b-col :cols="9">
                    <b-form-textarea :rows="2" v-model="archive.desc" placeholder="Description for archived data object"/>
                </b-col>
            </b-row>
        </div>
    </div>
</template>

<script>
export default {
    components: {
        TagEditor: () => import('@/components/tageditor'),
    },
    props: {
        project: String,
        output: Object,
        archive: Object, // we expect an obj like { do: output.archive, desc: "" }
        outputTags: Array,
    },
    computed: {
        outputTagsForInput: {
            get() { return this.outputTags },
            set(updatedOutputTags) { this.$emit('update:output-tags', updatedOutputTags) }  
        },
    },
    data() {
        return {
            outputDatasetTags: []
        }
    },
    methods: {
        loadOutputDatasetTags() {
            this.$http.get('dataset/distinct', {params: {
                distinct: 'tags',
                find: JSON.stringify({
                    project: this.project, 
                    datatype: this.output.datatype,
                    removed: false,
                }),
                datatype_tags: this.output.datatype_tags,
            }}).then(res=>{
                this.outputDatasetTags = res.data;
            }); 
        },
    },
    mounted() {
        this.loadOutputDatasetTags();
    }
}
</script>

<style></style>