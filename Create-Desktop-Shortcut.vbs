Set WshShell = CreateObject("WScript.Shell")
strDesktop = WshShell.SpecialFolders("Desktop")
strScriptDir = WshShell.CurrentDirectory

Set oUrlLink = WshShell.CreateShortcut(strDesktop & "\Business ERP AI.lnk")
oUrlLink.TargetPath = strScriptDir & "\Launch Business ERP.bat"
oUrlLink.WorkingDirectory = strScriptDir
oUrlLink.Description = "Business ERP AI Desktop Application"
oUrlLink.IconLocation = "shell32.dll, 25"
oUrlLink.Save

WScript.Echo "Desktop shortcut 'Business ERP AI' created successfully on your Desktop!"
