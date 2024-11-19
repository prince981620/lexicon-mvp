(function() {
  const createWidget = () => {
    const iframe = document.createElement('iframe');
    
    // Set iframe attributes with zero padding
    iframe.style.position = 'fixed';
    iframe.style.bottom = '0';
    iframe.style.right = '0';
    iframe.style.width = '200px';
    iframe.style.height = '48px';
    iframe.style.border = 'none';
    iframe.style.zIndex = '999999';
    iframe.style.background = 'transparent';
    iframe.style.overflow = 'hidden';
    iframe.style.maxHeight = '100vh';
    
    iframe.setAttribute('allowtransparency', 'true');
    
    const script = document.currentScript;
    const configId = script?.getAttribute('data-config-id') || 'default';
    
    iframe.src = `http://localhost:3000/chat-widget?configId=${configId}`;
    
    document.body.appendChild(iframe);
    
    // Handle iframe resize messages with smooth transitions
    window.addEventListener('message', (event) => {
      if (event.origin !== 'http://localhost:3000') return;
      
      if (event.data.type === 'resize') {
        iframe.style.transition = 'width 0.3s, height 0.3s';
        
        // Ensure the chat stays within viewport
        const maxHeight = window.innerHeight;
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