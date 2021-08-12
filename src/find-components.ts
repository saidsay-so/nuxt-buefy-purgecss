import { dirname, join } from 'path'
import { readFile, stat } from 'fs/promises'
import glob from 'fast-glob'
import { render } from 'pug'
import consola from 'consola'
import * as Components from 'buefy'
import { NuxtConfig } from '@nuxt/types'
import { compile, ModuleOptions, parseComponent } from 'vue-template-compiler'

const getDir = async (path: string) => (await stat(path)).isDirectory()
  ? path
  : dirname(path)

const capitalize = (w: string) => w.charAt(0).toUpperCase() + w.slice(1)

const getPaths = async ({ dir = { pages: 'pages', layouts: 'layouts' }, components, srcDir }: NuxtConfig, resolve: (path: string) => string, pattern: string = '**/*.vue', ...additionalPaths: string[]) => {
  // pages, layouts, components
  const pages = dir?.pages
  const layouts = dir?.layouts
  const defaultPattern = pattern
  const resolvedComponents = [`components/${defaultPattern}`]

  const componentsDir = Array.isArray(components)
    ? components
    : (typeof components === 'object' && components.dirs
        ? components.dirs
        : [])
  for (const comp of componentsDir) {
    // The array can contain strings or objects
    const path = typeof comp === 'string' ? comp : comp.path

    const resolvedPath = await getDir(resolve(path))
    const pattern = (typeof comp === 'object' ? comp : {}).pattern as string | undefined ?? defaultPattern
    resolvedComponents.push(join(resolvedPath, pattern))
  }

  const paths = [
    `${pages}/**/*.vue`,
    `${layouts}/**/*.vue`
  ].concat(resolvedComponents, additionalPaths).map(path => join(srcDir!, path))

  return await glob(paths)
}

export const findComponents = async (config: NuxtConfig, resolve: (path: string) => string) => {
  const kebabToPascal = (w: string) => w.split('-').map(capitalize).join('')

  const logger = consola.withScope('buefy-loader:search')

  const paths = await getPaths(config, resolve)
  const matchedTags = new Set<string>()

  for (const path of paths) {
    const content = await readFile(path, { encoding: 'utf8' })
    const { template } = parseComponent(content)

    if (!template) { continue }

    if (template.src) {
      template.content = await readFile(resolve(join(await getDir(path), template.src)), { encoding: 'utf8' })
    }

    if (template.lang === 'pug') {
      template.content = render(template.content, { filename: path })
    }

    compile(template.content, {
      modules: [{
        postTransformNode: (el) => {
          matchedTags.add(kebabToPascal(el.tag))
        }
      } as ModuleOptions]
    })
  }

  const validTags = Object.keys(Components)
    .filter(name => name.match(/^[A-Z]/) && !name.endsWith('Programmatic'))
    .map(name => 'B' + name)
  const filteredComponents = Array.from(matchedTags)
    .filter((name) => validTags.includes(name))

  filteredComponents.forEach((c) => logger.trace(`Filtered ${c}`))

  logger.info(`Found ${matchedTags.size} buefy root tags...`)
  logger.debug(`Root tags: ${filteredComponents}`)

  return filteredComponents.map(name => name.slice(1))
}

export const findProgrammaticComponents = async (config: NuxtConfig, resolve: (path: string) => string) => {
  const programmaticComponents = Object.keys(Components)
    .filter(name => name.match(/^[A-Z]/) && name.endsWith('Programmatic'))
    .filter(name => name !== 'Config')

  const importsRegex = new RegExp(programmaticComponents.join('|'), 'g')
  const objectsNames = programmaticComponents
    .map(c => c.slice(0, -12))
    .map(c => c.toLowerCase())
    .join('|')
  const programmaticRegex = new RegExp(`\\$buefy\\.(${objectsNames})`, 'g')

  const matchedComponents = new Set<string>()
  const paths = await getPaths(config, resolve)
  for (const path of paths) {
    const content = await readFile(path, { encoding: 'utf-8' })
    const { script } = parseComponent(content)

    if (!script) { continue }

    if (script.src) {
      const contentPath = resolve(join(await getDir(path), script.src))
      script.content = await readFile(contentPath, { encoding: 'utf8' })
    }

    // We remove the suffix 'Programmatic'
    const importsMatches = Array.from(script.content.matchAll(importsRegex))
      .map(match => match[0])
      .map(match => match.slice(0, -12))
    const programmaticMatches = Array.from(script.content.matchAll(programmaticRegex))
      .map(match => match[1])
      .map(capitalize)

    for (const comp of importsMatches.concat(programmaticMatches)) {
      matchedComponents.add(comp)
    }
  }

  return Array.from(matchedComponents)
}
