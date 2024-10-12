import * as vscode from 'vscode';
import { NarrativeProvider } from './tree-data-provider';

//-<~>- activate
export function activate(context: vscode.ExtensionContext) {

  const rootPath =
    vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : undefined;
  const narrativeProvider = new NarrativeProvider(rootPath!);
  //-<~>- register narrative TreeDataProvder
  vscode.window.registerTreeDataProvider('narrative', narrativeProvider);
  //-<~>- register narrative commands
  //-<~>- - refresh command
  vscode.commands.registerCommand('narrative.refreshEntry', () =>
    narrativeProvider.refresh()
  );
  //-<~>- - selectNode command
  vscode.commands.registerCommand('narrative.selectNode', (position:vscode.Position) => {
    narrativeProvider.openActiveTextEditorAtPosition(position)
  });
  //-<~>- register narrative listenrers
  //-<~>- - listen for ActiveTextEditor change
  vscode.window.onDidChangeActiveTextEditor( e => {
    narrativeProvider.refresh()
  });
  //-<~>- - listen for TextDocument change
  vscode.workspace.onDidChangeTextDocument(changeEvent => {
    if (changeEvent.document === vscode.window.activeTextEditor?.document)
      narrativeProvider.refresh();
  })

}

//-<~>- This method is called when extension is deactivated
export function deactivate() {}
