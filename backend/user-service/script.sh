#!/bin/bash
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
elif [ -f ../../.env ]; then
    export $(grep -v '^#' ../../.env | xargs)
fi