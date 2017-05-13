import {pairAllApplicants} from '../pairing'


// if this script is executed via the CLI, genrate the pairing
if (require.main === module) {
  pairAllApplicants().then(() => console.log('Done.'))
}
