import * as path from "path";
import * as fs from "fs";
import * as Koa from "koa";
import * as Router from "koa-router";
import { knex } from './Database'

/**
 * Generates an arbitrary amount of entries based on the
 * factory given
 *
 * @param {Function} creator Fake Model callback generator
 * @param {Number} number number fo models to generate
 */
export const factory = (creator, number = 1) => {
  return new Array(number).fill().map(creator);
};

/**
 * Retrieves a configuration from the .env file
 *
 * @param {String} selector
 * @param {String} fallback
 *
 * @return {String}
 */
export const env = (selector, fallback = "") => {
  return process.env[selector] || fallback;
};

/**
 * Retrieves an array of all files  (by filename) within
 * a given directory
 *
 * @param {String} dir
 * @param {Array} fileList
 *
 * @return {Array}
 */
export const walkDirs = (dir, fileList = []) => {
  return fs.readdirSync(dir).reduce((acc, file) => {
    return fs.statSync(path.join(dir, file)).isDirectory()
      ? [...acc, ...walkDirs(path.join(dir, file, "/"), fileList)]
      : [...acc, path.join(dir, file)];
  }, []);
};

/**
 * Given a base path, importFiles will recursively import all files
 * within that directory.
 *
 * @param {String} startPath base folder path to search
 * @param {Function} importRoute dynamic import function to retrieve the files
 *
 * @return {Object}
 */
export const importFiles = async (startPath, importFn) => {
  let fileNames = walkDirs(startPath);
  let files = {};
  let reg = new RegExp(`(${startPath.replace("./", "")}\\/|\\.js)`, "g");
  for (const file of fileNames) {
    try {
      let modules = await importFn(file.replace(reg, ""));
      files = { ...files, [file.replace(reg, "")]: modules };
    } catch (err) {
      console.log(err);
    }
  }

  return files;
};

/**
 * Resolves all promises in a { key: Promise, key: Promise } object
 *
 * @param {Object} object
 *
 * @return {Object}
 */
export const resolveObject = async object => {
  const keys = Object.keys(object);

  let promisedProperties = Object.entries(object).map(e => e[1]);

  let resolvedValues = await Promise.all(promisedProperties);

  return resolvedValues.reduce(
    (acc, cur, index) => ({
      ...acc,
      [keys[index]]: cur
    }),
    object
  );
};

/**
 * Load all controllers/routes/models in the Controllers folder
 *
 * Note:
 * During compilation, webpack uses static analysis to compile
 * all possible files from the given path. This is why the import
 * is required to have `../../Controllers` hardcoded, as opposed
 * to using `import(MyDynamicVariable)` and sharing logic with the
 * loadRoutes method.
 *
 * Side Note: Module resolution aliases aren't currently working with
 * dynamic imports and babel-node. If planning on using webpack only
 * or fixing the babel-node alias issue, then the route can be changed
 * to @/Controllers for example. Using aliases would increase flexibility
 * of the framework, and help in refactoring the code down the road
 *
 * @return {Promise} when resolved, Object containing all controllers
 */

export const loadFiles = async deps => {
  return await importFiles(deps.path, deps.loadFn);
};

/**
 * Kauri Router, built on top of koa & koa-router
 *
 * @param {Object} router
 */
export class KauriServer {
  constructor(config) {
    if (config.knex) {
      this.initKnex(config.knex)
    }
    // auto-load all routes files
    let routesPromise = loadFiles(config.routes);

    // auto-load all Controller files
    let controllersPromise =
      config.controllers && loadFiles(config.controllers);

    // auto-load all models for binding
    let modelsPromise = config.models && loadFiles(config.models);

    // app settings & defaults
    let {
      middleware = {},
      port = 8000
    } = (config.app || {})
    this._middleware = middleware;
    this._port = port;

    // Once the controllers & Routes have been loaded
    Promise.all([routesPromise, controllersPromise, modelsPromise]).then(
      ([routes, controllers, models]) => {
        // reduce to a single array of route objects
        routes = Object.entries(routes)
          .map(([name, route]) => route.default.routes)
          .reduce((acc, cur) => [...acc, ...cur]);

        routes.forEach(route => {
          this.router[route.method](route.url, async (ctx, next) => {
            // Model Parameter Binding
            if (route.options.bind !== undefined && models) {
              ctx.state = {
                ...ctx.state,
                ...(await this.bindParams(
                  models,
                  route.options.bind,
                  ctx.params
                ))
              };
            }

            const nextMiddleware =
              route.callback ||
              (controllers && this.kauriMiddleware(controllers, route)) ||
              (() => {});

            await nextMiddleware(ctx, next);
          });
        });
      }
    );

    // return router so that other koa-router options can be used
    return this.serve();
  }

  static get router() {
    if (!this._router) {
      this._router = new Router();
    }
    return this._router;
  }

  get router() {
    return this.constructor.router;
  }

  static get app() {
    if (!this._app) {
      this._app = new Koa();
    }
    return this._app;
  }

  get app() {
    return this.constructor.app;
  }

  async bindParams(models, bindings, params) {
    let binds = Object.entries(bindings);
    let state = {};

    for (const [key, model] of binds) {
      switch (typeof model) {
        case "string":
          state[key] = models[model]["default"].find(params[key]);
          break;
        case "object":
          state[key] = model.query(models[model.model]["default"], params);
          break;
      }
    }

    return resolveObject(state);
  }

  /**
   * Kauri middleware that assigns connects all routes with the
   * appropriate controller
   *
   * @param {Object} controllers
   * @param {Object} route
   */
  kauriMiddleware(controllers, route) {
    return async function(ctx, next) {
      let func = controllers[route.file] && controllers[route.file][route.func];

      if (typeof func !== "function") {
        ctx.throw(404, "Route Not Found");
      }
      let resp = (await controllers[route.file][route.func](ctx)) || {};

      if (resp.isKauriResponse) {
        ctx.type = resp.contentType || "text/plain";
        ctx.body = resp.body || resp;
      }
    };
  }

  static routes() {
    return this.router.routes();
  }

  static allowedMethods() {
    return this.router.allowedMethods();
  }

  static enable() {
    return [this.routes(), this.allowedMethods()];
  }

  /**
   *  Begin serving the app
   *
   * @return {Object} koa app instance
   */
  serve() {
    const NODE_ENV = env("NODE_ENV", "production");

    // enable all user defined middleware
    const middleware_mode = Object.keys(this._middleware).includes(NODE_ENV)
      ? NODE_ENV
      : "production";

    let middleware = this._middleware[middleware_mode] || []
    middleware.forEach(mid => this.app.use(mid));

    this.app.use(this.constructor.routes())
    this.app.use(this.constructor.allowedMethods())

    if (NODE_ENV === "test") {
      return this.app.listen();
    } else {
      console.log(
        `Server is listening on localhost:${this._port} in ${NODE_ENV} mode`
      );
      return this.app.listen(this._port);
    }
  }

  initKnex(config) {
    knex(config)
  }
}
