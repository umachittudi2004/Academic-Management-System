import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../state/AuthContext.jsx'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

export default function Home() {
  const { role } = useAuth()
  const [stats, setStats] = useState({ students: 0, faculty: 0, assignments: 0, notices: 0 })

  // ✅ ALL HOOKS MUST BE CALLED FIRST (BEFORE ANY RETURN)
  useEffect(() => {
    const targets = { students: 500, faculty: 50, assignments: 1200, notices: 350 }
    const duration = 2000
    const interval = 50
    const steps = duration / interval

    Object.keys(targets).forEach(key => {
      let current = 0
      const increment = targets[key] / steps
      
      const timer = setInterval(() => {
        current += increment
        if (current >= targets[key]) {
          current = targets[key]
          clearInterval(timer)
        }
        setStats(prev => ({ ...prev, [key]: Math.floor(current) }))
      }, interval)
    })
  }, [])

  // ✅ NOW YOU CAN DO EARLY RETURNS (AFTER ALL HOOKS)
  if (role === 'student') return <Navigate to="/student" replace />
  if (role === 'faculty') return <Navigate to="/faculty" replace />

  const features = [
    {
      icon: '📚',
      title: 'Smart Assignments',
      description: 'Create, submit, and grade assignments seamlessly with automated tracking',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      icon: '📝',
      title: 'Digital Notice Board',
      description: 'Instant notifications for important announcements and updates',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      icon: '✅',
      title: 'Smart Attendance',
      description: 'QR-code based attendance with real-time tracking and reports',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      icon: '💬',
      title: 'Real-time Messaging',
      description: 'Connect with faculty and peers through instant messaging',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    },
    {
      icon: '👥',
      title: 'Group Collaboration',
      description: 'Create study groups with file sharing and @mentions',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    },
    {
      icon: '📅',
      title: 'Smart Timetable',
      description: 'Never miss a class with intelligent schedule management',
      gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
    }
  ]

  const steps = [
    {
      number: '01',
      title: 'Choose Your Role',
      description: 'Login as Student or Faculty with secure authentication',
      icon: '🔐'
    },
    {
      number: '02',
      title: 'Access Dashboard',
      description: 'Get personalized dashboard with all your activities',
      icon: '📊'
    },
    {
      number: '03',
      title: 'Stay Connected',
      description: 'Manage assignments, attendance, and communication in one place',
      icon: '🚀'
    }
  ]

  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          minHeight: '85vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, rgba(108,154,255,0.1) 0%, rgba(142,246,255,0.1) 100%)',
          position: 'relative',
          marginBottom: 80,
          padding: '40px 20px'
        }}
      >
        {/* Animated Background Elements */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: 200,
          height: 200,
          background: 'rgba(108,154,255,0.1)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          animation: 'float 6s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '10%',
          right: '10%',
          width: 300,
          height: 300,
          background: 'rgba(142,246,255,0.1)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          animation: 'float 8s ease-in-out infinite reverse'
        }} />

        <div style={{ 
          maxWidth: 1200, 
          width: '100%',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              display: 'inline-block',
              padding: '8px 20px',
              background: 'rgba(108,154,255,0.15)',
              border: '1px solid rgba(108,154,255,0.3)',
              borderRadius: 50,
              marginBottom: 24,
              fontSize: '0.875rem',
              color: '#93c5fd'
            }}
          >
            ✨ Modern Department Management System
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
              fontWeight: 800,
              marginBottom: 24,
              background: 'linear-gradient(135deg, #ffffff 0%, #93c5fd 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.2
            }}
          >
            Transform Your
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #60a5fa 0%, #8ef6ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Academic Experience
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{
              fontSize: 'clamp(1.1rem, 2vw, 1.35rem)',
              color: 'rgba(255,255,255,0.7)',
              marginBottom: 48,
              maxWidth: 700,
              margin: '0 auto 48px',
              lineHeight: 1.6
            }}
          >
            Streamline assignments, attendance, notices, and communication all in one powerful platform
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{
              display: 'flex',
              gap: 16,
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginBottom: 60
            }}
          >
            <Link 
              to="/login/student"
              className="btn"
              style={{
                padding: '16px 40px',
                fontSize: '1.1rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                boxShadow: '0 8px 24px rgba(102,126,234,0.3)',
                fontWeight: 600,
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(102,126,234,0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(102,126,234,0.3)'
              }}
            >
              🎓 Student Login
            </Link>
            <Link 
              to="/login/faculty"
              className="btn"
              style={{
                padding: '16px 40px',
                fontSize: '1.1rem',
                background: 'rgba(255,255,255,0.05)',
                border: '2px solid rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                fontWeight: 600,
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              👨‍🏫 Faculty Login
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 24,
              maxWidth: 800,
              margin: '0 auto'
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '2.5rem', 
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: 4
              }}>
                {stats.students}+
              </div>
              <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>
                Active Students
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '2.5rem', 
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: 4
              }}>
                {stats.faculty}+
              </div>
              <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>
                Expert Faculty
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '2.5rem', 
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: 4
              }}>
                {stats.assignments}+
              </div>
              <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>
                Assignments Completed
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '2.5rem', 
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: 4
              }}>
                {stats.notices}+
              </div>
              <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>
                Notices Published
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Features Section */}
      <div style={{ maxWidth: 1200, margin: '0 auto 120px', padding: '0 20px' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 60 }}
        >
          <div style={{
            display: 'inline-block',
            padding: '6px 16px',
            background: 'rgba(108,154,255,0.1)',
            border: '1px solid rgba(108,154,255,0.3)',
            borderRadius: 50,
            marginBottom: 16,
            fontSize: '0.875rem',
            color: '#93c5fd'
          }}>
            🎯 Features
          </div>
          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 700,
            marginBottom: 16,
            color: 'rgba(255,255,255,0.95)'
          }}>
            Everything You Need
          </h2>
          <p style={{
            fontSize: '1.125rem',
            color: 'rgba(255,255,255,0.6)',
            maxWidth: 600,
            margin: '0 auto'
          }}>
            Powerful tools to manage your academic life efficiently
          </p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 24
        }}>
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ y: -8 }}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 16,
                padding: 32,
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                e.currentTarget.style.borderColor = 'rgba(108,154,255,0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
              }}
            >
              <div style={{
                width: 60,
                height: 60,
                borderRadius: 12,
                background: feature.gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                marginBottom: 20,
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
              }}>
                {feature.icon}
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                marginBottom: 12,
                color: 'rgba(255,255,255,0.95)'
              }}>
                {feature.title}
              </h3>
              <p style={{
                fontSize: '0.95rem',
                color: 'rgba(255,255,255,0.6)',
                lineHeight: 1.6
              }}>
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* How It Works Section */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(108,154,255,0.05) 0%, rgba(142,246,255,0.05) 100%)',
        padding: '80px 20px',
        marginBottom: 120
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 60 }}
          >
            <div style={{
              display: 'inline-block',
              padding: '6px 16px',
              background: 'rgba(108,154,255,0.1)',
              border: '1px solid rgba(108,154,255,0.3)',
              borderRadius: 50,
              marginBottom: 16,
              fontSize: '0.875rem',
              color: '#93c5fd'
            }}>
              🚀 How It Works
            </div>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 700,
              marginBottom: 16
            }}>
              Get Started in 3 Simple Steps
            </h2>
          </motion.div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 40,
            position: 'relative'
          }}>
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                style={{ textAlign: 'center', position: 'relative' }}
              >
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  fontSize: '2.5rem',
                  boxShadow: '0 12px 32px rgba(102,126,234,0.3)'
                }}>
                  {step.icon}
                </div>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.4)',
                  marginBottom: 12
                }}>
                  STEP {step.number}
                </div>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  marginBottom: 12
                }}>
                  {step.title}
                </h3>
                <p style={{
                  color: 'rgba(255,255,255,0.6)',
                  lineHeight: 1.6
                }}>
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{
          maxWidth: 1000,
          margin: '0 auto 80px',
          padding: 60,
          background: 'linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%)',
          border: '1px solid rgba(102,126,234,0.2)',
          borderRadius: 24,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          background: 'rgba(102,126,234,0.1)',
          borderRadius: '50%',
          filter: 'blur(60px)'
        }} />
        
        <h2 style={{
          fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
          fontWeight: 700,
          marginBottom: 16,
          position: 'relative',
          zIndex: 1
        }}>
          Ready to Get Started?
        </h2>
        <p style={{
          fontSize: '1.125rem',
          color: 'rgba(255,255,255,0.7)',
          marginBottom: 32,
          position: 'relative',
          zIndex: 1
        }}>
          Join hundreds of students and faculty using our platform
        </p>
        <div style={{
          display: 'flex',
          gap: 16,
          justifyContent: 'center',
          flexWrap: 'wrap',
          position: 'relative',
          zIndex: 1
        }}>
          <Link 
            to="/login/student"
            className="btn"
            style={{
              padding: '14px 32px',
              fontSize: '1.05rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              boxShadow: '0 8px 24px rgba(102,126,234,0.3)'
            }}
          >
            Login as Student →
          </Link>
          <Link 
            to="/login/faculty"
            className="btn secondary"
            style={{
              padding: '14px 32px',
              fontSize: '1.05rem'
            }}
          >
            Login as Faculty →
          </Link>
        </div>
      </motion.div>

      {/* Floating Animation Keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  )
}