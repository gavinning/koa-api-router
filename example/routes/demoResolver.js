class Resolver {
    check(ctx) {
        // ctx.type = 'application/json'
        ctx.body = 'ok'
    }

    user(ctx) {
        ctx.body = {
            code: 1,
            message: 'ok',
            data: {
                uid: ctx.query.uid,
                username: 'demo',
            }
        }
    }
}

module.exports = new Resolver
