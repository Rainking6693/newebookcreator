import React, { useState } from 'react';
import Head from 'next/head';

// Interactive dashboard with working functionality
export default function Home() {
  const [apiStatus, setApiStatus] = useState<string>('Unknown');
  const [testCount, setTestCount] = useState(0);
  
  const testApiConnection = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setApiStatus(`✅ Connected: ${data.status}`);
    } catch (error) {
      setApiStatus(`❌ Failed: ${error}`);
    }
  };
  
  const incrementCounter = () => {
    setTestCount(prev => prev + 1);
  };
  return (
    <>
      <Head>
        <title>EbookAI - AI-Powered Book Generation Platform</title>
        <meta name="description" content="Professional AI-powered book generation with market analytics and publishing tools." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        {/* Header */}
        <header style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e2e8f0',
          padding: '1rem 2rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#1e293b',
              margin: 0
            }}>
              📚 EbookAI Platform
            </h1>
            <div style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center'
            }}>
              <button
                onClick={testApiConnection}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  marginRight: '0.5rem'
                }}
              >
                Test API
              </button>
              <button
                onClick={incrementCounter}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                Counter: {testCount}
              </button>
            </div>
          </div>
        </header>

        {/* Main Dashboard */}
        <main style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '2rem'
        }}>
          {/* Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#64748b', fontSize: '0.875rem' }}>Total Books</h3>
              <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>12</p>
              <p style={{ margin: '0.5rem 0 0 0', color: '#10b981', fontSize: '0.875rem' }}>↗ +3 this month</p>
            </div>
            
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#64748b', fontSize: '0.875rem' }}>Words Generated</h3>
              <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>847K</p>
              <p style={{ margin: '0.5rem 0 0 0', color: '#10b981', fontSize: '0.875rem' }}>↗ +156K this month</p>
            </div>
            
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#64748b', fontSize: '0.875rem' }}>Revenue</h3>
              <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>$4,247</p>
              <p style={{ margin: '0.5rem 0 0 0', color: '#10b981', fontSize: '0.875rem' }}>↗ +18% from last month</p>
            </div>
            
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#64748b', fontSize: '0.875rem' }}>API Status</h3>
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold', color: apiStatus.includes('✅') ? '#10b981' : apiStatus.includes('❌') ? '#ef4444' : '#64748b' }}>
                {apiStatus}
              </p>
              <p style={{ margin: '0.5rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>Click "Test API" to check</p>
            </div>
          </div>

          {/* Recent Books */}
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
            marginBottom: '2rem'
          }}>
            <h2 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>Recent Books</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                border: '1px solid #e2e8f0',
                borderRadius: '0.375rem'
              }}>
                <div>
                  <h3 style={{ margin: '0 0 0.25rem 0', color: '#1e293b' }}>The Mystery of Digital Hearts</h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>Mystery • 87,234 words • In Progress</p>
                </div>
                <button style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}>
                  Continue Writing
                </button>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                border: '1px solid #e2e8f0',
                borderRadius: '0.375rem'
              }}>
                <div>
                  <h3 style={{ margin: '0 0 0.25rem 0', color: '#1e293b' }}>Productivity Mastery Guide</h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>Self-Help • 64,891 words • Completed</p>
                </div>
                <button style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}>
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <h2 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>Quick Actions</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <button style={{
                padding: '1.5rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                textAlign: 'left'
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>✨</div>
                <div>Start New Book</div>
                <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Generate with AI</div>
              </button>
              
              <button style={{
                padding: '1.5rem',
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                textAlign: 'left'
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📊</div>
                <div>Market Research</div>
                <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Analyze trends</div>
              </button>
              
              <button style={{
                padding: '1.5rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                textAlign: 'left'
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚙️</div>
                <div>Settings</div>
                <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Configure preferences</div>
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}