/**
 * This is the response class. it is a series of functions designed
 * to make returning data from the controllers, and rendering
 * views much easier.
 *
 * for basic types such as json or html, the type ad body can be supplied
 * directly to the constructor.
 * i.e.:
 *   return new response({
 *      type: 'application/json',
 *      body: { success: true }
 *    })
 * or you can use one of the helper methods
 * (which is recommended for more complicated types such as
 * templating engines)
 *
 * return new response().json({ success: true })
 *
 */
import pug from 'pug'
import ejs from 'ejs'
import fs from 'fs'
import { promisify } from 'util'
const readFile = promisify(fs.readFile)

// temporary hack
const config = {
  routeTemplateCaching: false
}

export default class Response {
  /**
   * Default response constructor.
   *
   * @param {Object} config
   * @param {String} config.contentType
   * @param {String|Object} config.body
   */
  constructor({ contentType, body } = {}) {
    this._contentType = contentType
    this._body = body

    // initialize empty cache on first run
    if (!this.cache) {
      this.cache = {
        pug: {}
      }
    }
  }

  get cache() {
    return this.constructor._cached
  }

  set cache(val) {
    this.constructor._cached = val
  }

  addCache(cache, newCache) {
    this.constructor._cached[cache] = {
      ...this.constructor._cached[cache],
      ...newCache
    }
  }

  /**
   * When using the Response class, this is the signal
   * that signals to the rest of the framework that it is
   * the built in Response.
   */
  get isKauriResponse() {
    return true
  }

  /**
   * Returns the content type of the response
   *
   * @return {String}
   */
  get contentType() {
    return this._contentType
  }

  /**
   * Returns the body of the response.
   * Generally speaking this will either be JSON
   * or an html string.
   *
   * @return {String|Object}
   */
  get body() {
    return this._body
  }

  /**
   * Helper function for returning json objects
   * and setting appropriate content types
   *
   * @param {Object} obj
   *
   * @return {Response}
   */
  json(obj) {
    this._contentType = 'application/json'
    this._body = obj

    return this
  }

  /**
   * Helper function for returning plain html strings
   * and setting appropriate content types
   *
   * @param {Object} obj
   *
   * @return {Response}
   */
  rawHtml(str) {
    this._contentType = 'text/html'
    this._body = str

    return this
  }

  /**
   * Helper function for returning plain html strings
   * and setting appropriate content types
   *
   * @param {Object} obj
   *
   * @return {Response}
   */
  html(filename) {
    this._contentType = 'text/html'
    this._body = 'Raw HTML file importing not yet implemented'

    return this
  }

  /**
   * Helper function for returning compiled pug templates.
   * The filename is the template file relatives to the views folder.
   * The options are the parameters that will be passed into the template
   * and accessible using pugs built in variables mechanism.
   * i.e. { appName: 'Kauri } can be used as #{appName} in the template
   *
   * @param {String} fileName
   * @param {Object} options
   *
   * @return {Response}
   */
  pug(fileName, options = {}) {
    this._contentType = 'text/html'

    if (config.routeTemplateCaching) {
      // if the first time running this file, we cache it
      if (!this.constructor._cached.pug[fileName]) {
        this.addCache('pug', {
          [fileName]: pug.compileFile(`./Client/views/${fileName}.pug`, { basedir: './Client/views'})
        })
      }

      // compile file with new options
      this._body = this.constructor._cached.pug[fileName](options)
    } else {
      let compileFn = pug.compileFile(`./Client/views/${fileName}.pug`, { basedir: './Client/views'})
      this._body = compileFn(options)
    }

    return this
  }

  /**
   * EJS Template helper.
   *
   * Coming Soon!
   *
   * @param {String} fileName
   * @param {Object} options
   *
   * @return {Response}
   */
  async ejs(fileName, options = {}) {
    this._contentType = 'text/html'

    if (config.routeTemplateCaching) {
      // if the first time running this file, we cache it
      if (!this.constructor._cached.pug[fileName]) {
        let file = await readFile(`./Client/views/${fileName}.ejs`)
        this.addCache('ejs', {
          [fileName]: ejs.compile(file.toString(), { async: true })
        })
      }

      // compile file with new options
      this._body = await this.constructor._cached.ejs[fileName](options)
    } else {
      let file = await readFile(`./Client/views/${fileName}.ejs`)
      let compileFn = ejs.compile(file.toString(), { async: true })
      this._body = await compileFn(options)
    }

    return this
  }
}
