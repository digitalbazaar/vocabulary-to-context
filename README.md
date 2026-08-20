# @digitalbazaar/vocabulary-to-context

Tools for consistent use of yml2vocab and output of JSON-LD contexts.

Install it with `npm i --save-dev @digitalbazaar/vocabulary-to-context`, then
call it from the consuming project's `build.js`:

```js
import {buildVocab} from '@digitalbazaar/vocabulary-to-context';

await buildVocab();
```

The project should contain `vocabulary.yml` and `template.html`. The template is
passed unchanged to `yml2vocab`.
