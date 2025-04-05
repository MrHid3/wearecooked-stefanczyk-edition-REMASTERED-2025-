const fs = require("fs")
const path = require("path")
const express = require("express")
const hbs = require('express-handlebars');
const formidable = require('formidable');
const App = express()

let current = "files"

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
    res.render("view.hbs", {
        "folders": getDirectories(current),
        "files": getFiles(current),
        "deleteFile": "deleteFile()"
    });
});

App.post("/createfolder", (req, res) => {
    let orig = req.body.call;
    let name = orig;
    while(fs.existsSync(path.join(__dirname, current, name))){
        if(name.length > orig.length && name[name.length - 1] == ")"){
            name = orig + " (" + (Number(name[name.length - 2]) + 1) + ")";
        }else
            name = orig + " (1)"
    }
    console.log(name)
    fs.mkdir(path.join(__dirname, current, name),
        { recursive: false }, (err) => {});
    res.redirect("/");
});

App.post("/createfile", (req, res) => {
    fs.appendFile(path.join(__dirname, current, req.body.call), "", (err) => {
        console.log("skibidibi dab dab")
    });
    res.redirect("/");
});

App.post('/uploadfile', function (req, res) {
    let form = formidable({});
    form.keepExtensions = true;
    form.uploadDir = path.join(__dirname, current);
    form.parse(req, function (err, result, file) {
        fs.rename(file.upload.path, path.join(__dirname, current,file.upload.name),
            (err) => {});
        res.redirect("/");
    });
});

App.post('/deletefile', function (req, res) {
    fs.unlink(path.join(__dirname, current, req.body.filename), (err)=>{});
    res.send("ok");
})

App.post('/deletefolder', function (req, res) {
    fs.rmdir(path.join(__dirname, current, req.body.foldername), (err)=>{});
    res.send("ok");
})

App.use(express.static('static'));

App.listen(3000, () => {
    console.log("http://localhost:" + 3000)
});