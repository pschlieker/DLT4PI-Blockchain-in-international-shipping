const fs = require('fs')
const geolocation = require('geolocation-utils')

estoniaBorders = fs.readFileSync('estonia-eez-outerbounds.json')
estoniaBorders = JSON.parse(estoniaBorders)['geometry']['coordinates']

denmarkBorders = fs.readFileSync('denmark-eez-outerbounds.json')
denmarkBorders = JSON.parse(denmarkBorders)['geometry']['coordinates']

console.log(estoniaBorders)

console.log(geolocation.insidePolygon([59.336163, 23.712592], estoniaBorders))
console.log(geolocation.insidePolygon([23.712592, 59.336163], estoniaBorders))
console.log(geolocation.insidePolygon([49.7564125, -1.6506166], denmarkBorders))
console.log(geolocation.insidePolygon([49.7564125, -1.6506166], denmarkBorders))

