Set fso = CreateObject("Scripting.FileSystemObject")
d = fso.GetParentFolderName(WScript.ScriptFullName)
q = Chr(34)
CreateObject("WScript.Shell").Run "cmd /c " & q & q & d & "\autopush.cmd" & q & q, 0, False
