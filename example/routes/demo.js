const router = module.exports = require('../../').default()
const resolver = require('./demoResolver')
const assert = require('@4a/enum/assert')
const Result = require('../result')

router.append(resolver, {
    async get_check(ctx, next) {
        await next()
    },

    async get_user(ctx, next) {
        assert.ok(ctx.query.token, Result.permissionDenied)
        assert.ok(ctx.query.uid, Result.lossUserId)
        await next()
    }
})
