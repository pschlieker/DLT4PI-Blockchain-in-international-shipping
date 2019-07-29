#!/bin/bash

if [[ $1 == 'in' ]]; then
    echo Moving ship into range
    cp ~/blockchain-shipping/oracle/html/9762687_in ~/blockchain-shipping/oracle/html/9762687
elif [[ $1 == 'out' ]]; then
    echo Moving ship out of range
    cp ~/blockchain-shipping/oracle/html/9762687_out ~/blockchain-shipping/oracle/html/9762687
else   
    echo Usage:
    echo Move ship into range of MA: ./moveShip.sh in
    echo Move ship out of range of MA: ./moveShip.sh out 
fi
