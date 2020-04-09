koa-api-router
---
定义某种自定义规范，方便api开发，因为DEMO依赖[Enum](https://github.com/gavinning/enum) 所以接入过程会稍显复杂，实际使用起来比较爽  
[Enum](https://github.com/gavinning/enum)  
[EnumCodeMessage](https://github.com/gavinning/enum-code-message)  

### Install
```sh
npm i @4a/koa-api-router
```

### Usage
```js
const assert = require('@4a/enum/assert')
const router = require('@4a/koa-api-router').default()
const ResultMessage = require('@4a/enum-code-message')

router.append(resolver, {

    // ROOT表示根路由，等同于 /
    async get_ROOT(ctx, next) {
        const params = ctx.query

        // 参数合法性检查
        // 此处不通过会直接抛出ResultMessage关联异常
        // Response响应结果类似 { code: 400000, message: 'error message' }
        // 如果ctx.ResponseId有值，则Response响应结果类似：
        // { code: 400000, message: 'error message', ResponseId: '...' }
        assert.ok(params.token, ResultMessage.PermissionDenied)

        // 此处assert是@4a/enum模块下定制版的断言模块
        // @4a/enum/assert断言模块仅支持由@4a/Enum创建的静态枚举类型创建的EnumError异常
        // 当然也可以使用Nodejs官方提供的assert断言库，after方法稍加处理即可兼容
        assert.ok(params.token.length >= 6, ResultMessage.ErrorToken)

        assert.ok(params.email, ResultMessage.LossEmail)

        // 参数检查通过之后，暂存到ctx.state属性之下
        // 下游resolver会用到它
        ctx.state.params = params

        // 当然不仅仅是参数检查
        // 任何你需要预处理程式都可以在这里定义
        // 任意条件不通过，即可在此处抛出异常信息
        // 所有预处理通过之后，即可执行await next() 交由下游resolver进一步处理

        await next()
    },

    // 路由规则
    // {Method}_{RoutePath}_{RouteResolverKey}
    // 当 RoutePath == RouteResolverKey 时，RouteResolverKey可以省略
    // 因为路由规则使用下划线作为分隔符，所以路由规则关键字中不能再使用额外的下划线
    async 'get_app/:id_getApp'(ctx, next) {
        const params = ctx.params

        assert.ok(isNaN(params.id), ResultMessage.NotFound)

        ctx.state.params = params

        await next()

        // 可根据需要在此执行某些收尾工作
        // 接口响应异常收集、上报等通过程式建议放在after方法内
        // after方法下文有介绍
    },

    // 当 RoutePath == RouteResolverKey 时，RouteResolverKey可以省略
    async get_login(ctx, next) {
        await next()
    }
})

```

#### resolver
```js
// 下游 Resolver
class HomeResolver {

    ROOT(ctx) {
        // 此时 ctx.state.params 是可信的

        ctx.body = ctx.state.params
    }

    getApp(ctx) {
        ctx.body = ctx.state.params
    }

    login(ctx) {
        console.log(ctx.state.params)
        ctx.body = 'ok'
    }
}

```

### After Response
``Router``实现了一个``after``方法，用于处理通用异常，实现如下：  
```js
/**
 * router通用后处理函数
 * @param {Error?} err 
 * @param {Koa.Context} ctx Koa上下文
 */
function after(err, ctx) {
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
```
如果需要自定义异常处理，可以重写此方法，重写``after``示例
```js
class CustomRouter extends Router {

    after(err, ctx) {
        // ... your code
    }
}
```
