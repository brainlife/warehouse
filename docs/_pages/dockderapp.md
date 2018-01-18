---
layout: single
title: Dockerizing App
permalink: /dockerapp
sidebar:
  nav: "docs"
comments: true
---

This document describes steps to dockerize your MatLab and Python applications using the MatLab/Python compiler as an intermediate step. 

To build docker container, you will need docker engine. We recommend [installing Docker on your machine](https://docs.docker.com/machine/install-machine/) and do the following on the same machine.

## Git Repo

Make sure that your application is hosted on Github. Ideally, you should publish Brain-Life Apps at [Brain-Life](www.github.com/brain-life/), but you can also use your personal account or a different organization. All following steps assumes that you are making changes inside a cloned git repo on a machine on which you can gain root access, this is required by [Docker](https://docs.docker.com/engine/security/security/).

## config.json

Your application should read configuration from config.json in a local (working) directory. Here is an example of a sample config.json (https://github.com/brain-life/app-dipy-tracking/blob/master/config.json.template)

In Matlab, you can do something like following to read json
```
addpath(genpath('/N/u/hayashis/BigRed2/git/jsonlab'))
config = loadjson('config.json');
disp(config.some.param);
```

In Python, you can do something like the following to read json
```
import json
with open('config.json') as config_json:
    config = json.load(config_json)

# Load the data
print(config['data_file'])
```

jsonlab comes from `https://github.com/fangq/jsonlab.git`

Input parameter should include paths to various input files, or command line parameters passed to various sub-processes. By using config.json, it makes it easier to run it via Docker. (It also prepares your application to be more [ABCD Specification](https://github.com/soichih/abcd-spec) compatible.)

All input parameters are assumed to be text (char). You need to write your functions that are going to be MATLAB compiled with all the arguments as text. Arguments passing a number need to be given as text and within the function converted to integers values (str2num(), etc.). 

## Output files

Your application should generate any output to current working directory `pwd` (But you can organize your output files by creating a sub-directories inside your current working directory).

## Compile Matlab

All Matlab scripts need to be compiled to a binary format using the [`mcc` MatLab command](https://www.mathworks.com/help/compiler/mcc.html). The easiest way to do this is to run something like commands below inside MatLab. We suggest that before you do this you test your brain-life application in MatLab. Below we provide one example compiling a standalone only using MatLab files (first example) and one also adding other files, such as MEX files (second example).

```
mkdir msa
mcc -m main -R -nodisplay -d msa
```

```
mkdir msa
mcc -m main -R -nodisplay  -a /N/u/hayashis/BigRed2/git/encode/mexfiles -d msa
```

* `-m ...` tells the name of the main entry function (in this case it's `main`) of your application (it reads your config.json and runs the whole application)
* `-R -nodisplay` sets the command line options you'd normally pass when you run MatLab on the command line.
* `-a ...` is used to *add* non-matlab files as part of the executable so that your executable can find it at runtime.
* -d ...` tells where to output the generated binary. You should avoid writing it out to the application root directory; mcc generates a lot of files

* You can use OpenMP to parallelize your application for Docker.
* mcc compiled application can't run certain Matlab statements; like addpath(). You might need to create a stripped down version of the main function that does not include those statements (or wrap them inside a if statement that gets executed only when you run it). To add paths, run the addpath commands prior to compiling the application, the compiler will then add all necessary dependencies. If you have a startup.m file you may want to rename it while compiling.

If you don't have MatLab installed on your machine, then you should first checkout your repo on a directory accessible via Karst desktop, then run mcc on Matlab on Karst desktop. Then commit and `git push` the ./msa directory, go back to your machine and do `git pull` locally.

## Loading an ENCODE fe structure from an mcc application

If you are writing a function that will load a fe structure containing a sparse tensor array created by ENCODE, you need to add the following decorator above the load function:

`%# function sptensor`

This lets the compiler know it should include the sptensor class, which `load()` does not use by default. If you do not include this, a warning will occur when you run the function stating the sptensor class was not found and it will load as an empty field. 

## Create a bash script to run your app

Unless your application sorely consists of matlab, you may want to create another bash script which will do any pre(/post)processing of the data. For example:

[docker.sh]
```bash
#!/bin/bash
./preprocess.sh #run some things (need to parse config.json using command line tool like jq)
./mca/main #then execute matlab binary
```

## Create Dockerfile (MatLab)

Before you start working on Dockerfile, make sure you are already familiar with the basic concepts of Docker and [how to build docker container](https://docs.docker.com/engine/reference/builder/). 

All Docker containers have a base-container. This base is used to derive all other containers. If your application uses Matlab, then I recommend using[the Brain-Life Docker Container](https://hub.docker.com/r/brainlife/mcr/). Alternatively, you could also use a more general OS container such as a Ubuntu, CentOS. The [neurodebian container](https://store.docker.com/images/63dbd2e1-f29e-498b-8b16-1477770ae733?tab=description) is a good alternative.

On this example, I am going to use [the LiFE Docker Container](https://github.com/brain-life/app-life/blob/master/Dockerfile) as a template (this was compiled using MCR:2016a on Ubuntu Linux compatible with NeuroDebian), but we are going to [app-dtiinit](https://github.com/brain-life/app-dtiinit) as an example to build a Docker container. To start:

1. cd into your local app-dtiinit folder (this folder should have the main file). 
2. copy the Dockerfile from [online](https://github.com/brain-life/app-life/blob/master/Dockerfile) into the current directory.
3. Open the `Dockerfile` and add the following lines, which will add a series of Docker commands: 
   1. Set the Docker base image and maintainer.
   ```
   FROM brainlife/mcr:R2016a
   MAINTAINER Your Name <youremail@iu.edu>
   ```
   2. Add dependencies. 
   This app requires the external, package FSL  to add this dependency we will the following lines to the Dockerfile.

   ```
   RUN sudo apt-get install fsl-complete
   ```
   3. Add the app-dtiinit to the Docker. 
   We want to put the entire content of you git repository (in our example because we have some MatLab code, the repository has been previously made into a standalone executable and compiled and the compiled version is under app-dtiinit/msa) on to this container somewhere. I am going to put it under /app.
   ```
   ADD . /app
   ```

   4. Lastly, need to specify the output directory to use
   ```
   RUN mkdir /output
   WORKDIR /output
   ```

   5. Then set the entry point of your application
   ```
   ENTRYPOINT ["/app/docker.sh"]
   ```

3b. Prepare for your container to be run under singularity. Singularity allows users to run your container where they don't have root access (or docker engine access). One issue with running Docker container under singularity is that, often dynamically linked libraries creates symlinks under /usr/lib64 directory when they are first executed. (TODO - explain why this fails under singularity). To setup all necessary symlinks before singularity executes the container, run ldconfig at the end of your Dockerfile

   ```
   RUN ldconfig
   ```

   For more information about singularity, please see http://singularity.lbl.gov/docs-docker#best-practices

4. Now, create a sample config.json on your current directory to be used..

[config.json]
```
{
   "some": "param",
   "another": 123,
   "input": "/input/somefile.nii.gz"
}
```

5. Build the container (make sure to name it something like `-t brainlife/someapp`), 

```
docker build -t brainlife/check.
```

6. Then run it to test it

```
docker run --rm -it \
        -v /host/input:/input \
        -v `pwd`:/output \
        brainlife/yourapp
```

7 (optional). You can also save the above two commands into separate .sh files for ease of access. 

```
vim run_docker.sh
(copy and paste into run_docker.sh
docker run --rm -it \
        -v /host/input:/input \
        -v `pwd`:/output \
        brainlife/yourapp)
./run_docker.sh
```

Do something similar for building the container into its own build.sh file.

## Create DockerFile (Python)
There are a few differences between the Matlab and Python versions of DockerFile. Namely the version and dependencies. While the Matlab one will show how to create one from an existing DockerFile, this part will show how to create a DockerFile from scratch. Please remember to install Docker before continuing.

1. In the folder of your Brain-Life application. Create a file called DockerFile.

```
vim Dockerfile
```

2. In the DockerFile, set the OS and version of Python you would like to use.

```
FROM ubuntu:16.04 (or whatever OS fits your fancy)
FROM python:2
```

3. Now install the dependencies your application requires.

To install pip and git, which you would most likely want to do, add the following to your DockerFile.

```
RUN apt-get update && apt-get install -y python-pip git
```

To pip install your dependencies add the following command:

```
RUN pip install numpy Cython your-other-dependencies
```

To git clone a repository and install from there add the following

```
RUN git clone the git url of the repository /rep-name
RUN cd /rep-name && python setup.py build_ext --inplace
```

4. Now we need to make a folder for adding our main python files. The DockerFile will run your applications from here.

```
RUN mkdir /app
COPY main.py /app
COPY another necessary .py file /app
```

Copy all necessary python files into the app folder.

5. We will now create a folder for the output of your application.

```
RUN mkdir /output
WORKDIR /output
```

If you want to test your application locally, make sure you have your **local** config.json file in the output folder.

6. If you did any git clones and install from the setup.py in there make sure you also set the PYTHONPATH like so

If you installed everything from pip, you may skip this step.
```
ENV PYTHONPATH /my-git-repo:$PYTHONPATH
```

7. Finally, we add the last line to finish up our DockerFile.

```
CMD /app/main.py
```

Congratulations! You wrote the DockerFile! You can see a full example here: "add example here Aman"

## Building and running your container

1. Build the container (make sure to name it something like `-t brainlife/someapp`), 

```
docker build -t brainlife/check .
```

2. Then run it to test it

```
docker run --rm -it \
        -v /host/input:/input \
        -v `pwd`:/output \
        brainlife/yourapp
```

3 (optional). You can also save the above two commands into separate .sh files for ease of access. 

run_docker.sh
```
docker run --rm -it \
        -v /host/input:/input \
        -v `pwd`:/output \
        brainlife/yourapp
```

Do something similar for building the container into its own build.sh file.

```
vim run_docker.sh
(copy and paste into build.sh)
docker build -t brainlife/check.
./build.sh (to run)
```

You only need to run the build once, unless you change something in your DockerFile. Otherwise you can directly run with the command or with run_docker.sh.

You will also probably need to give your run_docker.sh and build.sh permissions.

```
chmod +x build.sh run_docker.sh
```


## README

Once you know that your container works, you should push your container to docker hub and update the README of your git repo to include instructions on how to run your container.

## Examples

Matlab App Exmple 

* [github brain-life/app-life](https://github.com/brain-life/app-life)
* [dockerhub brainlife/life](https://hub.docker.com/r/brainlife/life/) (Dockerhub Autobuild)

Dipy (python) App Example

* [github brain-life/app-dipy-workflows](https://github.com/brain-life/app-dipy-workflows)


