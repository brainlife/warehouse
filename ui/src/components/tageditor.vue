<template>
    <!--TODO replace with vue-select-->
    <v-select multiple taggable v-model='tags' :options='options' :placeholder='placeholder' :close-on-select="false">
        <span slot="no-options">
            <!-- Don't show anything if there are no options -->
        </span>
    </v-select>
</template>

<script>
import vSelect from 'vue-select'

export default {
    props: ['options', 'value', 'placeholder'],
    components: { vSelect },
    
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
                    this.$emit('input', this.tags);
                }
                this.dont_emit = false;
                this.old_tags = this.tags.slice();
            }
        },
        value: function() {
            if (!this.tags) {
                this.dont_emit = true;
                this.old_tags = null;
            } else {
                this.old_tags = this.tags.slice();
            }
            
            this.tags = this.value;
        }
    },
}
</script>
