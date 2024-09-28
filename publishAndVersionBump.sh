#!/bin/bash
npm run updateVersion
git add -A
git c -m 'Bump version'
git push
npm publish