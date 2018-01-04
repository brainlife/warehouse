<template>
<select multiple="multiple" style="width: 100%;"/>
</template>

<script>
export default {
    props: ['options', 'value'],
    mounted() {
        //make sure options include values
        let _options = this.value.concat(this.options);
        
        $(this.$el).select2({
            tags: true,
            data: _options,
            language: {
                noResults: ()=>"(Please enter tag)",
            },
        })
        .val(this.value)
        .trigger('change')
        .on('change', ()=>{
            console.log("value changed");
            this.$emit('input', $(this.$el).val());  
        });
        console.log("initializing select2", this.value, _options);
    },

    watch: {
        value: function(value) {
            console.log("applying new value");
            $(this.$el).val(value);
        },
        options: function(options) {
            console.log("applying new options");
            $(this.$el).empty().select({data: options});
        },
    },

    destroyed: function () {
        $(this.$el).off().select2('destroy');
    }
}
</script>
