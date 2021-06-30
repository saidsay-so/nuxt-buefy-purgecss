import { join } from 'path'
import { readFile } from 'fs/promises'
import glob from 'fast-glob'
import consola from 'consola'
import * as Components from 'buefy'
import { NuxtConfig } from '@nuxt/types'

interface FindTagsOptions {
  srcDir: string,
  configDirs: NuxtConfig['dir']
}

export const findTags = async ({ srcDir, configDirs }: FindTagsOptions) => {
  const pattern = /<b-\w+|B[A-Z]\w+/g
  const capitalize = (w: string) => w.charAt(0).toUpperCase() + w.slice(1)
  const kebabToPascal = (w: string) => w.split('-').map(capitalize).join('')

  const logger = consola.withScope('buefy-loader:search')

  // pages, layouts, components
  // TODO: Add support for components paths
  const paths = [
    `${configDirs?.pages ?? 'pages'}/**/*.vue`,
    `${configDirs?.layouts ?? 'layouts'}/**/*.vue`,
    'components/**/*.vue'
  ].map((pattern) => join(srcDir, pattern))

  const matchedPaths = await glob(paths)
  const matchedTags: Set<string> = new Set()

  for (const path of matchedPaths) {
    const content = await readFile(path, { encoding: 'utf-8' })
    const matches = content.match(pattern) ?? []
    for (const tag of matches) {
      matchedTags.add(kebabToPascal(tag.substr(3)))
    }
  }

  const tags = Array.from(matchedTags).sort()

  logger.info(`Found ${matchedTags.size} buefy root tags...`)
  logger.debug(`Root tags: ${tags}`)

  return tags
}

/** Filter to get get only components used in Buefy. */
export const filterComponents = (components: string[] = []) => {
  const logger = consola.withScope('buefy-loader:filter')

  const validComponentNames = Object.keys(Components).filter((name) =>
    name.match(/^[A-Z]/)
  )
  const filteredComponents = components
    .filter((name) => validComponentNames.includes(name))

  filteredComponents.forEach((c) => logger.trace(`Filtered ${c}`))

  return Array.from(new Set(filteredComponents))
}
