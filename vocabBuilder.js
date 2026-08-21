/*!
 * Copyright (c) 2026 Digital Bazaar, Inc.
 */
import {dump as dumpYaml, load as loadYaml} from 'js-yaml';
import fs from 'node:fs/promises';
import path from 'node:path';
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
async function _loadModel({yamlFilePath}) {
  const yamlText = await fs.readFile(yamlFilePath, 'utf8');
  return loadYaml(yamlText);
}

/**
 * Finds the first existing file from a list of file paths.
 *
 * @param {object} options - The options to use.
 * @param {string[]} options.filePaths - The list of file paths to check.
 * @param {string} options.errorMessage - The error message to throw if no file
 * is found.
 *
 * @returns {Promise<string>} The first existing file path.
 *
 * @throws {Error} If no file is found, throws an error with the provided
 * message.
 */
async function _getExistingFile({
  filePaths,
  errorMessage = `Missing file: ${filePaths.join(' or ')}.`
}) {
  for(const filePath of filePaths) {
    try {
      await fs.access(filePath);
      return filePath;
    } catch(error) {
      if(error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
  throw new Error(errorMessage);
}

/**
 * Loads an HTML template without modifying it.
 *
 * @param {object} options - The options to use.
 * @param {string} options.templateFilePath - The path to the HTML template.
 *
 * @returns {Promise<string>} The HTML template.
 */
async function _loadHtmlTemplate({templateFilePath}) {
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
async function _writeHtml({baseDir, html}) {
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
async function _writeContext({baseDir, yamlObj}) {
  const yamlUpdate = dumpYaml(yamlObj);
  const vocab = new yml2vocab.VocabGeneration(yamlUpdate);

  // `vocabulary.context.jsonld` is the default filename used by yml2vocab
  const contextPath = path.join(baseDir, 'vocabulary.context.jsonld');
  const generatedContext = JSON.parse(_useHttpsUrls({
    content: vocab.getContext()}));
  _addJsonLdAliases({context: generatedContext['@context']});
  await fs.writeFile(contextPath, JSON.stringify(generatedContext));
}

/**
 * Sorts the definitions alphabetically.
 *
 * @param {object} options - The options to use.
 * @param {object} options.yamlObj - The parsed vocabulary.
 */
function _sortDefinitions({yamlObj}) {
  for(const definitions of [yamlObj.property, yamlObj.class]) {
    definitions.sort((firstDefinition, secondDefinition) => {
      const firstDefId = firstDefinition.id.split(':').pop();
      const secondDefId = secondDefinition.id.split(':').pop();
      if(firstDefId < secondDefId) {
        return -1;
      }
      if(firstDefId > secondDefId) {
        return 1;
      }
      return 0;
    });
  }
}

/**
 * Builds a vocabulary using `vocabulary.yaml` and an unchanged `template.html`.
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
  yamlFilePath,
  templateFilePath = path.join(baseDir, 'template.html')
} = {}) {
  const yamlPaths = yamlFilePath ? [yamlFilePath] : [
    path.join(baseDir, 'vocabulary.yaml'),
    path.join(baseDir, 'vocabulary.yml')
  ];
  yamlFilePath = await _getExistingFile({
    filePaths: yamlPaths,
    errorMessage: `Missing vocabulary file: expected ${yamlPaths.join(' or ')}.`
  });
  templateFilePath = await _getExistingFile({
    filePaths: [templateFilePath],
    errorMessage: `Missing HTML template: ${templateFilePath}.`
  });

  const yamlObj = await _loadModel({yamlFilePath});
  _sortDefinitions({yamlObj});
  const vocab = new yml2vocab.VocabGeneration(dumpYaml(yamlObj));

  const template = await _loadHtmlTemplate({templateFilePath});
  const html = _useHttpsUrls({content: vocab.getHTML(template)});
  await _writeHtml({baseDir, html});
  await _writeContext({baseDir, yamlObj});

  // `vocabulary.jsonld` is the default filename used by yml2vocab
  await fs.writeFile(
    path.join(baseDir, 'vocabulary.jsonld'),
    _useHttpsUrls({content: vocab.getJSONLD()}));
  // `vocabulary.ttl` is the default filename used by yml2vocab
  await fs.writeFile(
    path.join(baseDir, 'vocabulary.ttl'),
    _useHttpsUrls({content: vocab.getTurtle()}));
}
