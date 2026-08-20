/*!
 * Copyright (c) 2026 Digital Bazaar, Inc. All rights reserved.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';
import yml2vocab from 'yml2vocab';

/**
 * Replace all `http://` URLs with `https://` in the given content.
 *
 * @param {object} options - The options to use.
 * @param {string} options.content - The content to modify.
 *
 * @returns {string} The modified content with `https://` URLs.
 */
function _useHttpsUrls({content}) {
  return content.replaceAll('http://', 'https://');
}

/**
 * Adds JSON-LD aliases to the given context.
 *
 * @param {object} options - The options to use.
 * @param {object} options.context - The context to modify.
 */
function _addJsonLdAliases({context}) {
  context.id = '@id';
  context.type = '@type';

  // Recursively add aliases to nested contexts
  for(const value of Object.values(context)) {
    if(value?.['@context']) {
      _addJsonLdAliases({context: value['@context']});
    }
  }
}

/**
 * Loads a YAML vocabulary.
 *
 * @param {object} options - The options to use.
 * @param {string} options.yamlFilePath - The path to the YAML vocabulary.
 *
 * @returns {Promise<object>} The parsed vocabulary.
 */
export async function loadModel({yamlFilePath}) {
  const yamlText = await fs.readFile(yamlFilePath, 'utf8');
  return yaml.load(yamlText);
}

/**
 * Loads an HTML template without modifying it.
 *
 * @param {object} options - The options to use.
 * @param {string} options.templateFilePath - The path to the HTML template.
 *
 * @returns {Promise<string>} The HTML template.
 */
export async function loadHtmlTemplate({templateFilePath}) {
  return fs.readFile(templateFilePath, 'utf8');
}

/**
 * Writes the generated HTML vocabulary.
 *
 * @param {object} options - The options to use.
 * @param {string} options.baseDir - The output directory.
 * @param {string} options.html - The generated HTML vocabulary.
 *
 * @returns {Promise<void>} Resolves when the file has been written.
 */
export async function writeHtml({baseDir, html}) {
  // `vocabulary.html` is the default filename used by yml2vocab
  const htmlPath = path.join(baseDir, 'vocabulary.html');
  await fs.writeFile(htmlPath, html);
}

/**
 * Writes the generated JSON-LD context.
 *
 * @param {object} options - The options to use.
 * @param {string} options.baseDir - The output directory.
 * @param {object} options.yamlObj - The parsed vocabulary.
 *
 * @returns {Promise<void>} Resolves when the file has been written.
 */
export async function writeContext({baseDir, yamlObj}) {
  const yamlUpdate = yaml.dump(yamlObj);
  const vocab = new yml2vocab.VocabGeneration(yamlUpdate);

  // `vocabulary.context.jsonld` is the default filename used by yml2vocab
  const contextPath = path.join(baseDir, 'vocabulary.context.jsonld');
  const generatedContext = JSON.parse(_useHttpsUrls({
    content: vocab.getContext()}));
  _addJsonLdAliases({context: generatedContext['@context']});
  await fs.writeFile(contextPath, JSON.stringify(generatedContext));
}

function _sortDefinitions({yamlObj}) {
  for(const definitions of [yamlObj.property, yamlObj.class]) {
    definitions.sort((a, b) => a.id.split(':').pop().localeCompare(
      b.id.split(':').pop()));
  }
}

/**
 * Builds a vocabulary using `vocabulary.yml` and an unchanged `template.html`.
 *
 * @param {object} [options={}] - The options to use.
 * @param {string} [options.baseDir='.'] - The vocabulary project directory.
 * @param {string} [options.yamlFilePath] - The vocabulary YAML path.
 * @param {string} [options.templateFilePath] - The HTML template path.
 *
 * @returns {Promise<void>} Resolves when the vocabulary has been built.
 */
export async function buildVocab({
  baseDir = '.',
  yamlFilePath = path.join(baseDir, 'vocabulary.yml'),
  templateFilePath = path.join(baseDir, 'template.html')
} = {}) {
  const yamlObj = await loadModel({yamlFilePath});
  _sortDefinitions({yamlObj});
  const vocab = new yml2vocab.VocabGeneration(yaml.dump(yamlObj));

  const template = await loadHtmlTemplate({templateFilePath});
  const html = _useHttpsUrls({content: vocab.getHTML(template)});
  await writeHtml({baseDir, html});
  await writeContext({baseDir, yamlObj});

  // `vocabulary.jsonld` is the default filename used by yml2vocab
  await fs.writeFile(
    path.join(baseDir, 'vocabulary.jsonld'),
    _useHttpsUrls({content: vocab.getJSONLD()}));
  // `vocabulary.ttl` is the default filename used by yml2vocab
  await fs.writeFile(
    path.join(baseDir, 'vocabulary.ttl'),
    _useHttpsUrls({content: vocab.getTurtle()}));
}
