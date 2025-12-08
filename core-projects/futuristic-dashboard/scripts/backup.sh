#!/bin/bash
set -e

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${TIMESTAMP}.tar.gz"

mkdir -p $BACKUP_DIR
tar -czf "${BACKUP_DIR}/${BACKUP_FILE}" \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  .

find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete
echo "✅ 备份完成: ${BACKUP_FILE}"
