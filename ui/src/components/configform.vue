<template>
<div>
    <b-row v-for="(v,idx) in sorted_spec" :key="idx" v-if="v.type && v.type != 'input' && advanced == !!(v.advanced)">
        <b-col cols="3" class="text-muted">{{v.id}} <span v-if="!v.optional">*</span></b-col>
        <b-col>
            <b-form-group>
                <!--integer will be deprecated (still used..)-->
                <b-form-input type="number" v-if="v.type == 'number' || v.type == 'integer'" @mousewheel.native="$event.preventDefault()"
                    :min="v.min" :max="v.max" step="any" :readonly="v.readonly" :required="!v.optional"
                    v-model.number="value[v.id]" :placeholder="v.placeholder"/>

                <!--string-->
                <b-form-input type="text" v-if="v.type == 'string' && !v.multiline"
                    :readonly="v.readonly" :required="!v.optional"
                    v-model="value[v.id]" :placeholder="v.placeholder"/>

                <b-form-textarea v-if="v.type == 'string' && v.multiline" :rows="3"
                    :readonly="v.readonly" :required="!v.optional" 
                    v-model="value[v.id]" :placeholder="v.placeholder"/>

                <!--boolean-->
                <div v-if="v.type == 'boolean'">
                    <b-form-checkbox :disabled="v.readonly" v-model="value[v.id]">{{v.desc}}</b-form-checkbox>
                </div>

                <!--select-->
                <b-form-select v-if="v.type == 'enum'" 
                    :disabled="v.readonly" :required="!v.optional" 
                    v-model="value[v.id]" :placeholder="v.placeholder">
                    <option :value="null" v-if="v.optional">(don't specify)</option>
                    <option v-for="(option, idx) in v.options" :key="idx" :value="option.value" :title="option.desc">
                        {{option.label}} <small>({{option.value}})</small>
                    </option>
                </b-form-select>

                <b-form-text v-if="v.type != 'boolean'" style="white-space: pre-wrap;"><span style="color: black;">{{v.desc}}</span></b-form-text>
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
    props: {
        spec: Object,
        value: Object,
        advanced: {
            type: Boolean,
            default: false,
        }
    },
    mounted: function() {
        for(var k in this.spec) {
            var v = this.spec[k];
            if(v.type && v.type != "input" && this.value[k] === undefined) {
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
                return a._order > b._order ? 1 : -1;
            });
            return spec_arr;
        },
    },
}
</script>

<style scoped>
/deep/ .custom-control-label {
    padding-top: 3px;
    font-size: 90%;
}
</style>
