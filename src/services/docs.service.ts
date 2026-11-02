import axios from "axios";

export const docsService = {
  async fetchDocs(owner: string, repo: string, branch: string) {
    const res = await axios.get(
      `/api/gitvn?owner=${owner}&repo=${repo}&branch=${encodeURIComponent(branch)}`,
    );
    return res.data;
  },

  async saveDoc(
    owner: string,
    repo: string,
    branch: string,
    filename: string,
    content: string,
  ) {
    return axios.post("/api/gitvn", {
      owner,
      repo,
      branch,
      action: "saveDoc",
      filename,
      content,
    });
  },

  async createDoc(
    owner: string,
    repo: string,
    branch: string,
    filename: string,
    title?: string,
  ) {
    return axios.post("/api/gitvn", {
      owner,
      repo,
      branch,
      action: "saveDoc",
      filename,
      content: `# ${title || filename}\n\nChào mừng bạn đến với tài liệu **${filename}**. Soạn thảo nội dung MDX trực quan tại đây.\n`,
    });
  },
};
