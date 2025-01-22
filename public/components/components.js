document.addEventListener('DOMContentLoaded', () => {
  // Fetch and display components
  async function loadComponents() {
    const response = await fetch('/api/components');
    const components = await response.json();
    const container = document.getElementById('componentList');
    container.innerHTML = ''; // Clear previous components

    components.forEach(component => {
      const div = document.createElement('div');
      div.className = 'mt-3';
      div.innerHTML = `
    <div class="card">
      <div class="card-body">
        <h5 class="card-title">${component.name}</h5>
        <div class="mb-3">
          <h6>Preview:</h6>
          <div class="border p-2">${component.html}</div>
        </div>
        <div class="mb-3">
          <h6>Raw HTML:</h6>
          <pre>${component.html.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
        </div>
        <button class="btn btn-tools  edit-btn" data-id="${component.id}">Edit</button>
        <button class="btn btn-tools delete-btn" data-id="${component.id}">Delete</button>
        <button class="btn btn-tools  download-btn" data-id="${component.id}">Download</button>
      </div>
    </div>
  `;
      container.appendChild(div);
    });

    // Attach event listeners
    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', editComponent));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', deleteComponent));
    document.querySelectorAll('.download-btn').forEach(btn => btn.addEventListener('click', downloadComponent));
  }



  async function editComponent(e) {
    const id = e.target.dataset.id;
    const response = await fetch(`/api/components/${id}`);
    const component = await response.json();

    document.getElementById('componentName').value = component.name;
    document.getElementById('componentHtml').value = component.html;

    const form = document.getElementById('addComponentForm');
    form.querySelector('button').remove();

    const updateBtn = document.createElement('button');
    updateBtn.type = 'button';
    updateBtn.className = 'btn btn-tools mt-3';
    updateBtn.textContent = 'Update Component';
    updateBtn.addEventListener('click', () => updateComponent(id));
    form.appendChild(updateBtn);
  }

  async function updateComponent(id) {
    const name = document.getElementById('componentName').value;
    const html = document.getElementById('componentHtml').value;

    const response = await fetch(`/api/components/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, html })
    });

    if (response.ok) {
      alert('Component updated successfully!');
      location.reload();
    } else {
      alert('Failed to update component.');
    }
  }

  async function deleteComponent(e) {
    const id = e.target.dataset.id;
    const response = await fetch(`/api/components/${id}`, { method: 'DELETE' });

    if (response.ok) {
      alert('Component deleted successfully!');
      location.reload();
    } else {
      alert('Failed to delete component.');
    }
  }

  async function downloadComponent(e) {
    const id = e.target.dataset.id;
    const response = await fetch(`/api/components/${id}/download`);

    if (response.ok) {
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `component_${id}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      alert('Failed to download component.');
    }
  }

  // Live preview logic
  const componentHtmlInput = document.getElementById('componentHtml');
  const livePreviewFrame = document.getElementById('livePreviewFrame');

  function updatePreview(htmlContent) {
    const iframeDoc = livePreviewFrame.contentDocument || livePreviewFrame.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <link rel="stylesheet" href="/css/custom.css">
    </head>
    <body>${htmlContent || '<p class="text-muted">Start typing HTML to see a live preview here...</p>'}</body>
    </html>
  `);
    iframeDoc.close();
  }

  componentHtmlInput.addEventListener('input', () => {
    const htmlContent = componentHtmlInput.value;
    updatePreview(htmlContent);
  });

  updatePreview('');

  // Inject styles
  async function injectCustomStyles() {
    try {
      const response = await fetch('/css/custom.css');
      if (response.ok) {
        const cssText = await response.text();
        const styleTag = document.createElement('style');
        styleTag.innerHTML = cssText;
        document.head.appendChild(styleTag);
      } else {
        console.error('Failed to load custom styles');
      }
    } catch (error) {
      console.error('Error injecting styles:', error);
    }
  }

  injectCustomStyles();

  loadComponents();
});
