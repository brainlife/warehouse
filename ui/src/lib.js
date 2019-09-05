import md5 from 'md5'

console.log("loaded lib");

//pick apps that dataset can be used as input - based on its datatype_id and _tags
export function filter_apps(dataset, apps) {
    //TODO - maybe I should move this filtering logic to server
    return apps.filter((app)=> {
        var has_matching_input = false;
        app.inputs.forEach((input)=> {
            if(!input.datatype) {
                console.log("input datatype missing.. maybe broken app");
                console.dir(app);
                return;
            }
            var input_datatype_id = input.datatype._id || input.datatype;
            var dataset_datatype_id = dataset.datatype._id || dataset.datatype;
            if(input_datatype_id == dataset_datatype_id) {
                //make sure the data type meets all application datatype tags
                var reject = false;
                if(dataset.datatype_tags) input.datatype_tags.forEach((tag)=> {
                    if(tag[0] == '!') {
                        //negative tag (dataset must't have)
                        if(~dataset.datatype_tags.indexOf(tag.substring(1))) {
                            reject = true;
                        }
                    } else {
                        //normal tag (dataset must have)
                        if(!~dataset.datatype_tags.indexOf(tag)) reject = true;
                    }
                });
                if(!reject) has_matching_input = true;
            }
        });
        return has_matching_input;
    });
}

//opposite of filter_apps. select datasets that can be used as input for app
export function filter_datasets(datasets, input) {
    return datasets.filter(dataset=>{
        var input_datatype_id = input.datatype._id || input.datatype;
        var dataset_datatype_id = dataset.datatype._id || dataset.datatype;
        
        if(input_datatype_id != dataset_datatype_id) return false;

        var match = true;
        //see if all required tags exists
        if(dataset.datatype_tags) input.datatype_tags.forEach(required_tag=>{
            if(required_tag[0] == "!") {
                //negative tag
                var neg_tag = required_tag.substring(1);
                if(~dataset.datatype_tags.indexOf(neg_tag)) match = false;
            } else {
                //required tag
                if(!~dataset.datatype_tags.indexOf(required_tag)) match = false;
            }
        });

        return match; 
    });
}

//dedupe an array
//https://stackoverflow.com/questions/9229645/remove-duplicate-values-from-js-array
export function uniq(a) {
    var seen = {};
    return a.filter(function(item) {
        return seen.hasOwnProperty(item) ? false : (seen[item] = true);
    });
}

export function avatar_url(user, size) {
    if(user.email) {
        return "//www.gravatar.com/avatar/"+md5(user.email)+"?s="+size;  
    } else {
        //generate avatar for user who doesn't have email set..
        //return "//eightbitavatar.herokuapp.com/?id="+this.id+"&s=male&size=20";
        //return "//www.gravatar.com/avatar/"+md5(this.fullname)+"?d=robohash&s=20";
        //return "https://api.adorable.io/avatars/20/"+this.fullname.replace(" ", "")+".png";
        var key = (user.fullname||user.email||user.id);
        return "https://api.adorable.io/avatars/"+size+"/"+key+".png";
    }
}
