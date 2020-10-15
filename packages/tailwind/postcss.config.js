module.exports = {
    plugins: [
      require('postcss-custom-properties')({preserve: false}),
      require('autoprefixer'),
      ...process.env.NODE_ENV === 'production'
        ? [require('cssnano')]
        : []
    ]
  }
  