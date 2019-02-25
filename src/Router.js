import * as path from 'path'

/**
 * The BaseRouter is the base class which extends all
 * Main routers
 */
export default class Router {
  /**
   * Initialize new router with optional options.
   * For example, prefix is prepended to all
   * /api/ paths.
   *
   * @param {Object} options
   * @param {String} options.prefix
   */
  constructor({ prefix = '' } = {}) {
    this._routes = [];
    this.prefix = prefix
  }

  get routes() {
    return this._routes
  }

  get prefix() {
    return this._prefix
  }

  set prefix(prefix) {
    this._prefix = prefix
  }

  setOptions({ prefix }) {
    if (prefix) {
      this.prefix = prefix
    }
  }

  /**
   * Adds a route to the internal routes array
   *
   * @param {String} method
   * @param {String} url
   * @param {String} controller
   */
  _saveRoute(method, url, controller, options = {}) {
    switch (typeof controller) {
      case 'string':
        const [file, func] = controller.split('@')
        this._routes = [
          ...this._routes,
          {
            url: path.join('/', this._prefix, url),
            method,
            file,
            func,
            options,
          },
        ]
        break
      case 'function':
        this._routes = [
          ...this._routes,
          {
            url: path.join('/', this._prefix, url),
            method,
            callback: controller,
            options,
          },
        ]
        break
    }
  }

  /**
   * Adds a GET route to the routes array
   *
   * @param  {String} url
   * @param  {String} controller@func
   */
  get(...args) {
    this._saveRoute('get', ...args)
  }

  /**
   * Adds a POST route to the routes array
   *
   * @param  {String} url
   * @param  {String} controller@func
   */
  post(...args) {
    this._saveRoute('post', ...args)
  }

  /**
   * Adds a PATCH route to the routes array
   *
   * @param  {String} url
   * @param  {String} controller@func
   */
  patch(...args) {
    this._saveRoute('patch', ...args)
  }

  /**
   * Adds a PATCH route to the routes array
   *
   * @param  {String} url
   * @param  {String} controller@func
   */
  put(...args) {
    this._saveRoute('put', ...args)
  }

  /**
   * Adds all predefined CRUD routes to the routes array
   * for a given resource.
   *
   * GET:     '/users'        => 'users@index'
   * GET:     '/users/:id'    => 'users@show'
   * POST:    '/users'        => 'users@store'
   * PATCH:   '/users/:id'    => 'users@update'
   * PUT:     '/users/:id'    => 'users@update'
   * DEL:     '/users/:id'    => 'users@destroy'
   *
   * @param  {String} url
   * @param  {String} controller@func
   */
  crud(...args) {
    const [url, controller, options] = args
    // get all
    this._saveRoute('get', url, `${controller}@index`, options)
    this._saveRoute('get', `${url}/:id`, `${controller}@show`, options)
    this._saveRoute('post', url, `${controller}@store`)
    this._saveRoute('patch', `${url}/:id`, `${controller}@update`, options)
    this._saveRoute('put', `${url}/:id`, `${controller}@update`, options)
    this._saveRoute('del', `${url}/:id`, `${controller}@destroy`, options)
  }

  all(...args) {
    this._saveRoute('all', ...args)
  }

  /**
   * Adds a DELETE route to the routes array
   *
   * @param  {String} url
   * @param  {String} controller@func
   */
  del(...args) {
    this._saveRoute('del', ...args)
  }
}
