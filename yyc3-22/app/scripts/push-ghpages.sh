#!/bin/bash
CHART_FILE=$(ls email-services-*.tgz | tail -n 1)

helm repo index . --url https://yyc3.github.io/YanYuCloudCube

git checkout gh-pages
mv $CHART_FILE index.yaml ./charts/
git add ./charts/$CHART_FILE ./charts/index.yaml
git commit -m "Publish $CHART_FILE"
git push origin gh-pages
