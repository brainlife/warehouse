<template>   
    <b-container class="mt-3">
        <b-form-group label="Subject / Session Filtering" horizontal>
            <p class="text-muted">Enter subject/session names to process. Leave it blank if you want to process all.</p>
            <p>
                <b-input-group prepend="Subject Filter" title="Only process subjects that matches this regex">
                    <b-form-input v-model="subjectMatch" type="text" placeholder="(All subjects)"></b-form-input>
                    <b-input-group-prepend is-text>Session Filter</b-input-group-prepend>
                    <b-form-input v-model="sessionMatch" type="text" placeholder="(All sessions)"></b-form-input>
                </b-input-group>
                <small class="text-muted">For example, <b>^100</b> will make this rule to only submit Apps on subjects that starts with 100 (it could 1001, 1002, 1003, etc..).</small>
            </p>
        </b-form-group>

        <p class="text-muted">The rule handler will look for subjects that <b>contain</b> the following inputs.</p>
        <RuleModalInputTabCard v-for="input in ruleApp.inputs" :key="input._id"
            :project="project"
            :input="input"
            :rule-session-match="sessionMatch"
            :rule-subject-match="subjectMatch"
            :input-extra-datatype-tags="extraDatatypeTags[input.id]"
            :input-selection="inputSelection[input.id]"
            :input-multicount="inputMulticount[input.id]"
            :input-project-override="inputProjectOverride[input.id]"
            :input-subject="inputSubject[input.id]"
            :input-session="inputSession[input.id]"
            :input-tags="inputTags[input.id]"
            @update:input-extra-datatype-tags="tags => extraDatatypeTags[input.id] = tags"
            @update:input-multicount="val => inputMulticount[input.id] = val"
            @update:input-project-override="val => inputProjectOverride[input.id] = val"
            @update:input-selection="val => inputSelection[input.id] = val"
            @update:input-subject="val => inputSubject[input.id] = val"
            @update:input-session="val => inputSession[input.id] = val"
            @update:input-tags="val => inputTags[input.id] = val"
        />
    </b-container>

</template>

<script>
export default {
    components: {
        TagEditor: () => import('@/components/tageditor'),
        DataTypeTag: () => import('@/components/datatypetag'),
        ProjectSelector: () => import('@/components/projectselector'),
        RuleModalInputTabCard: () => import('@/modals/RuleModalInputTabCard')
    },
    emits: [
        'update:rule-subject-match',
        'update:rule-session-match',
    ],
    props: {
        project: String,
        ruleApp: Object,
        ruleSubjectMatch: String,
        ruleSessionMatch: String,
        extraDatatypeTags: Object,
        inputSelection: Object,
        inputMulticount: Object,
        inputProjectOverride: Object,
        inputSubject: Object,
        inputSession: Object,
        inputTags: Object,
    },
    computed: {
        subjectMatch: {
            get() { return this.ruleSubjectMatch },
            set(updatedSubjectMatch) { this.$emit('update:rule-subject-match', updatedSubjectMatch) }
        },
        sessionMatch: {
            get() { return this.ruleSessionMatch },
            set(updatedSessionMatch) { this.$emit('update:rule-session-match', updatedSessionMatch) }
        }
    }
}
</script>