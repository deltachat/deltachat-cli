# deltachat-cli

> `Delta Chat` on the command line.

[![Build Status](https://travis-ci.org/ralphtheninja/deltachat-cli.svg?branch=master)](https://travis-ci.org/ralphtheninja/deltachat-cli)
![Node version](https://img.shields.io/node/v/deltachat-cli.svg)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

Experimental command line application built on top of the [`deltachat-node`](https://github.com/deltachat/deltachat-node) native addon.

**WORK IN PROGRESS** Not much to see at the moment. You can send and receive messages and do simple plumbing commands. Not yet published on `npm` so you need to clone the repository and run this hardcore style.

## Install and Usage

```sh
npm i deltachat-cli -g
deltachat --email user@site.org --mail_pw foo
```

## Platform Support

Currently `deltachat-cli` only works on Linux. This is completely dependent on the platform support of `deltachat-node`. If you're on a Debian based distro the following command should be enough to cover software and build dependencies.

```
sudo apt install libetpan-dev libssl-dev libsqlite3-dev libsasl2-dev \
libbz2-dev zlib1g-dev meson ninja-build
```

## Screenshots

TODO

## Shortcuts and Keys

* `ctrl-n` Switch to next window.
* `ctrl-p` Switch to previous window.
* `alt-n` _or_ `pagedown` Scroll down.
* `alt-p` _or_ `pageup` Scroll up.
* `alt-<n>` Switch to window `<n>` where n is between 1 and 9.
* `enter` Accept input from the user.
* `tab` Auto completes commands (starting with `/`) and nicks.

## Commands

Commands can be executed from anywhere, but the output of all commands show up in the `status` window.

* `/archive-chat [<id>]` Archive a chat. If `<id>` is omitted, defaults to current chat.
* `/clear` Clear the debug or status window.
* `/create-chat <contactId>` Create a normal chat with a single user.
* `/create-contact <name> <address>` Create a contact.
* `/delete-chat [<id>]` Delete a chat. If `<id>` is omitted, defaults to current chat.
* `/delete-contact <id>` Delete a contact (might fail if you have an open chat with that particular user).
* `/delete-message <id>` Delete a message.
* `/get-chats` List all chats.
* `/get-contacts` List all contacts.
* `/help [<command>]` Show all commands and their short syntax or help about a specific `command`.
* `/star-message <id>` Star a message (starred messages show up in a virtual `stars` chat).
* `/unarchive-chat <id>` Unarchive a chat.

## Configuration

By default `deltachat` will use the `$HOME/.deltachat_cli` folder for storing data. This can be overriden by using the `--home` argument.

Run `deltachat` using current folder to store data:

```sh
deltachat --email user@site.org --mail_pw foo --home .
```

TODO mention colors and `rc` in general.

## Kudos and Inspiration

A lot of inspiration comes from [`irssi`](https://github.com/irssi/irssi) and the architecture has a lot in common with [`cabal`](https://github.com/cabal-club/cabal).

## Why?

> Why not just write a plugin for `irssi` or `weechat` and be done with it?

That's a great question. You should write one yourself!

The main goal is to implement _something_ using `deltachat-node` to exercise the api, find stuff that doesn't work so well and make way for a coming desktop application. It's also an exploration into writing command line application based on the following node modules:

* [`neat-log`](https://github.com/neat-log/neat-log)
* [`neat-input`](https://github.com/mafintosh/neat-input)
* [`txt-blit`](https://github.com/noffle/txt-blit)

You should check them out. They're great!

## Debug

Running `deltax` with `--debug` will create a debug window where all events from `deltachat-node` can be seen.

## License

Licensed under the GPLv3, see [LICENSE](./LICENSE) file for details.

Copyright © 2018 Delta Chat contributors.
