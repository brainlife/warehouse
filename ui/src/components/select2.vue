<template>
<select multiple="true">
    <slot></slot>
</select>
</template>

<script>
import Vue from 'vue'
export default {
    props: ['options', 'value', 'matcher', 'dataAdapter'],

    data() {
        return {
            config: Vue.config,
            
            opts: {}
        }
    },

    mounted: function() {
        var vm = this;
        //init select2
        
        let forSure = function() {
            $(this.$el).select2(this.opts)
            .val(this.value)
            .trigger('change')
            // emit event on change.
            .on('change',function(evt) {
                // console.dir($(vm.$el).val());
                vm.$emit('input', $(vm.$el).val());
            })
        };
        
        this.opts = {
            data: this.options,
            matcher: this.matcher,
            tags: true,
            theme: 'classic'
        };
        if (this.dataAdapter) {
            let self = this;
            
            $.fn.select2.amd.require([
                'select2/data/array',
                'select2/utils'
            ], function(ArrayData, Utils) {
                var Adapter = function($element, options) {
                    Adapter.__super__.constructor.call(this, $element, options);
                };
                
                Utils.Extend(Adapter, ArrayData);
                
                Adapter.prototype.query = self.dataAdapter;
                
                self.opts.ajax = {};
                self.opts.dataAdapter = Adapter;
                
                forSure.call(self);
            });
            
        }
        else
            forSure.call(this);
    },

    //watch for parent value/options change and apply
    watch: {
        options: function (options) {
            $(this.$el).select2(this.opts)
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
max-width:100%;
box-sizing: border-box;
}
</style>

<style>
.select2-dropdown {
z-index: 9900;
}
</style>
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
        $(this.$el).select2({
            data: this.options, 
            tags: true, 
            theme: 'classic',
            //matcher: function(term, text) { console.log("test.........", term, text); return false; },
        })
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
