'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LendiHomepage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [activeTab, setActiveTab] = useState('achievements');

  const carouselImages = [
    "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1470&auto=format&fit=cover",
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1470&auto=format&fit=cover",
    "https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1486&auto=format&fit=cover"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [carouselImages.length]);

  const toggleDropdown = (index) => {
    if (activeDropdown === index) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(index);
    }
  };

  const departments = [
    { name: "Computer Science & Engineering", code: "CSE", img: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=600&auto=format&fit=cover", desc: "Focused on algorithms, software engineering, AI, cyber security and cloud systems." },
    { name: "Electronics & Communication Engineering", code: "ECE", img: "https://images.unsplash.com/photo-1631553127989-130097f48006?q=80&w=600&auto=format&fit=cover", desc: "Designing hardware systems, VLSI, microprocessors and modern telecom networks." },
    { name: "Electrical & Electronics Engineering", code: "EEE", img: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=600&auto=format&fit=cover", desc: "Focuses on microgrids, electrical machine designs, EV systems and power controls." },
    { name: "Mechanical Engineering", code: "MECH", img: "https://images.unsplash.com/photo-1537462715879-360eeb61a0bc?q=80&w=600&auto=format&fit=cover", desc: "Provides expertise in thermodynamics, manufacturing technology, CAD/CAM and robotics." },
    { name: "Computer Science & Systems Engineering", code: "CSSE", img: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&auto=format&fit=cover", desc: "Integrating hardware design with modern software operating systems." },
    { name: "Computer Science & Information Technology", code: "CSIT", img: "https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?q=80&w=600&auto=format&fit=cover", desc: "Covers data analytics, information security, database management and web tech." },
    { name: "CSE (AI & Machine Learning)", code: "CSE-AIML", img: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=600&auto=format&fit=cover", desc: "Specialized path for artificial intelligence, machine learning and neural networks." },
    { name: "Science & Humanities", code: "S&H", img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=cover", desc: "Nurturing fundamental principles of physics, chemistry, mathematics and english communication." }
  ];

  const amenities = [
    { title: "Central Library", icon: "fa-book-open", desc: "Established in June 2008, the Central Library offers an ambience extremely conducive for assimilation and creation of new knowledge with a vast repository of books, journals and digital resources." },
    { title: "Counselling Club", icon: "fa-handshake-angle", desc: "Dedicated mentoring to help students unconditionally accept, approve, admire, appreciate, and love their own person, ensuring mental well-being and growth." },
    { title: "Hostel Facilities", icon: "fa-hotel", desc: "Equipped with good infrastructure and hygienic environment. Clean, nutritious food and safe water supply are consistently maintained." },
    { title: "Spacious Canteen", icon: "fa-utensils", desc: "Conveniently accommodates 200 students at a time. Serving high-quality, delicious food with strict hygiene standards." },
    { title: "Transport System", icon: "fa-bus", desc: "A robust fleet of buses covering major routes across Vizag and Vizianagaram to ensure flexible and safe commuting." },
    { title: "Sports & Games", icon: "fa-volleyball", desc: "Equal emphasis on sports and games. Promotes team spirit, physical development, relaxation, and competitive leadership qualities." }
  ];

  const leadersQuotes = [
    { quote: "One leading Technology can change your life.", author: "Dr Venkata Subbaiah garu", role: "Vice Chancellor, JNTU-GV" },
    { quote: "Wisdom and attitude will only win targets.", author: "Dr. B V R Mohan Reddy garu", role: "Chairman, Cyient" },
    { quote: "Lendi success is the collective efforts of Students and Faculty.", author: "Dr. Bhiswajeet Chouby garu", role: "Chief Construction Engineer, DRDO" },
    { quote: "Education at Lendi is a knowledge hub.", author: "Dr.Karuna Raju, IAS", role: "CVO, RINL, Vizag" },
    { quote: "Infrastructure and Amenities are gracious in Lendi.", author: "Sri Vimal Kumar Varun", role: "Scientist F & Head, Ministry of Science & Technology" }
  ];

  return (
    <>
      <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      
      <style>{`
        .hp-wrapper {
          background-color: #ffffff;
          color: #1e293b;
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          overflow-x: hidden;
          width: 100%;
        }

        .hp-wrapper h1, 
        .hp-wrapper h2, 
        .hp-wrapper h3, 
        .hp-wrapper h4, 
        .hp-wrapper h5, 
        .hp-wrapper h6 {
          font-family: 'Poppins', sans-serif;
          font-weight: 700;
          color: #0d2340;
        }

        /* ── TOP HEADER ── */
        .hp-top-header {
          background-color: #ffffff;
          padding: 12px 24px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 15px;
        }

        .hp-logo-container {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .hp-crest-icon {
          background-color: #0d2340;
          border-radius: 50%;
          width: 65px;
          height: 65px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          flex-shrink: 0;
        }

        .hp-brand-text {
          line-height: 1.1;
        }

        .hp-main-title {
          font-size: 26px;
          font-weight: 800;
          color: #d9232d;
          letter-spacing: -0.5px;
          display: flex;
          align-items: center;
        }

        .hp-main-title span {
          color: #f59e0b;
          position: relative;
        }

        .hp-main-title span::after {
          content: '➔';
          position: absolute;
          font-size: 13px;
          top: -2px;
          right: -14px;
          color: #f59e0b;
        }

        .hp-sub-title {
          font-size: 13px;
          font-weight: 600;
          color: #0d2340;
          margin-top: 2px;
        }

        .hp-accreditations {
          font-size: 10.5px;
          color: #64748b;
          font-weight: 500;
          margin-top: 3px;
        }

        .hp-header-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
        }

        .hp-badges-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .hp-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .hp-badge-danger { background-color: #ef4444; color: white; }
        .hp-badge-dark { background-color: #1e293b; color: white; }
        .hp-badge-primary { background-color: #3b82f6; color: white; }
        .hp-badge-secondary { background-color: #64748b; color: white; }

        .hp-contact-row {
          font-size: 12px;
          font-weight: 600;
          color: #0d2340;
          display: flex;
          gap: 15px;
        }

        .hp-contact-row a {
          color: #d9232d;
          text-decoration: none;
        }

        /* ── NAVBAR ── */
        .hp-navbar {
          background-color: #0d2340;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          position: sticky;
          top: 0;
          z-index: 1000;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .hp-nav-list {
          display: flex;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .hp-nav-item {
          position: relative;
        }

        .hp-nav-link {
          color: #ffffff;
          font-size: 13px;
          font-weight: 600;
          padding: 18px 14px;
          display: block;
          text-decoration: none;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .hp-nav-link:hover, .hp-nav-item.active .hp-nav-link {
          color: #f59e0b;
          background-color: rgba(255,255,255,0.05);
        }

        /* Dropdown menus */
        .hp-dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          background-color: #0d2340;
          box-shadow: 0 8px 16px rgba(0,0,0,0.15);
          min-width: 220px;
          border-radius: 0 0 6px 6px;
          padding: 8px 0;
          display: none;
        }

        .hp-nav-item:hover .hp-dropdown-menu {
          display: block;
        }

        .hp-dropdown-item {
          color: #ffffff;
          font-size: 12.5px;
          font-weight: 500;
          padding: 10px 20px;
          display: block;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .hp-dropdown-item:hover {
          background-color: rgba(255,255,255,0.08);
          color: #f59e0b;
        }

        /* College Login Button */
        .hp-outpass-btn {
          background-color: #f59e0b;
          color: #0d2340 !important;
          font-weight: 700 !important;
          padding: 10px 18px;
          border-radius: 4px;
          text-decoration: none;
          font-size: 12px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 10px rgba(245, 158, 11, 0.3);
          text-transform: uppercase;
          border: 1px solid #f59e0b;
          transition: all 0.3s ease;
        }

        .hp-outpass-btn:hover {
          background-color: transparent !important;
          color: #f59e0b !important;
          box-shadow: none;
        }

        .hp-menu-toggle {
          display: none;
          background: none;
          border: none;
          color: #ffffff;
          font-size: 22px;
          cursor: pointer;
          padding: 15px 0;
        }

        /* ── HERO BANNER & OUTPASS WIDGET ── */
        .hp-hero {
          position: relative;
          height: 520px;
          background-color: #000000;
          overflow: hidden;
        }

        .hp-slider-container {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .hp-slide {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.8s ease-in-out;
          background-size: cover;
          background-position: center;
        }

        .hp-slide.active {
          opacity: 0.7;
        }

        .hp-floating-card {
          position: absolute;
          top: 50px;
          right: 50px;
          z-index: 10;
          width: 380px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-top: 4px solid #f59e0b;
          border-radius: 8px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          padding: 24px;
        }

        .hp-floating-card h4 {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #0d2340;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .hp-floating-card p {
          font-size: 13px;
          color: #64748b;
          line-height: 1.5;
          margin-bottom: 20px;
        }

        .hp-card-login-btn {
          background-color: #0d2340;
          color: #ffffff;
          font-weight: 700;
          padding: 12px;
          border-radius: 6px;
          width: 100%;
          display: block;
          text-align: center;
          text-decoration: none;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(13, 35, 64, 0.2);
          border: none;
        }

        .hp-card-login-btn:hover {
          background-color: #d9232d;
          transform: translateY(-1px);
        }

        .hp-card-quick-links {
          margin-top: 15px;
          border-top: 1px solid #e2e8f0;
          padding-top: 12px;
          display: flex;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
        }

        .hp-card-quick-links a {
          color: #d9232d;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .hp-card-quick-links a:hover {
          color: #0d2340;
        }

        /* ── WELCOME & VISION/MISSION ── */
        .hp-section-welcome {
          padding: 60px 24px;
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 40px;
        }

        .hp-welcome-text h2 {
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 20px;
          position: relative;
        }

        .hp-welcome-text h2::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: -8px;
          width: 60px;
          height: 3px;
          background: linear-gradient(90deg, #d9232d 50%, #f59e0b 50%);
        }

        .hp-welcome-text p {
          font-size: 14.5px;
          line-height: 1.8;
          color: #334155;
          margin-bottom: 16px;
        }

        .hp-vm-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .hp-vm-card {
          padding: 24px;
          border-radius: 8px;
          color: #ffffff;
        }

        .hp-vm-card.vision {
          background-color: #0d2340;
        }

        .hp-vm-card.mission {
          background-color: #f59e0b;
          color: #0d2340;
        }

        .hp-vm-card h4 {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: inherit;
        }

        .hp-vm-card p {
          font-size: 13.5px;
          line-height: 1.6;
          margin: 0;
        }

        /* ── CORE VALUES ── */
        .hp-section-c3 {
          background-color: #f8fafc;
          padding: 60px 24px;
          text-align: center;
        }

        .hp-section-title {
          margin-bottom: 40px;
          text-align: center;
        }

        .hp-section-title h2 {
          font-size: 30px;
          font-weight: 800;
          position: relative;
          display: inline-block;
          padding-bottom: 12px;
        }

        .hp-section-title h2::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 80px;
          height: 3px;
          background: linear-gradient(90deg, #d9232d 50%, #f59e0b 50%);
        }

        .hp-c3-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .hp-c3-card {
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.04);
          padding: 35px 24px;
          transition: all 0.3s ease;
          border-top: 4px solid #0d2340;
          text-align: left;
        }

        .hp-c3-card.yellow {
          border-top-color: #f59e0b;
        }

        .hp-c3-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.08);
        }

        .hp-c3-icon {
          width: 55px;
          height: 55px;
          border-radius: 50%;
          background-color: rgba(13, 35, 64, 0.05);
          color: #0d2340;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          margin-bottom: 20px;
        }

        .hp-c3-card.yellow .hp-c3-icon {
          background-color: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }

        .hp-c3-card h4 {
          font-size: 19px;
          margin-bottom: 12px;
        }

        .hp-c3-card p {
          font-size: 13.5px;
          color: #64748b;
          line-height: 1.7;
          margin: 0;
        }

        /* ── ACADEMIC PROGRAMS ── */
        .hp-section-depts {
          padding: 60px 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .hp-dept-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          margin-top: 30px;
        }

        .hp-dept-card {
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          background-color: #ffffff;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .hp-dept-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        }

        .hp-dept-image {
          height: 150px;
          background-size: cover;
          background-position: center;
          position: relative;
        }

        .hp-dept-label {
          position: absolute;
          bottom: 12px;
          left: 12px;
          background-color: #f59e0b;
          color: #0d2340;
          font-weight: 700;
          font-size: 10px;
          padding: 4px 8px;
          border-radius: 3px;
        }

        .hp-dept-info {
          padding: 18px;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
        }

        .hp-dept-info h4 {
          font-size: 14.5px;
          margin-bottom: 8px;
          line-height: 1.4;
        }

        .hp-dept-info p {
          font-size: 12.5px;
          color: #64748b;
          line-height: 1.5;
          margin: 0;
          flex-grow: 1;
        }

        /* ── AMENITIES SECTION ── */
        .hp-section-amenities {
          background-color: #f8fafc;
          padding: 60px 24px;
        }

        .hp-amenities-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          max-width: 1200px;
          margin: 30px auto 0;
        }

        .hp-amenity-card {
          background-color: #ffffff;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.03);
          border-left: 4px solid #0d2340;
          transition: all 0.3s ease;
        }

        .hp-amenity-card:hover {
          border-left-color: #f59e0b;
          transform: translateX(4px);
        }

        .hp-amenity-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .hp-amenity-header i {
          font-size: 20px;
          color: #d9232d;
        }

        .hp-amenity-header h5 {
          font-size: 16px;
          margin: 0;
        }

        .hp-amenity-card p {
          font-size: 13px;
          color: #64748b;
          line-height: 1.6;
          margin: 0;
        }

        /* ── INTERACTIVE INFO TABS (ACHIEVEMENTS / FDPS) ── */
        .hp-section-tabs {
          padding: 60px 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .hp-tabs-header {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-bottom: 30px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 10px;
        }

        .hp-tab-btn {
          background: none;
          border: none;
          font-family: 'Poppins', sans-serif;
          font-weight: 700;
          font-size: 16px;
          color: #64748b;
          padding: 10px 20px;
          cursor: pointer;
          position: relative;
          transition: color 0.2s ease;
        }

        .hp-tab-btn.active {
          color: #0d2340;
        }

        .hp-tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -11px;
          left: 0;
          right: 0;
          height: 3px;
          background-color: #f59e0b;
        }

        .hp-tab-content {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        .hp-tab-item {
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          display: flex;
          gap: 16px;
        }

        .hp-tab-item-icon {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          background-color: rgba(217, 35, 45, 0.08);
          color: #d9232d;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        .hp-tab-item-info h5 {
          font-size: 15px;
          margin-bottom: 6px;
          color: #0d2340;
        }

        .hp-tab-item-info p {
          font-size: 13px;
          color: #64748b;
          line-height: 1.5;
          margin: 0;
        }

        /* ── LEADER QUOTES SLIDER / GRID ── */
        .hp-section-quotes {
          background-color: #0d2340;
          color: #ffffff;
          padding: 60px 24px;
        }

        .hp-quotes-title {
          text-align: center;
          margin-bottom: 40px;
        }

        .hp-quotes-title h2 {
          color: #ffffff;
          font-size: 30px;
          font-weight: 800;
          position: relative;
          display: inline-block;
          padding-bottom: 12px;
        }

        .hp-quotes-title h2::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 80px;
          height: 3px;
          background: linear-gradient(90deg, #d9232d 50%, #f59e0b 50%);
        }

        .hp-quotes-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .hp-quote-card {
          background-color: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .hp-quote-card i {
          font-size: 24px;
          color: #f59e0b;
          margin-bottom: 15px;
        }

        .hp-quote-text {
          font-size: 13.5px;
          line-height: 1.6;
          color: #e2e8f0;
          font-style: italic;
          margin-bottom: 20px;
        }

        .hp-quote-author {
          border-top: 1px solid rgba(255,255,255,0.1);
          padding-top: 12px;
        }

        .hp-quote-author h6 {
          color: #f59e0b;
          font-size: 14px;
          margin: 0;
        }

        .hp-quote-author p {
          color: #94a3b8;
          font-size: 11px;
          margin: 2px 0 0 0;
          text-transform: uppercase;
        }

        /* ── PLACEMENT STATISTICS ── */
        .hp-section-placements {
          background-color: #071526;
          color: #ffffff;
          padding: 60px 24px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }

        .hp-placements-grid {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 0.8fr 1.2fr;
          align-items: center;
          gap: 40px;
        }

        .hp-place-intro h2 {
          color: #ffffff;
          font-size: 30px;
          margin-bottom: 4px;
        }

        .hp-place-intro h4 {
          color: #f59e0b;
          font-size: 18px;
          margin-bottom: 15px;
        }

        .hp-place-intro p {
          font-size: 13px;
          color: #cbd5e1;
        }

        .hp-stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
        }

        .hp-stat-item {
          text-align: center;
          border-right: 1px solid rgba(255,255,255,0.1);
          padding: 10px 0;
        }

        .hp-stat-item:last-child {
          border-right: none;
        }

        .hp-stat-item h3 {
          font-size: 36px;
          font-weight: 800;
          color: #f59e0b;
          margin-bottom: 4px;
        }

        .hp-stat-item p {
          font-size: 11.5px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          margin: 0;
        }

        /* Partners marquee */
        .hp-marquee-container {
          max-width: 1200px;
          margin: 40px auto 0;
          border-top: 1px solid rgba(255,255,255,0.1);
          padding-top: 30px;
          text-align: center;
        }

        .hp-marquee-container h5 {
          font-size: 13px;
          color: #94a3b8;
          text-transform: uppercase;
          margin-bottom: 20px;
          letter-spacing: 1px;
        }

        .hp-marquee {
          display: flex;
          overflow: hidden;
          gap: 40px;
        }

        .hp-marquee-inner {
          display: flex;
          gap: 50px;
          animation: hp-marquee-scroll 25s linear infinite;
        }

        .hp-marquee-inner span {
          color: #ffffff;
          font-size: 17px;
          font-weight: 700;
          font-family: 'Poppins', sans-serif;
          letter-spacing: 1px;
          opacity: 0.6;
          white-space: nowrap;
        }

        @keyframes hp-marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        /* ── FOOTER ── */
        .hp-footer {
          background-color: #050d18;
          color: #94a3b8;
          padding: 60px 24px 20px;
          font-size: 13.5px;
        }

        .hp-footer-grid {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.2fr 0.9fr 1fr 0.9fr;
          gap: 40px;
        }

        .hp-footer-col h5 {
          color: #ffffff;
          font-size: 15px;
          margin-bottom: 20px;
          position: relative;
          padding-bottom: 8px;
        }

        .hp-footer-col h5::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 30px;
          height: 2px;
          background-color: #f59e0b;
        }

        .hp-footer-col p {
          line-height: 1.6;
          margin-bottom: 16px;
        }

        .hp-socials {
          display: flex;
          gap: 10px;
        }

        .hp-socials a {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background-color: rgba(255,255,255,0.05);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .hp-socials a:hover {
          background-color: #f59e0b;
          color: #071526;
        }

        .hp-footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .hp-footer-links li {
          margin-bottom: 10px;
        }

        .hp-footer-links a {
          color: #94a3b8;
          text-decoration: none;
          transition: all 0.2s ease;
          font-size: 12.5px;
        }

        .hp-footer-links a:hover {
          color: #f59e0b;
          padding-left: 4px;
        }

        .hp-visitor-box {
          background-color: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.05);
          padding: 15px;
          border-radius: 6px;
          display: inline-block;
        }

        .hp-visitor-title {
          font-size: 10px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
          text-align: center;
        }

        .hp-digits {
          display: flex;
          gap: 4px;
        }

        .hp-digits span {
          background-color: #0d2340;
          color: #f59e0b;
          font-family: monospace;
          font-size: 16px;
          font-weight: 800;
          padding: 4px 6px;
          border-radius: 3px;
        }

        .hp-digits span.red-digit {
          color: #ef4444;
        }

        .hp-footer-bottom {
          max-width: 1200px;
          margin: 40px auto 0;
          border-top: 1px solid rgba(255,255,255,0.05);
          padding-top: 20px;
          display: flex;
          justify-content: space-between;
          font-size: 12.5px;
          color: #64748b;
          flex-wrap: wrap;
          gap: 15px;
        }

        .hp-footer-bottom a {
          color: #64748b;
          text-decoration: none;
          margin-left: 15px;
        }

        .hp-footer-bottom a:hover {
          color: #f59e0b;
        }

        /* ── RESPONSIVE MEDIA QUERIES ── */
        @media (max-width: 1024px) {
          .hp-section-welcome {
            grid-template-columns: 1fr;
          }
          .hp-c3-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .hp-dept-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .hp-amenities-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .hp-tab-content {
            grid-template-columns: 1fr;
          }
          .hp-quotes-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .hp-placements-grid {
            grid-template-columns: 1fr;
          }
          .hp-footer-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 768px) {
          .hp-top-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .hp-header-right {
            align-items: flex-start;
            width: 100%;
          }
          .hp-navbar {
            padding: 0 15px;
            flex-wrap: wrap;
          }
          .hp-menu-toggle {
            display: block;
          }
          .hp-nav-list {
            display: ${mobileMenuOpen ? 'flex' : 'none'};
            flex-direction: column;
            width: 100%;
            border-top: 1px solid rgba(255,255,255,0.1);
            padding-bottom: 15px;
          }
          .hp-nav-link {
            padding: 12px 5px;
          }
          .hp-dropdown-menu {
            position: static;
            display: none;
            box-shadow: none;
            padding-left: 15px;
            background-color: rgba(0,0,0,0.1);
          }
          .hp-nav-item.dropdown-active .hp-dropdown-menu {
            display: block;
          }
          .hp-floating-card {
            position: relative;
            top: 0;
            right: 0;
            width: 100%;
            margin: 20px 0;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          }
          .hp-c3-grid {
            grid-template-columns: 1fr;
          }
          .hp-dept-grid {
            grid-template-columns: 1fr;
          }
          .hp-amenities-grid {
            grid-template-columns: 1fr;
          }
          .hp-quotes-grid {
            grid-template-columns: 1fr;
          }
          .hp-stats-row {
            grid-template-columns: repeat(2, 1fr);
          }
          .hp-footer-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="hp-wrapper">
        {/* ── TOP HEADER ── */}
        <div className="hp-top-header">
          <div className="hp-logo-container">
            <div className="hp-crest-icon">
              <i className="fa-solid fa-graduation-cap" style={{color: '#ffffff', fontSize: '28px'}}></i>
            </div>
            <div className="hp-brand-text">
              <div className="hp-main-title">lend<span>i</span></div>
              <div className="hp-sub-title">Institute of Engineering & Technology</div>
              <div className="hp-accreditations">AN AUTONOMOUS INSTITUTION &bull; Accredited by NBA &amp; NAAC with 'A' Grade</div>
            </div>
          </div>
          <div className="hp-header-right">
            <div className="hp-badges-row">
              <span className="hp-badge hp-badge-danger">CET CODE: LIET</span>
              <span className="hp-badge hp-badge-dark">NAAC 'A' GRADE</span>
              <span className="hp-badge hp-badge-primary">NBA ACCREDITED</span>
              <span className="hp-badge hp-badge-secondary">NIRF 2026</span>
            </div>
            <div className="hp-contact-row">
              <span><i className="fa-solid fa-phone me-1"></i> Admissions: <a href="tel:9490344747">+91 9490344747</a></span>
              <span><i className="fa-solid fa-headset me-1"></i> <a href="https://lendi.edu.in/contact-us" target="_blank" rel="noreferrer">Support</a></span>
            </div>
          </div>
        </div>

        {/* ── NAVBAR ── */}
        <nav className="hp-navbar">
          <button className="hp-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <i className={mobileMenuOpen ? "fa-solid fa-xmark" : "fa-solid fa-bars"}></i>
          </button>
          
          <ul className="hp-nav-list">
            <li className="hp-nav-item active"><a className="hp-nav-link" href="#"><i className="fa-solid fa-house me-1"></i> Home</a></li>
          </ul>

          <Link href="/login" className="hp-outpass-btn">
            <i className="fa-solid fa-ticket-simple"></i> College Login
          </Link>
        </nav>

        {/* ── HERO BANNER & COLLEGE LOGIN WIDGET ── */}
        <section className="hp-hero">
          <div className="hp-slider-container">
            {carouselImages.map((imgUrl, index) => (
              <div 
                key={index} 
                className={`hp-slide ${index === currentSlide ? 'active' : ''}`}
                style={{ backgroundImage: `url(${imgUrl})` }}
              />
            ))}
          </div>

          <div className="hp-floating-card">
            <h4><i className="fa-solid fa-ticket-simple text-warning"></i>College Portal</h4>
            <p>
              Access student dashboard, attendance logs, and digital outpass management systems.
            </p>
            
            <Link href="/login" className="hp-card-login-btn">
              <i className="fa-solid fa-arrow-right-to-bracket me-2"></i>College Login
            </Link>
            
            <div className="hp-card-quick-links">
              <a href="https://lendi.edu.in" target="_blank" rel="noreferrer"><i className="fa-solid fa-globe"></i> Visit Official Lendi Website</a>
            </div>
          </div>
        </section>

        {/* ── WELCOME & VISION/MISSION ── */}
        <section className="hp-section-welcome">
          <div className="hp-welcome-text">
            <h2>Welcome to Lendi</h2>
            <p className="mt-3">
              Lendi Institute of Engineering &amp; Technology, a premier Autonomous institution, was established by a divine body of committed intelligentsia of Visakhapatnam to cater to the needs of young graduates of technology. It is situated in a serene atmosphere having a divine touch of Lendi beside NH-43, Jonnada, Denkada Mandal.
            </p>
            <p>
              Accredited by NBA (Tier-1) for major courses, NAAC with 'A' Grade, and permanently affiliated to JNTU-GV, Lendi is dedicated to nurturing technical talent with a global outlook and moral values. We combine academic rigour, research excellence, and state-of-the-art infrastructure to build successful careers.
            </p>
            <a href="https://lendi.edu.in/about-us" target="_blank" rel="noreferrer" className="btn btn-outline-primary px-4 py-2 mt-2" style={{color: '#0d2340', borderColor: '#0d2340', fontWeight: '600'}}>Know More About Lendi</a>
          </div>
          <div className="hp-vm-container">
            <div className="hp-vm-card vision">
              <h4><i className="fa-solid fa-eye"></i> Our Vision</h4>
              <p>Producing globally competent and quality technocrats with human values for the holistic needs of industry and society.</p>
            </div>
            <div className="hp-vm-card mission">
              <h4><i className="fa-solid fa-bullseye"></i> Our Mission</h4>
              <p>Creating an outstanding infrastructure and platform for enhancement of skills, knowledge, and behaviour of students towards employment and higher studies.</p>
            </div>
          </div>
        </section>

        {/* ── CORE VALUES ── */}
        <section className="hp-section-c3">
          <div className="hp-section-title">
            <h2>Our Core Values</h2>
          </div>
          <div className="hp-c3-grid">
            <div className="hp-c3-card">
              <div className="hp-c3-icon"><i className="fa-solid fa-heart-pulse"></i></div>
              <h4>Care</h4>
              <p>At Lendi Institute of Engineering and Technology, we prioritize holistic development by fostering a culture of care and support for our students. Through personalized mentoring, active listening, and dedicated guidance, we create a nurturing environment that empowers students to excel academically and grow personally.</p>
            </div>
            <div className="hp-c3-card yellow">
              <div className="hp-c3-icon"><i className="fa-solid fa-users"></i></div>
              <h4>Character</h4>
              <p>We believe that education is incomplete without the cultivation of strong character. Our institution is committed to instilling values such as integrity, responsibility, empathy, and resilience in our students. Through community engagement, we empower students to lead with purpose.</p>
            </div>
            <div className="hp-c3-card">
              <div className="hp-c3-icon"><i className="fa-solid fa-briefcase"></i></div>
              <h4>Career</h4>
              <p>We are dedicated to shaping the careers of our students through industry-aligned education and robust training programs. Our comprehensive approach combines academic excellence, hands-on learning, and professional skill development to bridge the gap between education and employment.</p>
            </div>
          </div>
        </section>

        {/* ── B.TECH ACADEMIC PROGRAMS ── */}
        <section className="hp-section-depts">
          <div className="hp-section-title">
            <h2>B.Tech Academic Programs</h2>
          </div>
          <div className="hp-dept-grid">
            {departments.map((dept) => (
              <div key={dept.code} className="hp-dept-card">
                <div className="hp-dept-image" style={{backgroundImage: `url('${dept.img}')`}}>
                  <div className="hp-dept-label">UG PROGRAM</div>
                </div>
                <div className="hp-dept-info">
                  <h4>{dept.name}</h4>
                  <p>{dept.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── AMENITIES SECTION ── */}
        <section className="hp-section-amenities">
          <div className="hp-section-title">
            <h2>Campus Amenities</h2>
          </div>
          <div className="hp-amenities-grid">
            {amenities.map((amenity, idx) => (
              <div key={idx} className="hp-amenity-card">
                <div className="hp-amenity-header">
                  <i className={`fa-solid ${amenity.icon}`}></i>
                  <h5>{amenity.title}</h5>
                </div>
                <p>{amenity.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── INTERACTIVE INFO TABS (ACHIEVEMENTS / FDPS) ── */}
        <section className="hp-section-tabs">
          <div className="hp-tabs-header">
            <button 
              className={`hp-tab-btn ${activeTab === 'achievements' ? 'active' : ''}`}
              onClick={() => setActiveTab('achievements')}
            >
              Major Achievements
            </button>
            <button 
              className={`hp-tab-btn ${activeTab === 'fdps' ? 'active' : ''}`}
              onClick={() => setActiveTab('fdps')}
            >
              FDPs & Conference Events
            </button>
          </div>

          {activeTab === 'achievements' ? (
            <div className="hp-tab-content">
              <div className="hp-tab-item">
                <div className="hp-tab-item-icon"><i className="fa-solid fa-trophy"></i></div>
                <div className="hp-tab-item-info">
                  <h5>Smart India Hackathon 1st Prize</h5>
                  <p>Lendi CSE Students bagged the prestigious 1st Prize for their software prototype solution in the national Smart India Hackathon.</p>
                </div>
              </div>

              <div className="hp-tab-item">
                <div className="hp-tab-item-icon"><i className="fa-solid fa-medal"></i></div>
                <div className="hp-tab-item-info">
                  <h5>AP Electrothon 3rd Place</h5>
                  <p>Lendi ECE &amp; EEE students secured 3rd Place in the State Level AP-Electrothon for their prototype "Road Management with Accident Prudential &amp; Aid".</p>
                </div>
              </div>

              <div className="hp-tab-item">
                <div className="hp-tab-item-icon"><i className="fa-solid fa-award"></i></div>
                <div className="hp-tab-item-info">
                  <h5>NPTEL Best Local Chapter (A Grade)</h5>
                  <p>Lendi was certified with 'A' Grade in NPTEL Local Chapter and placed among the Top 50 Colleges nationally.</p>
                </div>
              </div>

              <div className="hp-tab-item">
                <div className="hp-tab-item-icon"><i className="fa-solid fa-graduation-cap"></i></div>
                <div className="hp-tab-item-info">
                  <h5>University Gold Medal</h5>
                  <p>Mr. P.V.N Varma received the JNTU Kakinada Gold Medal during the 5th Convocation for academic excellence.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="hp-tab-content">
              <div className="hp-tab-item">
                <div className="hp-tab-item-icon"><i className="fa-solid fa-calendar-check"></i></div>
                <div className="hp-tab-item-info">
                  <h5>International FDP on Microgrids &amp; EVs</h5>
                  <p>1-Week Faculty Development Program focusing on Microgrid stability, EV chargers and smart integration systems.</p>
                </div>
              </div>

              <div className="hp-tab-item">
                <div className="hp-tab-item-icon"><i className="fa-solid fa-users-line"></i></div>
                <div className="hp-tab-item-info">
                  <h5>Ist International Conference (AISC)</h5>
                  <p>International Conference on Artificial Intelligence, Security and Communications highlighting emerging trends.</p>
                </div>
              </div>

              <div className="hp-tab-item">
                <div className="hp-tab-item-icon"><i className="fa-solid fa-chalkboard-user"></i></div>
                <div className="hp-tab-item-info">
                  <h5>12-Day FDP on ML for Signal Processing</h5>
                  <p>Sponsored hands-on training program exploring neural networks and machine learning models for voice and signal analysis.</p>
                </div>
              </div>

              <div className="hp-tab-item">
                <div className="hp-tab-item-icon"><i className="fa-solid fa-flask-vial"></i></div>
                <div className="hp-tab-item-info">
                  <h5>Virtual Labs &amp; Tools Workshop</h5>
                  <p>FDP organized by Mechanical Department introducing cloud-based simulation software and virtual laboratory structures.</p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── LEADER QUOTES SECTION ── */}
        <section className="hp-section-quotes">
          <div className="hp-quotes-title">
            <h2>What Leaders Say About Lendi</h2>
          </div>
          <div className="hp-quotes-grid">
            {leadersQuotes.slice(0, 3).map((q, idx) => (
              <div key={idx} className="hp-quote-card">
                <i className="fa-solid fa-quote-left"></i>
                <div className="hp-quote-text">"{q.quote}"</div>
                <div className="hp-quote-author">
                  <h6>{q.author}</h6>
                  <p>{q.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── PLACEMENT STATISTICS ── */}
        <section className="hp-section-placements">
          <div className="hp-placements-grid">
            <div className="hp-place-intro">
              <h2>Placements</h2>
              <h4>At a Glance</h4>
              <p>Lendi Placement Cell provides extensive training and recruits students into top tech conglomerates.</p>
            </div>
            <div className="hp-stats-row">
              <div className="hp-stat-item">
                <h3>3165+</h3>
                <p>Placements</p>
              </div>
              <div className="hp-stat-item">
                <h3>4.5 L</h3>
                <p>Average CTC</p>
              </div>
              <div className="hp-stat-item">
                <h3>18.0 L</h3>
                <p>Highest CTC</p>
              </div>
              <div className="hp-stat-item">
                <h3>19k+</h3>
                <p>Internships</p>
              </div>
            </div>
          </div>

          <div className="hp-marquee-container">
            <h5>Our Premium Recruitment Partners</h5>
            <div className="hp-marquee">
              <div className="hp-marquee-inner">
                <span>INFOSYS</span>
                <span>TCS</span>
                <span>COGNIZANT</span>
                <span>HCL</span>
                <span>DELOITTE</span>
                <span>WIPRO</span>
                <span>CYIENT</span>
                <span>NTT DATA</span>
                <span>VEM TECHNOLOGIES</span>
                <span>APOLLO TYRES</span>
                {/* Duplicate for infinite marquee */}
                <span>INFOSYS</span>
                <span>TCS</span>
                <span>COGNIZANT</span>
                <span>HCL</span>
                <span>DELOITTE</span>
                <span>WIPRO</span>
                <span>CYIENT</span>
                <span>NTT DATA</span>
                <span>VEM TECHNOLOGIES</span>
                <span>APOLLO TYRES</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="hp-footer">
          <div className="hp-footer-grid">
            <div className="hp-footer-col">
              <h5>About Lendi</h5>
              <p>
                Established in 2008, Lendi Institute of Engineering &amp; Technology offers quality technical education. Our campus is equipped with highly qualified faculty, advanced labs, and an incubation center to promote research and innovations.
              </p>
              <div className="hp-socials">
                <a href="#"><i className="fa-brands fa-facebook-f"></i></a>
                <a href="#"><i className="fa-brands fa-twitter"></i></a>
                <a href="#"><i className="fa-brands fa-linkedin-in"></i></a>
                <a href="#"><i className="fa-brands fa-youtube"></i></a>
              </div>
            </div>

            <div className="hp-footer-col">
              <h5>Downloads &amp; Disclosures</h5>
              <ul className="hp-footer-links">
                <li><a href="https://lendi.edu.in/assets/lendi_hr_policy_manual_2022.pdf" target="_blank" rel="noreferrer"><i className="fa-solid fa-file-pdf me-2"></i>HR Policy Manual</a></li>
                <li><a href="https://lendi.edu.in//cloud/2025/12/20/1766225060_AICTE%20Aprrovals%20upto%202025-26.pdf" target="_blank" rel="noreferrer"><i className="fa-solid fa-file-pdf me-2"></i>AICTE Approvals</a></li>
                <li><a href="https://lendi.edu.in//cloud/2026/04/02/1775105865_NIRF%202026.pdf" target="_blank" rel="noreferrer"><i className="fa-solid fa-file-pdf me-2"></i>NIRF Data 2026-27</a></li>
                <li><a href="https://lendi.edu.in//cloud/2025/03/04/1741094268_1740933225_1.%20AUTONOMOUS-UGC.pdf" target="_blank" rel="noreferrer"><i className="fa-solid fa-file-pdf me-2"></i>Autonomous UGC approval</a></li>
              </ul>
            </div>

            <div className="hp-footer-col">
              <h5>Contact Info</h5>
              <p><i className="fa-solid fa-location-dot me-2 text-warning"></i> Vizag - Vizianagaram Road, Jonnada, Denkada Mandal, Pincode: 535005.</p>
              <p><i className="fa-solid fa-phone me-2 text-warning"></i> +91 9490344747, 9490304747</p>
              <p><i className="fa-solid fa-envelope me-2 text-warning"></i> info@lendi.edu.in</p>
            </div>

            <div className="hp-footer-col">
              <h5>Portal Visitor</h5>
              <div className="hp-visitor-box">
                <div className="hp-visitor-title">Visitor Count</div>
                <div className="hp-digits">
                  <span>0</span>
                  <span>4</span>
                  <span>8</span>
                  <span>2</span>
                  <span>3</span>
                  <span className="red-digit">9</span>
                </div>
              </div>
            </div>
          </div>

          <div className="hp-footer-bottom">
            <div>&copy; 2026 Lendi Institute of Engineering &amp; Technology. All rights reserved.</div>
            <div>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms &amp; Conditions</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
