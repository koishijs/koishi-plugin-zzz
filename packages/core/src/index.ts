import { existsSync, write } from 'fs'
import { Context, Schema, Session, h, Dict, Service } from 'koishi'
import { resolve } from 'path'
import { mkdirs } from './utils'
import { readFile, writeFile } from 'fs/promises'
import { ZZZData } from './types'
import { createHash } from 'crypto'

export const name = 'zzz'

class Zenless extends Service {
  zzz: ZZZData = {
    atlas: {
      path: '',
      regexp: [],
      raw: {},
      mapper: {
        _path: ''
      },
      data: {}
    }
  }

  constructor(ctx: Context, private config: Zenless.Config) {
    super(ctx, 'zenless')
    ctx.i18n.define('zh', require('./locales/zh'))

    this.logger = ctx.logger('zenless')

    ctx.on('ready', async () => {
      if (!existsSync(resolve(ctx.root.baseDir, Zenless.DataDir)))
        mkdirs(resolve(ctx.root.baseDir, Zenless.DataDir))
      await this.atlas()
    })

    const cmd = ctx.command('zzz', '《绝区零》')
      .action(({ session }) => {
        session.execute('help zzz')
      })

    cmd.subcommand('.atlas [name:string]', '查询图鉴')
      .option('type', '-t <type:string> 指定图鉴类型')
      .option('upgrade', '-U 更新图鉴')
      // .shortcut(new RegExp(`^\#(${this.zzz.atlas.regexp.join('|')})`))
      .action(async ({ session, options }, name) => {
        if (options.upgrade) {
          await this.atlas()
          return session.text('.upgrade')
        }
        if (name) {
          console.log(this.zzz.atlas.mapper)
          const path = this.zzz.atlas.mapper[name]
          if (path) {
            const imageBuf = await readFile(path)
            return h.image(imageBuf, 'image/png')
          } else {
            return session.text('.notfound')
          }
        } else {
          let result = []
          for (const type in this.zzz.atlas.data) {
            result.push(`<p>${type}: </p>`)
            result.push(`<p>--- </p>`)
            const data = this.zzz.atlas.data[type]
            for (const name of data.children.map(v => v.name)) {
              result.push(`<p>${name}</p>`)
            }
          }
          return `<message>
          <p>当前已有图鉴：</p>
          ${result.join('<br/>')}
          </message>`
        }
      })
  }

  async atlas(upgrade = false) {
    const dataPath = resolve(this.ctx.root.baseDir, Zenless.DataDir, 'atlas')
    this.logger.info('Initializing ZenlessZoneZero - Atlas...')
    let countImage = 0
    let countTypes = 0

    this.zzz.atlas.path = resolve(dataPath, 'path.json')
    this.zzz.atlas.mapper = {
      _path: dataPath
    }

    if (!existsSync(this.zzz.atlas.path) || !existsSync(resolve(dataPath, 'mapper.json'))) {
      upgrade = true
      mkdirs(dataPath)
    }

    if (upgrade) {
      this.zzz.atlas.raw = await this.ctx.http.get(this.config.atlas.resource + '/path.json')
      writeFile(this.zzz.atlas.path, JSON.stringify(this.zzz.atlas.raw))
    } else {
      this.zzz.atlas.raw = require(this.zzz.atlas.path)
      this.zzz.atlas.mapper = require(resolve(dataPath, 'mapper.json'))
    }

    // mapping atlas data and download images
    for (const typer in this.zzz.atlas.raw) {
      const data = this.zzz.atlas.raw[typer]
      Object.assign(this.zzz.atlas.data, { [typer]: { type: typer, children: [] } })
      const _path = resolve(dataPath, typer)
      if (!existsSync(_path)) {
        await mkdirs(_path)
      }
      countTypes++
      //download images to dataPath
      for (const name in data) {
        const uri = this.config.atlas.resource + data[name]
        const hash = createHash('md5').update(data[name]).digest('hex')
        const path = resolve(dataPath, typer, hash + '.png')
        this.zzz.atlas.data[typer].children.push({ name, hash, path })

        // if (!upgrade && existsSync(path)) continue

        this.logger.debug(`Downloading ${name} from ${uri} to ${path}`)
        try {
          const buf = await this.ctx.http.get(uri, { responseType: 'arraybuffer' })
          await writeFile(path, buf)
          countImage++
          Object.assign(this.zzz.atlas.mapper, { [name]: path })
          this.zzz.atlas.regexp.push(name)
        } catch (e) {
          this.logger.error(`Download ${uri} to ${path} failed: ${e}`)
        }
      }
    }

    writeFile(this.zzz.atlas.mapper._path + '/mapper.json', JSON.stringify(this.zzz.atlas.mapper))

    this.logger.info(`Initialized ZenlessZoneZero - Atlas, ${countTypes} types, ${countImage} images.`)
  }
}

namespace Zenless {
  enum AtlasResource {
    GITHUB = 'https://raw.githubusercontent.com/Nwflower/zzz-atlas/master',
    GPROXY = 'https://mirror.ghproxy.com/https://raw.githubusercontent.com/Nwflower/zzz-atlas/master',
    GITEE = 'https://gitee.com',
  }
  interface Atlas {
    // enable: boolean
    resource: AtlasResource
  }
  export interface Config {
    atlas: Atlas
  }
  export const Config: Schema<Config> = Schema.object({
    atlas: Schema.object({
      // enable: Schema.boolean().default(false).description('是否启用图鉴'),
      resource: Schema.union([
        Schema.const(AtlasResource.GITHUB).description('原始源'),
        Schema.const(AtlasResource.GPROXY).description('代理源'),
        Schema.const(AtlasResource.GITEE).description('Gitee 源'),
      ]).description('图鉴资源')
    }).default({
      resource: AtlasResource.GPROXY
    }).description('图鉴设置'),
  })

  export const DataDir = 'data/zzz'
}

export default Zenless