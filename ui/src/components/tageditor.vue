<template>
<!--vue-select doesn't support required attribute yet (https://github.com/sagalbot/vue-select/issues/477)-->
<!--close-on-select allows user to keep adding values, but they also can't close it easily when they are done with adding values 
as ESC key will close modals-->
<v-select multiple taggable v-model='tags' :options='options' :placeholder='placeholder' :required="required">
    <span slot="no-options">
        <!-- Don't show anything if there are no options -->
    </span>
</v-select>
</template>

<script>

export default {
    props: ['options', 'value', 'placeholder', 'required'],
    //components: { },
    
    data: function() {
        return {
            dont_emit: null,
            old_tags: null,
            tags: null,
        };
    },
    
    mounted() {
        if (this.value) {
            this.tags = this.value;
            this.dont_emit = true;
        }
    },

    watch: {
        tags: function() {

            if (JSON.stringify(this.old_tags) != JSON.stringify(this.tags)) {
                if (!this.dont_emit) {
                    //v-select allows space attached to the tag (https://github.com/sagalbot/vue-select/issues/605)
                    //until v-select can remove space by itself, I need to clean it up myself
                    let clean_tags = [];
                    if(this.tags) this.tags.forEach(tag=>{
                        clean_tags.push(tag.trim());
                    });
                    console.dir(clean_tags);
                    this.$emit('input', clean_tags);
                }
                if(this.tags) {
                    this.dont_emit = false;
                    this.old_tags = this.tags.slice();
                }
            }
        },
        value: function() {
            if (this.tags) {
                this.old_tags = this.tags.slice();
            } else {
                this.dont_emit = true;
                this.old_tags = null;
            }
            
            this.tags = this.value;
        },
    },
}
</script>
