<template>
    <b-container class="mt-3">
        <p class="text-muted">For each subject found, the rule handler will submit the App if the following output is <b>not yet generated</b></p>
        <b-card v-for="output in ruleApp.outputs" :key="output._id">
            <div slot="header">
                <small class="text-muted" style="float: right">{{output.id}}</small>
                <DataTypeTag :datatype="output.datatype" :tags="output.datatype_tags"/>
                <p v-if="output.desc" style="margin-bottom: 0px;"><small>{{output.desc}}</small></p>
            </div>
            <RuleModalOutputTabCardBody
                :project="project"
                :output="output" 
                :archive="archive[output.id]" 
                :output-tags="outputTags[output.id]"
                @update:output-tags="tags => outputTags[output.id] = tags"
            />
        </b-card>
    </b-container>
</template>

<script>
export default {
    components: {
        DataTypeTag: () => import('@/components/datatypetag'),
        RuleModalOutputTabCardBody: () => import('@/modals/RuleModalOutputTabCardBody'),
    },
    props: {
        project: String,
        ruleApp: Object,
        archive: Object,
        outputTags: Object
    }
}
</script>

<style></style>