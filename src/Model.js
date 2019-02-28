import { plural } from 'pluralize'
import { Model as ObjectionModel } from 'objection'

export default class Model extends ObjectionModel {
  constructor(props) {
    super(props)

    return new Proxy(this, {})
  }

  /*****************************
   * Model Configuration
   *****************************/

  /**
   * Default table name is the plural form of the parent class name
   * i.e. class User => 'users' table
   * Override by setting the static tableName on your model
   *
   * @return {String}
   */
  static get tableName() {
    return plural(this.name.split(/(?=[A-Z])/).join('_').toLowerCase())
  }

  get tableName() {
    return this.constructor.tableName
  }

  /**
   * Model Type is just an easy way to check the type of
   * an unknown instance
   * i.e.
   * var mystery = getRandomModel()
   * mystery.modelType
   * // -> User
   *
   * @return {String}
   */
  static get modelType() {
    return this.name
  }

  get modelType() {
    return this.constructor.name
  }

  /**
   * Default identifier column. Defaults to 'id' override by setting
   * static idColumn to your desired identifier
   *
   * @return {String} Primary key/identifier column in the database
   */
  static get idColumn() {
    return 'id'
  }

  get idColumn() {
    return this.constructor.idColumn
  }

  /*****************************
   * Model Database Helpers
   *****************************/

   /**
    * Finds and returns the specific model from the database
    *
    * @param {String|Number} id
    *
    * @return {Model} returns the model of the calling class type
    */
  static find(id) {
    return this.query().where({ [this.idColumn]: id }).first()
  }

  /**
   * Returns all of 'this' model from the database
   */
  static all() {
    return this.query();
  }

  /**
   * Saves all changes to this model
   *
   * @return {Promise}
   */
  save() {
    return this.constructor.query().upsertGraph(this)
  }

  /**
   * Removes this model from the database
   *
   * @return {Promise}
   */
  delete() {
    return this.constructor.query().where(this.idColumn, this[this.idColumn]).delete()
  }

  /**
   * Automatically adds created_at date to every new model
   */
  $beforeInsert() {
    this.created_at = new Date().toISOString();
  }

  /**
   * Automatically adds updates_at date to every change to the model
   */
  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }
}
