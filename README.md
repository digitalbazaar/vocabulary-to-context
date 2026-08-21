# @digitalbazaar/vocabulary-to-context

Build a vocabulary from YAML and generate consistent JSON-LD, JSON-LD context,
Turtle, and HTML outputs.

## Environment

- Node.js 24 or newer
- A vocabulary project containing a YAML vocabulary and HTML template

## Setup

1. Install the package in the vocabulary project:

   ```sh
   npm install --save-dev @digitalbazaar/vocabulary-to-context
   ```

2. Add these source files to the project root:

   - `vocabulary.yaml` (or `vocabulary.yml`)
   - `template.html`

3. Call `buildVocab` from your build script, for example:

```js
// `build.js`
import {buildVocab} from '@digitalbazaar/vocabulary-to-context';

await buildVocab();
```

4. Run the script:

```sh
node build.js
```

## Output

The build reads the YAML vocabulary, alphabetizes its class and property
definitions, and passes `template.html` to `yml2vocab`. It writes these files in
the project root:

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
