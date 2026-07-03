import { useState } from 'react';

export default function useFolderExpansion() {
  const [expandedFolders, setExpandedFolders] = useState({});

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => ({ 
      ...prev, 
      [folderId]: !prev[folderId] 
    }));
  };

  return {
    expandedFolders,
    toggleFolder
  };
}