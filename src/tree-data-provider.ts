import * as vscode from 'vscode';
import * as path from 'path';

export class NarrativeProvider implements vscode.TreeDataProvider<NarrativeTreeItem> {
  constructor(private workspaceRoot: string) {}
  //-<!>- convention patterns
  private patterns = [ '-<~>-', '-<!>-', '-<?>-', 'todo://', 'rfc://' ]

  getTreeItem(element: NarrativeTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: NarrativeTreeItem): Thenable<NarrativeTreeItem[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No narrative in empty workspace');
      return Promise.resolve([]);
    }
    
    //-<~>- put convention patterns in tree root
    if (vscode.window.activeTextEditor){
      if (!element) {
        return Promise.resolve(
        this.patterns.map( p => this.toDep(p, -1, -1, true)) 
        );
      } else {
        if (vscode.window.activeTextEditor.document) {
          return Promise.resolve(
            //-<~>- get children for a selected root pattern  
            this.getNaraviteFromActiveFile(element.label)
          );
        } else {
          vscode.window.showErrorMessage('No document on active text editor');
          return Promise.resolve([]);
        }
      }
    } else {
      //-<~>- no narrative if no active text editor
      return Promise.resolve([]);
    }
  }
  /**
   * -<~>- Read narrative from active file
   */
  private getNaraviteFromActiveFile(pattern: string): NarrativeTreeItem[] {
    const activeTextEditor = vscode.window.activeTextEditor;
    if (activeTextEditor) {
      const narratives: NarrativeTreeItem[] = [];
      for (let i=0; i<activeTextEditor.document.lineCount; i++) {
        const textLine = activeTextEditor.document.lineAt(i);
        const indexOfNarrative = textLine.text.indexOf(pattern)
        if (indexOfNarrative !== -1) {
          narratives.push(
            this.toDep(
              textLine.text.substring(indexOfNarrative).replace(pattern, ''), 
              i, 
              indexOfNarrative, 
              false
            )
          )
        }
      }
      return narratives;
    } else {
      return [];
    }
  }
  
  private toDep (narrative: string, lineNum: number, colNum: number, isCategory: boolean): NarrativeTreeItem {
    const newDep = new NarrativeTreeItem(
      narrative,
      lineNum,
      colNum,
      isCategory? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
      isCategory
    );
    if (!isCategory) {
      newDep.command = {
        command: "narrative.selectNode",
        title: "Select Node",
        arguments: [new vscode.Position(lineNum, colNum)]
      };
    } 
    return newDep
  }

  private _onDidChangeTreeData: vscode.EventEmitter<NarrativeTreeItem | undefined | null | void> = new vscode.EventEmitter<NarrativeTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<NarrativeTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
  
  openActiveTextEditorAtPosition(position: vscode.Position) {
    const activeTextEditor = vscode.window.activeTextEditor;
    if (activeTextEditor) {
      const sel = new vscode.Selection(new vscode.Position(0, 0), new vscode.Position(0, 0));
      activeTextEditor.selection = sel;
      vscode.commands
        .executeCommand("cursorMove", {
          to: "down",
          by: "line",
          value: position.line,
        })
        .then(() => 
          vscode.commands.executeCommand("cursorMove", 
            {
              to: "right",
              by: "character",
              value: position.character,
            }
          )
        );
    }
  }
}

export class NarrativeTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly lineNum: number,
    public readonly colNum: number,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly isCategory: boolean
  ) {
    super(label, collapsibleState);
    this.tooltip = `pos-${this.lineNum+1}:${this.colNum+1}`;
    this.id = `${isCategory? 'cat:' : 'line:'}${label}r${lineNum}c${colNum}`;
    if (isCategory) lineNum = this.countPatternInActiveTextEditor(label)
    this.description = isCategory? `${lineNum}` : `${lineNum}:${colNum}`;
  }

  iconPath = {
    light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
    dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
  };

  countPatternInActiveTextEditor(p: string): number {
    const activeTextEditor = vscode.window.activeTextEditor;
    if (activeTextEditor) {
      let count = 0;
      for (let i=0; i<activeTextEditor.document.lineCount; i++) {
        const textLine = activeTextEditor.document.lineAt(i);
        const indexOfNarrative = textLine.text.indexOf(p)
        if (indexOfNarrative !== -1) 
          count++
      }
      return count;
    } else {
      return 0;
    }
  }

}



