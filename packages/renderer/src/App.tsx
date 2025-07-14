import React, { useState, useEffect, useRef } from 'react';
import logo from './lodo.png';
import LoadingSpinner from './LoadingSpinner';
import download from './download.jpg';
import UpdateButton from './UpdateButton';
// define the apis we can use
declare global {
  interface Window {
    electron: {
      selectFolder: () => Promise<string | null>;
      runYtDlp: (url: string, outputFolder: string, fileType: string) => Promise<string>;
      onLog: (callback: (line: string) => void) => void;
      onComplete: (callback: (exitCode: number) => void) => void;
    };
  }
}

export default function App() {
  const [url, setUrl] = useState('');
  const [folder, setFolder] = useState('');
  const [output, setOutput] = useState('');
  const [downloading, setDownloading] = useState(false);

  const [fileType, setFileType] = useState('');
  async function handleDownload() {
    const selected = await window.electron.selectFolder();
    setDownloadProgress('');
    if (selected) setFolder(selected);
    if (!selected) {
      setOutput('No folder selected');
      return;
    }
    if (!url) {
      setOutput('Please enter a URL');
      return;
    }

    console.log('Running yt-dlp with URL:', url, 'and output folder:', folder);
    try {
      setOutput('Downloading...');
      setDownloading(true);
      const result = await window.electron.runYtDlp(url, selected, fileType);
      setDownloading(false);
      setOutput('Download complete:\n' + result);
    } catch (e: any) {
      setDownloading(false);
      setOutput('Error: ' + e);
    }
  }

  const [downloadProgress, setDownloadProgress] = useState('');

  const isProgressLine = (line: string) => {
    return /^\[download\]\s+\d{1,3}%/.test(line.trim());
  };

  useEffect(() => {
    window.electron.onLog((line) => {
      if(line.match('download')) {
        setDownloadProgress(line);
      }
      else {
        setOutput(prev => prev + line); // ✅ always appends to latest output
      }
    });

    window.electron.onComplete((code) => {
      setOutput(prev => `Finished Downloading ${code}, ${prev}`);
    });
  }, []);


  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', paddingTop: '1rem', }}>
      <img src={logo} alt='logo' style={{ width: '60%', padding: '0.5rem', Bottom: '1rem' }}/>
      <div style={{ display: 'flex', flexDirection: 'row', width: '80%', maxWidth: '600px', gap: '1rem', justifyContent: 'center', alignItems: 'center'}}>
        <input
          type="text"
          placeholder="Video URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{height: '20px', width: '100%'}}
        />
        <select
          id="framework"
          value={fileType}
          onChange={(e) => setFileType(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">mkv/webm</option>
          <option value="mp4">mp4</option>
          <option value="mp3">mp3 (audio only)</option>
        </select>
        <UpdateButton onClick={handleDownload} />
      </div>
      {downloading ?
        <LoadingSpinner />
        :
        <>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{output}</pre>  
          <pre style={{ whiteSpace: 'pre-wrap' }}>{downloadProgress}</pre>  
        </>
        
      }
      
    </div>
  );
}

