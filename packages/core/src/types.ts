type ZenlessAtlasType = 'engine'

export interface ZZZData {
  atlas: ZZZAtlasData
}

export interface ZenlessAtlas {
  [key: string]: Record<string, string>
}

export interface ZenlessAtlasData {
  type: string
  path: string
  children: ZenlessAtlasChildren[]
}

export interface ZenlessAtlasChildren {
  name: string
  hash: string
  path: string
}

export interface ZZZAtlasData {
  path: string
  regexp: string[]
  raw: ZenlessAtlas
  mapper: ZZZAtlasMapper
  data: Record<string, ZenlessAtlasData>
}

export interface ZZZAtlasMapper {
  _path: string
  [key: string]: string
}
