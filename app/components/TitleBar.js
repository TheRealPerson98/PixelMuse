import { useState, useEffect } from 'react';

const TitleBar = ({ title }) => {
  const [isMaximized, setIsMaximized] = useState(false);
  
  useEffect(() => {
    // Check if window is maximized on component mount
    const checkMaximized = async () => {
      if (window.electron) {
        const maximized = await window.electron.window.isMaximized();
        setIsMaximized(maximized);
      }
    };
    
    checkMaximized();
    
    // Subscribe to maximize events
    if (window.electron) {
      const unsubscribe = window.electron.window.onMaximizeChange((maximized) => {
        setIsMaximized(maximized);
      });
      
      return unsubscribe;
    }
  }, []);
  
  const handleMinimize = () => {
    if (window.electron) {
      window.electron.window.minimize();
    }
  };
  
  const handleMaximize = () => {
    if (window.electron) {
      window.electron.window.maximize();
    }
  };
  
  const handleClose = () => {
    if (window.electron) {
      window.electron.window.close();
    }
  };
  
  return (
    <div className="title-bar">
      <div className="title-bar-title">{title}</div>
      <div className="window-controls">
        <button 
          className="window-control-button" 
          onClick={handleMinimize}
          title="Minimize"
        >
          <svg width="10" height="1" viewBox="0 0 10 1">
            <path 
              fill="currentColor" 
              d="M0 0h10v1H0z"
            />
          </svg>
        </button>
        <button 
          className="window-control-button" 
          onClick={handleMaximize}
          title={isMaximized ? "Restore" : "Maximize"}
        >
          {isMaximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path 
                fill="currentColor"
                d="M2.1,0v2.1H0v7.9h7.9V7.9H10V0H2.1z M7.9,9H1V3h1.1h4.8H7v5.9H7.9z M9,6.9H8V2.1H3.1V1H9V6.9z"
              />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path 
                fill="currentColor" 
                d="M0 0v10h10V0H0zm9 9H1V1h8v8z" 
              />
            </svg>
          )}
        </button>
        <button 
          className="window-control-button close" 
          onClick={handleClose}
          title="Close"
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path 
              fill="currentColor" 
              d="M10 1.01L6.01 5 10 8.99 8.99 10 5 6.01 1.01 10 0 8.99 3.99 5 0 1.01 1.01 0 5 3.99 8.99 0 10 1.01z" 
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TitleBar; 