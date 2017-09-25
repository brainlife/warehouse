<template>
<b-form-select v-model="myvalue" :options="['true', 'false']"></b-form-select>
</template>

<script>
import Vue from 'vue'

export default {
    props: ['value'],
    data() {
        return {
            myvalue: null,
        }
    },
    mounted: function() {
        if(this.value) this.myvalue = "true";
        else this.myvalue = "false";
    },
    watch: {
        value: function(v) {
            if(v) this.myvalue = "true";
            else this.myvalue = "false";
            console.log("updateing _value", this.myvalue);
        },
        myvalue: function(v) {
            this.$emit('input', v == "true");
        }
    }
}
</script>
