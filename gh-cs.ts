import { FilesMap } from "@codesandbox/nodebox";

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
}): Promise<FilesMap> => {
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

  // 3. return a file tree

  const fsTree: FilesMap = {};
  for (const fsNode of fsNodes) {
    if (fsNode.path.startsWith(path) && !!fileContents[fsNode.path]) {
      fsTree[fsNode.path.replace(path + "/", "")] = fileContents[fsNode.path];
    }
  }

  return fsTree;
};
