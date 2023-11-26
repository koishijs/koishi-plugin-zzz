import { mkdir } from "fs/promises"
import { PathLike, existsSync } from "node:fs"
import { dirname } from "node:path"

export function mkdirs(path: PathLike) {
  if (existsSync(path)) return true
  else if (mkdirs(dirname(path.toString()))) {
    let mk = false
    mkdir(path)
      .then(() => { mk = true })
    return mk
  }
}
