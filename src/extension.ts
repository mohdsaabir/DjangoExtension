import * as vscode from 'vscode';
import * as cp from 'child_process';

export function activate(context: vscode.ExtensionContext) {
  console.log('ACTIVATED: django-helper');

  const hello = vscode.commands.registerCommand('django-helper.helloWorld', () => {
    vscode.window.showInformationMessage('Hello World from django-helper!');
  });
  context.subscriptions.push(hello);

  const openPanel = vscode.commands.registerCommand('django-helper.openStartProjectPanel', () => {
    const panel = vscode.window.createWebviewPanel(
      'djangoHelperStartProject',
      'Start Django Project',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    panel.webview.html = getWebviewContent();

    // Prefill folder if a workspace is already open
    const existingFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (existingFolder) {
      setTimeout(() => {
        panel.webview.postMessage({
          command: 'selectedFolder',
          folderPath: existingFolder
        });
      }, 100); // slight delay ensures webview is ready
    }


    panel.webview.onDidReceiveMessage(
      async message => {
        if (message.command === 'createProject') {
          const folderPath = message.folderPath;
          const projectName = message.projectName.trim();

          if (!folderPath) {
            vscode.window.showErrorMessage('Please select a folder to create the project in.');
            return;
          }
          if (!projectName) {
            vscode.window.showErrorMessage('Project name cannot be empty.');
            return;
          }

          const command = `django-admin startproject ${projectName} .`;
          cp.exec(command, { cwd: folderPath }, (err, stdout, stderr) => {
            if (err) {
              vscode.window.showErrorMessage(`Error: ${stderr}`);
            } else {
              vscode.workspace.updateWorkspaceFolders(
                0,
                vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0,
                { uri: vscode.Uri.file(folderPath) }
              );

              vscode.window.showInformationMessage(`Project '${projectName}' created successfully in ${folderPath}. Folder added to workspace.`);

            }
          });
        } else if (message.command === 'chooseFolder') {
          const uri = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            openLabel: 'Select Folder'
          });
          if (uri && uri.length > 0) {
            panel.webview.postMessage({
              command: 'selectedFolder',
              folderPath: uri[0].fsPath
            });
          }
        }
      },
      undefined,
      context.subscriptions
    );
  });
  context.subscriptions.push(openPanel);
}

function getWebviewContent(): string {
  return `
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Django Helper</title>
			<style>
				body {
					padding: 20px;
					font-family: var(--vscode-font-family);
					background-color: var(--vscode-editor-background);
					color: var(--vscode-editor-foreground);
				}
				input[type="text"] {
					width: 100%;
					padding: 8px;
					margin: 8px 0;
					background-color: var(--vscode-input-background);
					color: var(--vscode-input-foreground);
					border: 1px solid var(--vscode-input-border);
					border-radius: 4px;
				}
				button {
					padding: 8px 12px;
					margin-right: 8px;
					border: none;
					border-radius: 3px;
					background-color: var(--vscode-button-background);
					color: var(--vscode-button-foreground);
					cursor: pointer;
				}
				button:hover {
					background-color: var(--vscode-button-hoverBackground);
				}
			</style>
		</head>
		<body>
			<h2>Start a New Django Project</h2>
			<label>Project Name:</label>
			<input type="text" id="projectName" placeholder="Enter Django project name" />
			<label>Project Folder:</label>
			<input type="text" id="projectFolder" placeholder="Select folder..." readonly />
			<button onclick="chooseFolder()">Browse</button>
			<br/><br/>
			<button onclick="createProject()">Create Project</button>

			<script>
				const vscode = acquireVsCodeApi();

				function chooseFolder() {
					vscode.postMessage({ command: 'chooseFolder' });
				}

				function createProject() {
					const projectName = document.getElementById('projectName').value;
					const folderPath = document.getElementById('projectFolder').value;
					vscode.postMessage({ command: 'createProject', projectName, folderPath });
				}

				window.addEventListener('message', event => {
					const message = event.data;
					if (message.command === 'selectedFolder') {
						document.getElementById('projectFolder').value = message.folderPath;
					}
				});
			</script>
		</body>
		</html>
	`;
}
