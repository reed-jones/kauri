import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import webpack from 'webpack';
import { PassThrough } from 'stream';

export class KauriHMR {
    static setConfig(compiler) {
        this.clientCompiler =compiler;
    }

    static dev() {
        return this.devMiddleware(this.clientCompiler);
    }

    static hot() {
        return this.hotMiddleware(this.clientCompiler);
    }

    static devMiddleware(compiler, opts) {
        const expressMiddleware = webpackDevMiddleware(compiler, opts);

        async function middleware(ctx, next) {
            await expressMiddleware(
                ctx.req,
                {
                    end: content => {
                        ctx.body = content;
                    },
                    setHeader: (name, value) => {
                        ctx.set(name, value);
                    }
                },
                next
            );
        }

        middleware.getFilenameFromUrl = expressMiddleware.getFilenameFromUrl;
        middleware.waitUntilValid = expressMiddleware.waitUntilValid;
        middleware.invalidate = expressMiddleware.invalidate;
        middleware.close = expressMiddleware.close;
        middleware.fileSystem = expressMiddleware.fileSystem;

        return middleware;
    }

    static hotMiddleware(compiler, opts) {
        const expressMiddleware = webpackHotMiddleware(compiler, opts);
        return async function(ctx, next) {
            let stream = new PassThrough();
            ctx.body = stream;
            await expressMiddleware(
                ctx.req,
                {
                    write: stream.write.bind(stream),
                    writeHead: (status, headers) => {
                        ctx.status = status;
                        ctx.set(headers);
                    },
                    end: content => {
                        ctx.body = content;
                    }
                },
                next
            );
        };
    }
}
