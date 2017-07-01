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

export const getCityCountry = (gmapsResult) => {
	let city, country;
	for (const comp of gmapsResult.address_components) {
		if (comp.types.indexOf('locality') > -1) {
			city = comp.long_name
		} else if (comp.types.indexOf('country') > -1) {
			country = comp.long_name
		}
	}
	return city ? `${city}, ${country}` : country
}
