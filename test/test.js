var  
     ps=require('../lib/main.js')
    ,util = require('util')
    ,exec  = require("child_process").execSync
    ,isWin
;

isWin = /^win/.test(process.platform)
var sExecRet,aPids=[]
// Get pids
if(isWin){
    
    try {
        sExecRet = exec("wmic process get ProcessId").toString()
    }catch(e){
        throw new Error("Test Failed: "+e+" - stack: "+e.stack);
    }
    
    sExecRet.split(/\n/).forEach(function(item) {
        item = item.trim()
        if(item != "ProcessId" && item != ""){
            aPids.push(item)
        }
    })
    
} else {
    
    try {
        sExecRet = exec("ps -A o pid").toString()
    }catch(e){
        throw new Error("Test Failed: "+e+" - stack: "+e.stack);
    }
    
    sExecRet.split(/\n/).forEach(function(item) {
        item = item.trim()
        if(item!="PID" && item != ""){
            aPids.push(item)
        }
    })

    
}

//console.log('aPids = `'+aPids+'`')

var psRecs = ps.query({pid:aPids})

console.log('psRecs = '+util.inspect(psRecs))

var iFails=0,psRec,aIssues=[]
aPids.forEach(function(pid) {
    psRec=psRecs[pid]
    if(!psRec){
        iFails++;
        console.log("Failed to find pid %s", pid)
    } else {
        if(psRec != ps.PID_NOT_FOUND && psRec.pid != pid){
            aIssues.push('pid for record ('+psRec.pid+') does not match the key ('+pid+')')
        }
    }
})

if(aIssues.length > 0){
    console.log(aIssues.join('\n'))
}

if(iFails>0 || aIssues.length > 0){
    console.log("Test failed")
    
} else {
    console.log("Test passed")
}

