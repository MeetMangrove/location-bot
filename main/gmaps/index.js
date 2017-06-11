import Gmaps from '@google/maps'

const gmaps = Gmaps.createClient({
  key: process.env.GOOGLE_MAPS_API_KEY
})

export const validateAddress = async (address) => {
  return new Promise((resolve, reject) => {
    gmaps.geocode({address}, function(err, response) {
      if (err) return reject(err)
      resolve(response.json.results)
    })
  })
}
