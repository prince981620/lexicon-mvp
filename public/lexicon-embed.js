(function() {
  const createWidget = () => {
    const iframe = document.createElement('iframe');
    
    // Set iframe attributes
    const styles = {
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      width: '120px',
      height: '32px',
      border: 'none',
      zIndex: '999999',
      background: 'transparent',
      overflow: 'hidden',
      maxHeight: 'calc(100vh - 32px)',
      pointerEvents: 'none',
      margin: '0',
      padding: '0'
    };
    
    // Apply styles
    Object.assign(iframe.style, styles);
    
    iframe.setAttribute('allowtransparency', 'true');
    
    const script = document.currentScript;
    const configId = script?.getAttribute('data-config-id') || 'default';
    
    iframe.src = `http://localhost:3000/chat-widget?configId=${configId}`;
    
    document.body.appendChild(iframe);
    
    iframe.onload = () => {
      iframe.style.pointerEvents = 'auto';
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          const rootStyles = {
            background: 'transparent',
            margin: '0',
            padding: '0'
          };
          
          Object.assign(iframeDoc.documentElement.style, rootStyles);
          Object.assign(iframeDoc.body.style, rootStyles);
        }
      } catch (e) {
        console.warn('Could not access iframe document');
      }
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