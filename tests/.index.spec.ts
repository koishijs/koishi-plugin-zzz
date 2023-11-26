import { Context } from 'koishi'
import mock from '@koishijs/plugin-mock'
import memory from '@koishijs/plugin-database-memory'

const app = new Context()
app.plugin(mock)


const client = app.mock.client('10000')

before(() => app.start())
after(() => app.stop())

it('zzz-test', async () => {
    
})
