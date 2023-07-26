import { Queue } from 'queue-typescript';
import { ModManifest } from './modlinks';
import * as core from '@actions/core';
import { ModDependency } from './mod-dependencies';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toLookup<K extends keyof any, V>(
  values: V[],
  keySelector: (val: V) => K,
): Record<K, V> {
  return values.reduce(
    (map, val) => {
      map[keySelector(val)] = val;
      return map;
    },
    {} as Record<K, V>,
  );
}

/**
 * Gets a list of all required mod metadata needed to install a set of mods
 * @param directDependencies The direct dependencies this mod needs, and any local aliases
 *                           or download overrides needed for a successful build
 * @param modLinks All known mod links
 * @returns An array of pairs of the mod's modlink manifest and any local overrides, if known.
 */
export function resolveDependencyTree(
  directDependencies: ModDependency[],
  modLinks: ModManifest[],
): [ModManifest, ModDependency][] {
  const dependencyLookup = toLookup(directDependencies, dep => dep.modName);
  const modLookup = toLookup(modLinks, mod => mod.Name);

  const modsToProcess = new Queue<string>(...Object.keys(dependencyLookup));
  const processedMods = new Set<string>();
  let dependencyError = false;

  while (modsToProcess.length > 0) {
    const currentMod = modsToProcess.dequeue();
    if (currentMod in modLookup) {
      const manifest = modLookup[currentMod];
      manifest.Dependencies.Dependency.forEach(
        modsToProcess.enqueue.bind(modsToProcess),
      );
      processedMods.add(currentMod);
    } else if (dependencyLookup[currentMod].url) {
      processedMods.add(currentMod);
      modLookup[currentMod] = {
        Name: currentMod,
        Version: '???',
        Description: '???',
        Dependencies: { Dependency: [] },
        Link: {
          $value: dependencyLookup[currentMod].url ?? '',
          __SHA256: '',
        },
      };
      core.warning(
        `${currentMod} not found in modlinks, but fetchable from URL`,
      );
    } else {
      dependencyError = true;
      core.error(`${currentMod} expected in modlinks, but was not present`);
    }
  }
  if (dependencyError) {
    core.setFailed(
      'One or more requested dependencies was not available in modlinks. See previous output for more information',
    );
  }
  return [...processedMods].map(modName => {
    // by default, the only local metadata we need for a mod is its name. if we've declared a direct dependency,
    // we may also be declaring additional data/overrides
    let dependencyEntry: ModDependency = { modName };
    if (modName in dependencyLookup) {
      dependencyEntry = dependencyLookup[modName];
    }
    return [modLookup[modName], dependencyEntry];
  });
}
