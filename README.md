# delta-x

> `Delta Chat` on the command line.

[![Build Status](https://travis-ci.org/ralphtheninja/delta-x.svg?branch=master)](https://travis-ci.org/ralphtheninja/delta-x)
![Node version](https://img.shields.io/node/v/delta-x.svg)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

Experimental command line application built on top of the [`deltachat-node`](https://github.com/deltachat/deltachat-node) native addon.

**WORK IN PROGRESS** Not much to see at the moment. You can send and receive messages and do simple plumbing commands.

## Install and Usage

```sh
npm i delta-x -g
delta-x --email user@site.org --mail_pw foo
```

## Screenshots

TODO

## Shortcuts

* `ctrl-n` next chat window
* `ctrl-p` previous chat window
* `alt-n` _or_ `pagedown` scroll down
* `alp-p` _or_ `pageup` scroll up

## Commands

TODO

## Customization

TODO

## Kudos and Inspiration

A lot of inspiration comes from [`irssi`](https://github.com/irssi/irssi) and the architecture has a lot in common with [`cabal`](https://github.com/cabal-club/cabal).

## Why?

> Why didn't you just write a plugin for `irssi` and be done with it?

That's a great question. You should write one yourself!

My main goal was to implement _something_ using `deltachat-node` to exercise the api, find stuff that doesn't work so well and make way for a coming desktop application. Also, I wanted to explore how to write command line gui applications in node based on the following modules:

* [`neat-log`](https://github.com/neat-log/neat-log)
* [`neat-input`](https://github.com/mafintosh/neat-input)
* [`txt-blit`](https://github.com/noffle/txt-blit)

You should check them out. They're great!

## License

Licensed under the GPLv3, see [LICENSE](./LICENSE) file for details.
