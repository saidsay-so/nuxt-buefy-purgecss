# nuxt-buefy-purgecss

A simple wrapper for [nuxt-buefy](https://github.com/buefy/nuxt-buefy),
which adds support for PurgeCSS.

## Usage

For now, we have to set purgeCSS to Webpack mode.

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
