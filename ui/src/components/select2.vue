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
        'placeholder',

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
        
        function format(data) {
            var result = document.createElement('div');
            result.classList.add('menu-item');
            
            if (data.header) result.classList.add('header');
            
            // if there's text, add it
            if (data.text) result.innerHTML += "<span class='text'>"+ascii_escape(data.text)+"</span>";
            
            // if there's tags, add them
            if (data.tags) {
                data.tags.forEach(tag => {
                    result.innerHTML += "<span class='tag'>"+ascii_escape(tag)+"</span>";
                });
            }
            
            // if there's a date, add it
            if (data.date) result.innerHTML += "<span class='date'>"+ascii_escape(new Date(data.date).toString())+"</span>";
            
            return result;
        }
        
        this.opts = {
            data: this.options, // <option>
            matcher: this.matcher,
            tags: this.tags,
            multiple: this.multiple,
            templateResult: format,
            templateSelection: format,
            placeholder: this.placeholder
            //theme: 'classic',
        };
        
        // escape a string to ascii codes
        function ascii_escape(string) {
            var escaped = "";
            for (var char of string) escaped += "&#"+char.charCodeAt(0)+";";
            return escaped;
        }
        
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
/* Menu Item Styling  */
.menu-item {
    display:inline-block;
}
.menu-item .date {
    margin-left:10px;
    color:#999;
}
.menu-item .tag {
    margin-left:4px;
    padding:4px;
    background:#eee;
    color:black !important;
    border-radius:3px;
    color:#999;
}

.select2-results__option {
    font-family:Roboto;
    font-size:14px;
    color:black !important;
}

.select2-results__option--highlighted {
    background-color:#ddd !important;
}

/* Hide the 'Searching...' text */
.select2-results__option.loading-results {
    display:none;
}
/* fix some odd indentation issue on the first result option inside each group*/
.select2-container--default .select2-results__option .select2-results__option {
    padding-left: 6px;
}

.select2-dropdown {
    z-index: 9900;
}
</style>
