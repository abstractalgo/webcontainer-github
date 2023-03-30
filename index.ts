import { FileSystemTree, WebContainer } from "@webcontainer/api";
import * as monaco from "monaco-editor";
import { AutoTypings, LocalStorageCache } from "monaco-editor-auto-typings";

import { getGithubFilesTree } from "./gh";

const setupWebContainer = async ({
  fs,
}: {
  fs: FileSystemTree;
}): Promise<void> => {
  const webcontainer = await WebContainer.boot({
    coep: "credentialless",
  });
  await webcontainer.mount(fs);
  const install = await webcontainer.spawn("npm", ["install"]);
  // install.output.pipeTo(
  //   new WritableStream({
  //     write(data) {
  //       console.log(data);
  //     },
  //   })
  // );
  await install.exit;
  await webcontainer.spawn("npm", ["run", "dev"]);
  webcontainer.on("server-ready", (port, url) => {
    const iframe = document.getElementsByTagName(
      "iframe"
    )[0] as HTMLIFrameElement;
    iframe.src = url;
  });
};

const setupEditor = ({ codeVal }: { codeVal: string }): void => {
  const editor = monaco.editor.create(document.getElementById("code-editor")!, {
    model: monaco.editor.createModel(codeVal, "typescript"),
    theme: "vs-dark",
  });

  // const autoTypings = AutoTypings.create(editor, {
  //   sourceCache: new LocalStorageCache(), // Cache loaded sources in localStorage. May be omitted
  //   // Other options...
  // });
};

const main = async () => {
  // get files from github
  const files = await getGithubFilesTree({
    owner: "foursquare",
    repo: "unfolded-sdk-examples",
    path: "map-sdk/v1/react/react-basic-example",
  });

  console.log(files);

  setupEditor({
    codeVal: files["src"]["directory"]["App.jsx"]["file"]["contents"],
  });

  // set up webcontainer
  await setupWebContainer({ fs: files });
};

main();
