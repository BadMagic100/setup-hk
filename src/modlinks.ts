import {
  downloadLink,
  DownloadSuccess,
  LinkData,
  MultiplatformLinks,
} from './links-processing.js';
import * as core from '@actions/core';
import * as io from '@actions/io';
import * as tc from '@actions/tool-cache';
import path from 'path';
import { ModDependency } from './mod-dependencies.js';

interface ModLinksSchema {
  ModLinks: {
    Manifest: ModManifest[];
  };
}

interface ModLinksManifestBase {
  Name: string;
  Description: string;
  Version: string;
  Dependencies: {
    Dependency: string[];
  };
}

interface ModManifestAllPlatforms extends ModLinksManifestBase {
  Link: LinkData;
}

interface ModManifestMultiplatform extends ModLinksManifestBase {
  Links: MultiplatformLinks;
}

export type ModManifest = ModManifestAllPlatforms | ModManifestMultiplatform;

function isAllPlatformMod(
  manifest: ModManifest,
): manifest is ModManifestAllPlatforms {
  return 'Link' in manifest;
}

export function getModLinksManifests(rawJson: unknown): ModManifest[] {
  const manifests = (rawJson as ModLinksSchema).ModLinks.Manifest;
  manifests.forEach(manifest => {
    if ((manifest.Dependencies as unknown) === '') {
      manifest.Dependencies = { Dependency: [] };
    }
  });
  return manifests;
}

async function extractMod(
  mod: ModManifest,
  overrides: ModDependency,
  result: DownloadSuccess,
  modInstallPath: string,
): Promise<string> {
  const thisModInstall = path.join(modInstallPath, overrides.alias ?? mod.Name);
  await io.mkdirP(thisModInstall);

  if (result.fileType === '.dll') {
    await io.cp(result.resultPath, thisModInstall, { force: true });
  } else if (result.fileType === '.zip') {
    const tmpResult = await tc.extractZip(result.resultPath);
    await io.cp(tmpResult, thisModInstall, {
      recursive: true,
      force: true,
      copySourceDirectory: false,
    });
  }
  return thisModInstall;
}

export async function tryDownloadModManifest(
  manifest: ModManifest,
  overrides: ModDependency,
  modInstallPath: string,
): Promise<boolean> {
  core.info(`Attempting to download ${manifest.Name} v${manifest.Version}`);
  if (overrides.url) {
    core.warning(
      `Downloading a mod (${manifest.Name}) directly from a link with no hash is inherently dangerous since the hash cannot be ` +
        'verified. By doing this, you assume the risk of a bad actor replacing the file. Please update your mod dependencies as ' +
        'soon as you are able to do so.',
    );
  }
  const linkToDownload =
    overrides.url ??
    (isAllPlatformMod(manifest) ? manifest.Link : manifest.Links);
  const result = await downloadLink(linkToDownload);
  if (result.succeeded) {
    const thisModInstallPath = await extractMod(
      manifest,
      overrides,
      result,
      modInstallPath,
    );
    core.info(
      `Successfully downloaded ${manifest.Name} v${manifest.Version} to ${thisModInstallPath}`,
    );
    return true;
  } else {
    core.error(
      `Failed to download ${manifest.Name} v${manifest.Version}: ${result.detailedReason}`,
    );
    return false;
  }
}
