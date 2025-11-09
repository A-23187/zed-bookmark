import * as fs from "fs";
import * as path from "path";
import * as url from "url";

import {
  DiagnosticSeverity,
  ProposedFeatures,
  TextDocuments,
  createConnection,
  uinteger,
} from "vscode-languageserver/node.js";
import { TextDocument } from "vscode-languageserver-textdocument";

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

let workspace_root = "";

connection.onInitialize((params) => {
  workspace_root = params.workspaceFolders?.[0]?.uri;
  return { capabilities: { definitionProvider: true } };
});

connection.onDefinition((params) => {
  if (!workspace_root) {
    connection.console.error("Workspace root not initialized");
    return null;
  }
  if (!params.textDocument.uri.endsWith("bookmarks.txt")) {
    connection.console.info("Not a bookmarks.txt file");
    return null;
  }
  const doc = documents.get(params.textDocument.uri);
  if (!doc) {
    connection.console.error(`Document ${params.textDocument.uri} not found`);
    return null;
  }
  let label_line = params.position.line;
  let t = doc
    .getText({
      start: { line: label_line + 1, character: 0 },
      end: { line: label_line + 1, character: uinteger.MAX_VALUE },
    })
    .trim();
  if (!t) {
    t = doc
      .getText({
        start: { line: label_line, character: 0 },
        end: { line: label_line, character: uinteger.MAX_VALUE },
      })
      .trim();
    label_line = label_line - 1;
  }
  const d = {
    uri: params.textDocument.uri,
    diagnostics: [
      {
        range: {
          start: { line: label_line, character: 0 },
          end: {
            line: label_line + 1,
            character: uinteger.MAX_VALUE,
          },
        },
        severity: DiagnosticSeverity.Error,
        message: "invalid bookmark",
      },
    ],
  };
  const [relative_path, l, c] = t.split(":");
  if (!relative_path || !l || !c) {
    connection.sendDiagnostics(d);
    return null;
  }
  const line = parseInt(l);
  const column = parseInt(c);
  if (isNaN(line) || isNaN(column)) {
    connection.sendDiagnostics(d);
    return null;
  }
  const full_path = path.join(workspace_root, relative_path);
  if (!fs.existsSync(url.fileURLToPath(full_path))) {
    d.diagnostics[0].severity = DiagnosticSeverity.Warning;
    d.diagnostics[0].message = "stale bookmark";
    connection.sendDiagnostics(d);
    return null;
  }
  connection.sendDiagnostics({
    uri: params.textDocument.uri,
    diagnostics: [],
  });
  return {
    uri: full_path,
    range: {
      start: { line: line, character: column },
      end: { line: line, character: column },
    },
  };
});

documents.listen(connection);
connection.listen();
