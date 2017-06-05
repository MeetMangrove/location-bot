/**
 * Created by thomasjeanneau on 05/06/2017.
 */

// TODO: need to test all functions

import Promise from 'bluebird'
import mongodb from 'mongodb'

require('dotenv').config()

const {MONGO_URL} = process.env
const {MongoClient} = mongodb

export const find = async (name, selector) => {
  const connect = Promise.promisify(MongoClient.connect)
  const db = await connect(MONGO_URL)
  const collection = db.collection(name)
  const findOne = Promise.promisify(collection.findOne)
  const result = await findOne(selector)
  console.log(`find a document with selector ${JSON.stringify(selector)} in ${name} collection: ${JSON.stringify(result)}`)
  db.close()
  return result
}

export const insert = async (name, obj) => {
  const connect = Promise.promisify(MongoClient.connect)
  const db = await connect(MONGO_URL)
  const collection = db.collection(name)
  const insertOne = Promise.promisify(collection.insertOne)
  const result = await insertOne(obj)
  console.log(`insert a document with object ${JSON.stringify(obj)} in ${name} collection: ${JSON.stringify(result)}`)
  db.close()
  return result
}

export const update = async (name, selector, obj) => {
  const connect = Promise.promisify(MongoClient.connect)
  const db = await connect(MONGO_URL)
  const collection = db.collection(name)
  const updateOne = Promise.promisify(collection.updateOne)
  const result = await updateOne(selector, obj)
  console.log(`update a document with selector ${JSON.stringify(selector)} and object ${JSON.stringify(obj)} in ${name} collection: ${JSON.stringify(result)}`)
  db.close()
  return result
}

export const remove = async (name, selector) => {
  const connect = Promise.promisify(MongoClient.connect)
  const db = await connect(MONGO_URL)
  const collection = db.collection(name)
  const deleteOne = Promise.promisify(collection.deleteOne)
  const result = await deleteOne(selector)
  console.log(`remove a document with selector ${JSON.stringify(selector)} in ${name} collection: ${JSON.stringify(result)}`)
  db.close()
  return result
}
