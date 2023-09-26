<template>
    <b-card>
        <div slot="header" >
            <small class="text-muted" style="float: right">{{input.id}}</small>
            <DataTypeTag :datatype="input.datatype" :tags="input.datatype_tags"/>
            <b v-if="input.multi">multi</b>
            
            <span class="text-muted" v-if="input.optional">(optional)</span>
            <div class="button" v-if="!editExtraTags" @click="allowEditExtraTags()" style="position: absolute; top: 7px;"><icon name="plus" scale="0.8"/></div>
            <TagEditor v-if="editExtraTags" v-model="extraDatatypeTags" placeholder="(enter extra datatype tags)" style="margin-top: 2px;"/>
            <p v-if="input.desc" style="margin-bottom: 0px;"><small>{{input.desc}}</small></p>
        </div>

        <p v-if="input.optional">
            <b-form-checkbox v-model="inputSelectionForInput" value="ignore">Do not use this input</b-form-checkbox>
            <small class="text-muted">This is an optional field. Apps will be submitted without this input</small>
        </p>

        <p v-if="input.multi">
            <b-row>
                <b-col>Multiple Input Object Count *</b-col>
                <b-col :cols="8">
                    <b-form-input v-model="inputMulticountForInput" placeholder="Expected number of objects for each subject/session for this input" />
                </b-col>
            </b-row>                        
        </p>
        
        <!-- inputSelectionForInput may be false or undefined here -->
        <div v-if="inputSelectionForInput !== 'ignore'">
            <b-row>
                <b-col>
                    Selection Override
                    <p>
                        <small class="text-muted">Instead of using data from the same subject/session, you can look for data from different project, or different subject/session.</small>
                    </p>
                </b-col>
                <b-col :cols="8">
                    <p>
                        <ProjectSelector v-model="projectOverride" placeholder="(From this project)"/>
                    </p>
                    <b-input-group prepend="Subject">
                        <b-form-input v-model="inputSubjectForInput" placeholder="(Use the matching subject)"/>
                        <b-input-group-prepend is-text>Session</b-input-group-prepend>
                        <b-form-input v-model="inputSessionForInput" placeholder="(Use the matching session)"/>
                    </b-input-group>

                </b-col>
            </b-row> 
            <b-row>
                <b-col>
                    Object Tags
                    <p>
                        <small class="text-muted">Look for data with specific object tags (<b>not datatype tag!</b>)</small>
                    </p>
                </b-col>
                <b-col :cols="8">
                    <p>
                        <TagEditor v-model="inputTagsForInput" placeholder="(any tags)" :options="inputDatasetTags"/>
                    </p>
                </b-col>
            </b-row> 
            <p v-if="inputTagsCount === null"><icon name="cog" spin/> Counting matching data objects..</p>
            <p v-else>
                <small v-if="inputTagsCount">{{inputTagsCount}} data matches this criteria (may belong to the same subject)</small>
                <b-alert :show="inputTagsCount === 0" variant="secondary">There are no input data-objects that match the specified criteria.</b-alert>
            </p>
        </div>
    </b-card>
</template>

<script>

// ex: debounce: { t1: timeout, dwi: timeout }
const debounce = {}

