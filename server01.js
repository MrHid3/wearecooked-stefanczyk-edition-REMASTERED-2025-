const fs = require("fs")
const path = require("path")
const express = require("express")
const hbs = require('express-handlebars');
const formidable = require('formidable');
const App = express()

App.set('views', path.join(__dirname, 'views'));
App.engine('hbs', hbs({ defaultLayout: 'main.hbs' }));
App.set('view engine', 'hbs');
App.use(express.json());
App.use(express.urlencoded({ extended: false }));

baseDir = path.join(__dirname, "files")
let context = [];


function getDirectories(pathname){
    let folders = [];
    fs.readdir(path.join(baseDir), pathname), (err, results)=> {
        results.forEach(e => {
            fs.lstat(path.join(baseDir, pathname, e), (err, stats)=>{
                if (stats.isDirectory())
                    folders.push({"name": e})
                }
            )
        })
    }
    return folders;
}

function getFiles(pathname){
    let files = [];
    fs.readdir(path.join(baseDir, pathname), (err, results)=> {
        results.forEach(e => {
            fs.lstat(path.join(baseDir, pathname, e), (err, stats)=>{
                if (stats.isFile())
                    files.push({"name": e})
                }
            )
        })
    })
    return files;
}

function getContext(){
    let ret = ""
    if (context.length > 0)
        context.forEach((e) => {
            ret = path.join(ret, e)
        })
    return ret;
}

App.get("/", (req, res) => {
    res.render("view.hbs", {
        "folders": getDirectories(getContext()),
        "files": getFiles(getContext()),
        "deleteFile": "deleteFile()",
        "context": [{folder: "skibidi"}]
    });
});

App.post("/createfolder", (req, res) => {
    let orig = req.body.call;
    let name = orig;
    while(fs.existsSync(path.join(__dirname, getContext(), name))){
        if(name.length > orig.length && name[name.length - 1] == ")"){
            name = orig + " (" + (Number(name[name.length - 2]) + 1) + ")";
        }else
            name = orig + " (1)"
    }
    console.log(name)
    fs.mkdir(path.join(__dirname, getContext(), name),
        { recursive: false }, (err) => {});
    res.redirect("/");
});

App.post("/createfile", (req, res) => {
    let orig = req.body.call;
    let name = orig;
    let split = name.length - 1;
    for(; split--; split >= 0){
        if(name[split] == ".")
            break;
    }
    let i = 1;
    while(fs.existsSync(path.join(__dirname, getContext(), name))){
        name = orig.slice(0, split) + " (" + i + ")" + orig.slice(split)
        i++;
    }
    fs.appendFile(path.join(__dirname, getContext(), name), "", (err) => {});
    res.redirect("/");
});

App.post('/uploadfile', function (req, res) {
    let form = formidable({});
    form.keepExtensions = true;
    form.uploadDir = path.join(__dirname, current);
    form.parse(req, function (err, result, file) {
        let orig = file.upload.name;
        let name = orig;
        let split = name.length - 1;
        for(; split--; split >= 0){
            if(name[split] == ".")
                break;
        }
        let i = 1;
        while(fs.existsSync(path.join(__dirname, getContext(), name))){
            name = orig.slice(0, split) + " (" + i + ")" + orig.slice(split)
            i++;
        }
        fs.rename(file.upload.path, path.join(__dirname, getContext(), name), (err) => {});
        res.redirect("/");
    });
});

App.post('/deletefile', function (req, res) {
    console.log(path.join(baseDir, getContext(), req.body.filename))
    fs.unlink(path.join(baseDir, getContext(), req.body.filename), (err)=>{});
    res.send("ok");
})

App.post('/deletefolder', function (req, res) {
    fs.rmdir(path.join(baseDir, getContext(), req.body.foldername), (err)=>{});
    res.send("ok");
})

App.use(express.static('static'));

App.listen(3000, () => {
    console.log("http://localhost:" + 3000)
});