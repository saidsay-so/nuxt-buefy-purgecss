import { join } from 'path'
import consola from 'consola'
import webpack from 'webpack'
import PurgeCSSPlugin from 'purgecss-webpack-plugin'

export class PurgeCSSDependencyAutoloaderPlugin {
  pluginName = 'PurgeCSSDependencyAutoloaderPlugin';
  tapPluginName = 'PurgeCSS';
  pattern: RegExp;
  logger = consola.withScope('purgecss-dependency-autoloader');

  constructor (nodeModuleFolder: string, extensions: string[]) {
    const folder = join('node_modules', nodeModuleFolder)
    const extensionRegex = extensions.join('|')

    this.pattern = new RegExp(`${folder}.*?(?:${extensionRegex})`)

    this.logger.debug(`Folder path pattern resolved to ${this.pattern}`)
  }

  apply (compiler: webpack.Compiler) {
    compiler.hooks.compilation.tap(this.pluginName, (compilation) => {
      const plugin: PurgeCSSPlugin | undefined = compilation.compiler.options.plugins?.find(
        (plugin: webpack.WebpackPluginInstance) => (plugin as any).purgedStats
      ) as PurgeCSSPlugin | undefined

      if (!plugin) {
        this.logger.info('PurgeCSS webpack plugin could not be found')
        return
      }

      // intercept and overwrite the additionalAssets hook
      compilation.hooks.additionalAssets.intercept({
        register: (tapInfo) => {
          if (tapInfo.name === this.tapPluginName) {
            const paths = typeof plugin?.options.paths === 'function' ? plugin?.options.paths() : plugin?.options.paths
            tapInfo.fn = async () =>
              await plugin?.runPluginHook(compilation, paths!)

            this.logger.debug(`Overwrote ${this.tapPluginName} function...`)
          }

          return tapInfo
        }
      })

      compilation.hooks.additionalAssets.tap(this.pluginName, () => {
        if (!plugin) {
          return
        }

        // Find files loaded from node_modules
        const dependencies = this.getDependencies(compilation)
        const { paths } = plugin.options

        // Add dependencies to the PurgeCSS path
        if (dependencies.length) {
          (paths as string[]).push(...dependencies)

          this.logger.info(
            `${paths.length} paths to be parsed; ${dependencies.length} dependencies autoloaded...`
          )
          this.logger.debug(dependencies)
        }
      })
    })
  }

  getDependencies ({ chunks }: webpack.compilation.Compilation) {
    const dependencies = []

    for (const chunk of chunks) {
      for (const {
        id,
        buildInfo: { fileDependencies }
      } of chunk.getModules()) {
        if (!fileDependencies) {
          continue
        }

        const deps = Array.from<string>(fileDependencies).filter(value =>
          value.match(this.pattern)
        )

        if (deps.length) {
          this.logger.debug(id, chunk.name, deps)
          dependencies.push(...deps)
        }
      }
    }

    return dependencies
  }
}
