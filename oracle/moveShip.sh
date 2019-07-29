#!/bin/bash

if [[ $1 == 'in' ]]; then
    echo Moving ship into range
    cp ./html/9148843_in ./html/9148843
elif [[ $1 == 'out' ]]; then
    echo Moving ship out of range
    cp ./html/9148843_out ./html/9148843
else   
    echo Usage:
    echo Move ship into range of MA: ./moveShip.sh in
    echo Move ship out of range of MA: ./moveShip.sh out 
fi
