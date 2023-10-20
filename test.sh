#!/bin/bash

if [[ -z "${github-app-id}" ]]; then
    echo "github-app-id is not set"
    exit 1
fi

if [[ -z "${github-app-private-key}" ]]; then
    echo "github-app-private-key is not set"
    exit 1
fi

if [[ -z "${github-app-installation-id}" ]]; then
    echo "github-app-installation-id is not set"
    exit 1
fi

echo "All required environment variables are set"
