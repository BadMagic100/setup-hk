## setup-hk

![test status](https://github.com/BadMagic100/setup-hk/actions/workflows/test.yml/badge.svg?branch=main)

setup-hk is a simple action to set up the Hollow Knight Modding API and any dependencies you may have on other mods. These
will be fetched from https://github.com/hk-modding/modlinks unless otherwise specified.

## Usage:

In your workflow definition, declare the following workflow step:

```yaml
- uses: BadMagic100/setup-hk@v1
  with:
    apiPath: API/ # the path that you want your files to be installed at; this is the equivalent of your Managed/ folder locally
    dependencyFilePath: ModDependencies.txt # the path to your dependency definition. optional.
```

If you declare dependencies on other mods, you will need to create a `ModDependencies.txt` in your repo listing your dependencies.
It might look something like this:

```text
MagicUI
ConnectionMetadataInjector as CMI
Satchel as Bag from https://github.com/PrashantMohta/Satchel/releases/download/v0.7.4/Satchel.dll
```

As you can see, there are several ways you can declare a dependency on a mod. The following are all valid:

- `ModName`
- `ModName as SomeAlias`
- `ModName from http://some.url/some-zip-or-dll-file`
- `ModName as SomeAlias from http://some.url/some-zip-or-dll-file`

The mod name is the name of the mod exactly as it appears in modlinks. This is required to resolve chained dependencies. Declaring dependencies on mods that are not in modlinks is not a supported usecase (because you likely won't be able to upload your mod to modlinks either).

The mod alias is the name of the folder the mod will be created in. This is useful if you work on projects that have a different name in
the .dll than they do in modlinks. For example, contributors to Rando4 could use `Randomizer 4 as RandomizerMod` so that they can use/reference their dev build of rando locally, rather than needing to rename their folder structure to make it looks as though it was
installed from scarab.

Finally, you can provide a link to a direct download of the mod. This allows you to reference prerelease dev builds before they are
in modlinks. Like ModLinks, both .dll and .zip files are accepted. The URL **must** end in `/filename.dll` or `/filename.zip` to be
processed appropriately. Be aware that using this method, the hash of your download will not be verified and you should avoid it if
possible. If you are referencing the version of a mod from modlinks, you should not use this syntax and the action will give you a
warning.
