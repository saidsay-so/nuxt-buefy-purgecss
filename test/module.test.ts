import { setupTest, expectModuleToBeCalledWith, getNuxt } from '@nuxt/test-utils'
import * as Components from 'buefy'
import { PurgeCSSDependencyAutoloaderPlugin as WebpackPlugin } from '../src/webpack-plugin'
import webpack from 'webpack'
import { getWebpackConfig } from 'nuxt'

describe('Module', () => {
  setupTest({
    testDir: __dirname,
    fixture: 'example'
  })

  it('should inject plugin for Buefy', () => {
    expectModuleToBeCalledWith('addPlugin', {
      options: {
        buefy: {
          css: false,
          materialDesignIcons: true,
          materialDesignIconsHRef: 'https://cdn.jsdelivr.net/npm/@mdi/font@5.8.55/css/materialdesignicons.min.css'
        },
        components: [
          'Icon', // These ones are in the example
          'Rate',
          // These are the programmatic components
          'Dialog',
          'Loading',
          'Modal',
          'Notification',
          'Snackbar',
          'Toast'
        ]
      },
      src: expect.stringMatching('templates/plugin.ejs'),
      fileName: 'plugins/buefy-loader.js'
    })
  })

  it('should add patterns for PurgeCSS', () => {
    const programmaticComponentsClasses = Object.keys(Components).filter((name) =>
      name.match(/^[A-Z]/) && name.endsWith('Programmatic')
    ).map((name) => name.split('Programmatic')[0])
      .filter((name) => name !== 'Config')
      .map(component => new RegExp(component.toLowerCase()))
    const expected = [
      /notices/, /(fade|zoom)/,
      /has-/, /is-.+?(?:by.+?)?/
    ].concat(programmaticComponentsClasses)

    const context = getNuxt()
    const { whitelistPatternsChildren = [], whitelistPatterns = [] }: {whitelistPatterns: RegExp[], whitelistPatternsChildren: RegExp[]} = context.options.purgeCSS
    expect(whitelistPatterns).toEqual(expect.arrayContaining(expected))
    expect(whitelistPatternsChildren).toEqual(expect.arrayContaining(expected))
  })

  it('should inject the Webpack plugin in the config', () => {
    const context = getNuxt()
    expect(context.options.build.plugins).toContainEqual(expect.any(WebpackPlugin))
  })

  it('should tap the plugin to PurgeCSS', async () => {
    const config = await getWebpackConfig()
    const webpackTest = new Promise<webpack.Stats>((resolve, reject) => webpack(config, (err, stats) => {
      if (err) { reject(err) }
      resolve(stats)
    }))
    // TODO: Complete test
    expect(webpackTest).resolves.toBeTruthy()
  })
})
