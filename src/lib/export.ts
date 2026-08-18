function buildHtml(body: string, title: string): string {
  const escaped = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const withBreaks = escaped.replace(/\n/g, '<br>');
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  @page { margin: 2.5cm; }
  body { font-family: 'Times New Roman', Georgia, serif; font-size: 12pt; line-height: 1.6; color: #1a1a1a; }
  h1 { font-size: 16pt; text-align: center; margin-bottom: 24pt; }
  .doc-title { text-align:center; font-weight: bold; font-size: 14pt; margin-bottom: 18pt; }
</style>
</head>
<body>
<div class="doc-title">${title}</div>
<div>${withBreaks}</div>
</body>
</html>`;
}

export function exportPdf(body: string, title: string): void {
  const html = buildHtml(body, title);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) {
    win.addEventListener('load', () => {
      win.focus();
      win.print();
    });
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function textToParagraphs(text: string): string {
  const lines = text.split('\n');
  return lines
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed === '') return '<w:p/>';
      return `<w:p><w:r><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`;
    })
    .join('');
}

export function exportWord(body: string, title: string): void {
  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>${escapeXml(title)}</w:t></w:r></w:p>
${textToParagraphs(body)}
</w:body>
</w:document>`;

  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<?mso-application progid="Word.Document"?>
<pkg:package xmlns:pkg="http://schemas.microsoft.com/office/2006/xmlPackage">
<pkg:part pkg:name="/word/document.xml" pkg:contentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml">
<pkg:xmlData>${docXml}</pkg:xmlData>
</pkg:part>
</pkg:package>`;

  const blob = new Blob([xml], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-zA-Z0-9À-ÿ -]/g, '').trim() || 'document'}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
