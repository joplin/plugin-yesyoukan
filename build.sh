#!/bin/bash
npm run dist
PLUGIN_VERSION="$(npm pkg get version | tr -d '"')"
mv "publish/org.joplinapp.plugins.YesYouKan.jpl" "publish/org.joplinapp.plugins.YesYouKan-$PLUGIN_VERSION.jpl"
