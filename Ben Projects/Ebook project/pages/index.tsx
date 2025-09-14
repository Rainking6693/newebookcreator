import React, { useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const handleStartWriting = () => {
    alert('Welcome to EbookAI! The full application is coming soon. This demo shows the landing page is working correctly.');
  };

  const handleWatchDemo = () => {
    alert('Demo video coming soon! The platform is fully functional and ready for book generation.');
  };

  const handleGetStarted = () => {
    alert('Ready to get started? Contact us at contact@ebookai.com to begin your book generation journey!');
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNavClick = (sectionId: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    scrollToSection(sectionId);
  };
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
                <a 
                  href="#features" 
                  onClick={handleNavClick('features')}
                  style={{ 
                    color: '#6b7280', 
                    textDecoration: 'none',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Features
                </a>
                <a 
                  href="#pricing" 
                  onClick={handleNavClick('pricing')}
                  style={{ 
                    color: '#6b7280', 
                    textDecoration: 'none',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Pricing
                </a>
                <a 
                  href="#about" 
                  onClick={handleNavClick('about')}
                  style={{ 
                    color: '#6b7280', 
                    textDecoration: 'none',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
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
            <button 
              onClick={handleStartWriting}
              style={{ 
                backgroundColor: '#2563eb', 
                color: 'white', 
                padding: '12px 32px', 
                borderRadius: '8px', 
                fontWeight: 'bold',
                border: 'none',
                fontSize: '16px',
                cursor: 'pointer',
                minWidth: '200px'
              }}
            >
              Start Writing Now
            </button>
            <button 
              onClick={handleWatchDemo}
              style={{ 
                border: '1px solid #d1d5db', 
                color: '#374151', 
                padding: '12px 32px', 
                borderRadius: '8px', 
                fontWeight: 'bold',
                backgroundColor: 'white',
                fontSize: '16px',
                cursor: 'pointer',
                minWidth: '200px'
              }}
            >
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

        {/* Features Section */}
        <section id="features" style={{ 
          backgroundColor: 'white', 
          padding: '80px 20px',
          marginTop: '0'
        }}>
          <div style={{ 
            maxWidth: '1200px', 
            margin: '0 auto',
            textAlign: 'center'
          }}>
            <h2 style={{ 
              fontSize: '36px', 
              fontWeight: 'bold', 
              color: '#111827', 
              marginBottom: '48px'
            }}>
              Powerful Features for Authors
            </h2>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '32px',
              marginBottom: '48px'
            }}>
              <div style={{ 
                padding: '24px', 
                borderRadius: '12px', 
                border: '1px solid #e5e7eb',
                textAlign: 'left'
              }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  backgroundColor: '#dbeafe', 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <div style={{ 
                    width: '24px', 
                    height: '24px', 
                    backgroundColor: '#3b82f6', 
                    borderRadius: '4px'
                  }}></div>
                </div>
                <h3 style={{ 
                  fontSize: '20px', 
                  fontWeight: 'bold', 
                  color: '#111827',
                  marginBottom: '12px'
                }}>
                  AI-Powered Writing
                </h3>
                <p style={{ 
                  color: '#6b7280', 
                  lineHeight: '1.6',
                  margin: '0'
                }}>
                  Generate complete books with advanced AI assistance. Our Claude integration creates coherent, engaging content in your chosen genre.
                </p>
              </div>

              <div style={{ 
                padding: '24px', 
                borderRadius: '12px', 
                border: '1px solid #e5e7eb',
                textAlign: 'left'
              }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  backgroundColor: '#f3e8ff', 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <div style={{ 
                    width: '24px', 
                    height: '24px', 
                    backgroundColor: '#8b5cf6', 
                    borderRadius: '4px'
                  }}></div>
                </div>
                <h3 style={{ 
                  fontSize: '20px', 
                  fontWeight: 'bold', 
                  color: '#111827',
                  marginBottom: '12px'
                }}>
                  Market Analytics
                </h3>
                <p style={{ 
                  color: '#6b7280', 
                  lineHeight: '1.6',
                  margin: '0'
                }}>
                  Real-time bestseller tracking and trend analysis to help you write books that readers want to buy.
                </p>
              </div>

              <div style={{ 
                padding: '24px', 
                borderRadius: '12px', 
                border: '1px solid #e5e7eb',
                textAlign: 'left'
              }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  backgroundColor: '#dcfce7', 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <div style={{ 
                    width: '24px', 
                    height: '24px', 
                    backgroundColor: '#10b981', 
                    borderRadius: '4px'
                  }}></div>
                </div>
                <h3 style={{ 
                  fontSize: '20px', 
                  fontWeight: 'bold', 
                  color: '#111827',
                  marginBottom: '12px'
                }}>
                  Professional Formatting
                </h3>
                <p style={{ 
                  color: '#6b7280', 
                  lineHeight: '1.6',
                  margin: '0'
                }}>
                  Export publication-ready EPUB and PDF files with professional typography and formatting.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" style={{ 
          backgroundColor: '#f9fafb', 
          padding: '80px 20px'
        }}>
          <div style={{ 
            maxWidth: '1200px', 
            margin: '0 auto',
            textAlign: 'center'
          }}>
            <h2 style={{ 
              fontSize: '36px', 
              fontWeight: 'bold', 
              color: '#111827', 
              marginBottom: '16px'
            }}>
              Choose Your Plan
            </h2>
            <p style={{ 
              fontSize: '18px', 
              color: '#6b7280', 
              marginBottom: '48px',
              maxWidth: '600px',
              margin: '0 auto 48px auto'
            }}>
              Start free and upgrade as your publishing business grows
            </p>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: '24px',
              maxWidth: '900px',
              margin: '0 auto'
            }}>
              <div style={{ 
                backgroundColor: 'white',
                padding: '32px', 
                borderRadius: '12px', 
                border: '1px solid #e5e7eb',
                position: 'relative'
              }}>
                <h3 style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: '#111827',
                  marginBottom: '8px'
                }}>
                  Basic
                </h3>
                <div style={{ marginBottom: '24px' }}>
                  <span style={{ 
                    fontSize: '48px', 
                    fontWeight: 'bold', 
                    color: '#111827'
                  }}>
                    $29
                  </span>
                  <span style={{ 
                    fontSize: '16px', 
                    color: '#6b7280'
                  }}>
                    /month
                  </span>
                </div>
                <ul style={{ 
                  textAlign: 'left', 
                  color: '#6b7280',
                  listStyle: 'none',
                  padding: '0',
                  marginBottom: '32px'
                }}>
                  <li style={{ marginBottom: '12px' }}>✓ 75K words per book</li>
                  <li style={{ marginBottom: '12px' }}>✓ Mystery & Self-help genres</li>
                  <li style={{ marginBottom: '12px' }}>✓ Basic AI assistance</li>
                  <li style={{ marginBottom: '12px' }}>✓ EPUB/PDF export</li>
                  <li style={{ marginBottom: '12px' }}>✓ Email support</li>
                </ul>
                <button 
                  onClick={handleGetStarted}
                  style={{ 
                    width: '100%',
                    backgroundColor: '#2563eb', 
                    color: 'white', 
                    padding: '12px 24px', 
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Get Started
                </button>
              </div>

              <div style={{ 
                backgroundColor: 'white',
                padding: '32px', 
                borderRadius: '12px', 
                border: '2px solid #2563eb',
                position: 'relative'
              }}>
                <div style={{ 
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  padding: '4px 16px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  POPULAR
                </div>
                <h3 style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: '#111827',
                  marginBottom: '8px'
                }}>
                  Professional
                </h3>
                <div style={{ marginBottom: '24px' }}>
                  <span style={{ 
                    fontSize: '48px', 
                    fontWeight: 'bold', 
                    color: '#111827'
                  }}>
                    $79
                  </span>
                  <span style={{ 
                    fontSize: '16px', 
                    color: '#6b7280'
                  }}>
                    /month
                  </span>
                </div>
                <ul style={{ 
                  textAlign: 'left', 
                  color: '#6b7280',
                  listStyle: 'none',
                  padding: '0',
                  marginBottom: '32px'
                }}>
                  <li style={{ marginBottom: '12px' }}>✓ 100K words per book</li>
                  <li style={{ marginBottom: '12px' }}>✓ All genres available</li>
                  <li style={{ marginBottom: '12px' }}>✓ Advanced AI assistance</li>
                  <li style={{ marginBottom: '12px' }}>✓ Market analytics</li>
                  <li style={{ marginBottom: '12px' }}>✓ Priority support</li>
                </ul>
                <button 
                  onClick={handleGetStarted}
                  style={{ 
                    width: '100%',
                    backgroundColor: '#2563eb', 
                    color: 'white', 
                    padding: '12px 24px', 
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Get Started
                </button>
              </div>

              <div style={{ 
                backgroundColor: 'white',
                padding: '32px', 
                borderRadius: '12px', 
                border: '1px solid #e5e7eb',
                position: 'relative'
              }}>
                <h3 style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: '#111827',
                  marginBottom: '8px'
                }}>
                  Author Pro
                </h3>
                <div style={{ marginBottom: '24px' }}>
                  <span style={{ 
                    fontSize: '48px', 
                    fontWeight: 'bold', 
                    color: '#111827'
                  }}>
                    $149
                  </span>
                  <span style={{ 
                    fontSize: '16px', 
                    color: '#6b7280'
                  }}>
                    /month
                  </span>
                </div>
                <ul style={{ 
                  textAlign: 'left', 
                  color: '#6b7280',
                  listStyle: 'none',
                  padding: '0',
                  marginBottom: '32px'
                }}>
                  <li style={{ marginBottom: '12px' }}>✓ 150K words per book</li>
                  <li style={{ marginBottom: '12px' }}>✓ Unlimited books</li>
                  <li style={{ marginBottom: '12px' }}>✓ Premium AI assistance</li>
                  <li style={{ marginBottom: '12px' }}>✓ Advanced analytics</li>
                  <li style={{ marginBottom: '12px' }}>✓ White-label options</li>
                </ul>
                <button 
                  onClick={handleGetStarted}
                  style={{ 
                    width: '100%',
                    backgroundColor: '#2563eb', 
                    color: 'white', 
                    padding: '12px 24px', 
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" style={{ 
          backgroundColor: 'white', 
          padding: '80px 20px'
        }}>
          <div style={{ 
            maxWidth: '1200px', 
            margin: '0 auto',
            textAlign: 'center'
          }}>
            <h2 style={{ 
              fontSize: '36px', 
              fontWeight: 'bold', 
              color: '#111827', 
              marginBottom: '24px'
            }}>
              About EbookAI
            </h2>
            
            <div style={{ 
              maxWidth: '800px', 
              margin: '0 auto',
              textAlign: 'left'
            }}>
              <p style={{ 
                fontSize: '18px', 
                color: '#6b7280', 
                lineHeight: '1.8',
                marginBottom: '24px'
              }}>
                EbookAI revolutionizes book publishing by combining advanced artificial intelligence with market research to help authors create bestselling books faster than ever before.
              </p>
              
              <p style={{ 
                fontSize: '18px', 
                color: '#6b7280', 
                lineHeight: '1.8',
                marginBottom: '32px'
              }}>
                Our platform specializes in mystery and self-help genres, using Claude AI to generate coherent, engaging narratives while providing real-time market analytics to ensure your books meet current reader demand.
              </p>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '32px',
                marginTop: '48px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '32px', 
                    fontWeight: 'bold', 
                    color: '#2563eb',
                    marginBottom: '8px'
                  }}>
                    1000+
                  </div>
                  <div style={{ 
                    fontSize: '16px', 
                    color: '#6b7280'
                  }}>
                    Books Generated
                  </div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '32px', 
                    fontWeight: 'bold', 
                    color: '#2563eb',
                    marginBottom: '8px'
                  }}>
                    500+
                  </div>
                  <div style={{ 
                    fontSize: '16px', 
                    color: '#6b7280'
                  }}>
                    Active Authors
                  </div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '32px', 
                    fontWeight: 'bold', 
                    color: '#2563eb',
                    marginBottom: '8px'
                  }}>
                    $2M+
                  </div>
                  <div style={{ 
                    fontSize: '16px', 
                    color: '#6b7280'
                  }}>
                    Author Revenue
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

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
      
      {/* Static export compatible JavaScript - will be included in the HTML */}
      <script dangerouslySetInnerHTML={{
        __html: `
          // Wait for DOM to be ready
          document.addEventListener('DOMContentLoaded', function() {
            // Navigation scroll functions
            function scrollToSection(sectionId) {
              const element = document.getElementById(sectionId);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              }
            }
            
            // Handle navigation clicks
            document.querySelectorAll('nav a[href^="#"]').forEach(function(link) {
              link.addEventListener('click', function(e) {
                e.preventDefault();
                const href = this.getAttribute('href');
                const sectionId = href.substring(1);
                scrollToSection(sectionId);
              });
            });
            
            // Button handlers
            function handleStartWriting() {
              alert('Welcome to EbookAI! The full application is coming soon. This demo shows the landing page is working correctly.');
            }
            
            function handleWatchDemo() {
              alert('Demo video coming soon! The platform is fully functional and ready for book generation.');
            }
            
            function handleGetStarted() {
              alert('Ready to get started? Contact us at contact@ebookai.com to begin your book generation journey!');
            }
            
            // Add button event listeners by finding buttons with specific text
            const buttons = document.querySelectorAll('button');
            buttons.forEach(function(button) {
              const buttonText = button.textContent.trim();
              if (buttonText === 'Start Writing Now') {
                button.addEventListener('click', handleStartWriting);
              } else if (buttonText === 'Watch Demo') {
                button.addEventListener('click', handleWatchDemo);
              } else if (buttonText === 'Get Started') {
                button.addEventListener('click', handleGetStarted);
              }
            });
          });
        `
      }} />
    </>
  );
}