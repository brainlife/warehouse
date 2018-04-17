<template>
    <!--TODO replace with vue-select-->
    <select multiple="multiple" style="width: 100%;"></select>
</template>

<script>
export default {
    props: ['options', 'value', 'placeholder'],
    mounted() {
        //make sure options include values
        let _options = this.value.concat(this.options);
        $(this.$el).select2({
            tags: true,
            data: _options,
            placeholder: this.placeholder, //TODO doesn't seem to work..
            language: {
                noResults: ()=>"(Please Enter Tag)",
            },
        })
        .val(this.value)
        .trigger('change')
        .on('change', ()=>{
            this.$emit('input', $(this.$el).val());  
        });
    },
    data: function() {
        return {
            old: null,
        }
    },

    watch: {
        value: function(value) {
            console.log("tageditor value changed", value);
            if(JSON.stringify(value) === JSON.stringify(this.old)) return; //don't update if it's same
            $(this.$el).val(value).trigger('change');
            this.old = value;
        },
        options: function(options) {
            $(this.$el).empty().select({data: options});
        },
    },

    destroyed: function () {
        $(this.$el).off().select2('destroy');
    }
}
</script>
