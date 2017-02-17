# warehouse

Service that allows data warehousing and workfow orchestration.

It has following components

* Archive (storage systems that items can be physically stored, and database to keep track of where items are)
* Data type (list of various data type tree)
* Application registry (list of various applications (github URL/tags, and reference to data types for all input / output))
* 

## Archiving

This service allows users to

* Search items stored in the warehouse that they have access to (via projects)
* Copy wf/tasks in and out of warehouse (warehouse issues temporary access token which can then be used with cloudstorage-service (or use sca-data?) to transfer data to/from it as part of wf/tasks) * This doesn't allow us to take advantage of s3/bucket mounting.. I need different approach.

## Data Type Transition
