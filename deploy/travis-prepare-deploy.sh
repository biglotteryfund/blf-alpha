#!/bin/bash
set -ev
#################################################
# Prepare Deploy
#################################################
# Prepare Travis deploy artefact

# Prune devDependencies from artefact
npm prune --production > /dev/null 2>&1;

# Store deploy metadata
# Later loaded via the app to reference deploy metadata
destdir=$TRAVIS_BUILD_DIR/config/deploy.json
touch "$destdir"
if [ -f "$destdir" ]
then
    echo "{ \"buildNumber\": \"$TRAVIS_BUILD_NUMBER\", \"deployId\": \"DEPLOY_ID\", \"commitId\": \"$TRAVIS_COMMIT\" }" > "$destdir"
fi

# Bundle deploy artefact, excluding any unneeded files
zip -qr latest ./* -x .\* -x "README.md" -x assets/\*;

# Store artefact locally for later use in Travis deploy step
mkdir -p codedeploy_artefact
mv latest.zip codedeploy_artefact/build-"$TRAVIS_BUILD_NUMBER".zip
