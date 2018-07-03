<template>
<div>
    <b-row v-for="(v,idx) in sorted_spec" :key="idx" v-if="v.type && v.type != 'input'">
        <b-col cols="3" class="text-muted">{{v.id}} <span v-if="!v.optional">*</span></b-col>
        <b-col>
            <b-form-group>
                <!--integer will be deprecated (still used..)-->
                <b-form-input type="number" v-if="v.type == 'number' || v.type == 'integer'" @mousewheel.native="handle_scroll"
                    :min="v.min" :max="v.max" :step="0.001" :readonly="v.readonly" :required="!v.optional"
                    v-model.number="value[v.id]" :placeholder="v.placeholder"/>

                <!--string-->
                <b-form-input type="text" v-if="v.type == 'string'"
                    :readonly="v.readonly" :required="!v.optional"
                    v-model="value[v.id]" :placeholder="v.placeholder"/>

                <!--boolean-->
                <div v-if="v.type == 'boolean'">
                    <b-form-checkbox :disabled="v.readonly"
                    v-model="value[v.id]">{{v.desc}}</b-form-checkbox>
                </div>

                <!--select-->
                <b-form-select v-if="v.type == 'enum'" 
                    :disabled="v.readonly" :required="!v.optional" 
                    v-model="value[v.id]" :placeholder="v.placeholder">
                    <option :value="null" v-if="v.optional">(don't specify)</option>
                    <option v-for="(option, idx) in v.options" :key="idx" :value="option.value">
                        {{option.label}} <small>({{option.value}})</small>
                        <span v-if="option.desc"> - {{option.desc}}</span>
                    </option>
                </b-form-select>

                <b-form-text v-if="v.type != 'boolean'">{{v.desc}}</b-form-text>
                <b-form-text>
                    <span v-if="v.min !== undefined">min: {{v.min}}</span>
                    <span v-if="v.max !== undefined">max: {{v.max}}</span>
                </b-form-text>
            </b-form-group>
        </b-col>
    </b-row>
</div>
</template>

<script>
import Vue from 'vue'
export default {
    props: [ 'spec', 'value' ],
    /*
    watch: {
        value: function() {
            console.log("spec changed"); 
        },
    },
    */
    mounted: function() {
        console.log("setting defaults");
        for(var k in this.spec) {
            var v = this.spec[k];
            if(v.type && v.type != "input" && this.value[k] === undefined) {
                console.log(k, v.default);
                Vue.set(this.value, k, v.default);
            }
        }
    },
    computed: {
        sorted_spec: function() {
            // return sorted array of
            // config objects by _order
            let spec_arr = [];
            for (let k in this.spec) {
                spec_arr.push(Object.assign({}, this.spec[k], { id: k }));
            }
            
            spec_arr.sort((a, b) => {
                if (typeof a._order != 'number' || typeof b._order != 'number') {
                    return 0;
                }
                return a._order > b._order ? 1 : -1;
            });
            return spec_arr;
        },
    },
    
    methods: {
        //prevent vue-form-input's value from getting changed accidentally by use mouse-wheeling on top of focused
        //number input
        handle_scroll: function(evt) {
            evt.target.blur();
        }
    }
}
</script>