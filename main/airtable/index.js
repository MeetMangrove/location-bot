import Airtable from 'airtable'
import settings from '../settings'

const { AIRTABLE_API_KEY, AIRTABLE_BASE_KEY } = settings

Airtable.configure({
  endpointUrl: 'https://api.airtable.com',
  apiKey: AIRTABLE_API_KEY
})

// allows accessing tables directly
export const base = Airtable.base(AIRTABLE_BASE_KEY)
