<div align="center"> <a href="https://genezio.com/">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://github.com/genez-io/graphics/raw/HEAD/svg/Icon_Genezio_White.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://github.com/genez-io/graphics/raw/HEAD/svg/Icon_Genezio_Black.svg">
    <img alt="genezio logo" src="https://github.com/genez-io/graphics/raw/HEAD/svg/Icon_Genezio_Black.svg" style="max-height: 50px;">
  </picture>
 </div>

<div align="center">

[![Join our community](https://img.shields.io/discord/1024296197575422022?style=social&label=Join%20our%20community%20&logo=discord&labelColor=6A7EC2)](https://discord.gg/uc9H5YKjXv)
[![Follow @geneziodev](https://img.shields.io/twitter/url/https/twitter.com/geneziodev.svg?style=social&label=Follow%20%40geneziodev)](https://twitter.com/geneziodev)

</div>

# Custom File Generator

## Prerequisites

If you don't already have them, you'll need to install the following tools:
- [Node.js](https://nodejs.org/en/download/current) (version >= 18.0.0)
- [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- [Genezio](https://genezio.com)

Note: I recommend you to use [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) to manage NodeJs and npm versions.
After installing `nvm`, you can easily get the any version of `node` by running `nvm install <node_version>`.
`nvm` will automatically install the corresponding `npm` version.

## Project Structure

```
client/
├── dist/ 
├── node_modules/
├── public/
│ ├── sample-data.xlsx
│ ├── sample-template.docx
│ ├── genezio.svg
├── src/
│ ├── App.tsx
│ ├── FileUpload.tsx
│ ├── index.css
│ ├── main.tsx
│ ├── vite-env.d.ts
├── .eslintrc.cjs
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── postcss.config.js
├── README.md
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts

server/
├── node_modules/ (library root)
├── .gitignore
├── index.mjs
├── package.json
├── package-lock.json
├── .genezioignore
└── genezio.yaml
```

## Deploy Your Project

1. Install the Genezio CLI globally
```bash
npm install -g genezio
```

2. Login to Genezio
```bash
genezio login
```

3. Deploy your project
```bash
genezio deploy
```

4.Create a `.env` file in the `client` directory and add the following environment variables:
```bash
VITE_API_URL=https://<your_project_id>.cloud.genez.io
```

Note: this value is the same as field `Functions Deployed` in the output of the `genezio deploy` command.

5. Deploy the environment variables
```bash
genezio deploy --env client/.env
```

## Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install -g genezio`  | Installs genezio globally                        |
| `genezio login`           | Logs in to genezio                               |
| `genezio local`           | Starts a local server                            |
| `genezio deploy`          | Deploys a production project                     |
| `genezio --help`          | Get help using genezio                           |


## Want to learn more?

Check out:
- [Official genezio documentation](https://genezio.com/docs)
- [Tutorials](https://genezio.com/blog)

## Contact

If you need support or you have any questions, please join us in our [Discord channel](https://discord.gg/uc9H5YKjXv). We'd love to chat!

## Built With

- [Genezio](https://genezio.com/)
- [Express](https://expressjs.com/)
- [Node.JS](https://nodejs.org/en/)
- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)


***

<div align="center"> <a href="https://genezio.com/">
  <p>Built with Genezio with ❤️ </p>
  <img alt="genezio logo" src="https://raw.githubusercontent.com/Genez-io/graphics/main/svg/powered_by_genezio.svg" style="max-height: 50px;">
</div>