import React from 'react';
import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>EbookAI - AI-Powered Ebook Generation Platform</title>
        <meta name="description" content="Create complete, publishable books with AI assistance. Mystery and self-help genres with market analytics and professional formatting." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)',
        fontFamily: 'Arial, sans-serif'
      }}>
        {/* Header */}
        <header style={{ 
          backgroundColor: 'white', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '0'
        }}>
          <div style={{ 
            maxWidth: '1200px', 
            margin: '0 auto', 
            padding: '0 20px'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '24px 0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <h1 style={{ 
                  fontSize: '32px', 
                  fontWeight: 'bold', 
                  color: '#111827',
                  margin: '0'
                }}>
                  EbookAI
                </h1>
                <span style={{ 
                  marginLeft: '8px', 
                  padding: '4px 8px', 
                  fontSize: '12px', 
                  fontWeight: 'bold', 
                  color: '#065f46', 
                  backgroundColor: '#d1fae5', 
                  borderRadius: '9999px'
                }}>
                  LIVE
                </span>
              </div>
              <nav style={{ display: 'flex', gap: '32px' }}>
                <a href="#features" style={{ 
                  color: '#6b7280', 
                  textDecoration: 'none',
                  fontWeight: '500'
                }}>
                  Features
                </a>
                <a href="#pricing" style={{ 
                  color: '#6b7280', 
                  textDecoration: 'none',
                  fontWeight: '500'
                }}>
                  Pricing
                </a>
                <a href="#about" style={{ 
                  color: '#6b7280', 
                  textDecoration: 'none',
                  fontWeight: '500'
                }}>
                  About
                </a>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '48px 20px',
          textAlign: 'center'
        }}>
          <h2 style={{ 
            fontSize: '48px', 
            fontWeight: 'bold', 
            color: '#111827', 
            marginBottom: '24px',
            lineHeight: '1.1'
          }}>
            Create Complete Books with
            <span style={{ color: '#2563eb' }}> AI Assistance</span>
          </h2>
          
          <p style={{ 
            fontSize: '20px', 
            color: '#6b7280', 
            marginBottom: '32px', 
            maxWidth: '800px', 
            margin: '0 auto 32px auto',
            lineHeight: '1.6'
          }}>
            Generate publishable mystery and self-help books with advanced AI, market analytics, 
            and professional formatting. From idea to bestseller in days, not months.
          </p>
          
          {/* CTA Buttons */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '16px', 
            justifyContent: 'center', 
            marginBottom: '48px',
            alignItems: 'center'
          }}>
            <button style={{ 
              backgroundColor: '#2563eb', 
              color: 'white', 
              padding: '12px 32px', 
              borderRadius: '8px', 
              fontWeight: 'bold',
              border: 'none',
              fontSize: '16px',
              cursor: 'pointer',
              minWidth: '200px'
            }}>
              Start Writing Now
            </button>
            <button style={{ 
              border: '1px solid #d1d5db', 
              color: '#374151', 
              padding: '12px 32px', 
              borderRadius: '8px', 
              fontWeight: 'bold',
              backgroundColor: 'white',
              fontSize: '16px',
              cursor: 'pointer',
              minWidth: '200px'
            }}>
              Watch Demo
            </button>
          </div>

          {/* Status Dashboard */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)', 
            padding: '32px', 
            maxWidth: '900px', 
            margin: '0 auto'
          }}>
            <h3 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: '#111827', 
              marginBottom: '32px'
            }}>
              Platform Status
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '32px'
            }}>
              {/* AI Engine Status */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  width: '64px', 
                  height: '64px', 
                  backgroundColor: '#dcfce7', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  margin: '0 auto 12px auto'
                }}>
                  <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    backgroundColor: '#10b981', 
                    borderRadius: '50%'
                  }}></div>
                </div>
                <h4 style={{ 
                  fontWeight: 'bold', 
                  color: '#111827',
                  margin: '0 0 8px 0'
                }}>
                  AI Engine
                </h4>
                <p style={{ 
                  color: '#059669', 
                  fontWeight: 'bold',
                  margin: '0 0 4px 0'
                }}>
                  Operational
                </p>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#6b7280',
                  margin: '0'
                }}>
                  Claude AI Integration Active
                </p>
              </div>

              {/* Book Generation */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  width: '64px', 
                  height: '64px', 
                  backgroundColor: '#dbeafe', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  margin: '0 auto 12px auto'
                }}>
                  <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    backgroundColor: '#3b82f6', 
                    borderRadius: '50%'
                  }}></div>
                </div>
                <h4 style={{ 
                  fontWeight: 'bold', 
                  color: '#111827',
                  margin: '0 0 8px 0'
                }}>
                  Book Generation
                </h4>
                <p style={{ 
                  color: '#2563eb', 
                  fontWeight: 'bold',
                  margin: '0 0 4px 0'
                }}>
                  Ready
                </p>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#6b7280',
                  margin: '0'
                }}>
                  75K-150K words per book
                </p>
              </div>

              {/* Market Analytics */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  width: '64px', 
                  height: '64px', 
                  backgroundColor: '#f3e8ff', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  margin: '0 auto 12px auto'
                }}>
                  <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    backgroundColor: '#8b5cf6', 
                    borderRadius: '50%'
                  }}></div>
                </div>
                <h4 style={{ 
                  fontWeight: 'bold', 
                  color: '#111827',
                  margin: '0 0 8px 0'
                }}>
                  Market Analytics
                </h4>
                <p style={{ 
                  color: '#7c3aed', 
                  fontWeight: 'bold',
                  margin: '0 0 4px 0'
                }}>
                  Live Data
                </p>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#6b7280',
                  margin: '0'
                }}>
                  Real-time bestseller tracking
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div style={{ 
              marginTop: '32px', 
              paddingTop: '24px', 
              borderTop: '1px solid #e5e7eb'
            }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                gap: '16px', 
                textAlign: 'center'
              }}>
                <div>
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: 'bold', 
                    color: '#111827'
                  }}>
                    24/7
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#6b7280'
                  }}>
                    AI Availability
                  </div>
                </div>
                <div>
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: 'bold', 
                    color: '#111827'
                  }}>
                    3-5 Days
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#6b7280'
                  }}>
                    Book Completion
                  </div>
                </div>
                <div>
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: 'bold', 
                    color: '#111827'
                  }}>
                    EPUB/PDF
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#6b7280'
                  }}>
                    Export Formats
                  </div>
                </div>
                <div>
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: 'bold', 
                    color: '#111827'
                  }}>
                    99.9%
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#6b7280'
                  }}>
                    Uptime
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer style={{ 
          backgroundColor: '#111827', 
          color: 'white', 
          padding: '32px 0', 
          marginTop: '64px',
          textAlign: 'center'
        }}>
          <div style={{ 
            maxWidth: '1200px', 
            margin: '0 auto', 
            padding: '0 20px'
          }}>
            <p style={{ 
              color: '#9ca3af',
              margin: '0 0 8px 0'
            }}>
              © 2024 EbookAI Platform. Powered by Claude AI and advanced humanization technology.
            </p>
            <p style={{ 
              fontSize: '14px', 
              color: '#6b7280',
              margin: '0'
            }}>
              🚀 Successfully deployed on Netlify | Status: OPERATIONAL
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}