import * as fsPromises from 'fs/promises';
import { jest } from '@jest/globals';

export const readFile = jest.fn<typeof fsPromises.readFile>();
