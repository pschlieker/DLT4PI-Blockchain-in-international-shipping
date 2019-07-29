# ToopShipping Frontend
The proof-of-concept can also be run with a Webinterface.

Launch the Node JS REST-API Backend
```
# folder ../application/javascript
node app.js
```

Launch the frontend Angular framework
```
# folder ./ToopShipping
npm install
ng serve
```
The webinterface becomes available under http://localhost:4200 .The whole showcase is developed for the country Denmark. Hence this should be selected on startup.  
The automatically created certificates do not include an actual PDF. This is due to the fact, that they are instantiated as dummy date, during the startup of the system. A certificate containing a PDF can be either created by hand as upload in the interface or using the previously introduced test function `node runFabricModuleTests.js testCreateCertificateWithPDF`.   
Some Popup-Blockers might block the PDF from being opened.

#### Mock of ship position
The following call allows a ship to be moved within the territory of Denmark. 
`http://localhost:3000/moveShipMock/imo`
An example is prepared for the ship with the imo 9762687.
1. When the system is first started, the ship (9762687 TIIU Zoo) will be displayed, but no certificates are visible.
2. The ship can be moved to Denmark by making a GET-Request on  `http://localhost:3000/moveShipMock/9762687`
3. The certificates can now be displayed
