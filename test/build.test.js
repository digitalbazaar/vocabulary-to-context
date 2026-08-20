/*!
 * Copyright (c) 2026 Digital Bazaar, Inc. All rights reserved.
 */
import {expect} from 'chai';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {buildVocab} from '../index.js';

test('builds all vocabulary artifacts from template.html', async t => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'vocab-context-'));
  t.after(() => fs.rm(directory, {recursive: true, force: true}));

  await Promise.all([
    fs.writeFile(path.join(directory, 'vocabulary.yml'), `
vocab:
  id: ex
  value: https://example.com/vocab#
ontology:
  - property: dc:title
    value: Example Vocabulary
  - property: dc:description
    value: <p>An introduction</p>
  - property: dc:abstract
    value: An abstract
class:
  - id: Example
    label: Example
    comment: An example class.
    context: https://example.com/vocab#
property:
  - id: name
    label: Name
    range: xsd:string
    comment: The example name.
    context: https://example.com/vocab#
`),
    fs.writeFile(path.join(directory, 'template.html'),
      '<html><body><h1>Consumer-owned title</h1></body></html>')
  ]);

  await buildVocab({baseDir: directory});

  const filenames = [
    'vocabulary.html',
    'vocabulary.context.jsonld',
    'vocabulary.jsonld',
    'vocabulary.ttl'
  ];
  for(const filename of filenames) {
    const outputPath = path.join(directory, filename);
    expect((await fs.stat(outputPath)).size).to.be.greaterThan(0);
  }
  expect(await fs.readFile(
    path.join(directory, 'vocabulary.html'), 'utf8'))
    .to.match(/Consumer-owned title/);
  expect(JSON.parse(await fs.readFile(
    path.join(directory, 'vocabulary.context.jsonld'),
    'utf8'))['@context'].id).to.equal('@id');
});
