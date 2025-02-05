/**
 * Import Taxonomy Terms from a CSV File
 *
 * This script imports taxonomy terms from a CSV file into a Sanity Content Lake instance.
 * See https://www.sanity.io/guides/guide-importing-data-from-external-sources
 *
 */

import fs from 'fs'
import dotenv from 'dotenv'
import crypto from 'crypto'
import csv from 'csv-parser'
import {createClient} from '@sanity/client'

// 🚨 Change these to your values
const sourceFile = 'topic-taxonomy.csv' // required; expects format described in description
const conceptSchemeName = 'Topic Taxonomy' // required
const baseIri = 'https://studio.sanity.io/taxonomy/' // required; your studio domain is usually a good choice
const conceptSchemeDescription = 'A taxonomy of topics used in Sanity Studio' // optional

// Load environment variables from .env file in this directory
dotenv.config({path: '.env.local'})

const projectId = process.env.STUDIO_PROJECT_ID
const dataset = process.env.STUDIO_DATASET
const token = process.env.TAXONOMY_MIGRATION_TOKEN // ensure the token has write access

if (!token || !projectId || !dataset) {
  throw new Error('Required environment variables are not set.')
}

if (!sourceFile || !conceptSchemeName || !baseIri) {
  throw new Error('Source file, concept scheme name, and base IRI are required.')
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2025-01-01', // current date targets the latest version
  token,
  useCdn: false,
})

// 1. Read CSV file
const headerRows = 4 // Header rows to skip: Google Sheets title, development headers, and instructions
const headers = [
  'topConcept',
  'l1',
  'l2',
  'l3',
  'l4',
  'l5',
  'definition',
  'scopeNote',
  'examples',
  'alternateLabels', // comma separated list, optional
  'hiddenLabels', // comma separated list, optional
  'notes', // not migrated to Sanity
]
const prefLabelKeys = headers.slice(0, 5)

const readCSV = () => {
  return new Promise((resolve, reject) => {
    const results = []
    fs.createReadStream(sourceFile)
      .pipe(csv({headers, skipLines: headerRows}))
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error))
  })
}

// 2. Define the SKOS Concept Scheme
const schemeHash = crypto.createHash('md5').update(conceptSchemeName).digest('hex').slice(0, 12)
const skosConcepts = []
const skosConceptScheme = {
  _type: 'skosConceptScheme',
  _id: `skosConceptScheme${schemeHash}`,
  title: conceptSchemeName,
  description: conceptSchemeDescription || '',
  baseIri,
  schemeId: schemeHash.slice(5, 12),
  topConcepts: [],
  concepts: [],
}

// 3. Create the SKOS Concepts
let previous = {} // used to track the concept "before" the current one
let hierarchy = [] // a snapshot of the hierarchy from the point of view of the current concept
let topConceptSet = false
let broaderDetected = false

// Child concept mapping function
const mapChildConcept = (
  hierarchy,
  currentConcept,
  broaderDetected,
  conceptLevel,
  currentConceptRef,
  toRemove,
) => {
  for (let concept of hierarchy) {
    // add the concept _ref the next level up in the hierarchy to broader[]
    if (concept.level == conceptLevel - 1) {
      const skosConceptRef = {...concept}
      delete skosConceptRef.level
      currentConcept.broader.push(skosConceptRef)
      broaderDetected = true
    }
    // mark any existing concept _ref at this level for removal from the hierarchy array
    if (concept.level == conceptLevel) {
      toRemove.push(concept)
    }
  }
  if (broaderDetected == false) {
    throw new Error(
      `Inconsistent Hierarchy: No broader concept found for the concept "${currentConcept.prefLabel}".`,
    )
  }
  for (let concept of toRemove) {
    hierarchy.splice(hierarchy.indexOf(concept), 1) // remove marked concept from the hierarchy array
  }
  hierarchy.push(currentConceptRef) // update the hierarchy with current concept _ref
  previous = currentConceptRef // set previous to the current concept _ref for the next iteration
}

