import { readFile } from 'fs/promises';
import { XMLParser } from 'fast-xml-parser';

import * as tc from '@actions/tool-cache';

const alwaysArray = [
  'ApiLinks.Manifest.Files.File',
  'ModLinks.Manifest',
  'ModLinks.Manifest.Dependencies.Dependency',
];

const parser = new XMLParser({
  ignoreDeclaration: true,
  ignoreAttributes: false,
  attributeNamePrefix: '__',
  textNodeName: '$value',
  isArray: (_, jPathOrMatcher) =>
    alwaysArray.includes(
      typeof jPathOrMatcher === 'string'
        ? jPathOrMatcher
        : jPathOrMatcher.toString(),
    ),
});

async function downloadAndParseXml(link: string): Promise<unknown> {
  const filePath = await tc.downloadTool(link);
  const content = await readFile(filePath, 'utf-8');
  return parser.parse(content);
}

export const parseApiLinks = async (): Promise<unknown> =>
  await downloadAndParseXml(
    'https://raw.githubusercontent.com/hk-modding/modlinks/main/ApiLinks.xml',
  );

export const parseModLinks = async (): Promise<unknown> =>
  await downloadAndParseXml(
    'https://raw.githubusercontent.com/hk-modding/modlinks/main/ModLinks.xml',
  );
