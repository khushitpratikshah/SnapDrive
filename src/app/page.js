'use client';

import { useState, useRef, useEffect } from 'react';
import * as htmlToImage from 'html-to-image';
import styles from './page.module.css';

export default function Home() {
  const [file, setFile] = useState(null);
  const [htmlContent, setHtmlContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [scale, setScale] = useState(2);
  const [viewportWidth, setViewportWidth] = useState(1280);
  const [status, setStatus] = useState({ type: '', message: '' });
  
  const iframeRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add(styles.uploadAreaActive);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove(styles.uploadAreaActive);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove(styles.uploadAreaActive);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const uploadedFile = e.dataTransfer.files[0];
      if (uploadedFile.type === 'text/html' || uploadedFile.name.endsWith('.html')) {
        processFile(uploadedFile);
      } else {
        setStatus({ type: 'error', message: 'Please upload a valid .html file' });
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (uploadedFile) => {
    setFile(uploadedFile);
    setStatus({ type: '', message: '' });
    setPreviewUrl(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setHtmlContent(e.target.result);
    };
    reader.readAsText(uploadedFile);
  };

  const handleGenerate = async () => {
    if (!htmlContent || !iframeRef.current) return;
    
    setIsGenerating(true);
    setStatus({ type: '', message: '' });
    
    try {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      
      // Ensure iframe is fully expanded to the content height for full-length capture
      const scrollHeight = Math.max(
        doc.documentElement.scrollHeight,
        doc.body.scrollHeight,
        doc.documentElement.offsetHeight,
        doc.body.offsetHeight
      );
      
      iframe.style.height = `${scrollHeight}px`;
      
      // Small delay to ensure styles and layout are recalculated
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Capture the HTML element itself to get the full background and body
      const node = doc.documentElement;
      
      // Generate image with html-to-image
      const dataUrl = await htmlToImage.toPng(node, {
        pixelRatio: scale,
        backgroundColor: doc.body.style.backgroundColor || '#ffffff',
        width: viewportWidth,
        height: scrollHeight,
        style: {
          margin: '0',
          transform: 'none',
        }
      });
      
      setPreviewUrl(dataUrl);
      setStatus({ type: 'success', message: 'Image generated successfully!' });
    } catch (err) {
      console.error('Generation failed:', err);
      setStatus({ type: 'error', message: 'Failed to generate image. ' + err.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    const link = document.createElement('a');
    link.download = file ? `${file.name.replace('.html', '')}.png` : 'converted.png';
    link.href = previewUrl;
    link.click();
  };

  return (
    <main className={styles.container}>
      <header className={`${styles.header} animate-fade-in`}>
        <h1 className={styles.title}>SnapDrive</h1>
        <p className={styles.subtitle}>
          Transform your HTML files into super high-quality PNG images instantly.
        </p>
      </header>

      <div className={`${styles.mainContent} animate-fade-in`} style={{ animationDelay: '0.1s' }}>
        <div className={`${styles.card} glass-panel`}>
          <div className={styles.cardTitle}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            Upload Document
          </div>
          
          <label 
            className={styles.uploadArea}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              accept=".html,text/html" 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
            />
            <svg className={styles.uploadIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            <div className={styles.uploadText}>
              Drag & drop your HTML file here, or <span className={styles.uploadHighlight}>browse</span>
            </div>
          </label>
          
          {file && (
            <div className={styles.fileName}>
              File selected: {file.name}
            </div>
          )}

          <div className={styles.controlsGroup}>
            <label className={styles.label}>Viewport Width (Layout)</label>
            <select 
              className={styles.select} 
              value={viewportWidth} 
              onChange={(e) => setViewportWidth(Number(e.target.value))}
            >
              <option value="1280">1280px (Desktop)</option>
              <option value="1920">1920px (Widescreen)</option>
              <option value="768">768px (Tablet)</option>
              <option value="375">375px (Mobile)</option>
            </select>
          </div>

          <div className={styles.controlsGroup}>
            <label className={styles.label}>Quality Scale (Multiplier)</label>
            <select 
              className={styles.select} 
              value={scale} 
              onChange={(e) => setScale(Number(e.target.value))}
            >
              <option value="1">1x (Standard)</option>
              <option value="2">2x (High Quality / Retina)</option>
              <option value="3">3x (Super High Quality)</option>
              <option value="4">4x (Ultra Quality - Slower)</option>
            </select>
          </div>

          <button 
            className={styles.button}
            onClick={handleGenerate}
            disabled={!htmlContent || isGenerating}
          >
            {isGenerating ? (
              <>
                <svg className={styles.spinner} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="2" x2="12" y2="6"></line>
                  <line x1="12" y1="18" x2="12" y2="22"></line>
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                  <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                  <line x1="2" y1="12" x2="6" y2="12"></line>
                  <line x1="18" y1="12" x2="22" y2="12"></line>
                  <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                  <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                </svg>
                Processing...
              </>
            ) : (
              'Convert to PNG'
            )}
          </button>
        </div>

        <div className={`${styles.card} glass-panel`}>
          <div className={styles.cardTitle}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            Preview & Download
          </div>

          <div className={styles.previewArea}>
            <div className={styles.previewContainer}>
              {previewUrl ? (
                <img src={previewUrl} alt="Generated Preview" className={styles.previewImage} />
              ) : (
                <div className={styles.previewEmpty}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{opacity: 0.5, marginBottom: '0.5rem'}}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                  Your image preview will appear here
                </div>
              )}
            </div>

            {status.message && (
              <div className={`${styles.statusMessage} ${status.type === 'error' ? styles.statusError : styles.statusSuccess}`}>
                {status.message}
              </div>
            )}

            <button 
              className={styles.button}
              onClick={handleDownload}
              disabled={!previewUrl}
              style={{ background: previewUrl ? 'var(--success)' : undefined }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download PNG
            </button>
          </div>
        </div>
      </div>

      {/* Hidden iframe for perfect HTML rendering and full-length capture */}
      {htmlContent && (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', pointerEvents: 'none', width: `${viewportWidth}px` }}>
          <iframe
            ref={iframeRef}
            srcDoc={htmlContent}
            style={{ 
              width: '100%', 
              border: 'none', 
              background: 'white',
              minHeight: '100vh'
            }}
            onLoad={(e) => {
              const iframe = e.target;
              try {
                const doc = iframe.contentDocument || iframe.contentWindow.document;
                
                // Inject CSS to force full expansion of everything
                // This guarantees the snapshot captures the full length, even if the HTML had scrollbars
                const style = doc.createElement('style');
                style.textContent = `
                  html, body {
                    height: auto !important;
                    min-height: auto !important;
                    max-height: none !important;
                    overflow: visible !important;
                  }
                  /* Try to expand any internal scrollable containers as well */
                  * {
                    overflow-y: visible !important;
                    overflow-x: visible !important;
                  }
                `;
                doc.head.appendChild(style);

                // Pre-expand it roughly to avoid layout recalculation delays later
                setTimeout(() => {
                  const h = Math.max(doc.documentElement.scrollHeight, doc.body.scrollHeight);
                  iframe.style.height = `${h}px`;
                }, 100);
              } catch (err) {
                console.error("Iframe load error", err);
              }
            }}
          />
        </div>
      )}

      <footer className={styles.footer}>
        made by Team PixelDrive, STEM Racing 2026
      </footer>
    </main>
  );
}
