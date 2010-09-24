#!/usr/bin/env node
var DNode = require('dnode');
var Hash = require('traverse/hash');

DNode.connect(9090, function (remote, conn) {
    remote.authenticate('robit', 'yc', function (err, account) {
        if (err) { throw err; return }
        
        var simpleLinux = account.disks['linux-0.2.img'];
        simpleLinux.subscribe(function (sub) {
            sub.on('spawn', function (proc) {
                proc.saveThumb(function (err, filename) {
                    if (err) throw err;
                    console.log(filename);
                    conn.end();
                });
            });
        });
        simpleLinux.spawn('qemu');
    });
});