import * as tc from '@actions/tool-cache';
import * as io from '@actions/io';
import * as core from '@actions/core';
import * as crypto from 'crypto';
import * as path from 'path';
import { readFile } from 'fs/promises';

export type LinkData = {
  $value: string;
  __SHA256: string;
};

export interface MultiplatformLinks {
  Linux: LinkData;
  Mac: LinkData;
  Windows: LinkData;
}

function isSingleLink(link: LinkData | MultiplatformLinks): link is LinkData {
  return (link as LinkData).$value !== undefined;
}

const allowedExtensions = ['.dll', '.zip'] as const;
type ModFileType = (typeof allowedExtensions)[number];

function readonlyIncludes<T extends U, U>(
  list: readonly T[],
  item: U,
): item is T {
  return list.includes(item as T);
}

export interface DownloadFailed {
  succeeded: false;
  detailedReason: string;
}

export interface DownloadSuccess {
  succeeded: true;
  resultPath: string;
  fileType: ModFileType;
}

export type DownloadStatus = DownloadFailed | DownloadSuccess;

export function getPreferredLinkPlatform(): keyof MultiplatformLinks {
  switch (process.platform) {
    case 'win32':
      return 'Windows';
    case 'linux':
      return 'Linux';
    case 'darwin':
      return 'Mac';
    default:
      throw new Error('Not running on a modlinks-supported platform');
  }
}

export async function downloadLink(
  link: string | LinkData | MultiplatformLinks,
  dest?: string,
): Promise<DownloadStatus> {
  let verifyHash = true;
  if (typeof link === 'string') {
    verifyHash = false;
    link = { $value: link, __SHA256: '' };
  }

  if (!isSingleLink(link)) {
    const platform = getPreferredLinkPlatform();
    link = link[platform];
    core.debug(
      `Detected platform ${platform} while downloading multiplatform link, selected ${link.$value}`,
    );
  }

  try {
    const ext = path.extname(link.$value);
    if (!readonlyIncludes(allowedExtensions, ext)) {
      return {
        succeeded: false,
        detailedReason: `Download link ${link.$value} does not have a supported extension`,
      };
    }
    let resultPath = await tc.downloadTool(link.$value, dest);
    // if the link is obviously a link to a file, try to read the filename and rename. otherwise leave as is
    if (link.$value.includes('/')) {
      const fileName = link.$value.substring(link.$value.lastIndexOf('/') + 1);
      const newPath = path.join(path.dirname(resultPath), fileName);
      await io.mv(resultPath, newPath);
      resultPath = newPath;
    }

    const fileContent = await readFile(resultPath);
    const actualHash = crypto
      .createHash('sha256')
      .update(fileContent)
      .digest('hex');
    const expectedHash = link.__SHA256.toLowerCase();
    if (verifyHash && actualHash !== expectedHash) {
      return {
        succeeded: false,
        detailedReason: `Expected hash ${expectedHash}, got ${actualHash} instead`,
      };
    }
    return { succeeded: true, fileType: ext, resultPath };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected failure';
    return { succeeded: false, detailedReason: message };
  }
}
