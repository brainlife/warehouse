<template>
<div v-if="id">
    <!--from https://creativecommons.org/licenses/-->
    <b-row v-if="id == 'ccby.40'">
        <b-col cols="2">
            <a target="license" href="http://creativecommons.org/licenses/by/4.0/">
                <img src="https://i.creativecommons.org/l/by/4.0/88x31.png" />
            </a>
        </b-col>
        <b-col>
            <h6>CC BY 4.0 - Creative Commons  / Attribution 4.0 International</h6>
            This license lets others distribute, remix, tweak, and build upon your work, even commercially, as long as they credit you for the original creation. This is the most accommodating of licenses offered. Recommended for maximum dissemination and use of licensed materials.  </a>
        </b-col>
    </b-row>
    <b-row v-else-if="id == 'cc0'">
        <b-col cols="2">
            <a target="license" href="https://creativecommons.org/share-your-work/public-domain/cc0">
                <img src="https://i.creativecommons.org/p/zero/1.0/88x31.png" alt="CC0">
            </a>
        </b-col>
        <b-col>
            <h6>CC0 - Creative Commons / Public Domain Dedication</h6>
            CC0 enables scientists, educators, artists and other creators and owners of copyright- or database-protected content to waive those interests in their works and thereby place them as completely as possible in the public domain, so that others may freely build upon, enhance and reuse the works for any purposes without restriction under copyright or database law.
        </b-col>
    </b-row>
    <div v-else>
        {{id}}
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


