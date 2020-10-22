const neo = require('../index')

afterAll(async () => {
  neo.task.disconnect()
})

describe('Tasks', () => {
  test(`Timeout throws exception`, async (done) => {
    await expect(
      neo.task.create('foobar', {}, { timeout: 1000 })
    ).rejects.toThrow()

    done()
  })

  test(`Normal task does not throw`, async (done) => {
    neo.task.process('barfoo', function () {
      return true
    })

    let res = await neo.task.create('barfoo', {}, { timeout: 1000 })

    expect(res).toBe(true)
    done()
  })

  test(`Error handling inside processor`, async (done) => {
    neo.task.process('error', function () {
      throw new Error('Fail')
    })

    await expect(neo.task.create('error', {})).rejects.toThrow('Fail')
    done()
  })
})
