#!/bin/bash
CONFIG="./.helm/chartmuseum.yaml"
CHART_FILE=$(ls email-services-*.tgz | tail -n 1)

URL=$(grep url $CONFIG | awk '{print $2}')
USER=$(grep username $CONFIG | awk '{print $2}')
PASS=$(grep password $CONFIG | awk '{print $2}')
REPO=$(grep repository $CONFIG | awk '{print $2}')

curl --user "$USER:$PASS" --data-binary "@$CHART_FILE" "$URL/api/charts"
