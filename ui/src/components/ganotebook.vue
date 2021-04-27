<template>
<div>
    <div ref="host"/>
    <small v-if="error">{{error}}</small>
</div>
</template>
<script>
export default {
    props: {
        error: null,
        ga: {type: Object},
    },
    mounted() {
        this.$http.get("secondary/"+this.ga.sectask_id+"/html/index.html").then(res=>{
            const shadow = this.$refs.host.attachShadow({mode: 'open'});
            shadow.innerHTML = res.data;

            /*
            const style = document.createElement('style');
            style.innerHTML = `
            @media (min-width: 1200px) 
            .container {
                width: 200px;
            }
            `;
            console.log("adding style");
            console.dir(style);
            shadow.appendChild(style);
            console.dir(shadow.style);
            */
            var sheet = new CSSStyleSheet();
            sheet.replaceSync(`
                /*disable some unnecessary jupyter template (plain)*/
                .container {
                    width: inherit;
                }
                #notebook-container {
                    box-shadow: inherit;
                    padding: 0;
                }
                div#notebook {
                    padding-top: 0;
                    font-size: 12px;
                }
            `);
            shadow.adoptedStyleSheets = [ sheet ];
        }).catch(err=>{
            console.error(err);
            this.error = "Failed to load notebook";
        });
    },
}
</script>
