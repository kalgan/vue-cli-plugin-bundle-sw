# vue-cli-plugin-bundle-sw

#### [WIP] not ready for your projects

Sample config in your `vue.config.js` file:
```javascript
const IS_DEV = process.env.NODE_ENV === 'development'

module.exports = {
  pluginOptions: {
    swBundle: {
      src: path.resolve(__dirname, 'src', 'sw.js'),
      dest: 'service-worker.js',
      workboxOptions: {
        importWorkboxFrom: IS_DEV ? 'cdn' : 'local'
      },
      silent: false
    }
  }
}
```