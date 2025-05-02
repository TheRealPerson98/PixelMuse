import { useState, useEffect } from 'react';

const UpdateNotification = () => {
  const [updateStatus, setUpdateStatus] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    // Skip if electron is not available (e.g., in development)
    if (!window.electron?.updater) return;
    
    // Check for updates on component mount
    window.electron.updater.checkForUpdates();
    
    // Set up listeners for update events
    const removeUpdateAvailable = window.electron.updater.onUpdateAvailable((info) => {
      setUpdateStatus({ type: 'available', version: info.version });
      setIsVisible(true);
    });
    
    const removeUpdateProgress = window.electron.updater.onUpdateProgress((progressInfo) => {
      setUpdateStatus({ type: 'downloading' });
      setProgress(Math.round(progressInfo.percent) || 0);
      setIsVisible(true);
    });
    
    const removeUpdateDownloaded = window.electron.updater.onUpdateDownloaded((info) => {
      setUpdateStatus({ type: 'downloaded', version: info.version });
      setIsVisible(true);
    });
    
    const removeUpdateError = window.electron.updater.onUpdateError((error) => {
      setUpdateStatus({ type: 'error', message: error });
      setIsVisible(true);
    });
    
    // Clean up listeners on unmount
    return () => {
      removeUpdateAvailable && removeUpdateAvailable();
      removeUpdateProgress && removeUpdateProgress();
      removeUpdateDownloaded && removeUpdateDownloaded();
      removeUpdateError && removeUpdateError();
    };
  }, []);
  
  // If no update status or notification is closed, don't render anything
  if (!updateStatus || !isVisible) return null;
  
  const handleRestart = () => {
    window.electron.updater.restartAndInstall();
  };
  
  const handleClose = () => {
    setIsVisible(false);
  };
  
  // Render different UI based on update status
  return (
    <div className="update-notification">
      <button onClick={handleClose} className="close-button" aria-label="Close">
        ×
      </button>
      
      {updateStatus.type === 'available' && (
        <div className="update-available">
          <p>A new version (v{updateStatus.version}) is available!</p>
          <p>Downloading update...</p>
        </div>
      )}
      
      {updateStatus.type === 'downloading' && (
        <div className="update-downloading">
          <p>Downloading update: {progress}%</p>
          <div className="progress-bar">
            <div className="progress" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}
      
      {updateStatus.type === 'downloaded' && (
        <div className="update-downloaded">
          <p>Update downloaded! Restart to apply the new version.</p>
          <button onClick={handleRestart} className="button button-small button-primary">
            Restart Now
          </button>
        </div>
      )}
      
      {updateStatus.type === 'error' && (
        <div className="update-error">
          <p>Error checking for updates: {updateStatus.message}</p>
        </div>
      )}
      
      <style jsx>{`
        .update-notification {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background-color: var(--card-background);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 15px;
          width: 300px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          animation: slide-in 0.3s ease-out;
          position: relative;
        }
        
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        .update-notification p {
          margin: 0 0 10px 0;
          font-size: 14px;
        }
        
        .progress-bar {
          height: 6px;
          background-color: var(--border-color);
          border-radius: 3px;
          overflow: hidden;
          margin-top: 10px;
        }
        
        .progress {
          height: 100%;
          background-color: var(--primary-color);
          transition: width 0.3s ease;
        }
        
        button {
          margin-top: 10px;
        }
        
        .close-button {
          position: absolute;
          top: 5px;
          right: 5px;
          background: transparent;
          border: none;
          font-size: 20px;
          line-height: 1;
          cursor: pointer;
          padding: 5px;
          margin: 0;
          color: var(--text-color);
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        
        .close-button:hover {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default UpdateNotification; 