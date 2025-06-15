import * as vscode from 'vscode';
import * as cp from 'child_process';

export function activate(context: vscode.ExtensionContext) {
	console.log('ACTIVATED: django-helper');

	// Hello World command
	const hello = vscode.commands.registerCommand('django-helper.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from django-helper!');
	});
	context.subscriptions.push(hello);

	// GUI Panel Command
	const openPanel = vscode.commands.registerCommand('django-helper.openStartProjectPanel', () => {
		const panel = vscode.window.createWebviewPanel(
			'djangoHelperStartProject', // viewType
			'Start Django Project', // title
			vscode.ViewColumn.One,
			{
				enableScripts: true
			}
		);

		panel.webview.html = getWebviewContent();

		// Listen to message from the Webview
		panel.webview.onDidReceiveMessage(
			message => {
				if (message.command === 'createProject') {
					const folder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
					if (!folder) {
						vscode.window.showErrorMessage('Please open a workspace folder first.');
						return;
					}
					const projectName = message.projectName.trim();
					if (!projectName) {
						vscode.window.showErrorMessage('Project name cannot be empty.');
						return;
					}

					const command = `django-admin startproject ${projectName}`;
					cp.exec(command, { cwd: folder }, (err, stdout, stderr) => {
						if (err) {
							vscode.window.showErrorMessage(`Error: ${stderr}`);
						} else {
							vscode.window.showInformationMessage(`Project '${projectName}' created successfully.`);
						}
					});
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
          margin: 0;
          padding: 0;
          background-color: var(--vscode-editor-background);
          color: var(--vscode-editor-foreground);
          font-family: var(--vscode-font-family);
          display: flex;
          height: 100vh;
        }

        .sidebar {
          width: 200px;
          background-color: var(--vscode-sideBar-background);
          border-right: 1px solid var(--vscode-sideBar-border);
          display: flex;
          flex-direction: column;
        }

        .sidebar-item {
          padding: 10px 12px;
          cursor: pointer;
          border-left: 3px solid transparent;
          color: var(--vscode-sideBar-foreground);
        }

        .sidebar-item:hover {
          background-color: var(--vscode-list-hoverBackground);
        }

        .sidebar-item.active {
          background-color: var(--vscode-list-activeSelectionBackground);
          border-left: 3px solid var(--vscode-list-activeSelectionForeground);
          color: var(--vscode-list-activeSelectionForeground);
        }

        .main {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
        }

        input[type="text"] {
          background-color: var(--vscode-input-background);
          color: var(--vscode-input-foreground);
          border: 1px solid var(--vscode-input-border);
          border-radius: 3px;
          padding: 8px;
          width: 300px;
          outline: none;
          margin-right: 10px;
        }

        button {
          padding: 8px 14px;
          background-color: var(--vscode-button-background);
          border: none;
          border-radius: 3px;
          color: var(--vscode-button-foreground);
          cursor: pointer;
        }

        button:hover {
          background-color: var(--vscode-button-hoverBackground);
        }
      </style>
    </head>
    <body>
      <div class="sidebar">
        <div class="sidebar-item active" id="startProjectTab">Start Project</div>
        <div class="sidebar-item" id="activateEnvTab">Activate Virtual Env</div>
      </div>
      <div class="main" id="mainContent">
        <h2>Start a New Django Project</h2>
        <input type="text" id="projectName" placeholder="Enter project name" />
        <button onclick="createProject()">Create</button>
      </div>

      <script>
        const vscode = acquireVsCodeApi();

        function createProject() {
          const projectName = document.getElementById('projectName').value;
          vscode.postMessage({ command: 'createProject', projectName });
        }

        const startProjectTab = document.getElementById('startProjectTab');
        const activateEnvTab = document.getElementById('activateEnvTab');
        const mainContent = document.getElementById('mainContent');

        startProjectTab.addEventListener('click', () => {
          startProjectTab.classList.add('active');
          activateEnvTab.classList.remove('active');
          mainContent.innerHTML = \`
            <h2>Start a New Django Project</h2>
            <input type="text" id="projectName" placeholder="Enter project name" />
            <button onclick="createProject()">Create</button>
          \`;
        });

        activateEnvTab.addEventListener('click', () => {
          activateEnvTab.classList.add('active');
          startProjectTab.classList.remove('active');
          mainContent.innerHTML = \`
            <h2>Activate Virtual Environment</h2>
            <p>Coming soon...</p>
          \`;
        });
      </script>
    </body>
    </html>
  `;
}
