import { DialogProgrammatic } from 'buefy'

export default {
  props: {
    title: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      required: true
    }
  },

  created () {
    DialogProgrammatic.alert('The Card has been created')
  }
}
