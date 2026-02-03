import { downloadTool as downloadToolMock } from '../__fixtures__/tool-cache.js';
import { readFile as readFileMock } from '../__fixtures__/fsPromises.js';

import { test, expect, jest } from '@jest/globals';

jest.unstable_mockModule('@actions/tool-cache', () => ({
  downloadTool: downloadToolMock,
}));
jest.unstable_mockModule('fs/promises', () => ({ readFile: readFileMock }));

// import of the module under test must happen dynamically and last, so that mocks can happen
const { parseApiLinks, parseModLinks } = await import('../src/xml-util.js');

const apiLinksSimplest = `
<?xml version="1.0"?>
<ApiLinks>
    <Manifest>
        <Version>69</Version>
        <Links>
            <Linux SHA256="b1d9266cf98bba8c02e9208e79935074424ffc1263bcadc8f31f911e01d6af29">
                <![CDATA[https://github.com/hk-modding/api/releases/download/1.5.78.11833-69/ModdingApiLinux.zip]]>
            </Linux>
            <Mac SHA256="e650b87d9bbfca3a55e841d675bf683923420a69ffc1da2199f7d1e2303e9b9a">
                <![CDATA[https://github.com/hk-modding/api/releases/download/1.5.78.11833-69/ModdingApiMac.zip]]>
            </Mac>
            <Windows SHA256="4c72f071649df9ce979f523b14265346188f23937105dd64b8004ef821b9574d">
                <![CDATA[https://github.com/hk-modding/api/releases/download/1.5.78.11833-69/ModdingApiWin.zip]]>
            </Windows>
        </Links>
        <Files>
            <File>Assembly-CSharp.dll</File>
        </Files>
    </Manifest>
</ApiLinks>`;

const modLinksSingleLinkNoDep = `
<?xml version="1.0"?>
<ModLinks>
    <Manifest>
        <Name>SteelSoulHUD</Name>
        <Description>Enables the Steel Soul HUD in normal mode.</Description>
        <Version>1.0.0.0</Version>
        <Link SHA256="C411A892B6409537EF01625EE3B42722D4C0FBA4F051316096939CE0DD46A7AF">
            <![CDATA[https://github.com/dpinela/SteelSoulHUD/releases/download/v1.0/SteelSoulHUD.zip]]>
        </Link>
        <Dependencies />
    </Manifest>
</ModLinks>`;

const modLinksSingleLinkWithDep = `
<?xml version="1.0"?>
<ModLinks>
  <Manifest>
    <Name>QoL</Name>
    <Description>A collection of various quality of life improvements.</Description>
    <Version>4.2.0.0</Version>
    <Link SHA256="55FBBAE4B666D0BB83201A14DE0AF662D417B174F502E0E0F919A012B42B4EE9">
        <![CDATA[https://github.com/fifty-six/HollowKnight.QoL/releases/download/v4.2/QoL.zip]]>
    </Link>
    <Dependencies>
        <Dependency>Vasi</Dependency>
    </Dependencies>
  </Manifest>
</ModLinks>`;

const modMultiLinks = `
<?xml version="1.0"?>
<ModLinks>
  <Manifest>
    <Name>QoL</Name>
    <Description>A collection of various quality of life improvements.</Description>
    <Version>4.2.0.0</Version>
    <Links>
      <Linux SHA256="55FBBAE4B666D0BB83201A14DE0AF662D417B174F502E0E0F919A012B42B4EE9">
          <![CDATA[https://github.com/fifty-six/HollowKnight.QoL/releases/download/v4.2/QoL.zip]]>
      </Link>
      <Mac SHA256="55FBBAE4B666D0BB83201A14DE0AF662D417B174F502E0E0F919A012B42B4EE9">
          <![CDATA[https://github.com/fifty-six/HollowKnight.QoL/releases/download/v4.2/QoL.zip]]>
      </Link>
      <Windows SHA256="55FBBAE4B666D0BB83201A14DE0AF662D417B174F502E0E0F919A012B42B4EE9">
          <![CDATA[https://github.com/fifty-six/HollowKnight.QoL/releases/download/v4.2/QoL.zip]]>
      </Link>
    </Links>
    <Dependencies>
        <Dependency>Vasi</Dependency>
        <Dependency>SomeOtherMod</Dependency>
    </Dependencies>
  </Manifest>
</ModLinks>`;

const modLinksMultipleManifests = `
<?xml version="1.0"?>
<ModLinks>
  <Manifest>
      <Name>SteelSoulHUD</Name>
      <Description>Enables the Steel Soul HUD in normal mode.</Description>
      <Version>1.0.0.0</Version>
      <Link SHA256="C411A892B6409537EF01625EE3B42722D4C0FBA4F051316096939CE0DD46A7AF">
          <![CDATA[https://github.com/dpinela/SteelSoulHUD/releases/download/v1.0/SteelSoulHUD.zip]]>
      </Link>
      <Dependencies />
  </Manifest>
  <Manifest>
    <Name>QoL</Name>
    <Description>A collection of various quality of life improvements.</Description>
    <Version>4.2.0.0</Version>
    <Link SHA256="55FBBAE4B666D0BB83201A14DE0AF662D417B174F502E0E0F919A012B42B4EE9">
        <![CDATA[https://github.com/fifty-six/HollowKnight.QoL/releases/download/v4.2/QoL.zip]]>
    </Link>
    <Dependencies>
        <Dependency>Vasi</Dependency>
    </Dependencies>
  </Manifest>
</ModLinks>`;

