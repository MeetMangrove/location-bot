import { getAllMembers } from '../methods'
import { getCityCountry } from '../gmaps'

// Messages Methods
export const pingMessage = function (name, address) {
  return {
    attachments: [{
      callback_id: 'location_confirmation',
      attachment_type: 'default',
      pretext: `
Hey ${name.replace(/\b\w/g, l => l.toUpperCase())}!
I'm Sally Ride. I'm keeping track of everyone's location. Right now I have ${address} as your current location.
Is that correct?`,
      actions: [
        {
          'name': 'addressConfirmed',
          'text': 'Yes',
          'type': 'button',
          'value': address,
          'style': 'primary'
        },
        {
          'name': 'addressConfirmed',
          'text': 'No',
          'type': 'button',
          'value': false,
          'style': 'danger'
        }
      ]
      
    }]
  }
}

export const pingMessageNoLocation = function (name) {
  return `Hey ${name.replace(/\b\w/g, l => l.toUpperCase())}!
I'm Sally Ride. I'm keeping track of everyone's location. Right now I don't know where you are.
Please type "!newloc <City, Country>" to update your location!`;
}

export const helpMessage = function (name) {
  return {
    attachments: [{
      pretext: `
Hey ${name}!\n
I'm Sally Ride! I'm taking care of keeping everyone's location up to date :boat:
Here are the few commands you can use with me :ok_woman:`,
      text: `
"!newloc <city or country>" for me to update your location,
"!myloc" if you want to know where I think you are,
"!map" for a link to Mangrove Members map!`
    }]
  }
}

export const goodbye = function () {
  return {
    attachments: [{
      pretext: `
I'll be orbiting in my space shuttle if you need me.
If you need anything else don't forget the following commands:`,
      text: `
"!newloc <city or country>" for me to update your location,
"!myloc" if you want to know where I think you are,
"!map" for a link to Mangrove Members map!`
    }]
  }
}

export const mapMessage = async function () {
  const members = await getAllMembers()
  const locations = new Set()
  for (const member of members) {
    locations.add(member.fields['Current Location'])
  }
  return `There are *${members.length} Mangrove friends* in *${locations.size} different cities*. Say hello to the Mangrove universe:  www.mangrove.io/live-map`
}

export const mylocMessage = function (address) {
  return {
    attachments: [{
      pretext: 'Your location seems to be:',
      text: address,
      mrkdwn_in: ['text', 'pretext']
    }]
  }
}

export const noLocationFound = function () {
  return `Oops, doesn't seem like I'm able to find the place
you are talking about, even with the help of my friend Google Maps.\n
Maybe try to give me a more complete address?\n
Don't worry, I will only save the City and Country ;)`
}

export const noLocationForUser = function () {
  return {
    attachments: [{
      pretext: `
It doesn't seem like I have any information about your current location.
If you want to set your current location, please reply with:`,
      text: '"!newloc <City, Country>"'
    }]
  }
}

export const noLocationGiven = function () {
  return {
    attachments: [{
      pretext: 'It seems like you didn\'t give me any address... Please send me something like the following example:',
      text: '"!newloc <City, Country>"'
    }]
  }
}

export const wrongLocation = function () {
  return 'My spatial system must be down. Please type "!newloc <City, Country>" to update your current location.'
}

export const locationConfirmation = function (address) {
  return {
    attachments: [{
      callback_id: 'location_confirmation',
      attachment_type: 'default',
      pretext: 'I found a matching address, is it correct?',
      title: address,
      actions: [
        {
          'name': 'addressConfirmed',
          'text': 'Yes',
          'type': 'button',
          'value': address,
          'style': 'primary'
        },
        {
          'name': 'addressConfirmed',
          'text': 'No',
          'type': 'button',
          'value': false,
          'style': 'danger'
        }
      ]
    }]
  }
}

export const positiveLocationConfirmation = function () {
  return 'That was easier than finding Earth\'s location in the Milky Way :)'
}

export const locationsConfirmation = function (locations) {
  const actions = []
  for (const loc of locations) {
    const cityCountry = getCityCountry(loc)
    actions.push({
      name: 'addressSelect',
      text: cityCountry,
      'type': 'button',
      'value': cityCountry
    })
  }
  actions.push({
    name: 'addressSelect',
    text: 'None :(',
    'type': 'button',
    'style': 'danger',
    'value': false
  })
  return {
    attachments: [{
      callback_id: 'locations_confirmation',
      attachment_type: 'default',
      pretext: 'I found multiple matching addresses, please select the correct postasl code!',
      actions: actions
    }]
  }
}
