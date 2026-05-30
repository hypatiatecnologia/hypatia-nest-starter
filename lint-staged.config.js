module.exports = {
  'src/**/*.ts': ['eslint --fix', 'prettier --write'],
  'test/**/*.ts': ['eslint --fix', 'prettier --write'],
  '{src,test}/**/*.{spec,e2e-spec}.ts': [
    'cross-env NODE_ENV=test jest --bail --passWithNoTests --findRelatedTests',
  ],
};
