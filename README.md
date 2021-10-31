# nuxt-buefy-purgecss

[![codecov](https://codecov.io/gh/MusiKid/nuxt-buefy-purgecss/branch/main/graph/badge.svg?token=FB35JGG7FR)](https://codecov.io/gh/MusiKid/nuxt-buefy-purgecss)
[![.github/workflows/test.yml](https://github.com/MusiKid/nuxt-buefy-purgecss/actions/workflows/test.yml/badge.svg)](https://github.com/MusiKid/nuxt-buefy-purgecss/actions/workflows/test.yml)

A simple wrapper for [nuxt-buefy](https://github.com/buefy/nuxt-buefy),
which adds support for PurgeCSS.

## Install

```sh
npm install --save @musikid/nuxt-buefy-purgecss-loader
```

## Usage

For now, we have to set PurgeCSS to Webpack mode.

```js
{
  buildModules: [
    'nuxt-buefy-purgecss',
    ['nuxt-purgecss', {
      mode: 'webpack'
    }]
  ],
  ...
  build: {
    extractCSS: true,
    ...
  }
}
```

## Options

Please see [here](https://github.com/buefy/nuxt-buefy#options).

## Credits

Kudos to @phatj for the work!
