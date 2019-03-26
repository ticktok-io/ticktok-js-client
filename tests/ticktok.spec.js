'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const server = require('./ticktok-server')
const { ticktok, clock, ClockCreateError, ChannelError } = require('../src/ticktok')

chai.use(chaiAsPromised)
const expect = chai.expect

describe('Ticktok', () => {
  beforeEach(() => {
    this.ticktok = ticktok(server.DOMAIN, server.TOKEN)
    return server.start()
  })

  afterEach(() => {
    return server.stop()
  })

  it('should fail on non valid schedule', async() => {
    const clockRequest = clock.named('kuku').on(server.INVALID_SCHEDULE)
    await expect(this.ticktok.schedule(clockRequest)).to.be.rejectedWith(ClockCreateError)
    server.receivedRequestIs({ name: 'kuku', schedule: server.INVALID_SCHEDULE })
  })

  it('should invoke on tick', async() => {
    let ticked = false

    function waitForTick() {
      return new Promise((resolve, reject) => {
        if (ticked) {
          resolve()
        } else {
          setTimeout(async() => {
            await waitForTick()
            resolve()
          }, 50)
        }
      })
    }

    await this.ticktok.schedule(clock.named('kuku').on('every.2.seconds').invoke(() => { ticked = true }))
    server.tick()
    await waitForTick()
  })

  it('should fail on rabbit connection', async() => {
    server.overrides = { rabbitUri: 'amqp://invalid' }
    await expect(this.ticktok.schedule(clock.named('kuku').on('every.6.seconds')))
      .to.be.rejectedWith(ChannelError)
  })
})
