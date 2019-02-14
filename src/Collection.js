export default class Collection extends Array {
  constructor(...props) {
    super(...props)
  }
  pluck(selector) {
    return this.map(a => a[selector])
  }
  distinct() {
    return new Collection(...new Set(this))
  }
}