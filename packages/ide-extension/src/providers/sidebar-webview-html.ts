import * as vscode from 'vscode'

const getNonce = (): string => {
  const array = new Uint32Array(4)
  crypto.getRandomValues(array)
  return Array.from(array, (value) => value.toString(36)).join('')
}

export const getSidebarWebviewHtml = (extensionUri: vscode.Uri, webview: vscode.Webview): string => {
  const distUri = vscode.Uri.joinPath(extensionUri, 'dist', 'webview')
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(distUri, 'index.js'))
  const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(distUri, 'index.css'))
  const nonce = getNonce()

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource};">
    <link rel="stylesheet" href="${styleUri}">
    <title>Agent Skills</title>
</head>
<body>
    <div id="root"></div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`
}
