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
            old_tags: null,
            tags: null,
        };
    },
    
    mounted() {
        this.tags = this.value;
    },

    watch: {
        tags: function() {
            if (JSON.stringify(this.old_tags) != JSON.stringify(this.tags)) {
                if (this.old_tags) {
                    this.$emit('input', this.tags);
                }
            }
            this.old_tags = this.tags.slice();
        },
        value: function() {
            this.tags = this.value;
        }
    },
}
</script>
