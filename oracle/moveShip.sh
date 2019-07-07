#!/bin/bash

if [[ $1 == 'in' ]]; then
    echo Moving ship into range
    cp ./html/ship1_in ./html/ship1
elif [[ $1 == 'out' ]]; then
    echo Moving ship out of range
    cp ./html/ship1_out ./html/ship1
else   
    echo Usage:
    echo Move ship into range of MA: ./moveShip.sh in
    echo Move ship out of range of MA: ./moveShip.sh out 
fi
