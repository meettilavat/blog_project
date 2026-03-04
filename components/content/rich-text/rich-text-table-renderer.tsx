import type { SanitizedTiptapNode } from "@/lib/tiptap/model/tiptap-model";
import { isRenderableNode } from "./rich-text-node-guards";
import type { RendererContext } from "./rich-text-node-types";

export function renderTableNode(node: SanitizedTiptapNode, key: string, context: RendererContext) {
  const rows: SanitizedTiptapNode[] = Array.isArray(node.content) ? node.content : [];
  const firstRow = rows[0];
  const firstCells: SanitizedTiptapNode[] = Array.isArray(firstRow?.content) ? firstRow.content : [];
  const isHeaderRow = firstCells.length > 0 && firstCells.every((cell) => cell?.type === "tableHeader");

  const renderRow = (row: SanitizedTiptapNode, rowKey: string) => (
    <tr key={rowKey}>
      {Array.isArray(row?.content)
        ? row.content
            .filter(isRenderableNode)
            .map((cell, cellIndex) => {
              const cellKey = `${rowKey}-cell-${cellIndex}`;
              const CellTag = cell.type === "tableHeader" ? "th" : "td";
              return (
                <CellTag key={cellKey}>
                  {context.renderNodes(cell.content, cellKey)}
                </CellTag>
              );
            })
        : null}
    </tr>
  );

  return (
    <table key={key}>
      {isHeaderRow ? <thead>{renderRow(firstRow, `${key}-head`)}</thead> : null}
      <tbody>
        {rows
          .slice(isHeaderRow ? 1 : 0)
          .filter(isRenderableNode)
          .map((row, index) => renderRow(row, `${key}-row-${index}`))}
      </tbody>
    </table>
  );
}
