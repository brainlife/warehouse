function removeUndefinedOrNullProperties(obj) {
    for(let key in obj) {
        if(obj[key] === undefined || obj[key] === null) delete obj[key];
    }
    return obj;
}

function composeOutputTag(ruleName) {
    let tag = ruleName||new Date().toLocaleDateString();
    tag = tag.toLowerCase().replace(/\W/g, '_');
    return tag;
};

function getEmptyIOConfigObj() {
    return {
        // app tab stuff
        config: {},

        // input tab stuff
        subject_match: "", 
        session_match: "", 
        extra_datatype_tags: {},
        input_selection: {},
        input_multicount: {},
        input_project_override: {},
        input_subject: {},
        input_session: {},
        input_tags: {},
        input_dataset_tags: {},

        // output tab stuff
        output_tags: {}, 
        archive: {},
    }
}

// TODO: in the future, we will want to support many more pipelines. What
// is a better implementation of this?
const SUPPORTED_PIPELINES = {
    DWI: [
        "5dc1c2e57f55b85a93bd3021", //QSIPrep
        "5e9dced9f1745d6994f692c0", //MRTrix3
        "5fe1056057aacd480f2f8e48", // FreeSurfer
        "5cc73ef44ed9df00317f6288", // White Matter Anatomy Segmentation
        "5cc9eca04b5e4502275edba6", // Remove Tract Outliers
        "5ed02b780a8ed88a57482c92" // Tract Analysis Profiles
    ]
}

export {
    removeUndefinedOrNullProperties,
    composeOutputTag,
    getEmptyIOConfigObj,
    SUPPORTED_PIPELINES
}