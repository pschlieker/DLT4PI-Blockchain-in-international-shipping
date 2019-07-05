#!/bin/bash

docker-compose down -v

rm -Rf ./ipfs-docker-data/
rm -Rf ./ipfs-docker-staging/