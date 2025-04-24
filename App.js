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

App.engine('hbs', hbs({
    defaultLayout: 'main.hbs' ,
    helpers: {
        urlencode: function(name) {
            return encodeURI(name);
        },
    }
}));

baseDir = path.join(__dirname, "files")

function getDirectories(context){
    let folders = [];
    fs.readdir(path.join(baseDir, context), (err, results)=> {
        results.forEach(e => {
            fs.lstat(path.join(baseDir, context, e), (err, stats)=>{
                if (stats.isDirectory())
                    folders.push({"name": e})
                }
            )
        })
    })
    return folders;
}

function getFiles(context){
    let files = [];
    fs.readdir(path.join(baseDir, context), (err, results)=> {
        results.forEach(e => {
            fs.lstat(path.join(baseDir, context, e), (err, stats)=>{
                if (stats.isFile())
                    files.push({"name": e})
                }
            )
        })
    })
    return files;
}

function prettySplit(text){
    let list = text.split('/');
    let ret = [];
    for(let i = 0; i < list.length; i++){
        let tmp = "/files/";
        for(let j = 0; j <= i; j++){
            tmp += list[j] + "/";
        }
        ret.push({display: list[i], path: tmp})
    }
    return ret;
}

App.get("/", (req, res) => {
    res.redirect("/files")
})

App.get("/files/:context*", (req, res) => {
    let context = path.join(req.params['context'], req.params[0])
    if(fs.existsSync(path.join(baseDir, context)))
        res.render("view.hbs", {
            "folders": getDirectories(context),
            "files": getFiles(context),
            "context": "/" + context,
            "split": prettySplit(context)
        });
    else{
        res.sendStatus("404")
    }
})

App.get("/files", (req, res) => {
    res.render("view.hbs", {
        "folders": getDirectories(""),
        "files": getFiles(""),
        "context": ""
    });
});

App.post("/createfolder", (req, res) => {
    let context = decodeURI(req.body.context);
    let orig = req.body.call;
    let name = orig;
    while(fs.existsSync(path.join(baseDir, context, name))){
        if(name.length > orig.length && name[name.length - 1] == ")"){
            name = orig + " (" + (Number(name[name.length - 2]) + 1) + ")";
        }else
            name = orig + " (1)"
    }
    fs.mkdir(path.join(baseDir, context, name),
        { recursive: false }, (err) => {});
    res.redirect("/files" + context);
});

App.post("/createfile", (req, res) => {
    let context = decodeURI(req.body.context);
    let orig = req.body.call;
    let name = orig;
    let split = name.length - 1;
    for(; split--; split >= 0){
        if(name[split] == ".")
            break;
    }
    let i = 1;
    while(fs.existsSync(path.join(baseDir, context, name))){
        name = orig.slice(0, split) + " (" + i + ")" + orig.slice(split)
        i++;
    }
    fs.appendFile(path.join(baseDir, context, name), "", (err) => {});
    res.redirect("/files" + context);
});

App.post('/uploadfile', function (req, res) {
    let context = decodeURI(req.body.context);
    let form = formidable({});
    form.keepExtensions = true;
    form.uploadDir = path.join(baseDir, context);
    form.parse(req, function (err, result, file) {
        console.log(result);
        let orig = file.upload.name;
        let name = orig;
        let split = name.length - 1;
        for(; split--; split >= 0){
            if(name[split] == ".")
                break;
        }
        let i = 1;
        while(fs.existsSync(path.join(baseDir, result, name))){
            name = orig.slice(0, split) + " (" + i + ")" + orig.slice(split)
            i++;
        }
        fs.rename(file.upload.path, path.join(baseDir, context, name), (err) => {});
        res.redirect("/files" + context);
    });
});

App.post('/deletefile', function (req, res) {
    let context = decodeURI(req.body.context);
    fs.unlink(path.join(baseDir, context, decodeURI(req.body.filename)), (err)=>{});
    res.send("ok");
})

App.post('/deletefolder', function (req, res) {
    let context = req.body.context
    fs.rm(path.join(baseDir, decodeURI(context), decodeURI(req.body.foldername)), {recursive: true},(err)=>{});
    res.send("ok");
})

App.use(express.static('static'));

App.listen(3000, () => {
    console.log("http://localhost:" + 3000)
});