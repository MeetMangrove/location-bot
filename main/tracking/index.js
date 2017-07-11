import Mixpanel from 'mixpanel'

const client = Mixpanel.init(process.env.MIXPANEL_TOKEN)

export default client
