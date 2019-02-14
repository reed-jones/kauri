import Knex from 'knex'
import { Model, QueryBuilder } from 'objection'
export { QueryBuilder }

// // create the Knex database connection
export const knex = config => {
    let k = Knex(config)
    Model.knex(k)
}
