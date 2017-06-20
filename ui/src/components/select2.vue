<template>
<select multiple="true">
    <slot></slot>
</select>
</template>

<script>
import Vue from 'vue'
export default {
    props: ['options', 'value'],

    /*
    data() {
        return {
            config: Vue.config,
        }
    },
    */

    mounted: function() {
        var vm = this;
        //init select2
        $(this.$el).select2({data: this.options, tags: true, theme: 'classic'})
        .val(this.value)
        .trigger('change')
        // emit event on change.
        .on('change',function(evt) {
            console.dir($(vm.$el).val());
            vm.$emit('input', $(vm.$el).val());
        })
    },

    //watch for parent value/options change and apply
    watch: {
        options: function (options) {
            $(this.$el).select2({ data: options })
        },
        value: function(value) {
            //check to make sure we aren't updateing controller with the same value
            //this happens if user change value on UI, which triggers change, and parent
            //send change event back.
            if(JSON.stringify(value) !== JSON.stringify(this.value)) $(this.$el).val(value).trigger('change');
        },
    },

    //clean up
    destroyed: function () {
        $(this.$el).off().select2('destroy')
    },
}
</script>

<style scoped>
select {
width: 100%;
box-sizing: border-box;
}
</style>
