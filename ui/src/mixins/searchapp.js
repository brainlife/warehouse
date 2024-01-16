import Vue from 'vue'

let debounce;

export default {
    data() {
        return {
            search_apps: [],
            search_apps_ignore: [], //list of apps to ignore (set by the client)
            cancelToken: null,
        }
    },
    methods: {
        search_app(search, loading) {
            loading(true);

            if (this.cancelToken) {
              this.cancelToken.cancel();
            }
            this.cancelToken = this.axios.CancelToken.source();

            clearTimeout(debounce);
            debounce = setTimeout(()=>{
                let find = {
                    $or: [
                        { name: {$regex: search, $options: 'i' }},
                        { desc: {$regex: search, $options: 'i' }},
                        { github: {$regex: search, $options: 'i' }},
                    ],
                    _id: {$nin: this.search_apps_ignore },
                    removed: false,
                };
                this.axios.get(
                    'app',
                    {
                        params: {
                            find: JSON.stringify(find),
                            populate: 'inputs.datatype outputs.datatype contributors', //to display app detail
                            limit: 100, //freesurfer gives a lot of results..
                        },
                        cancelToken: this.cancelToken.token,
                    }
                )
                .then(res => {
                    this.search_apps = res.data.apps;
                    this.cancelToken = null;
                    loading(false);
                })
                .catch((error) => {
                  if (!this.axios.isCancel(error)) {
                    throw error;
                  }
                });
            }, 300);
        },
    },
}
