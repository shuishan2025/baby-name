#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR%/scripts}"

npm install --prefix "$PROJECT_ROOT/backend"
npm install --prefix "$PROJECT_ROOT/frontend"
