import { DirectoryNode, FileSystemTree } from "@webcontainer/api";

export const getGithubFilesTree = async ({
  owner,
  repo,
  path,
  branch = "master",
}: {
  owner: string;
  repo: string;
  path: string;
  branch?: string;
}): Promise<FileSystemTree> => {
  // 1. get file tree from Github

  const latestCommitRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits/${branch}`
  );
  const latestCommit = (await latestCommitRes.json()) as { sha: string };

  const ghTreeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${latestCommit.sha}?recursive=1`
  );
  const fsNodes = (
    (await ghTreeRes.json()) as {
      tree: {
        path: string;
        type: "blob" | "tree";
        size: number;
        url: string;
      }[];
    }
  ).tree;

  // 2. get file contents from Github for files that match the path

  const fileContents: Record<string, string> = await (async () => {
    const filteredTree = fsNodes.filter(
      (i) => i.path.startsWith(path) && i.type === "blob"
    );

    const contentFetches = filteredTree.map((i) =>
      fetch(
        `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${i.path}`
      )
    );

    const contentRes = await Promise.all(contentFetches);
    const content = await Promise.all(contentRes.map((res) => res.text()));

    const fileContents: Record<string, string> = {};
    for (let idx = 0; idx < filteredTree.length; idx++) {
      fileContents[filteredTree[idx].path] = content[idx];
    }

    return fileContents;
  })();

  // 3. construct a full file system tree

  let fsTree: FileSystemTree = {};

  fsNodes.forEach((item) => {
    const path = item.path;
    const pathParts = path.split("/");
    let currentLevel = fsTree;

    pathParts.forEach((part) => {
      const isPartAFilename = fsNodes.find(
        (i) => i.path === item.path && i.type === "blob"
      );

      if (!currentLevel[part]) {
        currentLevel[part] = isPartAFilename
          ? {
              file: {
                contents: fileContents[path] ?? "~",
              },
            }
          : {
              directory: {},
            };
      }
      currentLevel = (currentLevel[part] as DirectoryNode).directory;
    });
  });

  // 4. return the subtree for the path

  for (const pathPart of path.split("/")) {
    fsTree = (fsTree[pathPart] as DirectoryNode).directory;
  }

  return fsTree;
};
