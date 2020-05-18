const Enum = require('@4a/enum')

function Message(code, message) {
    return { code, message }
}

module.exports = Enum({
    permissionDenied: Message(1000, 'permission denied'),
    lossUserId: Message(1001, 'uid is required'),
})
