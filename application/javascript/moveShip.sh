#!/bin/bash

IMO="9762687"

if [ "$#" -eq 2 ] ; then
    IMO=$2
fi

if [[ $1 == 'in' ]]; then
    echo Moving ship into range
    cp ../../oracle/html/9762687_in ../../oracle/html/${IMO}
elif [[ $1 == 'out' ]]; then
    echo Moving ship out of range
    cp ../../oracle/html/9762687_out ../../oracle/html/${IMO}
else   
    echo Usage:
    echo Move ship into range of MA: ./moveShip.sh in imo
    echo Move ship out of range of MA: ./moveShip.sh out imo
    echo If no imo is provided 9762687 will be used
fi
