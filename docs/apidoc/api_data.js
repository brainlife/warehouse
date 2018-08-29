define({ "api": [
  {
    "group": "App",
    "type": "delete",
    "url": "/app/:id",
    "title": "Remove registered app (only by the user registered it)",
    "description": "<p>Mark the application as removed</p>",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/controllers/app.js",
    "groupTitle": "App",
    "name": "DeleteAppId"
  },
  {
    "group": "App",
    "type": "get",
    "url": "/app",
    "title": "Query apps",
    "description": "<p>Query registered apps</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Object",
            "optional": true,
            "field": "find",
            "description": "<p>Optional Mongo find query - defaults to {}</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": true,
            "field": "sort",
            "description": "<p>Optional Mongo sort object - defaults to {}</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "select",
            "description": "<p>Fields to load - multiple fields can be entered with %20 as delimiter</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "populate",
            "description": "<p>Relational fields to populate</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "limit",
            "description": "<p>Optional Maximum number of records to return</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "skip",
            "description": "<p>Optional Record offset for pagination</p>"
          }
        ]
      }
    },
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": true,
            "field": "authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "List",
            "description": "<p>of apps (maybe limited / skipped) and total count</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/controllers/app.js",
    "groupTitle": "App",
    "name": "GetApp"
  },
  {
    "group": "App",
    "type": "post",
    "url": "/app",
    "title": "Post App",
    "description": "<p>Register new app (don't set id to null)</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "name",
            "description": "<p>User friendly name for this app</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "desc",
            "description": "<p>Description for this app</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": true,
            "field": "tags",
            "description": "<p>List of tags to classify this app</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "avatar",
            "description": "<p>URL for application avatar</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "github",
            "description": "<p>github id/name for this app</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "retry",
            "description": "<p>Number of time this app should be retried (0 by default)</p>"
          },
          {
            "group": "Parameter",
            "type": "Object[]",
            "optional": true,
            "field": "inputs",
            "description": "<p>Input datatypes. Array of {id, datatype, datatype_tags[]}</p>"
          },
          {
            "group": "Parameter",
            "type": "Object[]",
            "optional": true,
            "field": "outputs",
            "description": "<p>Output datatypes. same as input datatype</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": true,
            "field": "projects",
            "description": "<p>List of project IDs that this app should be exposed in</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "github_branch",
            "description": "<p>Github default branch/tag name</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": true,
            "field": "config",
            "description": "<p>configuration template</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "dockerhub",
            "description": "<p>Dockerhub id/name</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": false,
            "field": "admins",
            "description": "<p>Admin IDs</p>"
          }
        ]
      }
    },
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "App",
            "description": "<p>registered</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/controllers/app.js",
    "groupTitle": "App",
    "name": "PostApp"
  },
  {
    "group": "App",
    "type": "post",
    "url": "/app/:id/rate",
    "title": "Rate app",
    "description": "<p>Rate app in 1-5 scale with given app id</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "rate",
            "description": "<p>1-5</p>"
          }
        ]
      }
    },
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "Aggregated",
            "description": "<p>rating of the app after this update</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/controllers/app.js",
    "groupTitle": "App",
    "name": "PostAppIdRate"
  },
  {
    "group": "App",
    "type": "put",
    "url": "/app/:id",
    "title": "Update App",
    "description": "<p>Update App</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "name",
            "description": "<p>User friendly name for this container</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "desc",
            "description": "<p>Description for this dataset</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": true,
            "field": "tags",
            "description": "<p>List of tags to classify this app</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "avatar",
            "description": "<p>URL for application avatar</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "github",
            "description": "<p>github id/name for this app</p>"
          },
          {
            "group": "Parameter",
            "type": "Object[]",
            "optional": true,
            "field": "inputs",
            "description": "<p>Input datatypes and tags</p>"
          },
          {
            "group": "Parameter",
            "type": "Object[]",
            "optional": true,
            "field": "outputs",
            "description": "<p>Output datatypes and tags</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": true,
            "field": "projects",
            "description": "<p>List of project IDs that this app should be exposed in</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "dockerhub",
            "description": ""
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": true,
            "field": "admins",
            "description": "<p>List of admins (auth sub)</p>"
          }
        ]
      }
    },
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "Updated",
            "description": "<p>App</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/controllers/app.js",
    "groupTitle": "App",
    "name": "PutAppId"
  },
  {
    "group": "Dataset",
    "type": "delete",
    "url": "/dataset/:id",
    "title": "Hide dataset from dataset results",
    "description": "<p>Logically remove dataset by setting &quot;removed&quot; to true</p>",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/controllers/dataset.js",
    "groupTitle": "Dataset",
    "name": "DeleteDatasetId"
  },
  {
    "group": "Dataset",
    "type": "get",
    "url": "/app/bibtex/:id",
    "title": "Download BibTex JSON for BrainLife Application",
    "description": "<p>Output BibTex JSON content for specified application ID</p>",
    "version": "0.0.0",
    "filename": "api/controllers/app.js",
    "groupTitle": "Dataset",
    "name": "GetAppBibtexId"
  },
  {
    "group": "Dataset",
    "type": "get",
    "url": "/dataset",
    "title": "Query Datasets",
    "description": "<p>Returns all dataset entries accessible to the user</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Object",
            "optional": true,
            "field": "find",
            "description": "<p>Optional Mongo query to perform (you need to JSON.stringify)</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": true,
            "field": "sort",
            "description": "<p>Mongo sort object - defaults to _id. Enter in string format like &quot;-name%20desc&quot;</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "select",
            "description": "<p>Fields to load - multiple fields can be entered with %20 as delimiter (default all)</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": true,
            "field": "datatype_tags",
            "description": "<p>List of datatype tags to filter (you can use exlusion tags also)</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "limit",
            "description": "<p>Maximum number of records to return - defaults to 100</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "skip",
            "description": "<p>Record offset for pagination (default to 0)</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "populate",
            "description": "<p>Fields to populate - default to &quot;project datatype&quot;</p>"
          }
        ]
      }
    },
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "List",
            "description": "<p>of datasets (maybe limited / skipped) and total count</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/controllers/dataset.js",
    "groupTitle": "Dataset",
    "name": "GetDataset"
  },
  {
    "group": "Dataset",
    "type": "get",
    "url": "/dataset/distinct",
    "title": "Query distinct values",
    "description": "<p>Returns all dataset entries accessible to the user has access</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "distinct",
            "description": "<p>A field to pull distinct values (can't do multiple)</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": true,
            "field": "find",
            "description": "<p>Optional Mongo query to perform (you need to JSON.stringify)</p>"
          }
        ]
      }
    },
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "List",
            "description": "<p>of distinct values</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/controllers/dataset.js",
    "groupTitle": "Dataset",
    "name": "GetDatasetDistinct"
  },
  {
    "group": "Dataset",
    "type": "get",
    "url": "/dataset/download/:id",
    "title": "Download .tar.gz from dataset archive",
    "description": "<p>Allows user to download any files from user's resource</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "at",
            "description": "<p>JWT token - if user can't provide it via authentication header</p>"
          }
        ]
      }
    },
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": true,
            "field": "authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/controllers/dataset.js",
    "groupTitle": "Dataset",
    "name": "GetDatasetDownloadId"
  },
  {
    "group": "Dataset",
    "type": "get",
    "url": "/dataset/download/safe/:id",
    "title": "Download .tar.gz from dataset archive",
    "description": "<p>Allows user to download any files from user's resource</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "at",
            "description": "<p>Token generated by this service via /dataset/token with scopes with list of dataset IDs</p>"
          }
        ]
      }
    },
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": true,
            "field": "authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/controllers/dataset.js",
    "groupTitle": "Dataset",
    "name": "GetDatasetDownloadSafeId"
  },
  {
    "group": "Dataset",
    "type": "get",
    "url": "/dataset/inventory",
    "title": "",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Object",
            "optional": true,
            "field": "find",
            "description": "<p>Optional Mongo query to perform (you need to JSON.stringify) Get counts of unique subject/datatype/datatype_tags.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "Object",
            "description": "<p>containing counts</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/controllers/dataset.js",
    "groupTitle": "Dataset",
    "name": "GetDatasetInventory"
  },
  {
    "group": "Dataset",
    "type": "get",
    "url": "/dataset/prov/:id",
    "title": "Get provenance",
    "description": "<p>Get provenance graph info</p>",
    "version": "0.0.0",
    "filename": "api/controllers/dataset.js",
    "groupTitle": "Dataset",
    "name": "GetDatasetProvId"
  },
  {
    "group": "Dataset",
    "type": "post",
    "url": "/dataset",
    "title": "Create new dataset from wf service task",
    "description": "<p>Make a request to create a new dataset from wf service taskdir</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "project",
            "description": "<p>Project ID used to store this dataset under</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "task_id",
            "description": "<p>WF service Task ID (of output task)</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "output_id",
            "description": "<p>App's output_id that generated this dataset</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "subdir",
            "description": "<p>Subdirectory where all files are actually stored under the task output</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "datatype",
            "description": "<p>Data type ID for this dataset (from Datatypes)</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": false,
            "field": "datatype_tags",
            "description": "<p>Datatype tags to set</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": true,
            "field": "files",
            "description": "<p>File mapping to override default file path given by datatype</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": true,
            "field": "meta",
            "description": "<p>Metadata - as prescribed in datatype.meta</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "desc",
            "description": "<p>Description for this crate</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": true,
            "field": "tags",
            "description": "<p>List of tags associated with this dataset</p>"
          }
        ]
      }
    },
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "Dataset",
            "description": "<p>created</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/controllers/dataset.js",
    "groupTitle": "Dataset",
    "name": "PostDataset"
  },
  {
    "group": "Dataset",
    "type": "post",
    "url": "/dataset/token",
    "title": "Generate dataset access token",
    "description": "<p>Issues warehouse jwt token that grants access to specified dataset IDs that user has access to</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": false,
            "field": "ids",
            "description": "<p>List of dataset IDs to grant access</p>"
          }
        ]
      }
    },
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "Object",
            "description": "<p>containing jwt: key</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/controllers/dataset.js",
    "groupTitle": "Dataset",
    "name": "PostDatasetToken"
  },
  {
    "group": "Dataset",
    "type": "put",
    "url": "/dataset/:id",
    "title": "Update Dataset",
    "description": "<p>Update Dataset</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "desc",
            "description": "<p>Description for this dataset</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": true,
            "field": "tags",
            "description": "<p>List of tags to classify this dataset</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": true,
            "field": "meta",
            "description": "<p>Metadata</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": true,
            "field": "admins",
            "description": "<p>List of new admins (auth sub)</p>"
          }
        ]
      }
    },
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "Updated",
            "description": "<p>Dataset</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/controllers/dataset.js",
    "groupTitle": "Dataset",
    "name": "PutDatasetId"
  },
  {
    "group": "Datatype",
    "type": "get",
    "url": "/datatype",
    "title": "Query Datatype",
    "description": "<p>Returns all datatypes that matches user query</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Object",
            "optional": true,
            "field": "find",
            "description": "<p>Optional Mongo query to perform (you need to JSON.stringify)</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": true,
            "field": "sort",
            "description": "<p>Mongo sort object - defaults to _id. Enter in string format like &quot;-name%20desc&quot;</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "select",
            "description": "<p>Fields to load - multiple fields can be entered with %20 as delimiter</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "limit",
            "description": "<p>Maximum number of records to return - defaults to 100</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "skip",
            "description": "<p>Record offset for pagination (default to 0)</p>"
          }
        ]
      }
    },
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "List",
            "description": "<p>of datatypes (maybe limited / skipped) and total count</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/controllers/datatype.js",
    "groupTitle": "Datatype",
    "name": "GetDatatype"
  },
  {
    "group": "Pipeline_Rules",
    "type": "delete",
    "url": "/rule/:id",
    "title": "Set rule's removed flag to true",
    "description": "<p>Logically remove dataset by setting &quot;removed&quot; to true</p>",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/controllers/rule.js",
    "groupTitle": "Pipeline_Rules",
    "name": "DeleteRuleId"
  },
  {
    "group": "Pipeline_Rules",
    "type": "get",
    "url": "/rule",
    "title": "Query pipeline rules",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Object",
            "optional": true,
            "field": "find",
            "description": "<p>Optional Mongo find query - defaults to {}</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": true,
            "field": "sort",
            "description": "<p>Optional Mongo sort object - defaults to {}</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "select",
            "description": "<p>Fields to load - multiple fields can be entered with %20 as delimiter</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "populate",
            "description": "<p>Relational fields to populate</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "limit",
            "description": "<p>Optional Maximum number of records to return - defaults to 0(no limit)</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "skip",
            "description": "<p>Optional Record offset for pagination</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "List",
            "description": "<p>of rules (maybe limited / skipped) and total count</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/controllers/rule.js",
    "groupTitle": "Pipeline_Rules",
    "name": "GetRule"
  },
  {
    "group": "Pipeline_Rules",
    "type": "get",
    "url": "/rule/log/:ruleid",
    "title": "Get the latest rule execution log",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "optional": false,
            "field": "String",
            "description": "<p>Return string containing the entire log</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/controllers/rule.js",
    "groupTitle": "Pipeline_Rules",
    "name": "GetRuleLogRuleid"
  },
  {
    "group": "Pipeline_Rules",
    "type": "post",
    "url": "/rule/:pubid",
    "title": "Register new rule",
    "description": "<p>Register a new pipeline rule.</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>Rule name</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "desc",
            "description": "<p>Rule description</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "project",
            "description": "<p>Project ID</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": false,
            "field": "input_tags",
            "description": "<p>Input Tags</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": false,
            "field": "output_tags",
            "description": "<p>Output Tags</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": false,
            "field": "input_project_override",
            "description": "<p>Input project override</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "app",
            "description": "<p>Application ID</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "subject_match",
            "description": "<p>Subject Match</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": false,
            "field": "config",
            "description": "<p>Application configuration</p>"
          }
        ]
      }
    },
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "Created",
            "description": "<p>rule object</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/controllers/rule.js",
    "groupTitle": "Pipeline_Rules",
    "name": "PostRulePubid"
  },
  {
    "group": "Pipeline_Rules",
    "type": "put",
    "url": "/rule/:pubid",
    "title": "Update Rule",
    "description": "<p>Update pipeline rule</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>Rule name</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "desc",
            "description": "<p>Rule description</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "project",
            "description": "<p>Project ID</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": false,
            "field": "input_tags",
            "description": "<p>Input Tags</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": false,
            "field": "output_tags",
            "description": "<p>Output Tags</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": false,
            "field": "input_project_override",
            "description": "<p>Input project override</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "app",
            "description": "<p>Application ID</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "subject_match",
            "description": "<p>Subject Match</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": false,
            "field": "config",
            "description": "<p>Application configuration</p>"
          },
          {
            "group": "Parameter",
            "type": "Boolean",
            "optional": false,
            "field": "removed",
            "description": "<p>If this is a removed publication</p>"
          }
        ]
      }
    },
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "Updated",
            "description": "<p>Rule</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/controllers/rule.js",
    "groupTitle": "Pipeline_Rules",
    "name": "PutRulePubid"
  },
  {
    "group": "Project",
    "type": "delete",
    "url": "/project/:id",
    "title": "Hide project",
    "description": "<p>Logically remove project by setting &quot;removed&quot; to true</p>",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/controllers/project.js",
    "groupTitle": "Project",
    "name": "DeleteProjectId"
  },
  {
    "group": "Project",
    "type": "get",
    "url": "/project",
    "title": "Query projects",
    "description": "<p>Query projects registered</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Object",
            "optional": true,
            "field": "find",
            "description": "<p>Optional Mongo find query - defaults to {}</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": true,
            "field": "sort",
            "description": "<p>Optional Mongo sort object - defaults to {}</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "select",
            "description": "<p>Fields to load - multiple fields can be entered with %20 as delimiter</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "limit",
            "description": "<p>Optional Maximum number of records to return - defaults to 0(no limit)</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "skip",
            "description": "<p>Optional Record offset for pagination</p>"
          }
        ]
      }
    },
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "List",
            "description": "<p>of projects (maybe limited / skipped) and total count</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/controllers/project.js",
    "groupTitle": "Project",
    "name": "GetProject"
  },
  {
    "group": "Project",
    "type": "post",
    "url": "/project",
    "title": "Post Project",
    "description": "<p>Register new project</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "access",
            "description": "<p>&quot;public&quot; or &quot;private&quot;</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "name",
            "description": "<p>User friendly name for this container</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "desc",
            "description": "<p>Description for this dataset</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "readme",
            "description": "<p>Markdown content describing this project</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": false,
            "field": "admins",
            "description": "<p>Admin IDs</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": false,
            "field": "members",
            "description": "<p>Members</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": false,
            "field": "guests",
            "description": "<p>Guest Members</p>"
          }
        ]
      }
    },
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "Project",
            "description": "<p>record registered</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/controllers/project.js",
    "groupTitle": "Project",
    "name": "PostProject"
  },
  {
    "group": "Project",
    "type": "put",
    "url": "/project/:id",
    "title": "",
    "description": "<p>Update project</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "access",
            "description": "<p>&quot;public&quot; or &quot;private&quot;</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "name",
            "description": "<p>User friendly name for this container</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "desc",
            "description": "<p>Description for this dataset</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "readme",
            "description": "<p>Markdown content describing this project</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": true,
            "field": "admins",
            "description": "<p>List of admins (auth sub)</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": true,
            "field": "members",
            "description": "<p>List of admins (auth sub)</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": true,
            "field": "guests",
            "description": "<p>List of guest users (auth sub)</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": true,
            "field": "agreemenets",
            "description": "<p>List of data access agreemenets that user must check</p>"
          }
        ]
      }
    },
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "Project",
            "description": "<p>object updated</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/controllers/project.js",
    "groupTitle": "Project",
    "name": "PutProjectId"
  },
  {
    "group": "Publications",
    "type": "get",
    "url": "/pub",
    "title": "Query registered publications (public)",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Object",
            "optional": true,
            "field": "find",
            "description": "<p>Optional Mongo find query - defaults to {}</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": true,
            "field": "sort",
            "description": "<p>Optional Mongo sort object - defaults to {}</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "select",
            "description": "<p>Fields to load - multiple fields can be entered with %20 as delimiter</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "populate",
            "description": "<p>Relational fields to populate</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "limit",
            "description": "<p>Optional Maximum number of records to return - defaults to 0(no limit)</p>"
          },
          {
            "group": "Parameter",
            "type": "Boolean",
            "optional": true,
            "field": "deref_contacts",
            "description": "<p>Authors/ contributors are populated with (auth profile)</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "skip",
            "description": "<p>Optional Record offset for pagination</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "List",
            "description": "<p>of publications (maybe limited / skipped) and total count.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/controllers/pub.js",
    "groupTitle": "Publications",
    "name": "GetPub"
  },
  {
    "group": "Publications",
    "type": "get",
    "url": "/pub/apps/:pubid",
    "title": "Enumerate applications used to generate datasets",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "Application",
            "description": "<p>objects</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/controllers/pub.js",
    "groupTitle": "Publications",
    "name": "GetPubAppsPubid"
  },
  {
    "group": "Publications",
    "type": "get",
    "url": "/pub/datasets-inventory/:pubid Get counts of unique subject/datatype/datatype_tags. You can then use /pub/datasets/:pubid to",
    "title": "get the actual list of datasets for each subject / datatypes / etc..",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "Object",
            "description": "<p>containing counts</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/controllers/pub.js",
    "groupTitle": "Publications",
    "name": "GetPubDatasetsInventoryPubidGetCountsOfUniqueSubjectDatatypeDatatype_tagsYouCanThenUsePubDatasetsPubidTo"
  },
  {
    "group": "Publications",
    "type": "get",
    "url": "/pub/datasets/:pubid",
    "title": "Query published datasets",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Object",
            "optional": true,
            "field": "find",
            "description": "<p>Optional Mongo find query - defaults to {}</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": true,
            "field": "sort",
            "description": "<p>Optional Mongo sort object - defaults to {}</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "select",
            "description": "<p>Fields to load - multiple fields can be entered with %20 as delimiter</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "populate",
            "description": "<p>Relational fields to populate</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "limit",
            "description": "<p>Optional Maximum number of records to return - defaults to 0(no limit)</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "skip",
            "description": "<p>Optional Record offset for pagination</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "List",
            "description": "<p>of dataasets (maybe limited / skipped) and total count</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/controllers/pub.js",
    "groupTitle": "Publications",
    "name": "GetPubDatasetsPubid"
  },
  {
    "group": "Publications",
    "type": "post",
    "url": "/pub",
    "title": "Register new publication",
    "description": "<p>Create new publication record. You have to register datasets via another API</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "project",
            "description": "<p>Project ID associated with this publication</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "license",
            "description": "<p>License used for this publication</p>"
          },
          {
            "group": "Parameter",
            "type": "Object[]",
            "optional": false,
            "field": "fundings",
            "description": "<p>Array of {funder, id}</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": false,
            "field": "authors",
            "description": "<p>List of author IDs.</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": false,
            "field": "contributors",
            "description": "<p>List of contributor IDs.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>Publication title</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "desc",
            "description": "<p>Publication desc (short summary)</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "readme",
            "description": "<p>Publication detail (paper abstract)</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": false,
            "field": "tags",
            "description": "<p>Publication tags</p>"
          },
          {
            "group": "Parameter",
            "type": "Boolean",
            "optional": false,
            "field": "removed",
            "description": "<p>If this is a removed publication</p>"
          }
        ]
      }
    },
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "Publication",
            "description": "<p>record created</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/controllers/pub.js",
    "groupTitle": "Publications",
    "name": "PostPub"
  },
  {
    "group": "Publications",
    "type": "put",
    "url": "/pub/:pubid",
    "title": "Update Publication",
    "description": "<p>Update Publication</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "license",
            "description": "<p>License used for this publication</p>"
          },
          {
            "group": "Parameter",
            "type": "Object[]",
            "optional": false,
            "field": "fundings",
            "description": "<p>Array of {funder, id}</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": false,
            "field": "authors",
            "description": "<p>List of author IDs.</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": false,
            "field": "contributors",
            "description": "<p>List of contributor IDs.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>Publication title</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "desc",
            "description": "<p>Publication desc (short summary)</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "readme",
            "description": "<p>Publication detail (paper abstract)</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": false,
            "field": "tags",
            "description": "<p>Publication tags</p>"
          },
          {
            "group": "Parameter",
            "type": "Boolean",
            "optional": false,
            "field": "removed",
            "description": "<p>If this is a removed publication</p>"
          }
        ]
      }
    },
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "Updated",
            "description": "<p>Publication</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/controllers/pub.js",
    "groupTitle": "Publications",
    "name": "PutPubPubid"
  },
  {
    "group": "Publications",
    "type": "put",
    "url": "/pub/:pubid/datasets",
    "title": "",
    "description": "<p>Publish datasets</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Object",
            "optional": true,
            "field": "find",
            "description": "<p>Mongo query to subset datasets (all datasets in the project by default)</p>"
          }
        ]
      }
    },
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "Number",
            "description": "<p>of published datasets, etc..</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/controllers/pub.js",
    "groupTitle": "Publications",
    "name": "PutPubPubidDatasets"
  },
  {
    "group": "Publications",
    "type": "put",
    "url": "/pub/:pubid/doi",
    "title": "",
    "description": "<p>Issue DOI for publication record (or update URL)</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "url",
            "description": "<p>URL to associate the minted DOI</p>"
          }
        ]
      }
    },
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "authorization",
            "description": "<p>A valid JWT token &quot;Bearer: xxxxx&quot;</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "Publication",
            "description": "<p>object with doi field</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "api/controllers/pub.js",
    "groupTitle": "Publications",
    "name": "PutPubPubidDoi"
  }
] });
