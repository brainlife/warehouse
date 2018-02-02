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
        <div class='altmetric-embed' data-badge-type='donut' data-doi="10.1038/nature.2012.9872"></div>
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
