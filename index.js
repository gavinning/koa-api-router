const KoaRouter = require('@koa/router')
const debug = require('debug')('Koa-api-router')

/**
 * 路由路径补全
 * @param {String} uri 
 * @return {String} path
 */
function fullURI(uri) {
    return uri === 'ROOT' ? ('/') : ('/' + uri)
}

/**
 * 路由规则处理
 * @param {String} route 
 */
function decipher(route) {
    let [method, path, key] = route.split('_')
    key = key || path
    return { key, method, path: fullURI(path) }
}

/**
 * router上游辅助处理中间件
 * @param {Function} pre router预处理函数
 * @param {Function} after router通用后处理函数，包括异常捕获和处理
 */
function factory(pre, after) {
    return async (ctx, next) => {
        try {
            await pre(ctx, next)
            after(null, ctx)
        }
        catch (error) {
            after(error, ctx)
        }
    }
}

class Router extends KoaRouter {
    constructor() {
        super(...arguments)
    }

    /**
     * 路由批量定义
     * @param {Object} resolver 
     * @param {Object} routes 
     */
    append(resolver, routes) {
        Object.keys(routes).forEach(route => {
            const params = routes[route]
            const { method, path, key } = decipher(route)
            this[method](path, factory(params, this.after), resolver[key])
        })
    }

    /**
     * router通用后处理函数
     * @param {Error?} err 
     * @param {Koa.Context} ctx Koa上下文
     */
    after(err, ctx) {
        if (err) {
            // DEBUG环境变量开启Koa-api-router即可显示此日志
            // eg: DEBUG=Koa-api-router npm run dev
            debug('Error:', err)

            // 兼容处理由@4a/Enum创建的静态枚举类型创建的EnumError异常
            // 可自定义Error子类，只要自定义的Error实例实现了Encode方法，即可被兼容处理
            if (err.Encode && typeof err.Encode === 'function') {
                return ctx.body = err.Encode({ ResponseId: ctx.ResponseId })
            }
            ctx.body = {
                // 当error实例携带有魔改版的code，也可以被兼容处理
                // 理论上来说所有可预见异常都应该在ResultMessage枚举实例中进行枚举
                // 超出预期的异常code值应该是500xxx，这里默认值是500000
                code: isNaN(err.code) ? 500000 : err.code,
                message: err.message,
                ResponseId: ctx.ResponseId,
            }
        }
        // 此处可收集异常响应，或执行异常响应上报等操作
        else if (!ctx.body || ctx.body.code !== 0) {
            debug('Exception Response:', ctx.body)
        }
    }

    static default() {
        return new Router(...arguments)
    }
}

module.exports = Router
