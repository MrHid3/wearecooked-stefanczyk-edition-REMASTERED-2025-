const fs = require("fs")
const path = require("path")
const express = require("express")
const hbs = require('express-handlebars');
const formidable = require('formidable');
const App = express()

let current = "files"

// const context = {
//     "folders": [
//         {"name": "skibidibi"}
//     ],
    
//     "files": [
//         {"name": "dab dab"}
//     ]
// }

App.set('views', path.join(__dirname, 'views'));
App.engine('hbs', hbs({ defaultLayout: 'main.hbs' }));
App.set('view engine', 'hbs');
App.use(express.json());
App.use(express.urlencoded({ extended: false }));

function getDirectories(pathname){
    let folders = [];
    fs.readdir(path.join(__dirname, pathname), (err, results)=> {
        results.forEach(e => {
            fs.lstat(path.join(__dirname, pathname, e), (err, stats)=>{
                if (stats.isDirectory())
                    folders.push({"name": e})
                }
            )
        })
    })
    return folders;
}

function getFiles(pathname){
    let files = [];
    fs.readdir(path.join(__dirname, pathname), (err, results)=> {
        results.forEach(e => {
            fs.lstat(path.join(__dirname, pathname, e), (err, stats)=>{
                if (stats.isFile())
                    files.push({"name": e})
                }
            )
        })
    })
    return files;
}

App.get("/", (req, res) => {
    res.render("view.hbs", {"folders": getDirectories(current), "files": getFiles(current)});
})

App.get("/createfolder", (req, res) => {
    console.log(path.join(__dirname, current, req.params.call))
    fs.mkdir(path.join(__dirname, current, req.params.call), { recursive: false }, (err) => {
        console.log("skibidibi dab dab")
    });
})

App.use(express.static('static'))

App.listen(3000, () => {
    console.log("start serwera na porcie ", 3000)
})