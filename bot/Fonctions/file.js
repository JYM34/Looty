const fs = require('fs')
const config = require('../config')


module.exports.TestFile = TestFile
module.exports.SaveFile = SaveFile

function TestFile() {

    fs.readFile('./games.json', 'utf8', (err, data) => {
        if (err) {
            log.success(`${config.RED}TestFile ${config.WHITE} games.json n'existe pas!`)
            WriteFile()
        }
        else {
            if(!data) {
                log.success(`${config.RED}TestFile ${config.WHITE} games.json existe mais pas conforme!`)
                WriteFile()
            }
            else {
                log.success(`${config.BLUE}TestFile ${config.WHITE} ${config.GREEN}games.json ${config.WHITE}initialisé!`) 
            }
        }
    })
}
function WriteFile() {
    var localDateTime = new Date().toLocaleString("fr-FR", {timeZone: "Europe/Paris"})  
    fs.writeFile('./games.json', '[]', (err) => {
        if (err) {
            log.success(`${config.RED}ERREUR : Initialisation imposible${config.WHITE}`)
        }
        else {
            log.success(`${config.RED}Initialisation terminé${config.WHITE}`)
        }
    })
}

function SaveFile(obj) {
    var localDateTime = new Date().toLocaleString("fr-FR", {timeZone: "Europe/Paris"})
    fs.writeFile('./games.json', obj, (err) => {
        if (err) {
            log.success('writeFile ==> '+err)
        }
        else {
            log.success(`${config.RED}Sauvegarde des changements terminé${config.WHITE}`)
            log.success(`-------------------------`)
        }
    })
}
