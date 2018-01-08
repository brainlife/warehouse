<template>
<div>
    <h1>Test</h1>
    <b-form>
        <b-form-checkbox id="checkbox1"
                         v-model="status"
                         value="accepted"
                         unchecked-value="not_accepted">
          I accept the terms and use
        </b-form-checkbox>
    </b-form>
</div>
</template>

<script>
import Vue from 'vue'

export default {
    data() {
        return {
            status: "",
        }
    },
    methods: {
        handleClick: function() {
            alert("yp");
        }
    }
}
</script>
