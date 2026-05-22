Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
root = fso.GetParentFolderName(fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName)))
shell.CurrentDirectory = root
shell.Run "cmd /c if not exist logs mkdir logs & if not exist dist npm run build >> logs\launcher.log 2>&1 & set SMART_OPEN_BROWSER=1& node server\local-server.mjs >> logs\launcher.log 2>&1", 0, False
