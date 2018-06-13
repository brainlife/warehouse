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
            tags: null
        }
    },
    
    mounted() {
        this.tags = this.value;
    },

    watch: {
        'tags': function() {
            this.$emit('input', this.tags);
        }
    },
}
</script>
