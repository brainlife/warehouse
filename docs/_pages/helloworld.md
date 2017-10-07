---
layout: single
title: Writing HelloWorld App
permalink: /helloworld
sidebar:
  nav: "docs"
---

Let's begin by creating a brand new github repository. 

TODO> https://github.com/new

Please be sure to make the repository public so that Brain-Life can download your app.

Git clone the repository where you will be developing and running the application to test.

```
git clone git@github.com:soichih/app-test.git
```

Now, create a file named `main` which is used to run your application by Brain-Life. You can also run this to test your application.

```
#!/bin/bash

#PBS -l nodes=1:ppn=1
#PBS -l walltime=00:05:00

#parse config.json for input parameters
t1=$(jq -r .t1 config.json)
./main.py $t1

```

Please be sure to set the executable bit.

```
chmod +x main
```

Following part in `main` instruct PBS and/or slurm job manager to request certain number of nodes / process-per-node. 

```
#PBS -l nodes=1:ppn=1
#PBS -l walltime=00:05:00
```

You can receive input parameters from Brain-Life through a JSON file called `config.json` which is created by Brain-Life at runtime. Following lines parses the `config.json` using a command line tool called `jq` and pass it to the main part of the application `main.py`.

```
#parse config.json for input parameters
t1=$(jq -r .t1 config.json)
./main.py $t1
```

To be able to test your application, let's create a test `config.json`.

```
{
   "t1": "/somewhere/t1.nii.gz"
}
```

You should add this file to .gitignore since it is only used locally on your machine to test your app.

Finally, the `main` runs a python script called `main.py`. Let's create it.

```
#!/usr/bin/env python

import sys
import dipy.tracking as dipytracking
dipytracking.bench()

t1=sys.argv[1]
print(t1)

f = open("output.txt", "w")
f.write("hello world")
f.close()
```

> Instead of using `jq` command to parse `config.json` inside `main`, you can use python's json parsing library (`json.loads()`) inside `main.py`.



