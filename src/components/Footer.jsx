// // src/components/Footer.js
// import React from "react";
// import { Link } from "react-router-dom";
// import { FaTwitter, FaLinkedin, FaGithub, FaChartLine } from "react-icons/fa";

// const Footer = () => {
//   const currentYear = new Date().getFullYear();

//   return (
//     <footer className="footer" role="contentinfo" aria-label="Website footer">
//       <div className="footer-container">
//         <div className="footer-main">
//           <div className="footer-column footer-about">
//             <Link to="/" className="footer-logo" aria-label="Stock Analyzer Home">
//               <FaChartLine aria-hidden="true" />
//               <span>Stock Analyzer</span>
//             </Link>
//             <p className="footer-description">
//               Your one-stop solution for stock market analysis, news, and
//               data-driven insights.
//             </p>
//           </div>

//           <div className="footer-column">
//             <h3 className="footer-heading">Quick Links</h3>
//             <ul className="footer-links">
//               <li><Link to="/" className="footer-link">Home</Link></li>
//               <li><Link to="/about" className="footer-link">About Us</Link></li>
//               <li><Link to="/watchlist" className="footer-link">Watchlist</Link></li>
//               <li><Link to="/contact" className="footer-link">Contact</Link></li>
//             </ul>
//           </div>

//           <div className="footer-column">
//             <h3 className="footer-heading">Connect With Us</h3>
//             <p className="footer-text">Follow us on social media for updates</p>
//             <div className="social-links">
//               <a
//                 href="https://twitter.com/stockanalyzer"
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 aria-label="Twitter"
//                 className="social-link"
//               >
//                 <FaTwitter aria-hidden="true" />
//               </a>
//               <a
//                 href="https://linkedin.com/company/stockanalyzer"
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 aria-label="LinkedIn"
//                 className="social-link"
//               >
//                 <FaLinkedin aria-hidden="true" />
//               </a>
//               <a
//                 href="https://github.com/stockanalyzer"
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 aria-label="GitHub"
//                 className="social-link"
//               >
//                 <FaGithub aria-hidden="true" />
//               </a>
//             </div>
//           </div>

//           <div className="footer-column">
//             <h3 className="footer-heading">Get In Touch</h3>
//             <ul className="footer-links">
//               <li><a href="mailto:support@stockanalyzer.com" className="footer-link">support@stockanalyzer.com</a></li>
//               <li className="footer-text">123 Stock Street</li>
//               <li className="footer-text">New York, NY 10001</li>
//             </ul>
//           </div>
//         </div>

//         <div className="footer-bottom">
//           <p className="footer-copyright">
//             &copy; {currentYear} Stock Analyzer. All rights reserved.
//           </p>
//           <div className="footer-legal">
//             <Link to="/privacy" className="footer-legal-link">Privacy Policy</Link>
//             <span className="footer-legal-separator">•</span>
//             <Link to="/terms" className="footer-legal-link">Terms of Service</Link>
//           </div>
//         </div>
//       </div>
//     </footer>
//   );
// };

// export default Footer;import React from "react";import React from "react";



// import "./Footer.css";
// import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaArrowRight } from "react-icons/fa";
// import { FaEnvelope } from "react-icons/fa6";
// import { FaChartLine } from "react-icons/fa";


// const Footer = () => {
//   return (
//     <footer className="footer">
//       <div className="container">

//         {/* Column 1 */}
//         <div className="col1">
//           <div className="col-1">
//             <FaChartLine size={50} style={{ color: "white" }} />
//             <p>Stock Analyzer footer text...</p>
//           </div>

//           <p>
//             Follow my instagram channel named <b>mubashar_dev</b> to see more of such projects and posts.
//             Also follow me on Github and LinkedIn. I hope you will like my content.
//           </p>
//         </div>

