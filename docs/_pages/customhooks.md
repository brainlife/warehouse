---
layout: single
title: Customizing Lifecycle Hooks
permalink: /customhooks
sidebar:
  nav: "docs"
---

Life cycles hooks are the script used to start / stop / monitor your apps by Brain-Life. By default, it looks for executable installed on each resource in the PATH with named `start`, `status`, and `stop`. Resource owner needs to make sure these scripts are installed and accessible by your apps. 

> For most PBS, SLURM, and vanila VM, resource owner can install [ABCD default hooks](https://github.com/brain-life/abcd-spec/tree/master/hooks).

By default, `start` hook should look for a file named `main` to start your app. Therefore, the only file required to make your app runnable by Brain-Life is this `main` executable on the root directory of the app's git repository. 

Under most circumstances, app developers shouldn't have to worry about these hook scripts. However, if your app requires some special mechanism to start / stop and monitor your app, you might need to provide your own hook scripts. 

You can specify the paths to these hook scripts by creating a file named `package.json`

```json
{
  "brainlife": {
    "start": "./start.sh",
    "stop": "./stop.sh",
    "status": "./status.sh"
  }
}
```

Then, you will need to provide those hook scripts as part of your app.

> Please be sure to `chmod +x *.sh` so that your hook scripts are executable.

### `start.sh`

Following example script instructs qsub to use preempt queue on HPC cluster Karst, but submit normally on all other clusters. 

```
#!/bin/bash

#return code 0 = job started successfully.
#return code non-0 = job failed to start

#make sure finished doesn't exist so that user can rerun the job
rm -f finished

if [ $HPC == "KARST" ]; then
  qsub -q preempt main > jobid
else
  qsub main > jobid
fi
```

### `stop.sh`

Following example script takes the jobid stored in a file named `jobid` and call qdel to stop it.

```
#!/bin/bash
qdel `cat jobid`
```

### `status.sh`

status hook is a bit more complicated. It needs to return various exit codes based on the status of the app. Anything you output to stdout will be used to set task's status message. For example, you can output the last line from the log file to relay the last log entry to the users on Brain-Life.

Following example script relies on your app to write out a file named `finished` with exit code when it finishes executing. First it checks for this file, and if it exists, it assumes that app has either finished successfully or failed. 

If `finished` file does not exist, then it assumes that it's still running, so it uses cluster's job querying command to check for its status. If it is indeed running, then tail the last line from the stdout log which is then sent to Brain-Life as status message for the task.

```
#!/bin/bash

#return code 0 = running
#return code 1 = finished successfully
#return code 2 = failed
#return code 3 = unknown

if [ -f finished ]; then
    code=`cat finished`
    if [ $code -eq 0 ]; then
        echo "finished successfully"
        exit 1
    else
        echo "finished with code:$code"
        exit 2
    fi
fi

if [ -f jobid ]; then
    jobid=`cat jobid`
    if [ -z $jobid ]; then
        echo "jobid is empty.. failed to submit?"
        exit 3 
    fi
    jobstate=`qstat -f $jobid | grep job_state | cut -b17`
    if [ -z $jobstate ]; then
        echo "Job removed before completing - maybe timed out?" 
        exit 2
    fi
    if [ $jobstate == "Q" ]; then
        echo "Waiting in the queue"
        showstart $jobid | grep start
        exit 0
    fi
    if [ $jobstate == "R" ]; then
        subid=$(cat jobid | cut -d '.' -f 1)
        logname="stdout.$subid.*.log"
        tail -1 $logname
        exit 0
    fi
    if [ $jobstate == "H" ]; then
        echo "Job held.. waiting"
        exit 0 ication to 

    fi

    #assume failed for all other state
    echo "Jobs failed - PBS job state: $jobstate"
    exit 2
fi

echo "can't determine the status - maybe not yet started?"
exit 3
```

