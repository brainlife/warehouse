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

Git clone the repository where you will be developing and running your app to test.

```
git clone git@github.com:soichih/app-test.git
```

Now, create a file named `main` which is used to run your app by Brain-Life. You can also run this to test your application.

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

Following part in `main` instructs PBS (or slurm job manager) to request certain number of nodes / process-per-node. It's not necessary if you are not planning to run your app via PBS scheduler.

```
#PBS -l nodes=1:ppn=1
#PBS -l walltime=00:05:00
```

You can receive input parameters from Brain-Life through a JSON file called `config.json` which is created by Brain-Life when the app is executed through Brain-Life. 

Following lines parses the `config.json` using a command line tool called `jq` and pass it to the main part of the application `main.py`.

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

Any output files from your app should be written to the current directory. Please be sure to add it to .gitignore so that it won't be part of your git repo.

> Instead of using `jq` command to parse `config.json` in `main`, you can use python's json parsing library inside `main.py` if you prefer.

Now, you can test run your app simply by executing `main`

```
./main
...
```

Congratulations! You just created your first Brain-Life app! You can now commit all files and push to your github repo.

```
git add .
git commit -m"initial import"
git push
```

To summarize, Brain-Life app has following characteristics.

* Published in Github.
* It has `main` which starts the app.
* It reads input parameters from `config.json`.
* It writes output files on the current directory.