//         {/* Column 2 */}
//         <div className="col2">
//           <h3>Quick Links</h3>
//           <ul>
//             <li><a href="#">Home</a></li>
//             <li><a href="#">About</a></li>
//             <li><a href="#">Categories</a></li>
//             <li><a href="#">Blog</a></li>
//             <li><a href="#">Contact</a></li>
//             <li><a href="#">Services</a></li>
//           </ul>
//         </div>

//         {/* Column 3 */}
//         <div className="col3">
//           <h3>Services</h3>
//           <ul>
//             <li><a href="#">HTML</a></li>
//             <li><a href="#">CSS</a></li>
//             <li><a href="#">JavaScript</a></li>
//             <li><a href="#">React</a></li>
//             <li><a href="#">Python</a></li>
//             <li><a href="#">C++</a></li>
//           </ul>
//         </div>

//         {/* Column 4 */}
//         <div className="col4">
//           <h3>Newsletter</h3>
//           <form>
//             <FaEnvelope className="icon" />
//             <input type="email" placeholder="Enter your email" required />
//             <button type="submit">
//               <FaArrowRight />
//             </button>
//           </form>
//           <div className="socialIcons">
//             <a href="#"><FaFacebookF /></a>
//             <a href="#"><FaTwitter /></a>
//             <a href="#"><FaInstagram /></a>
//             <a href="#"><FaLinkedinIn /></a>
//           </div>
//         </div>
//       </div>

//       <div className="footer2">
//         <p>© 2025 | Made with ❤️ by Mubashar Dev. All Rights Reserved.</p>
//       </div>
//     </footer>
//   );
// };

// export default Footer;

// src/components/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";
import { FaTwitter, FaLinkedin, FaGithub, FaChartLine } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import "./Footer.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer" role="contentinfo" aria-label="Website footer">
      <div className="footer-container">
        <div className="footer-main">

          {/* Column 1: Logo + About */}
          <div className="footer-column footer-about">
            <Link to="/" className="footer-logo" aria-label="Stock Analyzer Home">
              <FaChartLine size={28} aria-hidden="true" />
              <span>Stock Analyzer</span>
            </Link>
            <p className="footer-description">
              Your one-stop solution for stock market analysis, news, and
              data-driven insights.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="footer-column">
            <h3 className="footer-heading">Quick Links</h3>
            <ul className="footer-links">
              <li><Link to="/" className="footer-link">Home</Link></li>
              <li><Link to="/about" className="footer-link">About</Link></li>
              <li><Link to="/watchlist" className="footer-link">Watchlist</Link></li>
              <li><Link to="/contact" className="footer-link">Contact</Link></li>
            </ul>
          </div>

          {/* Column 3: Social */}
          <div className="footer-column">
            <h3 className="footer-heading">Connect With Us</h3>
            <p className="footer-text">Follow us for updates:</p>
            <div className="social-links">
              <a
                href="https://twitter.com/stockanalyzer"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="social-link"
              >
                <FaXTwitter aria-hidden="true" />
              </a>
              <a
                href="https://linkedin.com/company/stockanalyzer"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="social-link"
              >
                <FaLinkedin aria-hidden="true" />
              </a>
              <a
                href="https://github.com/stockanalyzer"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="social-link"
              >
                <FaGithub aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Column 4: Contact Info */}
          <div className="footer-column">
            <h3 className="footer-heading">Get In Touch</h3>
            <ul className="footer-links">
              <li>
                <a href="mailto:support@stockanalyzer.com" className="footer-link">
                  support@stockanalyzer.com
                </a>
              </li>
              <li className="footer-text">123 Stock Street</li>
              <li className="footer-text">New York, NY 10001</li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            &copy; {currentYear} Stock Analyzer. All rights reserved.
          </p>
          <div className="footer-legal">
            <Link to="/privacy" className="footer-legal-link">Privacy Policy</Link>
            <span className="footer-legal-separator">•</span>
            <Link to="/terms" className="footer-legal-link">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
