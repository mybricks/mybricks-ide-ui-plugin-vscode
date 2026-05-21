const pageConfig = 'function definePageConfig(config) { return config }'

export default function handleDefinePageConfig(programPath, babel, filename) {

  const prependHeader = (programPath, header: string) => {
    const parsedHeader = babel.parse(header, { filename })?.program.body[0]
    programPath.node.body.unshift(parsedHeader)
  }
  prependHeader(programPath, pageConfig)
}
