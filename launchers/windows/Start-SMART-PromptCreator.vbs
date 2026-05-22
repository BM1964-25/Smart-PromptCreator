Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
root = fso.GetParentFolderName(fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName)))

If Not fso.FileExists(root & "\package.json") Or Not fso.FileExists(root & "\server\local-server.mjs") Then
  MsgBox "SMART PromptCreator konnte den Projektordner nicht finden. Bitte den Starter im Ordner launchers\windows innerhalb des Projekts starten.", 48, "SMART PromptCreator"
  WScript.Quit 1
End If

shell.CurrentDirectory = root
shell.Run "cmd /c if not exist logs mkdir logs & where node >nul 2>nul || (echo Node.js wurde nicht gefunden. Bitte Node.js installieren. >> logs\launcher.log & exit /b 1) & if not exist dist npm run build >> logs\launcher.log 2>&1 & set SMART_OPEN_BROWSER=1& node """ & root & "\server\local-server.mjs"" >> logs\launcher.log 2>&1", 0, False
