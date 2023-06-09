import { WebContainer } from "@webcontainer/api";

import { getGithubFilesTree } from "./gh";

async function main() {
  // get files from github
  const files = await getGithubFilesTree({
    owner: "foursquare",
    repo: "unfolded-sdk-examples",
    path: "map-sdk/v1/react/react-basic-example",
  });

  // set up webcontainer
  const webcontainer = await WebContainer.boot({
    coep: "credentialless",
  });
  await webcontainer.mount(files);
  const install = await webcontainer.spawn("npm", ["install"]);
  install.output.pipeTo(
    new WritableStream({
      write(data) {
        console.log(data);
      },
    })
  );
  await install.exit;
  await webcontainer.spawn("npm", ["run", "dev"]);
  webcontainer.on("server-ready", (port, url) => {
    const iframe = document.getElementById("webc-iframe") as HTMLIFrameElement;
    iframe.src = url;
  });
}

main();
