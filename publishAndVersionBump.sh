#!/bin/bash
NEW_VERSION=$(npm run --silent updateVersion)
git add -A
git c -m "v$NEW_VERSION"
git tag "v$NEW_VERSION"
git push
git push --tags
npm publish