(function() {
  const createWidget = () => {
    const iframe = document.createElement('iframe');
    
    // Set iframe attributes with margin from edges
    iframe.style.position = 'fixed';
    iframe.style.bottom = '16px';
    iframe.style.right = '16px';
    iframe.style.width = '180px';
    iframe.style.height = '48px';
    iframe.style.border = 'none';
    iframe.style.zIndex = '999999';
    iframe.style.background = 'transparent';
    iframe.style.overflow = 'hidden';
    iframe.style.maxHeight = 'calc(100vh - 32px)';
    iframe.style.pointerEvents = 'none';
    
    iframe.setAttribute('allowtransparency', 'true');
    
    const script = document.currentScript;
    const configId = script?.getAttribute('data-config-id') || 'default';
    
    iframe.src = `http://localhost:3000/chat-widget?configId=${configId}`;
    
    document.body.appendChild(iframe);
    
    iframe.onload = () => {
      iframe.style.pointerEvents = 'auto';
    };
    
    window.addEventListener('message', (event) => {
      if (event.origin !== 'http://localhost:3000') return;
      
      if (event.data.type === 'resize') {
        iframe.style.transition = 'width 0.3s, height 0.3s';
        const maxHeight = window.innerHeight - 32;
        const height = Math.min(event.data.height, maxHeight);
        
        iframe.style.width = `${event.data.width}px`;
        iframe.style.height = `${height}px`;
      }
    });
  };

  if (document.readyState === 'complete') {
    createWidget();
  } else {
    window.addEventListener('load', createWidget);
  }
})(); 