import * as Components from 'buefy'
import { Consola } from 'consola'

/** Filter to get get only components used in Buefy. */
export const filterComponents = (components: string[] = [], logger: Consola) => {
  const validComponentNames = Object.keys(Components).filter((name) =>
    name.match(/^[A-Z]/)
  )
  const filteredComponents = components
    .filter((name) => validComponentNames.includes(name))

  filteredComponents.forEach((c) => logger.trace('Filtered : ' + c))

  return Array.from(new Set(filteredComponents))
}
