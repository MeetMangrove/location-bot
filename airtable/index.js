import Airtable from 'airtable'
import settings from '../bot/settings'

const {AIRTABLE_API_KEY, AIRTABLE_BASE_KEY} = settings;

Airtable.configure({
  endpointUrl: 'https://api.airtable.com',
  apiKey: AIRTABLE_API_KEY,
});


// allows accessing tables directly
export const base = Airtable.base(AIRTABLE_BASE_KEY);


// reads all people from Airtable, and returns them
// as an Array of
//  {name: String, interests: [String], skills: [String]}
export const getAllPeople = (tableName, callback) => {
  const people = [];
  base(tableName).select({
    maxRecords: 150,
    view: "Main View",
    fields: ["Name", "Interests", "Skills"]
  }).eachPage((records, fetchNextPage) => {
    records.forEach((record) => {
      const interests = record.get('Interests'),
            skills = record.get('Skills'),
            name = record.get('Name');
      // require name, default skills and interests to []
      if (name && name.length) {
        people.push({
          name,
          interests: (interests || []),
          skills: (skills || []),
        })
      }
    });
    fetchNextPage()
  }, (err) => {
    if (err) return callback(err);
    return callback(undefined, people)
  })
};

export const getPerson = (tableName, slackHandle, callback) => {
  base(tableName).select({
    maxRecords: 1,
    filterByFormula: "{Slack Handle} ='" + slackHandle + "'"
  }).firstPage((err, records)=>{
    if(err) { console.error(err); return;}
    return callback(undefined, records[0]);
  })
}

export const updatePerson = (tableName, slackHandle, obj, callback) => {
  base(tableName).select({
    maxRecords: 1,
    filterByFormula: "{Slack Handle} ='" + slackHandle + "'"
  }).firstPage((err, records)=>{
    if(err) { console.error(err); return;}
    base(tableName).update(records[0].id, obj, (err, rec)=>{
      if(err) { console.error(err); return;}
      return callback(undefined, rec);
    })
  })
}