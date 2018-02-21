<template>
<select style="width: 100%;">
    <slot></slot>
</select>
</template>

<script>
import Vue from 'vue'
export default {
    props: [
        'value', 
        'options', //select <option>s (not select2 UI options)

        'placeholder',

        'matcher', 
        'dataAdapter',

        'multiple',
        'tags',

        'templateResult',
        'templateSelection',
        
        'allowClear',
    ],

    data() {
        return {
            opts: {},
            config: Vue.config,
        }
    },

    mounted: function() {
        var vm = this;
        function default_format(data) {
            var result = document.createElement('div');
            result.classList.add('menu-item');

            if (data.header) result.classList.add('header');
            if (data.text) result.innerHTML += ascii_escape(data.text);

            //TODO - makes no sense that these formatter exists here
            if (data.datatype && data.tags) {
                var datatype_name = data.datatype.name;
                if(datatype_name.indexOf("neuro/") == 0) datatype_name = datatype_name.substring(6);
                result.innerHTML += " <span class='datatype'>"+datatype_name+"</span> ";
                /*
                data.datatype_tags.forEach(tag => {
                    result.innerHTML += " <span class='tag'>"+ascii_escape(tag)+"</span>";
                });
                */
                var firsttag = true;
                data.tags.forEach(tag => {
                    if(!firsttag) result.innerHTML += " | ";
                    firsttag = false;
                    result.innerHTML += ascii_escape(tag);
                });
            }
            
            // if there's a date, add it
            if (data.date) result.innerHTML += "<time>"+new Date(data.date).toLocaleString()+"</time>";
            
            return result;
        }
        
        this.opts = {
            data: this.options, // <option>
            matcher: this.matcher,
            tags: this.tags,
            multiple: this.multiple,
            templateResult: this.templateResult || default_format,
            templateSelection: this.templateSelection || default_format,
            placeholder: this.placeholder,
            //theme: 'classic',
            allowClear: this.allowClear,
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
                .on('change',function() {
                    //vm.$emit('input', this.value); //doesn't work
                    vm.$emit('input', $(this).val()); //val() returns array for multiselect
                    //console.log("select2 changed");
                })
        }
        
        if (!this.dataAdapter) init();
        else {
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
            //console.log("select2: parent value changed to", value);

            //check to make sure we aren't updateing controller with the same value
            //this happens if user change value on UI, which triggers change, and parent
            //send change event back.
            if(JSON.stringify(value) != JSON.stringify($(this.$el).val())) {
                //console.log("changing select2 to", value, this.options);
                $(this.$el).val(value).trigger('change');
            }
        },
        options: function (options) {
            //console.log("select2: parent options changed to", options);

            this.opts.data = options;
            
            //TODO - why do we need to update val here? (will break without it)
            $(this.$el).select2(this.opts).val(this.value).trigger('change');
        },
    },

    destroy: function () {
        $(this.$el).off().select2('destroy');
    },
}
</script>

<style>
.menu-item {
    display:inline-block;
}
/* these thins should probably go to component/datasetselecter.vue*/
.menu-item time {
    margin-left:10px;
    color:#999;
    float: right;
}
.menu-item .datatype {
    padding: 2px 4px;
    background-color: gray;
    color: white;
}
.menu-item .tag {
    padding:2px 4px;
    color:#999;
}
.select2-results__option--highlighted .tag,
.select2-results__option--highlighted time {
    color: #ddd;
}

/* Hide the 'Searching...' text */
.select2-results__option.loading-results {
    display:none;
}
/* fix some odd indentation issue on the first result option inside each group*/
.select2-container--default .select2-results__option .select2-results__option {
    padding-left: 6px;
}
.select2-container--default .select2-results__option {
    font-size: 10pt;
}
.select2-container--default .select2-selection--multiple .select2-selection__choice {
    border: none;
    border-radius: 0px;
}
.select2-dropdown {
    z-index: 9900;
}
.el-form-item__content {
    line-height: inherit;
}
</style>
