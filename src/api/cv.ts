import { api } from './index';

export const cvApi = {
  downloadUrl: () => '/api/cv/generate',
  async triggerDownload(candidateId?: number) {
    const urlPath = candidateId ? `/api/cv/export?candidateId=${candidateId}` : '/api/cv/export';
    const res = await api.get(urlPath, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = candidateId ? `rirekisho-${candidateId}.pdf` : 'rirekisho.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
