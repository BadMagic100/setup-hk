import { downloadLink, MultiplatformLinks } from './links-processing';
import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as io from '@actions/io';

interface ApiSchema {
  ApiLinks: {
    Manifest: ApiManifest;
  };
}

export interface ApiManifest {
  Version: number;
  Links: MultiplatformLinks;
  Files: {
    File: string[];
  };
}

const vanillaLinks: ApiManifest = {
  Version: 1.5,
  Links: {
    Windows: {
      $value: 'https://files.hk-modding.org/managed-windows.zip',
      __SHA256:
        'dbb57a9978dec8253803cc04a97842e1ee239f29365edcabb7822298f49d2619',
    },
    Linux: {
      $value: 'https://files.hk-modding.org/managed-linux.zip',
      __SHA256:
        'bfdb303bba98b982b4a7593b63ed1db4570d3e429899bdebcee7038b000b954a',
    },
    Mac: {
      $value: 'https://files.hk-modding.org/managed-macos.zip',
      __SHA256:
        '17a45bbc570945fdc4b3e445099ee242e7490fd7bac57cd7439e220ce41f942c',
    },
  },
  // not actually used currently, just a placeholder for the moment
  Files: {
    File: [],
  },
};

export function getApiLinksManifest(rawJson: unknown): ApiManifest {
  return (rawJson as ApiSchema).ApiLinks.Manifest;
}

export async function tryDownloadVanilla(
  apiTargetPath: string,
): Promise<boolean> {
  return tryDownloadApiManifest(vanillaLinks, apiTargetPath);
}

export async function tryDownloadApiManifest(
  manifest: ApiManifest,
  apiTargetPath: string,
): Promise<boolean> {
  core.info(`Attempting to download MAPI v${manifest.Version}`);
  const result = await downloadLink(manifest.Links);
  if (result.succeeded) {
    if (result.fileType !== '.zip') {
      core.info(
        `Failed to download MAPI v${manifest.Version}. Expected a .zip file.`,
      );
      return false;
    }
    const tmpResult = await tc.extractZip(result.resultPath);
    await io.cp(tmpResult, apiTargetPath, {
      recursive: true,
      force: true,
      copySourceDirectory: false,
    });

    core.info(
      `Successfully downloaded MAPI v${manifest.Version} to ${apiTargetPath}`,
    );
    return true;
  } else {
    core.error(
      `Failed to download MAPI v${manifest.Version}: ${result.detailedReason}`,
    );
    return false;
  }
}
