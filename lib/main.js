// .: ps-sync :.
// . Utility for getting process information syncronously
// . For those who don't need async execution in their node.js apps
// . see README.md


var 
    exec  = require("child_process").execSync
   ,util = require('util')
   ,isWin = /^win/.test(process.platform)
   ,PID_NOT_FOUND="(pid_not_found)"
;


exports.PID_NOT_FOUND = PID_NOT_FOUND
exports.query = function(opts){
    var aPids,v,sCmd,psRecs={}
    opts = opts||{}
    if(!opts.pid){throw new Error("pid option is required");}
    aPids=Array.isArray( (v=opts.pid) )?v:[v];
    aPids.forEach(function(pid){
        if(pid===""){throw new Error("Blank pid sent. opts.pid = '"+opts.pid+"'");}
        if(parseInt(pid)==NaN){throw new Error("Invalid pid sent ("+pid+"). opts.pid = '"+opts.pid+"'");}
    })
    if(aPids.length==0){throw new Error("Expecting 1 or more pids");}
    
    if(isWin){
        sCmd="wmic process"
        
        var sWC="",pid
        for(var i=0;i<aPids.length;i++){
            pid=aPids[i];
            
            sWC+=(i==0?"":" or ")+"ProcessId="+aPids[i]; 
        }
        sCmd+=' where "'+sWC+'"';
        
        sCmd+=' get ProcessId,ParentProcessId,CommandLine,CreationDate,Name,ExecutablePath /format:textvaluelist';

        
        var sExecRet 
        try {
            sExecRet = exec(sCmd, { stdio: 'pipe' }).toString()
        }catch(e){
            throw e;
        }
        sExecRet=sExecRet.replace(/\r/g,'')
        
        // Now parse the WMIC return
        var procRec=function(psRec,sProcId){
            if(!sProcId){throw new Error("No Proc Id found in data");}
            var iFind,sArgs
            iFind=psRec.CommandLine.indexOf(psRec.Name);
            sArgs = psRec.CommandLine.substring(iFind+psRec.Name.length+1);
            psRecs[sProcId]={
                pid: psRec.ProcessId
               ,ppid: psRec.ParentProcessId
               ,commandPath: psRec.ExecutablePath
               ,command: psRec.Name
               ,args: sArgs
            }
        }
        var 
            n,iBlnkCtr=0
           ,iFind,sN,sV,psRec,sProcId
        ;
        n = sExecRet.indexOf('\n')
        while (~n) {
            var sRec=sExecRet.substring(0, n)
            if(sRec.trim()===""){
                iBlnkCtr++;
            } else {
                if(iBlnkCtr==2){
                    if(psRec){procRec(psRec,sProcId)}
                    psRec={}
                    iBlnkCtr=0
                }
                iFind=sRec.indexOf('=')
                if(iFind==-1){
                    throw new Error("Could not parse line in wmic process: '"+sRec+"' because of no =");
                }
                sN=sRec.substring(0,iFind);
                sV=sRec.substring(iFind+1);
                if(sN=="ProcessId"){sProcId=sV;}
                psRec[sN]=sV
            }
            
            sExecRet = sExecRet.substring(n + 1);
            n = sExecRet.indexOf('\n');
        }
        if(psRec){procRec(psRec,sProcId)}
        
        var sCurPid
        for(var i=0;i<aPids.length;i++){
            sCurPid=aPids[i];
            if(!psRecs[sCurPid]){
                psRecs[sCurPid]=PID_NOT_FOUND
            }
        }
        
        
        
    } else {// *nix

        var aCols=["pid","ppid","comm","args"],psRecsAll={}
        
        sCmd="ps -Ao "+aCols.join(',');
        
        if(aPids.length==0){
            sCmd+=" -p "+aPids[0];
        }
        
        var sExecRet 
        try {
            sExecRet = exec(sCmd).toString()
        }catch(e){
            throw new Error("Failed while executing command `"+sCmd+"`"+e+" - stack: "+e.stack);
        }

        var iRec=0,aFirstRec,sProcId
        sExecRet.split('\n').map(function(line) {
            var aRec=[]
            if(line.trim()!=""){
                line.split(/\s+/).forEach(function(item) {
                    if (item) {aRec.push(item);}
                });
                if(iRec++==0){
                    aFirstRec=aRec   
                } else {
                    if(aRec.length>aFirstRec.length){
                        var aRecTmp=aRec.slice(0,aFirstRec.length-1)
                        aRecTmp.push(aRec.slice(aFirstRec.length-1).join(' '))
                        aRec=aRecTmp
                    }
                    var psRec={}
                    for(var j=0;j<aCols.length;j++){
                        if(aCols[j]=="pid"){
                            sProcId=aRec[j]
                        }
                        psRec[aCols[j]]=aRec[j];
                    }
                    psRecsAll[sProcId]=psRec

                }
            }
        });
        
        // Now resolve passed PIDs in data
        var psRec
        aPids.forEach(function(pid){
            if( !(psRec=psRecsAll[pid]) ){
                psRecs[pid]=PID_NOT_FOUND
            } else {
                var iFind=psRec.args.indexOf(psRec.comm);
                
                psRecs[pid]={
                     pid: psRec.pid
                    ,ppid: psRec.ppid
                    ,commandPath: psRec.args.substring(0,iFind+psRec.comm.length)
                    ,command: psRec.comm
                    ,args: psRec.args.substring(iFind+psRec.comm.length+1)
                }
            }
        })
        
    } 
    
    return psRecs;
    
}
