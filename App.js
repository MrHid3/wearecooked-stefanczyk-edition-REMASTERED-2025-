const fs = require("fs")
const path = require("path")
const express = require("express")
const hbs = require('express-handlebars');
const formidable = require('formidable');
const archiver = require("archiver")
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
    let list = text.split('\\'); //system operacyjny stworzony przez deranged psychopatów
    // let list = text.split('/'); //zdrowy system operacyjny
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
    let context = path.join(decodeURI(req.params['context']), decodeURI(req.params[0]))
    if(fs.existsSync(path.join(baseDir, context)))
        res.render("view.hbs", {
            folders: getDirectories(context),
            files: getFiles(context),
            context: "/" + context,
            split: prettySplit(context)
        });
    else{
        res.render("notFound.hbs", {
            context: "/" + context
        })
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
    fs.mkdir(path.join(baseDir, context, name), { recursive: false }, (err) => {});
    res.redirect("/files" + context);
});

App.post("/createfile", (req, res) => {
    let context = decodeURI(req.body.context);
    let orig = req.body.call + "." + req.body.extension;
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
    let content;
    switch (req.body.extension){
        case "css":
            content = "body{ background-color: black;}";
            break;
        case "html":
            content = "<!DOCTYPE HTML><html><head></head><body></body></html>"
            break;
        case "json":
            content = "{epic: 'project'}"
            break;
        default:
            content = "no extensiton provided"
    }
    fs.appendFile(path.join(baseDir, context, name), content, (err) => {});
    res.redirect("/files" + context);
});

App.post('/uploadfile', function (req, res) {
    let form = formidable({});
    form.keepExtensions = true;
    form.uploadDir = path.join(baseDir);
    form.multiples = true;
    form.parse(req, function (err, result, files) {
        // console.log(files)
        if (files.upload.length > 1){
            files.upload.forEach(file => {
                // req.uploadDir = path.join(baseDir, result.context);
                let orig = file.name;
                let name = orig;
                let split = name.length - 1;
                for(; split--; split >= 0){
                    if(name[split] == ".")
                        break;
                }
                let i = 1;
                while(fs.existsSync(path.join(baseDir, decodeURI(result.context), name))){
                    name = orig.slice(0, split) + " (" + i + ")" + orig.slice(split)
                    i++;
                }
                fs.rename(file.path, path.join(baseDir, decodeURI(result.context), name), (err) => {
                    // console.log(file.path, name);
                    if(err) console.log(err);
                });
            });
            res.redirect("/files" + result.context);
        }else if(files){
            // console.log(files)
            // req.uploadDir = path.join(baseDir, result.context);
            let orig = files.upload.name;
            let name = orig;
            let split = name.length - 1;
            for (; split--; split >= 0) {
                if (name[split] == ".")
                    break;
            }
            let i = 1;
            while (fs.existsSync(path.join(baseDir, decodeURI(result.context), name))) {
                name = `${orig.slice(0, split)} (${i})${orig.slice(split)}`
                i++;
            }
            fs.rename(files.upload.path, path.join(baseDir, decodeURI(result.context), name), (err) => {
                // console.log(files.upload.path, name);
                if (err) console.log(err);
                res.redirect("/files" + result.context);
            });
        }
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

App.get("/downloadfile/:context*", function (req, res) {
    res.download(path.join(baseDir, req.params['context'], req.params[0]));
})

App.get("/downloadfolder/:context*", function (req, res) {
    let context = decodeURI(req.params['context'])
    let name = decodeURI(req.params[0])
    if (name == ""){
        name = context;
        context = "";
    }
    const tempDir = path.join(__dirname, "temp");
    const outputPath = path.join(tempDir, name + '.zip');

    fs.rm(tempDir, { recursive: true, force: true }, (err) => {
        fs.mkdir(tempDir, { recursive: true }, () => {
            const output = fs.createWriteStream(outputPath);
            const archive = archiver('zip', { zlib: { level: 9 } });
            archive.pipe(output);
            output.on('close', () => {
                // console.log(outputPath)
                res.download(outputPath, (err) => {
                    if (err) {
                        console.error('Download failed:', err);
                        res.status(500).send('Download failed');
                    }
                    fs.unlink(outputPath, () => {});
                });
            });
            archive.on('error', (err) => {
                console.error('Archive error:', err);
                res.status(500).send('Archive creation failed');
            });
            archive.directory(path.join(baseDir, context, name), false);
            archive.finalize();
        });
    });
});

App.post('/rename', function(req, res){
    fs.rename(path.join(baseDir, decodeURI(req.body.context), decodeURI(req.body.previous)), path.join(baseDir, decodeURI(req.body.context), decodeURI(req.body.new_name)), (err)=>{
        if(err) console.log(err);
    });
    res.redirect(`/files${req.body.context}`);
})

App.use(express.static('static'));
App.use(express.static('temp'));

App.listen(3000, () => {
    console.log("http://localhost:" + 3000)
});
