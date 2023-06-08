import { Nodebox } from "@codesandbox/nodebox";

import { getGithubFilesTree } from "./gh-cs";

async function main() {
  // get files from github
  const files = await getGithubFilesTree({
    owner: "foursquare",
    repo: "unfolded-sdk-examples",
    path: "map-sdk/v1/react/react-basic-example",
  });

  console.log(files);

  // const iframe = Array.from(
  //   document.getElementsByTagName("iframe")
  // )[0] as HTMLIFrameElement;

  const runtime = new Nodebox({
    iframe: document.getElementById(
      "nodebox-runtime-iframe"
    ) as HTMLIFrameElement,
  });

  // Establish a connection with the runtime environment.
  await runtime.connect();

  await runtime.fs.init(files);

  // First, create a new shell instance.
  // You can use the same instance to spawn commands,
  // observe stdio, restart and kill the process.
  const shell = runtime.shell.create();

  // Then, let's run the "dev" script that we've defined
  // in "package.json" during the previous step.
  const nextProcess = await shell.runCommand("npm", ["run", "dev"]);

  // Find the preview by the process and mount it
  // on the preview iframe on the page.
  const previewInfo = await runtime.preview.getByShellId(nextProcess.id);
  const previewIframe = document.getElementById(
    "nodebox-preview-iframe"
  ) as HTMLIFrameElement;
  previewIframe.setAttribute("src", previewInfo.url);
}

main();
