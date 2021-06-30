import { join } from 'path'

export default function (nodeModuleFolder: string, components: string[]) {
  const normalizedFiles = components.map(name => name.toLowerCase()).join('|')

  const folder = join('node_modules', nodeModuleFolder)
  const pattern = `${folder}/**/+(${normalizedFiles}).@(vue|js)`

  return pattern
}
