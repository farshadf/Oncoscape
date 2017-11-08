db = require('./app.db.js');
const mongoose = require('mongoose');
const request = require('request');
const asyncLoop = require('node-async-loop');
Query = require('./app.query.js');
Permissions = require('./app.permissions.js');
var User = require("./models/user");
var Project = require("./models/project");
var File = require("./models/file");
var IRB = require("./models/irb");
var Permission = require("./models/permission");

const jwt = require('jsonwebtoken');

function processResult(req, res, next, query) {
    return function (err, data) {
        if (err) {
            console.log(err);
            res.status(404).send("Not Found").end();
        } else {
            // console.log("^&^&^&^&^&: ", data);
            res.json(data).end();
        }
    };
};

function checkUserExistance(gmail){
    return new Promise((resolve, reject) => {
        User.findOne({"Gmail": gmail }, function(req, result){
           resolve(result);
        });
    });   
}


var init = function (app) {

    app.get("/api/ping", function (req, res, next) {
        res.send((new Date()).toString());
        res.end();
    });
    app.post('/api/token', function(req, res, next) {
        // Pull Token Out Of Request Body
        var token = req.body.token;
        request({ url: 'https://www.googleapis.com/oauth2/v3/userinfo', qs: { access_token: token }, method: 'POST', json: true },
        function (err, response, body) {
            // Google Returns Email Address For Token
            checkUserExistance(body.email).then(user => {
                if (user != null){
                    Permissions.getToken(db, body.email).then(jwtTokens => {
                        res.send({token: jwtTokens }).end();
                    });
                } else {
                    res.send({gmail: body.email}).end();
                }
            });
        });
    }); 
    app.post('/api/users/checkGmail/:gmail', function(req, res, next){
        checkUserExistance(req.params.gmail).then(user => {
            res.send({user: user}).end();
        })
    });

    //#region PROJECTS

    app.get('/api/projects/:query', Permissions.jwtVerification, function (req, res, next) {
        if (!req.isAuthenticated) {
            console.log('!@! NOT AUTH');
            res.status(404).send('Not Authenticated!');
        } else {
            console.log('&&&&&& authenticated GET api/projects {query}', req.params.query);
            var query = {};
            if (req.params.query.split(":")[0] == '_id') {
                console.log(req.params.query.split(":")[1]);
                var IDs = req.params.query.split(":")[1].split(",").map(function (p) {
                                return mongoose.Types.ObjectId(p);
                            });
                var obj = {};
                obj['$in'] = IDs;
                query['_id'] = obj;
                Project.find(query, processResult(req, res));
            } else {
                Project.find(req.params.query, processResult(req, res));
            }
        }
        // console.log(req.params.query);
        // var query = {};
        // if (req.params.query.split(":")[0] == 'User' || req.params.query.split(":")[0] == 'Project') {
        //     query[req.params.query.split(":")[0]] =  mongoose.Types.ObjectId(req.params.query.split(":")[1]);
        //     console.log(query);
        //     Permission.find(query, processResult(req, res));
        // } else {
        //     Permission.find(req.params.query, processResult(req, res));
        // }
        // next();
    });
    app.post('/api/projects', Permissions.jwtVerification, function (req, res, next) {
        if (!req.isAuthenticated) {
            console.log('!@! NOT AUTH');
            res.status(404).send('Not Authenticated!');
        } else {
            console.log('&&&&&& authenticated POST api/projects {}');
            console.log('DEBUGG>>>', req.body);
            Project.create(req.body, processResult(req, res));
        }
    });
    // app.get('/api/projects/:id', Permissions.jwtVerification,  function (req, res, next) {
    //     if (!req.isAuthenticated) {
    //         console.log('!@! NOT AUTH');
    //         res.status(404).send('Not Authenticated!');
    //     } else {
    //         console.log('&&&&&& authenticated GET api/projects {_id: req.params.id}');
    //         Project.find({_id: req.params.id}, processResult(req, res));
    //     }
    // });
    app.put('/api/projects/:id', Permissions.jwtVerification, function (req, res, next) {
        if (!req.isAuthenticated) {
            console.log('!@! NOT AUTH');
            res.status(404).send('Not Authenticated!');
        } else {
            console.log('&&&&&& authenticated PUT api/projects {}');
            Project.findOneAndUpdate({ _id: req.params.id }, req.body, { upsert: false }, processResult(req, res));
        }
    });
    app.delete('/api/projects/:id', Permissions.jwtVerification, function (req, res, next) {
        if (!req.isAuthenticated) {
            console.log('!@! NOT AUTH');
            res.status(404).send('Not Authenticated!');
        } else {
            console.log('&&&&&& authenticated DELETE api/projects {}');
            Project.remove({ _id: req.params.id }, processResult(req, res));
        }
        
    });

    //#endregion

    //#region PERMISSIONS

    app.get('/api/permissions', Permissions.jwtVerification, function (req, res, next) {

        // if (!req.isAuthenticated) return 404
        // Permission.find({User: req.userid}, processResult(req, res));
        if (!req.isAuthenticated) {
            console.log('!@! NOT AUTH');
            res.status(404).send('Not Authenticated!');
        } else {
            console.log('&&&&&& authenticated GET api/permissions {}');
            Permission.find({}, processResult(req, res));
        }
    });
    app.post('/api/permissions', Permissions.jwtVerification, function (req, res, next) {
        console.log('what do we received from client: ', req.body);

        // if (!req.isAuthenticated) return 404
        // Query Mongo To Determine If req.userid has write or admin permissions on the req.body.projectId
        // If Not Return 404
        if (!req.isAuthenticated) {
            console.log('!@! NOT AUTH');
            res.status(404).send('Not Authenticated!');
        } else {
            console.log('&&&&&& authenticated POST api/permissions {}');
            Permission.create(req.body, processResult(req, res));
        }
    });
    app.get('/api/permissions/:query', Permissions.jwtVerification, function (req, res, next) {
        console.log('&&&&&& authenticated GET api/permissions {query: req.params.query}');
        // if (!req.isAuthenticated) return 404
        // Add The User Where Clause - Permission.find({User: req.userid}, processResult(req, res));
        // Find {_id: req.params.id, user=req.userid} 
        if (!req.isAuthenticated) {
            console.log('!@! NOT AUTH');
            res.status(404).send('Not Authenticated!');
        } else {
            console.log('&&&&&& authenticated GET api/permissions {query: req.params.query}');
            // var query = (req.params.query) ? JSON.parse(req.params.query) : {};
            console.log(req.params.query);
            var queryJSON = req.params.query;
            var query = {};
            if (queryJSON.indexOf(";") > -1) {
                queryJSON.split(";").forEach(function(q){
                    if(q.split(":")[0] == '_id' ||
                       q.split(":")[0] == 'Project' ||
                       q.split(":")[0] == 'User') {
                        // query[q.split(":")[0]] = mongoose.Types.ObjectId(q.split(":")[1]);
                        var obj = {};
                        obj['$in'] = q.split(":")[1].split(",").map(function(p){
                            return mongoose.Types.ObjectId(p);
                        });
                        query[q.split(":")[0]] = obj;
                       } else {
                        query[q.split(":")[0]] = q.split(":")[1];
                       } 
                })
                console.log('******************', query);
                Permission.find(query, processResult(req, res));
            } else {
                if (queryJSON.split(":")[0] == 'User' || queryJSON.split(":")[0] == 'Project') {
                    query[queryJSON.split(":")[0]] =  mongoose.Types.ObjectId(queryJSON.split(":")[1]);
                    console.log(query);
                    Permission.find(query, processResult(req, res));
                } else {
                    Permission.find(queryJSON, processResult(req, res));
                }
            }
        }
    });
    app.put('/api/permissions/:id', Permissions.jwtVerification, function (req, res, next) {

        // if (!req.isAuthenticated) return 404
        // Add The User Where Clause - Permission.find({User: req.userid}, processResult(req, res));
        // Find {_id: req.params.id, user=req.userid} 
        if (!req.isAuthenticated) {
            console.log('!@! NOT AUTH');
            res.status(404).send('Not Authenticated!');
        } else {
            console.log('& authenticated PUT api/permissions {}');
            Permission.findOneAndUpdate({ _id: req.params.id }, req.body, { upsert: false }, processResult(req, res));
        }
    });
    
    app.delete('/api/permissions/:query', Permissions.jwtVerification, function (req, res, next) {
        console.log('outside: && authenticated DELETE api/permissions {req.params.query}: ', req.params.query);
        if (!req.isAuthenticated) {
            console.log('!@! NOT AUTH');
            res.status(404).send('Not Authenticated!');
        } else {
            console.log('&& authenticated DELETE api/permissions {req.params.query}: ', req.params.query);
            console.log(req.params.query);
            var queryJSON = req.params.query;
            var query = {};
            if (queryJSON.indexOf(";") > -1) {
                queryJSON.split(";").forEach(function(q){
                    if(q.split(":")[0] == '_id' ||
                       q.split(":")[0] == 'Project' ||
                       q.split(":")[0] == 'User') {
                        // query[q.split(":")[0]] = mongoose.Types.ObjectId(q.split(":")[1]);
                        var obj = {};
                        obj['$in'] = q.split(":")[1].split(",").map(function(p){
                            return mongoose.Types.ObjectId(p);
                        });
                        query[q.split(":")[0]] = obj;
                       } else {
                        query[q.split(":")[0]] = q.split(":")[1];
                       } 
                })
                console.log('******************', query);
            Permission.remove(query, processResult(req, res));
            } else {
                if (queryJSON.split(":")[0] == 'User' || queryJSON.split(":")[0] == 'Project') {
                    query[queryJSON.split(":")[0]] =  mongoose.Types.ObjectId(queryJSON.split(":")[1]);
                    console.log(query);
                    Permission.remove(query, processResult(req, res));
                } else {
                    Permission.remove(queryJSON, processResult(req, res));
                }
            }
        }
    });

    //#endregion

    //#region USERS
    app.get('/api/users', Permissions.jwtVerification, function (req, res, next) {
        if (!req.isAuthenticated) {
            console.log('!@! NOT AUTH');
            res.status(404).send('Not Authenticated!');
        } else {
            console.log('&&&&&& authenticated GET api/user {}');
            User.find({}, processResult(req, res));
        }
    });
    app.post('/api/users', function (req, res, next) {
        User.create(req.body, processResult(req, res));
        console.log('***** NO AUTH is REQUIRED ****');
        console.log('any req:', req.isAuthenticated);
        // if (!req.isAuthenticated) {
        //     console.log('!@! NOT AUTH');
        //     res.status(404).send('Not Authenticated!');
        // } else {
        //     console.log('&&&&&& authenticated POST api/user {}');
        //     User.create(req.body, processResult(req, res));
        // }
    });
    app.get('/api/users/:id', Permissions.jwtVerification, function (req, res, next) {
        if (!req.isAuthenticated) {
            console.log('!@! NOT AUTH');
            res.status(404).send('Not Authenticated!');
        } else {
            console.log('&&&&&& authenticated GET api/user {_id: req.params.id}');
            User.find({_id: req.params.id}, processResult(req, res));
        }
    });
    app.put('/api/users/:id', Permissions.jwtVerification, function (req, res, next) {
        if (!req.isAuthenticated) {
            console.log('!@! NOT AUTH');
            res.status(404).send('Not Authenticated!');
        } else {
            console.log('&&&&&& authenticated PUT api/user {}');
            User.findOneAndUpdate({ _id: req.params.id }, req.body, { upsert: false }, processResult(req, res));
        }
    });
    app.delete('/api/users/:id', Permissions.jwtVerification, function (req, res, next) {
        if (!req.isAuthenticated) {
            console.log('!@! NOT AUTH');
            res.status(404).send('Not Authenticated!');
        } else {
            console.log('&&&&&& authenticated DELETE api/user {_id: req.params.id}');
            User.remove({ _id: req.params.id }, processResult(req, res));
        }
    });

    //#endregion

    //#region FILES

    app.get('/api/files', Permissions.jwtVerification, function (req, res) {
        console.log("in Files");
        res.status(200).end();
    });

    app.post('/api/files', Permissions.jwtVerification, function (req, res) {
        console.log("in post");
    });

    app.get('/api/files/:id', Permissions.jwtVerification, function (req, res) {
        var projectID = req.params.id;
        db.getConnection().then(db => {
            db.db.listCollections().toArray(function (err, collectionMeta) {
                if (err) {
                    console.log(err);
                }
                else {
                    projectCollections = collectionMeta.map(function (m) {
                        return m.name;
                    }).filter(function (m) {
                        return m.indexOf(projectID) > -1;
                    });
    
                    if (projectCollections.length === 0) {
                        res.status(200).send("Not Found or No File has been uploaded yet.").end();
                        // res.send('Not Find').end();
                    } else {
                        var arr = [];
                        asyncLoop(projectCollections, function (m, next) {
                            db.collection(m).find().toArray(function (err, data) {
                                var obj = {};
                                obj.collection = m;
                                if (m.indexOf("clinical") > -1) {
                                    obj.category = "clinical";
                                    obj.patients = data.map(function (m) { return m.id });
                                    obj.metatdata = data[0].metadata;
                                    obj.enums_fields = data.map(function (m) { return Object.keys(m.enums); })
                                        .reduce(function (a, b) { return a = _.uniq(a.concat(b)); });
                                    obj.nums_fields = data.map(function (m) { return Object.keys(m.nums); })
                                        .reduce(function (a, b) { return a = _.uniq(a.concat(b)); });
                                    obj.time_fields = data.map(function (m) { return Object.keys(m.time); })
                                        .reduce(function (a, b) { return a = _.uniq(a.concat(b)); });
                                    obj.boolean_fields = data.map(function (m) { return Object.keys(m.boolean); })
                                        .reduce(function (a, b) { return a = _.uniq(a.concat(b)); });
                                    arr.push(obj);
                                } else if (m.indexOf("molecular") > -1) {
                                    obj.category = "molecular";
                                    var types = _.uniq(data.map(function (m) { return m.type }));
                                    types.forEach(function (n) {
                                        obj[n] = {};
                                        typeObjs = data.filter(function (v) { return v.type === n });
                                        obj[n].markers = typeObjs.map(function (v) { return v.marker });
                                        obj[n].patients = _.uniq(typeObjs.map(function (v) { return Object.keys(v.data); })
                                            .reduce(function (a, b) { return a = _.uniq(a.concat(b)); }));
                                    });
                                    arr.push(obj);
                                } else {
                                    arr.push(data);
                                }
                                next();
                            });
    
                        }, function (err) {
                            if (err) {
                                console.log(err);
                                res.status(404).send(err).end();
                            } else {
                                res.json(arr).end();
                            }
    
                        });
    
                    }
                }
            });
        }); 
    })

    app.delete('/api/files/:id', Permissions.jwtVerification, function (req, res) {
        console.log("in file delete");
        console.log(req.params.id);
        var projectID = req.params.id;
        db.getConnection().then(db => {
            db.db.listCollections().toArray(function (err, collectionMeta) {
                if (err) {
                    console.log(err);
                }
                else {
                    collectionMeta.map(function (m) {
                        return m.name;
                    }).filter(function (m) {
                        return m.indexOf(projectID) > -1;
                    }).forEach(function (m) {
                        db.db.dropCollection(m, function (err, result) {
                            console.log("DELETING", m);
                            if (err) console.log(err);
                            console.log(result);
                        });
                    });
                }
            });
            res.status(200).send("files are deleted").end();
        });
    });

    //#endregion

    app.get('/api/:collection/:query', function (req, res, next) {
        var collection = req.params.collection;
        var query = (req.params.query) ? JSON.parse(req.params.query) : {};
        // Permissions.getProjects(req.headers.authorization).then(projects => {
        //     Permissions.hasPermission(projects, collection, permission.ePermission.READ).then(
        //         hasAccess => {
        //             if (hasAccess) {
                        db.getConnection().then(db => {
                            Query.exec(db, collection, query).then(results => {
                                res.send(results);
                                res.end();
                            });
                        });
        //             }
        //         }
        //     )
        // }).catch(e => {
        //     res.send(e);
        //     res.end();
        // })
    });

    app.get('/api/:collection*', function (req, res, next) {
        var collection = req.params.collection;
        var query = {};
        // Permissions.getProjects(req.headers.authorization).then(projects => {
        //     Permissions.hasPermission(projects, collection, permission.ePermission.READ).then(
        //         hasAccess => {
        //             if (hasAccess) {
                        db.getConnection().then(db => {
                            Query.exec(db, collection, query).then(results => {
                                res.send(results);
                                res.end();
                            });
                        });
    //                 }else{ 
    //                     res.end();
    //                 }
    //             }
    //         ) 
    //     }).catch(e => {
    //         res.send(e);
    //         res.end();
    //     });
    });
}


module.exports = {
    init: init
};
