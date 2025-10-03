#!/usr/bin/env bash

# Absolute bare minimum script for testing execution
LOG_DIR="/tmp/mcp-chrome-logs"
mkdir -p "${LOG_DIR}"
echo "--- MINIMAL run_host.sh EXECUTED AT $(date) ---" > "${LOG_DIR}/minimal_execution_$(date +"%Y%m%d_%H%M%S").log"
exit 0