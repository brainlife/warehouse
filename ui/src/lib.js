import md5 from 'md5'

//pick apps that dataset can be used as input - based on its datatype_id and _tags
export function filter_apps(dataset, apps) {
    //TODO - maybe I should move this filtering logic to server
    return apps.filter((app)=> {
        var has_matching_input = false;
        app.inputs.forEach((input)=> {
            if(!input.datatype) {
                console.log("input datatype missing.. maybe broken app");
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
        return "//www.gravatar.com/avatar/"+md5(user.email)+"?s="+size+"&d=mp";  
    } else {
        //generate avatar for user who doesn't have email set..
        //return "//eightbitavatar.herokuapp.com/?id="+this.id+"&s=male&size=20";
        //return "//www.gravatar.com/avatar/"+md5(this.fullname)+"?d=robohash&s=20";
        //return "https://api.adorable.io/avatars/20/"+this.fullname.replace(" ", "")+".png";
        //var key = (user.fullname||user.id);
        //return "https://api.adorable.io/avatars/"+size+"/"+key+".png";
        return "data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//gA7Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyB2NjIpLCBxdWFsaXR5ID0gOTAK/9sAQwADAgIDAgIDAwMDBAMDBAUIBQUEBAUKBwcGCAwKDAwLCgsLDQ4SEA0OEQ4LCxAWEBETFBUVFQwPFxgWFBgSFBUU/9sAQwEDBAQFBAUJBQUJFA0LDRQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQU/8AAEQgAFAAUAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/aAAwDAQACEQMRAD8A+x9B0WfxBqsNjbsFeQnLt0UAZJNdT4q+GMugaU99Be/a0ix5qNHtIHTI5NUvhrp+o3PiKO5sVQR2/wDrnkzt2njHHc9vpXpvjuw1DUvDlzb6eqM7D94rfeZRyQvvxQB4Nn3ooIIOMYPvRQB7L8JYUj8LM6jDyTuWPrjArtaKKAPn3xjAkHinVEQbVFwxAHuc/wBaKKKAP//Z";
    }
}

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
export function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
export function mergeDeep(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}

export function parseCSV(csv) {
    const csv_rows = csv.split("\n"); 
    const headers = csv_rows.shift().split(",");
    const rows = [];
    csv_rows.forEach(csv_row=>{
        const values = csv_row.split(",");
        const row = {};
        values.forEach((v,idx)=>{
            const f = parseFloat(v);
            if(!isNaN(f)) v = f;
            row[headers[idx]] = v;
        });
        rows.push(row);
    });
    return rows;
}

export function string2hue(s) {
    let sum = 0;
    for (let i = 0; i < s.length; i++) {
        sum += s.charCodeAt(i)*1050;
    }
    return sum%360;
}

export function editorInit(editor, cb) {
    require('brace/mode/json')
    require('brace/theme/chrome')
    require('brace/snippets/javascript')

    require('brace/ext/language_tools')
    require('brace/mode/sh')
    require('brace/mode/json')
    require('brace/mode/matlab')
    require('brace/mode/python')
    require('brace/mode/javascript')
    require('brace/mode/r')
    require('brace/mode/markdown')
    //require('brace/mode/html') //53kb gzipped!
    require('brace/mode/dockerfile')

    require('brace/theme/chrome')

    require('brace/snippets/javascript')

    console.log("setting container style", editor.container);
    editor.container.style.lineHeight = 1.25;
    editor.renderer.updateFontSize();
    if(cb) cb();
}