beforeEach(() => {
  downloadToolMock.mockResolvedValue('tmp/asdf.zip');
});

afterEach(() => {
  downloadToolMock.mockClear();
  readFileMock.mockClear();
});

test('parses minimal API links', async () => {
  readFileMock.mockResolvedValue(apiLinksSimplest);
  expect(await parseApiLinks()).toEqual({
    ApiLinks: {
      Manifest: {
        Version: 69,
        Links: {
          Linux: {
            $value:
              'https://github.com/hk-modding/api/releases/download/1.5.78.11833-69/ModdingApiLinux.zip',
            __SHA256:
              'b1d9266cf98bba8c02e9208e79935074424ffc1263bcadc8f31f911e01d6af29',
          },
          Mac: {
            $value:
              'https://github.com/hk-modding/api/releases/download/1.5.78.11833-69/ModdingApiMac.zip',
            __SHA256:
              'e650b87d9bbfca3a55e841d675bf683923420a69ffc1da2199f7d1e2303e9b9a',
          },
          Windows: {
            $value:
              'https://github.com/hk-modding/api/releases/download/1.5.78.11833-69/ModdingApiWin.zip',
            __SHA256:
              '4c72f071649df9ce979f523b14265346188f23937105dd64b8004ef821b9574d',
          },
        },
        Files: {
          File: ['Assembly-CSharp.dll'],
        },
      },
    },
  });
});

test('parses minimal mod links, no dependencies', async () => {
  readFileMock.mockResolvedValue(modLinksSingleLinkNoDep);
  expect(await parseModLinks()).toEqual({
    ModLinks: {
      Manifest: [
        {
          Name: 'SteelSoulHUD',
          Description: 'Enables the Steel Soul HUD in normal mode.',
          Version: '1.0.0.0',
          Link: {
            $value:
              'https://github.com/dpinela/SteelSoulHUD/releases/download/v1.0/SteelSoulHUD.zip',
            __SHA256:
              'C411A892B6409537EF01625EE3B42722D4C0FBA4F051316096939CE0DD46A7AF',
          },
          Dependencies: '',
        },
      ],
    },
  });
});

test('parses minimal mod links, with dependencies', async () => {
  readFileMock.mockResolvedValue(modLinksSingleLinkWithDep);
  expect(await parseModLinks()).toEqual({
    ModLinks: {
      Manifest: [
        {
          Name: 'QoL',
          Description: 'A collection of various quality of life improvements.',
          Version: '4.2.0.0',
          Link: {
            $value:
              'https://github.com/fifty-six/HollowKnight.QoL/releases/download/v4.2/QoL.zip',
            __SHA256:
              '55FBBAE4B666D0BB83201A14DE0AF662D417B174F502E0E0F919A012B42B4EE9',
          },
          Dependencies: {
            Dependency: ['Vasi'],
          },
        },
      ],
    },
  });
});

test('parses multiplatform mod links', async () => {
  readFileMock.mockResolvedValue(modMultiLinks);
  expect(await parseModLinks()).toEqual({
    ModLinks: {
      Manifest: [
        {
          Name: 'QoL',
          Description: 'A collection of various quality of life improvements.',
          Version: '4.2.0.0',
          Links: {
            Linux: {
              $value:
                'https://github.com/fifty-six/HollowKnight.QoL/releases/download/v4.2/QoL.zip',
              __SHA256:
                '55FBBAE4B666D0BB83201A14DE0AF662D417B174F502E0E0F919A012B42B4EE9',
            },
            Mac: {
              $value:
                'https://github.com/fifty-six/HollowKnight.QoL/releases/download/v4.2/QoL.zip',
              __SHA256:
                '55FBBAE4B666D0BB83201A14DE0AF662D417B174F502E0E0F919A012B42B4EE9',
            },
            Windows: {
              $value:
                'https://github.com/fifty-six/HollowKnight.QoL/releases/download/v4.2/QoL.zip',
              __SHA256:
                '55FBBAE4B666D0BB83201A14DE0AF662D417B174F502E0E0F919A012B42B4EE9',
            },
          },
          Dependencies: {
            Dependency: ['Vasi', 'SomeOtherMod'],
          },
        },
      ],
    },
  });
});

test('parses modlinks with multiple manifests', async () => {
  readFileMock.mockResolvedValue(modLinksMultipleManifests);
  expect(await parseModLinks()).toEqual({
    ModLinks: {
      Manifest: [
        {
          Name: 'SteelSoulHUD',
          Description: 'Enables the Steel Soul HUD in normal mode.',
          Version: '1.0.0.0',
          Link: {
            $value:
              'https://github.com/dpinela/SteelSoulHUD/releases/download/v1.0/SteelSoulHUD.zip',
            __SHA256:
              'C411A892B6409537EF01625EE3B42722D4C0FBA4F051316096939CE0DD46A7AF',
          },
          Dependencies: '',
        },
        {
          Name: 'QoL',
          Description: 'A collection of various quality of life improvements.',
          Version: '4.2.0.0',
          Link: {
            $value:
              'https://github.com/fifty-six/HollowKnight.QoL/releases/download/v4.2/QoL.zip',
            __SHA256:
              '55FBBAE4B666D0BB83201A14DE0AF662D417B174F502E0E0F919A012B42B4EE9',
          },
          Dependencies: {
            Dependency: ['Vasi'],
          },
        },
      ],
    },
  });
});
