export type FileKind = "ftree" | "tree" | "clu" | "network" | "unknown";

export function fileKind(filename: string): FileKind {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "ftree") return "ftree";
  if (ext === "tree" || ext === "stree") return "tree";
  if (ext === "clu") return "clu";
  if (["net", "paj", "txt", "edges", "edgelist"].includes(ext))
    return "network";
  return "unknown";
}

export function isStatesText(text: string): boolean {
  return /^\*states\b/im.test(text);
}
