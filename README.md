# @digitalbazaar/vocabulary-to-context

Build a YAML vocabulary into consistent HTML, JSON-LD, JSON-LD context, and
Turtle files. This package provides a small wrapper around
[`yml2vocab`](https://github.com/w3c/yml2vocab).

## Environment

- Node.js 24 or newer.
- An ES module project with a YAML vocabulary and HTML template.

## Setup

1. Install the package:

   ```sh
   npm install --save-dev @digitalbazaar/vocabulary-to-context
   ```

2. Add these files to the vocabulary project:

   - `vocabulary.yaml` (or `vocabulary.yml`)
   - `template.html`

3. Create a build script:

   ```js
   // build.js
   import {buildVocab} from '@digitalbazaar/vocabulary-to-context';

   await buildVocab();
   ```

4. Run the script:

   ```sh
   node build.js
   ```

## What it does

The build reads the YAML vocabulary, alphabetizes its class and property
definitions, and passes the vocabulary and template to `yml2vocab`. It writes:

- `vocabulary.html`
- `vocabulary.context.jsonld`
- `vocabulary.jsonld`
- `vocabulary.ttl`

## Options

Use `baseDir` for a vocabulary in another directory, or explicitly provide the
YAML and template paths:

```js
await buildVocab({
  baseDir: './vocabulary',
  // yamlFilePath: './vocabulary/vocabulary.yaml',
  // templateFilePath: './vocabulary/template.html'
});
```

### JSON-LD aliases

By default, the generated context adds `id: "@id"` and `type: "@type"` at
the top level and in nested contexts. This is an opinionated convenience that
lets consumers use `id` and `type` without the `@` prefix.

Disable the aliases:

```js
await buildVocab({jsonLdAliases: false});
```

Or replace them with your own names:

```js
await buildVocab({
  jsonLdAliases: {
    identifier: '@id',
    kind: '@type'
  }
});
```

Custom aliases replace the defaults and are applied recursively. Alias names
should not collide with vocabulary terms.

## Development

Run `npm test` and `npm run lint`. The project uses
[`@digitalbazaar/eslint-config`](https://github.com/digitalbazaar/eslint-config-digitalbazaar).

## Commercial Support

Commercial support for this library is available upon request from
Digital Bazaar: support@digitalbazaar.com

## License

[New BSD License (3-clause)](LICENSE) © 2026 Digital Bazaar
