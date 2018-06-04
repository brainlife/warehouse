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
        console.log("select2 component is deprecated by vue-select");
        
        this.opts = {
            data: this.options, 
            matcher: this.matcher,
            tags: this.tags,
            multiple: this.multiple,
            templateResult: this.templateResult || this.default_result_format,
            templateSelection: this.templateSelection || this.default_selection_format,
            placeholder: this.placeholder,
            allowClear: this.allowClear,
        };
        
        if (!this.dataAdapter) this.init();
        else {
            //ugly.. wtf select2 v4 !
            $.fn.select2.amd.require([
                'select2/data/array',
                'select2/utils'
            ], (ArrayData, Utils)=>{
                function Adapter($element, options) {
                    Adapter.__super__.constructor.call(this, $element, options);
                }
                Utils.Extend(Adapter, ArrayData);
                Adapter.prototype.query = this.dataAdapter;
                this.opts.dataAdapter = Adapter;

                this.opts.ajax = {};

                this.init();
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
            //we need to update val also here.. or it will break.. (really?)
            $(this.$el).empty().select2(this.opts).val(this.value).trigger('change');
        },
    },

    destroy: function () {
        $(this.$el).off().select2('destroy');
    },

    methods: {
        init: function() {
            $(this.$el).select2(this.opts).val(this.value).trigger('change')
            .on('change', ()=>{
                this.$emit('input', $(this.$el).val()); //val() returns array for multiselect
            })
        },

        //search result
        default_result_format: function(data) {
            var result = document.createElement('div');
            result.classList.add('menu-item');
            if (data.header) result.classList.add('header');
            if (data.text) result.innerHTML += this.ascii_escape(data.text);
            if (data.desc) result.innerHTML += "<br><small style='opacity: 0.8'>"+this.ascii_escape(data.desc)+"</small>";

            //TODO - makes no sense that this exists here (move to the client)
            if (data.datatype) {
                var datatype_name = data.datatype.name;
                if(datatype_name.indexOf("neuro/") == 0) datatype_name = datatype_name.substring(6);
                result.innerHTML += " <span style='background-color: #999; padding: 3px; color: black;'>"+datatype_name+"</span>";
            }
            if (data.datatype_tags) {
                data.datatype_tags.forEach(tag=>{ 
                    result.innerHTML += "<span style='background-color: #ddd; padding: 3px; color: black;'>"+tag+"</span>";
                });
                result.innerHTML += " ";
            }
            if(data.tags) {
                result.innerHTML += "<br>";
                /*
                var firsttag = true;
                data.tags.forEach(tag => {
                    if(!firsttag) result.innerHTML += " | ";
                    firsttag = false;
                    result.innerHTML += this.ascii_escape(tag);
                });
                */
                result.innerHTML += data.tags.filter(this.ascii_escape).join(" | ");
            }
            
            if (data.date) result.innerHTML += "<time>"+new Date(data.date).toLocaleString()+"</time>";
            
            return result;
        },

        //selected item
        default_selection_format: function(data) {
            var result = document.createElement('div');
            result.classList.add('menu-item');

            if (data.header) result.classList.add('header');
            if (data.text) result.innerHTML += this.ascii_escape(data.text);

            //TODO - makes no sense that these formatter exists here
            if (data.datatype) {
                var datatype_name = data.datatype.name;
                if(datatype_name.indexOf("neuro/") == 0) datatype_name = datatype_name.substring(6);
                result.innerHTML += " <span style='background-color: #999; padding: 3px; color: black;'>"+datatype_name+"</span>";
            }
            if (data.datatype_tags) {
                data.datatype_tags.forEach(tag=>{ 
                    result.innerHTML += "<span style='background-color: #ddd; padding: 3px; color: black;'>"+tag+"</span>";
                });
                result.innerHTML += " ";
            }
            if(data.tags)  {
                result.innerHTML += data.tags.filter(this.ascii_escape).join(" | ");
            }
            // if there's a date, add it (too long for appsubmit)
            //if (data.date) result.innerHTML += "<time>"+new Date(data.date).toLocaleString()+"</time>";
            
            return result;
        },

        // escape a string to ascii codes
        ascii_escape: function(string) {
            var escaped = "";
            for (var char of string) escaped += "&#"+char.charCodeAt(0)+";";
            return escaped;
        },
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
