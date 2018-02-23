---
layout: single
title: Registering Resource
permalink: /resource
sidebar:
  nav: "docs"
comments: true
---

## Background

Brainlife provides various shared compute resources to all users by default where you can submit registered apps without having to register your own.
Shared resources are, as the name suggests, shared by all users, so sometimes you have to wait on the queue longer for requested tasks to get executed, you can not control its environment, and we do not recommend any sensitive data through shared resources due to a risk of unauthorized users (accidentally) accessing your datasets.

Brainlife allows you to register your own compute resources for use cases such as following.

1. You have access to your own HPC resource where only you have an exclusive access that you'd like to use to run Brainlife apps, for better performance, or better security.
2. You are an app developer and you'd like to use your own resource so that you can troubleshoot your application directly.
3. You are an app developer and your app can only run on specialized resources (like Hadoop, Spark, etc..) that Brainlifie does not provide.

Currently, Brainlife does not allow non-admin users to share resources with other members for security reasons. If you register resource and enable some apps to run on it, only you can run those apps on your resources. If you are going to publish your app, please remember to enable your app on Brainlife's shared resource so that other users can execute your app.

## Registering Resources

To register your resource, go to Brainlife Settings page, then click Resources tab. Under "HPC Systems", click "Add New Account".

A resource form should appear, where you can enter following fields.

Name: Enter the name of rhe resource
Hostname: The hostname of your compute resource (usually a login/submit host)
Username: Username used to ssh to this resource
Workdir: Directory used to store work directories used to run apps. You should not share the same directory with other resources. Please make to mkdir.
SSH Public Key: Copy the content of this key to your resource's ~/.ssh/authorized_keys. Please read (authorized_keys)[https://www.ssh.com/ssh/authorized_keys/] for more detail.

You can leave the rest of the fields empty for now.

Click OK, and once you are finished with copying ssh key and make sure the workdir exists, click "Test" button to check to see if Brainlife can access your account. You should see a green checkbox if everything looks good.

## Configuring Resources

Once you register your resource, you will need to do a few things to prepare your resources so that Brainlife can successfully execute apps on your resource.

### abcd default hooks

Although some app provides its own (ABCD Hooks)[https://github.com/brain-life/abcd-spec], many of them relies on default hooks that are installed on each resource. As a resource provider, you will need to provide "start", "stop", and "status" scripts and place then in your $PATH. If you are not sure how to write these scripts, you can install and use the our default ABCD hooks by doing following.

```
cd ~
git clone https://github.com/brain-life/abcd-spec
```

Then, add following to your ~/.bashrc

(For PBS cluster)

```
export PATH=~/abcd-spec/hooks/pbs:$PATH
```

(For Slurm cluster)

```
export PATH=~/abcd-spec/hooks/slurm:$PATH
```

(For direct execution - no batch submission manager)

```
export PATH=~/abcd-spec/hooks/direct:$PATH
```

### Common Binaries

Brainlife expects certain binaries to be installed on all resources. Please make sure following applications are installed.

* jq (command line json parser that is commonly used by Brainlife app to parse config.json)
* singularity (userlevel container execution engine)

For IU HPC resource, please feel free to use following ~/bin directory which contains jq

(on bashrc)

```
export PATH=$PATH:/N/u/hayashis/Carbonate/bin
```

For singularity, you can either install it on the system, or for HPC you should add following in your .modules

```
module load singularity
```

By default, singularity users home directory to caches docker images (and /tmp to create a merged container image to run.) If you have limited amount of home directory, you should override these directories by setting something like following in your .bashrc

```
export SINGULARITY_CACHEDIR=/N/dc2/scratch/<username>/singularity-cache-br2
```

Please replace <username> with your username, and make sure those directories exists.

To override the merged congtainer directory, you also need to set SINGULARITY_LOCALCACHEDIR. For IU cluster, setting this to /N/dc2/scratch would break singularity (it needs to be locally mounted file systems). If you are using your local cluster, you need to make sure /tmp is large enough, or make sure you clean up old files in /tmp.

## Enabling Apps

Once you have registered and configured your resource, now you can enable apps to run on your resource.

Go back to the Brainlife / Settings / Resources, and click the resource you have created. Under services section, enter the git org/repo name of the app that you'd like to enable, and the score for each service. The higher the score is, more likely that the resource will be chosen to run your app (if there are multiple resources available). Brainlife gives higher score for resources that you own, so you can just leave it the default of 10 - unless it's competing with another resource that you own. Click OK.

You can see which resource a app is configured to run, and which resource will be chosen when you submit it under App's detail tab on Brainlife.


