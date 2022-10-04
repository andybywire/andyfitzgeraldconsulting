// Sanity SANITY_READ_TOKEN not currently set. Do I need it? (or dotenv here?)
require('dotenv').config({
  path: `.env.${process.env.NODE_ENV || 'development'}`
})

const sanityClient = require("@sanity/client");

const { sanity } = require('../client-config')

module.exports = sanityClient({
  ...sanity, 
  useCdn: false, // set to true in production (manage w/ .env)
  apiVersion: '2021-10-21',
  token: process.env.SANITY_READ_TOKEN
});
