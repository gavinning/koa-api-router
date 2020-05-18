const Koa = require('koa')
const app = new Koa()
const json = require('koa-json')
const bodyparser = require('koa-bodyparser')
const demo = require('./routes/demo')

app.use(bodyparser({
    enableTypes: ['json', 'form', 'text'],
    extendTypes: { text: ['text/xml', 'application/xml'] }
}))
app.use(json())

app.use(demo.routes(), demo.allowedMethods())

app.listen(10086)
console.log('app listen on 10086')
