const User = require('../models/user_model')

test('valid document passes validation', () => {
    expect(new User({ username: 'a', password: 'p' }).validateSync()).toBeUndefined()
})

test('username and password are required', () => {
    const err = new User({}).validateSync()
    expect(err.errors.username).toBeDefined()
    expect(err.errors.password).toBeDefined()
})
