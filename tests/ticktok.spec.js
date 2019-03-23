'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const server = require('./ticktok-server')
const { ticktok, ClockCreateError, ChannelError } = require('../lib/ticktok')

chai.use(chaiAsPromised)
const expect = chai.expect

describe('Ticktok', () => {
  beforeEach(() => {
    server.start()
    this.ticktok = ticktok(server.DOMAIN, server.TOKEN)
  })

  it('should fail on non valid schedule', async() => {
    const clockRequest = { name: 'kuku', schedule: server.INVALID_SCHEDULE }
    await expect(this.ticktok.clock(clockRequest)).to.be.rejectedWith(ClockCreateError)
    server.receivedRequestIs(clockRequest)
  })

  it('should invoke on tick', async() => {
    let ticked = false

    function waitForTick() {
      return new Promise((resolve, reject) => {
        if (ticked) {
          resolve()
        } else {
          setTimeout(waitForTick, 50)
        }
      })
    }

    const clockRequest = { name: 'kuku', schedule: 'every.2.seconds', onTick: () => { ticked = true } }
    await this.ticktok.clock(clockRequest)
    await server.tick()
    await waitForTick()
  })

  it('should fail on rabbit connection', async() => {
    server.overrides = { rabbitUri: 'amqp://invalid' }
    const clockRequest = { name: 'kuku', schedule: 'every.2.seconds' }
    await expect(this.ticktok.clock(clockRequest)).to.be.rejectedWith(ChannelError)
  })
})