export default {
    components: {
        DataTypeTag: () => import('@/components/datatypetag'),  
        TagEditor: () => import('@/components/tageditor'),
        ProjectSelector: () => import('@/components/projectselector'),
    },
    emits: [ 
        'update:input-extra-datatype-tags', 
        'update:input-project-override', 
        'update:input-selection',
        'update:input-subject',
        'update:input-session',
        'update:input-tags',
        'update:input-multicount',
    ],
    props: {
        ruleSubjectMatch: String,
        ruleSessionMatch: String,
        project: {
            type: String,
            required: true
        },
        input: {
            type: Object,
            required: true,
        },
        inputExtraDatatypeTags: Array,
        inputSelection: [ String, Boolean ], // can be "ignore" or false or undefined
        inputMulticount: String,
        inputProjectOverride: String,
        inputSubject: String,
        inputSession: String,
        inputTags: Array,
    },
    computed: {
        projectOverride: {
            get() { return this.inputProjectOverride },
            set(updatedProjectOverride) { this.$emit('update:input-project-override', updatedProjectOverride) }
        },
        inputSelectionForInput: {
            get() { return this.inputSelection },
            set(updatedInputSelection) { this.$emit('update:input-selection', updatedInputSelection) }
        },
        extraDatatypeTags: {
            get() { return this.inputExtraDatatypeTags },
            set(updatedDatatypeTags) { this.$emit('update:input-extra-datatype-tags', updatedDatatypeTags) }
        },
        inputSubjectForInput: {
            get() {  return this.inputSubject },
            set(updatedInputSubject) { this.$emit('update:input-subject', updatedInputSubject) }
        },
        inputSessionForInput: {
            get() {  return this.inputSession },
            set(updatedInputSession) { this.$emit('update:input-session', updatedInputSession) }
        },
        inputTagsForInput: {
            get() { return this.inputTags },
            set(updatedInputTags) { this.$emit('update:input-tags', updatedInputTags) }  
        },
        inputMulticountForInput: {
            get() { return this.inputMulticount },
            set(updatedInputMulticount) { this.$emit('update:input-multicount', updatedInputMulticount) }  
        },
        triggerWatcher() {
            /**
             * There's no easy way to watch multiple properties at the same time, so we can use a computed property
             * to trigger a single watcher
             */
            return {
                _project: this.project,
                _input: this.input,
                _inputProjectOverride: this.projectOverride,
                _project: this.project,
                _datatypeId: this.input.datatype._id,
                _secondaryDatatypeId: this.input.datatype,
                _subjectMatch: this.ruleSubjectMatch,
                _sessionMatch: this.ruleSessionMatch,
                _inputSubject: this.inputSubject,
                _inputSession: this.inputSessionForInput,
                _inputDatatypeTags: this.input.datatype_tags,
                _extraDatatypeTags: this.extraDatatypeTags,
            }
        }
    },
    data() {
        return {
            editExtraTags: false,
            inputTagsCount: null,
            inputDatasetTags: []
        }
    },
    watch: {
        triggerWatcher: {
            handler: function() {
                if(debounce[this.input.id]) clearTimeout(debounce[this.input.id]);

                this.inputTagsCount = null;

                debounce[this.input.id] = setTimeout(()=>{
                    this.queryMatchingDatasetsAndGetInputTagsCount();
                }, 1500);
            }
        }
    },
    destroyed() {
        // clear debounce
        for(let key in debounce) {
            clearTimeout(debounce[key]);
            delete debounce[key];
        }
    },
    methods: {
        allowEditExtraTags() {
            this.editExtraTags = true
        },
        loadInputDatasetTags() {
            this.$http.get('dataset/distinct', {
                params: {
                    distinct: 'tags',
                    //TODO - I should apply filtering for datatype_tags and dataset tags
                    find: JSON.stringify({
                        project: this.projectOverride || this.project, 
                        datatype: this.input.datatype,
                        removed: false,
                    }),
                    datatype_tags: this.input.datatype_tags,
                },
                json: true,
            }).then((res) => {
                this.inputDatasetTags = res.data
            })
        },
        queryMatchingDatasetsAndGetInputTagsCount() {
            console.log('querying matching dataset', this.input.id )
        
            const find = {
                project: this.projectOverride || this.project,
                datatype: this.input.datatype._id || this.input.datatype,
                storage: { $exists: true }, //just to be consistent with rule_handler
                removed: false
            }
        
            if(this.ruleSubjectMatch !== "") find["meta.subject"] = { $regex: this.ruleSubjectMatch };
            if(this.ruleSessionMatch !== "") find["meta.session"] = { $regex: this.ruleSessionMatch };
        
            //override if subject name is specified
            if(this.inputSubject) find["meta.subject"] = this.inputSubject;
            if(this.inputSession) find["meta.session"] = this.inputSession;
        
            //handle dataset (negative)tags
            //TODO - I think I can simplify this by combining $in and $nin like.. "{tags: {$all: ["test", "dev"], $nin: ["xyz123"]}}"
            let tag_query = [];
            let pos_tags = [];
            let neg_tags = [];
            this.inputTags.forEach((tag) => {
                if(tag[0] != "!") pos_tags.push(tag);
                else neg_tags.push(tag.substring(1));
            });
            if(pos_tags.length > 0) tag_query.push({tags: {$all:pos_tags}});
            if(neg_tags.length > 0) tag_query.push({tags: {$nin:neg_tags}});
        
            //handle datatype (negative) tags
            let datatype_tags = this.input.datatype_tags.concat(this.extraDatatypeTags);
            pos_tags = [];
            neg_tags = [];
            datatype_tags.forEach(tag=>{
                if(tag[0] != "!") pos_tags.push(tag);
                else neg_tags.push(tag.substring(1));
            });
            if(pos_tags.length > 0) tag_query.push({datatype_tags: {$all:pos_tags}});
            if(neg_tags.length > 0) tag_query.push({datatype_tags: {$nin:neg_tags}});
        
            if(tag_query.length > 0) find.$and = tag_query;
        
            this.$http.get('dataset', {params: {
                find: JSON.stringify(find),
                limit: 1, //I just need count (0 means all!)
            }}).then(res=>{
                this.inputTagsCount = res.data.count;
            })
        }
    },
    mounted: function() {
        this.queryMatchingDatasetsAndGetInputTagsCount();
        this.loadInputDatasetTags();

        // automatically open tag editor if we see that extra datatype tags already exist.
        // This check happens when we edit a rule or select an app when creating a new rule
        this.editExtraTags = (this.inputExtraDatatypeTags || []).length > 0
    }
}
</script>

<style></style>