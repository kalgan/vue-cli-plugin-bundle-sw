const path = require('path')
const { InjectManifest } = require('workbox-webpack-plugin')
const { SingleEntryPlugin } = require('webpack')

const ID = 'bundle-service-worker-plugin'

module.exports = class BundleServiceWorkerPlugin {
  constructor ({ buildOptions }) {
    this.buildOptions = buildOptions
    this.workboxInject = new InjectManifest(buildOptions.workBoxConfig)
  }

  apply (compiler) {
    // avoid running twice (only run on modern build)
    if (!process.env.VUE_CLI_MODERN_BUILD) return

    compiler.hooks.make.tapAsync(ID, (compilation, cb) => {
      const { dest, context, src, plugins } = this.buildOptions
      const childCompiler = compilation.createChildCompiler(ID, { filename: dest }, plugins)

      // childCompiler.apply(new SingleEntryPlugin(context, src, dest))
      new SingleEntryPlugin(context, src, dest).apply(childCompiler)

      compilation.hooks.additionalAssets.tapAsync(ID, childProcessDone => {
        childCompiler.runAsChild((err, entries, childCompilation) => {
          const errors = (err ? [err] : []).concat(childCompilation.errors)

          childCompilation.fileDependencies.forEach((file) => {
            compilation.fileDependencies.add(path.resolve(context, file))
          })

          if (!errors.length) {
            compilation.assets = Object.assign(
              childCompilation.assets,
              compilation.assets
            )

            compilation.namedChunkGroups = Object.assign(
              childCompilation.namedChunkGroups,
              compilation.namedChunkGroups
            )

            const readFile = (_, callback) => callback(null, childCompilation.assets[dest].source())
            return this.workboxInject.handleEmit(compilation, readFile)
              .then(() => {
                childProcessDone()
              })
              .catch(err => {
                compilation.errors.push(err)
                childProcessDone()
              })
          }
          compilation.errors.push(...errors)
          childProcessDone()
        })
      })

      cb()
    })
  }
}