const mapConcept = (concept) => {
  let prefLabel = null // the location of the prefLabel is use to determine hierarchy position
  let conceptLevel = null
  let mappingLevel = 0
  let count = 0
  let toRemove = [] // used to remove concepts from the hierarchy array to keep it current

  // Verify that the hierarchy array has no more than one concept at each level
  const hierarchyLevels = hierarchy.map((concept) => concept.level)
  hierarchyLevels.some(function (item, index) {
    if (hierarchyLevels.indexOf(item) != index) {
      throw new Error('Mapping hierarchy contains multiple concepts at the same level.')
    }
  })

  // 3a. extract the pref label and level from the first non-empty field in of the concept record
  prefLabelKeys.forEach((key) => {
    if (concept[key]) {
      prefLabel = concept[key]
      conceptLevel = mappingLevel
      count++
    }
    mappingLevel++
  })

  // Verify that one and only one prefLabel has been detected
  if (count == 0) {
    throw new Error('No `prefLabel` specified for a listed skosConcept.')
  } else if (count > 1) {
    throw new Error('More than one `prefLabel` is specified for a listed skosConcept.')
  }

  // Create a hash of the prefLabel to use as the concept _id and _ref _key
  const conceptHash = crypto.createHash('md5').update(prefLabel).digest('hex').slice(0, 12)

  // 3b. Create the skosConcept object ...
  const currentConcept = {
    _id: `skosConcept${conceptHash}`,
    _type: 'skosConcept',
    prefLabel,
    level: conceptLevel, // level is for hierarchy assignment and will not be written to the document
    baseIri,
    conceptId: conceptHash.slice(5, 12),
    broader: [],
    definition: concept.definition,
    scopeNote: concept.scopeNote,
    example: concept.examples,
    altLabel: concept.alternateLabels
      ? concept.alternateLabels.split(',').map((label) => label.trim())
      : [],
    hiddenLabel: concept.hiddenLabels
      ? concept.hiddenLabels.split(',').map((label) => label.trim())
      : [],
  }

  //      ... and the concept _ref object that will be used as a reference
  const currentConceptRef = {
    _ref: currentConcept._id,
    _key: conceptHash.slice(0, 6),
    _type: 'reference',
    level: currentConcept.level, // level is for hierarchy assignment and will not be written to the document
  }

  // 3c. Map concepts to the hierarchy
  if (conceptLevel == 0) {
    // Top Concept
    hierarchy = [currentConceptRef] // reset hierarchy with new top concept
    previous = currentConceptRef // set previous to the current concept _ref for the next iteration
    topConceptSet = true
  } else if (conceptLevel == 1 && topConceptSet == false) {
    // L1 concept with no top concept
    hierarchy = [currentConceptRef] // reset hierarchy with new concept
    previous = currentConceptRef
  } else if (
    conceptLevel - 1 == previous.level || // Child concept
    conceptLevel == previous.level || // Sibling concept
    conceptLevel < previous.level // Ancestor concept
  ) {
    mapChildConcept(
      hierarchy,
      currentConcept,
      broaderDetected,
      conceptLevel,
      currentConceptRef,
      toRemove,
    )
  } else if (conceptLevel > previous.level + 1) {
    // Orphan concept: two or levels lower than previous term
    throw new Error('Inconsistent Hierarchy: Orphan term.')
  }

  // 3d. Add concepts and _refs to the skosConceptScheme and the skosConcepts array
  const skosConcept = {...currentConcept}
  const skosConceptRef = {...currentConceptRef}
  delete skosConcept.level
  delete skosConceptRef.level

  if (conceptLevel == 0) {
    skosConceptScheme.topConcepts.push(skosConceptRef)
  } else {
    skosConceptScheme.concepts.push(skosConceptRef)
  }
  skosConcepts.push(skosConcept)
}

const createConcepts = (results) => {
  for (const concept of results) {
    mapConcept(concept) // Map result hierarchy & assign attributes
  }
}

const processCSV = async (log) => {
  try {
    const results = await readCSV()
    createConcepts(results)
    if (log) {
      console.log(`SKOS Concept Scheme created: ${skosConceptScheme.title}`)
      console.log(`SKOS Concepts created: ${skosConcepts.length}`)
    }
  } catch (error) {
    console.error('Error processing CSV file: ', error)
  }
}

const importConcepts = async () => {
  try {
    await processCSV(true)
    console.log('Sanity Client time ... ')
    let transaction = client.transaction()
    skosConcepts.forEach((concept) => {
      transaction.createOrReplace(concept)
    })
    transaction.createOrReplace(skosConceptScheme)
    return transaction.commit()
  } catch (error) {
    console.error('Error importing taxonomy terms: ', error.message)
  }
}

const testConcepts = async () => {
  try {
    await processCSV(false)
    console.log(`Concept Scheme: ${skosConceptScheme.title}`)
    console.log(`\nFirst three of ${skosConcepts.length} Concepts:`)
    console.log(skosConcepts.slice(0, 3))
  } catch (error) {
    console.error('Error testing taxonomy terms: ', error.message)
  }
}

const removeConcepts = async () => {
  try {
    await processCSV(false)
    console.log('Sanity Client time ... ')
    let transaction = client.transaction()
    skosConcepts.forEach((concept) => {
      transaction.delete(concept._id)
    })
    transaction.delete(skosConceptScheme._id)
    return transaction.commit()
  } catch (error) {
    console.error('Error removing taxonomy terms: ', error.message)
  }
}

const main = async () => {
  if (
    process.argv[3] ||
    (process.argv[2] && !['--test', '--remove', '--help'].includes(process.argv[2]))
  ) {
    console.log('Usage: node taxo-tool.mjs [--test] [--remove] [--help]')
  } else if (process.argv.includes('--test')) {
    try {
      await testConcepts()
    } catch (error) {
      console.error('Error testing taxonomy terms: ', error.message)
    }
  } else if (process.argv.includes('--remove')) {
    console.log(
      'Delete mode: Taxonomy terms previously created with this configuration will be removed.',
    )
    console.log('Reading taxonomy terms ...')
    try {
      await removeConcepts()
      console.log('Concepts removed.')
    } catch (error) {
      console.error('Error removing taxonomy terms: ', error.message)
    }
  } else if (process.argv.includes('--help')) {
    console.log('Usage: node taxo-tool.mjs [--test] [--remove] [--help]')
    console.log(
      '--test: Run the script in test mode: returns the concept scheme and first three concepts. No data will be migrated.',
    )
    console.log('--remove: Remove any taxonomy terms previously imported from this configuration.')
    console.log('--help: Print command line options.')
  } else {
    console.log('Importing taxonomy terms ...')
    try {
      await importConcepts()
      console.log('Import complete.')
    } catch (error) {
      console.error('Error importing taxonomy terms: ', error.message)
    }
  }
}

main()
