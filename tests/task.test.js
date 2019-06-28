const neotask = require('../index').task

afterAll(async () => {
  neotask.disconnect();
});

describe('Tasks', () => {
  test(`Timeout throws exception`, async (done) => {

    await expect(neotask.create('foobar', {}, { timeout: 1000 }))
      .rejects
      .toThrow()

    done();
  });

  test(`Normal task does not throw`, async (done) => {

    neotask.process('barfoo', function () {
      return true
    })

    let res = await  neotask.create('barfoo', {}, { timeout: 1000 })

    expect(res).toBe(true);
    done();
  });
});
