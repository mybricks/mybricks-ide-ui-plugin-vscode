import codeTransform from './codeTransform';
import utilsFiles from './utilsFiles';

interface JSON {
  scenes: {
    id: string;
    coms: Record<string, {
      asRoot: boolean;
      def: {
        namespace: string;
      };
      model: {
        data: any;
      }
    }>
  }[]
}

const download = (json: JSON) => {
  const files: {path: string;content: string}[] = [];

  json.scenes.forEach((scene, index) => {
    const { coms } = scene;
    const aiCom = Object.entries(coms).find(([comId, com]) => {
      return com.asRoot && com.def.namespace === 'mybricks.basic-comlib.ai-mix';
    })?.[1];

    if (!aiCom) {
      return;
    }

    const prefix = `App${index || ""}`

    const { runtimeJsxSource, storeJsSource, serviceJsSource, styleSource } = aiCom.model.data;

    const codeFiles = codeTransform({
      runtime: decodeURIComponent(runtimeJsxSource),
      store: decodeURIComponent(storeJsSource),
      service: decodeURIComponent(serviceJsSource),
      style: decodeURIComponent(styleSource),
    }).map((file) => {
      return {
        path: `${prefix}/${file.path}`,
        content: file.content,
      }
    })

    files.push(...codeFiles);

    files.push(...utilsFiles.map((file) => {
      return {
        path: `${prefix}/utils/${file.path}`,
        content: file.content,
      }
    }))
  })

  // downloadZip(files);

  console.log("[files]", files);
  return files;
}

export default download;
