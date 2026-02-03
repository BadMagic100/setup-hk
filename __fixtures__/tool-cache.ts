import * as toolCache from '@actions/tool-cache';
import { jest } from '@jest/globals';

export const downloadTool = jest.fn<typeof toolCache.downloadTool>();
