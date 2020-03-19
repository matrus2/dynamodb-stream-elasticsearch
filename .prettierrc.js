module.exports = {
  printWidth: 120,
  tabWidth: 4,
  singleQuote: true,
  overrides: [
    {
      files: '*.md',
      options: {
        tabWidth: 2,
        proseWrap: 'preserve'
      }
    },
    {
      files: '*.yml',
      options: {
        tabWidth: 2,
        proseWrap: 'preserve'
      }
    },
    {
      files: '*.yaml',
      options: {
        tabWidth: 2,
        proseWrap: 'preserve'
      }
    }
  ]
};
