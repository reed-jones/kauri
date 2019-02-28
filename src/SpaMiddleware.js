export const spaRewrite = ({ ignoreRoutes = ['api'], rewritePath = '/' } = {}) => {
    return async (ctx, next) => {
        if (
            // Not an API request, or other ignored route
            !ignoreRoutes.some(a => new RegExp(a).test(ctx.url)) &&
            // Not an asset request (image, css, js, asset.ext)
            !ctx.url.match(/\.\S{2,4}$/) &&
            // Not a webpack HMR request
            !ctx.url.match(/webpack\_hmr/)
        ) {
            ctx.url = rewritePath;
        }
        await next();
    };
};

export const KauriSPA = ['*', spaRewrite()]