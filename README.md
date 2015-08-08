# ps-sync
Syncronous ps tool for node.js

This library is written to be executed syncronously. As such, it is not recommended
to be used in for web servers where blockin processes would be a problem.

# installation
    npm install ps-sync


# Usage
    var ps = require('ps-sync')
    
    var psRecs = ps.query({pid: <pid(s)>})
    
where: <pid(s)> is a single pid or an array of multiple pids
    
psRecs will contain an object with pid as the key and an 
object containing process info for the given pid. 

If pid is not found you will get back ps.PID_NOT_FOUND which looks like '(pid_not_found)'. You can easily test for pid like: 
    if(psRecs[pid]==ps.PID_NOT_FOUND){
        // handle accordingly
    } else {
        // pid found, you should have an object with data.
    }

    
Data returned if pid is found:

<table>
<tr>
<th>Field</th>
<th>Description</th>
</tr><tr>
<td>pid</td>
<td>Process Id</td>
</tr><tr>
<td>ppid</td>
<td>Parent Process Id</td>
</tr><tr>
<td>command</td>
<td>Executable name</td>
</tr><tr>
<td>commandPath</td>
<td>Full path to executable</td>
</tr><tr>
<td>args</td>
<td>Command arguments</td>
</tr>
</table>