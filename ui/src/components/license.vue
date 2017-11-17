<template>
<div v-if="id">
    <!--from https://creativecommons.org/licenses/-->
    <div v-if="id == 'ccby.40'">
        <img src="https://i.creativecommons.org/l/by/4.0/88x31.png" style="float: right;"/>
        <h6>CC BY 4.0 - Creative Commons  / Attribution 4.0 International</h6>
        <p>
            This license lets others distribute, remix, tweak, and build upon your work, even commercially, as long as they credit you for the original creation. This is the most accommodating of licenses offered. Recommended for maximum dissemination and use of licensed materials.  
            <a target="license" href="http://creativecommons.org/licenses/by/4.0/">More ..</a>
        </p>
    </div>
    <div v-else-if="id == 'cc0'">
        <img src="https://i.creativecommons.org/p/zero/1.0/88x31.png" style="float: right;" alt="CC0">
        <h6>CC0 - Creative Commons / Public Domain Dedication</h6>
        <p>
            CC0 enables scientists, educators, artists and other creators and owners of copyright- or database-protected content to waive those interests in their works and thereby place them as completely as possible in the public domain, so that others may freely build upon, enhance and reuse the works for any purposes without restriction under copyright or database law.
            <a target="license" href="https://creativecommons.org/share-your-work/public-domain/cc0">More ..</a>
        </p>
    </div>
    <div v-else>
        Unknown License : {{id}}
    </div>
</div>
</template>

<script>
import Vue from 'vue'

export default {
    props: {
        id: String,
    }
}
</script>


