GITLAB_TOKEN=your_token
PROJECT_ID=your_project_id
VERSION=v1.0.2

curl --request POST \
  --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  --form "name=$VERSION" \
  --form "tag_name=$VERSION" \
  --form "description=< changelog-diff.md 内容 >" \
  --form "file=@email-services-1.0.2.tgz" \
  "https://gitlab.com/api/v4/projects/$PROJECT_ID/releases"
