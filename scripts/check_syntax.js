var fso = new ActiveXObject("Scripting.FileSystemObject");

function checkFolder(folderPath) {
    if (!fso.FolderExists(folderPath)) return;
    var folder = fso.GetFolder(folderPath);
    
    // Check files in current folder
    var files = new Enumerator(folder.Files);
    for (; !files.atEnd(); files.moveNext()) {
        var file = files.item();
        if (fso.GetExtensionName(file.Name).toLowerCase() === "js") {
            var stream = file.OpenAsTextStream(1, -2);
            var content = "";
            if (!stream.AtEndOfStream) {
                content = stream.ReadAll();
            }
            stream.Close();
            
            try {
                new Function(content);
            } catch (e) {
                WScript.Echo("SYNTAX ERROR in " + file.Path + ": " + e.message);
            }
        }
    }
    
    // Recursively check subfolders
    var subfolders = new Enumerator(folder.SubFolders);
    for (; !subfolders.atEnd(); subfolders.moveNext()) {
        checkFolder(subfolders.item().Path);
    }
}

WScript.Echo("Starting recursive syntax check inside 'js' folder...");
checkFolder("js");
WScript.Echo("Syntax check completed.");
