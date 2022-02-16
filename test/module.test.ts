import { setupTest, expectModuleToBeCalledWith, getNuxt, createContext, setContext, loadFixture, loadNuxt /* build, getContext */ } from '@nuxt/test-utils'
import { PurgeCSSDependencyAutoloaderPlugin as WebpackPlugin } from '../src/webpack-plugin'
import { getWebpackConfig } from 'nuxt'
import webpack from 'webpack'
// import { inspect } from 'util'

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
          async: true,
          materialDesignIcons: true,
          materialDesignIconsHRef: 'https://cdn.jsdelivr.net/npm/@mdi/font@5.8.55/css/materialdesignicons.min.css'
        },
        components: expect.arrayContaining([
          'Icon', // These ones are in the example
          'Rate',
          // These are the programmatic components
          'Dialog',
          'Notification'
        ])
      },
      src: expect.stringMatching('templates/plugin.ejs'),
      fileName: 'plugins/buefy-loader.js'
    })
  })

  it('should add patterns for PurgeCSS', () => {
    const expected = [
      /notices/, /(fade|zoom)/,
      /has-/, /is-.+?(?:by.+?)?/,
      /dialog/, /notification/
    ]
    const context = getNuxt()
    const { whitelistPatternsChildren = [], whitelistPatterns = [] }:
      { whitelistPatterns: RegExp[], whitelistPatternsChildren: RegExp[] } = context.options.purgeCSS

    expect(whitelistPatterns).toEqual(expect.arrayContaining(expected))
    expect(whitelistPatternsChildren).toEqual(expect.arrayContaining(expected))
  })
})

describe('Webpack plugin', () => {
  it('should inject the Webpack plugin in the config', async () => {
    const context = createContext({
      testDir: __dirname,
      fixture: 'example'
    })
    setContext(context)
    await loadFixture()
    await loadNuxt()
    const mockWebpackConfig: webpack.Configuration = { ...await getWebpackConfig() }
    jest.spyOn(context.nuxt.moduleContainer, 'extendBuild')
      .mockImplementation((fn: (...args: unknown[]) => any) => {
        fn(mockWebpackConfig, { isClient: true, isServer: false })
      })
    await context.nuxt.ready()

    expect(context.nuxt.moduleContainer.extendBuild).toHaveBeenCalled()
    expect(mockWebpackConfig.plugins)
      .toEqual(
        expect.arrayContaining([expect.any(WebpackPlugin)])
      )
    const plugin = mockWebpackConfig.plugins?.find(plug => plug instanceof WebpackPlugin) as WebpackPlugin
    expect(plugin.tapPluginName).toEqual('PurgeCSS')
    expect(plugin.pattern).toEqual(/node_modules\/buefy.*?(?:js)/)

    setContext(undefined)
    await context.nuxt.close()
  })

  describe('Compilation', () => {
    beforeAll(async () => {

      // (ctx.nuxt).hook('build:before', (stats) => console.log(stats))
    })

    it.todo('should tap plugin to PurgeCSS'
      // async () => {
      //   const ctx = createContext({
      //     testDir: __dirname,
      //     fixture: 'example'
      //   })

      //   setContext(ctx)
      //   expect(getContext()).toEqual(ctx)
      //   await loadFixture()

      //   await loadNuxt()
      //   await ctx.nuxt.ready()

      //   console.log(ctx.nuxt.options.buildDir)
      //   ctx.nuxt.hook('builder:extendPlugins', (plugins) => console.log(plugins))
      //   await build()
      // }
    )
  }
  )
})
