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

            /* works but not on firefox..
            //disable some unnecessary jupyter template (plain)
            var sheet = new CSSStyleSheet();
            sheet.replaceSync(`
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
            */

            //this work on both firefox and chrome
            const style = document.createElement('style');
            style.type = 'text/css';
            style.appendChild(document.createTextNode(`
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
            `));
            shadow.appendChild(style);

        }).catch(err=>{
            console.error(err);
            this.error = "Failed to load notebook";
        });
    },
}
</script>

<style>
#notebook-container.container {
    width: 100px;
}
</style>
