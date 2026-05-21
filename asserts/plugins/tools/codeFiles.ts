type FileItem = {
  compiled: string;
  fileName: string;
  source: string;
  conntent?: string; // 额外添加一个字段，存放解码后的内容
};

class CodeFiles {
  whiteFileList = [];

  constructor(whiteFileList: string[]) {
    this.whiteFileList = whiteFileList;
  }

  safeDecode(value = "") {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  getFullJson() {
    return window?.designerRef?.current?.toJSON?.();
  }

  getAiComParams() {
    const toJson = this.getFullJson();
    const coms = toJson?.scenes?.[0]?.coms || {};
    const comId = Object.keys(coms)[0];
    return coms[comId]?.model || {};
  }

  getFilesJson() {
    const aiComParams = this.getAiComParams();
    let sourceFiles = aiComParams?.data?.files || [];
    if (this.whiteFileList.length > 0) {
      sourceFiles = sourceFiles.filter((file: FileItem) =>
        this.whiteFileList.includes(file.fileName),
      );
    }
    return sourceFiles.map((file: FileItem) => ({
      fileName: file.fileName,
      content: this.safeDecode(file.source),
    }));
  }
}

export default CodeFiles;
