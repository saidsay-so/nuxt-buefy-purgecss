import { resolve } from 'path'
import consola from 'consola'
import * as Components from 'buefy'

import { findTags, filterComponents } from './find-tags'
// import buefyDepResolve from './buefy-resolve';
import { Module } from '@nuxt/types'
import { PostcssConfiguration } from '@nuxt/types/config/build'
import { PurgeCSSDependencyAutoloaderPlugin as AutoloaderPlugin } from './webpack-plugin'

const programmaticComponents = Object.keys(Components).filter((name) =>
  name.match(/^[A-Z]/) && name.endsWith('Programmatic')
).map((name) => name.split('Programmatic')[0])
  .filter((name) => name !== 'Config')

// export interface ModuleOptions {
//   css: boolean,
//   materialDesignIcons: boolean,
//   materialDesignIconsHRef: string,
// }

const defaultBuefyOptions = {
  css: false,
  materialDesignIcons: true,
  materialDesignIconsHRef:
    'https://cdn.jsdelivr.net/npm/@mdi/font@5.8.55/css/materialdesignicons.min.css'
}
export type BuefyOptions = typeof defaultBuefyOptions;
export interface ModuleOptions extends BuefyOptions {
  enabled: boolean;
};

const BuefyLoader: Module<Partial<ModuleOptions>> = async function (moduleOptions = {}) {
  const logger = consola.withScope('buefy-loader')

  const components = filterComponents(await findTags({ srcDir: this.options.srcDir, configDirs: this.options.dir })).concat(programmaticComponents)

  const { enabled, ...buefyOptions } = moduleOptions
  const options = {
    buefy: {
      ...defaultBuefyOptions,
      ...buefyOptions
    },
    components
  }

  // Add MDI icons
  if (options.buefy.materialDesignIcons !== false) {
    if (this.options.head instanceof Function) { this.options.head = { ...this.options.head() } }

    if (!this.options.head.link) { this.options.head.link = [] }

    this.options.head.link.push({
      rel: 'stylesheet',
      type: 'text/css',
      href: options.buefy.materialDesignIconsHRef
    })
  }

  // Add Buefy plugin
  logger.debug('Adding plugin with Buefy import(s)')
  this.addPlugin({
    src: resolve(
      __dirname,
      '../templates',
      this.options.dev ? 'plugin-dev.ejs' : 'plugin.ejs'
    ),
    fileName: 'plugins/buefy-loader.js',
    options
  })

  // Add CSS
  if (moduleOptions.css !== false) {
    this.options.css.unshift('buefy/dist/buefy.css')

    // Add PostCSS plugin
    this.options.build.postcss = (this.options.build.postcss as PostcssConfiguration)
    this.options.build.postcss.plugins = Object.assign(
      this.options.build.postcss.plugins || {},
      { 'postcss-custom-properties': { warnings: false } }
    )
  }

  if (this.options.dev && !enabled) {
    logger.info('Skipping PurgeCSS fixes in dev mode')
    return
  }

  if (!this.options.purgeCSS) {
    this.options.purgeCSS = {}
  }

  const { build, purgeCSS } = this.options

  // Adding the webpack plugin
  build.plugins!.push(new AutoloaderPlugin('buefy', ['js']))

  const { whitelistPatternsChildren = [], whitelistPatterns = [] } = purgeCSS

  const patterns = {
    whitelistPatternsChildren,
    whitelistPatterns
  }
  const programmaticComponentsClasses = programmaticComponents
    .map(component => new RegExp(component.toLowerCase()))

  let patternType: keyof typeof patterns
  for (patternType in patterns) {
    if (patterns[patternType] instanceof Function) { patterns[patternType] = (patterns[patternType] as () => RegExp[])() }

    purgeCSS[patternType] = (patterns[patternType] as RegExp[]).concat(
      /notices/, /(fade|zoom)/,
      /has-/, /is-.+?(?:by.+?)?/,
      programmaticComponentsClasses
    )
  }

  // if (!purgeCSS.paths)
  //  purgeCSS.paths = [];

  // const pattern = buefyDepResolve('buefy', usedComponents);
  // purgeCSS
  //  .paths
  //  .push(pattern);
}

export default BuefyLoader
export const meta = require('../package.json')
