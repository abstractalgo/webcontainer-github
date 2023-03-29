import { WebContainer } from "@webcontainer/api";

import { getGithubFilesTree } from "./gh";
// import { files } from "./files";

async function main() {
  const files = await getGithubFilesTree({
    owner: "foursquare",
    repo: "unfolded-sdk-examples",
    path: "map-sdk/v1/react/react-basic-example",
  });

  // First we boot a WebContainer
  const webcontainer = await WebContainer.boot();

  // After booting the container we copy all of our project files
  // into the container's file system
  const res = await webcontainer.mount(files);

  // Once the files have been mounted, we install the project's
  // dependencies by spawning `npm install`
  const install = await webcontainer.spawn("yarn", ["install"]);
  install.output.pipeTo(
    new WritableStream({
      write(data) {
        console.log(data);
      },
    })
  );

  const installCode = await install.exit;
  if (installCode !== 0) {
    throw new Error("Installation failed");
  }

  // Once all dependencies have been installed, we can spawn `npm`
  // to run the `dev` script from the project's `package.json`
  await webcontainer.spawn("yarn", ["dev"]);

  webcontainer.on("server-ready", (port, url) => {
    const iframe = document.getElementById("ram");
    iframe.src = url;
  });
}

main();
