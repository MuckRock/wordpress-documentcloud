# DocumentCloud WordPress plugin

The DocumentCloud WordPress plugin lets you embed [DocumentCloud](https://www.documentcloud.org/) resources into WordPress content using [shortcodes](https://codex.wordpress.org/Shortcode_API).

    [documentcloud url="https://www.documentcloud.org/documents/282753-lefler-thesis.html"]

## Installation

1. Upload the contents of the `src/documentcloud` plugin to `wp-content/plugins/documentcloud`
2. Activate the plugin through the "Plugins" menu
3. In your posts, embed documents, pages, or notes using the DocumentCloud button or the `[documentcloud]` shortcode
4. Optional: Set a default width/height for all DocumentCloud embeds (which can be overridden on a per-embed basis with the `height/width` attributes) at Settings > DocumentCloud. (This default width will only be used if you set `responsive="false"` on an embed.)

**Upgrading from Navis DocumentCloud:** If you're currently using the Navis DocumentCloud plugin (from which this plugin was built), you'll want to deactivate or delete it before installing this plugin.

## Usage

This plugin allows you to embed DocumentCloud resources using either the raw URL on its own line:

    Here's something you should really take a look at:

    https://www.documentcloud.org/documents/282753-lefler-thesis.html

    Isn't that interesting?

Or a custom shortcode:

    [documentcloud url="https://www.documentcloud.org/documents/282753-lefler-thesis.html"]

When you save, WordPress fetches and stores the actual embed code HTML from the DocumentCloud servers using oEmbed. You can freely toggle between visual and HTML mode without mangling embed code, and your embed will always be up to date with the latest embed code.

By default, documents will have a responsive width (it will narrow and widen as necessary to fill available content area) and use the theme's default height. If you want to override this, you can either set `responsive="false"` or explicitly set a `width`:

    [documentcloud url="https://www.documentcloud.org/documents/282753-lefler-thesis.html" width="600"]

You can set your own defaults in Settings > DocumentCloud, but default widths will be ignored unless `responsive` is disabled:

    [documentcloud url="https://www.documentcloud.org/documents/282753-lefler-thesis.html" responsive="false"]

To embed a single page, use any page-specific URL. Pages ignore `width/height` and always act responsively:

    [documentcloud url="https://www.documentcloud.org/documents/282753-lefler-thesis.html#document/p1"]

To embed a note, use any note-specific URL. Notes ignore `width/height` and always act responsively:

    [documentcloud url="https://www.documentcloud.org/documents/282753-lefler-thesis.html#document/p1/a53674"]

To control which view is displayed by default, use the `mode` parameter:

    [documentcloud url="https://www.documentcloud.org/documents/282753-lefler-thesis.html" mode="notes"]
    [documentcloud url="https://www.documentcloud.org/documents/282753-lefler-thesis.html" mode="text"]
    [documentcloud url="https://www.documentcloud.org/documents/282753-lefler-thesis.html" mode="grid"]

Here's the full list of embed options you can pass via shortcode attributes; some are specific to the type of resource you're embedding.


### All resources:

- `url` (**required**, string): Full URL of the DocumentCloud resource.
- `container` (string): ID of element to insert the embed into; if excluded, embedder will create its own container.

### Documents only:

- `height` (integer): Maximum height (in pixels) of the embed.
- `width` (integer): Maximum width (in pixels) of the embed.
- `page` (integer): Page number to have the document scroll to by default.
- `note` (integer): ID of the note that the document should highlight by default.
- `notes` (boolean): Hide or show notes.
- `search` (boolean): Hide or show search form.
- `sidebar` (boolean): Hide or show sidebar.
- `pdf` (boolean): Hide or show link to download original PDF.
- `text` (boolean): Hide or show text tab.
- `zoom` (boolean): Hide or show zoom slider.
- `mode` (string): Display mode for the document viewer. Valid values: `document`, `notes`, `text`, `grid`. Controls which view is shown by default.
- `format` (string): Indicate to the theme that this is a wide asset by setting this to `wide`. Defaults `normal`.

Or as a Gutenberg Block :

    DocumentCloud
Icon - ![DocumentCloud Block Icon](assets/DocumentCloud-Block-Icon.svg)

Here's the list of settings that can be used for the block:
- `WIDTH` (number): Sets the width of the document (optional)
- `HEIGHT` (number): Sets the height of the document (optional)
- `STYLE` (string): Adds additional style to the embedded document  (optional)

The following options can only be used for Documents:
- `Show Title` (toggle): Determines whether to show the title of the embedded document
- `Show FullScreen Button` (toggle): Determines whether to show a full screen icon on the document
- `Only Show Organization` (toggle): Determines whether to only show the organization name that published the document.
- `Show PDF Download Link` (toggle): Determines whether to show the download as pdf icon for documents.

**Note** - The default width and height from the Settings does not work for the Gutenberg Block.

You can read more about publishing and embedding DocumentCloud resources on https://www.documentcloud.org/help/publishing.

## How the oEmbed endpoint is discovered

To make a resource [discoverable](http://oembed.com/#section4) by oEmbed consumers, you can include a `<link>` tag that specifies the oEmbed endpoint URL. So in one version of reality, once you tell WordPress "this resource is oEmbeddable", WordPress would cURL the resource URL, look for the oEmbed link tag in its header, pluck out the oEmbed endpoint from the `<link>` tag's `href`, and then hit that endpoint for the embed code. In our actual reality, that's considered a waste of a cURL, so we have to actually describe the format of our oEmbed endpoint within WordPress itself.

## Caching

Ideally, when WordPress hits our oEmbed service to fetch the embed code, it would obey the `cache_age` we return. Despite [conversation](https://core.trac.wordpress.org/ticket/14759) around this, it doesn't seem to.

Instead, it lets us choose between no cache at all (so *every pageload* triggers a call to our oEmbed service to get the embed code) or a supposed 24-hour cache stored in the `postmeta` table. Unfortunately, [our tests](https://github.com/documentcloud/wordpress-documentcloud/issues/20) seem to show this cache is never expired, which means we can choose between no cache (thus possibly DDOSing ourselves) or a permanent cache (thus possibly having stale embed codes). We've chosen the latter; hopefully this cache does eventually expire, and our embed codes shouldn't change that often anyway.

If you find yourself absolutely needing to expire the cache, though, you have two choices:

1. Delete the appropriate `_oembed_*` rows from your `postmeta` table.
2. Modify the shortcode attributes for the embed, since this is recognized as a new embed by WordPress.

## Development

Plugin files are located in `src/documentcloud` and WordPress core files in `src/wordpress`.

Docker is used to spin up a development WordPress environment using a **build-based approach**. Files are copied into the container during build time, providing complete isolation between local development and the running container.

Unit tests are setup using PHPUnit and Jest, please refer to [Testing Setup ](./TESTING.md) for the setup steps

### Install

```sh
# Build and start services
docker compose build wordpress
docker compose up -d
```

1. Go to [`localhost:8000`](http://localhost:8000)
2. Create an account. Save the username and password, then log in.
3. Go to the Plugins section, then activate the "DocumentCloud" plugin.

### Making Changes During Development

**Important:** This setup uses a build-based approach instead of volume mounts for complete isolation and reproducible builds.

#### Fast Development Workflow (Recommended)

Use Docker Compose's built-in watch mode for automatic file syncing:

```sh
# Start services with watch mode enabled
docker compose watch

# Or run in background
docker compose up -d && docker compose watch
```

- **PHP files** are synced instantly to the container (no rebuild needed)
- **JavaScript/Block changes** trigger an automatic rebuild with the new assets

The watch configuration automatically:
- Syncs plugin PHP files and assets in real-time
- Rebuilds when `blocks/src/` or `package.json` changes
- Ignores changes to `node_modules/` and build artifacts
- Handles file permissions correctly

#### Full Container Rebuild

For major changes or when syncing isn't sufficient, rebuild the container:

```sh
# Rebuild and restart
docker compose down
docker compose build wordpress
docker compose up -d
```

### File Structure
- `src/documentcloud/` - DocumentCloud plugin source files
- `src/wordpress/` - WordPress core files (copied to container during build)
- `Dockerfile.wordpress` - Multi-stage build that compiles blocks and copies all files
- `docker-compose.yml` - No volume mounts, uses custom built image

### Test

Tests can be run in a separate container called `testing`.

To test the PHP plugin, use `phpunit` command inside the testing container's `bash` shell after setting it up:

```sh
# 1. Open a shell into the testing service
docker compose exec -it testing bash

# 2. Install the WordPress Test Suite anytime you rebuild the container
./bin/install-wp-tests.sh test root password db latest

# 3. Now the container is ready to run PHPUnit Tests
phpunit
```

To test the JS Gutenberg block, use `npm test` command inside the testing container's `bash` shell after setting it up:

```sh
# 1. Open a shell into the testing service
docker compose exec -it testing bash

# 2. Navigate to the blocks directory
cd src/documentcloud/blocks

# 3. Install Node modules
npm i --force

# 4. Now the container is ready to run Jest tests
npm test
```

Find more advanced instructions in `TESTING.md`

### Package for release

To create a new release:

1. Update the version number in `src/documentcloud/documentcloud.php` and `src/documentcloud/readme.txt`
2. Update changelog for new version in `README.md` and `src/documentcloud/readme.txt`
3. Run `package-plugin.sh` to generate ZIP file for distribution

## Changelog

### 0.7.0
* Removes the `responsive` and `responsive_offset` options.
    All embeds are rendered responsively, so this option is now deprecated.
    The `height` and `width` of the embed can still be limited with their respective options, but the embeds will respond to the size of their container.
* Add `mode` parameter to control document viewer display mode. Valid values: `document`, `notes`, `text`, `grid`.

### 0.6.0
* Add Gutenberg block for embedding DocumentCloud documents resonating a functionality similar to the shortcode.
* Update the shortcode to support the following attributes
  * `onlyshoworg` - When set to 1 it only displays the organization name
  * `pdf` - When set to 1 it shows a pdf download icon
  * `showfullscreen` - When set to 1 it displays a full screen icon.
  * `title` - When set to 1 it displays the title of the document.
* Allow setting the query parameter attributes when directly embedding the url in Embed block.

### 0.5.1

* Expand regex support to catch more DocumentCloud URLs

### 0.5.0
* Add support for the DocumentCloud beta

### 0.4.3
* Separate the oEmbed config options (provided as params to the endpoint) from the embed config options (encoded as params on the `url`) (#48)
* Rename `default_page` and `default_note` options back to `page` and `note` (#47)
* Remove `sidebar`, `text`, and `pdf` default values

### 0.4.2
* Recognize Unicode document slugs (#37)

### 0.4.1
* Conform syntax to WordPress VIP plugin requirements (#30) (@bcampeau)
* Fixed: Bare URLs now get default parameters (#35)
* Fixed: Pages/notes on docs with uppercase slugs now embeddable (#36)

### 0.4.0
* Support embedding pages (#28)
* Support embedding raw contextual page/note URLs (#29)
* Check for existence of things to stop triggering PHP notices (#27)
* Add DocumentCloud logo for plugin (#26)
* Fix ability to specify a container in the shortcode
* Improve embeddable resource pattern recognition

### 0.3.3
* Remove unused TinyMCE components
* Resolve CVE-2015-2807 reported by dxw Security at https://security.dxw.com/advisories/publicly-exploitable-xss-in-wordpress-plugin-navis-documentcloud/

### 0.3.2
* Implement a few best practice security measures

### 0.3.1
* Check for old (Navis) plugin and warn admins of conflict
* Add note about raw URLs to README
* Stop storing shortcode attributes in the `postmeta` table

### 0.3
* Add support for embedding notes.
* Default to responsive.
* Enable caching.

### 0.2
* Fetch embed code via oEmbed instead of generating statically.
* Add new options: `container`, `responsive`, `responsive_offset`, `default_page`, `default_note`, `notes`, `search`, and `zoom`.
* Deprecate `id` attribute. It's still usable, but support may drop in the future. Use `url` instead.

### 0.1
* Initial release.

## License and History

The DocumentCloud WordPress plugin is [GPLv2](http://www.gnu.org/licenses/gpl-2.0.html). Initial development of this plugin by Chris Amico (@eyeseast) supported by [NPR](http://www.npr.org) as part of the [StateImpact](http://stateimpact.npr.org) project. Development continued by Justin Reese (@reefdog) at [DocumentCloud](https://www.documentcloud.org/).

