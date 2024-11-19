(function() {
  // Create and inject iframe
  const createWidget = () => {
    // Create iframe element
    const iframe = document.createElement('iframe');
    
    // Set iframe attributes
    iframe.style.position = 'fixed';
    iframe.style.bottom = '0';
    iframe.style.right = '0';
    iframe.style.width = '500px'; // Max width of the widget
    iframe.style.height = '800px'; // Max height of the widget
    iframe.style.border = 'none';
    iframe.style.zIndex = '999999';
    iframe.style.background = 'transparent';
    
    // Allow iframe to be transparent
    iframe.setAttribute('allowtransparency', 'true');
    
    // Get configId from script tag if provided
    const script = document.currentScript;
    const configId = script?.getAttribute('data-config-id') || 'default';
    
    // Set iframe source with configId
    iframe.src = `http://localhost:3000/chat-widget?configId=${configId}`;
    
    // Append iframe to body
    document.body.appendChild(iframe);
    
    // Handle iframe resize messages
    window.addEventListener('message', (event) => {
      if (event.origin !== 'http://localhost:3000') return;
      
      if (event.data.type === 'resize') {
        iframe.style.width = event.data.width + 'px';
        iframe.style.height = event.data.height + 'px';
      }
    });
  };

  // Create widget when DOM is ready
  if (document.readyState === 'complete') {
    createWidget();
  } else {
    window.addEventListener('load', createWidget);
  }
})(); 