<template>
<select>
    <slot></slot>
</select>
</template>

<script>
import Vue from 'vue'
export default {
    props: [
        'options', //select <option>s (not select2 UI options)
        'value', //preselected values

        'matcher', 
        'dataAdapter',

        'multiple',
        'tags',
    ],

    data() {
        return {
            opts: {},
            config: Vue.config,
        }
    },

    mounted: function() {
        var vm = this;
        
        this.opts = {
            data: this.options, // <option>
            matcher: this.matcher,
            tags: this.tags,
            multiple: this.multiple,
            //theme: 'classic',
        };

        function init() {
            $(vm.$el)
                .select2(vm.opts)
                .val(vm.value)
                .trigger('change')
                .on('change',function(evt) {
                    vm.$emit('input', $(this).val()); //this causes infinite loop with watch/value
                })
        }
        
        if (!this.dataAdapter) {
            init();
        } else {
            //ugly.. wtf select2 v4 !
            $.fn.select2.amd.require([
                'select2/data/array',
                'select2/utils'
            ], function(ArrayData, Utils) {
                var Adapter = function($element, options) {
                    Adapter.__super__.constructor.call(this, $element, options);
                };
                Utils.Extend(Adapter, ArrayData);
                Adapter.prototype.query = vm.dataAdapter;
                vm.opts.ajax = {};
                vm.opts.dataAdapter = Adapter;

                init();
            });
        }
    },

    //watch for parent value/options change and apply
    watch: {
        value: function(value) {
            //check to make sure we aren't updateing controller with the same value
            //this happens if user change value on UI, which triggers change, and parent
            //send change event back.
            if(JSON.stringify(value) != JSON.stringify($(this.$el).val())) {
                $(this.$el).val(value).trigger('change');
            }
        },
        options: function (options) {
            $(this.$el).select2({data: options});
        },
    },

    destroy: function () {
        $(this.$el).off().select2('destroy')
    },
}
</script>

<style scoped>
select {
width: 100%;
max-width:100%;
box-sizing: border-box;
}
</style>

<style>
/* Hide the 'Searching...' text */
.select2-results__option.loading-results {
    display:none;
}

.select2-dropdown {
z-index: 9900;
}
</style>
