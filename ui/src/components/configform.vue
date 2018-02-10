<template>
<div>
    <b-row v-for="(v,k) in spec" :key="k" v-if="v.type && v.type != 'input'">
        <b-col>{{k}}</b-col>
        <b-col cols="8">
            <b-form-group>
                <!--integer will be deprecated (still used..)-->
                <b-form-input type="number" v-if="v.type == 'number' || v.type == 'integer'" :min="v.min" :max="v.max" :readonly="v.readonly" v-model.number="value[k]" :placeholder="v.placeholder"/>
                <b-form-input type="text" v-if="v.type == 'string'" :readonly="v.readonly" v-model="value[k]" :placeholder="v.placeholder"/>
                <div v-if="v.type == 'boolean'">
                    <b-form-checkbox :disabled="v.readonly" v-model="value[k]">{{v.desc}}</b-form-checkbox>
                </div>
                <b-form-select v-if="v.type == 'enum'" v-model="value[k]" :placeholder="v.placeholder" :disabled="v.readonly">
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
    components: { 
    },
    props: [ 'spec', 'value' ],
}
</script>

