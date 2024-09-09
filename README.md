# Meld (Electron)

A (poor man's) recreation of Meld using Electron.

## Why?!?

I wanted to learn how to use Electron. And Meld on macOS is not as stable as I wanted it to be. As
I use Meld on an almost daily basis, not having one of my favorite tools available was not an
option.

This recreation is far from the feature set of Meld itself. It is enough to suite my needs, but do
not consider this to be anywhere close to being a replacement for Meld. It does not interact with
version control systems, it does not offer any modification capabilities, it's just for showing
differences in a folder structure.

## Technologies used

The app is built using Electron. The UI is built using Vue 3 and Bootstrap. For creating diffs
jsdiff is used. To bridge Electron and Vue, I used [electron-vue-template](https://github.com/Deluze/electron-vue-template/tree/master)
simply because I found it first before [electron-vite-vue](https://github.com/electron-vite/electron-vite-vue).

## Icon

The icon is a mixture of the [meld icon](https://en.wikipedia.org/wiki/File:Meld_Logo.svg)
and the [electron logo](https://commons.wikimedia.org/wiki/File:Electron_Software_Framework_Logo.svg).
Therefore, their individual licenses also apply to src/main/logo.svg.
