# Estimate analysis
  
Aha! Develop extension that explores techniques for evaluating feature estimates.

It provides these contributions:

* Projected duration: A view contribution showing the projected range of how long it will take to complete a feature based on its estimate, estimation uncertainty, and team velocity.
* Estimation uncertainty: An account setting to measure how much inaccuracy to allow for during estimation. Represented as a percentage from 0-100%. Higher uncertainty means estimates are less reliable.

## Demo

![demo](res/demo.png)

## Current limitations

* Works on features only at the moment
* Requires estimation in points
* Velocity is based on team throughput over last 90 days. Doesn't factor individual/assignee velocity into account.
* Uncertainty defaults to 25%. Meaning for a task estimated at one day, we'd expect to see it completed within 0.75d – 1.25d. I've set this based on previous experience, but we can tune it via an extension setting.
* "Time in progress" means exactly that:  total time spent in an "in progress" status. Moving it out of that status category "stops the clock."
* It'll probably break a lot. Open an issue in this repo and I'll fix it.

## Installing the extension

**Note: In order to install an extension into your Aha! Develop account, you must be an account administrator.**

Install the Estimate analysis extension by clicking [here](https://secure.aha.io/settings/account/extensions/install?url=).

## Working on the extension

Install [`aha-cli`](https://github.com/aha-app/aha-cli):

```sh
npm install -g aha-cli
```

Clone the repo:

```sh
git clone https://github.com/trydionel/estimation-analysis.git
```

**Note: In order to install an extension into your Aha! Develop account, you must be an account administrator.**

Install the extension into Aha! and set up a watcher:

```sh
aha extension:install
aha extension:watch
```

Now, any change you make inside your working copy will automatically take effect in your Aha! account.

## Building

When you have finished working on your extension, package it into a `.gz` file so that others can install it:

```sh
aha extension:build
```

After building, you can upload the `.gz` file to a publicly accessible URL, such as a GitHub release, so that others can install it using that URL.

To learn more about developing Aha! Develop extensions, including the API reference, the full documentation is located here: [Aha! Develop Extension API](https://www.aha.io/support/develop/extensions)
