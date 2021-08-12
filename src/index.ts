import consola from 'consola'
import { findComponents, findProgrammaticComponents } from './find-components'
import { Module } from '@nuxt/types'
import { PostcssConfiguration } from '@nuxt/types/config/build'
import { PurgeCSSDependencyAutoloaderPlugin as Plugin } from './webpack-plugin'
import { resolve } from 'path'

const defaultBuefyOptions = {
  css: false,
  materialDesignIcons: true,
  materialDesignIconsHRef:
    'https://cdn.jsdelivr.net/npm/@mdi/font@5.8.55/css/materialdesignicons.min.css',
  async: true
}
type BuefyOptions = typeof defaultBuefyOptions;
interface ModuleOptions extends BuefyOptions {
  enabled: boolean;
};

const BuefyLoader: Module<Partial<ModuleOptions>> = async function (moduleOptions = {}) {
  const logger = consola.withScope('buefy-loader')
  const { resolvePath } = this.nuxt.resolver

  const programmaticComponents = await findProgrammaticComponents(this.options, resolvePath)
  const components = (await findComponents(this.options, resolvePath)).concat(programmaticComponents)

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

    const asyncLoad = buefyOptions.async

    this.options.head.link.push({
      rel: asyncLoad ? 'preload' : 'stylesheet',
      as: asyncLoad ? 'style' : undefined,
      onload: asyncLoad ? "this.rel='stylesheet'" : undefined,
      type: 'text/css',
      href: options.buefy.materialDesignIconsHRef
    })
  }

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

  if (this.options.dev && !enabled) {
    logger.info('Skipping PurgeCSS fixes in dev mode')
    return
  }

  // Adding the webpack plugin
  this.extendBuild((cfg) => {
    cfg.plugins?.push(new Plugin('buefy', ['js']))
  })

  if (!this.options.purgeCSS) {
    this.options.purgeCSS = {}
  }

  const { purgeCSS } = this.options

  const { whitelistPatternsChildren = [], whitelistPatterns = [] } = purgeCSS

  const patterns = {
    whitelistPatternsChildren,
    whitelistPatterns
  }

  const programmaticClasses = programmaticComponents.map(component => new RegExp(component.toLowerCase()))

  let patternType: keyof typeof patterns
  for (patternType in patterns) {
    if (patterns[patternType] instanceof Function) { patterns[patternType] = (patterns[patternType] as () => RegExp[])() }

    purgeCSS[patternType] = (patterns[patternType] as RegExp[]).concat(
      /notices/, /(fade|zoom)/,
      /has-/, /is-.+?(?:by.+?)?/,
      programmaticClasses
    )
  }

  // if (!purgeCSS.paths)
  //  purgeCSS.paths = [];

  // const pattern = buefyDepResolve('buefy', usedComponents);
  // purgeCSS
  //  .paths
  //  .push(pattern);
}

// @ts-ignore
BuefyLoader.meta = require('../package.json')
export default BuefyLoader
